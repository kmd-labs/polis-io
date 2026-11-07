import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS helper shared with the map build script
import { decodePng } from '../../../scripts/png.mjs';
import { HEGEMONY_RULES, rankHegemony } from './hegemony';
import { GameHistory, Snapshot } from './history';
import { RULES, seededRandom, Simulation } from './simulation';
import { World, decodeMapPixels } from './world';

/**
 * Plays a seeded game, ranks every year as the game does, and checks three randomly chosen years
 * against a plain hand recount from the raw snapshots.
 */
describe('hegemony rankings in a real game', () => {
  it('agree with a hand recount from the snapshots in three random years', () => {
    const png = decodePng(readFileSync('src/assets/map/hellas.png'));
    const world = new World(decodeMapPixels(png.data, png.channels, png.width, png.height));
    // Decades at the game's real pace take too long for a test; these rules are counted in years.
    const rules = RULES as unknown as Record<string, number>;
    const year = rules['secondsPerYear'];
    rules['secondsPerYear'] = 16;
    const sim = new Simulation(world, { seed: 11, autoplay: true });
    sim.choose(0);
    const history = new GameHistory();
    const standings = new Map<number, ReturnType<typeof rankHegemony>>();
    for (let y = 0; y < 80; y++) {
      history.record(sim);
      standings.set(sim.year, rankHegemony(history.recent(HEGEMONY_RULES.armsYears + 1), sim.year));
      sim.step(RULES.secondsPerYear);
      sim.takeReports();
      sim.takeWarReports();
      sim.takePlans();
      for (const c of sim.takeConquests()) sim.resolveConquest(c, 'subjugate');
    }

    rules['secondsPerYear'] = year;
    const years = history.years;
    // The game may end early (a city can fall); pick from the years that were played, past the 25-year arms window.
    expect(years.length).toBeGreaterThan(28);
    const pick = seededRandom(5);
    const chosen = [0, 1, 2].map(() => years[26 + Math.floor(pick() * (years.length - 26))]);
    for (const year of chosen) {
      const at = years.indexOf(year);
      const rows: Snapshot[][] = years.slice(0, at + 1).map(y => history.snapshotsAt(y));
      const now = rows[rows.length - 1].filter(s => s.alive);
      const pop = (idx: number) => now.find(s => s.idx === idx)!.population;
      const top3 = (value: (s: Snapshot) => number) =>
        now
          .map(s => ({ idx: s.idx, v: value(s) }))
          .sort((a, b) => b.v - a.v || pop(b.idx) - pop(a.idx) || a.idx - b.idx)
          .slice(0, 3)
          .map(r => r.idx);

      // Finance: mean monthly income over the last ten rows in which the polis was alive.
      const finance = (s: Snapshot) => {
        const last = rows.slice(-10).map(r => r[s.idx]).filter(x => x?.alive);
        let sum = 0;
        for (const x of last) sum += x.incomePerMonth;
        return sum / last.length;
      };
      // Arms: points gained since the row 25 years back.
      const arms = (s: Snapshot) => {
        const base = rows.length > 25 ? rows[rows.length - 26][s.idx] : undefined;
        const pts = (x: Snapshot | undefined) => (x ? x.battlesWon + 5 * x.capitalsTaken + 3 * x.warsWon : 0);
        return pts(s) - pts(base);
      };

      const s = standings.get(year)!;
      expect(s.finance.slice(0, 3).map(r => r.idx)).toEqual(top3(finance));
      expect(s.population.slice(0, 3).map(r => r.idx)).toEqual(top3(x => x.population));
      expect(s.arms.slice(0, 3).map(r => r.idx)).toEqual(top3(arms));
    }
  }, 120_000);
});
