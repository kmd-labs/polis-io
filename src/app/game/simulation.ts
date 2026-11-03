import { POLEIS, PolisDef, SITES, SiteId } from './data/poleis';
import { MinHeap } from './heap';
import { hash01 } from './rng';
import { Terrain, World } from './world';

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
  /** "Settle the wilderness" sends this share of workers away for good. */
  settleShare: 0.1,
  settlersPerCell: 12,
  /** Cells claimed per second by an expedition. */
  settleRate: 11,
  prosperityPerCell: 0.00055,
  maxProsperity: 2,
  trainShare: 0.06,
  trainCostPerHoplite: 1.2,
  /** Battle strength bonus per point of militarism. */
  militarismBonus: 0.04,
  /** Income bonus per point of culture. */
  cultureBonus: 0.08,
  /** Development: base cost + share of population, rising with every project. */
  developBase: 250,
  developPerCapita: 0.02,
  developGrowth: 0.5,
  /** Development outcomes: vassal below the first threshold, farm below the second, port above. */
  vassalChance: 0.1,
  farmChance: 0.55,
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
}

export interface Battle {
  id: number;
  x: number;
  y: number;
  attacker: Army;
  /** null when the attacker storms a capital defended by its garrison. */
  defender: Army | null;
  defenderIdx: number;
  start: number;
  end: number;
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
  | 'allianceOffer';

export interface GameEvent {
  id: number;
  kind: GameEventKind;
  a: number;
  b: number;
  year: number;
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
  ships: Ship[] = [];
  tradeFx: TradeFx[] = [];
  /** Battles the player has won since the UI last took them. */
  reports: BattleReport[] = [];
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
  private readonly rand = Math.random;
  /** Greek land cell of every vassal site, resolved once. */
  private readonly siteCells: { id: SiteId; lon: number; lat: number; cell: number }[];
  private usedSites = new Set<SiteId>();
  /** Coarse sea grid for route planning, and routes already found between coarse harbour cells. */
  private readonly seaGrid: Uint8Array;
  private readonly seaCols: number;
  private readonly seaRows: number;
  private readonly routes = new Map<string, number[] | null>();

  constructor(readonly world: World) {
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
      embassyAt: this.time + 60
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
    this.ships = [];
    this.tradeFx = [];
    this.reports = [];
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
    return Math.max(1, p.fertility * RULES.peoplePerFertility + RULES.farmCapacity * p.farms);
  }

  /** Multiplier applied to an army's (or garrison's) strength in battle. */
  battleMultiplier(idx: number): number {
    return 1 + RULES.militarismBonus * this.poleis[idx].militarism;
  }

  developCost(p: PolisState): number {
    const base = RULES.developBase + this.totalPopulation(p) * RULES.developPerCapita;
    return Math.round(base * (1 + RULES.developGrowth * p.developments));
  }

