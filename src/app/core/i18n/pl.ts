import { Dict } from './i18n.types';

export const PL: Dict = {
  htmlLang: 'pl',
  docTitle: 'KMD · Polis',
  langName: 'Polski',
  appName: 'Polis',
  seoDescription:
    'Pikselowa strategia czasu rzeczywistego w archaicznej Grecji, 600 p.n.e. Poprowadź polis, zasiedlaj dzicz i walcz o hegemonię nad Helladą.',

  // Top HUD & Navigation
  changeLanguage: 'Język',
  chooseView: 'Widok mapy',
  viewPolitical: 'Mapa polityczna',
  viewFertility: 'Żyzność gleby',
  stageAriaLabel: 'Pikselowa mapa Grecji w 600 p.n.e.',

  // Bottom Dock & Glossary
  glossary: 'Jak grać',
  glossaryDesc:
    'Grecja, 600 p.n.e. Wieki ciemne minęły, a dziesiątki polis walczą o ziemię. Każdy piksel mapy należy do którejś polis albo wciąż jest dziki.',
  glossaryItems: [
    {
      term: 'Polis',
      desc: 'Niezależne miasto-państwo. Kliknij świątynię na mapie, by je podejrzeć; na starcie gry kliknij jego ziemię, by nim pokierować.'
    },
    {
      term: 'Dzicz',
      desc: 'Szare piksele niczyje. Ich żyzność (widok „Żyzność gleby”) decyduje, ilu ludzi wyżywi ziemia.'
    },
    {
      term: 'Zasiedlanie dziczy',
      desc: 'Wysyła na zawsze 10% twoich robotników. Powoli zajmują wolną ziemię przy granicach — a gdy wybrzeże się zapełni, zakładają kolonię za morzem. Więcej ziemi to większa pojemność, a każdy nowy piksel trwale przyspiesza przyrost ludności i dochody.'
    },
    {
      term: 'Robotnicy',
      desc: 'Cywile zdolni do pracy fizycznej. Zarabiają drachmy, zostają osadnikami i są uzbrajani jako hoplici.'
    },
    {
      term: 'Hoplici',
      desc: 'Twoi wojownicy. Strzegą stolicy, a w czasie wojny wyruszają w małych armiach. Każdy kosztuje żołd; nieopłaceni hoplici dezerterują.'
    },
    {
      term: 'Wojna',
      desc: 'Wypowiedz wojnę polis, a twoje armie same ruszą w pole, zagarniając wrogie piksele jeden po drugim. Wrogie terytorium jest prążkowane. Zdobycie stolicy wroga wymaga pokonania jej garnizonu — i oznacza aneksję całej polis.'
    },
    {
      term: 'Bitwa',
      desc: 'Gdy spotkają się dwie wrogie armie, znikają w chmurze bójki. Wychodzi z niej tylko jedna; zwykle silniejsza, ale nie zawsze.'
    },
    {
      term: 'Zwycięstwo',
      desc: 'Zajmij połowę ziem greckich albo zostań ostatnią polis. Upadek twojej stolicy oznacza porażkę.'
    }
  ],
  close: 'Zamknij',

  // Calendar & time controls
  yearBC: '{y} p.n.e.',
  yearAD: '{y} n.e.',
  play: 'Wznów',
  pause: 'Pauza',
  speed: 'Tempo gry',
  fitMap: 'Dopasuj mapę do ekranu',

  // Choosing a polis
  chooseTitle: 'Wybierz swoją polis',
  chooseHint: 'Kliknij miasto-państwo na mapie albo wybierz je z listy.',
  choosePick: 'Wybierz polis',

  // Player polis panel
  yourPolis: 'Twoja polis',
  statPopulation: 'Ludność',
  statWorkers: 'Robotnicy',
  statWarriors: 'Wojownicy',
  statDrachmae: 'Drachmy',
  statTerritory: 'Terytorium',
  statGrowth: 'Dobrobyt',
  statPopulationHint: 'Wszyscy mieszkańcy polis: cywile i wojownicy.',
  statWorkersHint: 'Cywile zdolni do pracy fizycznej. Wytwarzają dochód i mogą wyruszyć jako osadnicy.',
  statWarriorsHint: 'Hoplici w garnizonie i w polu.',
  statDrachmaeHint: 'Skarbiec i dochód na sekundę (po odliczeniu żołdu).',
  statTerritoryHint: 'Udział we wszystkich ziemiach greckich.',
  statGrowthHint: 'Mnożnik przyrostu i dochodów zdobyty dzięki zasiedlaniu dziczy.',
  settle: 'Zasiedlaj dzicz',
  settleHint: 'Wyślij 10% robotników ({n}), by zajęli dziką ziemię. Więcej ziemi przyspiesza przyrost ludności i dochody.',
  settling: 'Zasiedlanie… {p}%',
  settleNoLand: 'Brak wolnej ziemi',
  train: 'Szkol hoplitów',
  trainHint: 'Uzbrój {n} robotników jako hoplitów za {c} drachm.',

  // Diplomacy panel
  warsTitle: 'Wojny',
  noWars: 'Pokój z całą Helladą',
  targetHint: 'Kliknij inną polis na mapie, by z nią pertraktować.',
  atWar: 'Wojna',
  atPeace: 'Pokój',
  fallen: 'Upadła',
  fallenTo: 'Podbita przez polis {b}',
  declareWar: 'Wypowiedz wojnę',
  declareWarHint: 'Twoje armie wyruszą i zaczną zagarniać jej ziemię.',
  offerPeace: 'Zaproponuj pokój',
  offerPeaceHint: 'Wróg przyjmie pokój, jeśli jesteś wyraźnie silniejszy albo wojna się przeciąga.',
  peaceCooldown: 'Posłowie są w drodze powrotnej',

  // Chronicle (event feed)
  chronicle: 'Kronika',
  evWar: 'Polis {a} wypowiada wojnę polis {b}',
  evPeace: '{a} i {b} zawierają pokój',
  evPeaceRefused: 'Polis {b} odrzuca pokój z polis {a}',
  evSettle: 'Osadnicy z polis {a} ruszają w dzicz',
  evColony: 'Polis {a} zakłada kolonię za morzem',
  evFall: 'Polis {a} upada, podbita przez polis {b}',

  // End of game
  victoryTitle: 'Hegemonia nad Helladą',
  victoryDesc: 'Polis {a} panuje nad Grecją. Poeci będą o tym śpiewać przez wieki.',
  defeatTitle: 'Twoja polis upadła',
  defeatDesc: 'Polis {a} została podbita przez polis {b}. W jej świątyniach składa się teraz obce ofiary.',
  playAgain: 'Zagraj ponownie',

  // Map hover
  hoverPolis: '{name} · {pop} mieszkańców',
  hoverWild: 'Dzicz',
  hoverForeign: 'Ziemie barbarzyńców, poza Helladą',

  polisNames: {
    athens: 'Ateny',
    sparta: 'Sparta',
    corinth: 'Korynt',
    thebes: 'Teby',
    argos: 'Argos',
    chalkis: 'Chalkis',
    elis: 'Elida',
    larisa: 'Larisa',
    korkyra: 'Korkyra',
    ambracia: 'Ambrakia',
    potidaea: 'Potidaja',
    thasos: 'Tasos',
    mytilene: 'Mitylena',
    chios: 'Chios',
    samos: 'Samos',
    naxos: 'Naksos',
    knossos: 'Knossos',
    lindos: 'Lindos'
  }
};
