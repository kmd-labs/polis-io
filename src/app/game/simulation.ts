import { POLEIS, PolisDef } from './data/poleis';
import { Terrain, World } from './world';

/** Cell owner codes; values >= 0 are polis indices. */
export const SEA = -3;
export const FOREIGN = -2;
export const WILD = -1;

/** Tunable game balance. Times are in game seconds (1 game second = 1 real second at 1× speed). */
export const RULES = {
  startYear: 600,
  secondsPerYear: 4,
  startRadius: 7,
  /** Carrying capacity per unit of owned fertility. */
  peoplePerFertility: 380,
  /** Share of civilians fit for physical labour. */
  laborShare: 0.55,
  growthRate: 0.02,
  incomePerWorker: 0.0025,
  upkeepPerWarrior: 0.003,
  /** "Settle the wilderness" sends this share of workers away for good. */
  settleShare: 0.1,
  settlersPerCell: 40,
  settleInterval: 0.8,
  prosperityPerCell: 0.005,
  maxProsperity: 2,
  trainShare: 0.06,
  trainCostPerHoplite: 1.2,
  armySpeedLand: 2.2,
  armySpeedSea: 1.4,
  captureDwell: 1.4,
  battleDuration: 1.8,
  battleRange: 1.3,
  wallsBonus: 1.25,
  aiWarGrace: 45,
  aiPlayerGrace: 90,
  maxWorldWars: 4,
  victoryShare: 0.5
} as const;

export interface Expedition {
  settlers: number;
  initial: number;
  timer: number;
  /** Already reported a colony across the sea during this expedition. */
  colony: boolean;
}

export interface PolisState {
  idx: number;
  def: PolisDef;
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

export type GameEventKind = 'war' | 'peace' | 'peaceRefused' | 'settle' | 'colony' | 'fall';

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
  claims: Claim[] = [];
  events: GameEvent[] = [];
  time = 0;
  status: GameStatus = 'choosing';
  player = -1;
  /** Bumped whenever any cell changes owner, so renderers know to repaint. */
  version = 0;
  wildCells = 0;

  private nextId = 1;
  private readonly rand = Math.random;

  constructor(readonly world: World) {
    this.owner = new Int16Array(world.size);
    this.reset();
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

    this.poleis = POLEIS.map((def, idx) => {
      const p = w.project(def.lon, def.lat);
      let capital = w.cellAt(p.x, p.y);
      if (capital < 0 || w.terrain[capital] !== Terrain.Greek) capital = w.nearestGreekCell(p.x, p.y);
      return {
        idx,
        def,
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
        nextAi: 2 + idx * 0.17,
        nextSpawn: 0,
        conqueror: -1
      };
    });

    // Multi-source BFS so neighbouring poleis split contested land fairly.
    const depth = new Int16Array(w.size).fill(-1);
    let frontier: number[] = [];
    for (const p of this.poleis) {
      this.setOwner(p.capital, p.idx, false);
      depth[p.capital] = 0;
      frontier.push(p.capital);
    }
    for (let d = 1; d <= RULES.startRadius; d++) {
      const next: number[] = [];
      for (const c of frontier) {
        for (const n of w.neighbours4(c % w.cols, Math.floor(c / w.cols))) {
          if (this.owner[n] !== WILD || depth[n] >= 0) continue;
          depth[n] = d;
          this.setOwner(n, this.owner[c], false);
          next.push(n);
        }
      }
      frontier = next;
    }

    for (const p of this.poleis) {
      p.civilians = this.capacity(p) * 0.5;
      p.garrison = 60 + Math.round(this.rand() * 40);
    }
    this.version++;
  }

  choose(idx: number) {
    if (this.status !== 'choosing' || !this.poleis[idx]) return;
    this.player = idx;
    this.status = 'playing';
  }

  // ─── Derived figures ──────────────────────────────────────────────────────

  capacity(p: PolisState): number {
    return Math.max(1, p.fertility * RULES.peoplePerFertility);
  }

