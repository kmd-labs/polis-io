import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS helper shared with the map build script
import { decodePng } from '../../../scripts/png.mjs';
import { NEUTRAL, RULES, Simulation, WILD } from './simulation';
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

describe('peoples beyond the frontier', () => {
  it('sit on non-Greek land, own no Greek land and are never ranked among the cities', () => {
    const sim = game();
    const tribes = sim.poleis.filter(p => p.tribe);
    expect(tribes.map(t => t.def.id)).toEqual(['illyrians', 'paeonians', 'thracians']);
    for (const t of tribes) {
      expect(world.terrain[t.capital]).toBe(Terrain.Foreign);
      expect(t.cells).toBe(0);
    }
  }, 30_000);

  function warband(sim: Simulation) {
    const illyrians = sim.poleis.find(p => p.def.id === 'illyrians')!;
    illyrians.nextRaid = sim.time;
    (sim as any).tribeTurn(illyrians, 0.1);
    const band = sim.armies.find(a => a.owner === illyrians.idx && !a.dead)!;
    expect(band).toBeDefined();
    return band;
  }

  it('send warbands of 400 to 2000 men that carry off people and silver but lay no land waste', () => {
    const sim = game();
    const band = warband(sim);
    expect(band.strength).toBeGreaterThanOrEqual(RULES.raidMin);
    expect(band.strength).toBeLessThanOrEqual(RULES.raidMax);
    const victim = sim.poleis[band.raid];
    expect(victim.tribe).toBe(false);
    const treasury = sim.treasury(victim);
    const people = victim.civilians;
    const cells = victim.cells;
    const cell = (sim as any).raidTarget(band, victim);
    (sim as any).plunderCell(band, victim, cell);
    expect(sim.treasury(victim)).toBeLessThan(treasury);
    expect(victim.civilians).toBeLessThan(people);
    expect(victim.cells).toBe(cells);
    expect(sim.owner[cell]).toBe(victim.idx);
  }, 30_000);

  it('let a city stand and fight in the name of Hellas: renown, regard and defenders', () => {
    const sim = game();
    const band = warband(sim);
    const victim = sim.poleis[band.raid];
    const prestige = victim.prestige;
    band.asked = victim.idx;
    band.x = victim.cx + 3;
    band.y = victim.cy;
    victim.garrison = Math.max(victim.garrison, 2000);
    // No answer yet: no defenders.
    (sim as any).defendAgainstRaids();
    expect(sim.armies.some(a => !a.dead && a.defend === band.id)).toBe(false);
    sim.answerRaid(band.id, 'fight');
    expect(victim.prestige).toBeCloseTo(prestige + RULES.raidStandPrestige);
    (sim as any).defendAgainstRaids();
    expect(sim.armies.some(a => !a.dead && a.defend === band.id && a.owner === victim.idx)).toBe(true);
  }, 30_000);

  it('let a city pay six months of its income for the warband to plunder someone else', () => {
    const sim = game();
    const band = warband(sim);
    const victim = sim.poleis[band.raid];
    band.asked = victim.idx;
    const cost = sim.bribeCost(victim);
    expect(cost).toBeGreaterThan(0);
    victim.drachmae += cost * 2;
    const treasury = sim.treasury(victim);
    sim.answerRaid(band.id, 'bribe');
    expect(sim.treasury(victim)).toBeCloseTo(treasury - cost, 0);
    expect(band.raid === victim.idx && !band.homeward).toBe(false);
  }, 30_000);

  it('ignore the Olympic truce', () => {
    const sim = game();
    sim.truce = true;
    const thracians = sim.poleis.find(p => p.def.id === 'thracians')!;
    expect((sim as any).hostile(thracians.idx, 0)).toBe(true);
    expect((sim as any).hostile(0, 1)).toBe(false);
  }, 30_000);
});

describe('neutral harbours', () => {
  it('sit on small islands nobody can settle, and pay merchantmen a premium', () => {
    const sim = game();
    expect(sim.neutralPorts.length).toBeGreaterThanOrEqual(10);
    for (const port of sim.neutralPorts) {
      expect(sim.owner[port.cell]).toBe(NEUTRAL);
      expect(world.terrain[port.harbour]).toBe(Terrain.Sea);
    }
    const athens = sim.poleis[0];
    const before = athens.drachmae;
    (sim as any).arrive({ id: 1, owner: 0, dest: -1, port: 0, path: [], seg: 0, along: 0, x: 0, y: 0, angle: 0, done: false });
    expect(athens.drachmae - before).toBeCloseTo(sim.tradeValue(athens) * RULES.neutralPortBonus);
  }, 30_000);

  it('adds the small islands the coastline data misses', () => {
    // Delos lies a few cells off Mykonos and is missing from the raster: now it is land.
    const p = world.project(25.27, 37.4);
    expect(world.terrain[world.cellAt(p.x, p.y)]).toBe(Terrain.Greek);
  });
});