  canDevelop(p: PolisState): boolean {
    return p.alive && p.drachmae >= this.developCost(p);
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

  canSettle(p: PolisState): boolean {
    return p.alive && !p.expedition && this.wildCells > 0 && this.settlers(p) >= RULES.settlersPerCell;
  }

  trainBatch(p: PolisState): number {
    return Math.max(50, Math.round(this.workers(p) * RULES.trainShare));
  }

  trainCost(p: PolisState): number {
    return Math.ceil(this.trainBatch(p) * RULES.trainCostPerHoplite);
  }

  canTrain(p: PolisState): boolean {
    return p.alive && p.drachmae >= this.trainCost(p) && this.workers(p) > this.trainBatch(p) * 3;
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
    this.emit('settle', idx);
  }

  train(idx: number) {
    const p = this.poleis[idx];
    if (!this.canTrain(p)) return;
    const batch = this.trainBatch(p);
    p.drachmae -= this.trainCost(p);
    p.civilians -= batch;
    p.garrison += batch;
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
    this.emit('alliance', a, b);
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
    px.nextSpawn = Math.min(px.nextSpawn, this.time);
    py.nextSpawn = Math.min(py.nextSpawn, this.time + 1);
  }

  /** The player proposes peace; the enemy weighs the balance of power. Returns whether it was accepted. */
  offerPeace(a: number, b: number): boolean {
    const pa = this.poleis[a];
    const pb = this.poleis[b];
    if (!this.canOfferPeace(pa, b)) return false;
    const ratio = this.warriors(pa) / Math.max(1, this.warriors(pb));
    const weary = this.time - (pa.warStart.get(b) ?? this.time) > 45;
    const accept = ratio > 1.3 || (weary && this.rand() < 0.5) || this.rand() < 0.2;
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
    this.emit('peace', a, b);
  }

  private unlink(a: number, b: number) {
    const pa = this.poleis[a];
    const pb = this.poleis[b];
    if (!pa.wars.has(b)) return;
    pa.wars.delete(b);
    pb.wars.delete(a);
    pa.warStart.delete(b);
    pb.warStart.delete(a);
    for (const battle of this.battles) {
      const owners = [battle.attacker.owner, battle.defenderIdx];
      if (owners.includes(a) && owners.includes(b)) {
        battle.end = -1;
        battle.attacker.battle = 0;
        if (battle.defender) battle.defender.battle = 0;
      }
    }
    this.battles = this.battles.filter(x => x.end >= 0);
    for (const army of this.armies) {
      if (army.owner === a || army.owner === b) army.target = -1;
    }
  }

  // ─── Development ──────────────────────────────────────────────────────────

  /**
   * Spends drachmae on the polis: usually a farm (more people) or a port (more trade), and in one
   * case out of ten a small vassal polis on a nearby historical site.
   */
  develop(idx: number): DevelopmentOutcome | null {
    const p = this.poleis[idx];
    if (!this.canDevelop(p)) return null;
    p.drachmae -= this.developCost(p);
    p.developments++;

    const roll = this.rand();
    if (roll < RULES.vassalChance && this.foundVassal(p)) return 'vassal';
    const port = roll >= RULES.farmChance ? this.portSite(p) : -1;
    if (port >= 0) return this.build(p, port, 'port');
    const farm = this.farmSite(p);
    if (farm >= 0) return this.build(p, farm, 'farm');
    const fallback = this.portSite(p);
    return fallback >= 0 ? this.build(p, fallback, 'port') : null;
  }

  private build(p: PolisState, cell: number, kind: BuildingKind): BuildingKind {
    this.buildings.push({ cell, kind, t: this.time });
    this.claims.push({ cell, t: this.time });
    if (kind === 'farm') p.farms++;
    else p.ports++;
    this.emit(kind, p.idx);
    return kind;
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

  /** Fertile lowland away from the walls and from other farms. */
  private farmSite(p: PolisState): number {
    const w = this.world;
    let best = -1;
    let bestScore = -Infinity;
    for (const c of w.greekCells) {
      if (this.owner[c] !== p.idx || c === p.capital) continue;
      const score = w.fertility[c] - Math.max(0, w.elevation[c]) / 1500 + this.rand() * 0.25;
      if (score > bestScore && !this.nearBuilding(c, 4)) {
        bestScore = score;
        best = c;
      }
    }
    return best;
  }

  /** A stretch of coast near the capital without a harbour yet. */
  private portSite(p: PolisState): number {
    const w = this.world;
    let best = -1;
    let bestScore = -Infinity;
    for (const c of w.greekCells) {
      if (this.owner[c] !== p.idx || c === p.capital) continue;
      const x = c % w.cols;
      const y = (c - x) / w.cols;
      if (!w.neighbours4(x, y).some(n => w.terrain[n] === Terrain.Sea)) continue;
      const score = -Math.hypot(x + 0.5 - p.cx, y + 0.5 - p.cy) * 0.01 + this.rand() * 0.3;
      if (score > bestScore && !this.nearBuilding(c, 6, 'port') && !this.nearBuilding(c, 2)) {
        bestScore = score;
        best = c;
      }
    }
    return best;
  }

  /** Founds a vassal on the nearest free historical site; returns false when none is reachable. */
  private foundVassal(p: PolisState): boolean {
    const capitals = new Set(this.poleis.map(q => q.capital));
    const site = this.siteCells
      .filter(s => !this.usedSites.has(s.id) && !capitals.has(s.cell))
      .filter(s => this.owner[s.cell] === WILD || this.owner[s.cell] === p.idx)
      .map(s => ({ ...s, d: Math.hypot((s.cell % this.world.cols) + 0.5 - p.cx, Math.floor(s.cell / this.world.cols) + 0.5 - p.cy) }))
      .filter(s => s.d < 220)
      .sort((a, b) => a.d - b.d)[0];
    if (!site) return false;

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

    for (const p of this.poleis) p.farms = p.ports = 0;
    for (const b of this.buildings) {
      const o = this.owner[b.cell];
      if (o < 0) continue;
      if (b.kind === 'farm') this.poleis[o].farms++;
      else this.poleis[o].ports++;
    }

    for (const p of this.poleis) {
      if (!p.alive) continue;
      this.economy(p, dt);
      this.expedition(p, dt);
      if (p.idx !== this.player && this.time >= p.nextAi) {
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

    this.sailShips(dt);
    this.tradeFx = this.tradeFx.filter(f => this.time - f.t < 2);

    this.moveArmies(dt);
    this.detectBattles();
    this.resolveBattles();
    this.armies = this.armies.filter(a => !a.dead);
    this.claims = this.claims.filter(c => this.time - c.t < 1.2);
    this.checkEnd();
  }

  private economy(p: PolisState, dt: number) {
    const capacity = this.capacity(p);
    const total = this.totalPopulation(p);
    let growth = RULES.growthRate * p.prosperity * p.civilians * (1 - total / capacity);
    growth = Math.max(growth, -0.03 * p.civilians);
    p.civilians = Math.max(0, p.civilians + growth * dt);

    const avgFertility = p.fertility / Math.max(1, p.cells);
    const culture = 1 + RULES.cultureBonus * p.culture;
    const trade = 1 + RULES.portBonus * p.ports;
    p.income =
      this.workers(p) * RULES.incomePerWorker * p.prosperity * (0.7 + 0.3 * avgFertility) * culture * trade -
      this.warriors(p) * RULES.upkeepPerWarrior;
    p.drachmae += p.income * dt;
    if (p.drachmae < 0) {
      // Unpaid hoplites go home.
      p.drachmae = 0;
      p.garrison *= 1 - 0.03 * dt;
    }
  }

  private expedition(p: PolisState, dt: number) {
    const e = p.expedition;
    if (!e) return;
    e.timer += dt;
    const w = this.world;
    while (e.timer >= 1 / RULES.settleRate && e.settlers >= RULES.settlersPerCell && this.wildCells > 0) {
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
      e.settlers -= RULES.settlersPerCell;
      p.prosperity = Math.min(RULES.maxProsperity, p.prosperity + RULES.prosperityPerCell);
      const x = cell % w.cols;
      for (const n of w.neighbours4(x, (cell - x) / w.cols)) {
        if (this.owner[n] !== WILD || e.queued.has(n)) continue;
        e.queued.add(n);
        e.frontier.push(n, this.settleCost(p, n));
      }
    }
    if (e.settlers < RULES.settlersPerCell || this.wildCells === 0) {
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
    if (this.canSettle(p) && this.rand() < 0.3) this.settle(p.idx);
    const militancy = 0.05 + 0.015 * p.militarism;
    if (this.canTrain(p) && this.warriors(p) < p.civilians * militancy && this.rand() < 0.6) this.train(p.idx);
    // Vassals follow their overlord in war and peace.
    if (p.overlord >= 0 && this.poleis[p.overlord].alive) return;
    if (p.drachmae > this.developCost(p) * 1.5 && this.rand() < 0.08) this.develop(p.idx);

    let worldWars = 0;
    for (const q of this.poleis) worldWars += q.wars.size;
    worldWars /= 2;

    if (this.time > RULES.aiWarGrace && p.wars.size === 0 && worldWars < RULES.maxWorldWars && this.rand() < 0.12) {
      // Ambitions grow as the wilderness runs out and the years pass.
      const crowded = this.wildCells < this.world.greekCells.length * 0.1;
      let target = -1;
      let bestRatio = crowded ? 1.05 : 1.4 - Math.min(0.3, this.time / 1200);
      const mine = this.warriors(p);
      const friends = this.bloc(p.idx);
      for (const q of this.poleis) {
        if (!q.alive || friends.includes(q.idx) || p.wars.has(q.idx) || q.overlord >= 0 || p.allies.has(q.idx)) continue;
        if (q.idx === this.player && this.time < RULES.aiPlayerGrace) continue;
        if (Math.hypot(q.cx - p.cx, q.cy - p.cy) > RULES.aiWarRange) continue;
        // A fearsome reputation makes a city look stronger than it is.
        const ratio = mine / Math.max(1, this.warriors(q) * (1 + RULES.prestigeDeterrence * q.prestige));
        if (ratio > bestRatio) {
          bestRatio = ratio;
          target = q.idx;
        }
      }
      if (target >= 0) this.declareWar(p.idx, target);
    }

    // Impressed by the player's victories, a city may send an embassy offering an alliance.
    const me = this.poleis[this.player];
    if (
      me?.alive &&
      me.prestige > 0 &&
      this.time >= p.embassyAt &&
      !p.allies.has(me.idx) &&
      !p.wars.has(me.idx) &&
      !this.bloc(me.idx).includes(p.idx) &&
      this.rand() < RULES.allianceOfferChance * me.prestige
    ) {
      p.embassyAt = this.time + 120;
      this.emit('allianceOffer', p.idx, me.idx);
    }

    const playerBloc = this.player >= 0 ? this.bloc(this.player) : [];
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
    return RULES.tradeIncome * (1 + RULES.cultureBonus * p.culture);
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
    if (this.shipsOf(p.idx) >= Math.min(RULES.maxShips, 1 + p.ports)) return;
    const from = this.harbourOf(p);
    if (from < 0) return;
    const w = this.world;
    const options: { q: PolisState; harbour: number; weight: number }[] = [];
    for (const q of this.poleis) {
      if (!q.alive || q === p || p.wars.has(q.idx)) continue;
      const harbour = this.harbourOf(q);
      if (harbour < 0) continue;
      const d = Math.hypot((harbour % w.cols) - (from % w.cols), Math.floor(harbour / w.cols) - Math.floor(from / w.cols));
      const pull = (1 + RULES.prestigeTradePull * q.prestige) * (p.allies.has(q.idx) ? 2 : 1);
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
    owner.drachmae += amount;
    owner.tradeEarned += amount;
    this.tradeFx.push({ x: s.x, y: s.y, t: this.time, amount, owner: owner.idx });
    // The receiving harbour profits too, though less than the shipowner.
    const share = amount * RULES.tradeReceiverShare;
    dest.drachmae += share;
    dest.tradeEarned += share;
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
    for (const a of this.armies) if (a.owner === p.idx && !a.dead) count++;
    const cap = Math.min(5, 1 + Math.floor(this.warriors(p) / 1500));
    if (count >= cap || p.garrison < 100) return;
    const strength = Math.round(Math.max(50, p.garrison * 0.35));
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
      dead: false
    });
  }

  private isEnemyCell(army: Army, cell: number): boolean {
    const o = cell >= 0 ? this.owner[cell] : -1;
    return o >= 0 && this.poleis[army.owner].wars.has(o);
  }

  private moveArmies(dt: number) {
    const w = this.world;
    for (const a of this.armies) {
      if (a.dead || a.battle) continue;
      const p = this.poleis[a.owner];
      if (a.strength < 3) {
        a.dead = true;
        continue;
      }
      if (!p.wars.size) {
        // Peace: march home and rejoin the garrison.
        if (this.walk(a, p.cx, p.cy, dt)) {
          p.garrison += a.strength;
          a.dead = true;
        }
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
      if (a.target === victim.capital && victim.garrison >= 1) {
        this.startBattle(a, null, victim.idx);
        continue;
      }
      this.captureAround(a, tx, ty);
      a.strength *= 0.99;
      a.target = this.adjacentEnemyCell(a);
    }
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
      : RULES.armySpeedLand * (1 - Math.min(0.6, (this.world.elevation[cell] / 1000) * RULES.mountainSlowdown));
    const step = Math.min(d, speed * dt);
    a.x += (dx / d) * step;
    a.y += (dy / d) * step;
    return false;
  }

  private pickArmyTarget(a: Army): number {
    const w = this.world;
    const p = this.poleis[a.owner];
    if (this.rand() < 0.12) {
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
      attacker,
      defender,
      defenderIdx,
      start: this.time,
      end: this.time + RULES.battleDuration * (0.8 + this.rand() * 0.4)
    });
  }

  private resolveBattles() {
    const pending: Battle[] = [];
    for (const b of this.battles) {
      if (this.time < b.end) {
        pending.push(b);
        continue;
      }
      const att = b.attacker;
      const def = b.defender;
      const q = this.poleis[b.defenderIdx];
      att.battle = 0;
      if (def) def.battle = 0;
      if (att.dead || (def && def.dead) || !q.alive) continue;

      // Militarism tips the scales slightly; walls favour a defending garrison.
      const ma = this.battleMultiplier(att.owner);
      const md = this.battleMultiplier(q.idx) * (def ? 1 : RULES.wallsBonus);
      const sa = att.strength * ma;
      const sd = (def ? def.strength : q.garrison) * md;
      const pa = Math.pow(sa, 1.2) / (Math.pow(sa, 1.2) + Math.pow(sd, 1.2));
      const attackerWins = this.rand() < pa;
      const [win, lose, winMult] = attackerWins ? [sa, sd, ma] : [sd, sa, md];
      const survivors = Math.max(2, (win - lose * (0.35 + this.rand() * 0.3)) / winMult);

      const before = { att: att.strength, def: def ? def.strength : q.garrison };
      if (attackerWins) {
        att.strength = survivors;
        this.spoils(att.owner, q.idx, before.def, before.att - survivors, b);
        if (def) {
          def.dead = true;
        } else {
          q.garrison = 0;
          this.conquer(q.idx, att.owner);
        }
      } else {
        att.dead = true;
        this.spoils(q.idx, att.owner, before.att, before.def - survivors, b);
        if (def) def.strength = survivors;
        else q.garrison = survivors;
      }
    }
    this.battles = pending;
  }

  /** Gold, captives and renown for the victor; the player's victories are reported to the UI. */
  private spoils(winner: number, loser: number, enemyLosses: number, ownLosses: number, b: Battle) {
    const w = this.poleis[winner];
    const gold = Math.round(RULES.lootBase + enemyLosses * RULES.lootPerEnemy);
    const slaves = Math.round(enemyLosses * RULES.captiveShare);
    w.drachmae += gold;
    w.slaves += slaves;
    w.prestige += RULES.prestigePerVictory;
    if (winner !== this.player) return;
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

  /** Cells that changed owner since the last call (for incremental repaints). */
  takeDirty(): number[] {
    const out = this.dirty;
    this.dirty = [];
    return out;
  }

  private capture(cell: number, winner: number, loser: number) {
    const w = this.poleis[winner];
    const l = this.poleis[loser];
    const share = l.civilians / Math.max(1, l.cells);
    l.civilians -= share * 0.6;
    w.civilians += share * 0.3;
    this.setOwner(cell, winner, true);
    if (l.cells === 0) this.conquer(loser, winner);
  }

  private conquer(loser: number, winner: number) {
    const l = this.poleis[loser];
    const w = this.poleis[winner];
    if (!l.alive) return;
    for (const c of this.world.greekCells) {
      if (this.owner[c] === loser) this.setOwner(c, winner, true);
    }
    w.civilians += l.civilians * 0.5;
    w.slaves += l.slaves * 0.5;
    l.civilians = 0;
    l.slaves = 0;
    l.garrison = 0;
    l.expedition = null;
    l.alive = false;
    l.conqueror = winner;
    for (const a of this.armies) if (a.owner === loser) a.dead = true;
    for (const e of l.wars) {
      this.poleis[e].wars.delete(loser);
      this.poleis[e].warStart.delete(loser);
    }
    l.wars.clear();
    // Vassals of a fallen city go their own way; its treaties die with it.
    for (const v of this.poleis) {
      if (v.overlord === loser) v.overlord = -1;
      v.allies.delete(loser);
    }
    l.allies.clear();
    this.emit('fall', loser, winner);
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

  private emit(kind: GameEventKind, a: number, b = -1) {
    this.events.push({ id: this.nextId++, kind, a, b, year: this.year });
    if (this.events.length > 40) this.events.shift();
  }
}
