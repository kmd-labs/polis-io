import { BUDGET_KEYS, Budget, RULES, Simulation } from './simulation';

/** Figures kept for every polis every game year (in this column order). */
export const HISTORY_FIELDS = [
  'alive',
  'drachmae',
  'incomePerMonth',
  'population',
  'workers',
  'hoplites',
  'territoryPct',
  'satisfaction',
  'prestige',
  'battlesWon',
  'battlesLost',
  'tributePerMonth',
  'capitalsTaken',
  'warsWon'
] as const;
export type HistoryField = (typeof HISTORY_FIELDS)[number];

const F = HISTORY_FIELDS.length;
const COL = Object.fromEntries(HISTORY_FIELDS.map((f, i) => [f, i])) as Record<HistoryField, number>;

/** One polis in one year, as read back from the history. */
export interface Snapshot extends Record<HistoryField, number> {
  year: number;
  idx: number;
  budget: Budget;
}

/** Something worth a marker on the charts' time axis. */
export type HistoryEvent =
  | { kind: 'budget'; year: number; from: Budget; to: Budget }
  | { kind: 'war' | 'peace'; year: number; other: number }
  | { kind: 'built'; year: number; id: string };

interface YearRow {
  year: number;
  count: number;
  data: Float32Array;
  budgets: Uint8Array;
}

/**
 * The game's yearly record: a compact snapshot of every polis each year (columnar, so three
 * centuries of forty cities stay well under a megabyte), plus the player's notable events.
 * Plain data, framework-free and serialisable.
 */
export class GameHistory {
  private rows: YearRow[] = [];
  readonly events: HistoryEvent[] = [];
  /** Cumulative tribute per polis at the previous snapshot, to turn totals into a yearly rate. */
  private lastTribute: number[] = [];

  get years(): number[] {
    return this.rows.map(r => r.year);
  }

  get length(): number {
    return this.rows.length;
  }

  clear() {
    this.rows = [];
    this.events.length = 0;
    this.lastTribute = [];
  }

  /** Takes this year's snapshot of every polis (once per year; repeated calls are ignored). */
  record(sim: Simulation) {
    const year = sim.year;
    if (this.rows.at(-1)?.year === year) return;
    const greek = sim.world.greekCells.length;
    const n = sim.poleis.length;
    const data = new Float32Array(n * F);
    const budgets = new Uint8Array(n * BUDGET_KEYS.length);
    for (const p of sim.poleis) {
      const o = p.idx * F;
      const tribute = (p.tributeGold - (this.lastTribute[p.idx] ?? p.tributeGold)) / 12;
      this.lastTribute[p.idx] = p.tributeGold;
      // Peoples beyond the frontier are not ranked among the cities.
      data[o + COL.alive] = p.alive && !p.tribe && !p.trader ? 1 : 0;
      data[o + COL.drachmae] = sim.treasury(p);
      data[o + COL.incomePerMonth] = (p.income * RULES.secondsPerYear) / 12 + tribute;
      data[o + COL.population] = sim.totalPopulation(p);
      data[o + COL.workers] = sim.workers(p);
      data[o + COL.hoplites] = sim.warriors(p);
      data[o + COL.territoryPct] = (p.cells / greek) * 100;
      data[o + COL.satisfaction] = p.satisfaction;
      data[o + COL.prestige] = p.prestige;
      data[o + COL.battlesWon] = p.battlesWon;
      data[o + COL.battlesLost] = p.battlesLost;
      data[o + COL.tributePerMonth] = tribute;
      data[o + COL.capitalsTaken] = p.capitalsTaken;
      data[o + COL.warsWon] = p.warsWon;
      BUDGET_KEYS.forEach((k, i) => (budgets[p.idx * BUDGET_KEYS.length + i] = p.budget[k]));
    }
    this.rows.push({ year, count: n, data, budgets });
  }

  addEvent(event: HistoryEvent) {
    this.events.push(event);
  }

  /** One figure of one polis across the years it existed. */
  series(idx: number, field: HistoryField): { year: number; value: number }[] {
    const out: { year: number; value: number }[] = [];
    for (const r of this.rows) {
      if (idx >= r.count || !r.data[idx * F + COL.alive]) continue;
      out.push({ year: r.year, value: r.data[idx * F + COL[field]] });
    }
    return out;
  }

  /** Every polis as it stood in a given year (empty if that year was not recorded). */
  snapshotsAt(year: number): Snapshot[] {
    const r = this.rows.find(row => row.year === year);
    return r ? this.unpack(r) : [];
  }

  /** The most recent `years` yearly rows, oldest first. */
  recent(years: number): Snapshot[][] {
    return this.rows.slice(-years).map(r => this.unpack(r));
  }

  /** Bytes held by the snapshots (for the memory budget). */
  get bytes(): number {
    return this.rows.reduce((sum, r) => sum + r.data.byteLength + r.budgets.byteLength + 32, 0);
  }

  toJSON() {
    return {
      fields: HISTORY_FIELDS,
      rows: this.rows.map(r => ({ year: r.year, count: r.count, data: Array.from(r.data), budgets: Array.from(r.budgets) })),
      events: this.events
    };
  }

  private unpack(r: YearRow): Snapshot[] {
    const out: Snapshot[] = [];
    for (let idx = 0; idx < r.count; idx++) {
      const s = { year: r.year, idx } as Snapshot;
      for (const f of HISTORY_FIELDS) s[f] = r.data[idx * F + COL[f]];
      s.budget = Object.fromEntries(BUDGET_KEYS.map((k, i) => [k, r.budgets[idx * BUDGET_KEYS.length + i]])) as Budget;
      out.push(s);
    }
    return out;
  }
}

/** True when any share moved by at least `threshold` percentage points. */
export function budgetChanged(from: Budget, to: Budget, threshold = 5): boolean {
  return BUDGET_KEYS.some(k => Math.abs(from[k] - to[k]) >= threshold);
}
