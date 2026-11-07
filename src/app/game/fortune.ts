import { BUDGET_KEYS, BudgetKey, RULES } from './simulation';

/** Misfortunes that can strike a city. */
export const BANES = ['fire', 'plague', 'drought', 'pirates', 'earthquake', 'embezzlement'] as const;
export type Bane = (typeof BANES)[number];

/** A twist of fortune, as rolled; `amount` and `year` are filled in once it is applied. */
export type FortuneRoll =
  | { boon: true; branch: BudgetKey; months: number }
  | { boon: false; bane: Bane; months: number };

export type Fortune = FortuneRoll & { amount: number; year: number };

/**
 * Rolls a twist of fortune: more often a windfall for one of the five budget branches (one to
 * three months of income), otherwise a misfortune costing from half a month up to
 * RULES.fortuneMaxMonths of the city's full income.
 */
export function rollFortune(rand: () => number): FortuneRoll {
  if (rand() < RULES.fortuneBoonChance) {
    const branch = BUDGET_KEYS[Math.floor(rand() * BUDGET_KEYS.length)];
    return { boon: true, branch, months: 1 + Math.round(rand() * 2) };
  }
  const bane = BANES[Math.floor(rand() * BANES.length)];
  const months = Math.round((0.5 + rand() * (RULES.fortuneMaxMonths - 0.5)) * 10) / 10;
  return { boon: false, bane, months };
}
