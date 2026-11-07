import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS helper shared with the map build script
import { decodePng } from '../../../scripts/png.mjs';
import { forecastFund } from './economy';
import { BUDGET_KEYS, BudgetKey, PolisState, RULES, Simulation } from './simulation';
import { World, decodeMapPixels } from './world';

/**
 * Plays a seeded game and checks the fund forecasts against what really happens: for every
 * peaceful polis and fund saving for something 1–5 years away, the time until the fund can
 * actually afford it should land within ±20% of the forecast.
 */
describe('fund forecast accuracy', () => {
  const png = decodePng(readFileSync('src/assets/map/hellas.png'));
  const world = new World(decodeMapPixels(png.data, png.channels, png.width, png.height));

  it('replays the same game from the same seed', () => {
    const run = () => {
      const sim = new Simulation(world, { seed: 42 });
      sim.choose(2);
      sim.step(60);
      return Array.from(sim.owner).join(',') + sim.poleis.map(p => Math.round(sim.treasury(p))).join(',');
    };
    expect(run()).toBe(run());
  }, 60_000);

  it('predicts when funds can afford their purchases (seeded, peacetime)', () => {
    // Twists of fortune and Olympic delegations jolt the funds on purpose; the forecast is about the steady flow.
    const rules = RULES as unknown as Record<string, number>;
    const saved = { fortuneYears: rules['fortuneYears'], gamesMonth: rules['gamesMonth'] };
    rules['fortuneYears'] = 1e9;
    rules['gamesMonth'] = 99;
    const sim = new Simulation(world, { seed: 7 });
    sim.choose(0);

    const forecast = (p: PolisState, key: BudgetKey) => {
      const next = sim.nextPurchase(p, key);
      const busy = BUDGET_KEYS.filter(k => sim.nextPurchase(p, k) || (k === 'colonization' && p.expedition));
      const busyShare = busy.reduce((sum, k) => sum + p.budget[k], 0);
      return {
        next,
        fc: forecastFund({
          key,
          share: p.budget[key],
          busyShare,
          inflow: p.inflow,
          upkeep: p.upkeep,
          balance: p.funds[key],
          next,
          levy: sim.levySize(p)
        })
      };
    };

    const errors: number[] = [];
    // Warm the economy up, then take samples every few years.
    sim.step(8);
    for (let round = 0; round < 6; round++) {
      const t0 = sim.time;
      const watch = sim.poleis
        .filter(p => p.alive && !p.wars.size)
        .flatMap(p =>
          BUDGET_KEYS.map(key => ({ p, key, ...forecast(p, key) })).filter(
            w => w.next && w.next.kind !== 'hoplites' && w.fc.eta !== null && w.fc.eta >= 4 && w.fc.eta <= 20
          )
        )
        .map(w => ({ ...w, cost: w.next!.cost, start: w.p.funds[w.key], done: -1 }));
      // Five years of play; a fund "arrives" once its savings reach the price (or it has bought it).
      for (let tick = 0; tick < 200 && watch.some(w => w.done < 0); tick++) {
        sim.step(0.1);
        for (const w of watch) {
          if (w.done >= 0 || w.p.wars.size || !w.p.alive) continue;
          if (w.p.funds[w.key] >= w.cost || w.p.funds[w.key] < w.start - 1) w.done = sim.time - t0;
        }
      }
      for (const w of watch) if (w.done >= 0) errors.push(Math.abs(w.done - w.fc.eta!) / w.fc.eta!);
      sim.step(4);
    }

    errors.sort((a, b) => a - b);
    const within = errors.filter(e => e <= 0.2).length / errors.length;
    const median = errors[Math.floor(errors.length / 2)];
    console.info(`forecast samples ${errors.length}, within ±20%: ${(within * 100).toFixed(0)}%, median error ${(median * 100).toFixed(1)}%`);
    expect(errors.length).toBeGreaterThan(20);
    expect(median).toBeLessThanOrEqual(0.2);
    expect(within).toBeGreaterThanOrEqual(0.8);
    Object.assign(rules, saved);
  }, 120_000);
});
