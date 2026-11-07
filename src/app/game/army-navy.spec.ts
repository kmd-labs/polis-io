import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS helper shared with the map build script
import { decodePng } from '../../../scripts/png.mjs';
import { Army, RULES, Simulation } from './simulation';
import { Terrain, World, decodeMapPixels } from './world';

/* eslint-disable @typescript-eslint/no-explicit-any -- the tests drive private steps of the simulation directly */

const png = decodePng(readFileSync('src/assets/map/hellas.png'));
const world = new World(decodeMapPixels(png.data, png.channels, png.width, png.height));

function game(seed = 4) {
  const sim = new Simulation(world, { seed });
  sim.choose(0);
  sim.step(0.1);
  return sim;
}

const byId = (sim: Simulation, id: string) => sim.poleis.find(p => p.def.id === id)!;

describe('levies and expeditions', () => {
  it('raise small batches and send small parties', () => {
    const sim = game();
    const p = sim.poleis[0];
    const share = p.budget.military / 100;
    expect(sim.trainBatch(p)).toBe(Math.max(RULES.trainMinimum, Math.round(sim.workers(p) * (0.01 + 0.04 * share))));
    expect(sim.settlers(p)).toBe(Math.floor(sim.workers(p) * 0.05));
  });
});

describe('war at sea', () => {
  it('a hostile fleet off a harbour blockades it: no dues, no port bonus, no trade', () => {
    const sim = game();
    const athens = byId(sim, 'athens');
    const corinth = byId(sim, 'corinth');
    athens.ports = 2;
    sim.declareWar(corinth.idx, athens.idx);
    corinth.surplus = 'fleet';
    (sim as any).buildWarship(corinth);
    expect(sim.fleetStrength(corinth.idx)).toBe(1);
    const h = sim.harbourOf(athens);
    const fleet = sim.fleets[0];
    fleet.x = (h % world.cols) + 0.5;
    fleet.y = Math.floor(h / world.cols) + 0.5;
    (sim as any).updateBlockades();
    expect(athens.blockadedBy).toBe(corinth.idx);
    const b = sim.incomeBreakdown(athens);
    expect(b.dues).toBe(0);
    expect(b.ports).toBe(0);
    const ships = sim.ships.length;
    (sim as any).launchShip(athens);
    expect(sim.ships.length).toBe(ships);
    // Peace lifts it.
    sim.makePeace(corinth.idx, athens.idx);
    (sim as any).updateBlockades();
    expect(athens.blockadedBy).toBe(-1);
    expect(sim.incomeBreakdown(athens).dues).toBeCloseTo(2 * RULES.portIncome);
  }, 30_000);

  it('hostile fleets that meet fight, and the loser is sunk', () => {
    const sim = game();
    const athens = byId(sim, 'athens');
    const corinth = byId(sim, 'corinth');
    sim.declareWar(corinth.idx, athens.idx);
    for (let i = 0; i < 5; i++) (sim as any).buildWarship(athens);
    (sim as any).buildWarship(corinth);
    const [a, c] = [sim.fleets.find(f => f.owner === athens.idx)!, sim.fleets.find(f => f.owner === corinth.idx)!];
    c.x = a.x + 1;
    c.y = a.y;
    (sim as any).navalBattles();
    expect([a.dead, c.dead].filter(Boolean).length).toBeGreaterThanOrEqual(1);
    expect(sim.seaFights.length).toBe(1);
  }, 30_000);

  it('builds galleys with the surplus of a full military chest', () => {
    const sim = game();
    const athens = byId(sim, 'athens');
    athens.surplus = 'fleet';
    athens.garrison = sim.armyTarget(athens) + 500; // army full: no levy to buy
    expect(sim.nextPurchase(athens, 'military')?.kind === 'warship' || sim.nextPurchase(athens, 'military')?.kind === 'improvement').toBe(true);
    athens.surplus = 'none';
    const next = sim.nextPurchase(athens, 'military');
    expect(next?.kind).not.toBe('warship');
  }, 30_000);
});

