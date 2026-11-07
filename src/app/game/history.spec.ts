import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS helper shared with the map build script
import { decodePng } from '../../../scripts/png.mjs';
import { GameHistory, budgetChanged } from './history';
import { RULES, Simulation } from './simulation';
import { World, decodeMapPixels } from './world';

describe('budgetChanged', () => {
  const base = { military: 20, colonization: 20, agriculture: 20, trade: 20, culture: 20 };
  it('ignores small nudges and reports a 5-point move', () => {
    expect(budgetChanged(base, { ...base, military: 24, trade: 16 })).toBe(false);
    expect(budgetChanged(base, { ...base, military: 25, trade: 15 })).toBe(true);
  });
});

describe('GameHistory', () => {
  const png = decodePng(readFileSync('src/assets/map/hellas.png'));
  const world = new World(decodeMapPixels(png.data, png.channels, png.width, png.height));

  it('keeps one snapshot a year for every polis, and stays small over three centuries', () => {
    const sim = new Simulation(world, { seed: 3, autoplay: true });
    sim.choose(0);
    const history = new GameHistory();
    for (let year = 0; year < 300; year++) {
      history.record(sim);
      history.record(sim); // twice in the same year is ignored
      // Play a little of every year and skip the rest: the test is about what the history keeps.
      sim.step(1);
      sim.time += RULES.secondsPerYear - 1;
      sim.takeReports();
      sim.takeWarReports();
      sim.takePlans();
      for (const c of sim.takeConquests()) sim.resolveConquest(c, 'subjugate');
    }
    // One row per year (the clock stops if the game ends early).
    expect(new Set(history.years).size).toBe(history.length);
    // A full three centuries, unless the game itself ended first.
    expect(history.length).toBeGreaterThan(sim.status === 'playing' ? 250 : 50);
    const now = history.snapshotsAt(history.years.at(-1)!);
    expect(now.length).toBe(sim.poleis.length);
    expect(history.series(0, 'population').length).toBeGreaterThan(0);
    expect(history.bytes).toBeLessThan(5 * 1024 * 1024);
    console.info(`history: ${history.length} years (status ${sim.status}), ${sim.poleis.length} poleis, ${(history.bytes / 1024).toFixed(0)} KB`);
  }, 400_000);
});
