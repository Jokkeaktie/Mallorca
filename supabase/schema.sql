-- Mallorca familiekalender – database-skema
--
-- Kør denne fil i Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- for at oprette de nødvendige tabeller og sikkerhedsregler.
--
-- Sikkerhedsmodel:
-- Al adgang til disse tabeller sker udelukkende via Next.js server-side
-- API-ruter, som bruger Supabase "service role"-nøglen. Den nøgle bor kun
-- i miljøvariabler på serveren og bliver aldrig sendt til browseren.
-- Row Level Security er slået til på begge tabeller, men der er bevidst
-- IKKE oprettet nogen policies for "anon" eller "authenticated" roller.
-- Det betyder, at selvom nogen skulle finde på at bruge det offentlige
-- anon-API-nøgle direkte mod databasen, vil PostgREST afvise alle
-- forespørgsler (default deny). Service role-nøglen omgår RLS by design
-- og er den eneste vej ind.

create extension if not exists "pgcrypto";

-- Kalenderposter (ønsker og godkendte bookinger)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  status text not null check (status in ('request', 'approved')),
  color text not null check (color ~* '^#[0-9a-f]{6}$'),
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  arrival_time time without time zone,
  departure_time time without time zone,
  flight_number text,
  internal_comment text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tilføjer feltet, hvis tabellen allerede fandtes fra en tidligere version
-- af skemaet (denne fil er sikker at køre igen).
alter table public.bookings add column if not exists flight_number text;

-- BEMÆRK: "photo_path"/"photo_content_type" fandtes tidligere her (billede af
-- nøglegemmested pr. booking), men er erstattet af ét fælles nøglebillede på
-- public.app_settings (se key_photo_path nedenfor). Kolonnerne fjernes ikke
-- automatisk her for ikke at risikere datatab ved en fejl – de kan roligt
-- ignoreres eller fjernes manuelt, hvis I er sikre på, at I ikke bruger dem.

create index if not exists bookings_date_range_idx
  on public.bookings (start_date, end_date);

alter table public.bookings enable row level security;
-- Ingen policies tilføjes med vilje: default er "deny all" for anon/authenticated.

-- Applikationsindstillinger: hash af familiens fælles adgangskode +
-- fri tekst med praktisk info om lejligheden (adresse, telefonnumre m.m.).
create table if not exists public.app_settings (
  id smallint primary key default 1 check (id = 1),
  family_password_hash text,
  apartment_info text not null default '',
  key_photo_path text,
  key_photo_content_type text,
  updated_at timestamptz not null default now()
);

-- Tilføjer felterne, hvis tabellen allerede fandtes fra en tidligere version
-- af skemaet (denne fil er sikker at køre igen).
alter table public.app_settings add column if not exists apartment_info text not null default '';
alter table public.app_settings add column if not exists key_photo_path text;
alter table public.app_settings add column if not exists key_photo_content_type text;

-- family_password_hash var oprindeligt "not null", men skal kunne være tom,
-- så "Om lejligheden" kan gemmes uafhængigt af, om adgangskoden er sat endnu.
alter table public.app_settings alter column family_password_hash drop not null;

alter table public.app_settings enable row level security;
-- Ingen policies: kun service role kan læse/skrive.

-- Hjælpefunktion der holder updated_at ajour ved opdateringer
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- BEMÆRK: Der indsættes bevidst ingen startværdi for family_password_hash her.
-- Kør i stedet scriptet "npm run set-family-password -- <din-adgangskode>"
-- efter dette skema er oprettet (se README). Det udregner en rigtig
-- bcrypt-hash og gemmer den, så adgangskoden aldrig optræder i kildekoden.

-- Praktisk info til familievisningen: tjekliste ved afrejse + FAQ.
-- Samme sikkerhedsmodel som resten af appen: alle læser via API-ruter der
-- tjekker familie-/admin-adgang, kun administratorer kan skrive.
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(trim(text)) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.checklist_items enable row level security;

create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(trim(question)) > 0),
  answer text not null check (char_length(trim(answer)) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.faq_items enable row level security;

drop trigger if exists checklist_items_set_updated_at on public.checklist_items;
create trigger checklist_items_set_updated_at
  before update on public.checklist_items
  for each row execute function public.set_updated_at();

drop trigger if exists faq_items_set_updated_at on public.faq_items;
create trigger faq_items_set_updated_at
  before update on public.faq_items
  for each row execute function public.set_updated_at();

-- Fillager til billedet af nøglegemmested (ét fælles billede for hele
-- lejligheden, ikke pr. booking). Bucket'en er IKKE offentlig
-- ("public: false") – billedet hentes udelukkende via API-ruten
-- /api/key-photo/image, som selv tjekker at den, der spørger, enten er
-- administrator eller har familiens fælles adgangskode. Det er samme
-- sikkerhedsmodel som resten af appen: kun service role-nøglen har direkte
-- adgang til bucket'en.
insert into storage.buckets (id, name, public)
values ('booking-photos', 'booking-photos', false)
on conflict (id) do nothing;

-- Fejlrapporter fra familie/venner (kun synlige for administratorer).
-- "photos" er en liste af {path, contentType} for de vedhæftede billeder.
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  description text not null check (char_length(trim(description)) > 0),
  reporter_name text,
  photos jsonb not null default '[]'::jsonb,
  status text not null default 'new' check (status in ('new', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bug_reports enable row level security;
-- Ingen policies: kun service role kan læse/skrive. API-ruten for oprettelse
-- (POST) tjekker familie-/admin-adgang; læsning/redigering/sletning kræver
-- administrator, så kun ejerne kan se, hvad der er rapporteret.

drop trigger if exists bug_reports_set_updated_at on public.bug_reports;
create trigger bug_reports_set_updated_at
  before update on public.bug_reports
  for each row execute function public.set_updated_at();

-- Fillager til billeder vedhæftet fejlrapporter. Samme princip som
-- booking-photos: privat bucket, kun tilgængelig via en gated API-rute
-- til administratorer.
insert into storage.buckets (id, name, public)
values ('bug-report-photos', 'bug-report-photos', false)
on conflict (id) do nothing;
