import { POLEIS, PolisDef, SITES, SiteId } from './data/poleis';
import {
  IMPROVEMENT_BY_ID,
  ImprovementEffects,
  ImprovementId,
  ImprovementTree,
  NO_EFFECTS,
  improvementCost
} from './data/improvements';
import { MinHeap } from './heap';
import { hash01 } from './rng';
import { Terrain, World } from './world';

/** The five funds every drachma of income is split into. */
export type BudgetKey = 'military' | 'colonization' | 'agriculture' | 'trade' | 'culture';
export type Budget = Record<BudgetKey, number>;
export const BUDGET_KEYS: readonly BudgetKey[] = ['military', 'colonization', 'agriculture', 'trade', 'culture'];

/** Lowest share (%) any fund can be cut to. */
export const BUDGET_MIN = 5;

/** Fund that pays for the buildings of each Polis-screen tree. */
const TREE_FUND: Record<ImprovementTree, BudgetKey> = { agriculture: 'agriculture', trade: 'trade', military: 'military' };

/**
 * Sets one share and rescales the others in proportion so that the five still add up to 100%,
 * none of them below the minimum. Shares are whole percents.
 */
export function rebalanceBudget(budget: Budget, key: BudgetKey, value: number): Budget {
  const others = BUDGET_KEYS.filter(k => k !== key);
  const v = Math.round(Math.max(BUDGET_MIN, Math.min(100 - BUDGET_MIN * others.length, value)));
  const spare = 100 - v - BUDGET_MIN * others.length;
  const above = others.reduce((sum, k) => sum + Math.max(0, budget[k] - BUDGET_MIN), 0);
  const out = { ...budget, [key]: v } as Budget;
  // Largest-remainder rounding: whole percents that never dip below the minimum.
  const raw = others.map(k => {
    const weight = above > 0 ? Math.max(0, budget[k] - BUDGET_MIN) / above : 1 / others.length;
    return { k, value: BUDGET_MIN + spare * weight };
  });
  for (const r of raw) out[r.k] = Math.floor(r.value);
  let left = 100 - BUDGET_KEYS.reduce((sum, k) => sum + out[k], 0);
  for (const r of [...raw].sort((a, b) => (b.value % 1) - (a.value % 1))) {
    if (left-- <= 0) break;
    out[r.k]++;
  }
  return out;
}

/** Small fast seeded PRNG (mulberry32): the same seed replays the same game. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Scales arbitrary weights into a valid budget (whole percents, each at least the minimum). */
function normalizeBudget(weights: Budget): Budget {
  const total = BUDGET_KEYS.reduce((sum, k) => sum + weights[k], 0);
  const out = {} as Budget;
  for (const k of BUDGET_KEYS) out[k] = Math.max(BUDGET_MIN, Math.round((weights[k] / total) * 100));
  const drift = 100 - BUDGET_KEYS.reduce((sum, k) => sum + out[k], 0);
  const largest = BUDGET_KEYS.reduce((a, b) => (out[a] >= out[b] ? a : b));
  out[largest] += drift;
  return out;
}

/** What a fund is saving for next. */
export type Purchase =
  | { kind: 'improvement'; id: ImprovementId; cost: number }
  | { kind: 'hoplites' | 'expedition' | 'colony' | 'farm' | 'port' | 'festival'; cost: number };

/** Palette tokens for poleis that break away during a fall (unused by the founding cities). */
const SECESSION_COLORS = ['success-700', 'info-600', 'danger-700', 'purple-400', 'primary-500', 'info-800', 'neutral-800'];

/** Cell owner codes; values >= 0 are polis indices. */
export const SEA = -3;
export const FOREIGN = -2;
export const WILD = -1;

/** Tunable game balance. Times are in game seconds (1 game second = 1 real second at 1× speed). */
export const RULES = {
  startYear: 600,
  secondsPerYear: 4,
  /** Travel budget (cells) of the founding territory; climbing 1000 m doubles the cost of a step. */
  startReach: 15,
  /**
   * Carrying capacity per unit of owned fertility. ~60 gives 25–35 people/km² on good lowland,
   * close to estimates for Archaic and Classical Greece (≈3 million if all of Hellas were settled).
   */
  peoplePerFertility: 60,
  /** Share of the founding capacity already populated in 600 BC. */
  startPopulation: 0.6,
  /** Hoplites per civilian at the start: base + per point of militarism. */
  startGarrison: 0.02,
  startGarrisonPerMilitarism: 0.008,
  /** Share of civilians fit for physical labour. */
  laborShare: 0.55,
  growthRate: 0.02,
  incomePerWorker: 0.0025,
  upkeepPerWarrior: 0.003,
  /** "Settle the wilderness" sends this share of workers away for good… */
  settleShare: 0.1,
  /** …and only once the city has filled this share of its land's capacity. */
  settleCrowding: 0.7,
  settlersPerCell: 12,
  /** Cells claimed per second by an expedition. */
  settleRate: 11,
  prosperityPerCell: 0.00055,
  maxProsperity: 2,
  /** A levy takes this share of workers, plus the military share times trainPerShare (faster recruiting). */
  trainShare: 0.02,
  trainPerShare: 0.08,
  trainCostPerHoplite: 1.2,
  /** Battle strength bonus per point of militarism. */
  militarismBonus: 0.04,
  /** Income bonus per point of culture. */
  cultureBonus: 0.08,
  /** People of carrying capacity added by each farm. */
  farmCapacity: 2500,
  /** Income bonus per port. */
  portBonus: 0.12,
  /** Travel budget (cells) of a vassal's founding land. */
  vassalReach: 7,
  /** Drachmae earned by the owner for every completed trade voyage, before the culture bonus. */
  tradeIncome: 1,
  /** Cells per second. */
  shipSpeed: 6,
  /** Mean seconds between departures from a coastal polis. */
  shipInterval: 8,
  /** Trade ships at sea per polis: one, plus one per port, up to this many. */
  maxShips: 4,
  /** Sea routes are planned on a grid this many times coarser than the map. */
  routeCoarse: 3,
  /** Share of a voyage's value also earned by the receiving harbour. */
  tradeReceiverShare: 0.3,
  /** Spoils of a won battle: drachmae per fallen enemy, plus a flat purse. */
  lootPerEnemy: 0.25,
  lootBase: 15,
  /** Share of the beaten army taken captive and put to work. */
  captiveShare: 0.15,
  /** Power projection gained per battle won. */
  prestigePerVictory: 1,
  /** Each point of power projection makes a polis look this much stronger to would-be attackers. */
  prestigeDeterrence: 0.08,
  /** Each point makes merchants this much more likely to choose its harbour. */
  prestigeTradePull: 0.15,
  /** Per AI decision and per point of the player's power projection: chance to offer an alliance. */
  allianceOfferChance: 0.004,
  /** At most one embassy reaches the player in this many seconds (5 years). */
  embassyCooldown: 20,
  /** Recent victories (within this many seconds) are what impresses envoys. */
  victoryMemory: 40,
  /** Voyages between two cities that make their envoys speak of trade. */
  tradeTies: 3,
  /** Satisfaction (0–100): starting value and what moves it. */
  satisfactionStart: 70,
  /** Recovered per second while the citizens are left in peace… */
  satisfactionRecovery: 0.2,
  /** …which means this long after the last unpopular act (settling, levies, building). */
  satisfactionCalm: 5,
  /** Per second per point of power projection. */
  satisfactionPerPrestige: 0.01,
  /** Per drachma of trade income. */
  satisfactionPerTrade: 0.08,
  satisfactionBattleWon: 3,
  satisfactionBattleLost: -4,
  satisfactionWarWon: 8,
  satisfactionWarLost: -6,
  satisfactionPerCellLost: -0.02,
  satisfactionSettle: -1,
  satisfactionTrain: -1,
  /** Income and growth run at this multiplier at 0% satisfaction, and its mirror at 100%. */
  satisfactionLow: 0.7,
  satisfactionHigh: 1.3,
  /** Seconds an army camps before the walls before it storms them. */
  siegeDuration: 10,
  /** Share of a besieging army lost to disease and desertion per second. */
  siegeAttrition: 0.015,
  /** Share of a besieged garrison lost to hunger per second. */
  siegeStarvation: 0.005,
  /** Satisfaction lost per second for every army camped before the walls. */
  siegeMood: 0.3,
  /** Population growth multiplier while besieged. */
  siegeGrowth: 0.3,
  /** Relative weights of what becomes of a fallen polis (razing is adjusted by age, see fallOutcome). */
  fallCity: 30,
  fallClient: 40,
  fallRazed: 30,
  /** A founding polis of 600 BC is this much harder to raze. */
  foundingResilience: 0.5,
  /** A vassal founded less than this many seconds ago is easier to raze, up to +40 weight. */
  youthSpan: 240,
  /** Chance that a new polis breaks away from a falling one. */
  secessionChance: 0.25,
  /** Share of a client state's income paid to its overlord, and of its civilians sent as workers per second. */
  tributeShare: 0.3,
  tributeWorkers: 0.003,
  /** Travel budget (cells) of the land a client state keeps around its capital. */
  clientReach: 12,
  /** Fate chosen by the player for a conquered city: odds of the intended outcome. */
  razeSuccess: 0.8,
  subjugateSuccess: 0.6,
  /** Diplomatic reputation (−100…+100 per pair of poleis): decay toward 0 per second… */
  relationDecay: 0.01,
  /** …and pressures per second. */
  relationWar: -0.8,
  relationNeighbour: -0.05,
  relationPerMilitarism: -0.004,
  relationPerArmy: -0.015,
  relationPerCulture: 0.004,
  relationPerPrestige: 0.003,
  relationContent: 0.01,
  relationDeclareWar: -30,
  relationPeace: 5,
  relationAlliance: 30,
  /** Chance that ground taken by an army is left as wilderness, near home and far from it. */
  wildernessNear: 0.2,
  wildernessFar: 0.5,
  /** Distance (cells) from the victor's capital at which the far chance applies. */
  wildernessRange: 150,
  /** An army flees a hostile force this many times stronger within this radius (cells)… */
  retreatRatio: 2.5,
  retreatRadius: 9,
  /** …losing this share of its men per second while it runs… */
  retreatAttrition: 0.012,
  /** …and sometimes scatters into two smaller armies. */
  splitChance: 0.3,
  /** Armies this close (cells) to a raging battle join their side, up to this many per side. */
  joinRange: 6,
  maxArmiesPerSide: 4,
  /** Budget costs: a settlers' expedition, a colony, a farm, a port and a festival. */
  expeditionBase: 40,
  expeditionPerSettler: 0.25,
  colonyBase: 1200,
  colonyPerCapita: 0.03,
  farmBase: 200,
  portBase: 250,
  worksPerCapita: 0.015,
  /** Each farm or port already standing makes the next one dearer. */
  worksGrowth: 0.35,
  festivalBase: 80,
  festivalPerCapita: 0.008,
  festivalGrowth: 0.3,
  /** What a festival brings: satisfaction, culture (up to 5) and renown. */
  festivalMood: 3,
  festivalCulture: 0.1,
  festivalPrestige: 0.2,
  /** City size (people) at which buildings cost twice their base price. */
  improvementPopScale: 40000,
  /** Army the military fund aims for: this many hoplites per worker per unit of military share… */
  armyPerShare: 0.5,
  /** …never more than this share of the workers, even with the whole budget. */
  armyCap: 0.4,
  /** Share of the surplus garrison sent home to work per second after the military share is cut. */
  demobilizeRate: 0.1,
  /** Countryside developments take this many months, at random, to appear. */
  developMonthsMin: 1,
  developMonthsMax: 12,
  /** A stray pocket of land this small, cut off from its capital, goes back to the wild after this many seconds (4 years). */
  strayPocket: 4,
  strayDecay: 16,
  /** Power projection gained each year per hegemony point. */
  hegemonyPrestige: 0.1,
  /** The Hegemon of Hellas earns this much more from sea trade, and ships favour its harbours as much. */
  hegemonTradeBonus: 0.05,
  /** A polis scoring at least this many hegemony points for this many years in a row unites Hellas against it… */
  coalitionScore: 7,
  coalitionYears: 10,
  /** …and the coalition breaks up once its score falls below this. */
  coalitionEnds: 6,
  /** Every year of the coalition, every other city's regard for it sinks this much. */
  coalitionRelation: -2,
  /** Coalition cities look on the dominant polis as this much weaker when choosing whom to attack… */
  coalitionAggression: 2,
  /** …think of war more often… */
  coalitionWarChance: 0.35,
  /** …and seek one ally against it (chance per AI decision); these pacts lapse when the coalition ends. */
  coalitionAllyChance: 0.05,
  /** Cells more than the enemy a side must have taken for a war ending in peace to count as won. */
  warWonMargin: 5,
  /** At war a polis fields between this many armies… */
  armiesMin: 2,
  armiesMax: 5,
  /** …the main army taking this share of the spare garrison, each raiding party a random share in this range. */
  mainShare: 0.5,
  raiderShareMin: 0.15,
  raiderShareMax: 0.3,
  /** Raiders run from any enemy army at least this large relative to themselves. */
  raiderFearRatio: 0.8,
  /** A main army outmatched by the rival main army digs in: its power climbs to this multiple… */
  holdPowerMax: 1.5,
  /** …gaining this much per second… */
  holdPowerRate: 0.05,
  /** …and it engages any enemy army that comes within this many cells. */
  holdRadius: 30,
  /** In wartime, cut-off pockets of land this small pass to whichever side's capital is nearer… */
  enclaveSize: 8,
  /** …checked this often (seconds). */
  borderTidyInterval: 2,
  /** Hoplites a polis at war always keeps behind its walls. */
  garrisonFloor: 100,
  /** An army smaller than this does not lay siege to a capital. */
  siegeMinimum: 200,
  /** An army this much stronger (in power or numbers) hunts enemy armies within chaseRadius cells. */
  chaseRatio: 1.5,
  chaseRadius: 14,
  /** Armies within this many cells of a besieged friendly capital march to lift the siege. */
  reliefRadius: 70,
  /** Island poleis that do not feel the pull of border wars. */
  islandPoleis: ['samos', 'naxos', 'korkyra', 'chios'] as readonly string[],
  /** A bordering rival looks this much weaker to an ambitious neighbour. */
  neighbourAggression: 1.35,
  /** Cells per second. */
  armySpeedLand: 6.5,
  armySpeedSea: 4.2,
  /** Speed lost per 1000 m of altitude. */
  mountainSlowdown: 0.35,
  captureDwell: 1.4,
  /** Radius (cells) of ground seized each time an army settles in. */
  captureRadius: 1.6,
  battleDuration: 1.8,
  battleRange: 3.6,
  wallsBonus: 1.25,
  aiWarGrace: 45,
  aiPlayerGrace: 90,
  aiWarRange: 165,
  maxWorldWars: 4,
  victoryShare: 0.5
} as const;

export interface Expedition {
  settlers: number;
  initial: number;
  timer: number;
  /** Already reported a colony across the sea during this expedition. */
  colony: boolean;
  /** Wild cells bordering the settled land, lowest ground first. */
  frontier: MinHeap;
  queued: Set<number>;
}

export type BuildingKind = 'farm' | 'port';
export type DevelopmentOutcome = BuildingKind | 'vassal';

export interface Building {
  cell: number;
  kind: BuildingKind;
  t: number;
}

