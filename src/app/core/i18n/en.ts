import { Dict } from './i18n.types';

export const EN: Dict = {
  htmlLang: 'en',
  docTitle: 'KMD · Polis',
  langName: 'English',
  appName: 'Polis',
  seoDescription:
    'A pixel real-time strategy game set in Archaic Greece, 600 BC. Lead a city-state, settle the wilderness and wage war for the hegemony of Hellas.',

  // Top HUD & Navigation
  changeLanguage: 'Language',
  chooseView: 'Map view',
  viewPolitical: 'Political map',
  viewRelief: 'Terrain relief',
  viewFertility: 'Soil fertility',
  loadingMap: 'Charting the coasts of Hellas…',
  loadingTerrain: 'Raising the mountains…',
  loadError: 'The map could not be loaded. Please refresh the page.',
  stageAriaLabel: 'Pixel map of Greece in 600 BC',

  // Bottom Dock & Glossary
  glossary: 'How to play',
  glossaryDesc:
    'Greece, 600 BC. The Dark Ages are over and dozens of city-states compete for land. Every pixel of the map belongs to a polis or is still wild.',
  glossaryItems: [
    {
      term: 'Polis',
      desc: 'An independent city-state. Click a temple on the map to inspect it; click any of its land to choose it at the start of the game.'
    },
    {
      term: 'Wilderness',
      desc: 'Grey pixels claimed by no one. Their soil fertility (see the “Soil fertility” view) decides how many people the land can feed.'
    },
    {
      term: 'Terrain',
      desc: 'Every pixel has a real elevation. Settlers spread like water — over low plains and valleys first, hills and mountains last. Lowlands are more fertile, and armies march slower over high ground.'
    },
    {
      term: 'Settle the wilderness',
      desc: 'Sends 10% of your workers away for good. They slowly claim free land next to your borders — or found a colony across the sea once your coast is full. More land raises your carrying capacity, and every new pixel permanently speeds up population growth and income.'
    },
    {
      term: 'Militarism & culture',
      desc: 'Every polis has a character rated 1–5. Militarism slightly strengthens its armies and garrison in battle (+4% per point); culture raises its income (+8% per point).'
    },
    {
      term: 'Developing the polis',
      desc: 'Spend drachmae on development. Usually you get a farm (the land feeds 2,500 more people) or a port (more trade income). In one case out of ten, a small new polis is founded on a nearby historical site — your vassal, which fights in all your wars.'
    },
    {
      term: 'Sea trade',
      desc: 'A polis on the coast sends small merchant ships to the harbours of coastal poleis it is not at war with. Every completed voyage earns the owner 1 drachma, raised by culture (+8% per point), and the receiving city 30% of that. Each port lets one more ship sail at a time.'
    },
    {
      term: 'Victories & power projection',
      desc: 'Every battle your army or garrison wins pauses the game with a report: a little gold, 15% of the beaten army taken captive to work your fields (they count as workers), and a point of power projection. Power projection makes rivals less eager to attack you, brings embassies offering alliances, and draws merchant ships to your harbours. Allies march to your aid when someone declares war on you.'
    },
    {
      term: 'Workers',
      desc: 'Civilians fit for physical labour. They earn drachmae, become settlers and are armed as hoplites.'
    },
    {
      term: 'Hoplites',
      desc: 'Your warriors. They garrison the capital and march out in small armies during war. Each one costs upkeep; unpaid hoplites desert.'
    },
    {
      term: 'War',
      desc: 'Declare war on a polis and your armies roam on their own, seizing enemy pixels one by one. Hostile territory is striped. Storming an enemy capital means beating its garrison — and annexing the whole polis.'
    },
    {
      term: 'Battle',
      desc: 'When two hostile armies meet, they vanish into a brawl cloud. Only one army walks out; the larger one usually wins, but not always.'
    },
    {
      term: 'Victory',
      desc: 'Hold half of the Greek land, or be the last polis standing. If your capital falls, the game is lost.'
    }
  ],
  close: 'Close',

  // Calendar & time controls
  yearBC: '{y} BC',
  yearAD: 'AD {y}',
  play: 'Resume',
  pause: 'Pause',
  speed: 'Game speed',
  fitMap: 'Fit map to screen',

  // Start screen
  chooseTitle: 'Choose your polis',
  startEyebrow: 'Hellas · 600 BC',
  startIntro:
    'The Dark Ages are over. Eighteen city-states stand among the mountains and islands of Greece, and the wild land between them is up for grabs.',
  startHint: 'Pick a city-state from the list or on the map',
  startLead: 'Lead {name}',
  statArea: 'Land',
  areaKm2: '{n} km²',

  // Player polis panel
  yourPolis: 'Your polis',
  statPopulation: 'Population',
  statWorkers: 'Workers',
  statWarriors: 'Warriors',
  statDrachmae: 'Drachmae',
  statTerritory: 'Territory',
  statGrowth: 'Prosperity',
  statPopulationHint: 'Everyone living in your polis: civilians and warriors.',
  statWorkersHint: 'Civilians fit for physical work. They produce income and can be sent as settlers.',
  statWarriorsHint: 'Hoplites in the garrison and in the field.',
  statDrachmaeHint: 'Treasury and income per second (after hoplite upkeep).',
  statTerritoryHint: 'Share of all Greek land you hold.',
  statGrowthHint: 'Growth and income multiplier earned by settling the wilderness.',
  settle: 'Settle the wilderness',
  settleHint: 'Send 10% of your workers ({n}) to claim wild land. More land speeds up population growth and income.',
  settling: 'Settling… {p}%',
  settleNoLand: 'No wilderness left',
  train: 'Train hoplites',
  trainHint: 'Arm {n} workers as hoplites for {c} drachmae.',
  develop: 'Develop the polis',
  developHint:
    'Spend {c} drachmae: usually a farm (+2,500 people the land can feed) or a port (+12% income); one time in ten, a small vassal polis that fights at your side.',
  statMilitarism: 'Militarism',
  statCulture: 'Culture',
  statMilitarismHint: 'Slightly strengthens armies and garrison in battle (+4% per point).',
  statCultureHint: 'Raises income from crafts, trade and festivals (+8% per point).',
  farms: 'Farms',
  ports: 'Ports',
  vassals: 'Vassals',
  ships: 'Ships',
  allies: 'Allies',
  ally: 'Ally',
  statPrestige: 'Power projection',
  statPrestigeHint:
    'Earned by winning battles. Rivals think twice before attacking you, cities may offer you an alliance, and merchants prefer your harbours.',
  slavesHint: 'Includes {n} captives taken in battle.',
  buildingsHint:
    'Farms, ports and vassal poleis created by development, allies, and merchant ships at sea. Each voyage to a friendly harbour earns {v} drachmae ({t} from trade so far); the receiving city gets 30% of that too.',
  vassalOf: 'Vassal of {b}',

  // Diplomacy panel
  warsTitle: 'Wars',
  noWars: 'At peace with all of Hellas',
  targetHint: 'Click another polis on the map to deal with it.',
  atWar: 'At war',
  atPeace: 'At peace',
  fallen: 'Fallen',
  fallenTo: 'Conquered by {b}',
  declareWar: 'Declare war',
  declareWarHint: 'Your armies will march out and seize its land.',
  offerPeace: 'Offer peace',
  offerPeaceHint: 'The enemy accepts if you are clearly stronger or the war drags on.',
  peaceCooldown: 'Envoys are on their way back',

  // Chronicle (event feed)
  chronicle: 'Chronicle',
  evWar: '{a} declared war on {b}',
  evPeace: '{a} and {b} made peace',
  evPeaceRefused: '{b} rejected peace with {a}',
  evSettle: 'Settlers of {a} set out into the wilderness',
  evColony: '{a} founded a colony across the sea',
  evFall: '{a} fell to {b}',
  evFarm: '{a} laid out new farms',
  evPort: '{a} built a harbour',
  evVassal: '{a} founded {b}, a vassal polis',
  evAlliance: '{a} and {b} formed an alliance',
  evAllianceOffer: '{a} sent envoys to {b}',

  // Battle report
  reportTitle: 'Victory!',
  reportNear: 'Near {place}',
  reportBattles: '{n} battles won',
  reportGold: 'Spoils',
  reportGoldValue: '+{n} drachmae',
  reportSlaves: 'Captives put to work',
  reportSlavesValue: '+{n} workers',
  reportPrestigeValue: '+{n} (now {t})',
  reportLosses: 'Fallen',
  reportLossesValue: 'enemy {e} · ours {o}',
  reportAction: 'Onward!',

  // Embassy (alliance offer)
  embassyTitle: 'An embassy from {name}',
  embassySubtitle: 'Envoys bearing olive branches wait at your gates.',
  embassyText:
    'All of Hellas speaks of your victories. {name} offers you an alliance: if anyone declares war on you, we will march at your side — and you at ours.',
  embassyAccept: 'Accept the alliance',
  embassyDecline: 'Send them away',

  // War letters
  letterTitle: 'A letter from {name}',
  letterDeclares: '{name} declares war on you.',
  letterAction: 'To arms!',
  letterGeneric: {
    sender: 'The council of {name}',
    taunt: 'Your storehouses are empty and your walls unmanned. We have come to take what you cannot hold.',
    challenge: 'We were your children; now we are your equals. Let the spear decide which of us the gods favour.'
  },
  letters: {
    athens: {
      sender: 'Solon, archon of the Athenians',
      taunt: 'Solon says you have neither silver nor soldiers. Good. Our new laws need new fields.',
      challenge: 'Solon praises your city, but Attica is too narrow for our children. May the gods judge between us.'
    },
    sparta: {
      sender: 'Chilon, ephor of the Lacedaemonians',
      taunt: 'Few words: you are weak. We are coming.',
      challenge: 'If.'
    },
    corinth: {
      sender: 'Periander, tyrant of Corinth',
      taunt: 'Periander walked through a wheat field and cut down the tallest ears. Yours did not even reach his knee.',
      challenge: 'Two seas pay toll to Corinth. Your city will pay too — in silver or in blood.'
    },
    thebes: {
      sender: 'The Boeotarchs of Thebes',
      taunt: 'Cadmus sowed dragon teeth and warriors sprang up. In your fields nothing grows but excuses.',
      challenge: 'The plain of Boeotia breeds strong men. Come and meet them.'
    },
    argos: {
      sender: 'The heirs of Pheidon, kings of Argos',
      taunt: 'Pheidon gave Hellas its weights and measures. We have weighed your army and found it wanting.',
      challenge: 'Argos is older than your gods. Your walls are younger than our olive trees.'
    },
    chalkis: {
      sender: 'The Hippobotae of Chalcis',
      taunt: 'Our bronze is sharper than your wit and more plentiful than your hoplites.',
      challenge: 'Chalcis has founded cities from Sicily to Thrace. Yours will be the next we rebuild.'
    },
    elis: {
      sender: 'The Hellanodikai of Elis',
      taunt: 'Even the sacred truce cannot protect a city with empty hands. Prepare to lose.',
      challenge: 'Olympia teaches that the strongest wins the olive crown. Let us contest it.'
    },
    larisa: {
      sender: 'The Aleuadae of Larissa',
      taunt: 'Our horses have seen your army. They were not impressed.',
      challenge: 'The Thessalian cavalry has not had a worthy foe in years. Ride out and meet it.'
    },
    korkyra: {
      sender: 'The admirals of Corcyra',
      taunt: 'Your harbour is quiet and your treasury quieter. Our triremes will fix both.',
      challenge: 'We defied Corinth herself. We do not fear you.'
    },
    ambracia: {
      sender: 'Gorgus, tyrant of Ambracia',
      taunt: 'Even the wild Epirotes keep more spears than you. We will take your land as a gift.',
      challenge: 'The son of Cypselus does not ask twice. Your fields, or your sons.'
    },
    potidaea: {
      sender: 'The magistrates of Potidaea',
      taunt: 'Macedon pays us for timber; you will pay us for peace — later.',
      challenge: 'Our isthmus is narrow, but our resolve is not.'
    },
    thasos: {
      sender: 'The council of Thasos',
      taunt: 'Archilochus threw away his shield and lived to mock it. You have no shields to throw.',
      challenge: 'Our gold mines buy many spears. Count yours carefully.'
    },
    mytilene: {
      sender: 'Pittacus of Mytilene',
      taunt: 'Pittacus says: know your opportunity. Yours has passed; ours has come.',
      challenge: 'Sappho sings of love, Alcaeus of war. Today the lyre plays for Alcaeus.'
    },
    chios: {
      sender: 'The Council of the Chians',
      taunt: 'Homer was born on Chios; he will sing of how easily you fell.',
      challenge: 'Our wine is the best in Hellas. We will drink it in your agora.'
    },
    samos: {
      sender: 'The Geomoroi of Samos',
      taunt: 'Hera favours the bold, and you are neither bold nor rich.',
      challenge: 'Our engineers dig through mountains. Your walls will not trouble them.'
    },
    naxos: {
      sender: 'The nobles of Naxos',
      taunt: 'We carve lions of marble for Delos. For you a single pebble will do.',
      challenge: 'Dionysus loves Naxos. Let us see whom Ares loves.'
    },
    knossos: {
      sender: 'The Kosmoi of Knossos',
      taunt: 'The Minotaur would find you a poor meal. So do we.',
      challenge: 'Minos once ruled these seas. Knossos means to again.'
    },
    lindos: {
      sender: 'Cleobulus, tyrant of Lindos',
      taunt: 'Cleobulus teaches: measure is best. Your army is below every measure.',
      challenge: 'Cleobulus teaches: measure is best. We have measured you and found you a worthy enemy.'
    }
  },

  // End of game
  victoryTitle: 'Hegemony of Hellas',
  victoryDesc: '{a} dominates Greece. Poets will sing of this for centuries.',
  defeatTitle: 'Your polis has fallen',
  defeatDesc: '{a} was conquered by {b}. Its temples now bear foreign offerings.',
  playAgain: 'Play again',

  // Map hover
  hoverPolis: '{name} · {pop} people',
  hoverWild: 'Wilderness',
  hoverForeign: 'Barbarian lands, beyond Hellas',
  hoverAltitude: '{m} m',

  // Cartographic labels
  peakOlympus: 'Mt Olympus',

  polisNames: {
    athens: 'Athens',
    sparta: 'Sparta',
    corinth: 'Corinth',
    thebes: 'Thebes',
    argos: 'Argos',
    chalkis: 'Chalcis',
    elis: 'Elis',
    larisa: 'Larissa',
    korkyra: 'Corcyra',
    ambracia: 'Ambracia',
    potidaea: 'Potidaea',
    thasos: 'Thasos',
    mytilene: 'Mytilene',
    chios: 'Chios',
    samos: 'Samos',
    naxos: 'Naxos',
    knossos: 'Knossos',
    lindos: 'Lindos'
  },

  polisInfo: {
    athens: { region: 'Attica', blurb: 'Olive groves, the silver of Laurion and a restless assembly. Solon has just rewritten the laws.' },
    sparta: { region: 'Laconia', blurb: 'A warrior state ruling the helots of the Eurotas valley, walled in by Taygetus and Parnon.' },
    corinth: { region: 'Corinthia', blurb: 'Master of the Isthmus and two seas, rich from tolls, pottery and trade.' },
    thebes: { region: 'Boeotia', blurb: 'First city of the Boeotian plain, the richest farmland of central Greece.' },
    argos: { region: 'Argolis', blurb: 'Ancient rival of Sparta, proud of its legendary kings and its fertile plain.' },
    chalkis: { region: 'Euboea', blurb: 'Bronze-smiths and colonisers on the narrow Euripus strait.' },
    elis: { region: 'Elis', blurb: 'Keeper of Olympia and its sacred truce, amid the broad western lowlands.' },
    larisa: { region: 'Thessaly', blurb: 'Horse-breeding aristocrats of the widest plain in Greece.' },
    korkyra: { region: 'Corfu', blurb: 'A wealthy sea power at the gate of the Adriatic, defiant toward Corinth.' },
    ambracia: { region: 'Epirus', blurb: 'A young Corinthian colony on the edge of the Epirote wilds.' },
    potidaea: { region: 'Chalcidice', blurb: "Corinth's outpost on the Pallene isthmus, trading with Macedon." },
    thasos: { region: 'Thasos', blurb: 'An island of gold mines and wine facing the Thracian shore.' },
    mytilene: { region: 'Lesbos', blurb: 'Home of Sappho and Alcaeus, rich in olives and lyric song.' },
    chios: { region: 'Chios', blurb: 'Famed for its wine and shipwrights; it claims to be the birthplace of Homer.' },
    samos: { region: 'Samos', blurb: 'A naval power with a great temple of Hera and bold engineers.' },
    naxos: { region: 'Cyclades', blurb: 'Largest of the Cyclades, carving marble lions for the gods of Delos.' },
    knossos: { region: 'Crete', blurb: 'Heir to the Minoan palaces among the hundred cities of Crete.' },
    lindos: { region: 'Rhodes', blurb: 'A merchant city of Rhodes beneath the acropolis of Athena Lindia.' }
  },

  siteNames: {
    tegea: 'Tegea', mantineia: 'Mantinea', sikyon: 'Sicyon', epidauros: 'Epidaurus', troizen: 'Troezen',
    megara: 'Megara', plataea: 'Plataea', orchomenos: 'Orchomenus', delphi: 'Delphi', amphissa: 'Amphissa',
    naupaktos: 'Naupactus', kalydon: 'Calydon', pylos: 'Pylos', methone: 'Methone', gytheion: 'Gytheio',
    pharsalos: 'Pharsalus', pherai: 'Pherae', dion: 'Dion', olynthos: 'Olynthus', mende: 'Mende',
    stageira: 'Stagira', abdera: 'Abdera', maroneia: 'Maroneia', amphipolis: 'Amphipolis', kassope: 'Cassope',
    dodona: 'Dodona', thermon: 'Thermon', leukas: 'Leucas', ithaca: 'Ithaca', zakynthos: 'Zacynthus',
    kythera: 'Cythera', melos: 'Melos', paros: 'Paros', andros: 'Andros', tenos: 'Tenos', karystos: 'Carystus',
    eretria: 'Eretria', histiaia: 'Histiaea', lamia: 'Lamia', hermione: 'Hermione', phleious: 'Phlius',
    gortyn: 'Gortyn', kydonia: 'Cydonia', lyttos: 'Lyttus', ialysos: 'Ialysos', kos: 'Kos', methymna: 'Methymna',
    myrina: 'Myrina', samothrace: 'Samothrace', skiathos: 'Sciathus'
  }
};
