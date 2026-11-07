import { BUDGET_KEYS, BUDGET_MIN, Budget, BudgetKey, Purchase } from './simulation';

// ─── Budget presets ─────────────────────────────────────────────────────────

export type PresetId = 'balanced' | 'war' | 'expansion' | 'mercantile' | 'golden';

/** Ready-made budgets (military / colonization / agriculture / trade / culture). */
export const BUDGET_PRESETS: Record<PresetId, Budget> = {
  balanced: { military: 20, colonization: 20, agriculture: 20, trade: 20, culture: 20 },
  war: { military: 50, colonization: 10, agriculture: 15, trade: 15, culture: 10 },
  expansion: { military: 15, colonization: 45, agriculture: 20, trade: 10, culture: 10 },
  mercantile: { military: 10, colonization: 15, agriculture: 15, trade: 45, culture: 15 },
  golden: { military: 10, colonization: 10, agriculture: 20, trade: 25, culture: 35 }
};
export const PRESET_IDS = Object.keys(BUDGET_PRESETS) as PresetId[];

/** The preset these shares match exactly, or 'custom' once any slider has been moved off it. */
export function presetOf(budget: Budget): PresetId | 'custom' {
  return PRESET_IDS.find(id => BUDGET_KEYS.every(k => BUDGET_PRESETS[id][k] === budget[k])) ?? 'custom';
}

/** True when shares are whole percents, each at least the minimum, adding up to 100. */
export function isValidBudget(budget: Budget): boolean {
  return (
    BUDGET_KEYS.every(k => Number.isInteger(budget[k]) && budget[k] >= BUDGET_MIN) &&
    BUDGET_KEYS.reduce((sum, k) => sum + budget[k], 0) === 100
  );
}

// ─── Fund forecast ──────────────────────────────────────────────────────────

export interface FundForecastInput {
  key: BudgetKey;
  /** This fund's share (%). */
  share: number;
  /** Sum of the shares (%) of funds that have something to buy; idle funds pass their money to these. */
  busyShare: number;
  /** All drachmae coming into the treasury per second (taxes, trade, tribute, spoils). */
  inflow: number;
  /** Hoplite pay per second, drawn from the military fund. */
  upkeep: number;
  /** Drachmae already saved in this fund. */
  balance: number;
  /** What the fund is saving for, or null when it has nothing to buy. */
  next: Purchase | null;
  /** Hoplites raised by one military purchase. */
  levy: number;
}

export interface FundForecast {
  /** Drachmae per second this fund gains after upkeep (may be negative for the military). */
  rate: number;
  /** Seconds until the next purchase is affordable; 0 = now, null = never at this rate (or nothing to buy). */
  eta: number | null;
  /** Military only: hoplites raised per second of game time at this rate. */
  hoplitesPerSecond: number;
  /** Military only: seconds until the fund runs dry and unpaid hoplites start deserting, or null. */
  desertIn: number | null;
}

/**
 * Projects one fund forward at today's income: how fast it fills, when it can buy what it is
 * saving for and, for the military, how many hoplites that means and whether pay runs out.
 */
export function forecastFund(f: FundForecastInput): FundForecast {
  const busy = f.next !== null && f.busyShare > 0;
  // A busy fund also receives its part of whatever the idle funds pass on.
  const effective = busy ? (f.share / f.busyShare) * 100 : f.share;
  const rate = (f.inflow * effective) / 100 - (f.key === 'military' ? f.upkeep : 0);
  let eta: number | null = null;
  if (f.next) {
    const missing = f.next.cost - f.balance;
    eta = missing <= 0 ? 0 : rate > 0 ? missing / rate : null;
  }
  const hoplitesPerSecond =
    f.key === 'military' && f.next?.kind === 'hoplites' && rate > 0 ? (rate / f.next.cost) * f.levy : 0;
  const desertIn = f.key === 'military' && rate < 0 ? Math.max(0, f.balance) / -rate : null;
  return { rate, eta, hoplitesPerSecond, desertIn };
}
