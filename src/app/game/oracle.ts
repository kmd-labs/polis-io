/**
 * The oracle at Delphi as a game of chance. Once a year a city may send envoys with an offering — one,
 * three or six months of its income — and a question. The Pythia draws a lot from her urn (Delphi did
 * answer by lot, with beans): a blessing, a favourable answer, a riddle, or an ill omen. What the god
 * grants is paid into the fund of the question asked. Richer offerings, and treasuries the city has
 * raised at Delphi, tilt the draw.
 */
import type { BudgetKey } from './simulation';

export type OracleQuestion = 'war' | 'harvest' | 'sea' | 'colonies' | 'festival';
export const ORACLE_QUESTIONS: readonly OracleQuestion[] = ['war', 'harvest', 'sea', 'colonies', 'festival'];

/** The budget fund that receives what the god grants for each question. */
export const ORACLE_FUND: Record<OracleQuestion, BudgetKey> = {
  war: 'military',
  harvest: 'agriculture',
  sea: 'trade',
  colonies: 'colonization',
  festival: 'culture'
};

export type OracleOutcome = 'blessing' | 'favour' | 'riddle' | 'ill';
export const ORACLE_OUTCOMES: readonly OracleOutcome[] = ['blessing', 'favour', 'riddle', 'ill'];

/** Offerings: months of income. */
export const ORACLE_STAKES = [1, 3, 6] as const;

export const ORACLE_RULES = {
  /** The base odds of each lot. */
  odds: { blessing: 0.05, favour: 0.33, riddle: 0.34, ill: 0.28 } as Record<OracleOutcome, number>,
  /** A richer offering moves this much of the chance from an ill omen to a favourable answer. */
  stakeBonus: [0, 0.03, 0.06],
  /** Each treasury the city has raised at Delphi does the same (counted up to three). */
  treasuryBonus: 0.03,
  /** What the god grants, in multiples of the offering. */
  payout: { blessing: 5, favour: 1.7, riddle: 0.5, ill: 0 } as Record<OracleOutcome, number>,
  /** A blessing also brings power projection; an ill omen frightens the citizens. */
  blessingPrestige: 1,
  illMood: -6,
  /** Years between consultations. */
  cooldownYears: 1,
  /** A run of favourable answers: each one before raises a favourable payout by this much, and moves this
   * much of the chance from an ill omen to a blessing (counted up to streakMax). */
  streakPayout: 0.15,
  streakBlessing: 0.02,
  streakMax: 5
};

/** One answer of the Pythia. */
export interface OracleAnswer {
  question: OracleQuestion;
  level: number;
  outcome: OracleOutcome;
  stake: number;
  payout: number;
  /** Which of the outcome's prophecies she spoke. */
  verse: number;
  year: number;
  /** The run of favourable answers before this one, and after it. */
  streak: number;
  streakAfter: number;
}

/** The odds of each lot for an offering of the given level (0–2), with this many treasuries at Delphi. */
export function oracleOdds(level: number, treasuries: number, streak = 0): Record<OracleOutcome, number> {
  const shift = ORACLE_RULES.stakeBonus[level] + Math.min(3, treasuries) * ORACLE_RULES.treasuryBonus;
  const o = { ...ORACLE_RULES.odds };
  const moved = Math.min(o.ill - 0.05, shift);
  o.ill -= moved;
  o.favour += moved;
  // A run of favour: the god's hand opens wider (from the ill omens to the blessings).
  const run = Math.min(o.ill - 0.05, Math.min(ORACLE_RULES.streakMax, streak) * ORACLE_RULES.streakBlessing);
  o.ill -= run;
  o.blessing += run;
  return o;
}

/** Draws a lot from the urn for a roll in [0, 1). */
export function drawLot(odds: Record<OracleOutcome, number>, roll: number): OracleOutcome {
  let acc = 0;
  for (const outcome of ORACLE_OUTCOMES) {
    acc += odds[outcome];
    if (roll < acc) return outcome;
  }
  return 'ill';
}
