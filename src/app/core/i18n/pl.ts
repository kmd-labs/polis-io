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
  viewRelief: 'Rzeźba terenu',
  viewFertility: 'Żyzność gleby',
  loadingMap: 'Kreślimy wybrzeża Hellady…',
  loadingTerrain: 'Wypiętrzamy góry…',
  loadError: 'Nie udało się wczytać mapy. Odśwież stronę.',
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
      term: 'Ukształtowanie terenu',
      desc: 'Każdy piksel ma prawdziwą wysokość. Osadnicy rozlewają się jak woda — najpierw po nizinach i dolinach, na końcu po wzgórzach i górach. Niziny są żyźniejsze, a armie wolniej maszerują przez wysokie tereny.'
    },
    {
      term: 'Zasiedlanie dziczy',
      desc: 'Wysyła na zawsze 10% twoich robotników. Powoli zajmują wolną ziemię przy granicach — a gdy wybrzeże się zapełni, zakładają kolonię za morzem. Więcej ziemi to większa pojemność, a każdy nowy piksel trwale przyspiesza przyrost ludności i dochody.'
    },
    {
      term: 'Militaryzm i kultura',
      desc: 'Każda polis ma charakter oceniony w skali 1–5. Militaryzm nieznacznie wzmacnia jej armie i garnizon w bitwie (+4% za punkt), a kultura zwiększa dochody (+8% za punkt).'
    },
    {
      term: 'Rozwój polis',
      desc: 'Wydaj drachmy na rozwój. Zwykle powstaje farma (ziemia wyżywi 2500 osób więcej) albo port (większe dochody z handlu). W jednym przypadku na dziesięć w pobliskim historycznym miejscu powstaje małe nowe polis — twój wasal, który walczy we wszystkich twoich wojnach.'
    },
    {
      term: 'Handel morski',
      desc: 'Polis nad morzem wysyła małe statki kupieckie do portów nadmorskich polis, z którymi nie prowadzi wojny. Każdy ukończony rejs daje 1 drachmę, powiększoną przez kulturę (+8% za punkt). Każdy port pozwala wysłać jednocześnie o jeden statek więcej.'
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

  // Start screen
  chooseTitle: 'Wybierz swoją polis',
  startEyebrow: 'Hellada · 600 p.n.e.',
  startIntro:
    'Wieki ciemne minęły. Wśród gór i wysp Grecji stoi osiemnaście miast-państw, a dzika ziemia między nimi czeka na tego, kto ją zajmie.',
  startHint: 'Wybierz miasto-państwo z listy albo na mapie',
  startLead: 'Prowadź: {name}',
  statArea: 'Ziemia',
  areaKm2: '{n} km²',

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
  develop: 'Rozwijaj polis',
  developHint:
    'Wydaj {c} drachm: zwykle farma (ziemia wyżywi 2500 osób więcej) albo port (+12% dochodów); raz na dziesięć — małe polis-wasal, które walczy u twojego boku.',
  statMilitarism: 'Militaryzm',
  statCulture: 'Kultura',
  statMilitarismHint: 'Nieznacznie wzmacnia armie i garnizon w bitwie (+4% za punkt).',
  statCultureHint: 'Zwiększa dochody z rzemiosła, handlu i świąt (+8% za punkt).',
  farms: 'Farmy',
  ports: 'Porty',
  vassals: 'Wasale',
  ships: 'Statki',
  buildingsHint:
    'Farmy, porty i polis-wasale powstałe dzięki rozwojowi oraz statki kupieckie na morzu. Każdy rejs do przyjaznego portu daje {v} drachmy (dotąd {t}).',
  vassalOf: 'Wasal polis {b}',

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
  evFarm: 'Polis {a} zakłada nowe farmy',
  evPort: 'Polis {a} buduje port',
  evVassal: 'Polis {a} zakłada polis {b} — swojego wasala',

  // War letters
  letterTitle: 'List z polis {name}',
  letterDeclares: 'Polis {name} wypowiada ci wojnę.',
  letterAction: 'Do broni!',
  letterGeneric: {
    sender: 'Rada polis {name}',
    taunt: 'Wasze spichrze są puste, a mury bez obrońców. Przychodzimy wziąć to, czego nie umiecie utrzymać.',
    challenge: 'Byliśmy waszymi dziećmi, teraz jesteśmy wam równi. Niech włócznia rozstrzygnie, komu sprzyjają bogowie.'
  },
  letters: {
    athens: {
      sender: 'Solon, archont Ateńczyków',
      taunt: 'Solon powiedział, że nie macie ani pieniędzy, ani wojska. To dobrze. Nasze nowe prawa potrzebują nowych pól.',
      challenge: 'Solon chwali wasze miasto, ale Attyka jest za ciasna dla naszych dzieci. Niech bogowie nas rozsądzą.'
    },
    sparta: {
      sender: 'Chilon, efor Lacedemończyków',
      taunt: 'Krótko: jesteście słabi. Idziemy.',
      challenge: 'Jeśli.'
    },
    corinth: {
      sender: 'Periander, tyran Koryntu',
      taunt: 'Periander przeszedł przez pole pszenicy i ściął najwyższe kłosy. Wasze nie sięgały mu nawet do kolan.',
      challenge: 'Dwa morza płacą Koryntowi myto. Wy też zapłacicie — srebrem albo krwią.'
    },
    thebes: {
      sender: 'Beotarchowie Teb',
      taunt: 'Kadmos zasiał zęby smoka i wyrośli z nich wojownicy. Na waszych polach rosną tylko wymówki.',
      challenge: 'Równina beocka rodzi silnych ludzi. Przyjdźcie się z nimi zmierzyć.'
    },
    argos: {
      sender: 'Dziedzice Fejdona, królowie Argos',
      taunt: 'Fejdon dał Helladzie miary i wagi. Zważyliśmy wasze wojsko — jest za lekkie.',
      challenge: 'Argos jest starsze niż wasi bogowie. Wasze mury są młodsze niż nasze oliwki.'
    },
    chalkis: {
      sender: 'Hippoboci z Chalkis',
      taunt: 'Nasz brąz jest ostrzejszy niż wasz rozum i liczniejszy niż wasi hoplici.',
      challenge: 'Chalkis zakładało miasta od Sycylii po Trację. Wasze będzie następnym, które odbudujemy.'
    },
    elis: {
      sender: 'Hellanodikowie z Elidy',
      taunt: 'Nawet święty rozejm nie ochroni miasta z pustymi rękami. Szykujcie się na klęskę.',
      challenge: 'Olimpia uczy, że wieniec oliwny zdobywa najsilniejszy. Zmierzmy się o niego.'
    },
    larisa: {
      sender: 'Aleuadzi z Larisy',
      taunt: 'Nasze konie widziały wasze wojsko. Nie zrobiło na nich wrażenia.',
      challenge: 'Jazda tesalska od lat nie miała godnego przeciwnika. Wyjedźcie jej naprzeciw.'
    },
    korkyra: {
      sender: 'Admirałowie Korkyry',
      taunt: 'Wasz port jest cichy, a skarbiec jeszcze cichszy. Nasze triery to naprawią.',
      challenge: 'Postawiliśmy się samemu Koryntowi. Was się nie boimy.'
    },
    ambracia: {
      sender: 'Gorgos, tyran Ambrakii',
      taunt: 'Nawet dzicy Epiroci mają więcej włóczni niż wy. Weźmiemy waszą ziemię jak prezent.',
      challenge: 'Syn Kypselosa nie prosi dwa razy. Wasze pola albo wasi synowie.'
    },
    potidaea: {
      sender: 'Urzędnicy Potidai',
      taunt: 'Macedonia płaci nam za drewno, a wy zapłacicie nam za pokój — później.',
      challenge: 'Nasz przesmyk jest wąski, ale nasza wola — nie.'
    },
    thasos: {
      sender: 'Rada Tasos',
      taunt: 'Archiloch porzucił tarczę i przeżył, by z niej kpić. Wy nie macie nawet tarcz do porzucenia.',
      challenge: 'Nasze kopalnie złota kupują wiele włóczni. Policzcie swoje uważnie.'
    },
    mytilene: {
      sender: 'Pittakos z Mityleny',
      taunt: 'Pittakos mówi: poznaj swoją chwilę. Wasza minęła, nasza nadeszła.',
      challenge: 'Safona śpiewa o miłości, Alkajos o wojnie. Dziś lira gra dla Alkajosa.'
    },
    chios: {
      sender: 'Rada Chiończyków',
      taunt: 'Homer urodził się na Chios; zaśpiewa o tym, jak łatwo upadliście.',
      challenge: 'Nasze wino jest najlepsze w Helladzie. Wypijemy je na waszej agorze.'
    },
    samos: {
      sender: 'Geomorowie z Samos',
      taunt: 'Hera sprzyja odważnym, a wy nie jesteście ani odważni, ani bogaci.',
      challenge: 'Nasi inżynierowie przekopują góry. Wasze mury nie sprawią im kłopotu.'
    },
    naxos: {
      sender: 'Możni z Naksos',
      taunt: 'Rzeźbimy marmurowe lwy dla Delos. Dla was wystarczy jeden kamyk.',
      challenge: 'Dionizos kocha Naksos. Zobaczmy, kogo kocha Ares.'
    },
    knossos: {
      sender: 'Kosmoi z Knossos',
      taunt: 'Minotaur uznałby was za marny posiłek. My też.',
      challenge: 'Minos władał niegdyś tymi morzami. Knossos zamierza znów nimi władać.'
    },
    lindos: {
      sender: 'Kleobulos, tyran Lindos',
      taunt: 'Kleobulos uczy: miara jest najlepsza. Wasze wojsko jest poniżej wszelkiej miary.',
      challenge: 'Kleobulos uczy: miara jest najlepsza. Zmierzyliśmy was i uznaliśmy za godnego wroga.'
    }
  },

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
  hoverAltitude: '{m} m n.p.m.',

  // Cartographic labels
  peakOlympus: 'Olimp',

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
  },

  polisInfo: {
    athens: { region: 'Attyka', blurb: 'Gaje oliwne, srebro z Laurionu i niespokojne zgromadzenie. Solon właśnie spisał nowe prawa.' },
    sparta: { region: 'Lakonia', blurb: 'Państwo wojowników panujące nad helotami doliny Eurotasu, osłonięte Tajgetem i Parnonem.' },
    corinth: { region: 'Koryntia', blurb: 'Pani Przesmyku i dwóch mórz, bogata z ceł, ceramiki i handlu.' },
    thebes: { region: 'Beocja', blurb: 'Pierwsze miasto równiny beockiej, najżyźniejszej ziemi środkowej Grecji.' },
    argos: { region: 'Argolida', blurb: 'Odwieczna rywalka Sparty, dumna z legendarnych królów i żyznej równiny.' },
    chalkis: { region: 'Eubea', blurb: 'Kowale brązu i kolonizatorzy nad wąską cieśniną Euripos.' },
    elis: { region: 'Elida', blurb: 'Strażniczka Olimpii i świętego rozejmu pośród szerokich zachodnich nizin.' },
    larisa: { region: 'Tesalia', blurb: 'Arystokraci hodujący konie na największej równinie Grecji.' },
    korkyra: { region: 'Korfu', blurb: 'Bogata potęga morska u wrót Adriatyku, krnąbrna wobec Koryntu.' },
    ambracia: { region: 'Epir', blurb: 'Młoda kolonia Koryntu na skraju epirockiej dziczy.' },
    potidaea: { region: 'Chalkidyka', blurb: 'Placówka Koryntu na przesmyku Pallene, handlująca z Macedonią.' },
    thasos: { region: 'Tasos', blurb: 'Wyspa kopalń złota i wina naprzeciw trackiego brzegu.' },
    mytilene: { region: 'Lesbos', blurb: 'Ojczyzna Safony i Alkajosa, bogata w oliwki i pieśń liryczną.' },
    chios: { region: 'Chios', blurb: 'Słynie z wina i szkutników; twierdzi, że urodził się tu Homer.' },
    samos: { region: 'Samos', blurb: 'Potęga morska z wielką świątynią Hery i śmiałymi inżynierami.' },
    naxos: { region: 'Cyklady', blurb: 'Największa z Cyklad, rzeźbiąca marmurowe lwy dla bogów Delos.' },
    knossos: { region: 'Kreta', blurb: 'Dziedziczka minojskich pałaców pośród stu miast Krety.' },
    lindos: { region: 'Rodos', blurb: 'Kupieckie miasto Rodos u stóp akropolu Ateny Lindyjskiej.' }
  },

  siteNames: {
    tegea: 'Tegea', mantineia: 'Mantineja', sikyon: 'Sykion', epidauros: 'Epidauros', troizen: 'Trojzena',
    megara: 'Megara', plataea: 'Plateje', orchomenos: 'Orchomenos', delphi: 'Delfy', amphissa: 'Amfissa',
    naupaktos: 'Naupaktos', kalydon: 'Kalydon', pylos: 'Pylos', methone: 'Metone', gytheion: 'Gytejon',
    pharsalos: 'Farsalos', pherai: 'Fery', dion: 'Dion', olynthos: 'Olint', mende: 'Mende',
    stageira: 'Stagira', abdera: 'Abdera', maroneia: 'Maronea', amphipolis: 'Amfipolis', kassope: 'Kassope',
    dodona: 'Dodona', thermon: 'Termos', leukas: 'Leukas', ithaca: 'Itaka', zakynthos: 'Zakintos',
    kythera: 'Kytera', melos: 'Melos', paros: 'Paros', andros: 'Andros', tenos: 'Tenos', karystos: 'Karystos',
    eretria: 'Eretria', histiaia: 'Histiaja', lamia: 'Lamia', hermione: 'Hermiona', phleious: 'Fliunt',
    gortyn: 'Gortyna', kydonia: 'Kydonia', lyttos: 'Lyttos', ialysos: 'Ialysos', kos: 'Kos', methymna: 'Metymna',
    myrina: 'Myrina', samothrace: 'Samotraka', skiathos: 'Skiatos'
  }
};