describe('the mountains', () => {
  it('cannot be taken above 1500 metres', () => {
    const sim = game();
    const athens = sim.poleis[0];
    const thebes = sim.poleis.find(p => p.def.id === 'thebes')!;
    sim.declareWar(athens.idx, thebes.idx);
    const high = world.greekCells.find(c => world.elevation[c] > RULES.maxElevation && sim.owner[c] === WILD);
    expect(high).toBeDefined();
    (sim as any).setOwner(high, thebes.idx, false);
    const army = { owner: athens.idx } as any;
    (sim as any).captureAround(army, (high! % world.cols) + 0.5, Math.floor(high! / world.cols) + 0.5);
    expect(sim.owner[high!]).toBe(thebes.idx);
  }, 30_000);
});

describe('great works', () => {
  it('take the silver no fund can spend and complete with their effects', () => {
    const sim = game();
    const p = sim.poleis[0];
    sim.setGreatWork(p.idx, 'temple');
    const culture = p.culture;
    p.greatFund = sim.greatWorkCost(p, 'temple');
    (sim as any).advanceGreatWork(p);
    expect(p.greatBuilt.temple).toBe(1);
    expect(p.culture).toBe(Math.min(5, culture + 1));
    // A one-off work cannot be chosen again; a treasury at Delphi can, dearer each time.
    expect(p.greatWork).toBeNull();
    expect(sim.greatWorkOpen(p, 'temple')).toBe(false);
    const first = sim.greatWorkCost(p, 'delphi');
    sim.setGreatWork(p.idx, 'delphi');
    p.greatFund = first;
    (sim as any).advanceGreatWork(p);
    expect(sim.greatWorkCost(p, 'delphi')).toBeGreaterThan(first);
    expect(p.greatWork).toBe('delphi');
  }, 30_000);
});

describe('buying out of savings', () => {
  it('hires a big band of mercenaries at once, dearly, and only at war', () => {
    const sim = game();
    const me = sim.poleis[sim.player];
    expect(sim.mercenaryOffer(me)).toBeNull();
    const thebes = sim.poleis.find(p => p.def.id === 'thebes')!;
    sim.declareWar(me.idx, thebes.idx);
    const offer = sim.mercenaryOffer(me)!;
    expect(offer.men).toBe(sim.mercenaryBand(me) * RULES.buyMercenaryLevies);
    expect(offer.cost).toBeGreaterThanOrEqual(offer.men * RULES.mercenaryCost * 2);
    me.drachmae = 0;
    for (const k of Object.keys(me.funds) as (keyof typeof me.funds)[]) me.funds[k] = 0;
    expect(sim.buyMercenaries(me.idx)).toBe(false);
    me.drachmae = offer.cost + 100;
    const before = sim.mercenaries(me.idx);
    expect(sim.buyMercenaries(me.idx)).toBe(true);
    expect(sim.mercenaries(me.idx) - before).toBe(offer.men);
    expect(sim.treasury(me)).toBeCloseTo(100, 0);
  }, 30_000);

  it('sends an extra expedition at four times the price, before the city is crowded', () => {
    const sim = game();
    const me = sim.poleis[sim.player];
    me.expedition = null;
    const offer = sim.expeditionOffer(me)!;
    expect(offer).not.toBeNull();
    const usual = RULES.expeditionBase + offer.settlers * RULES.expeditionPerSettler;
    expect(offer.cost).toBeGreaterThanOrEqual(Math.round(usual * RULES.buyExpeditionFactor));
    me.drachmae += offer.cost;
    const treasury = sim.treasury(me);
    expect(sim.buyExpedition(me.idx)).toBe(true);
    expect(me.expedition).not.toBeNull();
    expect(sim.treasury(me)).toBeCloseTo(treasury - offer.cost, 0);
    // Only one expedition at a time.
    expect(sim.expeditionOffer(me)).toBeNull();
  }, 30_000);
});
