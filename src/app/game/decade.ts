import { HegemonyCategory, HEGEMONY_CATEGORIES } from './hegemony';
import { Snapshot } from './history';
import { BUDGET_KEYS, Budget } from './simulation';

/** The sentence the chroniclers choose to sum up a decade. */
export type DecadeVerdict = 'silver' | 'people' | 'land' | 'arms' | 'war' | 'hard' | 'quiet';

export interface DecadeReport {
  fromYear: number;
  toYear: number;
  /** Change against ten years earlier, as fractions (0.12 = +12%); null when there is nothing to compare. */
  population: number | null;
  income: number | null;
  territory: number | null;
  battlesWon: number;
  battlesLost: number;
  /** Average budget shares over the decade (whole percents). */
  budget: Budget;
  /** The player's place in each hegemony category then and now (0 = unranked). */
  places: Record<HegemonyCategory, { then: number; now: number }>;
  verdict: DecadeVerdict;
}

const change = (now: number, then: number): number | null => (then > 0 ? (now - then) / then : null);

/**
 * Sums up a decade of one polis from its yearly snapshots (oldest first; the first is ten years
 * before the last) and the hegemony places at both ends. Everything comes from the history, so the
 * report always agrees with the charts.
 */
export function decadeReport(
  rows: Snapshot[],
  placesThen: Record<HegemonyCategory, number> | null,
  placesNow: Record<HegemonyCategory, number> | null
): DecadeReport {
  const first = rows[0];
  const last = rows[rows.length - 1];
  const population = change(last.population, first.population);
  const income = change(last.incomePerMonth, first.incomePerMonth);
  const territory = change(last.territoryPct, first.territoryPct);
  const battlesWon = last.battlesWon - first.battlesWon;
  const battlesLost = last.battlesLost - first.battlesLost;

  // The years of the decade proper (the first row only serves as the baseline).
  const decade = rows.slice(1);
  const budget = Object.fromEntries(
    BUDGET_KEYS.map(k => [k, Math.round(decade.reduce((sum, s) => sum + s.budget[k], 0) / Math.max(1, decade.length))])
  ) as Budget;

  const places = Object.fromEntries(
    HEGEMONY_CATEGORIES.map(c => [c, { then: placesThen?.[c] ?? 0, now: placesNow?.[c] ?? 0 }])
  ) as DecadeReport['places'];

  return {
    fromYear: first.year,
    toYear: last.year,
    population,
    income,
    territory,
    battlesWon,
    battlesLost,
    budget,
    places,
    verdict: verdictOf(population, income, territory, battlesWon, battlesLost)
  };
}

/** One rule-picked sentence: a lost war first, then a good war, then the biggest gain, else hard times or calm. */
function verdictOf(
  population: number | null,
  income: number | null,
  territory: number | null,
  won: number,
  lost: number
): DecadeVerdict {
  if (lost > won && lost >= 2) return 'war';
  if (won >= lost + 3) return 'arms';
  const gains: [DecadeVerdict, number][] = [
    ['silver', income ?? 0],
    ['people', population ?? 0],
    ['land', territory ?? 0]
  ];
  const [best, value] = gains.reduce((a, b) => (b[1] > a[1] ? b : a));
  if (value >= 0.05) return best;
  if (gains.every(([, v]) => v < -0.05)) return 'hard';
  return 'quiet';
}
