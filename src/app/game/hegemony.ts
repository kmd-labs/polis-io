import { Snapshot } from './history';

export type HegemonyCategory = 'finance' | 'population' | 'arms';
export const HEGEMONY_CATEGORIES: readonly HegemonyCategory[] = ['finance', 'population', 'arms'];

/** Years each measure looks back over, and the points a feat of arms is worth. */
export const HEGEMONY_RULES = {
  financeYears: 10,
  armsYears: 25,
  battlePoints: 1,
  capitalPoints: 5,
  warPoints: 3,
  /** Points for 1st, 2nd and 3rd place in a category. */
  podiumPoints: [3, 2, 1]
} as const;

export interface Rank {
  idx: number;
  value: number;
}

export interface HegemonyStanding {
  year: number;
  /** Every living polis, best first, per category; the podium is the first three. */
  finance: Rank[];
  population: Rank[];
  arms: Rank[];
  /** Hegemony points (0–9) per polis index. */
  scores: Record<number, number>;
  /** Place (1-based) of every polis in every category. */
  places: Record<number, Record<HegemonyCategory, number>>;
  /** Highest score (ties go to the reigning Hegemon, then the larger population); -1 if nobody scored. */
  hegemon: number;
}

/**
 * Ranks the poleis of Hellas from their yearly snapshots (oldest first; the last row is the year
 * being ranked). Finance is the average monthly income, tribute included, over the last ten years;
 * population is today's; arms counts battles won (1), capitals taken (5) and wars won (3) over the
 * last twenty-five years. Places 1–3 in each category earn 3/2/1 points; the most points makes the
 * Hegemon of Hellas; a reigning Hegemon (`incumbent`) keeps the title unless outscored.
 * Fallen poleis are not ranked; vassals are ranked on their own.
 */
export function rankHegemony(rows: Snapshot[][], year: number, incumbent = -1): HegemonyStanding {
  const now = rows.at(-1) ?? [];
  const alive = now.filter(s => s.alive);
  const population = new Map(alive.map(s => [s.idx, s.population]));

  const finance = alive.map(s => {
    const window = rows.slice(-HEGEMONY_RULES.financeYears).map(row => row[s.idx]).filter(x => x?.alive);
    const avg = window.reduce((sum, x) => sum + x.incomePerMonth, 0) / Math.max(1, window.length);
    return { idx: s.idx, value: avg };
  });

  // Feats are cumulative counters: today's minus those of 25 years ago (or 0 if the polis did not exist yet).
  const armsBase = rows.length > HEGEMONY_RULES.armsYears ? rows[rows.length - 1 - HEGEMONY_RULES.armsYears] : null;
  const feats = (s: Snapshot | undefined) =>
    s
      ? s.battlesWon * HEGEMONY_RULES.battlePoints + s.capitalsTaken * HEGEMONY_RULES.capitalPoints + s.warsWon * HEGEMONY_RULES.warPoints
      : 0;
  const arms = alive.map(s => ({ idx: s.idx, value: feats(s) - feats(armsBase?.[s.idx]) }));

  const order = (list: Rank[]) =>
    [...list].sort((a, b) => b.value - a.value || (population.get(b.idx) ?? 0) - (population.get(a.idx) ?? 0) || a.idx - b.idx);
  const ranked = {
    finance: order(finance),
    population: order(alive.map(s => ({ idx: s.idx, value: s.population }))),
    arms: order(arms)
  };

  const scores: Record<number, number> = {};
  const places: Record<number, Record<HegemonyCategory, number>> = {};
  for (const s of alive) {
    scores[s.idx] = 0;
    places[s.idx] = { finance: 0, population: 0, arms: 0 };
  }
  for (const cat of HEGEMONY_CATEGORIES) {
    ranked[cat].forEach((r, i) => {
      places[r.idx][cat] = i + 1;
      // A podium place needs something to show for it (no points for zero feats of arms).
      if (i < HEGEMONY_RULES.podiumPoints.length && r.value > 0) scores[r.idx] += HEGEMONY_RULES.podiumPoints[i];
    });
  }

  let hegemon = -1;
  for (const s of alive) {
    if (scores[s.idx] <= 0) continue;
    if (
      hegemon < 0 ||
      scores[s.idx] > scores[hegemon] ||
      (scores[s.idx] === scores[hegemon] && s.population > (population.get(hegemon) ?? 0))
    ) {
      hegemon = s.idx;
    }
  }
  // The title is not lost on a tie.
  if (hegemon >= 0 && incumbent >= 0 && incumbent !== hegemon && scores[incumbent] === scores[hegemon]) hegemon = incumbent;
  return { year, ...ranked, scores, places, hegemon };
}