describe('mercenaries', () => {
  it('cost no citizens and leave when peace is made', () => {
    const sim = game();
    const athens = byId(sim, 'athens');
    const thebes = byId(sim, 'thebes');
    sim.declareWar(athens.idx, thebes.idx);
    const civilians = athens.civilians;
    const garrison = athens.garrison;
    (sim as any).hireMercenaries(athens);
    expect(athens.civilians).toBe(civilians);
    expect(sim.mercenaries(athens.idx)).toBe(sim.mercenaryBand(athens));
    sim.makePeace(athens.idx, thebes.idx);
    (sim as any).moveArmies(0.1);
    expect(sim.mercenaries(athens.idx)).toBe(0);
    expect(athens.garrison).toBeCloseTo(garrison);
  }, 30_000);
});

describe('pursuit', () => {
  it('gives up a chase after three seconds, then ignores that foe for a while', () => {
    const sim = game();
    const hunter = { id: 9001, owner: 0, x: 300, y: 340, strength: 500, chaseId: -1, chaseSince: 0, ignoreId: -1, ignoreUntil: 0, siege: -1, owner2: 0 } as unknown as Army;
    const prey = { id: 9002, owner: 2, x: 305, y: 340, strength: 50, siege: -1 } as unknown as Army;
    let t = 0;
    while ((sim as any).pursue(hunter, prey, 0.1)) {
      sim.time += 0.1;
      t += 0.1;
      prey.x += 0.3; // it keeps running
      if (t > 10) break;
    }
    expect(t).toBeGreaterThan(RULES.chaseTime - 0.2);
    expect(t).toBeLessThan(RULES.chaseTime + 0.5);
    expect((sim as any).ignoring(hunter, prey)).toBe(true);
    sim.time += RULES.chaseCooldown + 0.1;
    expect((sim as any).ignoring(hunter, prey)).toBe(false);
  }, 30_000);
});

describe('valleys', () => {
  it('armies march through lower ground than the straight line', () => {
    const sim = game();
    // Pairs of land points across hilly country; compare mean height along the march with the beeline.
    const land = world.greekCells.filter(c => world.terrain[c] !== Terrain.Sea);
    const rnd = (n: number) => land[Math.floor(((Math.sin(n * 12.9898) * 43758.5453) % 1 + 1) % 1 * land.length)];
    let marched = 0;
    let beeline = 0;
    let routes = 0;
    for (let k = 1; routes < 12 && k < 400; k++) {
      const a = rnd(k);
      const b = rnd(k + 1000);
      const ax = (a % world.cols) + 0.5;
      const ay = Math.floor(a / world.cols) + 0.5;
      const bx = (b % world.cols) + 0.5;
      const by = Math.floor(b / world.cols) + 0.5;
      const len = Math.hypot(bx - ax, by - ay);
      if (len < 20 || len > 60) continue;
      routes++;
      const army = { id: k, owner: 0, x: ax, y: ay } as unknown as Army;
      let steps = 0;
      let sumMarch = 0;
      while (!(sim as any).walk(army, bx, by, 0.25) && steps < 2000) {
        const c = world.cellAt(army.x, army.y);
        sumMarch += c >= 0 ? Math.max(0, world.elevation[c]) : 0;
        steps++;
      }
      marched += sumMarch / Math.max(1, steps);
      let sumLine = 0;
      for (let i = 0; i <= 50; i++) {
        const c = world.cellAt(ax + ((bx - ax) * i) / 50, ay + ((by - ay) * i) / 50);
        sumLine += c >= 0 ? Math.max(0, world.elevation[c]) : 0;
      }
      beeline += sumLine / 51;
    }
    console.info(`valleys: mean height on the march ${(marched / routes).toFixed(0)} m vs beeline ${(beeline / routes).toFixed(0)} m over ${routes} routes`);
    expect(marched).toBeLessThan(beeline * 0.95);
  }, 60_000);
});
