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
  viewFertility: 'Soil fertility',
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
      term: 'Settle the wilderness',
      desc: 'Sends 10% of your workers away for good. They slowly claim free land next to your borders — or found a colony across the sea once your coast is full. More land raises your carrying capacity, and every new pixel permanently speeds up population growth and income.'
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

  // Choosing a polis
  chooseTitle: 'Choose your polis',
  chooseHint: 'Click a city-state on the map, or pick one from the list.',
  choosePick: 'Pick a polis',

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
  }
};
