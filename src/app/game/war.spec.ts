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

const byId = (sim: Simulation, id: string) => sim.poleis.find(p => p.def.id === id)!;
const month = () => RULES.secondsPerYear / 12;

describe('war as a front', () => {
  it('opens a front with no armies on the map, and no city fights more than three wars', () => {
    const sim = game();
    const athens = sim.poleis[0];
    const thebes = byId(sim, 'thebes');
    sim.declareWar(athens.idx, thebes.idx);
    expect(sim.front(athens.idx, thebes.idx)).toBeDefined();
    sim.step(5);
    expect(sim.armies.filter(a => a.raid < 0 && a.defend < 0).length).toBe(0);
    for (const id of ['corinth', 'argos', 'megara', 'chalkis', 'sparta']) sim.declareWar(athens.idx, byId(sim, id)?.idx ?? -1);
    expect(athens.wars.size).toBeLessThanOrEqual(RULES.maxWars);
  }, 30_000);

  it('freezes every front during the Olympic truce', () => {
    const sim = game();
    const athens = sim.poleis[0];
    const thebes = byId(sim, 'thebes');
    sim.declareWar(athens.idx, thebes.idx);
    const f = sim.front(athens.idx, thebes.idx)!;
    sim.truce = true;
    const cells = [athens.cells, thebes.cells];
    for (let i = 0; i < 30; i++) {
      f.nextMonth = sim.time;
      (sim as any).campaigns();
    }
    expect(f.score).toBe(0);
    expect([athens.cells, thebes.cells]).toEqual(cells);
  }, 30_000);

  it('lets the player change posture once a month', () => {
    const sim = game();
    const thebes = byId(sim, 'thebes');
    sim.declareWar(sim.player, thebes.idx);
    expect(sim.setPosture(sim.player, thebes.idx, 2)).toBe(true);
    expect(sim.posture(sim.player, thebes.idx)).toBe(2);
    expect(sim.setPosture(sim.player, thebes.idx, -2)).toBe(false);
    sim.time += month();
    expect(sim.setPosture(sim.player, thebes.idx, -2)).toBe(true);
    expect(sim.posture(sim.player, thebes.idx)).toBe(-2);
  }, 30_000);

  it('moves the border by a strip of land around the fighting, never the capital', () => {
    const sim = game();
    const athens = sim.poleis[0];
    const thebes = byId(sim, 'thebes');
    sim.declareWar(athens.idx, thebes.idx);
    const at = (sim as any).frontLine(thebes.idx, athens.idx);
    expect(at).toBeGreaterThanOrEqual(0);
    const before = thebes.cells;
    const taken = (sim as any).cedeLand(thebes, athens, 40, at);
    expect(taken).toBe(40);
    expect(thebes.cells).toBe(before - 40);
    expect(sim.owner[at]).toBe(athens.idx);
    expect(sim.owner[thebes.capital]).toBe(thebes.idx);
  }, 30_000);

  it('brings battles, raids and moving borders over a few campaigning seasons', () => {
    const sim = game();
    const athens = sim.poleis[0];
    const thebes = byId(sim, 'thebes');
    sim.declareWar(thebes.idx, athens.idx);
    sim.setPosture(sim.player, thebes.idx, 2);
    const f = sim.front(athens.idx, thebes.idx)!;
    const kinds = new Set<string>();
    for (let i = 0; i < 120 && sim.front(athens.idx, thebes.idx); i++) {
      sim.time = Math.ceil(sim.time / RULES.secondsPerYear) * RULES.secondsPerYear + 5 * month() + 0.01;
      f.nextMonth = sim.time;
      sim.truce = false;
      (sim as any).campaign(f);
      for (const r of sim.takeCampaignReports()) kinds.add(r.kind);
    }
    expect(kinds.has('battle') || kinds.has('ravage') || kinds.has('fort')).toBe(true);
    expect(f.score).not.toBe(0);
  }, 60_000);
});

