import { GameHistory } from './history';
import { HEGEMONY_CATEGORIES, HEGEMONY_RULES, HegemonyCategory, HegemonyStanding, rankHegemony } from './hegemony';
import { Simulation } from './simulation';

/** Years a new Hegemon must hold the title before it is announced. */
export const HEGEMON_SETTLE_YEARS = 3;

/** What changed when a new year was recorded and ranked. */
export interface AnnalsYear {
  now: HegemonyStanding;
  before: HegemonyStanding | null;
  /** Categories whose leader changed this year. */
  newLeaders: { category: HegemonyCategory; lead: number; was: number }[];
  /** A Hegemon who has held the title long enough to be announced (once). */
  announce: { hegemon: number; previous: number } | null;
}

/**
 * The record of the age, framework-free: the yearly history of every polis and the hegemony
 * rankings drawn from it. Each new year it ranks Hellas and hands the result back to the
 * simulation (prestige, trade, the coalition against an overbearing Hegemon). Used by the game
 * service and by headless autoplay runs alike.
 */
export class Annals {
  readonly history = new GameHistory();
  /** The last eleven years of rankings (the oldest is the one ten years ago). */
  readonly standings: HegemonyStanding[] = [];
  private announced = -1;

  clear() {
    this.history.clear();
    this.standings.length = 0;
    this.announced = -1;
  }

  get current(): HegemonyStanding | null {
    return this.standings.at(-1) ?? null;
  }

  /** Rankings ten years ago (for trend arrows), once there are that many. */
  get tenYearsAgo(): HegemonyStanding | null {
    return this.standings.length > 10 ? this.standings[0] : null;
  }

  /** Records and ranks the current year if it has not been yet; returns null otherwise. */
  update(sim: Simulation): AnnalsYear | null {
    // Wait for the first tick: at time zero no income has been earned yet.
    if (sim.status === 'choosing' || sim.time <= 0 || this.history.years.at(-1) === sim.year) return null;
    this.history.record(sim);
    const before = this.current;
    const now = rankHegemony(this.history.recent(HEGEMONY_RULES.armsYears + 1), sim.year, before?.hegemon ?? -1);
    this.standings.push(now);
    if (this.standings.length > 11) this.standings.shift();
    sim.applyHegemony(now.scores, now.hegemon);

    const newLeaders = before
      ? HEGEMONY_CATEGORIES.flatMap(category => {
          const lead = now[category][0]?.idx ?? -1;
          const was = before[category][0]?.idx ?? -1;
          return lead >= 0 && was >= 0 && lead !== was ? [{ category, lead, was }] : [];
        })
      : [];

    // Close rivals can trade the title back and forth on thin margins: announce a new Hegemon
    // only once it has held the title for a few years running.
    let announce: AnnalsYear['announce'] = null;
    const settled = this.standings.slice(-HEGEMON_SETTLE_YEARS);
    if (
      now.hegemon >= 0 &&
      now.hegemon !== this.announced &&
      settled.length === HEGEMON_SETTLE_YEARS &&
      settled.every(s => s.hegemon === now.hegemon)
    ) {
      announce = { hegemon: now.hegemon, previous: this.announced };
      this.announced = now.hegemon;
    }
    return { now, before, newLeaders, announce };
  }
}
