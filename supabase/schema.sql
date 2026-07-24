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
  internal_comment text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_date_range_idx
  on public.bookings (start_date, end_date);

alter table public.bookings enable row level security;
-- Ingen policies tilføjes med vilje: default er "deny all" for anon/authenticated.

-- Applikationsindstillinger (i første version: hash af familiens fælles adgangskode)
create table if not exists public.app_settings (
  id smallint primary key default 1 check (id = 1),
  family_password_hash text not null,
  updated_at timestamptz not null default now()
);

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