  workers(p: PolisState): number {
    return Math.floor(p.civilians * RULES.laborShare);
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
    return Math.round(p.civilians + p.garrison + this.fieldStrength(p.idx));
  }

  settlers(p: PolisState): number {
    return Math.floor(this.workers(p) * RULES.settleShare);
  }

  canSettle(p: PolisState): boolean {
    return p.alive && !p.expedition && this.wildCells > 0 && this.settlers(p) >= RULES.settlersPerCell;
  }

  trainBatch(p: PolisState): number {
    return Math.max(20, Math.round(this.workers(p) * RULES.trainShare));
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
    p.expedition = { settlers, initial: settlers, timer: 0, colony: false };
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
    pa.wars.add(b);
    pb.wars.add(a);
    pa.warStart.set(b, this.time);
    pb.warStart.set(a, this.time);
    pa.nextSpawn = Math.min(pa.nextSpawn, this.time);
    pb.nextSpawn = Math.min(pb.nextSpawn, this.time + 1);
    this.emit('war', a, b);
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
    this.emit('peace', a, b);
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
    }

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
    p.income =
      this.workers(p) * RULES.incomePerWorker * p.prosperity * (0.7 + 0.3 * avgFertility) -
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
    while (e.timer >= RULES.settleInterval && e.settlers >= RULES.settlersPerCell) {
      e.timer -= RULES.settleInterval;
      const pick = this.pickWildCell(p);
      if (pick.cell < 0) break;
      if (pick.colony && !e.colony) {
        e.colony = true;
        this.emit('colony', p.idx);
      }
      this.setOwner(pick.cell, p.idx, true);
      e.settlers -= RULES.settlersPerCell;
      p.prosperity = Math.min(RULES.maxProsperity, p.prosperity + RULES.prosperityPerCell);
    }
    if (e.settlers < RULES.settlersPerCell || this.wildCells === 0) {
      // Whoever could not be given land returns home.
      p.civilians += Math.max(0, e.settlers);
      p.expedition = null;
    }
  }

  /** Best wild cell bordering the polis; across the sea (a colony) when its own coast is full. */
  private pickWildCell(p: PolisState): { cell: number; colony: boolean } {
    const w = this.world;
    let best = -1;
    let bestScore = -Infinity;
    let nearest = -1;
    let nearestD = Infinity;
    for (const c of w.greekCells) {
      if (this.owner[c] !== WILD) continue;
      const x = c % w.cols;
      const y = (c - x) / w.cols;
      const d = Math.hypot(x + 0.5 - p.cx, y + 0.5 - p.cy);
      if (d + this.rand() * 4 < nearestD) {
        nearestD = d;
        nearest = c;
      }
      if (!w.neighbours4(x, y).some(n => this.owner[n] === p.idx)) continue;
      const score = w.fertility[c] + this.rand() * 0.35 - d * 0.012;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return best >= 0 ? { cell: best, colony: false } : { cell: nearest, colony: nearest >= 0 };
  }

  private think(p: PolisState) {
    if (this.canSettle(p) && this.rand() < 0.3) this.settle(p.idx);
    if (this.canTrain(p) && this.warriors(p) < p.civilians * 0.12 && this.rand() < 0.6) this.train(p.idx);

    let worldWars = 0;
    for (const q of this.poleis) worldWars += q.wars.size;
    worldWars /= 2;

    if (this.time > RULES.aiWarGrace && p.wars.size === 0 && worldWars < RULES.maxWorldWars && this.rand() < 0.12) {
      // Ambitions grow as the wilderness runs out and the years pass.
      const crowded = this.wildCells < this.world.greekCells.length * 0.1;
      let target = -1;
      let bestRatio = crowded ? 1.05 : 1.4 - Math.min(0.3, this.time / 1200);
      const mine = this.warriors(p);
      for (const q of this.poleis) {
        if (!q.alive || q === p || p.wars.has(q.idx)) continue;
        if (q.idx === this.player && this.time < RULES.aiPlayerGrace) continue;
        if (Math.hypot(q.cx - p.cx, q.cy - p.cy) > 55) continue;
        const ratio = mine / Math.max(1, this.warriors(q));
        if (ratio > bestRatio) {
          bestRatio = ratio;
          target = q.idx;
        }
      }
      if (target >= 0) this.declareWar(p.idx, target);
    }

    for (const e of [...p.wars]) {
      if (e === this.player) continue;
      if (this.time - (p.warStart.get(e) ?? this.time) > 40 && this.rand() < 0.08) this.makePeace(p.idx, e);
    }
  }

  // ─── Armies & battles ─────────────────────────────────────────────────────

  private spawnArmy(p: PolisState) {
    let count = 0;
    for (const a of this.armies) if (a.owner === p.idx && !a.dead) count++;
    const cap = Math.min(5, 1 + Math.floor(this.warriors(p) / 250));
    if (count >= cap || p.garrison < 40) return;
    const strength = Math.round(Math.max(25, p.garrison * 0.35));
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
      this.capture(a.target, a.owner, victim.idx);
      a.strength *= 0.99;
      a.target = this.adjacentEnemyCell(a);
    }
  }

  /** Moves the army toward (tx, ty); returns true on arrival. Ships are slower than marching hoplites. */
  private walk(a: Army, tx: number, ty: number, dt: number): boolean {
    const dx = tx - a.x;
    const dy = ty - a.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.15) return true;
    const cell = this.world.cellAt(a.x, a.y);
    const atSea = cell < 0 || this.world.terrain[cell] === Terrain.Sea;
    const step = Math.min(d, (atSea ? RULES.armySpeedSea : RULES.armySpeedLand) * dt);
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
      const d = Math.hypot(x + 0.5 - a.x, y + 0.5 - a.y) + this.rand() * 6;
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
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
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

      const sa = att.strength;
      const sd = def ? def.strength : q.garrison * RULES.wallsBonus;
      const pa = Math.pow(sa, 1.2) / (Math.pow(sa, 1.2) + Math.pow(sd, 1.2));
      const attackerWins = this.rand() < pa;
      const [win, lose] = attackerWins ? [sa, sd] : [sd, sa];
      const survivors = Math.max(2, win - lose * (0.35 + this.rand() * 0.3));

      if (attackerWins) {
        att.strength = survivors;
        if (def) {
          def.dead = true;
        } else {
          q.garrison = 0;
          this.conquer(q.idx, att.owner);
        }
      } else {
        att.dead = true;
        if (def) def.strength = survivors;
        else q.garrison = survivors / RULES.wallsBonus;
      }
    }
    this.battles = pending;
  }

  // ─── Territory ────────────────────────────────────────────────────────────

  private setOwner(cell: number, idx: number, flash: boolean) {
    const prev = this.owner[cell];
    if (prev === idx) return;
    const f = this.world.fertility[cell];
    if (prev >= 0) {
      this.poleis[prev].cells--;
      this.poleis[prev].fertility -= f;
    } else if (prev === WILD) {
      this.wildCells--;
    }
    this.owner[cell] = idx;
    this.poleis[idx].cells++;
    this.poleis[idx].fertility += f;
    if (flash) this.claims.push({ cell, t: this.time });
    this.version++;
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
    l.civilians = 0;
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
    this.emit('fall', loser, winner);
  }

  private checkEnd() {
    if (this.status !== 'playing') return;
    const me = this.poleis[this.player];
    if (!me.alive) {
      this.status = 'lost';
      return;
    }
    const rivals = this.poleis.some(p => p.alive && p !== me);
    if (!rivals || me.cells >= this.world.greekCells.length * RULES.victoryShare) this.status = 'won';
  }

  private emit(kind: GameEventKind, a: number, b = -1) {
    this.events.push({ id: this.nextId++, kind, a, b, year: this.year });
    if (this.events.length > 40) this.events.shift();
  }
}