describe('making peace', () => {
  it('lets a city sue for peace when war is declared, for a year of its income', () => {
    const sim = game();
    const me = sim.poleis[sim.player];
    const thebes = byId(sim, 'thebes');
    sim.declareWar(thebes.idx, me.idx);
    me.gross = 10;
    me.inflow = 0;
    me.drachmae += 10_000;
    const cost = sim.buyPeaceCost(me);
    expect(cost).toBe(Math.round(10 * RULES.secondsPerYear));
    const treasury = sim.treasury(me);
    const theirs = thebes.drachmae;
    expect(sim.buyPeace(me.idx, thebes.idx)).toBe(true);
    expect(me.wars.has(thebes.idx)).toBe(false);
    expect(sim.treasury(me)).toBeCloseTo(treasury - cost, 0);
    expect(thebes.drachmae).toBeCloseTo(theirs + cost, 0);
    // The treaty holds: no new war for years.
    sim.declareWar(thebes.idx, me.idx);
    expect(me.wars.has(thebes.idx)).toBe(false);
  }, 30_000);

  it('weighs terms by the balance of the war: the side ahead wants more, a long war softens it', () => {
    const sim = game();
    const me = sim.poleis[sim.player];
    const thebes = byId(sim, 'thebes');
    sim.declareWar(thebes.idx, me.idx);
    const f = sim.front(me.idx, thebes.idx)!;
    sim.time += RULES.secondsPerYear;
    f.score = f.a === thebes.idx ? 80 : -80;
    expect(sim.peaceVerdict(thebes.idx, me.idx, []).accept).toBe(false);
    const demand = sim.peaceDemand(thebes.idx, me.idx);
    expect(demand.length).toBeGreaterThan(0);
    expect(demand.every(i => i.from === me.idx)).toBe(true);
    expect(sim.peaceVerdict(thebes.idx, me.idx, demand).accept).toBe(true);
    const need = sim.peaceNeed(thebes.idx, me.idx);
    f.start -= 6 * RULES.secondsPerYear;
    expect(sim.peaceNeed(thebes.idx, me.idx)).toBeLessThan(need);
    // Losing badly, the enemy gives terms of its own.
    f.score = -f.score;
    const offer = sim.peaceDemand(thebes.idx, me.idx);
    expect(offer.every(i => i.from === thebes.idx)).toBe(true);
  }, 30_000);

  it('carries out the terms: gold and land change hands, a client serves its new master', () => {
    const sim = game();
    const athens = sim.poleis[0];
    const thebes = byId(sim, 'thebes');
    sim.declareWar(athens.idx, thebes.idx);
    thebes.drachmae += 50_000;
    thebes.gross = 20;
    const gold = sim.peaceAmount({ kind: 'gold', from: thebes.idx, level: 2 }, athens.idx);
    const land = sim.peaceAmount({ kind: 'land', from: thebes.idx, level: 1 }, athens.idx);
    expect(land).toBeGreaterThan(0);
    const cells = thebes.cells;
    const silver = athens.drachmae;
    sim.concludePeace(athens.idx, thebes.idx, [
      { kind: 'gold', from: thebes.idx, level: 2 },
      { kind: 'land', from: thebes.idx, level: 1 },
      { kind: 'client', from: thebes.idx, level: 1 }
    ]);
    expect(athens.wars.has(thebes.idx)).toBe(false);
    expect(athens.drachmae).toBeCloseTo(silver + gold, 0);
    expect(thebes.cells).toBeLessThanOrEqual(cells - land + 1);
    expect(thebes.overlord).toBe(athens.idx);
    expect(thebes.client).toBe(true);
  }, 30_000);

  it('makes a long war weigh on the citizens', () => {
    const sim = game();
    const athens = sim.poleis[0];
    const thebes = byId(sim, 'thebes');
    sim.declareWar(athens.idx, thebes.idx);
    const f = sim.front(athens.idx, thebes.idx)!;
    f.start = sim.time - 5 * RULES.secondsPerYear;
    athens.satisfaction = 70;
    sim.truce = false;
    sim.time = Math.floor(sim.time / RULES.secondsPerYear) * RULES.secondsPerYear + 0.5 * month();
    f.nextMonth = sim.time;
    (sim as any).rand = () => 0.99;
    (sim as any).campaigns();
    expect(athens.satisfaction).toBeLessThan(70);
  }, 30_000);

  it('ends the wars of the AI cities at the table, sooner or later', () => {
    const rules = RULES as unknown as Record<string, number>;
    const year = rules['secondsPerYear'];
    rules['secondsPerYear'] = 16;
    const sim = new Simulation(world, { seed: 3, autoplay: true });
    sim.choose(0);
    let treaties = 0;
    let seen = 0;
    for (let s = 0; s < 30 * 16 && sim.status === 'playing'; s++) {
      sim.step(1);
      for (const c of sim.takeConquests()) sim.resolveConquest(c, 'subjugate');
      sim.takeReports();
      sim.takeWarReports();
      sim.takePlans();
      for (const e of sim.events) if (e.id > seen && e.kind === 'treaty') treaties++;
      seen = sim.events.at(-1)?.id ?? seen;
      for (const p of sim.poleis) expect(p.wars.size).toBeLessThanOrEqual(RULES.maxWars);
    }
    rules['secondsPerYear'] = year;
    expect(treaties).toBeGreaterThan(2);
  }, 300_000);
});

describe('contentment at the peace table', () => {
  it('weakens a city whose citizens are discontented', () => {
    const sim = game();
    const me = sim.poleis[sim.player];
    const thebes = byId(sim, 'thebes');
    sim.declareWar(thebes.idx, me.idx);
    sim.time += RULES.secondsPerYear;
    me.satisfaction = 60;
    thebes.satisfaction = 60;
    const calm = sim.peaceNeed(thebes.idx, me.idx);
    expect(sim.peaceBalance(me.idx, thebes.idx)).toBeCloseTo(sim.warScore(me.idx, thebes.idx));
    thebes.satisfaction = 20;
    expect(sim.peaceBalance(me.idx, thebes.idx)).toBeGreaterThan(sim.warScore(me.idx, thebes.idx));
    // Unrest in Thebes: it asks for less (or offers more) to end the war.
    expect(sim.peaceNeed(thebes.idx, me.idx)).toBeLessThan(calm);
  }, 30_000);
});

describe('settled land', () => {
  it('has no holes: a small patch of wilderness enclosed by one city is taken in', () => {
    const sim = game();
    const athens = sim.poleis[0];
    const w = world;
    // Cut a small hole well inside Athens' land.
    const inner = w.greekCells.find(c => {
      if (sim.owner[c] !== athens.idx || c === athens.capital) return false;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (sim.owner[c + dy * w.cols + dx] !== athens.idx) return false;
      return true;
    })!;
    const hole = [inner, inner + 1, inner + w.cols, inner + w.cols + 1];
    for (const c of hole) (sim as any).release(c);
    expect(hole.every(c => sim.owner[c] === -1)).toBe(true);
    (sim as any).fillHoles();
    expect(hole.every(c => sim.owner[c] === athens.idx)).toBe(true);
  }, 30_000);
});
