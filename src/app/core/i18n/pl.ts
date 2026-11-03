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
      term: 'Klawiatura',
      desc: 'Spacja wstrzymuje grę, 1–5 ustawiają prędkość, B otwiera budżet, Esc zwija boczny panel.'
    },
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
      desc: 'Zależy od udziału kolonizacji w budżecie: każda wyprawa kosztuje drachmy z tego funduszu i na zawsze zabiera 10% twoich robotników. Osadnicy powoli zajmują wolną ziemię przy granicach — a gdy wybrzeże się zapełni, zakładają kolonię za morzem. Więcej ziemi to większa pojemność, a każdy nowy piksel trwale przyspiesza przyrost ludności i dochody.'
    },
    {
      term: 'Militaryzm i kultura',
      desc: 'Każda polis ma charakter oceniony w skali 1–5. Militaryzm nieznacznie wzmacnia jej armie i garnizon w bitwie (+4% za punkt), a kultura zwiększa dochody (+8% za punkt).'
    },
    {
      term: 'Budżet',
      desc: 'Okno budżetu po lewej dzieli cały dochód między pięć funduszy — wojsko, kolonizację, rolnictwo, handel i kulturę — suwakami, które zawsze sumują się do 100% (żaden poniżej 5%). Każdy fundusz sam wydaje pieniądze: wojsko opłaca żołd, wznosi swoje budowle i szkoli hoplitów; kolonizacja wysyła osadników i zakłada kolonie; rolnictwo i handel wznoszą budowle, a potem farmy i porty; kultura urządza święta.'
    },
    {
      term: 'Rozwój okolic',
      desc: 'Fundusze rolnictwa i handlu zakładają farmy (ziemia wyżywi 2500 osób więcej) i porty (+12% dochodów); powstają po 1–12 miesiącach, zwykle na nizinie nad morzem, nie tuż pod murami miasta. Fundusz kolonizacji, gdy okoliczna dzicz zostanie zasiedlona, zakłada kolonie w historycznych miejscach — polis-wasale, które walczą we wszystkich twoich wojnach.'
    },
    {
      term: 'Budowle polis',
      desc: 'Przycisk Budowle otwiera trzy drzewa — rolnictwo, handel i wojsko — po sześć budowli, odblokowywanych po kolei. Każde drzewo opłaca jego fundusz w budżecie, który kupuje kolejną budowlę, gdy tylko uzbiera dość pieniędzy; budowa trwa rok, kosztuje część zadowolenia obywateli i daje bonus całej polis.'
    },
    {
      term: 'Zadowolenie',
      desc: 'Zadowoleni obywatele szybciej pracują i się mnożą (×0,7 przy 0%, ×1,3 przy 100%). Zadowolenie spada, gdy przegrywasz bitwy lub tracisz ziemię, zasiedlasz dzicz, budujesz albo powołujesz hoplitów; rośnie w spokojnych czasach, dzięki zyskom z handlu, wygranym bitwom i wojnom oraz wysokiej projekcji siły. Po zakończeniu wojny dostajesz raport z jej bilansem.'
    },
    {
      term: 'Handel morski',
      desc: 'Polis nad morzem wysyła małe statki kupieckie do portów nadmorskich polis, z którymi nie prowadzi wojny. Każdy ukończony rejs daje właścicielowi 1 drachmę, powiększoną przez kulturę (+8% za punkt), a miastu docelowemu 30% tej kwoty. Każdy port pozwala wysłać jednocześnie o jeden statek więcej.'
    },
    {
      term: 'Zwycięstwa i projekcja siły',
      desc: 'Każda bitwa wygrana przez twoją armię lub garnizon zatrzymuje grę i daje raport: trochę złota, 15% pokonanej armii jako jeńców pracujących na twoich polach (liczą się jako robotnicy) oraz punkt projekcji siły. Projekcja siły zniechęca rywali do ataku, sprowadza poselstwa z propozycją sojuszu i przyciąga statki kupieckie do twoich portów. Sojusznicy ruszają ci z pomocą, gdy ktoś wypowie ci wojnę.'
    },
    {
      term: 'Robotnicy',
      desc: 'Cywile zdolni do pracy fizycznej. Zarabiają drachmy, zostają osadnikami i są uzbrajani jako hoplici.'
    },
    {
      term: 'Hoplici',
      desc: 'Twoi wojownicy, szkoleni i opłacani z funduszu wojskowego. Strzegą stolicy, a w czasie wojny wyruszają w małych armiach. Gdy fundusz wojskowy się wyczerpie, nieopłaceni hoplici dezerterują.'
    },
    {
      term: 'Wojna',
      desc: 'Wypowiedz wojnę polis, a twoje armie same ruszą w pole, zagarniając wrogie piksele jeden po drugim. Wrogie terytorium jest prążkowane. Zdobycie stolicy wroga wymaga pokonania jej garnizonu — i oznacza aneksję całej polis.'
    },
    {
      term: 'Armia główna i oddziały łupieżcze',
      desc: 'Na wojnie polis wystawia od dwóch do pięciu armii. Armia główna (większa tarcza) bierze mniej więcej połowę wolnych hoplitów i szuka starcia z armią główną wroga; mniejsze oddziały łupią ziemie przeciwnika i uciekają przed każdą siłą zbliżoną do swojej. Armia główna słabsza od wrogiej zatrzymuje się i okopuje (pierścień palisady): w ciągu kilku lat jej siła rośnie do 150%, a każda wroga armia, która podejdzie na 30 pól, zostaje zaatakowana. Kilku hoplitów zawsze zostaje za murami.'
    },
    {
      term: 'Oblężenia i upadek polis',
      desc: 'Armia, która dotrze do stolicy wroga, obozuje pod jej murami przez mniej więcej dwa i pół roku, zanim przypuści szturm. W tym czasie oblężonemu miastu spada zadowolenie, ludność prawie nie przybywa, a garnizon głoduje — ale oblegający też topnieją. Upadła polis rzadko znika z mapy: może przetrwać jako miasto w granicach zwycięzcy albo zostać państwem klienckim, które płaci daninę w drachmach i robotnikach. Polis założycielskie trudno zrównać z ziemią, młode kolonie — łatwo. Czasem w chaosie oderwie się zupełnie nowa polis.'
    },
    {
      term: 'Podbój',
      desc: 'Gdy twoja armia zdobędzie stolicę wroga, gra się zatrzymuje, a ty decydujesz o losie miasta, kończąc wojnę: zburz je (zwykle złoto i niewolnicy, czasem rewolta, która je odradza), podporządkuj (zwykle państwo klienckie płacące daninę, w innym razie duży okup) albo wymuś sojusz.'
    },
    {
      term: 'Reputacja dyplomatyczna',
      desc: 'Każda para polis ma reputację od −100 do +100, która dryfuje wokół neutralności. Wojny, wspólne granice i duże armie ją obniżają; kultura, projekcja siły i zadowoleni obywatele bardzo powoli podnoszą. Sąsiedzi częściej się kłócą i wypowiadają sobie wojny — z wyjątkiem wyspiarskich Samos, Naksos, Korkyry i Chios.'
    },
    {
      term: 'Bitwa',
      desc: 'Gdy spotkają się dwie wrogie armie, znikają w chmurze bójki, a przechodzące obok armie dołączają do swoich. Wychodzi z niej tylko jedna strona; zwykle silniejsza, ale nie zawsze. Armia, która napotka wroga dwa i pół raza silniejszego, wycofuje się, gubiąc maruderów, a czasem rozpada się na dwie mniejsze. Ziemia zajęta przez armię nie zawsze zostaje przy zdobywcy — 20% jej, a daleko od domu nawet połowa, pustoszeje i wraca do dziczy. Samotne skrawki ziemi (do czterech pikseli) odcięte od stolicy po około czterech latach również wracają do dziczy.'
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
  flagOf: 'Chorągiew polis {name}',
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
  statDrachmaeHint: 'Skarbiec ze wszystkich pięciu funduszy budżetu i dochód netto na miesiąc (po odliczeniu żołdu).',
  statTerritoryHint: 'Udział we wszystkich ziemiach greckich.',
  statGrowthHint: 'Mnożnik przyrostu i dochodów zdobyty dzięki zasiedlaniu dziczy.',
  settle: 'Zasiedlaj dzicz',
  settleHint: 'Wyślij 10% robotników ({n}), by zajęli dziką ziemię. Więcej ziemi przyspiesza przyrost ludności i dochody.',
  settling: 'Zasiedlanie… {p}%',
  settleNoLand: 'Brak wolnej ziemi',
  // Budget
  budget: 'Budżet',
  budgetHint:
    'Cały dochód — podatki, handel, łupy i daniny — trafia do pięciu funduszy. Każdy fundusz sam opłaca swoje przedsięwzięcia, gdy tylko uzbiera dość pieniędzy.',
  budgetRule: 'Udziały zawsze sumują się do 100%; żaden nie spadnie poniżej 5%. Żołd hoplitów pochodzi z funduszu wojskowego.',
  budgetKeys: {
    military: {
      name: 'Wojsko',
      desc: 'Opłaca żołd hoplitów, wznosi budowle wojskowe i szkoli hoplitów. Większy udział to większa armia (do 40% robotników) werbowana większymi partiami; po zmniejszeniu udziału nadwyżka hoplitów wraca do pracy.'
    },
    colonization: {
      name: 'Kolonizacja',
      desc: 'Jedyny sposób zasiedlania dziczy: opłaca wyprawy, które zabierają 10% robotników, by zająć nową ziemię; gdy w pobliżu zabraknie wolnej ziemi, zakłada kolonie w historycznych miejscach.'
    },
    agriculture: { name: 'Rozwój rolnictwa', desc: 'Wznosi budowle rolnicze, potem zakłada nowe farmy.' },
    trade: { name: 'Rozwój handlu', desc: 'Wznosi budowle handlowe, potem buduje nowe porty.' },
    culture: { name: 'Rozwój kultury', desc: 'Urządza święta: zadowolenie, powoli rosnąca kultura i odrobina projekcji siły.' }
  },
  purchases: {
    hoplites: 'hoplici',
    expedition: 'wyprawa osadników',
    colony: 'nowa kolonia',
    farm: 'nowa farma',
    port: 'nowy port',
    festival: 'święto'
  },
  nextPurchase: 'dalej: {what} ({c})',
  savingOnly: 'oszczędza',
  armyStatus: 'armia {w} / docelowo {t} hoplitów',
  expeditionUnderway: 'osadnicy w drodze — {p}%',
  fundedBy: 'fundusz „{budget}”: {f} / {c} dr',
  developTitle: 'Mierniczowie wyruszają',
  developFarm: 'Za {m} w twojej okolicy powstaną nowe farmy.',
  developPort: 'Za {m} na twoim wybrzeżu stanie port.',
  developVassal: 'Za {m} koloniści założą polis {site} — twojego wasala.',
  developAction: 'Dobrze',
  monthsOne: '{n} miesiąc',
  monthsFew: '{n} miesiące',
  monthsMany: '{n} miesięcy',
  statMilitarism: 'Militaryzm',
  statCulture: 'Kultura',
  statMilitarismHint: 'Nieznacznie wzmacnia armie i garnizon w bitwie (+4% za punkt).',
  statCultureHint: 'Zwiększa dochody z rzemiosła, handlu i świąt (+8% za punkt).',
  farms: 'Farmy',
  ports: 'Porty',
  vassals: 'Wasale',
  ships: 'Statki',
  allies: 'Sojusznicy',
  ally: 'Sojusznik',
  statPrestige: 'Projekcja siły',
  statPrestigeHint:
    'Zdobywana w wygranych bitwach. Rywale zastanowią się dwa razy, zanim cię zaatakują, miasta mogą zaproponować ci sojusz, a kupcy wolą twoje porty.',
  slavesHint: 'W tym {n} jeńców wziętych w bitwach.',
  satisfaction: 'Zadowolenie',
  satisfactionHint:
    'Dochody i przyrost ×{m}. Spada, gdy przegrywasz bitwy lub tracisz ziemię, zasiedlasz dzicz, budujesz albo powołujesz hoplitów; rośnie w spokojnych czasach, dzięki handlowi, zwycięstwom i projekcji siły.',

  // Polis screen
  openPolis: 'Otwórz budowle polis: trzy drzewa ulepszeń z bonusami dla całego państwa',
  buildings: 'Budowle',
  polisScreenIntro: 'każda budowla powstaje rok i kosztuje drachmy oraz część przychylności obywateli.',
  trees: { agriculture: 'Rolnictwo', trade: 'Handel', military: 'Wojsko' },
  improvements: {
    granary: { name: 'Spichlerz', desc: 'Zapasy ziarna na chude lata: +8% pojemności ziemi.' },
    irrigation: { name: 'Kanały nawadniające', desc: 'Woda doprowadzona ze źródeł: +10% pojemności ziemi.' },
    olives: { name: 'Gaje oliwne', desc: 'Oliwa do lamp, kuchni i na eksport: +10% dochodów.' },
    vineyards: { name: 'Winnice', desc: 'Wino i święta: +5% dochodów, zadowolenie szybciej wraca.' },
    terraces: { name: 'Tarasy na zboczach', desc: 'Osadnicy oswajają stoki: każdy zajmuje 25% więcej ziemi, +5% pojemności.' },
    demeter: { name: 'Sanktuarium Demeter', desc: 'Bogini błogosławi żniwom: +15% przyrostu ludności, +10% pojemności.' },
    agora: { name: 'Agora', desc: 'Plac targowy w sercu miasta: +8% dochodów.' },
    mint: { name: 'Mennica', desc: 'Srebrne monety z godłem miasta: +10% dochodów.' },
    shipyard: { name: 'Stocznia', desc: 'Pochylnie dla statków kupieckich: o jeden statek handlowy więcej.' },
    guild: { name: 'Gildia kupców', desc: 'Umowy i kredyt: rejsy handlowe dają +50%.' },
    emporion: { name: 'Emporion', desc: 'Faktorie za morzem: rozwój polis tańszy o 20%, o jeden statek więcej.' },
    treasury: { name: 'Skarbiec w Delfach', desc: 'Lśniący dar dla Apollina: +2 projekcji siły, +10% dochodów.' },
    gymnasium: { name: 'Gimnazjon', desc: 'Młodzi ćwiczą nago: hoplici tańsi o 20%.' },
    armoury: { name: 'Zbrojownia', desc: 'Brązowe hełmy i nagolenice dla wszystkich: +5% siły w bitwie.' },
    walls: { name: 'Mury miejskie', desc: 'Ciosowe mury wokół akropolu: garnizon walczy o 30% mocniej.' },
    drill: { name: 'Musztra falangi', desc: 'Tarcza przy tarczy, krok w krok: +7% siły w bitwie.' },
    barracks: { name: 'Koszary', desc: 'Wspólne posiłki obywateli-żołnierzy: o jedną armię więcej, marsz szybszy o 15%.' },
    ares: { name: 'Świątynia Aresa', desc: 'Łaska boga wojny: +2 projekcji siły, +5% siły w bitwie.' }
  },
  buildCost: '{d} dr · −{s}%',
  built: 'Zbudowano',
  underConstruction: 'W budowie…',
  lockedHint: 'Wymaga poprzedniej budowli',

  // War report
  warEndTitle: 'Wojna z polis {name} dobiegła końca',
  warEndConquest: 'Polis {name} została zrównana z ziemią',
  warEndCity: 'Polis {name} przetrwała jako miasto w granicach zwycięzcy',
  warEndClient: 'Polis {name} stała się państwem klienckim',
  warEndRevolt: 'Polis {name} wznieciła rewoltę i znów jest wolna',
  warEndRansom: 'Polis {name} zapłaciła okup i pozostaje wolna',
  warEndAlliance: 'Polis {name} jest teraz twoim sojusznikiem',
  warEndPeace: 'Zaprzysiężono pokój',
  warDuration: 'Czas trwania',
  yearsOne: '{n} rok',
  yearsFew: '{n} lata',
  yearsMany: '{n} lat',
  warBattles: 'Bitwy',
  warBattlesValue: 'wygrane {w} · przegrane {l}',
  warLand: 'Ziemia',
  warLandValue: '+{g} km² · −{l} km²',
  warSpoils: 'Łupy',
  warSpoilsValue: '{g} dr · {c} jeńców',
  warMoodValue: '{n}%',
  warEndAction: 'Niech tak będzie',
  buildingsHint:
    'Farmy, porty i polis-wasale powstałe dzięki rozwojowi, sojusznicy oraz statki kupieckie na morzu. Każdy rejs do przyjaznego portu daje {v} drachmy (z handlu dotąd {t}); miasto docelowe dostaje dodatkowo 30% tej kwoty.',
  vassalOf: 'Wasal polis {b}',
  clientOf: 'Państwo klienckie polis {b}',
  underSiege: 'Oblężenie!',
  underSiegeHint: 'Wrogie armie obozują pod murami: zadowolenie spada, ludność prawie nie przybywa, a garnizon głoduje aż do szturmu.',
  tributeHint: 'Państwa klienckie zapłaciły dotąd {g} drachm i przysłały {w} robotników.',

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
  evFall: 'Polis {a} zostaje zrównana z ziemią przez polis {b}',
  evFarm: 'Polis {a} zakłada nowe farmy',
  evPort: 'Polis {a} buduje port',
  evVassal: 'Polis {a} zakłada polis {b} — swojego wasala',
  evAlliance: 'Polis {a} i polis {b} zawierają sojusz',
  evSiege: 'Polis {a} oblega polis {b}',
  evClient: 'Polis {a} staje się państwem klienckim polis {b}',
  evAnnexed: 'Polis {a} trwa odtąd w granicach polis {b}',
  evSecession: 'Polis {b} oderwała się od polis {a}',
  evCaptured: 'Polis {b} zdobywa polis {a}',
  evRevolt: 'Polis {a} buntuje się przeciw polis {b}',
  evRansom: 'Polis {a} wykupuje wolność od polis {b}',
  evFestival: 'Polis {a} urządza wielkie święto',
  evFarmPlanned: 'Mierniczowie wytyczają nowe farmy — gotowe za {m}',
  evPortPlanned: 'Rusza budowa nowego portu — gotowy za {m}',
  evBuilt: '{a} ukończyła budowę: {w}',

  // Conquest decision
  conquestTitle: 'Polis {name} u twoich stóp',
  conquestSubtitle: 'Mury padły. Zdecyduj o losie miasta — to zakończy wojnę.',
  conquestRaze: 'Zburz miasto',
  conquestRazeDesc: '80%: miasto zostaje zburzone, a jego złoto i wielu niewolników przypada tobie. 20%: obywatele wzniecają rewoltę i polis odradza się.',
  conquestSubjugate: 'Podporządkuj',
  conquestSubjugateDesc: '60%: staje się twoim państwem klienckim i płaci daninę w drachmach i robotnikach. 40%: wykupuje wolność dużym okupem i pozostaje niezależna.',
  conquestAlliance: 'Wymuś sojusz',
  conquestAllianceDesc: 'Na pewno zostaje twoim sojusznikiem, a na pocieszenie dostajesz trochę złota.',

  // Diplomatic reputation
  relation: 'Relacje',
  relationHint:
    'Reputacja dyplomatyczna między twoją polis a tą (od −100 do +100). Z czasem wraca ku neutralności; wojny, wspólne granice i duże armie ją psują, a kultura, projekcja siły i zadowoleni obywatele (powyżej 70%) bardzo powoli poprawiają. Złe relacje zachęcają do wojny, dobre — do pokoju, sojuszy i handlu.',
  relationLevels: { hostile: 'wrogie', unfriendly: 'chłodne', neutral: 'neutralne', friendly: 'przyjazne', cordial: 'serdeczne' },
  evAllianceOffer: 'Polis {a} wysyła posłów do polis {b}',

  // Battle report
  reportTitle: 'Zwycięstwo!',
  reportNear: 'W pobliżu polis {place}',
  reportBattles: 'Wygrane bitwy: {n}',
  reportGold: 'Łupy',
  reportGoldValue: '+{n} drachm',
  reportSlaves: 'Jeńcy zmuszeni do pracy',
  reportSlavesValue: '+{n} robotników',
  reportPrestigeValue: '+{n} (teraz {t})',
  reportLosses: 'Polegli',
  reportLossesValue: 'wróg {e} · nasi {o}',
  reportAction: 'Naprzód!',

  // Embassy (alliance offer)
  embassyTitle: 'Poselstwo z polis {name}',
  embassySubtitle: 'U twoich bram czekają posłowie z gałązkami oliwnymi.',
  embassyTexts: {
    victories:
      'Cała Hellada mówi o waszych zwycięstwach. Polis {name} proponuje wam sojusz: jeśli ktokolwiek wypowie wam wojnę, staniemy u waszego boku — a wy u naszego.',
    trade:
      'Nasze statki dobrze znają wasze porty, a nasi kupcy bogacą się na waszej oliwie. Polis {name} chce związać nasze miasta czymś więcej niż handel: sojuszem wzajemnej obrony.',
    commonEnemy:
      'I wy, i my stawiamy czoła polis {enemy}. Polis {name} proponuje, byśmy stanęli razem: sojusz, w którym każdy rusza, gdy drugi zostanie zaatakowany.',
    neighbour:
      'Nasze pola stykają się z waszymi, a dobry płot czyni dobrych sąsiadów — jeszcze lepiej, dobrych sojuszników. Polis {name} proponuje sojusz wzajemnej obrony.',
    goodwill: 'Polis {name} przysyła dary i pozdrowienia oraz proponuje sojusz: jeśli ktokolwiek wypowie wam wojnę, staniemy u waszego boku — a wy u naszego.'
  },
  embassyWars: 'W stanie wojny z',
  embassyWarning: 'Przyjęcie sojuszu oznacza natychmiastowe przystąpienie do tych wojen.',
  topBarLabel: 'Twoja polis w skrócie',
  perMonth: '{n}/mies.',
  topHoplitesHint: 'Hoplici pod bronią teraz / armia, do której dąży budżet wojskowy. Podnieś suwak Wojsko, by ją powiększyć; obniż go, a ludzie wrócą na pola.',
  topSatisfactionHint: 'Jak zadowoleni są obywatele. Powyżej 70% rośnie wasza reputacja i praca idzie szybciej; niskie zadowolenie spowalnia wzrost i dochody.',
  speedN: 'Prędkość {n}×',
  drawerLabel: 'Panele polis',
  drawerCollapse: 'Zwiń panel',
  drawerExpand: 'Rozwiń panel',
  tabs: { budget: 'Budżet', polis: 'Polis', diplomacy: 'Dyplomacja', chronicle: 'Kronika i wykresy' },
  outlinerTitle: 'Sytuacja',
  outlinerToggle: 'Pokaż lub ukryj panel sytuacji',
  outWars: 'Wojny',
  outAllies: 'Sojusznicy',
  outSieges: 'Oblężenia',
  outLatest: 'Ostatnie wieści',
  outNoAllies: 'Brak sojuszników.',
  outNoSieges: 'Żadne miasto nie jest oblegane.',
  outSiegeOurs: 'Nasza armia oblega: {b}',
  outSiegeTheirs: '{a} oblega: {b}',
  outAdvantageHint: 'Hoplici — nasi: {a}, ich: {b}',
  mapModes: 'Tryb mapy',
  viewRelations: 'Relacje',
  dipListHint: 'Wszystkie miasta Hellady i ich stosunek do was. Kliknij, by otworzyć kartę miasta.',
  standings: { war: 'Wojna', ally: 'Sojusznik', vassal: 'Wasal', client: 'Klient', peace: 'Pokój' },
  chronicleEmpty: 'Nie wydarzyło się jeszcze nic godnego zapisania.',
  alertsLabel: 'Alerty',
  etaNow: 'teraz',
  chartIncome: 'Dochód miesięczny',
  chartBuilt: 'Zbudowano: {w}',
  chartWar: 'Wojna z: {name}',
  chartPeace: 'Pokój z: {name}',
  chartsLegend: 'Szare kreski to zmiany budżetu, czerwone wojny, zielone pokój, złote nowe budowle. Najedź na wykres, by zobaczyć liczby.',
  chartsEmpty: 'Wykresy wypełnią się z upływem lat.',
  incWorkers: 'Praca robotników ({n})',
  incCulture: 'Kultura',
  incPorts: 'Porty',
  incBuildings: 'Budowle',
  incMood: 'Zadowolenie',
  incOther: 'Handel morski, danina, łupy',
  incUpkeep: 'Żołd hoplitów',
  incTotal: 'Do funduszy',
  etaYears: '~{n} roku',
  presetsLabel: 'Gotowe ustawienia budżetu',
  presets: { balanced: 'Zrównoważony', war: 'Gospodarka wojenna', expansion: 'Ekspansja', mercantile: 'Kupiecki', golden: 'Złoty wiek', custom: 'Własny' },
  presetHints: {
    balanced: 'Po równej jednej piątej dla każdego funduszu.',
    war: 'Połowa wszystkiego na wojsko: więcej hoplitów, szybciej.',
    expansion: 'Najpierw osadnicy i kolonie.',
    mercantile: 'Porty, statki i budowle handlowe.',
    golden: 'Festyny i kultura, a handel na nie zarabia.'
  },
  fcNext: '{what} za {t}',
  fcStalled: 'nie przy tym tempie',
  fcHoplites: '+{t} hoplitów/rok',
  fcPay: 'żołd {u} dr/mies.',
  fcDesert: 'Dezercja za {t}',
  fcFarm: '+{n} pojemności ziemi',
  fcPort: '+{n}% dochodu',
  fcFestival: '+{n}% zadowolenia',
  fcExpedition: '−{n} robotników',
  fcColonyOnly: 'Brak wolnej ziemi — tylko kolonie zamorskie',
  fcIdle: 'nic do kupienia — udział przechodzi do innych funduszy',
  fcBlocked: 'brak wolnej ziemi w zasięgu — udział przechodzi do innych funduszy',
  alertOpen: 'kliknij, by przeczytać',
  alertSiege: 'Nasza stolica jest oblężona! Podnieś suwak Wojsko albo szukaj pokoju.',
  alertSiegeAlly: 'Nasz sojusznik {name} jest oblężony.',
  alertDeserting: 'Hoplici dezerterują: ich żołd przewyższa wpływy funduszu wojskowego. Podnieś suwak Wojsko albo pozwól armii się zmniejszyć.',
  alertAllyWar: 'Sojusznicy w stanie wojny: {names}.',
  alertColonyBlocked: 'Kolonizacja utknęła: w zasięgu nie ma wolnej ziemi ani miejsc na kolonie. Jej udział przechodzi do innych funduszy.',
  alertFundIdle: 'Fundusz „{fund}” nie ma na co wydawać; jego udział przechodzi do innych funduszy. Rozważ przesunięcie suwaka.',
  alertVictory: 'Zwycięstwo pod: {place}',
  alertWarEnd: 'Koniec wojny z: {name}',
  alertDevelop: 'Raport mierniczych o nowych pracach',
  embassyAccept: 'Przyjmij sojusz',
  embassyDecline: 'Odeślij posłów',

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
