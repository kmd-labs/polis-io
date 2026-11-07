import { WarTexts } from './war.en';

export const WAR_PL: WarTexts = {
  postures: [
    { name: 'Pełna ofensywa', hint: 'Każdy mężczyzna na front: przejmujemy inicjatywę i szukamy bitwy — ale obywatele szemrzą z miesiąca na miesiąc.' },
    { name: 'Ofensywa', hint: 'Przenosimy wojnę na ich ziemię: więcej bitew i wypadów, nieco silniejsi w ataku.' },
    { name: 'Równowaga', hint: 'Walczymy tam, gdzie trzeba: gotowi stanąć w polu i bronić murów.' },
    { name: 'Obrona', hint: 'Trzymamy swoje i walczymy tylko na dobrych warunkach: silniejsi w obronie, rzadko uderzamy.' },
    { name: 'Za murami', hint: 'Wszyscy za mury, jak chciał Perykles: trudno nas pokonać, ale wróg pali nasze pola.' }
  ],
  postureTitle: 'Wojna — {name}: jak walczymy?',
  postureIntro: 'Wybierz, jak śmiało miasto prowadzi tę wojnę. Postawę można zmieniać raz w miesiącu.',
  postureLabel: 'Postawa',
  postureCooldown: 'Postawę będzie można zmienić w przyszłym miesiącu.',
  warScoreLabel: 'Bilans wojny',
  warScoreHint: 'Kto ma przewagę: przesuwają ją bitwy, wypady i zdobyte miasteczka; im większa przewaga, tym więcej można żądać przy stole pokojowym.',
  strategosLabel: 'Strateg',
  peaceBalanceLabel: 'Bilans przy stole',
  peaceMoodLine: 'Walki {w} · zadowolenie: nasze {a}%, {name} {b}% — niezadowolony lud osłabia miasto przy stole.',
  negotiate: 'Negocjuj pokój',
  maxWarsHint: 'Miasto nie prowadzi więcej niż trzech wojen naraz.',
  treatyHint: 'Traktat pokojowy obowiązuje do {year}.',
  campaignKinds: {
    battle: {
      title: 'Bitwa w polu',
      won: 'Nasza falanga przełamała szyk wroga — {name} — w pobliżu polis {place}. Pole bitwy i tropajon są nasze.',
      lost: 'Falanga wroga — {name} — przełamała nasz szyk w pobliżu polis {place}. Musimy prosić o rozejm, by pochować poległych.',
      line: 'Bitwa w pobliżu polis {w}: {a} zwycięża, {b} ustępuje z pola'
    },
    ravage: {
      title: 'Płonące pola',
      won: 'Nasi przeszli przez ziemie wroga ({name}) w pobliżu polis {place}, wycinając oliwki i paląc zboże, i wrócili obładowani.',
      lost: 'Wróg ({name}) spustoszył nasze pola w pobliżu polis {place}, a nasi patrzyli z murów.',
      line: '{a} pustoszy pola wroga ({b}) w pobliżu polis {w}'
    },
    fort: {
      title: 'Fort graniczny',
      won: 'Zdobyliśmy szturmem fort graniczny wroga ({name}) w pobliżu polis {place}; ziemia wokół jest nasza.',
      lost: 'Wróg ({name}) zdobył jeden z naszych fortów granicznych w pobliżu polis {place} i ziemię wokół niego.',
      line: '{a} zdobywa fort graniczny wroga ({b}) w pobliżu polis {w}'
    },
    skirmish: {
      title: 'Potyczka',
      won: 'Nasze lekkozbrojne oddziały wzięły górę nad wrogiem ({name}) w potyczce w pobliżu polis {place}.',
      lost: 'Nasi ulegli wrogowi ({name}) w potyczce w pobliżu polis {place}.',
      line: 'Potyczka w pobliżu polis {w}: {a} bierze górę nad wrogiem ({b})'
    },
    treachery: {
      title: 'Zdrada',
      won: 'Przyjaciele w jednym z miasteczek wroga ({name}) w pobliżu polis {place} otworzyli nam nocą bramy.',
      lost: 'Zdrajcy otworzyli wrogowi ({name}) bramy jednego z naszych miasteczek w pobliżu polis {place}.',
      line: 'Zdrada w pobliżu polis {w}: {a} wchodzi do miasteczka wroga ({b})'
    },
    plague: {
      title: 'Choroba w obozie',
      won: 'Wśród ludzi wroga ({name}) w pobliżu polis {place} wybuchła choroba; grzebią zmarłych.',
      lost: 'Wśród naszych ludzi w pobliżu polis {place} wybuchła choroba; wielu nie żyje.',
      line: 'Choroba dziesiątkuje wojsko — {b} — w pobliżu polis {w}'
    },
    allies: {
      title: 'Przybywają sojusznicy',
      won: 'Nasi sojusznicy przysłali oddział przeciw wrogowi ({name}).',
      lost: 'Sojusznicy wroga ({name}) włączyli się do walk w pobliżu polis {place}.',
      line: 'Sojusznicy ruszają z pomocą — {a} przeciw {b}'
    },
    navalRaid: {
      title: 'Napad od morza',
      won: 'Nasze okręty spadły na wybrzeże wroga ({name}) w pobliżu polis {place} i zabrały, co się dało.',
      lost: 'Okręty wroga ({name}) napadły na nasze wybrzeże w pobliżu polis {place}.',
      line: '{a} napada od morza na wybrzeże wroga ({b}) w pobliżu polis {w}'
    },
    landing: {
      title: 'Desant',
      won: 'Nasi hoplici wylądowali na wybrzeżu wroga ({name}) w pobliżu polis {place} i umocnili cypel.',
      lost: 'Wróg ({name}) wylądował na naszym wybrzeżu w pobliżu polis {place} i umocnił cypel.',
      line: '{a} ląduje na wybrzeżu wroga ({b}) w pobliżu polis {w}'
    },
    assault: {
      title: 'Szturm na mury',
      won: 'Nasi zdobyli szturmem mury wroga ({name})!',
      lost: 'Wróg ({name}) zdobył szturmem nasze mury!',
      line: '{a} zdobywa szturmem mury wroga ({b})'
    }
  },
  campaignGained: '{n} km² jest nasze.',
  campaignLost: 'Straciliśmy {n} km².',
  alertCampaign: '{title} — w pobliżu polis {place}',
  evCampaign: '{w}',
  evTreaty: 'Pokój zawarty: {a} i {b}{w}',
  evPeaceBought: '{a} kupuje pokój za {n} dr (wróg: {b})',
  letterSuePeace: 'Prosimy o pokój · {d} dr',
  peaceTitle: 'Rokowania — {name}',
  peaceIntro: 'Połóż na stole warunki obu stron; wskaźnik pokazuje, czy je przyjmą.',
  peaceWeGive: 'Dajemy',
  peaceTheyGive: '{name} daje',
  peaceItems: {
    gold: { name: 'Złoto', hint: 'Suma w srebrze: trzy, sześć lub dwanaście miesięcy dochodu dającego.' },
    land: { name: 'Ziemia', hint: 'Pas ziemi dającego wzdłuż wspólnej granicy.' },
    alliance: { name: 'Przymusowy sojusz', hint: 'Oba miasta stają się sojusznikami: każde musi przyjść drugiemu z pomocą.' },
    client: { name: 'Państwo klienckie', hint: 'Dający służy drugiemu jako państwo klienckie i płaci mu trybut.' },
    humiliation: { name: 'Ośmieszenie', hint: 'Publiczne upokorzenie: dający traci prestiż, drugi go zyskuje.' }
  },
  peaceGoldLevel: '{d} dr',
  peaceLandLevel: '{n} km²',
  peaceNoLand: 'Nasze ziemie się nie stykają: żadna ziemia nie może zmienić właściciela.',
  peaceAccept: 'Przyjmą',
  peaceRefuse: 'Odrzucą',
  peaceRefused: 'Odrzucili te warunki.',
  peaceWhat: 'Czego chcą?',
  peaceWhite: 'Biały pokój',
  peacePropose: 'Zaproponuj pokój',
  peaceBack: 'Wróć do wojny',
  peaceWeary: 'Po czterech latach wojny oba miasta są zmęczone: łatwiej o porozumienie.',
  peaceOfferTitle: 'Poselstwo — {name}',
  peaceOfferText: 'Posłowie ({name}) proponują pokój na tych warunkach:',
  peaceOfferNone: 'biały pokój, bez żadnych warunków.',
  peaceOfferAccept: 'Przyjmij',
  peaceOfferRefuse: 'Odrzuć',
  peaceOfferTalk: 'Negocjuj',
  termGold: '{d} dr',
  termLand: '{n} km² ziemi',
  termLine: '{giver}: {item}'
};
