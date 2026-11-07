import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS helper shared with the map build script
import { decodePng } from '../../../scripts/png.mjs';
import { RULES, Simulation } from './simulation';
import { World, decodeMapPixels } from './world';

/* eslint-disable @typescript-eslint/no-explicit-any -- the tests drive private steps of the simulation directly */

const png = decodePng(readFileSync('src/assets/map/hellas.png'));
const world = new World(decodeMapPixels(png.data, png.channels, png.width, png.height));

function game(seed = 4) {
  const sim = new Simulation(world, { seed });
  sim.choose(0);
  sim.step(0.1);
  return sim;
}

describe('neutral merchant cities', () => {
  it('hold four small islands, each whole', () => {
    const sim = game();
    const traders = sim.poleis.filter(p => p.trader);
    expect(traders.map(p => p.def.id)).toEqual(['aegina', 'siphnos', 'thera', 'keos']);
    for (const p of traders) {
      expect(p.cells).toBeGreaterThan(10);
      expect(p.cells).toBeLessThanOrEqual(RULES.traderIsland);
      expect(sim.owner[p.capital]).toBe(p.idx);
      expect(sim.totalPopulation(p)).toBeGreaterThan(0);
      expect(sim.harbourOf(p)).toBeGreaterThanOrEqual(0);
    }
  }, 30_000);

  it('go to war with no one and are not raided', () => {
    const sim = game();
    const aegina = sim.poleis.find(p => p.def.id === 'aegina')!;
    sim.declareWar(sim.player, aegina.idx);
    sim.declareWar(aegina.idx, sim.player);
    expect(aegina.wars.size).toBe(0);
    expect(sim.poleis[sim.player].wars.has(aegina.idx)).toBe(false);
    const thracians = sim.poleis.find(p => p.def.id === 'thracians')!;
    expect((sim as any).hostile(thracians.idx, aegina.idx)).toBe(false);
    expect(sim.nearestNeighbours(sim.poleis[sim.player]).has(aegina.idx)).toBe(false);
  }, 30_000);

  it('spend on the harbour, never on colonies, and keep more merchantmen at sea', () => {
    const rules = RULES as unknown as Record<string, number>;
    const year = rules['secondsPerYear'];
    rules['secondsPerYear'] = 16;
    const sim = new Simulation(world, { seed: 5, autoplay: true });
    sim.choose(0);
    for (let i = 0; i < 6 * 16 && sim.status === 'playing'; i++) {
      sim.step(1);
      sim.takeReports();
      sim.takeWarReports();
      sim.takePlans();
      for (const c of sim.takeConquests()) sim.resolveConquest(c, 'subjugate');
    }
    rules['secondsPerYear'] = year;
    const traders = sim.poleis.filter(p => p.trader);
    for (const p of traders) {
      expect(p.budget.trade).toBeGreaterThan(p.budget.colonization);
      expect(p.colonies).toBe(0);
      expect(p.tradeEarned).toBeGreaterThan(0);
    }
    // Their ships bring silver to other harbours too.
    const visited = traders.flatMap(p => p.voyages.map((n, i) => (n ? i : -1)).filter(i => i >= 0));
    expect(visited.length).toBeGreaterThan(0);
  }, 120_000);
});
