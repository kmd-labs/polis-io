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
  }, 30_000);
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

describe('long pursuits', () => {
  it('give up after three seconds even when the foe is far away', () => {
    const sim = game();
    const hunter = { id: 9101, owner: 0, x: 200, y: 340, chaseId: -1, chaseSince: 0, ignoreId: -1, ignoreUntil: 0, siege: -1 } as unknown as Army;
    const prey = { id: 9102, owner: 2, x: 300, y: 340, siege: -1 } as unknown as Army;
    let t = 0;
    while ((sim as any).pursue(hunter, prey, 0.1) && t < 30) {
      sim.time += 0.1;
      t += 0.1;
    }
    expect(t).toBeLessThan(RULES.chaseTime + 0.5);
  }, 30_000);

  it('still march to lift a siege, however long it takes', () => {
    const sim = game();
    const hunter = { id: 9201, owner: 0, x: 200, y: 340, chaseId: -1, chaseSince: 0, ignoreId: -1, ignoreUntil: 0, siege: -1 } as unknown as Army;
    const besieger = { id: 9202, owner: 2, x: 300, y: 340, siege: 0 } as unknown as Army;
    for (let i = 0; i < 100; i++) {
      expect((sim as any).pursue(hunter, besieger, 0.1)).toBe(true);
      sim.time += 0.1;
    }
  }, 30_000);
});

describe('colonies', () => {
  it('found one city at a time, once a generation (sooner with a bigger colonization share)', () => {
    const sim = game();
    const p = sim.poleis[0];
    p.budget = { military: 20, colonization: 20, agriculture: 20, trade: 20, culture: 20 };
    expect(sim.colonyWait(p)).toBe(RULES.colonyYears * RULES.secondsPerYear);
    p.budget = { military: 10, colonization: 50, agriculture: 15, trade: 15, culture: 10 };
    expect(sim.colonyWait(p)).toBe(RULES.colonyYearsMin * RULES.secondsPerYear);
    // Before the first generation has passed there is no colony to buy.
    expect(sim.nextPurchase(p, 'colonization')?.kind).not.toBe('colony');
    p.nextColonyAt = sim.time;
    const next = sim.nextPurchase(p, 'colonization');
    expect(next?.kind).toBe('colony');
    p.funds.colonization = next!.cost * 10;
    (sim as any).buy(p, 'colonization', next);
    expect(p.colonies).toBe(1);
    expect(p.nextColonyAt).toBeGreaterThan(sim.time);
    expect(sim.nextPurchase(p, 'colonization')?.kind).not.toBe('colony');
  }, 30_000);

  it('never scatter settlers across the sea: no "colony across the sea" in a century', () => {
    // Decades at the game's real pace take too long for a test; these rules are counted in years.
    const rules = RULES as unknown as Record<string, number>;
    const year = rules['secondsPerYear'];
    rules['secondsPerYear'] = 16;
    const sim = new Simulation(world, { seed: 2, autoplay: true });
    sim.choose(0);
    const founded = new Map<number, number[]>();
    for (let y = 0; y < 100; y++) {
      sim.step(RULES.secondsPerYear);
      sim.takeReports();
      sim.takeWarReports();
      sim.takePlans();
      for (const c of sim.takeConquests()) sim.resolveConquest(c, 'subjugate');
    }
    rules['secondsPerYear'] = year;
    expect(sim.events.some(e => e.kind === 'colony')).toBe(false);
    for (const p of sim.poleis) if (p.def.kind === 'site') founded.set(p.overlord, [...(founded.get(p.overlord) ?? []), p.idx]);
    // At most one colony per polis per sixteen years, whatever its budget.
    for (const [, list] of founded) expect(list.length).toBeLessThanOrEqual(Math.ceil(100 / RULES.colonyYearsMin));
  }, 300_000);
});

describe('enclaves', () => {
  /** A square block of cells owned by `owner` inside the given polis's land, around a cell away from its capital. */
  function plant(sim: Simulation, host: number, owner: number, side: number): number[] {
    const p = sim.poleis[host];
    for (const c of world.greekCells) {
      if (sim.owner[c] !== host) continue;
      const x = c % world.cols;
      const y = Math.floor(c / world.cols);
      if (Math.hypot(x - p.cx, y - p.cy) < 6) continue;
      const block: number[] = [];
      let ok = true;
      for (let dy = -1; dy <= side && ok; dy++) {
        for (let dx = -1; dx <= side && ok; dx++) {
          const n = (y + dy) * world.cols + (x + dx);
          if (sim.owner[n] !== host || n === p.capital) ok = false;
          else if (dx >= 0 && dy >= 0 && dx < side && dy < side) block.push(n);
        }
      }
      if (!ok) continue;
      for (const n of block) (sim as any).setOwner(n, owner, false);
      return block;
    }
    throw new Error('no room');
  }

  it('a patch under enclaveSize cells touching an enemy falls to it after two years', () => {
    const sim = game();
    const athens = byId(sim, 'athens');
    const thebes = byId(sim, 'thebes');
    sim.declareWar(athens.idx, thebes.idx);
    const block = plant(sim, athens.idx, thebes.idx, 3);
    (sim as any).tidyBorders();
    expect(block.every(c => sim.owner[c] === thebes.idx)).toBe(true);
    sim.time += RULES.enclaveYears * RULES.secondsPerYear - 1;
    (sim as any).tidyBorders();
    expect(block.every(c => sim.owner[c] === thebes.idx)).toBe(true);
    sim.time += 2;
    (sim as any).tidyBorders();
    expect(block.every(c => sim.owner[c] === athens.idx)).toBe(true);
  }, 30_000);

  it('a patch of enclaveSize cells or more stays put, and so does any patch in peacetime', () => {
    const sim = game();
    const athens = byId(sim, 'athens');
    const thebes = byId(sim, 'thebes');
    const big = plant(sim, athens.idx, thebes.idx, Math.ceil(Math.sqrt(RULES.enclaveSize)));
    sim.declareWar(athens.idx, thebes.idx);
    (sim as any).tidyBorders();
    sim.time += 3 * RULES.secondsPerYear;
    (sim as any).tidyBorders();
    expect(big.every(c => sim.owner[c] === thebes.idx)).toBe(true);
    sim.makePeace(athens.idx, thebes.idx);
    const small = plant(sim, athens.idx, thebes.idx, 2);
    (sim as any).tidyBorders();
    sim.time += 3 * RULES.secondsPerYear;
    (sim as any).tidyBorders();
    // Not an enclave in peacetime; a stray pocket wedged against another city reverts to the wild instead.
    expect(small.every(c => sim.owner[c] !== athens.idx)).toBe(true);
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