export interface PolisState {
  idx: number;
  def: PolisDef;
  militarism: number;
  culture: number;
  /** Polis this one is a vassal of, or -1. */
  overlord: number;
  developments: number;
  /** Buildings standing on its land (recounted every tick; they change hands with the land). */
  farms: number;
  ports: number;
  capital: number;
  cx: number;
  cy: number;
  alive: boolean;
  civilians: number;
  garrison: number;
  drachmae: number;
  income: number;
  cells: number;
  fertility: number;
  /** Growth & income multiplier earned by settling the wilderness. */
  prosperity: number;
  expedition: Expedition | null;
  wars: Set<number>;
  warStart: Map<number, number>;
  peaceCooldown: Map<number, number>;
  nextAi: number;
  nextSpawn: number;
  conqueror: number;
  /** Bumped whenever one of its cells changes owner. */
  version: number;
  nextShip: number;
  /** Sea cell its merchants sail from (-1: landlocked), refreshed periodically. */
  harbour: number;
  harbourAt: number;
  /** Drachmae earned from sea trade so far. */
  tradeEarned: number;
  /** Captives working the land; counted as workers, they neither grow nor fight. */
  slaves: number;
  /** Power projection earned in battle. */
  prestige: number;
  /** Defensive allies: each joins any war declared on the other. */
  allies: Set<number>;
  /** No new alliance offers before this time. */
  embassyAt: number;
  /** 0–100 contentment of the citizens. */
  satisfaction: number;
  /** Satisfaction only recovers on its own after this time. */
  calmFrom: number;
  /** Founding time; young poleis are easier to raze. */
  founded: number;
  /** Paying tribute to its overlord after being conquered. */
  client: boolean;
  /** What remains on the map after the fall: a city within the victor's borders. */
  remnant: 'city' | null;
  /** Armies camped before its walls (recounted every tick). */
  besieged: number;
  /** Stormed by the player and waiting for its fate to be decided. */
  captured: boolean;
  /** Diplomatic reputation with every other polis, by index (−100…+100). */
  relations: number[];
  /** Gross income from work (before hoplite pay), and the pay itself, per second. */
  gross: number;
  upkeep: number;
  /** Smoothed drachmae per second reaching the funds from every source (taxes, trade, tribute, spoils). */
  inflow: number;
  /** Hegemony points (0–9) this year, and years in a row at or above the coalition threshold. */
  hegemonyScore: number;
  dominantYears: number;
  /** The military fund ran dry this tick: unpaid hoplites are going home. */
  unpaid: boolean;
  /** Battles won and lost, capitals taken and wars won, for the history and the hegemony rankings. */
  battlesWon: number;
  battlesLost: number;
  capitalsTaken: number;
  warsWon: number;
  /** Cells taken from each current enemy during this war (decides who won when peace is made). */
  warGains: Map<number, number>;
  lastVictoryAt: number;
  /** Trade voyages completed to (or received from) each other polis, by index. */
  voyages: number[];
  /** Tribute received from client states so far. */
  tributeGold: number;
  tributeWorkers: number;
  /** Shares (%) of income going to each fund, and the drachmae each fund holds. */
  budget: Budget;
  funds: Budget;
  festivals: number;
  colonies: number;
  /** A fund found no site for its project; it looks again after this time. */
  retryAt: Budget;
  /** Completed buildings of the Polis screen and their summed nationwide bonuses. */
  built: Set<ImprovementId>;
  effects: ImprovementEffects;
  /** Buildings under construction (at most one per tree). */
  works: Construction[];
}

export interface Construction {
  id: ImprovementId;
  tree: ImprovementTree;
  start: number;
  done: number;
}

/** Running tally of one of the player's wars, turned into a report when it ends. */
export interface WarStats {
  enemy: number;
  start: number;
  battlesWon: number;
  battlesLost: number;
  cellsGained: number;
  cellsLost: number;
  enemyLosses: number;
  ownLosses: number;
  gold: number;
  captives: number;
}

export type WarOutcome = 'conquest' | 'peace';
export type FallOutcome = 'razed' | 'city' | 'client' | 'revolt' | 'ransom' | 'alliance';
/** What the player decides for a city whose walls they have breached. */
export type ConquestChoice = 'raze' | 'subjugate' | 'alliance';
/** Why a city offers the player an alliance; it shapes what the envoys say. */
export type AllianceReason = 'victories' | 'trade' | 'commonEnemy' | 'hegemon' | 'neighbour' | 'goodwill';

export interface WarReport extends WarStats {
  outcome: WarOutcome;
  /** What became of the enemy when the war ended in its fall. */
  fate: FallOutcome | null;
  years: number;
  /** Satisfaction change brought by the end of the war. */
  satisfaction: number;
}

/** Spoils of a battle won by the player, consumed by the UI. */
export interface BattleReport {
  enemy: number;
  /** Closest living polis to the battlefield (the place the battle is named after). */
  near: number;
  gold: number;
  slaves: number;
  prestige: number;
  enemyLosses: number;
  ownLosses: number;
}

/** A merchant ship sailing a precomputed sea route between two friendly harbours. */
export interface Ship {
  id: number;
  owner: number;
  dest: number;
  /** Polyline in map coordinates: x0, y0, x1, y1, … */
  path: number[];
  seg: number;
  along: number;
  x: number;
  y: number;
  angle: number;
  done: boolean;
}

/** A floating "+income" marker where a voyage was completed. */
export interface TradeFx {
  x: number;
  y: number;
  t: number;
  amount: number;
  owner: number;
}

export interface Army {
  id: number;
  owner: number;
  x: number;
  y: number;
  strength: number;
  target: number;
  dwell: number;
  battle: number;
  dead: boolean;
  /** Running from a much stronger enemy. */
  fleeing: boolean;
  /** Already scattered once; it will not split again. */
  split: boolean;
  /** Angle (radians) a scattered half veers off its line of flight. */
  fleeAngle: number;
  /** Polis being besieged, or -1. */
  siege: number;
  siegeStart: number;
  siegeEnd: number;
  /** The main army seeks battle; raiders plunder the countryside and shun a fight. */
  role: ArmyRole;
  /** A main army outmatched by the enemy's main army halts and holds its ground. */
  stance: 'march' | 'hold';
  /** Battle power multiplier from digging in (1 … RULES.holdPowerMax). */
  fortify: number;
}

export type ArmyRole = 'main' | 'raider';

export interface Battle {
  id: number;
  x: number;
  y: number;
  /** Armies on each side; others nearby may join while the dust flies. */
  attackers: Army[];
  defenders: Army[];
  /** Polis whose garrison defends its walls (an assault after a siege), or -1. */
  garrison: number;
  /** Leading polis of each side (colours and spoils). */
  sideA: number;
  sideB: number;
  start: number;
  end: number;
}

/** A farm, port or vassal town ordered by "Develop the countryside", appearing when ready. */
export interface PendingDevelopment {
  owner: number;
  kind: DevelopmentOutcome;
  cell: number;
  site: SiteId | null;
  ready: number;
}

/** What the surveyors announce when the countryside is developed. */
export interface DevelopmentPlan {
  kind: DevelopmentOutcome;
  months: number;
  site: SiteId | null;
}

export interface Claim {
  cell: number;
  t: number;
}

export type GameEventKind =
  | 'war'
  | 'peace'
  | 'peaceRefused'
  | 'settle'
  | 'colony'
  | 'fall'
  | 'farm'
  | 'port'
  | 'vassal'
  | 'alliance'
  | 'allianceOffer'
  | 'siege'
  | 'client'
  | 'annexed'
  | 'secession'
  | 'captured'
  | 'revolt'
  | 'ransom'
  | 'festival'
  | 'farmPlanned'
  | 'portPlanned'
  | 'built'
  | 'podium'
  | 'hegemon'
  | 'coalition'
  | 'coalitionEnd';

export interface GameEvent {
  id: number;
  kind: GameEventKind;
  a: number;
  b: number;
  year: number;
  /** Extra figure for the chronicle, e.g. months until planned works are ready, or a third polis. */
  n?: number;
  /** Extra tag, e.g. the reason behind an alliance offer. */
  tag?: string;
}

export type GameStatus = 'choosing' | 'playing' | 'won' | 'lost';

/**
 * Framework-free RTS simulation. Owns the territory raster, the poleis economies,
 * the autonomous armies and the AI. Rendering and UI read its state directly.
 */
export class Simulation {
  readonly owner: Int16Array;
  poleis: PolisState[] = [];
  armies: Army[] = [];
  battles: Battle[] = [];
  buildings: Building[] = [];
  pendingDevelopments: PendingDevelopment[] = [];
  ships: Ship[] = [];
  tradeFx: TradeFx[] = [];
  /** Battles the player has won since the UI last took them. */
  reports: BattleReport[] = [];
  /** Wars the player has finished since the UI last took them. */
  warReports: WarReport[] = [];
  /** Open wars of the player, by enemy. */
  private playerWars = new Map<number, WarStats>();
  /** Colonies commissioned, for the pop-up. */
  private plans: { owner: number; plan: DevelopmentPlan }[] = [];
  /** Cities the player has stormed, awaiting a decision. */
  private conquests: number[] = [];
  /** Pairs of poleis whose land touches (key: lower * 4096 + higher), refreshed every second. */
  private borders = new Set<number>();
  private nextDiplomacy = 0;
  /** No embassy reaches the player before this time. */
  private nextEmbassy = 0;
  private nextTidy = 0;
  /** Game time each cell was first found stranded in a stray pocket (0 = it is not). */
  private strayAt = new Float64Array(0);
  claims: Claim[] = [];
  events: GameEvent[] = [];
  time = 0;
  status: GameStatus = 'choosing';
  player = -1;
  /** Bumped whenever any cell changes owner, so renderers know to repaint. */
  version = 0;
  /** Bumped on every reset; renderers repaint everything. */
  resets = 0;
  wildCells = 0;
  private dirty: number[] = [];

  private nextId = 1;
  /** Math.random by default; a fixed seed makes runs reproducible (tests, autoplay). */
  private readonly rand: () => number;
  /** Autoplay: the chosen polis is run by the AI too (headless balance runs). */
  private readonly autoplay: boolean;
  /** The Hegemon of Hellas (-1 if none) and the polis the rest of Hellas has united against (-1 if none). */
  hegemon = -1;
  coalitionTarget = -1;
  /** Alliances made against the dominant polis, as "a-b" pairs; they lapse with the coalition. */
  private coalitionPacts = new Set<string>();
  /** Greek land cell of every vassal site, resolved once. */
  private readonly siteCells: { id: SiteId; lon: number; lat: number; cell: number }[];
  private usedSites = new Set<SiteId>();
  private secessions = 0;
  /** Coarse sea grid for route planning, and routes already found between coarse harbour cells. */
  private readonly seaGrid: Uint8Array;
  private readonly seaCols: number;
  private readonly seaRows: number;
  private readonly routes = new Map<string, number[] | null>();

  constructor(
    readonly world: World,
    options: { seed?: number; autoplay?: boolean } = {}
  ) {
    this.rand = options.seed === undefined ? Math.random : seededRandom(options.seed);
    this.autoplay = !!options.autoplay;
    this.owner = new Int16Array(world.size);
    this.siteCells = SITES.map(site => ({ ...site, cell: this.landCellAt(site.lon, site.lat) }));
    const k = RULES.routeCoarse;
    this.seaCols = Math.ceil(world.cols / k);
    this.seaRows = Math.ceil(world.rows / k);
    this.seaGrid = new Uint8Array(this.seaCols * this.seaRows);
    for (let cy = 0; cy < this.seaRows; cy++) {
      for (let cx = 0; cx < this.seaCols; cx++) {
        let sea = 0;
        for (let y = cy * k; y < Math.min(world.rows, cy * k + k); y++) {
          for (let x = cx * k; x < Math.min(world.cols, cx * k + k); x++) {
            if (world.terrain[y * world.cols + x] === Terrain.Sea) sea++;
          }
        }
        // Mostly-water blocks are navigable, so narrow straits stay open.
        this.seaGrid[cy * this.seaCols + cx] = sea >= (k * k) / 2 ? 1 : 0;
      }
    }
    this.reset();
  }

  private landCellAt(lon: number, lat: number): number {
    const w = this.world;
    const p = w.project(lon, lat);
    const cell = w.cellAt(p.x, p.y);
    return cell >= 0 && w.terrain[cell] === Terrain.Greek ? cell : w.nearestGreekCell(p.x, p.y);
  }

  private createPolis(def: PolisDef, idx: number, capital: number, overlord: number): PolisState {
    const w = this.world;
    return {
      idx,
      def,
      militarism: def.militarism,
      culture: def.culture,
      overlord,
      developments: 0,
      farms: 0,
      ports: 0,
      capital,
      cx: (capital % w.cols) + 0.5,
      cy: Math.floor(capital / w.cols) + 0.5,
      alive: true,
      civilians: 0,
      garrison: 0,
      drachmae: 120,
      income: 0,
      cells: 0,
      fertility: 0,
      prosperity: 1,
      expedition: null,
      wars: new Set<number>(),
      warStart: new Map<number, number>(),
      peaceCooldown: new Map<number, number>(),
      nextAi: this.time + 2 + idx * 0.17,
      nextSpawn: 0,
      conqueror: -1,
      version: 0,
      nextShip: this.time + 3 + this.rand() * RULES.shipInterval,
      harbour: -1,
      harbourAt: -Infinity,
      tradeEarned: 0,
      slaves: 0,
      prestige: 0,
      allies: new Set<number>(),
      embassyAt: this.time + 60,
      satisfaction: RULES.satisfactionStart,
      calmFrom: 0,
      founded: this.time,
      client: false,
      captured: false,
      relations: [],
      unpaid: false,
      hegemonyScore: 0,
      dominantYears: 0,
      gross: 0,
      upkeep: 0,
      inflow: 0,
      battlesWon: 0,
      battlesLost: 0,
      capitalsTaken: 0,
      warsWon: 0,
      warGains: new Map<number, number>(),
      lastVictoryAt: -Infinity,
      voyages: [],
      remnant: null,
      besieged: 0,
      tributeGold: 0,
      tributeWorkers: 0,
      budget: this.defaultBudget(def),
      funds: { military: 0, colonization: 0, agriculture: 0, trade: 0, culture: 0 },
      festivals: 0,
      colonies: 0,
      retryAt: { military: 0, colonization: 0, agriculture: 0, trade: 0, culture: 0 },
      built: new Set<ImprovementId>(),
      effects: { ...NO_EFFECTS },
      works: []
    };
  }

  /** Founding population and garrison sized to the land just claimed. */
  private populate(p: PolisState) {
    p.civilians = this.capacity(p) * RULES.startPopulation;
    p.garrison = Math.round(p.civilians * (RULES.startGarrison + RULES.startGarrisonPerMilitarism * p.militarism));
  }

