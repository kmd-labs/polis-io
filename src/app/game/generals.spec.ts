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

describe('generals', () => {
  it('come with one star 60% of the time, two 35%, three 5%', () => {
    const sim = game();
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 20000; i++) counts[(sim as any).rollGeneral()]++;
    expect(counts[1] / 20000).toBeCloseTo(0.6, 1);
    expect(counts[2] / 20000).toBeCloseTo(0.35, 1);
    expect(counts[3] / 20000).toBeCloseTo(0.05, 1);
  }, 30_000);

  it('add at most 10% fighting power', () => {
    const sim = game();
    expect(sim.generalBonus({ stars: 1 } as any)).toBe(1);
    expect(sim.generalBonus({ stars: 3 } as any)).toBeCloseTo(1.1);
  }, 30_000);

  it('take in armies under lesser generals of the same city nearby', () => {
    const sim = game();
    const athens = sim.poleis[0];
    const thebes = sim.poleis.find(p => p.def.id === 'thebes')!;
    sim.declareWar(athens.idx, thebes.idx);
    athens.garrison = 5000;
    (sim as any).spawnArmy(athens);
    (sim as any).spawnArmy(athens);
    const [a, b] = sim.armies.filter(x => x.owner === athens.idx && !x.dead);
    a.stars = 1;
    b.stars = 3;
    b.x = a.x + 1;
    b.y = a.y;
    const total = a.strength + b.strength;
    (sim as any).gatherUnderGenerals();
    expect(a.dead).toBe(true);
    expect(b.strength).toBe(total);
    // A lesser general further off marches towards the better one.
    expect((sim as any).betterGeneral({ ...a, dead: false, x: b.x + 10, y: b.y })).toBe(b);
  }, 30_000);
});

describe('wars between neighbours', () => {
  it('are only declared by a city on one of its three nearest neighbours (by border or by capital)', () => {
    // Decades at the game's real pace take too long for a test; these rules are counted in years.
    const rules = RULES as unknown as Record<string, number>;
    const year = rules['secondsPerYear'];
    rules['secondsPerYear'] = 16;
    const sim = new Simulation(world, { seed: 3, autoplay: true });
    sim.choose(0);
    const far: string[] = [];
    let declared = 0;
    const declare = sim.declareWar.bind(sim);
    sim.declareWar = (a: number, b: number) => {
      const before = sim.poleis[a].wars.has(b);
      const near = sim.nearestNeighbours(sim.poleis[a]);
      declare(a, b);
      if (!before && sim.poleis[a].wars.has(b) && sim.poleis[a].wars.size === 1) {
        declared++;
        if (!near.has(b)) far.push(`${sim.poleis[a].def.id}→${sim.poleis[b].def.id}`);
      }
    };
    for (let y = 0; y < 40 && sim.status === 'playing'; y++) {
      sim.step(RULES.secondsPerYear);
      sim.takeReports();
      sim.takeWarReports();
      sim.takePlans();
      for (const c of sim.takeConquests()) sim.resolveConquest(c, 'subjugate');
    }
    rules['secondsPerYear'] = year;
    expect(declared).toBeGreaterThan(0);
    expect(far).toEqual([]);
  }, 300_000);
});
