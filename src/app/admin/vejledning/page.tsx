import Link from 'next/link';

export const metadata = { title: 'Vejledning – Mallorca-kalenderen' };

export default function AdminGuidePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 px-4 py-10">
      <h1 className="text-2xl font-semibold text-ink">Sådan bruger I administratorområdet</h1>

      <ol className="flex flex-col gap-4 text-sm leading-relaxed text-ink">
        <li>
          <strong>1. Opret en ny kalenderpost.</strong> Tryk på “+ Ny kalenderpost”. Skriv
          navnet på personen eller familien, vælg status (Ønske eller Godkendt), vælg en
          farve, og angiv start- og slutdato. Ankomst-/afrejsetidspunkt og intern
          kommentar er valgfrie.
        </li>
        <li>
          <strong>2. Redigér en post.</strong> Tryk på en dag i kalenderen for at se
          dagens poster, og tryk “Redigér” på den post, I vil ændre.
        </li>
        <li>
          <strong>3. Skift status.</strong> Åbn posten via “Redigér”, og skift mellem
          “Ønske” og “Godkendt”. Der er ingen automatik – I bestemmer selv, hvornår et
          ønske bliver til en godkendt booking.
        </li>
        <li>
          <strong>4. Slet en post.</strong> Tryk “Redigér” på dagen, og brug “Slet”-knappen
          i redigeringsvisningen. Sletning kan ikke fortrydes.
        </li>
        <li>
          <strong>5. Overlappende ønsker.</strong> Flere personer kan gerne ønske samme
          periode samtidig – systemet sletter eller afviser ikke automatisk noget. I
          beslutter selv, hvem der får perioden, ved at sætte den ene til “Godkendt”.
        </li>
        <li>
          <strong>6. Skift den fælles adgangskode.</strong> Under “Indstillinger” på
          administratorsiden kan I til enhver tid ændre den adgangskode, som familie og
          venner bruger for at se kalenderen.
        </li>
        <li>
          <strong>7. Farver.</strong> Vælg gerne samme farve igen, næste gang I opretter en
          post til den samme person eller familie, så farven er genkendelig i kalenderen.
        </li>
        <li>
          <strong>8. Billede af nøglegemmested.</strong> Åbn en allerede oprettet post via
          “Redigér”, og tryk “Tilføj billede” for at tage et foto med telefonen eller vælge
          et fra kamerarullen. Billedet vises for familie og venner på netop den
          kalenderpost, så den næste gæst kan finde nøglen. Tryk “Fjern billede” for at
          slette det igen.
        </li>
        <li>
          <strong>9. Praktisk info (tjekliste og FAQ).</strong> Under{' '}
          <Link href="/admin/info" className="underline underline-offset-2">
            Praktisk info
          </Link>{' '}
          kan I tilføje punkter til tjeklisten ved afrejse (fx “Sluk lys og aircondition”) og
          spørgsmål/svar til FAQ’en (fx “Hvor bytter jeg gaspatron?”). Brug ↑/↓ til at
          omarrangere rækkefølgen. Ændringer vises med det samme for familie og venner
          under “Praktisk info” på forsiden.
        </li>
      </ol>

      <Link href="/admin" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til administratorområdet
      </Link>
    </main>
  );
}