  /**
   * Multi-source Dijkstra: land spreads over plains and stops at mountains (climbing 1000 m doubles
   * the cost of a step), and neighbouring founders split contested ground fairly.
   */
  private floodClaim(sources: { cell: number; idx: number }[], reach: number, canTake: (cell: number) => boolean) {
    const w = this.world;
    const heap = new MinHeap();
    const cost = new Map<number, number>();
    const from = new Map<number, number>();
    for (const s of sources) {
      cost.set(s.cell, 0);
      from.set(s.cell, s.idx);
      heap.push(s.cell, 0);
    }
    const claimed = new Set<number>();
    while (heap.size) {
      const k = heap.peekKey();
      const c = heap.pop();
      if (k > cost.get(c)! || claimed.has(c)) continue;
      claimed.add(c);
      this.setOwner(c, from.get(c)!, false);
      const x = c % w.cols;
      const y = (c - x) / w.cols;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if ((!dx && !dy) || !w.inBounds(x + dx, y + dy)) continue;
          const n = w.index(x + dx, y + dy);
          if (claimed.has(n) || !canTake(n)) continue;
          const next = k + Math.hypot(dx, dy) * (1 + Math.max(0, w.elevation[n]) / 1000);
          if (next > reach || next >= (cost.get(n) ?? Infinity)) continue;
          cost.set(n, next);
          from.set(n, from.get(c)!);
          heap.push(n, next);
        }
      }
    }
  }

  get year(): number {
    return RULES.startYear - Math.floor(this.time / RULES.secondsPerYear);
  }

  reset() {
    const w = this.world;
    for (let c = 0; c < w.size; c++) {
      const t = w.terrain[c];
      this.owner[c] = t === Terrain.Greek ? WILD : t === Terrain.Foreign ? FOREIGN : SEA;
    }
    this.wildCells = w.greekCells.length;
    this.armies = [];
    this.battles = [];
    this.claims = [];
    this.events = [];
    this.time = 0;
    this.status = 'choosing';
    this.player = -1;
    this.dirty = [];
    this.resets++;

    this.buildings = [];
    this.pendingDevelopments = [];
    this.ships = [];
    this.tradeFx = [];
    this.reports = [];
    this.warReports = [];
    this.playerWars = new Map();
    this.conquests = [];
    this.borders = new Set();
    this.nextDiplomacy = 0;
    this.nextEmbassy = 0;
    this.nextTidy = 0;
    this.hegemon = -1;
    this.coalitionTarget = -1;
    this.coalitionPacts = new Set();
    this.strayAt = new Float64Array(this.world.size);
    this.usedSites = new Set();
    this.poleis = POLEIS.map((def, idx) => this.createPolis(def, idx, this.landCellAt(def.lon, def.lat), -1));
    this.floodClaim(
      this.poleis.map(p => ({ cell: p.capital, idx: p.idx })),
      RULES.startReach,
      c => this.owner[c] === WILD
    );
    for (const p of this.poleis) this.populate(p);
    this.version++;
  }

  choose(idx: number) {
    if (this.status !== 'choosing' || !this.poleis[idx]) return;
    this.player = idx;
    this.status = 'playing';
  }

  // ─── Derived figures ──────────────────────────────────────────────────────

  capacity(p: PolisState): number {
    const land = p.fertility * RULES.peoplePerFertility + RULES.farmCapacity * p.farms;
    return Math.max(1, land * (1 + p.effects.capacity));
  }

  /** Multiplier applied to an army's (or garrison's) strength in battle. */
  battleMultiplier(idx: number): number {
    const p = this.poleis[idx];
    return 1 + RULES.militarismBonus * p.militarism + p.effects.battle;
  }

  /** Income and growth multiplier from the citizens' mood. */
  /**
   * Where a polis's income comes from, per second: the workers' base yield, the multipliers on it
   * (culture, ports, buildings, contentment), other cash (sea trade, tribute, spoils) and hoplite pay.
   */
  incomeBreakdown(p: PolisState) {
    const avgFertility = p.fertility / Math.max(1, p.cells);
    const base = this.workers(p) * RULES.incomePerWorker * p.prosperity * (0.7 + 0.3 * avgFertility);
    return {
      workers: this.workers(p),
      base,
      culture: RULES.cultureBonus * p.culture,
      ports: RULES.portBonus * p.ports,
      buildings: p.effects.income,
      mood: this.moodFactor(p),
      prosperity: p.prosperity,
      gross: p.gross,
      other: Math.max(0, p.inflow - p.gross),
      upkeep: p.upkeep
    };
  }

  moodFactor(p: PolisState): number {
    const lo = RULES.satisfactionLow;
    return lo + (RULES.satisfactionHigh - lo) * (p.satisfaction / 100);
  }

  /** Settlers needed per cell of wilderness (terraces make each go further). */
  settlersPerCell(p: PolisState): number {
    return RULES.settlersPerCell / (1 + p.effects.settle);
  }

  /** A polis together with its overlord and fellow vassals: they share every war and peace. */
  bloc(idx: number): number[] {
    const p = this.poleis[idx];
    const root = p.overlord >= 0 && this.poleis[p.overlord].alive ? p.overlord : idx;
    return this.poleis.filter(q => q.alive && (q.idx === root || q.overlord === root)).map(q => q.idx);
  }

  vassalsOf(idx: number): number[] {
    return this.poleis.filter(q => q.alive && q.overlord === idx).map(q => q.idx);
  }

  workers(p: PolisState): number {
    return Math.floor(p.civilians * RULES.laborShare + p.slaves);
  }

  fieldStrength(idx: number): number {
    let s = 0;
    for (const a of this.armies) if (a.owner === idx && !a.dead) s += a.strength;
    return s;
  }

  warriors(p: PolisState): number {
    return Math.round(p.garrison + this.fieldStrength(p.idx));
  }

  totalPopulation(p: PolisState): number {
    return Math.round(p.civilians + p.slaves + p.garrison + this.fieldStrength(p.idx));
  }

  settlers(p: PolisState): number {
    return Math.floor(this.workers(p) * RULES.settleShare);
  }

  /** Colonists only leave a city that is filling up its land. */
  canSettle(p: PolisState): boolean {
    return (
      p.alive &&
      !p.expedition &&
      this.wildCells > 0 &&
      this.settlers(p) >= this.settlersPerCell(p) &&
      this.totalPopulation(p) >= this.capacity(p) * RULES.settleCrowding
    );
  }

  trainBatch(p: PolisState): number {
    const share = p.budget.military / 100;
    return Math.max(50, Math.round(this.workers(p) * (RULES.trainShare + RULES.trainPerShare * share)));
  }

  /** Hoplites the next levy raises: a share-sized batch, never past the army the budget aims for. */
  levySize(p: PolisState): number {
    return Math.max(0, Math.min(this.trainBatch(p), Math.floor(this.armyTarget(p) - this.warriors(p))));
  }

  trainCost(p: PolisState): number {
    return Math.ceil(this.levySize(p) * RULES.trainCostPerHoplite * (1 - p.effects.train));
  }

  /** All the drachmae a polis holds: its five funds plus anything not yet allocated. */
  treasury(p: PolisState): number {
    return p.drachmae + BUDGET_KEYS.reduce((sum, k) => sum + p.funds[k], 0);
  }

  /** Takes a share of every fund (ransom, plunder). Returns the amount taken. */
  private plunder(p: PolisState, share: number): number {
    let taken = 0;
    for (const k of BUDGET_KEYS) {
      taken += p.funds[k] * share;
      p.funds[k] *= 1 - share;
    }
    return taken;
  }

  /** The player (or the AI) reallocates its income. */
  setBudget(idx: number, key: BudgetKey, value: number) {
    const p = this.poleis[idx];
    if (p) p.budget = rebalanceBudget(p.budget, key, value);
  }

  /** Replaces all five shares at once (a preset); invalid budgets are normalised. */
  setShares(idx: number, budget: Budget) {
    const p = this.poleis[idx];
    if (p) p.budget = normalizeBudget(budget);
  }

  /** A city's habits: warlike cities arm, cultured ones celebrate, everyone settles while land is free. */
  private defaultBudget(def: PolisDef): Budget {
    return normalizeBudget({
      military: 15 + 6 * def.militarism,
      colonization: 25,
      agriculture: 20,
      trade: 15,
      culture: 6 + 4 * def.culture
    });
  }

  canTrain(p: PolisState): boolean {
    return p.alive && this.workers(p) > this.trainBatch(p) * 3;
  }

  canOfferPeace(p: PolisState, target: number): boolean {
    return p.wars.has(target) && (p.peaceCooldown.get(target) ?? 0) <= this.time;
  }

  // ─── Player & AI actions ──────────────────────────────────────────────────

  settle(idx: number) {
    const p = this.poleis[idx];
    if (!this.canSettle(p)) return;
    const settlers = this.settlers(p);
    p.civilians -= settlers;
    const frontier = new MinHeap();
    const queued = new Set<number>();
    const w = this.world;
    for (const c of w.greekCells) {
      if (this.owner[c] !== WILD) continue;
      const x = c % w.cols;
      if (w.neighbours4(x, (c - x) / w.cols).some(n => this.owner[n] === idx)) {
        queued.add(c);
        frontier.push(c, this.settleCost(p, c));
      }
    }
    p.expedition = { settlers, initial: settlers, timer: 0, colony: false, frontier, queued };
    this.mood(p, RULES.satisfactionSettle, true);
    this.emit('settle', idx);
  }

  private train(idx: number) {
    const p = this.poleis[idx];
    if (!this.canTrain(p)) return;
    const batch = this.levySize(p);
    p.civilians -= batch;
    p.garrison += batch;
    this.mood(p, RULES.satisfactionTrain, true);
  }

  /** Shifts satisfaction; unpopular acts also pause its natural recovery for a while. */
  private mood(p: PolisState, delta: number, unpopular = false) {
    p.satisfaction = Math.max(0, Math.min(100, p.satisfaction + delta));
    if (unpopular) p.calmFrom = this.time + RULES.satisfactionCalm;
  }

  // ─── Polis buildings ──────────────────────────────────────────────────────

  improvementState(p: PolisState, id: ImprovementId): 'built' | 'building' | 'available' | 'locked' {
    if (p.built.has(id)) return 'built';
    if (p.works.some(w => w.id === id)) return 'building';
    const def = IMPROVEMENT_BY_ID.get(id)!;
    const previous = [...IMPROVEMENT_BY_ID.values()].find(d => d.tree === def.tree && d.tier === def.tier - 1);
    if (previous && !p.built.has(previous.id)) return 'locked';
    if (p.works.some(w => w.tree === def.tree)) return 'locked';
    return 'available';
  }

  canImprove(p: PolisState, id: ImprovementId): boolean {
    const cost = improvementCost(IMPROVEMENT_BY_ID.get(id)!.tier);
    return (
      p.alive &&
      this.improvementState(p, id) === 'available' &&
      p.funds[TREE_FUND[IMPROVEMENT_BY_ID.get(id)!.tree]] >= this.improvementPrice(p, id) &&
      p.satisfaction >= cost.satisfaction
    );
  }

  /** Lays the foundations of a building, paid from its tree's fund; it stands a year later. */
  private improve(idx: number, id: ImprovementId) {
    const p = this.poleis[idx];
    if (!this.canImprove(p, id)) return;
    const def = IMPROVEMENT_BY_ID.get(id)!;
    const cost = improvementCost(def.tier);
    p.funds[TREE_FUND[def.tree]] -= this.improvementPrice(p, id);
    this.mood(p, -cost.satisfaction, true);
    p.works.push({ id, tree: def.tree, start: this.time, done: this.time + RULES.secondsPerYear });
  }

  private finishWorks(p: PolisState) {
    const done = p.works.filter(w => this.time >= w.done);
    if (!done.length) return;
    p.works = p.works.filter(w => this.time < w.done);
    for (const w of done) {
      p.built.add(w.id);
      this.emit('built', p.idx, -1, undefined, w.id);
      p.prestige += IMPROVEMENT_BY_ID.get(w.id)!.effects.prestige ?? 0;
    }
    const fx: ImprovementEffects = { ...NO_EFFECTS };
    for (const id of p.built) {
      const effects = IMPROVEMENT_BY_ID.get(id)!.effects;
      for (const key of Object.keys(effects) as (keyof ImprovementEffects)[]) fx[key] += effects[key] ?? 0;
    }
    p.effects = fx;
  }

  declareWar(a: number, b: number) {
    const pa = this.poleis[a];
    const pb = this.poleis[b];
    if (a === b || !pa?.alive || !pb?.alive || pa.wars.has(b)) return;
    const mine = this.bloc(a);
    if (mine.includes(b)) return;
    // Attacking an ally tears up the treaty.
    pa.allies.delete(b);
    pb.allies.delete(a);
    // Overlords and vassals march together…
    const theirs = this.bloc(b);
    for (const x of mine) for (const y of theirs) this.link(x, y);
    this.shiftRelation(a, b, RULES.relationDeclareWar);
    this.emit('war', a, b);
    // …and the defender's allies come to its aid.
    for (const d of theirs) {
      for (const ally of this.poleis[d].allies) {
        if (!this.poleis[ally].alive || mine.includes(ally)) continue;
        for (const x of this.bloc(ally)) for (const y of mine) this.link(x, y);
      }
    }
  }

  allied(a: number, b: number): boolean {
    return this.poleis[a]?.allies.has(b) ?? false;
  }

  /** Seals a defensive alliance; the two make peace first if they were fighting. */
  ally(a: number, b: number) {
    const pa = this.poleis[a];
    const pb = this.poleis[b];
    if (a === b || !pa?.alive || !pb?.alive || pa.allies.has(b)) return;
    if (pa.wars.has(b)) this.makePeace(a, b);
    pa.allies.add(b);
    pb.allies.add(a);
    this.shiftRelation(a, b, RULES.relationAlliance);
    this.emit('alliance', a, b);
  }

  /**
   * The year's hegemony rankings come back to the cities: renown for every point, the Hegemon's
   * pull on trade, and — when one city has towered over Hellas for a decade — a coalition against it.
   */
  applyHegemony(scores: Record<number, number>, hegemon: number) {
    this.hegemon = hegemon;
    for (const p of this.poleis) {
      const score = p.alive ? (scores[p.idx] ?? 0) : 0;
      p.hegemonyScore = score;
      p.prestige += RULES.hegemonyPrestige * score;
      p.dominantYears = score >= RULES.coalitionScore ? p.dominantYears + 1 : 0;
    }
    const target = this.coalitionTarget >= 0 ? this.poleis[this.coalitionTarget] : null;
    if (target && (!target.alive || target.hegemonyScore < RULES.coalitionEnds)) {
      this.emit('coalitionEnd', target.idx);
      this.coalitionTarget = -1;
      // Friends of convenience go their own ways.
      for (const pact of this.coalitionPacts) {
        const [a, b] = pact.split('-').map(Number);
        this.poleis[a].allies.delete(b);
        this.poleis[b].allies.delete(a);
      }
      this.coalitionPacts.clear();
    }
    if (this.coalitionTarget < 0) {
      const dominant = this.poleis.find(p => p.alive && p.dominantYears >= RULES.coalitionYears);
      if (dominant) {
        this.coalitionTarget = dominant.idx;
        this.emit('coalition', dominant.idx);
      }
    }
    if (this.coalitionTarget >= 0) {
      const t = this.poleis[this.coalitionTarget];
      for (const q of this.poleis) if (q.alive && this.inCoalition(q, t.idx)) this.shiftRelation(q.idx, t.idx, RULES.coalitionRelation);
    }
  }

  /** Whether a city stands with Hellas against the dominant polis (not the polis itself, its bloc or its allies). */
  private inCoalition(p: PolisState, target: number): boolean {
    return p.idx !== target && !this.bloc(target).includes(p.idx) && !this.poleis[target].allies.has(p.idx);
  }

  /** A coalition city looks for a partner against the dominant polis: someone already fighting it, or a neighbour. */
  private seekCoalitionAlly(p: PolisState, target: number) {
    const pacted = (q: PolisState) => [...this.coalitionPacts].some(k => k.split('-').map(Number).includes(q.idx));
    if (pacted(p) || p.overlord >= 0 || this.rand() >= RULES.coalitionAllyChance) return;
    let best: PolisState | null = null;
    let bestD = Infinity;
    for (const q of this.poleis) {
      if (!q.alive || q.idx === p.idx || q.overlord >= 0 || pacted(q) || p.allies.has(q.idx) || p.wars.has(q.idx)) continue;
      if (q.idx === this.player && !this.autoplay) continue;
      if (!this.inCoalition(q, target) || this.relation(p.idx, q.idx) < -20) continue;
      const d = Math.hypot(q.cx - p.cx, q.cy - p.cy) * (q.wars.has(target) ? 0.5 : 1);
      if (d < bestD) {
        bestD = d;
        best = q;
      }
    }
    if (best) {
      this.ally(p.idx, best.idx);
      this.coalitionPacts.add(`${p.idx}-${best.idx}`);
    }
  }

  /** Diplomatic reputation between two poleis (−100…+100). */
  relation(a: number, b: number): number {
    return this.poleis[a]?.relations[b] ?? 0;
  }

  private shiftRelation(a: number, b: number, delta: number) {
    if (a === b) return;
    const v = Math.max(-100, Math.min(100, this.relation(a, b) + delta));
    this.poleis[a].relations[b] = v;
    this.poleis[b].relations[a] = v;
  }

  /** Whether the lands of two poleis touch. */
  bordering(a: number, b: number): boolean {
    return this.borders.has(Math.min(a, b) * 4096 + Math.max(a, b));
  }

  private updateBorders() {
    const w = this.world;
    const own = this.owner;
    const set = new Set<number>();
    for (const c of w.greekCells) {
      const o = own[c];
      if (o < 0) continue;
      const x = c % w.cols;
      for (const n of [x < w.cols - 1 ? c + 1 : -1, c + w.cols < w.size ? c + w.cols : -1]) {
        const q = n >= 0 ? own[n] : -1;
        if (q >= 0 && q !== o) set.add(Math.min(o, q) * 4096 + Math.max(o, q));
      }
    }
    this.borders = set;
  }

  /**
   * Once a second every pair's reputation drifts back toward neutral while wars, shared borders and
   * armies sour it, and culture, renown and contented citizens sweeten it — very slowly.
   */
  private driftRelations(dt: number) {
    const alive = this.poleis.filter(p => p.alive);
    const avgArmy = alive.reduce((s, p) => s + this.warriors(p), 0) / Math.max(1, alive.length);
    const army = new Map(alive.map(p => [p.idx, Math.min(3, this.warriors(p) / Math.max(1, avgArmy))]));
    const warmth = (p: PolisState) =>
      RULES.relationPerCulture * p.culture +
      Math.min(0.05, RULES.relationPerPrestige * p.prestige) +
      (p.satisfaction > 70 ? RULES.relationContent : 0);
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i];
        const b = alive[j];
        let delta = -this.relation(a.idx, b.idx) * RULES.relationDecay;
        if (a.wars.has(b.idx)) delta += RULES.relationWar;
        if (this.bordering(a.idx, b.idx)) delta += RULES.relationNeighbour;
        delta += RULES.relationPerMilitarism * (a.militarism + b.militarism);
        delta += RULES.relationPerArmy * (army.get(a.idx)! + army.get(b.idx)!);
        delta += warmth(a) + warmth(b);
        this.shiftRelation(a.idx, b.idx, delta * dt);
      }
    }
  }

  /** What moves a city to seek the player's friendship: a shared enemy, victories, trade or a border. */
  private embassyReason(p: PolisState, me: PolisState): { reason: AllianceReason; enemy?: number } {
    const enemy = [...p.wars].find(e => me.wars.has(e));
    if (enemy !== undefined) return { reason: 'commonEnemy', enemy };
    if (this.hegemon === me.idx) return { reason: 'hegemon' };
    if (this.time - me.lastVictoryAt < RULES.victoryMemory) return { reason: 'victories' };
    if ((p.voyages[me.idx] ?? 0) + (me.voyages[p.idx] ?? 0) >= RULES.tradeTies) return { reason: 'trade' };
    if (this.bordering(p.idx, me.idx)) return { reason: 'neighbour' };
    return { reason: 'goodwill' };
  }

  /** The player turned an embassy away; the city will not ask again for a while. */
  declineAlliance(from: number) {
    const p = this.poleis[from];
    if (p) p.embassyAt = this.time + 120;
  }

  private link(x: number, y: number) {
    const px = this.poleis[x];
    const py = this.poleis[y];
    if (x === y || px.wars.has(y)) return;
    px.wars.add(y);
    py.wars.add(x);
    px.warStart.set(y, this.time);
    py.warStart.set(x, this.time);
    px.warGains.set(y, 0);
    py.warGains.set(x, 0);
    px.nextSpawn = Math.min(px.nextSpawn, this.time);
    py.nextSpawn = Math.min(py.nextSpawn, this.time + 1);
    const enemy = x === this.player ? y : y === this.player ? x : -1;
    if (enemy >= 0) {
      this.playerWars.set(enemy, {
        enemy,
        start: this.time,
        battlesWon: 0,
        battlesLost: 0,
        cellsGained: 0,
        cellsLost: 0,
        enemyLosses: 0,
        ownLosses: 0,
        gold: 0,
        captives: 0
      });
    }
  }

  /** Closes the tally of one of the player's wars and queues its report. */
  private endPlayerWar(enemy: number, outcome: WarOutcome, fate: FallOutcome | null = null) {
    const stats = this.playerWars.get(enemy);
    if (!stats || this.status !== 'playing') return;
    this.playerWars.delete(enemy);
    const me = this.poleis[this.player];
    const balance = stats.cellsGained - stats.cellsLost + (stats.battlesWon - stats.battlesLost) * 20;
    const satisfaction =
      outcome === 'conquest' || balance > 0
        ? RULES.satisfactionWarWon
        : balance < 0
          ? RULES.satisfactionWarLost
          : 0;
    this.mood(me, satisfaction);
    this.warReports.push({
      ...stats,
      outcome,
      fate,
      years: Math.max(1, Math.round((this.time - stats.start) / RULES.secondsPerYear)),
      satisfaction
    });
  }

  takeWarReports(): WarReport[] {
    const out = this.warReports;
    this.warReports = [];
    return out;
  }

  /** The player proposes peace; the enemy weighs the balance of power. Returns whether it was accepted. */
  offerPeace(a: number, b: number): boolean {
    const pa = this.poleis[a];
    const pb = this.poleis[b];
    if (!this.canOfferPeace(pa, b)) return false;
    const ratio = this.warriors(pa) / Math.max(1, this.warriors(pb));
    const weary = this.time - (pa.warStart.get(b) ?? this.time) > 45;
    // A city that thinks well of you is readier to sheathe the sword.
    const goodwill = this.relation(a, b) / 200;
    const accept = ratio > 1.3 - goodwill || (weary && this.rand() < 0.5 + goodwill) || this.rand() < 0.2 + goodwill;
    if (accept) {
      this.makePeace(a, b);
    } else {
      pa.peaceCooldown.set(b, this.time + 10);
      this.emit('peaceRefused', a, b);
    }
    return accept;
  }

  makePeace(a: number, b: number) {
    if (!this.poleis[a].wars.has(b)) return;
    for (const x of this.bloc(a)) for (const y of this.bloc(b)) this.unlink(x, y);
    this.shiftRelation(a, b, RULES.relationPeace);
    this.emit('peace', a, b);
  }

  private unlink(a: number, b: number) {
    const pa = this.poleis[a];
    const pb = this.poleis[b];
    if (!pa.wars.has(b)) return;
    // Whoever took clearly more ground won the war.
    const ga = pa.warGains.get(b) ?? 0;
    const gb = pb.warGains.get(a) ?? 0;
    if (ga >= gb + RULES.warWonMargin) pa.warsWon++;
    else if (gb >= ga + RULES.warWonMargin) pb.warsWon++;
    pa.warGains.delete(b);
    pb.warGains.delete(a);
    pa.wars.delete(b);
    pb.wars.delete(a);
    pa.warStart.delete(b);
    pb.warStart.delete(a);
    if (a === this.player) this.endPlayerWar(b, 'peace');
    if (b === this.player) this.endPlayerWar(a, 'peace');
    for (const battle of this.battles) {
      const sideA = new Set([battle.sideA, ...battle.attackers.map(x => x.owner)]);
      const sideB = new Set([battle.sideB, ...battle.defenders.map(x => x.owner)]);
      if ((sideA.has(a) && sideB.has(b)) || (sideA.has(b) && sideB.has(a))) {
        battle.end = -1;
        for (const army of [...battle.attackers, ...battle.defenders]) army.battle = 0;
      }
    }
    this.battles = this.battles.filter(x => x.end >= 0);
    for (const army of this.armies) {
      if (army.owner === a || army.owner === b) army.target = -1;
    }
  }

  // ─── Development ──────────────────────────────────────────────────────────

  /**
   * Commissions works in the countryside: surveyors pick a site — usually low ground near the sea,
   * away from the walls — and the farm, port or colony appears 1–12 months later.
   * Returns the plan, or null when no suitable site exists.
   */
  private commission(p: PolisState, kind: DevelopmentOutcome): DevelopmentPlan | null {
    let plan: Omit<PendingDevelopment, 'owner' | 'ready'> | null = null;
    if (kind === 'vassal') {
      const site = this.vassalSite(p);
      if (site) plan = { kind, cell: site.cell, site: site.id };
    } else {
      const cell = kind === 'farm' ? this.farmSite(p) : this.portSite(p);
      if (cell >= 0) plan = { kind, cell, site: null };
    }
    if (!plan) return null;
    if (plan.site) this.usedSites.add(plan.site);
    p.developments++;
    const span = RULES.developMonthsMax - RULES.developMonthsMin + 1;
    const months = RULES.developMonthsMin + Math.floor(this.rand() * span);
    this.pendingDevelopments.push({ ...plan, owner: p.idx, ready: this.time + (months * RULES.secondsPerYear) / 12 });
    if (kind === 'vassal') this.plans.push({ owner: p.idx, plan: { kind, months, site: plan.site } });
    else this.emit(kind === 'farm' ? 'farmPlanned' : 'portPlanned', p.idx, -1, months);
    return { kind, months, site: plan.site };
  }

  /** Colonies commissioned since the UI last asked (the player is told by a pop-up). */
  takePlans(): { owner: number; plan: DevelopmentPlan }[] {
    const out = this.plans;
    this.plans = [];
    return out;
  }

  /** Completes developments whose time has come, if their site is still in the right hands. */
  private finishDevelopments() {
    const due = this.pendingDevelopments.filter(d => this.time >= d.ready);
    if (!due.length) return;
    this.pendingDevelopments = this.pendingDevelopments.filter(d => this.time < d.ready);
    for (const d of due) {
      const p = this.poleis[d.owner];
      if (!p.alive) continue;
      if (d.kind === 'vassal') {
        const site = this.siteCells.find(s => s.id === d.site);
        const o = site ? this.owner[site.cell] : -9;
        if (site && (o === WILD || o === p.idx)) this.foundVassal(p, site);
      } else if (this.owner[d.cell] === p.idx) {
        this.build(p, d.cell, d.kind);
      }
    }
  }

  private build(p: PolisState, cell: number, kind: BuildingKind): BuildingKind {
    this.buildings.push({ cell, kind, t: this.time });
    this.claims.push({ cell, t: this.time });
    if (kind === 'farm') p.farms++;
    else p.ports++;
    this.emit(kind, p.idx);
    return kind;
  }

  /** Whether the sea lies within `radius` cells. */
  private nearSea(cell: number, radius: number): boolean {
    const w = this.world;
    const x0 = cell % w.cols;
    const y0 = (cell - x0) / w.cols;
    for (let y = y0 - radius; y <= y0 + radius; y++) {
      for (let x = x0 - radius; x <= x0 + radius; x++) {
        if (w.inBounds(x, y) && w.terrain[w.index(x, y)] === Terrain.Sea) return true;
      }
    }
    return false;
  }

  /** Distance (cells) from a polis's capital. */
  private distanceFrom(p: PolisState, cell: number): number {
    const x = cell % this.world.cols;
    return Math.hypot(x + 0.5 - p.cx, (cell - x) / this.world.cols + 0.5 - p.cy);
  }

  private nearPending(cell: number, radius: number): boolean {
    return this.pendingDevelopments.some(d => {
      const cols = this.world.cols;
      return Math.hypot((d.cell % cols) - (cell % cols), Math.floor(d.cell / cols) - Math.floor(cell / cols)) < radius;
    });
  }

  private nearBuilding(cell: number, radius: number, kind?: BuildingKind): boolean {
    const cols = this.world.cols;
    const x = cell % cols;
    const y = (cell - x) / cols;
    return this.buildings.some(b => {
      if (kind && b.kind !== kind) return false;
      const bx = b.cell % cols;
      return Math.hypot(bx - x, (b.cell - bx) / cols - y) < radius;
    });
  }

  /** Draws one candidate with probability proportional to its weight, or -1 if there is none. */
  private weightedPick(candidates: number[], weight: (cell: number) => number): number {
    const weights = candidates.map(weight);
    let roll = this.rand() * weights.reduce((sum, v) => sum + v, 0);
    for (let i = 0; i < candidates.length; i++) {
      if ((roll -= weights[i]) <= 0) return candidates[i];
    }
    return candidates.length ? candidates[candidates.length - 1] : -1;
  }

  /** Fertile land, more often low and near the sea, rarely right under the walls; never crowding other works. */
  private farmSite(p: PolisState): number {
    const w = this.world;
    const candidates = w.greekCells.filter(
      c => this.owner[c] === p.idx && c !== p.capital && !this.nearBuilding(c, 4) && !this.nearPending(c, 4)
    );
    return this.weightedPick([...candidates], c => {
      const lowland = Math.exp(-Math.max(0, w.elevation[c]) / 600);
      const coast = this.nearSea(c, 2) ? 2.5 : 1;
      const walls = this.distanceFrom(p, c) < 10 ? 0.05 : 1;
      return w.fertility[c] * lowland * coast * walls;
    });
  }

  /** A low stretch of coast without a harbour yet, a little way from the city. */
  private portSite(p: PolisState): number {
    const w = this.world;
    const candidates = w.greekCells.filter(c => {
      if (this.owner[c] !== p.idx || c === p.capital) return false;
      const x = c % w.cols;
      if (!w.neighbours4(x, (c - x) / w.cols).some(n => w.terrain[n] === Terrain.Sea)) return false;
      return !this.nearBuilding(c, 6, 'port') && !this.nearBuilding(c, 2) && !this.nearPending(c, 4);
    });
    return this.weightedPick([...candidates], c => {
      const d = this.distanceFrom(p, c);
      const lowland = Math.exp(-Math.max(0, w.elevation[c]) / 400);
      return lowland * (d < 10 ? 0.05 : 1) * Math.exp(-Math.abs(d - 25) / 60);
    });
  }

  /** A free historical site for a daughter city: coastal lowland, not crowding the mother city. */
  private vassalSite(p: PolisState) {
    const capitals = new Set(this.poleis.map(q => q.capital));
    return this.siteCells
      .filter(s => !this.usedSites.has(s.id) && !capitals.has(s.cell))
      .filter(s => this.owner[s.cell] === WILD || this.owner[s.cell] === p.idx)
      .map(s => {
        const d = this.distanceFrom(p, s.cell);
        const score =
          d * 0.02 + Math.max(0, this.world.elevation[s.cell]) / 400 - (this.nearSea(s.cell, 3) ? 0.6 : 0) + this.rand() * 0.3;
        return { ...s, d, score };
      })
      .filter(s => s.d >= 12 && s.d < 220)
      .sort((a, b) => a.score - b.score)[0];
  }

  /** Founds a vassal town on a surveyed historical site. */
  private foundVassal(p: PolisState, site: { id: SiteId; lon: number; lat: number; cell: number }): boolean {
    this.usedSites.add(site.id);
    const idx = this.poleis.length;
    const v = this.createPolis(
      {
        kind: 'site',
        id: site.id,
        lon: site.lon,
        lat: site.lat,
        color: p.def.color,
        militarism: p.militarism,
        culture: Math.max(1, p.culture - 1)
      },
      idx,
      site.cell,
      p.idx
    );
    this.poleis.push(v);
    // Daughter cities take wild land and may be carved from the founder's own countryside.
    this.floodClaim([{ cell: site.cell, idx }], RULES.vassalReach, c => {
      const o = this.owner[c];
      return o === WILD || (o === p.idx && c !== p.capital);
    });
    this.populate(v);
    for (const e of p.wars) this.link(idx, e);
    this.emit('vassal', p.idx, idx);
    return true;
  }

  // ─── Simulation loop ──────────────────────────────────────────────────────

  step(dt: number) {
    if (this.status !== 'playing') return;
    let remaining = dt;
    while (remaining > 0) {
      const h = Math.min(0.1, remaining);
      this.tick(h);
      remaining -= h;
    }
  }

  private tick(dt: number) {
    this.time += dt;

    this.finishDevelopments();
    for (const p of this.poleis) p.farms = p.ports = p.besieged = 0;
    for (const a of this.armies) if (!a.dead && a.siege >= 0) this.poleis[a.siege].besieged++;
    for (const b of this.buildings) {
      const o = this.owner[b.cell];
      if (o < 0) continue;
      if (b.kind === 'farm') this.poleis[o].farms++;
      else this.poleis[o].ports++;
    }

    for (const p of this.poleis) {
      if (!p.alive) continue;
      this.finishWorks(p);
      this.contentment(p, dt);
      this.economy(p, dt);
      this.expedition(p, dt);
      if ((p.idx !== this.player || this.autoplay) && this.time >= p.nextAi) {
        this.think(p);
        p.nextAi = this.time + 2.5 + this.rand() * 1.5;
      }
      if (p.wars.size && this.time >= p.nextSpawn) {
        this.spawnArmy(p);
        p.nextSpawn = this.time + 2;
      }
      if (this.time >= p.nextShip) {
        this.launchShip(p);
        p.nextShip = this.time + RULES.shipInterval * (0.6 + this.rand() * 0.8);
      }
    }

    if (this.time >= this.nextTidy) {
      this.tidyBorders();
      this.nextTidy = this.time + RULES.borderTidyInterval;
    }
    if (this.time >= this.nextDiplomacy) {
      this.updateBorders();
      this.driftRelations(1);
      this.nextDiplomacy = this.time + 1;
    }

    this.sailShips(dt);
    this.tradeFx = this.tradeFx.filter(f => this.time - f.t < 2);

    this.moveArmies(dt);
    this.detectBattles();
    this.resolveBattles();
    this.armies = this.armies.filter(a => !a.dead);
    this.claims = this.claims.filter(c => this.time - c.t < 1.2);
    this.checkEnd();
  }

  /** Left in peace the citizens grow content; renown and buildings like vineyards help. */
  private contentment(p: PolisState, dt: number) {
    let rate = RULES.satisfactionPerPrestige * p.prestige + p.effects.regen;
    if (this.time >= p.calmFrom) rate += RULES.satisfactionRecovery;
    // Enemy camps before the walls: hunger, fear and idle hands.
    if (p.besieged) {
      rate -= RULES.siegeMood * p.besieged;
      p.garrison *= 1 - RULES.siegeStarvation * p.besieged * dt;
    }
    this.mood(p, rate * dt);
  }

  private economy(p: PolisState, dt: number) {
    const capacity = this.capacity(p);
    const total = this.totalPopulation(p);
    const mood = this.moodFactor(p);
    const siege = p.besieged ? RULES.siegeGrowth : 1;
    const rate = RULES.growthRate * p.prosperity * (1 + p.effects.growth) * mood * siege;
    let growth = rate * p.civilians * (1 - total / capacity);
    growth = Math.max(growth, -0.03 * p.civilians);
    p.civilians = Math.max(0, p.civilians + growth * dt);

    const avgFertility = p.fertility / Math.max(1, p.cells);
    const culture = 1 + RULES.cultureBonus * p.culture;
    const trade = 1 + RULES.portBonus * p.ports;
    const bonus = (1 + p.effects.income) * mood;
    const gross = this.workers(p) * RULES.incomePerWorker * p.prosperity * (0.7 + 0.3 * avgFertility) * culture * trade * bonus;
    const upkeep = this.warriors(p) * RULES.upkeepPerWarrior;
    p.income = gross - upkeep;
    p.gross = gross;
    p.upkeep = upkeep;
    p.drachmae += gross * dt;
    // A client state sends part of its income and a stream of labourers to its overlord.
    const lord = p.client && p.overlord >= 0 ? this.poleis[p.overlord] : null;
    if (lord?.alive) {
      const gold = gross * RULES.tributeShare * dt;
      const workers = p.civilians * RULES.tributeWorkers * dt;
      p.drachmae -= gold;
      p.civilians -= workers;
      lord.drachmae += gold;
      lord.slaves += workers;
      lord.tributeGold += gold;
      lord.tributeWorkers += workers;
    }
    this.allocate(p, upkeep, dt);
  }

  /**
   * Splits every drachma that came in — taxes, trade, spoils, tribute — between the five funds,
   * pays the hoplites from the military chest, then lets each fund buy what it is saving for.
   */
  private allocate(p: PolisState, upkeep: number, dt: number) {
    const cash = Math.max(0, p.drachmae);
    p.drachmae = 0;
    // About a year of smoothing: spoils and trade arrive in lumps.
    if (dt > 0) p.inflow += (cash / dt - p.inflow) * Math.min(1, dt / RULES.secondsPerYear);
    for (const k of BUDGET_KEYS) p.funds[k] += (cash * p.budget[k]) / 100;
    p.funds.military -= upkeep * dt;
    this.demobilize(p, dt);
    p.unpaid = p.funds.military < 0;
    if (p.unpaid) {
      // Unpaid hoplites go home.
      p.funds.military = 0;
      p.garrison *= 1 - 0.03 * dt;
    }
    const next = Object.fromEntries(BUDGET_KEYS.map(k => [k, this.nextPurchase(p, k)])) as Record<BudgetKey, Purchase | null>;
    // A fund with nothing left to buy passes its savings on to the others, by their shares.
    const busy = BUDGET_KEYS.filter(k => next[k] || (k === 'colonization' && p.expedition));
    const busyShare = busy.reduce((sum, k) => sum + p.budget[k], 0);
    for (const k of BUDGET_KEYS) {
      if (busy.includes(k) || p.funds[k] <= 0 || busyShare <= 0) continue;
      for (const o of busy) p.funds[o] += (p.funds[k] * p.budget[o]) / busyShare;
      p.funds[k] = 0;
    }
    for (const k of BUDGET_KEYS) {
      const n = next[k];
      if (n && p.funds[k] >= n.cost && this.time >= p.retryAt[k]) this.buy(p, k, n);
    }
  }

  /** How far the army is below the size the military share calls for (0 = full, 1 = none). */
  private armyShortfall(p: PolisState): number {
    return Math.max(0, 1 - this.warriors(p) / Math.max(1, this.armyTarget(p)));
  }

  /** Hoplites the military share calls for: up to 40% of the workers at the most generous budget. */
  armyTarget(p: PolisState): number {
    const share = p.budget.military / 100;
    return this.workers(p) * Math.min(RULES.armyCap, RULES.armyPerShare * share);
  }

  /** After the military share is cut, surplus hoplites of the garrison return to the fields. */
  private demobilize(p: PolisState, dt: number) {
    const surplus = this.warriors(p) - this.armyTarget(p);
    const floor = p.wars.size ? RULES.garrisonFloor : 0;
    if (surplus <= 0 || p.garrison <= floor) return;
    const sent = Math.min(p.garrison - floor, surplus) * RULES.demobilizeRate * dt;
    p.garrison -= sent;
    p.civilians += sent;
  }

  /** Drachmae a building costs: dearer by tier, and for larger cities. */
  improvementPrice(p: PolisState, id: ImprovementId): number {
    const base = improvementCost(IMPROVEMENT_BY_ID.get(id)!.tier).drachmae;
    return Math.round(base * (1 + this.totalPopulation(p) / RULES.improvementPopScale));
  }

  /**
   * What a fund is saving for. Tree funds weigh their next building against their recurring project
   * (hoplites, farms, ports) and take the cheaper — every farm or port makes the next one dearer, so
   * the two alternate; an army below half its intended strength always comes first.
   */
  nextPurchase(p: PolisState, key: BudgetKey): Purchase | null {
    const recurring = this.recurringPurchase(p, key);
    const tree = (Object.keys(TREE_FUND) as ImprovementTree[]).find(t => TREE_FUND[t] === key);
    if (!tree) return recurring;
    const def = [...IMPROVEMENT_BY_ID.values()].find(d => d.tree === tree && this.improvementState(p, d.id) === 'available');
    if (!def || p.satisfaction < improvementCost(def.tier).satisfaction) return recurring;
    if (key === 'military' && recurring && this.armyShortfall(p) > 0.5) return recurring;
    const building: Purchase = { kind: 'improvement', id: def.id, cost: this.improvementPrice(p, def.id) };
    return recurring && recurring.cost < building.cost ? recurring : building;
  }

  private recurringPurchase(p: PolisState, key: BudgetKey): Purchase | null {
    const pop = this.totalPopulation(p);
    const works = (kind: 'farm' | 'port') => {
      const count = kind === 'farm' ? p.farms : p.ports;
      const pending = this.pendingDevelopments.filter(d => d.owner === p.idx && d.kind === kind).length;
      const base = kind === 'farm' ? RULES.farmBase : RULES.portBase;
      const discount = 1 - p.effects.develop;
      return Math.round((base + pop * RULES.worksPerCapita) * (1 + RULES.worksGrowth * (count + pending)) * discount);
    };
    switch (key) {
      case 'military':
        return this.canTrain(p) && this.levySize(p) >= 20 ? { kind: 'hoplites', cost: this.trainCost(p) } : null;
      case 'colonization':
        if (p.expedition) return null;
        // While wilderness remains, save for the next expedition (it leaves once the city fills up)…
        if (this.wildCells > 0) {
          return { kind: 'expedition', cost: Math.round(RULES.expeditionBase + this.settlers(p) * RULES.expeditionPerSettler) };
        }
        // …and once Hellas is settled, found colonies on historical sites.
        if (!this.vassalSite(p)) return null;
        return {
          kind: 'colony',
          cost: Math.round((RULES.colonyBase + pop * RULES.colonyPerCapita) * (1 + 0.5 * p.colonies) * (1 - p.effects.develop))
        };
      case 'agriculture':
        return { kind: 'farm', cost: works('farm') };
      case 'trade':
        return this.harbourOf(p) >= 0 ? { kind: 'port', cost: works('port') } : null;
      case 'culture':
        return {
          kind: 'festival',
          cost: Math.round((RULES.festivalBase + pop * RULES.festivalPerCapita) * (1 + RULES.festivalGrowth * p.festivals))
        };
    }
  }

  private buy(p: PolisState, key: BudgetKey, next: Purchase) {
    let done = true;
    switch (next.kind) {
      case 'improvement':
        this.improve(p.idx, next.id);
        return;
      case 'hoplites':
        this.train(p.idx);
        break;
      case 'expedition':
        done = this.canSettle(p);
        if (done) this.settle(p.idx);
        break;
      case 'colony':
        done = !!this.commission(p, 'vassal');
        if (done) p.colonies++;
        break;
      case 'farm':
      case 'port':
        done = !!this.commission(p, next.kind);
        break;
      case 'festival':
        p.festivals++;
        p.culture = Math.min(5, p.culture + RULES.festivalCulture);
        p.prestige += RULES.festivalPrestige;
        this.mood(p, RULES.festivalMood);
        this.emit('festival', p.idx);
        break;
    }
    if (done) p.funds[key] -= next.cost;
    // No site to be found: look again in a little while instead of every tick.
    else p.retryAt[key] = this.time + (next.kind === 'expedition' ? 1 : 5);
  }

  private expedition(p: PolisState, dt: number) {
    const e = p.expedition;
    if (!e) return;
    e.timer += dt;
    const w = this.world;
    const perCell = this.settlersPerCell(p);
    while (e.timer >= 1 / RULES.settleRate && e.settlers >= perCell && this.wildCells > 0) {
      e.timer -= 1 / RULES.settleRate;
      let cell = e.frontier.pop();
      while (cell >= 0 && this.owner[cell] !== WILD) cell = e.frontier.pop();
      if (cell < 0) {
        // The home coast is full: sail away and found a colony.
        cell = this.nearestWild(p);
        if (cell < 0) break;
        if (!e.colony) {
          e.colony = true;
          this.emit('colony', p.idx);
        }
      }
      this.setOwner(cell, p.idx, true);
      e.settlers -= perCell;
      p.prosperity = Math.min(RULES.maxProsperity, p.prosperity + RULES.prosperityPerCell);
      const x = cell % w.cols;
      for (const n of w.neighbours4(x, (cell - x) / w.cols)) {
        if (this.owner[n] !== WILD || e.queued.has(n)) continue;
        e.queued.add(n);
        e.frontier.push(n, this.settleCost(p, n));
      }
    }
    if (e.settlers < perCell || this.wildCells === 0) {
      // Whoever could not be given land returns home.
      p.civilians += Math.max(0, e.settlers);
      p.expedition = null;
    }
  }

  /** Settlers flow like water: low, fertile ground near home first, hills and mountains last. */
  private settleCost(p: PolisState, cell: number): number {
    const w = this.world;
    const x = cell % w.cols;
    const y = (cell - x) / w.cols;
    const d = Math.hypot(x + 0.5 - p.cx, y + 0.5 - p.cy);
    return w.elevation[cell] / 600 + d * 0.0035 - w.fertility[cell] * 0.4 + hash01(x, y, p.idx) * 0.25;
  }

  /** Closest wild cell to the capital, anywhere in Hellas. */
  private nearestWild(p: PolisState): number {
    const w = this.world;
    let best = -1;
    let bestD = Infinity;
    for (const c of w.greekCells) {
      if (this.owner[c] !== WILD) continue;
      const x = c % w.cols;
      const d = Math.hypot(x + 0.5 - p.cx, (c - x) / w.cols + 0.5 - p.cy) + this.rand() * 12;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  private think(p: PolisState) {
    if (p.captured) return;
    // The AI steers through its budget: arm in wartime, settle while land is free.
    p.budget = normalizeBudget({
      military: 15 + 6 * p.militarism + (p.wars.size ? 25 : 0),
      colonization: this.wildCells > 0 ? 25 : 8,
      agriculture: 20,
      trade: 15,
      culture: 6 + 4 * p.culture
    });
    // Vassals follow their overlord in war and peace.
    if (p.overlord >= 0 && this.poleis[p.overlord].alive) return;

    let worldWars = 0;
    for (const q of this.poleis) worldWars += q.wars.size;
    worldWars /= 2;

    const rival = this.coalitionTarget;
    const leagued = rival >= 0 && rival !== p.idx && this.inCoalition(p, rival);
    if (leagued) this.seekCoalitionAlly(p, rival);
    const warChance = leagued ? RULES.coalitionWarChance : 0.12;
    if (this.time > RULES.aiWarGrace && p.wars.size === 0 && worldWars < RULES.maxWorldWars && this.rand() < warChance) {
      // Ambitions grow as the wilderness runs out and the years pass.
      const crowded = this.wildCells < this.world.greekCells.length * 0.1;
      let target = -1;
      let bestRatio = crowded ? 1.05 : 1.4 - Math.min(0.3, this.time / 1200);
      const mine = this.warriors(p);
      const friends = this.bloc(p.idx);
      const island = (x: PolisState) => RULES.islandPoleis.includes(x.def.id);
      for (const q of this.poleis) {
        if (!q.alive || q.captured || friends.includes(q.idx) || p.wars.has(q.idx) || q.overlord >= 0 || p.allies.has(q.idx)) continue;
        if (q.idx === this.player && this.time < RULES.aiPlayerGrace) continue;
        if (Math.hypot(q.cx - p.cx, q.cy - p.cy) > RULES.aiWarRange) continue;
        // A fearsome reputation makes a city look stronger than it is.
        let ratio = mine / Math.max(1, this.warriors(q) * (1 + RULES.prestigeDeterrence * q.prestige));
        // Border quarrels make a neighbour a tempting target (islands keep to themselves)…
        if (this.bordering(p.idx, q.idx) && !island(p) && !island(q)) ratio *= RULES.neighbourAggression;
        // …and bad blood makes any rival look weaker than it is.
        ratio *= 1 - this.relation(p.idx, q.idx) / 200;
        // All Hellas eyes the overbearing Hegemon.
        if (leagued && q.idx === rival) ratio *= RULES.coalitionAggression;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          target = q.idx;
        }
      }
      if (target >= 0) this.declareWar(p.idx, target);
    }

    // Impressed by the player's renown, a city may send an embassy offering an alliance.
    const me = this.poleis[this.player];
    if (
      me?.alive &&
      me.prestige > 0 &&
      this.time >= this.nextEmbassy &&
      this.time >= p.embassyAt &&
      !p.allies.has(me.idx) &&
      !p.wars.has(me.idx) &&
      !this.bloc(me.idx).includes(p.idx) &&
      this.relation(p.idx, me.idx) > -20 &&
      this.rand() < RULES.allianceOfferChance * me.prestige * (1 + this.relation(p.idx, me.idx) / 50)
    ) {
      p.embassyAt = this.time + 120;
      this.nextEmbassy = this.time + RULES.embassyCooldown;
      const { reason, enemy } = this.embassyReason(p, me);
      this.emit('allianceOffer', p.idx, me.idx, enemy, reason);
    }

    const playerBloc = this.player >= 0 && !this.autoplay ? this.bloc(this.player) : [];
    for (const e of [...p.wars]) {
      if (playerBloc.includes(e) || !p.wars.has(e)) continue;
      if (this.time - (p.warStart.get(e) ?? this.time) > 40 && this.rand() < 0.08) this.makePeace(p.idx, e);
    }
  }

  // ─── Sea trade ────────────────────────────────────────────────────────────

  shipsOf(idx: number): number {
    let n = 0;
    for (const s of this.ships) if (s.owner === idx && !s.done) n++;
    return n;
  }

  /** Voyage income for a polis: the base fee raised by its culture. */
  tradeValue(p: PolisState): number {
    const hegemon = p.idx === this.hegemon ? 1 + RULES.hegemonTradeBonus : 1;
    return RULES.tradeIncome * (1 + RULES.cultureBonus * p.culture) * (1 + p.effects.trade) * hegemon;
  }

  /** Sea cell beside the polis's coast closest to its port (or capital); -1 when landlocked. */
  harbourOf(p: PolisState): number {
    if (this.time - p.harbourAt < 20 && (p.harbour < 0 || this.bordersOwner(p.harbour, p.idx))) return p.harbour;
    const w = this.world;
    const port = this.buildings.find(b => b.kind === 'port' && this.owner[b.cell] === p.idx);
    const ox = port ? (port.cell % w.cols) + 0.5 : p.cx;
    const oy = port ? Math.floor(port.cell / w.cols) + 0.5 : p.cy;
    let best = -1;
    let bestD = Infinity;
    for (const c of w.greekCells) {
      if (this.owner[c] !== p.idx) continue;
      const x = c % w.cols;
      const y = (c - x) / w.cols;
      const d = Math.hypot(x + 0.5 - ox, y + 0.5 - oy);
      if (d >= bestD) continue;
      const sea = w.neighbours4(x, y).find(n => w.terrain[n] === Terrain.Sea);
      if (sea === undefined) continue;
      bestD = d;
      best = sea;
    }
    p.harbour = best;
    p.harbourAt = this.time;
    return best;
  }

  private bordersOwner(seaCell: number, idx: number): boolean {
    const w = this.world;
    const x = seaCell % w.cols;
    return w.neighbours4(x, (seaCell - x) / w.cols).some(n => this.owner[n] === idx);
  }

  /** Sends a merchant to a random friendly coastal polis, nearer ones more often. */
  private launchShip(p: PolisState) {
    if (this.shipsOf(p.idx) >= Math.min(RULES.maxShips, 1 + p.ports) + p.effects.ships) return;
    const from = this.harbourOf(p);
    if (from < 0) return;
    const w = this.world;
    const options: { q: PolisState; harbour: number; weight: number }[] = [];
    for (const q of this.poleis) {
      if (!q.alive || q === p || p.wars.has(q.idx)) continue;
      const harbour = this.harbourOf(q);
      if (harbour < 0) continue;
      const d = Math.hypot((harbour % w.cols) - (from % w.cols), Math.floor(harbour / w.cols) - Math.floor(from / w.cols));
      const pull =
        (1 + RULES.prestigeTradePull * q.prestige) *
        (p.allies.has(q.idx) ? 2 : 1) *
        (1 + this.relation(p.idx, q.idx) / 200) *
        (q.idx === this.hegemon ? 1 + RULES.hegemonTradeBonus : 1);
      options.push({ q, harbour, weight: pull / (d + 60) });
    }
    if (!options.length) return;
    let pick = this.rand() * options.reduce((sum, o) => sum + o.weight, 0);
    const choice = options.find(o => (pick -= o.weight) <= 0) ?? options[options.length - 1];
    const path = this.seaRoute(from, choice.harbour);
    if (!path) return;
    this.ships.push({
      id: this.nextId++,
      owner: p.idx,
      dest: choice.q.idx,
      path,
      seg: 0,
      along: 0,
      x: path[0],
      y: path[1],
      angle: 0,
      done: false
    });
  }

  private sailShips(dt: number) {
    for (const s of this.ships) {
      const owner = this.poleis[s.owner];
      if (!owner.alive) {
        s.done = true;
        continue;
      }
      s.along += RULES.shipSpeed * dt;
      const pts = s.path;
      while (!s.done) {
        const i = s.seg * 2;
        if (i + 3 >= pts.length) {
          this.arrive(s);
          break;
        }
        const dx = pts[i + 2] - pts[i];
        const dy = pts[i + 3] - pts[i + 1];
        const len = Math.hypot(dx, dy);
        if (s.along < len) {
          s.x = pts[i] + (dx / len) * s.along;
          s.y = pts[i + 1] + (dy / len) * s.along;
          s.angle = Math.atan2(dy, dx);
          break;
        }
        s.along -= len;
        s.seg++;
      }
    }
    this.ships = this.ships.filter(s => !s.done);
  }

  /** A completed voyage pays its owner, unless the destination has turned hostile meanwhile. */
  private arrive(s: Ship) {
    s.done = true;
    const owner = this.poleis[s.owner];
    const dest = this.poleis[s.dest];
    if (!dest.alive || owner.wars.has(dest.idx)) return;
    const amount = this.tradeValue(owner);
    owner.voyages[dest.idx] = (owner.voyages[dest.idx] ?? 0) + 1;
    owner.drachmae += amount;
    owner.tradeEarned += amount;
    this.mood(owner, amount * RULES.satisfactionPerTrade);
    this.tradeFx.push({ x: s.x, y: s.y, t: this.time, amount, owner: owner.idx });
    // The receiving harbour profits too, though less than the shipowner.
    const share = amount * RULES.tradeReceiverShare;
    dest.drachmae += share;
    dest.tradeEarned += share;
    this.mood(dest, share * RULES.satisfactionPerTrade);
    this.tradeFx.push({ x: s.x, y: s.y - 1.5, t: this.time, amount: share, owner: dest.idx });
  }

  /** A* over the coarse sea grid, smoothed into a gentle polyline; cached per harbour pair. */
  private seaRoute(fromCell: number, toCell: number): number[] | null {
    const w = this.world;
    const k = RULES.routeCoarse;
    const coarse = (cell: number) => this.nearestNavigable(Math.floor((cell % w.cols) / k), Math.floor(Math.floor(cell / w.cols) / k));
    const a = coarse(fromCell);
    const b = coarse(toCell);
    if (a < 0 || b < 0) return null;
    const key = `${a}-${b}`;
    let nodes = this.routes.get(key);
    if (nodes === undefined) {
      nodes = this.planRoute(a, b);
      this.routes.set(key, nodes);
      this.routes.set(`${b}-${a}`, nodes ? [...nodes].reverse() : null);
    }
    if (!nodes) return null;

    // Coarse cell centres, every other one, then two rounds of Chaikin corner cutting.
    let pts: [number, number][] = [[(fromCell % w.cols) + 0.5, Math.floor(fromCell / w.cols) + 0.5]];
    nodes.forEach((n, i) => {
      if (i % 2 === 0 || i === nodes!.length - 1) pts.push([((n % this.seaCols) + 0.5) * k, (Math.floor(n / this.seaCols) + 0.5) * k]);
    });
    pts.push([(toCell % w.cols) + 0.5, Math.floor(toCell / w.cols) + 0.5]);
    for (let round = 0; round < 2; round++) {
      const next: [number, number][] = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[i + 1];
        next.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25], [x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
      }
      next.push(pts[pts.length - 1]);
      pts = next;
    }
    return pts.flat();
  }

  private nearestNavigable(cx: number, cy: number): number {
    for (let r = 0; r <= 4; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = cx + dx;
          const y = cy + dy;
          if (x < 0 || y < 0 || x >= this.seaCols || y >= this.seaRows) continue;
          if (this.seaGrid[y * this.seaCols + x]) return y * this.seaCols + x;
        }
      }
    }
    return -1;
  }

  private planRoute(a: number, b: number): number[] | null {
    const cols = this.seaCols;
    const bx = b % cols;
    const by = Math.floor(b / cols);
    const g = new Map<number, number>([[a, 0]]);
    const prev = new Map<number, number>();
    const heap = new MinHeap();
    heap.push(a, 0);
    while (heap.size) {
      const c = heap.pop();
      if (c === b) {
        const out = [b];
        let n = b;
        while (prev.has(n)) out.push((n = prev.get(n)!));
        return out.reverse();
      }
      const cx = c % cols;
      const cy = (c - cx) / cols;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const x = cx + dx;
          const y = cy + dy;
          if (x < 0 || y < 0 || x >= cols || y >= this.seaRows || !this.seaGrid[y * cols + x]) continue;
          const n = y * cols + x;
          const cost = g.get(c)! + Math.hypot(dx, dy);
          if (cost >= (g.get(n) ?? Infinity)) continue;
          g.set(n, cost);
          prev.set(n, c);
          heap.push(n, cost + Math.hypot(x - bx, y - by));
        }
      }
    }
    return null;
  }

  // ─── Armies & battles ─────────────────────────────────────────────────────

  private spawnArmy(p: PolisState) {
    let count = 0;
    let main = false;
    for (const a of this.armies) {
      if (a.owner !== p.idx || a.dead) continue;
      count++;
      if (a.role === 'main') main = true;
    }
    const cap = Math.min(RULES.armiesMax, RULES.armiesMin + Math.floor(this.warriors(p) / 1500) + p.effects.armies);
    const spare = p.garrison - RULES.garrisonFloor;
    if (count >= cap || spare < 50) return;
    // The first army out is the main host; later ones are raiding parties of varied size.
    const share = main
      ? RULES.raiderShareMin + this.rand() * (RULES.raiderShareMax - RULES.raiderShareMin)
      : RULES.mainShare;
    const strength = Math.round(Math.min(spare, Math.max(50, spare * share)));
    p.garrison -= strength;
    this.armies.push({
      id: this.nextId++,
      owner: p.idx,
      x: p.cx,
      y: p.cy,
      strength,
      target: -1,
      dwell: 0,
      battle: 0,
      dead: false,
      fleeing: false,
      split: false,
      fleeAngle: 0,
      siege: -1,
      siegeStart: 0,
      siegeEnd: 0,
      role: main ? 'raider' : 'main',
      stance: 'march',
      fortify: 1
    });
  }

  private isEnemyCell(army: Army, cell: number): boolean {
    const o = cell >= 0 ? this.owner[cell] : -1;
    return o >= 0 && this.poleis[army.owner].wars.has(o);
  }

  private moveArmies(dt: number) {
    const w = this.world;
    this.promoteMainArmies();
    for (const a of this.armies) {
      if (a.dead || a.battle) continue;
      const p = this.poleis[a.owner];
      if (a.strength < 3) {
        a.dead = true;
        continue;
      }
      if (a.role === 'main' && p.wars.size && this.holdGround(a, dt)) continue;
      const threat = p.wars.size && a.role === 'raider' ? this.threatTo(a) : null;
      if (threat) {
        this.flee(a, threat, dt);
        continue;
      }
      a.fleeing = false;
      if (a.siege >= 0 && this.besiege(a, dt)) continue;
      if (!p.wars.size) {
        // Peace: march home and rejoin the garrison.
        if (this.walk(a, p.cx, p.cy, dt)) {
          p.garrison += a.strength;
          a.dead = true;
        }
        continue;
      }
      // The main army lifts nearby sieges, then seeks out the enemy's armies; raiders keep to plunder.
      const quarry = a.role === 'main' ? (this.reliefTarget(a) ?? this.rivalMain(a) ?? this.preyFor(a)) : null;
      if (quarry) {
        a.dwell = 0;
        this.walk(a, quarry.x, quarry.y, dt);
        continue;
      }
      if (!this.isEnemyCell(a, a.target)) {
        a.target = this.pickArmyTarget(a);
        a.dwell = 0;
        if (a.target < 0) continue;
      }
      const tx = (a.target % w.cols) + 0.5;
      const ty = Math.floor(a.target / w.cols) + 0.5;
      if (!this.walk(a, tx, ty, dt)) continue;

      a.dwell += dt;
      if (a.dwell < RULES.captureDwell) continue;
      a.dwell = 0;
      const victim = this.poleis[this.owner[a.target]];
      if (a.target === victim.capital && victim.garrison >= 1 && (a.strength < RULES.siegeMinimum || a.role === 'raider')) {
        // Too few to invest a city: ravage the countryside instead.
        a.target = this.adjacentEnemyCell(a);
        if (a.target === victim.capital) a.target = -1;
        continue;
      }
      if (a.target === victim.capital && victim.garrison >= 1) {
        // Camp before the walls; the assault comes later.
        if (!this.armies.some(o => o.siege === victim.idx && o.owner === a.owner && !o.dead)) {
          this.emit('siege', a.owner, victim.idx);
        }
        a.siege = victim.idx;
        a.siegeStart = this.time;
        a.siegeEnd = this.time + RULES.siegeDuration;
        continue;
      }
      this.captureAround(a, tx, ty);
      a.strength *= 0.99;
      a.target = this.adjacentEnemyCell(a);
    }
  }

  /** A polis whose main army has fallen hands the command to its largest raiding party. */
  private promoteMainArmies() {
    const best = new Map<number, Army>();
    const led = new Set<number>();
    for (const a of this.armies) {
      if (a.dead) continue;
      if (a.role === 'main') led.add(a.owner);
      else if (!best.has(a.owner) || a.strength > best.get(a.owner)!.strength) best.set(a.owner, a);
    }
    for (const [owner, a] of best) if (!led.has(owner)) a.role = 'main';
  }

  /** The nearest main army of a polis this one is at war with. */
  private rivalMain(a: Army): Army | null {
    const p = this.poleis[a.owner];
    let best: Army | null = null;
    let bestD = Infinity;
    for (const o of this.armies) {
      if (o.dead || o.role !== 'main' || !p.wars.has(o.owner)) continue;
      const d = Math.hypot(o.x - a.x, o.y - a.y);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  /** Fighting power of an army before luck: men × militarism and buildings × entrenchment. */
  private armyPower(a: Army): number {
    return a.strength * this.battleMultiplier(a.owner) * a.fortify;
  }

  /**
   * A main army facing a stronger enemy main army halts and digs in: its power climbs towards
   * RULES.holdPowerMax and it falls on any enemy army that comes within RULES.holdRadius.
   * Returns true while the army is holding (it does nothing else this tick).
   */
  private holdGround(a: Army, dt: number): boolean {
    const rival = this.rivalMain(a);
    const outmatched = !!rival && a.strength * this.battleMultiplier(a.owner) < rival.strength * this.battleMultiplier(rival.owner);
    if (!outmatched) {
      if (a.stance === 'hold') {
        a.stance = 'march';
        a.fortify = 1;
      }
      return false;
    }
    if (a.stance !== 'hold') {
      a.stance = 'hold';
      a.siege = -1;
      a.target = -1;
      a.dwell = 0;
      a.fleeing = false;
    }
    a.fortify = Math.min(RULES.holdPowerMax, a.fortify + RULES.holdPowerRate * dt);
    const p = this.poleis[a.owner];
    let intruder: Army | null = null;
    let nearest: number = RULES.holdRadius;
    for (const o of this.armies) {
      if (o.dead || !p.wars.has(o.owner)) continue;
      const d = Math.hypot(o.x - a.x, o.y - a.y);
      if (d <= nearest) {
        nearest = d;
        intruder = o;
      }
    }
    if (intruder) this.walk(a, intruder.x, intruder.y, dt);
    return true;
  }

  /** The nearest army besieging a friendly capital close by (own city, bloc or ally), if any. */
  private reliefTarget(a: Army): Army | null {
    const p = this.poleis[a.owner];
    const friends = new Set([...this.bloc(a.owner), ...p.allies]);
    let best: Army | null = null;
    let bestD = Infinity;
    for (const o of this.armies) {
      if (o.dead || o.siege < 0 || !friends.has(o.siege) || !p.wars.has(o.owner)) continue;
      const town = this.poleis[o.siege];
      if (Math.hypot(town.cx - a.x, town.cy - a.y) > RULES.reliefRadius) continue;
      const d = Math.hypot(o.x - a.x, o.y - a.y);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  /** A nearby enemy army this one outmatches by half again in fighting power or in men. */
  private preyFor(a: Army): Army | null {
    const p = this.poleis[a.owner];
    const power = this.armyPower(a);
    let best: Army | null = null;
    let bestD = Infinity;
    for (const o of this.armies) {
      if (o.dead || o.battle || !p.wars.has(o.owner)) continue;
      const d = Math.hypot(o.x - a.x, o.y - a.y);
      if (d > RULES.chaseRadius || d >= bestD) continue;
      const stronger = power >= RULES.chaseRatio * this.armyPower(o) || a.strength >= RULES.chaseRatio * o.strength;
      if (!stronger) continue;
      bestD = d;
      best = o;
    }
    return best;
  }

  /** A hostile army within reach that a raiding party should not face (anything near its size), if any. */
  private threatTo(a: Army): Army | null {
    const p = this.poleis[a.owner];
    let worst: Army | null = null;
    for (const o of this.armies) {
      if (o.dead || !p.wars.has(o.owner) || o.strength < a.strength * RULES.raiderFearRatio) continue;
      if (Math.hypot(o.x - a.x, o.y - a.y) > RULES.retreatRadius) continue;
      if (!worst || o.strength > worst.strength) worst = o;
    }
    return worst;
  }

  /** Falls back from a far stronger enemy, bleeding stragglers; a large army may scatter in two. */
  private flee(a: Army, threat: Army, dt: number) {
    if (!a.fleeing) {
      a.fleeing = true;
      a.siege = -1;
      a.target = -1;
      a.dwell = 0;
      const field = this.armies.filter(x => !x.dead && x.owner === a.owner).length;
      if (!a.split && a.strength > 120 && field < RULES.armiesMax && this.rand() < RULES.splitChance) {
        a.strength /= 2;
        a.fleeAngle = -0.7;
        a.split = true;
        this.armies.push({ ...a, id: this.nextId++, fleeAngle: 0.7, x: a.x + 0.4, y: a.y + 0.4 });
      }
    }
    const away = Math.atan2(a.y - threat.y, a.x - threat.x) + a.fleeAngle;
    this.walk(a, a.x + Math.cos(away) * 4, a.y + Math.sin(away) * 4, dt);
    a.strength *= 1 - RULES.retreatAttrition * dt;
  }

  /**
   * One tick of a siege. The army wastes away before the walls until the assault; returns false
   * once the siege is over (lifted or stormed) so the army moves on.
   */
  private besiege(a: Army, dt: number): boolean {
    const q = this.poleis[a.siege];
    if (!q.alive || !this.poleis[a.owner].wars.has(q.idx)) {
      a.siege = -1;
      return false;
    }
    a.strength *= 1 - RULES.siegeAttrition * dt;
    if (this.time < a.siegeEnd) return true;
    a.siege = -1;
    if (q.garrison >= 1) this.startBattle(a, null, q.idx);
    else this.conquer(q.idx, a.owner);
    return true;
  }

  /** Seizes every enemy cell within the capture radius, sparing defended capitals. */
  private captureAround(a: Army, tx: number, ty: number) {
    const w = this.world;
    const r = RULES.captureRadius;
    for (let y = Math.floor(ty - r); y <= Math.floor(ty + r); y++) {
      for (let x = Math.floor(tx - r); x <= Math.floor(tx + r); x++) {
        if (!w.inBounds(x, y) || Math.hypot(x + 0.5 - tx, y + 0.5 - ty) > r) continue;
        const c = w.index(x, y);
        if (!this.isEnemyCell(a, c)) continue;
        const victim = this.poleis[this.owner[c]];
        if (c === victim.capital && victim.garrison >= 1) continue;
        this.capture(c, a.owner, victim.idx);
      }
    }
  }

  /** Moves the army toward (tx, ty); returns true on arrival. Ships and mountain paths are slow. */
  private walk(a: Army, tx: number, ty: number, dt: number): boolean {
    const dx = tx - a.x;
    const dy = ty - a.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.35) return true;
    const cell = this.world.cellAt(a.x, a.y);
    const atSea = cell < 0 || this.world.terrain[cell] === Terrain.Sea;
    const speed = atSea
      ? RULES.armySpeedSea
      : RULES.armySpeedLand *
        (1 + this.poleis[a.owner].effects.armySpeed) *
        (1 - Math.min(0.6, (this.world.elevation[cell] / 1000) * RULES.mountainSlowdown));
    const step = Math.min(d, speed * dt);
    a.x += (dx / d) * step;
    a.y += (dy / d) * step;
    return false;
  }

  private pickArmyTarget(a: Army): number {
    const w = this.world;
    const p = this.poleis[a.owner];
    if (a.role === 'main' && a.strength >= RULES.siegeMinimum && this.rand() < 0.12) {
      let best = -1;
      let bestD = Infinity;
      for (const e of p.wars) {
        const q = this.poleis[e];
        const d = Math.hypot(q.cx - a.x, q.cy - a.y);
        if (d < bestD) {
          bestD = d;
          best = q.capital;
        }
      }
      if (best >= 0) return best;
    }
    let best = -1;
    let bestD = Infinity;
    for (const c of w.greekCells) {
      const o = this.owner[c];
      if (o < 0 || !p.wars.has(o)) continue;
      const x = c % w.cols;
      const y = (c - x) / w.cols;
      const d = Math.hypot(x + 0.5 - a.x, y + 0.5 - a.y) + this.rand() * 18;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  /** Keeps a victorious army rolling over the neighbouring enemy fields. */
  private adjacentEnemyCell(a: Army): number {
    const w = this.world;
    const x0 = a.target % w.cols;
    const y0 = Math.floor(a.target / w.cols);
    const options: number[] = [];
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        if (!w.inBounds(x0 + dx, y0 + dy)) continue;
        const c = w.index(x0 + dx, y0 + dy);
        if (this.isEnemyCell(a, c)) options.push(c);
      }
    }
    return options.length ? options[Math.floor(this.rand() * options.length)] : -1;
  }

  private detectBattles() {
    const list = this.armies;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.dead || a.battle) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (b.dead || b.battle || !this.poleis[a.owner].wars.has(b.owner)) continue;
        if (Math.hypot(a.x - b.x, a.y - b.y) < RULES.battleRange) {
          this.startBattle(a, b, b.owner);
          break;
        }
      }
    }
    // Armies marching past a brawl pile in on the side of their friends.
    for (const a of list) {
      if (a.dead || a.battle || a.fleeing || a.role === 'raider') continue;
      const p = this.poleis[a.owner];
      for (const b of this.battles) {
        if (Math.hypot(a.x - b.x, a.y - b.y) > RULES.joinRange) continue;
        const sideA = [b.sideA, ...b.attackers.map(x => x.owner)];
        const sideB = [b.sideB, ...b.defenders.map(x => x.owner)];
        const hatesA = sideA.some(o => p.wars.has(o));
        const hatesB = sideB.some(o => p.wars.has(o));
        const side = hatesB && !hatesA ? b.attackers : hatesA && !hatesB ? b.defenders : null;
        if (!side || side.length >= RULES.maxArmiesPerSide) continue;
        side.push(a);
        a.battle = b.id;
        a.siege = -1;
        // Newcomers prolong the fight a little, never indefinitely.
        b.end = Math.min(b.start + RULES.battleDuration * 2, Math.max(b.end, this.time + 0.8));
        break;
      }
    }
  }

  private startBattle(attacker: Army, defender: Army | null, defenderIdx: number) {
    const id = this.nextId++;
    const q = this.poleis[defenderIdx];
    const dx = defender ? defender.x : q.cx;
    const dy = defender ? defender.y : q.cy;
    attacker.battle = id;
    if (defender) defender.battle = id;
    this.battles.push({
      id,
      x: (attacker.x + dx) / 2,
      y: (attacker.y + dy) / 2,
      attackers: [attacker],
      defenders: defender ? [defender] : [],
      garrison: defender ? -1 : defenderIdx,
      sideA: attacker.owner,
      sideB: defenderIdx,
      start: this.time,
      end: this.time + RULES.battleDuration * (0.8 + this.rand() * 0.4)
    });
  }

  /**
   * Settles a battle between two sides of any number of armies (plus a garrison behind its walls).
   * The losing side is destroyed; the winners lose men in proportion and share the spoils.
   */
  private resolveBattles() {
    const pending: Battle[] = [];
    for (const b of this.battles) {
      if (this.time < b.end) {
        pending.push(b);
        continue;
      }
      for (const army of [...b.attackers, ...b.defenders]) army.battle = 0;
      const atts = b.attackers.filter(x => !x.dead);
      const defs = b.defenders.filter(x => !x.dead);
      const q = b.garrison >= 0 ? this.poleis[b.garrison] : null;
      const walls = q?.alive && q.garrison >= 1 ? q : null;
      if (!atts.length) continue;
      if (!defs.length && !walls) {
        if (q?.alive) this.conquer(q.idx, atts[0].owner);
        continue;
      }

      // Militarism tips the scales slightly; walls favour a defending garrison.
      const power = (list: Army[]) => list.reduce((sum, x) => sum + this.armyPower(x), 0);
      const garrisonPower = walls
        ? walls.garrison * this.battleMultiplier(walls.idx) * RULES.wallsBonus * (1 + walls.effects.walls)
        : 0;
      const sa = power(atts);
      const sd = power(defs) + garrisonPower;
      const pa = Math.pow(sa, 1.2) / (Math.pow(sa, 1.2) + Math.pow(sd, 1.2));
      const attackersWin = this.rand() < pa;
      const [win, lose] = attackersWin ? [sa, sd] : [sd, sa];
      const keep = Math.max(0.05, (win - lose * (0.35 + this.rand() * 0.3)) / win);

      // Men on each side by polis, before the blows.
      const tally = (list: Army[], garrison: PolisState | null) => {
        const men = new Map<number, number>();
        for (const x of list) men.set(x.owner, (men.get(x.owner) ?? 0) + x.strength);
        if (garrison) men.set(garrison.idx, (men.get(garrison.idx) ?? 0) + garrison.garrison);
        return men;
      };
      const winners = attackersWin ? tally(atts, null) : tally(defs, walls);
      const losers = attackersWin ? tally(defs, walls) : tally(atts, null);
      const winMen = [...winners.values()].reduce((s2, v) => s2 + v, 0);
      const loseMen = [...losers.values()].reduce((s2, v) => s2 + v, 0);
      const lead = (men: Map<number, number>) => [...men.entries()].sort((x, y) => y[1] - x[1])[0][0];
      const mainWinner = lead(winners);
      const mainLoser = lead(losers);

      for (const x of attackersWin ? atts : defs) {
        x.strength = Math.max(2, x.strength * keep);
        x.fortify = 1;
      }
      for (const x of attackersWin ? defs : atts) x.dead = true;
      if (walls) walls.garrison = attackersWin ? 0 : walls.garrison * keep;

      for (const [owner, men] of winners) {
        const share = men / Math.max(1, winMen);
        this.spoils(owner, mainLoser, loseMen * share, men * (1 - keep), b);
      }
      for (const [owner, men] of losers) this.defeat(owner, mainWinner, men, (winMen * (1 - keep) * men) / Math.max(1, loseMen));

      if (attackersWin && q?.alive) this.conquer(q.idx, mainWinner);
    }
    this.battles = pending;
  }

  /** The losing side's grief and, for the player, the war tally. */
  private defeat(loser: number, winner: number, ownLosses: number, enemyLosses: number) {
    this.poleis[loser].battlesLost++;
    this.mood(this.poleis[loser], RULES.satisfactionBattleLost);
    if (loser !== this.player) return;
    const war = this.playerWars.get(winner);
    if (!war) return;
    war.battlesLost++;
    war.ownLosses += ownLosses;
    war.enemyLosses += Math.max(0, enemyLosses);
  }

  /** Gold, captives and renown for the victor; the player's victories are reported to the UI. */
  private spoils(winner: number, loser: number, enemyLosses: number, ownLosses: number, b: Battle) {
    const w = this.poleis[winner];
    const gold = Math.round(RULES.lootBase + enemyLosses * RULES.lootPerEnemy);
    const slaves = Math.round(enemyLosses * RULES.captiveShare);
    w.drachmae += gold;
    w.slaves += slaves;
    w.prestige += RULES.prestigePerVictory;
    w.battlesWon++;
    w.lastVictoryAt = this.time;
    this.mood(w, RULES.satisfactionBattleWon);
    if (winner !== this.player) return;
    const war = this.playerWars.get(loser);
    if (war) {
      war.battlesWon++;
      war.enemyLosses += enemyLosses;
      war.ownLosses += Math.max(0, ownLosses);
      war.gold += gold;
      war.captives += slaves;
    }
    let near = loser;
    let bestD = Infinity;
    for (const q of this.poleis) {
      if (!q.alive) continue;
      const d = Math.hypot(q.cx - b.x, q.cy - b.y);
      if (d < bestD) {
        bestD = d;
        near = q.idx;
      }
    }
    this.reports.push({
      enemy: loser,
      near,
      gold,
      slaves,
      prestige: RULES.prestigePerVictory,
      enemyLosses: Math.round(enemyLosses),
      ownLosses: Math.max(0, Math.round(ownLosses))
    });
  }

  takeReports(): BattleReport[] {
    const out = this.reports;
    this.reports = [];
    return out;
  }

  // ─── Territory ────────────────────────────────────────────────────────────

  private setOwner(cell: number, idx: number, flash: boolean) {
    const prev = this.owner[cell];
    if (prev === idx) return;
    this.strayAt[cell] = 0;
    const f = this.world.fertility[cell];
    if (prev >= 0) {
      this.poleis[prev].cells--;
      this.poleis[prev].fertility -= f;
      this.poleis[prev].version++;
    } else if (prev === WILD) {
      this.wildCells--;
    }
    this.owner[cell] = idx;
    this.poleis[idx].cells++;
    this.poleis[idx].fertility += f;
    this.poleis[idx].version++;
    if (flash) this.claims.push({ cell, t: this.time });
    this.dirty.push(cell);
    this.version++;
  }

  /**
   * Smooths wartime border gore: a small pocket of land cut off by an enemy (a stray pixel or a few)
   * passes to whichever of the warring sides has its capital nearer. Capitals never change hands here.
   */
  private tidyBorders() {
    const w = this.world;
    const own = this.owner;
    const seen = new Uint8Array(w.size);
    const stack: number[] = [];
    for (const start of w.greekCells) {
      const o = own[start];
      if (o < 0 || seen[start]) continue;
      // Flood the whole pocket so every cell is visited once.
      const pocket: number[] = [];
      const rivals = new Set<number>();
      let wildNext = false;
      seen[start] = 1;
      stack.push(start);
      while (stack.length) {
        const c = stack.pop()!;
        pocket.push(c);
        const x = c % w.cols;
        for (const n of w.neighbours4(x, (c - x) / w.cols)) {
          const q = own[n];
          if (q === o) {
            if (!seen[n]) {
              seen[n] = 1;
              stack.push(n);
            }
          } else if (q >= 0) {
            rivals.add(q);
          } else if (q === WILD) {
            wildNext = true;
          }
        }
      }
      const p = this.poleis[o];
      // A seed in open wilderness (a fresh colony) may still grow; anything else this small is stranded.
      if (this.strayPocket(pocket, p, rivals.size > 0 || !wildNext)) continue;
      if (pocket.length > RULES.enclaveSize || !p.wars.size || pocket.includes(p.capital)) continue;
      const enemies = [...rivals].filter(q => p.wars.has(q));
      if (!enemies.length) continue;
      let cx = 0;
      let cy = 0;
      for (const c of pocket) {
        cx += (c % w.cols) + 0.5;
        cy += Math.floor(c / w.cols) + 0.5;
      }
      cx /= pocket.length;
      cy /= pocket.length;
      const dist = (q: number) => Math.hypot(this.poleis[q].cx - cx, this.poleis[q].cy - cy);
      const heir = enemies.reduce((best, q) => (dist(q) < dist(best) ? q : best), o);
      if (heir === o) continue;
      for (const c of pocket) {
        if (o === this.player) {
          const war = this.playerWars.get(heir);
          if (war) war.cellsLost++;
        } else if (heir === this.player) {
          const war = this.playerWars.get(o);
          if (war) war.cellsGained++;
        }
        this.setOwner(c, heir, true);
      }
      if (p.cells === 0) this.conquer(o, heir);
    }
  }

  /**
   * Ages a tiny pocket cut off from its capital; once it has been stranded for RULES.strayDecay
   * it reverts to the wild. Returns true if released.
   */
  private strayPocket(pocket: number[], p: PolisState, stranded: boolean): boolean {
    const stray = stranded && pocket.length <= RULES.strayPocket && !pocket.includes(p.capital);
    if (!stray) {
      for (const c of pocket) this.strayAt[c] = 0;
      return false;
    }
    let since = this.time;
    for (const c of pocket) {
      if (!this.strayAt[c]) this.strayAt[c] = this.time;
      since = Math.min(since, this.strayAt[c]);
    }
    if (this.time - since < RULES.strayDecay) return false;
    for (const c of pocket) {
      this.strayAt[c] = 0;
      this.release(c);
    }
    return true;
  }

  /** Returns a cell to the wilderness. */
  private release(cell: number) {
    const prev = this.owner[cell];
    if (prev < 0) return;
    const p = this.poleis[prev];
    p.cells--;
    p.fertility -= this.world.fertility[cell];
    p.version++;
    this.owner[cell] = WILD;
    this.wildCells++;
    this.claims.push({ cell, t: this.time });
    this.dirty.push(cell);
    this.version++;
  }

  /** Cells that changed owner since the last call (for incremental repaints). */
  takeDirty(): number[] {
    const out = this.dirty;
    this.dirty = [];
    return out;
  }

  private capture(cell: number, winner: number, loser: number) {
    const w = this.poleis[winner];
    const l = this.poleis[loser];
    if (w.warGains.has(loser)) w.warGains.set(loser, w.warGains.get(loser)! + 1);
    const share = l.civilians / Math.max(1, l.cells);
    l.civilians -= share * 0.6;
    this.mood(l, RULES.satisfactionPerCellLost);
    if (loser === this.player) {
      const war = this.playerWars.get(winner);
      if (war) war.cellsLost++;
    }
    // Far from home, scorched fields are often simply abandoned to the wild.
    const far = Math.min(1, this.distanceFrom(w, cell) / RULES.wildernessRange);
    const wild = RULES.wildernessNear + (RULES.wildernessFar - RULES.wildernessNear) * far;
    if (this.rand() < wild) {
      this.release(cell);
    } else {
      w.civilians += share * 0.3;
      if (winner === this.player) {
        const war = this.playerWars.get(loser);
        if (war) war.cellsGained++;
      }
      this.setOwner(cell, winner, true);
    }
    if (l.cells === 0) this.conquer(loser, winner);
  }

  /** What becomes of a fallen polis: founding cities endure, young colonies are easily razed. */
  private fallOutcome(l: PolisState): FallOutcome {
    let razed: number = RULES.fallRazed;
    if (l.def.kind === 'major') {
      razed *= RULES.foundingResilience;
    } else {
      const youth = 1 - Math.min(1, (this.time - l.founded) / RULES.youthSpan);
      razed += 40 * youth;
    }
    let roll = this.rand() * (RULES.fallCity + RULES.fallClient + razed);
    if ((roll -= RULES.fallCity) < 0) return 'city';
    if ((roll -= RULES.fallClient) < 0) return 'client';
    return 'razed';
  }

  private conquer(loser: number, winner: number) {
    const l = this.poleis[loser];
    const w = this.poleis[winner];
    if (!l.alive || l.captured) return;
    // Taking a capital is the greatest feat of arms, and it ends that war in victory.
    w.capitalsTaken++;
    if (w.wars.has(loser)) w.warsWon++;
    l.warGains.delete(winner);
    w.warGains.delete(loser);
    if (winner === this.player && loser !== this.player) {
      // The player decides the fate of the city; until then it is held, disarmed and at peace.
      this.disarm(l);
      l.captured = true;
      l.garrison = 0;
      this.conquests.push(loser);
      this.emit('captured', loser, winner);
      return;
    }
    // The player's own fall always ends the game.
    const fate = loser === this.player ? 'city' : this.fallOutcome(l);
    const cellsBefore = l.cells;
    const atWarWithPlayer = l.wars.has(this.player);
    this.disarm(l);

    if (this.rand() < RULES.secessionChance) this.secede(l);

    if (fate === 'client') {
      this.makeClient(l, winner);
    } else {
      this.raze(l, winner, fate === 'city' ? 'city' : null);
    }

    const war = winner === this.player ? this.playerWars.get(loser) : undefined;
    if (war) war.cellsGained += cellsBefore - l.cells;
    // A war of the player's ends with the fall of the enemy, whoever dealt the last blow.
    if (atWarWithPlayer) this.endPlayerWar(loser, 'conquest', fate);
  }

  /** Disbands a fallen city's armies and expedition and dissolves its wars, treaties and vassalage. */
  private disarm(l: PolisState) {
    const loser = l.idx;
    for (const a of this.armies) if (a.owner === loser) a.dead = true;
    l.expedition = null;
    for (const e of l.wars) {
      this.poleis[e].wars.delete(loser);
      this.poleis[e].warStart.delete(loser);
    }
    l.wars.clear();
    for (const v of this.poleis) {
      // Vassals and client states of the fallen city regain their freedom.
      if (v.overlord === loser) {
        v.overlord = -1;
        v.client = false;
      }
      v.allies.delete(loser);
    }
    l.allies.clear();
  }

  /** The city is gone: its land passes to the victor, and at most a town remains. */
  private raze(l: PolisState, winner: number, remnant: 'city' | null) {
    const w = this.poleis[winner];
    const loser = l.idx;
    for (const c of this.world.greekCells) {
      if (this.owner[c] === loser) this.setOwner(c, winner, true);
    }
    w.civilians += l.civilians * 0.5;
    w.slaves += l.slaves * 0.5;
    l.civilians = 0;
    l.slaves = 0;
    l.garrison = 0;
    l.alive = false;
    l.conqueror = winner;
    l.remnant = remnant;
    this.emit(remnant === 'city' ? 'annexed' : 'fall', loser, winner);
  }

  /** The city keeps its heartland but serves the victor and pays tribute. */
  private makeClient(l: PolisState, winner: number) {
    const w = this.poleis[winner];
    const loser = l.idx;
    // Keep the heartland around the capital; the rest goes to the victor.
    const keep = new Set<number>();
    const heap = new MinHeap();
    const cost = new Map<number, number>([[l.capital, 0]]);
    heap.push(l.capital, 0);
    const ww = this.world;
    while (heap.size) {
      const k = heap.peekKey();
      const c = heap.pop();
      if (keep.has(c) || k > (cost.get(c) ?? Infinity)) continue;
      keep.add(c);
      const x = c % ww.cols;
      for (const n of ww.neighbours4(x, (c - x) / ww.cols)) {
        const next = k + 1;
        if (this.owner[n] !== loser || next > RULES.clientReach || next >= (cost.get(n) ?? Infinity)) continue;
        cost.set(n, next);
        heap.push(n, next);
      }
    }
    const share = keep.size / Math.max(1, l.cells);
    for (const c of this.world.greekCells) {
      if (this.owner[c] === loser && !keep.has(c)) this.setOwner(c, winner, true);
    }
    w.civilians += l.civilians * (1 - share) * 0.5;
    l.civilians *= share;
    l.slaves = 0;
    l.garrison = l.civilians * RULES.startGarrison;
    l.overlord = winner;
    l.client = true;
    l.satisfaction = Math.min(l.satisfaction, 40);
    this.emit('client', loser, winner);
  }

  takeConquests(): number[] {
    const out = this.conquests;
    this.conquests = [];
    return out;
  }

  /**
   * Carries out the player's decision for a stormed city; every choice ends the war.
   * Razing usually yields gold and slaves but may provoke a revolt; subjugation usually makes a
   * client state, otherwise a ransom; a forced alliance always holds, with a little gold.
   */
  resolveConquest(idx: number, choice: ConquestChoice) {
    const l = this.poleis[idx];
    if (!l?.captured) return;
    l.captured = false;
    const me = this.poleis[this.player];
    const war = this.playerWars.get(idx);
    const cellsBefore = l.cells;
    const pop = l.civilians + l.slaves;
    let fate: FallOutcome;
    let gold = 0;
    let slaves = 0;

    if (choice === 'raze') {
      if (this.rand() < RULES.razeSuccess) {
        gold = Math.round(this.plunder(l, 0.5) + pop * 0.05);
        slaves = Math.round(pop * 0.2);
        l.civilians = Math.max(0, l.civilians - slaves);
        this.raze(l, this.player, null);
        fate = 'razed';
      } else {
        // The citizens rise and drive the occupiers out.
        l.garrison = Math.round(l.civilians * 0.05);
        l.satisfaction = 85;
        this.shiftRelation(idx, this.player, -40);
        this.mood(me, -4);
        this.emit('revolt', idx, this.player);
        fate = 'revolt';
      }
    } else if (choice === 'subjugate') {
      if (this.rand() < RULES.subjugateSuccess) {
        this.makeClient(l, this.player);
        fate = 'client';
      } else {
        gold = Math.round(this.plunder(l, 0.6) + pop * 0.12);
        l.garrison = Math.round(l.civilians * 0.02);
        this.emit('ransom', idx, this.player);
        fate = 'ransom';
      }
    } else {
      gold = Math.round(40 + pop * 0.01);
      l.garrison = Math.round(l.civilians * 0.02);
      this.ally(this.player, idx);
      fate = 'alliance';
    }

    me.drachmae += gold;
    me.slaves += slaves;
    if (war) {
      war.gold += gold;
      war.captives += slaves;
      war.cellsGained += cellsBefore - (l.alive ? l.cells : 0);
    }
    this.endPlayerWar(idx, 'conquest', fate);
  }

  /** In the chaos of a fall, an outlying town declares itself an independent polis. */
  private secede(l: PolisState) {
    if (l.cells < 60) return;
    const capitals = new Set(this.poleis.map(q => q.capital));
    const site = this.siteCells.find(
      s => !this.usedSites.has(s.id) && !capitals.has(s.cell) && this.owner[s.cell] === l.idx
    );
    if (!site) return;
    this.usedSites.add(site.id);
    const idx = this.poleis.length;
    const color = SECESSION_COLORS[this.secessions++ % SECESSION_COLORS.length];
    const nova = this.createPolis(
      {
        kind: 'site',
        id: site.id,
        lon: site.lon,
        lat: site.lat,
        color,
        militarism: Math.min(5, l.militarism + 1),
        culture: l.culture
      },
      idx,
      site.cell,
      -1
    );
    this.poleis.push(nova);
    const before = l.cells;
    this.floodClaim([{ cell: site.cell, idx }], RULES.vassalReach + 2, c => this.owner[c] === l.idx && c !== l.capital);
    const share = (before - l.cells) / Math.max(1, before);
    nova.civilians = l.civilians * share;
    l.civilians -= nova.civilians;
    nova.garrison = Math.round(nova.civilians * RULES.startGarrison * 2);
    this.emit('secession', l.idx, idx);
  }

  private checkEnd() {
    if (this.status !== 'playing') return;
    const me = this.poleis[this.player];
    if (!me.alive) {
      this.status = 'lost';
      return;
    }
    const mine = this.bloc(this.player);
    const cells = mine.reduce((sum, i) => sum + this.poleis[i].cells, 0);
    const rivals = this.poleis.some(p => p.alive && !mine.includes(p.idx));
    if (!rivals || cells >= this.world.greekCells.length * RULES.victoryShare) this.status = 'won';
  }

  /** Adds an entry to the chronicle from outside the simulation (e.g. hegemony changes). */
  note(kind: GameEventKind, a: number, b = -1, tag?: string) {
    this.emit(kind, a, b, undefined, tag);
  }

  private emit(kind: GameEventKind, a: number, b = -1, n?: number, tag?: string) {
    this.events.push({ id: this.nextId++, kind, a, b, year: this.year, n, tag });
    if (this.events.length > 40) this.events.shift();
  }
}
