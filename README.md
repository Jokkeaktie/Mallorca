# Mallorca-appen

En simpel, fælles kalender til at planlægge ophold i familiens lejlighed på
Mallorca. Familie og venner kan ønske en periode via en formular, men ser
bevidst **ikke** selve kalenderen eller de eksisterende bookinger – det er et
bevidst valg, så lejlighedens ejere selv kan formidle, hvornår den er
ledig/optaget. Kun lejlighedens to ejere (administratorer) kan se hele
kalenderen og oprette, ændre og slette kalenderposter.

Denne README er skrevet, så du kan følge den, selvom du ikke har erfaring med
webudvikling. Følg trinene i rækkefølge.

---

## Indhold

1. [Hvad er bygget, og hvordan virker det](#hvad-er-bygget-og-hvordan-virker-det)
2. [Software du skal installere](#1-software-du-skal-installere)
3. [Hent projektet](#2-hent-projektet-fra-github)
4. [Installér dependencies](#3-installér-dependencies)
5. [Opret en Supabase-konto og database](#4-opret-en-supabase-konto-og-database)
6. [Sæt miljøvariabler](#5-sæt-miljøvariabler)
7. [Opret de to administratorer](#6-opret-de-to-administratorer)
8. [Sæt familiens fælles adgangskode](#7-sæt-familiens-fælles-adgangskode)
9. [Kør projektet lokalt](#8-kør-projektet-lokalt)
10. [Demo-data (valgfrit)](#9-demo-data-valgfrit)
11. [Deployment til Vercel](#10-deployment-til-vercel)
12. [Publicér senere ændringer](#11-publicér-senere-ændringer)
13. [Gratis drift – hvad du skal holde øje med](#12-gratis-drift--hvad-du-skal-holde-øje-med)
14. [Sådan bruger administratorerne appen](#13-sådan-bruger-administratorerne-appen)
15. [Tests, linting og typecheck](#14-tests-linting-og-typecheck)
16. [Begrænsninger i denne version](#15-begrænsninger-i-denne-version)
17. [Fremtidige udvidelser](#16-fremtidige-udvidelser)

---

## Hvad er bygget, og hvordan virker det

### Arkitektur og valgt teknologi

| Del | Valg | Hvorfor |
|---|---|---|
| Framework | **Next.js 14** (App Router) + TypeScript | Ét samlet projekt til både frontend og backend (API-ruter), meget udbredt, nem at vedligeholde, god Vercel-integration. |
| Database | **Supabase** (Postgres) | Gratis niveau er rigeligt til to administratorer og en lille kreds af familie/venner. Rigtig Postgres-database (ikke eksperimentel), indbygget autentificering, Row Level Security. |
| Hosting | **Vercel** | Gratis niveau (Hobby) til private/ikke-kommercielle projekter, automatisk deployment fra GitHub, gratis HTTPS. |
| Styling | **Tailwind CSS** | Hurtigt at style et minimalistisk, mobilvenligt design uden et stort CSS-bibliotek. |
| Validering | **Zod** | Sikrer at data valideres på serveren, ikke kun i frontend. |
| Adgangskode-hashing | **bcryptjs** | Ren JavaScript-implementering (ingen native afhængigheder, som ellers kan drille i serverless-miljøer). |
| Tests | **Vitest** + **Testing Library** | Hurtige, moderne tests af både logik og komponenter. |

**Hvorfor dette holder sig gratis:** Supabase's gratis niveau inkluderer en
Postgres-database, autentificering og et generøst API-kald-loft, som er langt
mere end to administratorer og en lille omgangskreds nogensinde vil bruge.
Vercels gratis niveau dækker hosting af små, ikke-kommercielle projekter med
rigelig båndbredde til denne brug. Der bruges ingen betalte tilføjelser
nogen steder.

### Sikkerhedsmodel (kort fortalt)

- **Familie/venner** logger ind med én fælles adgangskode. Det giver en
  signeret, "httpOnly"-cookie (kan ikke læses af JavaScript i browseren) som
  beviser læseadgang. Denne cookie giver **ingen** rettigheder til at
  ændre noget.
- **Administratorer** logger ind med e-mail og adgangskode via Supabase Auth
  (samme slags sikre login-system som mange kommercielle apps bruger).
- Alle kald til databasen sker **udelukkende** fra serveren
  (Next.js API-ruter), aldrig direkte fra browseren. Serveren filtrerer
  felterne, før noget sendes til familievisningen – interne kommentarer og
  præcise klokkeslæt forlader aldrig serveren, når kaldet ikke kommer fra en
  administrator.
- Databasen har Row Level Security slået til uden nogen adgangsregler for
  "anon"/"authenticated" – kun den hemmelige service-role-nøgle (som kun
  findes i servermiljøvariabler) kan læse/skrive. Det betyder, at selv hvis
  nogen fandt på at forsøge at forespørge databasen direkte, ville de blive
  afvist.
- Adgangskoder gemmes aldrig som klartekst – kun som bcrypt-hash.

### Vigtigt om datalagring (ingen ekstra backup-infrastruktur)

Supabase's Postgres-database er en fuldt understøttet, stabil
produktions-database (ikke eksperimentel eller hukommelsesbaseret), så der er
ikke behov for at bygge en ekstra backup-løsning oven på Supabases egen
standardopsætning i denne version. Hvis I på et tidspunkt ønsker ekstra
tryghed, kan I fra Supabase-dashboardet tage et manuelt "Database backup"
(tilgængeligt afhængigt af plan) – men det er ikke nødvendigt for at komme i
gang.

---

## 1. Software du skal installere

Du skal bruge følgende på din computer (Mac, Windows eller Linux):

1. **Node.js** version 18 eller nyere. Hent fra [nodejs.org](https://nodejs.org)
   (vælg "LTS"-versionen). Dette installerer også `npm`, som bruges til at
   installere projektets dependencies.
2. **Git**. Hent fra [git-scm.com](https://git-scm.com) hvis det ikke allerede
   er installeret (kan tjekkes ved at skrive `git --version` i en terminal).
3. En **kodeeditor**, fx [Visual Studio Code](https://code.visualstudio.com)
   (gratis).

Alt andet (database, hosting) klares via gratis webtjenester i trinene
nedenfor.

## 2. Hent projektet fra GitHub

Åbn en terminal og kør:

```bash
git clone https://github.com/<dit-github-brugernavn>/Mallorca.git
cd Mallorca
```

(Erstat linket med jeres faktiske GitHub-repository-adresse.)

## 3. Installér dependencies

Inde i projektmappen:

```bash
npm install
```

Dette henter alle de biblioteker, projektet bruger (Next.js, React,
Supabase-klient osv.). Det tager typisk et minuts tid.

## 4. Opret en Supabase-konto og database

1. Gå til [supabase.com](https://supabase.com) og opret en gratis konto
   (du kan logge ind med din GitHub-konto).
2. Opret et nyt projekt ("New project"). Vælg et navn (fx "mallorca-kalender"),
   sæt en databaseadgangskode (gem den et sikkert sted, I får ikke brug for
   den i det daglige), og vælg en region tæt på Europa (fx Frankfurt/EU).
3. Vent til projektet er klar (tager typisk 1-2 minutter).
4. Gå til **SQL Editor** i venstremenuen, opret en "New query", og indsæt
   hele indholdet af filen [`supabase/schema.sql`](./supabase/schema.sql) fra
   dette projekt. Tryk "Run".
   - Dette opretter tabellerne `bookings`, `app_settings` (inkl. feltet
     `apartment_info` til "Om lejligheden"), `checklist_items`, `faq_items`
     og `bug_reports` samt de nødvendige sikkerhedsregler (Row Level
     Security).
5. Gå til **Project Settings -> API**. Her finder du:
   - **Project URL** → bruges som `NEXT_PUBLIC_SUPABASE_URL` og
     `SUPABASE_URL`.
   - **anon public**-nøglen → bruges som `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - **service_role**-nøglen (under "Reveal") → bruges som
     `SUPABASE_SERVICE_ROLE_KEY`. **Denne er hemmelig og må aldrig deles.**
6. (Anbefalet) Gå til **Authentication -> Providers -> Email** og slå
   "Allow new users to sign up" **fra**. Der skal ikke være offentlig
   tilmelding – administratorer oprettes udelukkende via scriptet i trin 6
   nedenfor.

> **Opdaterer du en database, der allerede kører** (fx fordi der er kommet en
> ny version af appen med nye felter)? `supabase/schema.sql` er skrevet, så
> den er **sikker at køre igen** — den opretter kun det, der mangler, og
> rører ikke ved eksisterende data. Gå bare til **SQL Editor**, indsæt hele
> filens indhold på ny, og tryk "Run".

## 5. Sæt miljøvariabler

I projektmappen:

```bash
cp .env.example .env.local
```

Åbn `.env.local` i din editor, og udfyld de fire værdier med det, du fandt i
Supabase-dashboardet i forrige trin, samt en tilfældig hemmelig streng til
`FAMILY_SESSION_SECRET`. Du kan generere en god værdi med:

```bash
openssl rand -base64 32
```

`.env.local` bliver **aldrig** committet til GitHub (den står i
`.gitignore`), så dine hemmelige nøgler er trygge.

### E-mail-notifikationer (valgfrit)

Uden mere opsætning skal administratorerne selv åbne appen for at opdage nye
ønsker (om end der er et tydeligt "Nye ønsker"-panel øverst på
administratorsiden til det, se afsnit 13). Vil I i stedet have en mail, så
snart nogen sender et ønske, skal I bruge [Resend](https://resend.com) (gratis
niveau: 100 mails/dag, intet kreditkort krævet):

1. Opret en gratis konto på resend.com, og verificér et domæne, I ejer
   (Resend kræver dette for at kunne sende fra en adresse som
   `onsker@jeres-domæne.dk` – det tager typisk et par minutter og kræver, at
   I kan tilføje DNS-poster hos jeres domæneudbyder).
2. Opret en API-nøgle under **API Keys**, og sæt den som `RESEND_API_KEY`.
3. Sæt `RESEND_FROM_EMAIL` til en afsender-adresse på det verificerede
   domæne, fx `Mallorca-appen <onsker@jeres-domæne.dk>`.
4. Sæt `ADMIN_NOTIFICATION_EMAILS` til jeres to e-mails, adskilt af komma.
5. (Valgfrit) Sæt `NEXT_PUBLIC_APP_URL` til appens rigtige adresse, så mailen
   kan linke direkte til administratorområdet.
6. Husk at tilføje de samme miljøvariabler i Vercel (se trin 10), ikke kun
   lokalt i `.env.local`.

Mangler én eller flere af de tre påkrævede variabler, springes afsendelsen
bare stille over – ønsket oprettes stadig helt normalt.

## 6. Opret de to administratorer

Kør følgende kommando én gang for hver af forældrene (brug rigtige,
personlige e-mailadresser og et sikkert kodeord på mindst 8 tegn):

```bash
npm run create-admin -- mor@eksempel.dk "et-sikkert-kodeord-1"
npm run create-admin -- far@eksempel.dk "et-sikkert-kodeord-2"
```

Dette opretter to brugere direkte i Supabase Auth. Der findes ingen
tilmeldingsside i selve appen – dette script er den eneste måde at oprette
administratorer på, hvilket er med til at sikre, at ingen andre kan give sig
selv administratoradgang.

## 7. Sæt familiens fælles adgangskode

Kør (vælg selv adgangskoden, mindst 8 tegn):

```bash
npm run set-family-password -- "en-god-fælles-adgangskode"
```

Denne adgangskode kan I altid ændre senere fra administratorpanelet i appen
under "Indstillinger", uden at skulle køre scriptet igen.

## 8. Kør projektet lokalt

```bash
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) i browseren. Du bliver
mødt af login-siden til familievisningen. Administratorlogin findes på
[http://localhost:3000/admin/login](http://localhost:3000/admin/login) (der
er også et diskret "Administrator"-link nederst på forsiden).

## 9. Demo-data (valgfrit)

Vil I se kalenderen med lidt eksempeldata (fx til at vise familien, hvordan
det virker), kan I køre:

```bash
ALLOW_SEED=true npm run seed
```

Dette opretter tre eksempelposter ("Joakim H." – Ønske, "Tania H." –
Godkendt, "Peter og Lise" – Ønske) i den database, I har konfigureret i
`.env.local`. Kør det **kun** mod et udviklings-/testprojekt i Supabase, ikke
mod jeres rigtige, permanente database, medmindre I bevidst ønsker
eksempeldata der. Kommandoen kører aldrig af sig selv – I skal selv bede om
det, og `ALLOW_SEED=true` skal angives eksplicit hver gang som en ekstra
sikkerhed mod at gøre det ved en fejl.

## 10. Deployment til Vercel

1. Sørg for at projektet ligger i et GitHub-repository (det gør det allerede,
   hvis du fulgte trin 2).
2. Gå til [vercel.com](https://vercel.com) og opret en gratis konto (log ind
   med din GitHub-konto).
3. Tryk **"Add New… -> Project"**, og vælg dit GitHub-repository.
4. Vercel genkender automatisk, at det er et Next.js-projekt. Før du trykker
   "Deploy", skal du åbne **"Environment Variables"** og tilføje de samme
   fire variabler som i din `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FAMILY_SESSION_SECRET`
5. Tryk **"Deploy"**. Efter et minuts tid får I et link (noget i stil med
   `https://mallorca-xxxxx.vercel.app`), som familie og venner kan bruge.
6. (Valgfrit) Under projektets **Settings -> Domains** kan I senere tilføje
   et eget domænenavn, hvis I skulle købe et – det er ikke nødvendigt for at
   bruge appen gratis.

## 11. Publicér senere ændringer

Når I (eller nogen på jeres vegne) laver ændringer i koden:

```bash
git add .
git commit -m "Kort beskrivelse af ændringen"
git push
```

Vercel opdager automatisk push til hovedgrenen og udruller den nye version
inden for typisk et minuts tid – I skal ikke gøre noget manuelt i Vercel.

## 12. Gratis drift – hvad du skal holde øje med

Ved den forventede brug (to administratorer, en lille kreds af familie og
venner, moderat trafik) koster driften **0 kr.** Hold alligevel øje med disse
gratis-grænser, hvis brugen skulle vokse markant:

- **Supabase (gratis niveau):**
  - Databasen "pauses" automatisk efter 7 dages total inaktivitet på gratis
    niveau (den vågner selv op igen ved næste besøg – dette rammer typisk kun
    projekter der slet ikke bruges, men er værd at kende til).
  - Op til 500 MB databaselagring og 5 GB filoverførsel pr. måned – langt
    mere end en kalender med et par hundrede bookinger nogensinde vil bruge.
  - Begrænset antal e-mails, hvis I nogensinde slår e-mailbekræftelse til for
    administratorer (bruges ikke i denne version).
- **Vercel (gratis "Hobby"-niveau):**
  - Beregnet til personlig/ikke-kommerciel brug.
  - 100 GB båndbredde pr. måned – langt mere end denne app vil bruge selv med
    en større familie.
- Hvis en af disse grænser en dag skulle blive et problem, vil den relevante
  tjeneste sende en tydelig besked i deres dashboard, længe før noget stopper
  med at virke.

## 13. Sådan bruger administratorerne appen

Denne vejledning findes også direkte i appen under **Administrator ->
"Kort vejledning"** (`/admin/vejledning`).

1. **Log ind** på `/admin/login` med den e-mail og adgangskode, der blev
   oprettet i trin 6.
2. **"Nye ønsker"-panelet** øverst på administratorsiden er en fold-ud-boks
   (lukket som standard, ligesom FAQ'en under Praktisk info) med alle
   ubehandlede ønsker, sorteret efter hvornår de blev SENDT (ikke hvornår
   perioden ligger) – så et ønske til fx næste sommer, der lige er kommet
   ind, altid ligger øverst og ikke drukner i kalenderen. Tryk på
   overskriften for at folde listen ud. Godkend direkte med ét tryk, tryk
   "Redigér" for at ændre noget først, eller "Slet" for at afvise ønsket
   permanent. Panelet forsvinder helt, når der ikke er flere ubehandlede
   ønsker. Se også afsnittet
   "E-mail-notifikationer (valgfrit)" ovenfor, hvis I vil have besked på
   mail, så snart et ønske sendes.
3. **Opret en ny kalenderpost** ved at trykke "+ Ny kalenderpost". Udfyld
   navn, vælg status (Ønske/Godkendt), farve, samt start- og slutdato.
   Ankomst-/afrejsetidspunkt og intern kommentar er valgfrie.
4. **Redigér eller slet** en post ved at trykke på en dag i kalenderen og
   derefter "Redigér" på den ønskede post. Sletning sker fra
   redigeringsvisningen og kan ikke fortrydes.
5. **Skift status** mellem "Ønske" og "Godkendt" ved at redigere posten – det
   sker ikke automatisk, I bestemmer selv.
6. **Overlappende ønsker** kræver ingen handling i sig selv – flere personer
   kan gerne ønske samme periode. I beslutter selv, hvem der får perioden.
   Familie og venner ser ikke kalenderen og kan derfor ikke selv se, om en
   periode er ledig – de sender blot et ønske via "Ønsk booking" på forsiden
   (med navn, datoer, en valgfri "Rejsedetaljer"-boks til flynummer og
   ankomst-/afrejsetidspunkt, samt en valgfri besked, som gemmes som intern
   kommentar), og det dukker op i jeres kalender som en almindelig
   "Ønske"-post, I kan redigere og godkende/afvise som enhver anden post.
7. **Skift den fælles adgangskode** når som helst under "Indstillinger" på
   administratorsiden.
8. **Nøglegemmested-billedet** er ÉT fælles billede (ikke knyttet til en
   bestemt booking eller et bestemt ophold), vist øverst på både familiens
   forside og administratorsiden. Da de fleste ophold IKKE har en skjult
   nøgle (gæsten får den direkte af jer), vises der som udgangspunkt kun et
   diskret "+ Tilføj billede af nøglegemmested"-link, ikke en fremtrædende
   boks — den fulde boks med billede dukker først op, når nogen rent
   faktisk har uploadet et billede. Tryk "Opdatér billede" for at erstatte
   det med et nyt. **Familie og venner kan også selv tilføje/opdatere
   billedet** (uden at logge ind som admin) — typisk den afrejsende gæst,
   der viser den næste gæst, hvor nøglen er lagt. Kun administratorer kan
   trykke "Fjern billede" og slette det permanent.

   > **Kræver en opdateret database.** Denne udgave af nøglebilledet bruger
   > nye felter i `app_settings`. Kør `supabase/schema.sql` igen i Supabase
   > **SQL Editor** (se boksen i trin 4 ovenfor) før denne funktion virker,
   > hvis I opdaterer en database, der allerede kører.
9. **Redigér praktisk info** ("Om lejligheden" fri tekst + FAQ + tjekliste
   ved afrejse) under **Praktisk info** på administratorsiden. "Om
   lejligheden" er et frit tekstfelt til fx adresse og telefonnumre på
   relevante personer — vises øverst på familiens side, hvis det er udfyldt.
   Skriv i felterne og tryk **"Gem"** for at gemme en ændring, brug ↑/↓ til
   at omarrangere FAQ/tjekliste, eller "Slet" for at fjerne et punkt —
   ændringer vises med det samme for familie og venner under "Praktisk
   info" på forsiden. Familiens afkrydsninger på tjeklisten gemmes lokalt på
   den enkelte gæsts egen telefon (ikke i databasen) og forsvinder
   automatisk dagen efter opholdet slutter.
10. **Se fejlrapporter** under **Fejlrapporter** på administratorsiden.
   Familie og venner kan rapportere mindre fejl/mangler (med op til 5
   billeder) fra forsiden under "Rapportér fejl" — det er kun synligt for
   jer. Markér en rapport som "løst", genåbn den, eller slet den permanent.

## 14. Tests, linting og typecheck

Kør disse kommandoer fra projektmappen (kræver at `npm install` er kørt):

```bash
npm run test       # Kører alle automatiske tests (Vitest)
npm run lint       # Tjekker kodestandard (ESLint)
npm run typecheck  # Tjekker TypeScript-typer
npm run build      # Bygger produktionsversionen (fanger evt. resterende fejl)
```

Ved seneste kørsel i dette projekt: **54 tests bestået, ingen lint-fejl,
ingen typefejl, build lykkedes.**

## 15. Begrænsninger i denne version

- Der er ingen konflikthåndtering ved samtidig redigering – "sidste skriv
  vinder". Med kun to administratorer er dette en bevidst, accepteret
  simplificering.
- Den fælles adgangskode-cookie er en let, signeret cookie (ikke en fuld
  brugerkonto) – det er en bevidst afvejning for at undgå individuelle
  brugerkonti til familie/venner, som opgaven eksplicit fravalgte.
- Rate-limiting på login-forsøg til den fælles adgangskode er "best effort"
  (i hukommelse på serveren) og ikke en vandtæt beskyttelse mod
  brute-force, men kræver ingen ekstra betalt tjeneste. Supabase Auth (til
  administratorlogin) har sin egen indbyggede beskyttelse.
- Ingen automatisk backup-infrastruktur ud over Supabases standardopsætning
  (se afsnittet ovenfor om datalagring).
- Mobiloplevelsen er testet via automatiserede komponenttests og manuel
  gennemgang af layoutet, men er ikke verificeret med et automatiseret
  visuelt regressionsværktøj på en fysisk iPhone. Test gerne selv på jeres
  egne telefoner efter deployment.
- **Billede af nøglegemmested er ét fælles billede, som kan
  tilføjes/opdateres af enhver med adgang til familievisningen** – der er
  ingen individuelle gæstekonti eller bookinger at knytte det til, så dette
  er en bevidst afvejning inden for den lille, betroede kreds af
  familie/venner, der har den fælles adgangskode. Sletning af billedet er
  forbeholdt administratorer.

## 16. Fremtidige udvidelser

Arkitekturen er bevidst holdt enkel, men uden at lukke døren for senere
tilføjelser som:

- Praktiske oplysninger om lejligheden, nøgleinformation, rengøringsvejledning,
  kontaktpersoner, husregler og nyttige links – kan tilføjes som nye sider
  under `src/app/` og evt. en ny tabel i Supabase, uden at ændre
  kalenderens eller autentificeringens opbygning.
- Disse er bevidst **ikke** bygget i denne version.

---

## PWA – installér som app-ikon

Appen kan gemmes som et ikon på hjemmeskærmen:

- **iPhone (Safari):** Åbn siden -> tryk på "Del"-ikonet -> "Føj til
  Hjemmeskærm".
- **Android/Chrome:** Åbn siden -> menu (⋮) -> "Føj til startskærm" / "Installer app".

Den fungerer også som en helt almindelig hjemmeside uden installation.
