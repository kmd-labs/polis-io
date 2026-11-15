import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS helper shared with the map build script
import { decodePng } from '../../../scripts/png.mjs';
import { RULES, Simulation } from './simulation';
import { ORACLE_FUND, ORACLE_OUTCOMES, ORACLE_RULES, drawLot, oracleOdds } from './oracle';
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

describe('the wider map', () => {
  it('holds the cities of Magna Graecia and Ionia on playable land', () => {
    const sim = game();
    for (const id of ['syracuse', 'taras', 'sybaris', 'kroton', 'rhegion', 'miletus', 'ephesus', 'phocaea', 'halicarnassus', 'kyzikos', 'megara', 'sikyon', 'eretria', 'tegea']) {
      const p = byId(sim, id);
      expect(p, id).toBeDefined();
      expect(p.cells, id).toBeGreaterThan(0);
      expect(sim.owner[p.capital], id).toBe(p.idx);
    }
  }, 30_000);

  it('turns the Lydian kingdom Persian when Sardis falls in 546 BC', () => {
    const sim = game();
    const lydia = byId(sim, 'lydians');
    expect(lydia.tribe).toBe(true);
    sim.time = (600 - 546) * RULES.secondsPerYear + 1;
    (sim as any).worldNotes();
    expect(lydia.def.id).toBe('persians');
  }, 30_000);
});

describe('sway over the neutral cities', () => {
  it('makes a neutral city pay tribute to a mighty neighbour', () => {
    const sim = game();
    const aegina = byId(sim, 'aegina');
    const athens = sim.poleis[0];
    for (const p of sim.poleis) if (!p.trader && !p.tribe) p.garrison = 50;
    athens.garrison = 20_000;
    athens.prestige = 0;
    for (let i = 0; i < 40; i++) (sim as any).updateSway(RULES.secondsPerYear / 8);
    expect(aegina.patron).toBe(athens.idx);
    expect(aegina.patronKind).toBe('tribute');
    // Its tribute flows to Athens.
    const silver = athens.drachmae;
    (sim as any).paySway(aegina, 10, 1);
    expect(athens.drachmae).toBeCloseTo(silver + 10 * RULES.swayTribute);
  }, 30_000);

  it('makes a distant city of great renown its patron by fascination', () => {
    const sim = game();
    const tenedos = byId(sim, 'tenedos');
    const syracuse = byId(sim, 'syracuse');
    for (const p of sim.poleis) {
      if (p.trader || p.tribe) continue;
      p.garrison = 50;
      p.prestige = 0;
      p.culture = 1;
    }
    syracuse.prestige = 30;
    syracuse.culture = 5;
    for (let i = 0; i < 40; i++) (sim as any).updateSway(RULES.secondsPerYear / 8);
    expect(tenedos.patron).toBe(syracuse.idx);
    expect(tenedos.patronKind).toBe('awe');
  }, 30_000);
});

describe('the oracle at Delphi', () => {
  it('draws lots whose odds sum to one, tilted by richer offerings and treasuries', () => {
    for (const level of [0, 1, 2]) {
      for (const t of [0, 3]) {
        const odds = oracleOdds(level, t);
        expect(ORACLE_OUTCOMES.reduce((s, o) => s + odds[o], 0)).toBeCloseTo(1);
      }
    }
    expect(oracleOdds(2, 3).favour).toBeGreaterThan(oracleOdds(0, 0).favour);
    expect(oracleOdds(2, 3).ill).toBeLessThan(oracleOdds(0, 0).ill);
    expect(drawLot(oracleOdds(0, 0), 0)).toBe('blessing');
    expect(drawLot(oracleOdds(0, 0), 0.999)).toBe('ill');
  });

  it('takes the offering, pays what the god grants into the fund of the question, once a year', () => {
    const sim = game();
    const me = sim.poleis[sim.player];
    me.gross = 10;
    me.inflow = 0;
    me.drachmae += 10_000;
    const stake = sim.oracleStake(me, 1);
    const treasury = sim.treasury(me);
    const answer = sim.consultOracle(me.idx, 'sea', 1)!;
    expect(answer.stake).toBe(stake);
    expect(answer.payout).toBe(Math.round(stake * ORACLE_RULES.payout[answer.outcome]));
    expect(sim.treasury(me)).toBeCloseTo(treasury - stake + answer.payout, 0);
    expect(sim.consultOracle(me.idx, 'sea', 1)).toBeNull();
    sim.time += RULES.secondsPerYear + 1;
    expect(sim.oracleReady(me)).toBe(true);
  }, 30_000);
});
