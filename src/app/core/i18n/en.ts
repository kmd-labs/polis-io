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
      term: 'Keyboard',
      desc: 'Space pauses, 1–5 set the speed, B opens the budget, Esc folds the side panel.'
    },
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
      desc: 'Driven by the colonization share of your budget: each expedition costs drachmae from that fund and takes 10% of your workers away for good. The settlers slowly claim free land next to your borders — or found a colony across the sea once your coast is full. More land raises your carrying capacity, and every new pixel permanently speeds up population growth and income.'
    },
    {
      term: 'Militarism & culture',
      desc: 'Every polis has a character rated 1–5. Militarism slightly strengthens its armies and garrison in battle (+4% per point); culture raises its income (+8% per point).'
    },
    {
      term: 'Budget',
      desc: 'The budget window on the left divides all income between five funds — military, colonization, agriculture, trade and culture — with sliders that always add up to 100% (none below 5%). Each fund spends itself: the military pays upkeep, raises its buildings and trains hoplites; colonization sends settlers and founds colonies; agriculture and trade raise their buildings, then farms and ports; culture holds festivals.'
    },
    {
      term: 'Developing the countryside',
      desc: 'The agriculture and trade funds lay out farms (the land feeds 2,500 more people) and ports (+12% income); they appear 1 to 12 months later, usually on low ground near the sea, not right under the city walls. The colonization fund, once the nearby wilderness is settled, founds colonies on historical sites — vassal poleis that fight in all your wars.'
    },
    {
      term: 'Polis buildings',
      desc: 'The Buildings button opens three trees — agriculture, trade and military — of six buildings each, unlocked in order. Each tree is paid for by its budget fund, which buys the next building as soon as it has saved enough; it takes a year to raise, costs some of the citizens’ satisfaction, and grants a bonus to the whole polis.'
    },
    {
      term: 'Satisfaction',
      desc: 'Contented citizens work and multiply faster (×0.7 at 0%, ×1.3 at 100%). Satisfaction falls when you lose battles or land, settle the wilderness, build or levy hoplites; it rises in quiet times, with trade income, won battles and wars, and high power projection. When a war ends you receive a report of what it cost and gained.'
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
      desc: 'Your warriors, trained by the military fund and paid from it. They garrison the capital and march out in small armies during war. If the military fund runs dry, unpaid hoplites desert.'
    },
    {
      term: 'War',
      desc: 'Declare war on a polis and your armies roam on their own, seizing enemy pixels one by one. Hostile territory is striped. Storming an enemy capital means beating its garrison — and annexing the whole polis.'
    },
    {
      term: 'Main army and raiders',
      desc: 'At war a polis fields two to five armies. The main army (the larger shield) takes about half the spare hoplites and seeks out the enemy’s main army; the smaller raiding parties plunder the countryside and run from any force near their size. A main army weaker than the enemy’s halts and digs in (a ring of stakes): over a few years its fighting power grows to 150%, and it falls on any enemy army that comes within 30 cells. A few hoplites always stay behind the walls.'
    },
    {
      term: 'Sieges and the fall of a polis',
      desc: 'An army reaching an enemy capital camps before its walls for about two and a half years before storming them. Meanwhile the besieged city loses satisfaction, barely grows and its garrison starves — while the besiegers waste away too. A fallen polis is rarely wiped out: it may live on as a city within the victor’s borders, or become a client state paying tribute in drachmae and workers. Founding cities are hard to raze; young colonies are easy. Sometimes a new polis breaks away in the chaos.'
    },
    {
      term: 'Conquest',
      desc: 'When your army storms an enemy capital, the game stops and you decide its fate, ending the war: raze it (usually gold and slaves, sometimes a revolt that revives it), subjugate it (usually a tribute-paying client state, otherwise a large ransom) or force it into an alliance.'
    },
    {
      term: 'Diplomatic reputation',
      desc: 'Every pair of poleis has a reputation from −100 to +100 that drifts around neutral. Wars, shared borders and big armies lower it; culture, power projection and contented citizens raise it very slowly. Neighbours quarrel and go to war more often — except the island cities of Samos, Naxos, Corcyra and Chios.'
    },
    {
      term: 'Battle',
      desc: 'When two hostile armies meet, they vanish into a brawl cloud, and armies passing nearby join their friends in it. Only one side walks out; the larger usually wins, but not always. An army facing an enemy two and a half times its size falls back instead, losing stragglers, and sometimes scatters into two smaller armies. Land an army overruns is not always kept — 20% of it, and up to half far from home, is simply left as wilderness. Stray scraps of land (four pixels or fewer) cut off from their capital go back to the wild after about four years.'
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
  flagOf: 'Banner of {name}',
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
  statDrachmaeHint: 'Treasury across all five budget funds, and net income per month (after hoplite upkeep).',
  statTerritoryHint: 'Share of all Greek land you hold.',
  statGrowthHint: 'Growth and income multiplier earned by settling the wilderness.',
  settle: 'Settle the wilderness',
  settleHint: 'Send 10% of your workers ({n}) to claim wild land. More land speeds up population growth and income.',
  settling: 'Settling… {p}%',
  settleNoLand: 'No wilderness left',
  // Budget
  budget: 'Budget',
  budgetHint:
    'All income — taxes, trade, spoils and tribute — is split between five funds. Each fund pays for its own projects automatically as soon as it has saved enough.',
  budgetRule: 'Shares always add up to 100%; none can go below 5%. Hoplite upkeep comes out of the military fund.',
  budgetKeys: {
    military: {
      name: 'Military',
      desc: 'Pays the hoplites’ upkeep, raises the military buildings and trains hoplites. A bigger share means a larger army (up to 40% of the workers) recruited in bigger levies; cut it and surplus hoplites go back to work.'
    },
    colonization: {
      name: 'Colonization',
      desc: 'The only way to settle the wilderness: pays for expeditions that take 10% of your workers to claim new land; once there is no free land near, founds colonies on historical sites.'
    },
    agriculture: { name: 'Agriculture', desc: 'Raises the agricultural buildings, then lays out new farms.' },
    trade: { name: 'Trade', desc: 'Raises the trade buildings, then builds new ports.' },
    culture: { name: 'Culture', desc: 'Holds festivals: satisfaction, slowly rising culture and a little power projection.' }
  },
  purchases: {
    hoplites: 'hoplites',
    expedition: 'settlers’ expedition',
    colony: 'new colony',
    farm: 'new farm',
    port: 'new port',
    festival: 'festival'
  },
  nextPurchase: 'next: {what} ({c})',
  savingOnly: 'saving',
  armyStatus: 'army {w} / {t} hoplites aimed for',
  expeditionUnderway: 'settlers on the march — {p}%',
  fundedBy: '{budget} fund: {f} / {c} dr',
  developTitle: 'Surveyors set out',
  developFarm: 'New farms will be laid out in your countryside in {m}.',
  developPort: 'A harbour will rise on your coast in {m}.',
  developVassal: 'Colonists will found {site}, your vassal polis, in {m}.',
  developAction: 'Very well',
  monthsOne: '{n} month',
  monthsFew: '{n} months',
  monthsMany: '{n} months',
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
  satisfaction: 'Satisfaction',
  satisfactionHint:
    'Income and growth ×{m}. Falls when you lose battles or land, settle the wilderness, build or levy hoplites; rises in quiet times, with trade, victories and power projection.',

  // Polis screen
  openPolis: 'Open the polis buildings: three trees of improvements with nationwide bonuses',
  buildings: 'Buildings',
  polisScreenIntro: 'every building takes a year to raise and costs drachmae and some of the citizens’ goodwill.',
  trees: { agriculture: 'Agriculture', trade: 'Trade', military: 'Military' },
  improvements: {
    granary: { name: 'Granary', desc: 'Stored grain carries the city through lean years: +8% land capacity.' },
    irrigation: { name: 'Irrigation channels', desc: 'Water led from the springs: +10% land capacity.' },
    olives: { name: 'Olive groves', desc: 'Oil for lamps, kitchens and export: +10% income.' },
    vineyards: { name: 'Vineyards', desc: 'Wine and festivals: +5% income, satisfaction recovers faster.' },
    terraces: { name: 'Terraced hillsides', desc: 'Settlers tame the slopes: each settler claims 25% more land, +5% capacity.' },
    demeter: { name: 'Sanctuary of Demeter', desc: 'The goddess blesses the harvest: +15% population growth, +10% capacity.' },
    agora: { name: 'Agora', desc: 'A market square at the heart of the city: +8% income.' },
    mint: { name: 'Mint', desc: 'Silver coins stamped with the city’s emblem: +10% income.' },
    shipyard: { name: 'Shipyard', desc: 'Slipways for merchantmen: one more trade ship at sea.' },
    guild: { name: 'Merchant guild', desc: 'Contracts and credit: trade voyages pay +50%.' },
    emporion: { name: 'Emporion', desc: 'Trading posts abroad: development costs −20%, one more trade ship.' },
    treasury: { name: 'Treasury at Delphi', desc: 'A gleaming offering to Apollo: +2 power projection, +10% income.' },
    gymnasium: { name: 'Gymnasium', desc: 'Young men train in the nude: hoplites cost 20% less.' },
    armoury: { name: 'Armoury', desc: 'Bronze helmets and greaves for all: +5% battle strength.' },
    walls: { name: 'City walls', desc: 'Ashlar walls around the acropolis: the garrison fights 30% harder.' },
    drill: { name: 'Phalanx drill', desc: 'Shield to shield, in step: +7% battle strength.' },
    barracks: { name: 'Barracks', desc: 'Common messes for the citizens-in-arms: one more army, marches 15% faster.' },
    ares: { name: 'Temple of Ares', desc: 'The war god’s favour: +2 power projection, +5% battle strength.' }
  },
  buildCost: '{d} dr · −{s}%',
  built: 'Built',
  underConstruction: 'Under construction…',
  lockedHint: 'Requires the previous building',

  // War report
  warEndTitle: 'The war with {name} is over',
  warEndConquest: '{name} has been razed',
  warEndCity: '{name} survives as a city within the victor’s borders',
  warEndClient: '{name} has become a client state',
  warEndRevolt: '{name} rose in revolt and is free again',
  warEndRansom: '{name} paid a ransom and remains free',
  warEndAlliance: '{name} is now bound to you as an ally',
  warEndPeace: 'Peace has been sworn',
  warDuration: 'Duration',
  yearsOne: '{n} year',
  yearsFew: '{n} years',
  yearsMany: '{n} years',
  warBattles: 'Battles',
  warBattlesValue: 'won {w} · lost {l}',
  warLand: 'Land',
  warLandValue: '+{g} km² · −{l} km²',
  warSpoils: 'Spoils',
  warSpoilsValue: '{g} dr · {c} captives',
  warMoodValue: '{n}%',
  warEndAction: 'So be it',
  buildingsHint:
    'Farms, ports and vassal poleis created by development, allies, and merchant ships at sea. Each voyage to a friendly harbour earns {v} drachmae ({t} from trade so far); the receiving city gets 30% of that too.',
  vassalOf: 'Vassal of {b}',
  clientOf: 'Client state of {b}',
  underSiege: 'Under siege!',
  underSiegeHint: 'Enemy armies are camped before the walls: satisfaction falls, the population barely grows and the garrison goes hungry until the assault.',
  tributeHint: 'Client states have paid {g} drachmae and sent {w} workers so far.',

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
  evFall: '{a} was razed by {b}',
  evFarm: '{a} laid out new farms',
  evPort: '{a} built a harbour',
  evVassal: '{a} founded {b}, a vassal polis',
  evAlliance: '{a} and {b} formed an alliance',
  evSiege: '{a} laid siege to {b}',
  evClient: '{a} became a client state of {b}',
  evAnnexed: '{a} now lies within the borders of {b}',
  evSecession: '{b} broke away from {a}',
  evCaptured: '{b} stormed {a}',
  evRevolt: '{a} rose in revolt against {b}',
  evRansom: '{a} bought its freedom from {b}',
  evFestival: '{a} held a great festival',
  evFarmPlanned: 'Surveyors lay out new farms — ready in {m}',
  evPortPlanned: 'Work begins on a new port — ready in {m}',
  evBuilt: '{a} completed: {w}',

  // Conquest decision
  conquestTitle: '{name} lies at your feet',
  conquestSubtitle: 'The walls are breached. Decide the fate of the city — this ends the war.',
  conquestRaze: 'Raze the city',
  conquestRazeDesc: '80%: the city is torn down; its gold and many slaves are yours. 20%: the citizens rise in revolt and the polis is reborn.',
  conquestSubjugate: 'Subjugate',
  conquestSubjugateDesc: '60%: it becomes your client state and pays tribute in drachmae and workers. 40%: it buys its freedom with a large ransom and stays independent.',
  conquestAlliance: 'Force an alliance',
  conquestAllianceDesc: 'It is bound to you as an ally for certain, with a little gold as consolation.',

  // Diplomatic reputation
  relation: 'Relations',
  relationHint:
    'Diplomatic reputation between your polis and this one (−100 to +100). It drifts back toward neutral; wars, shared borders and large armies sour it, while culture, power projection and contented citizens (over 70%) slowly sweeten it. Poor relations invite war; good ones bring peace, alliances and merchants.',
  relationLevels: { hostile: 'hostile', unfriendly: 'unfriendly', neutral: 'neutral', friendly: 'friendly', cordial: 'cordial' },
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
  embassyTexts: {
    victories:
      'All of Hellas speaks of your victories. {name} offers you an alliance: if anyone declares war on you, we will march at your side — and you at ours.',
    trade:
      'Our ships know your harbours well, and our merchants grow rich on your oil. {name} would bind our cities with more than trade: an alliance, each defending the other.',
    commonEnemy:
      'You and we both stand against {enemy}. {name} proposes we stand together: an alliance, each marching when the other is attacked.',
    neighbour:
      'Our fields touch yours, and good fences make good neighbours — better still, good allies. {name} offers an alliance of mutual defence.',
    goodwill: '{name} sends gifts and greetings, and offers an alliance: if anyone declares war on you, we will march at your side — and you at ours.'
  },
  embassyWars: 'At war with',
  embassyWarning: 'Accepting the alliance means joining these wars at once.',
  topBarLabel: 'Your polis at a glance',
  perMonth: '{n}/mo',
  topHoplitesHint: 'Hoplites under arms now / the army your military budget aims for. Raise the Military slider to grow it; lower it and men go back to the fields.',
  topSatisfactionHint: 'How content the citizens are. Above 70% your reputation improves and work goes faster; low contentment slows growth and income.',
  speedN: 'Speed {n}×',
  drawerLabel: 'Polis panels',
  drawerCollapse: 'Fold the panel',
  drawerExpand: 'Open the panel',
  tabs: { budget: 'Budget', polis: 'Polis', diplomacy: 'Diplomacy', chronicle: 'Chronicle & charts' },
  outlinerTitle: 'Situation',
  outlinerToggle: 'Show or hide the situation panel',
  outWars: 'Wars',
  outAllies: 'Allies',
  outSieges: 'Sieges',
  outLatest: 'Latest news',
  outNoAllies: 'No allies yet.',
  outNoSieges: 'No city is under siege.',
  outSiegeOurs: 'Our army besieges {b}',
  outSiegeTheirs: '{a} besieges {b}',
  outAdvantageHint: 'Hoplites — ours: {a}, theirs: {b}',
  mapModes: 'Map mode',
  viewRelations: 'Relations',
  dipListHint: 'Every city of Hellas and how it stands with you. Click one to open its card.',
  standings: { war: 'At war', ally: 'Ally', vassal: 'Vassal', client: 'Client', peace: 'At peace' },
  chronicleEmpty: 'Nothing worth recording has happened yet.',
  alertsLabel: 'Alerts',
  etaNow: 'now',
  chartIncome: 'Income per month',
  chartBuilt: 'Built: {w}',
  chartWar: 'War with {name}',
  chartPeace: 'Peace with {name}',
  chartsLegend: 'Grey dashes mark budget changes, red wars, green peace, gold new buildings. Hover a chart for the figures.',
  chartsEmpty: 'The charts fill in as the years go by.',
  incWorkers: 'Workers’ yield ({n})',
  incCulture: 'Culture',
  incPorts: 'Ports',
  incBuildings: 'Buildings',
  incMood: 'Contentment',
  incOther: 'Sea trade, tribute, spoils',
  incUpkeep: 'Hoplite pay',
  incTotal: 'Into the funds',
  etaYears: '~{n} yr',
  presetsLabel: 'Budget presets',
  presets: { balanced: 'Balanced', war: 'War economy', expansion: 'Expansion', mercantile: 'Mercantile', golden: 'Golden age', custom: 'Custom' },
  presetHints: {
    balanced: 'An even fifth for every fund.',
    war: 'Half of everything to the army: more hoplites, faster.',
    expansion: 'Settlers and colonies first.',
    mercantile: 'Harbours, ships and trade buildings.',
    golden: 'Festivals and culture, with trade to pay for them.'
  },
  fcNext: '{what} in {t}',
  fcStalled: 'not at this rate',
  fcHoplites: '+{t} hoplites/yr',
  fcPay: 'pay {u} dr/mo',
  fcDesert: 'Desertion in {t}',
  fcFarm: '+{n} land capacity',
  fcPort: '+{n}% income',
  fcFestival: '+{n}% satisfaction',
  fcExpedition: '−{n} workers',
  fcColonyOnly: 'No free land — overseas colonies only',
  fcIdle: 'nothing to buy — its share goes to the other funds',
  fcBlocked: 'no free land within reach — its share goes to the other funds',
  alertOpen: 'click to read',
  alertSiege: 'Our capital is under siege! Raise the Military slider, or seek peace.',
  alertSiegeAlly: 'Our ally {name} is under siege.',
  alertDeserting: 'Hoplites are deserting: their upkeep is more than the military fund brings in. Raise the Military slider or let the army shrink.',
  alertAllyWar: 'Allies at war: {names}.',
  alertColonyBlocked: 'Colonization is stuck: there is no free land within reach and no colony site left. Its share flows to the other funds.',
  alertFundIdle: 'The {fund} fund has nothing to buy; its share flows to the other funds. Consider moving the slider.',
  alertVictory: 'Victory near {place}',
  alertWarEnd: 'The war with {name} is over',
  alertDevelop: 'Surveyors’ report on new works',
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
