import Link from 'next/link';

export const metadata = { title: 'Vejledning – Mallorca-appen' };

export default function AdminGuidePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 px-4 py-10">
      <Link href="/admin" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til administratorområdet
      </Link>

      <h1 className="text-2xl font-semibold text-ink">Sådan bruger I administratorområdet</h1>

      <ol className="flex flex-col gap-4 text-sm leading-relaxed text-ink">
        <li>
          <strong>1. Nye ønsker.</strong> Øverst på administratorsiden viser et panel alle
          ubehandlede ønsker, sorteret efter hvornår de blev SENDT (ikke hvornår perioden
          ligger) – så et ønske til fx næste sommer, der lige er kommet ind, altid ligger
          øverst og ikke drukner i kalenderen. Tryk “✓ Godkend” for at godkende med det
          samme, “Redigér” for at ændre noget først, eller “Slet” for at afvise ønsket
          permanent. Panelet forsvinder, når der ikke er flere ubehandlede ønsker.
        </li>
        <li>
          <strong>2. Opret en ny kalenderpost.</strong> Tryk på “+ Ny kalenderpost”. Skriv
          navnet på personen eller familien, vælg status (Ønske eller Godkendt), vælg en
          farve, og angiv start- og slutdato. Ankomst-/afrejsetidspunkt, flynummer og
          intern kommentar er valgfrie.
        </li>
        <li>
          <strong>3. Redigér en post.</strong> Tryk på en dag i kalenderen for at se
          dagens poster, og tryk “Redigér” på den post, I vil ændre.
        </li>
        <li>
          <strong>4. Skift status.</strong> Åbn posten via “Redigér”, og skift mellem
          “Ønske” og “Godkendt”. Der er ingen automatik – I bestemmer selv, hvornår et
          ønske bliver til en godkendt booking.
        </li>
        <li>
          <strong>5. Slet en post.</strong> Tryk “Redigér” på dagen, og brug “Slet”-knappen
          i redigeringsvisningen. Sletning kan ikke fortrydes.
        </li>
        <li>
          <strong>6. Overlappende ønsker.</strong> Flere personer kan gerne ønske samme
          periode samtidig – systemet sletter eller afviser ikke automatisk noget. I
          beslutter selv, hvem der får perioden, ved at sætte den ene til “Godkendt”.
          Familie og venner ser ikke kalenderen og kan derfor ikke selv se ledighed – de
          sender et ønske via “Ønsk booking” på forsiden, som dukker op her (og i “Nye
          ønsker”-panelet) som en almindelig “Ønske”-post.
        </li>
        <li>
          <strong>7. Skift den fælles adgangskode.</strong> Under “Indstillinger” på
          administratorsiden kan I til enhver tid ændre den adgangskode, som familie og
          venner bruger for at se kalenderen.
        </li>
        <li>
          <strong>8. Farver.</strong> Vælg gerne samme farve igen, næste gang I opretter en
          post til den samme person eller familie, så farven er genkendelig i kalenderen.
        </li>
        <li>
          <strong>9. Billede af nøglegemmested.</strong> Der er ét fælles billede, ikke
          knyttet til en bestemt post. Da de fleste ophold ikke har en skjult nøgle, vises
          som udgangspunkt kun et diskret “+ Tilføj billede”-link – boksen med selve
          billedet dukker først op, når der er uploadet et. Tryk “Opdatér billede” for at
          erstatte det. Familie og venner kan også selv tilføje/opdatere billedet uden at
          logge ind – typisk den afrejsende gæst, der viser den næste gæst, hvor nøglen er
          lagt. Kun I kan trykke “Fjern billede” og slette det permanent.
        </li>
        <li>
          <strong>10. Praktisk info (tjekliste og FAQ).</strong> Under{' '}
          <Link href="/admin/info" className="underline underline-offset-2">
            Praktisk info
          </Link>{' '}
          kan I tilføje punkter til tjeklisten ved afrejse (fx “Sluk lys og aircondition”) og
          spørgsmål/svar til FAQ’en (fx “Hvor bytter jeg gaspatron?”). Husk at trykke
          “Gem” efter en ændring. Brug ↑/↓ til at omarrangere rækkefølgen. Ændringer vises
          med det samme for familie og venner under “Praktisk info” på forsiden.
        </li>
        <li>
          <strong>11. Fejlrapporter.</strong> Under{' '}
          <Link href="/admin/fejlrapporter" className="underline underline-offset-2">
            Fejlrapporter
          </Link>{' '}
          kan I se, hvad familie/venner har rapporteret via “Rapportér fejl” på forsiden
          (inkl. eventuelle billeder). Kun I kan se disse. Markér som “løst”, genåbn, eller
          slet permanent.
        </li>
      </ol>

      <Link href="/admin" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til administratorområdet
      </Link>
    </main>
  );
}
