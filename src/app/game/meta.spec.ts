import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS helper shared with the map build script
import { decodePng } from '../../../scripts/png.mjs';
import { AMBITIONS_ACTIVE, AMBITION_BY_ID } from './ambitions';
import { oracleOdds } from './oracle';
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

describe('ambitions', () => {
  it('sets the player three ambitions, rewards a fulfilled one and sets a new one', () => {
    const sim = game();
    const me = sim.poleis[sim.player];
    expect(sim.ambitions.length).toBe(AMBITIONS_ACTIVE);
    // Fulfil the first: lift its measure past the mark.
    const a = sim.ambitions[0];
    sim.ambitions[0] = { id: 'colony', base: me.colonies, target: me.colonies + 1 };
    me.colonies++;
    me.gross = 10;
    me.inflow = 0;
    const silver = me.drachmae;
    const prestige = me.prestige;
    (sim as any).checkAmbitions();
    expect(sim.ambitionsDone).toContain('colony');
    expect(me.drachmae).toBeGreaterThan(silver);
    expect(me.prestige).toBeCloseTo(prestige + AMBITION_BY_ID.get('colony')!.prestige);
    expect(sim.ambitions.length).toBe(AMBITIONS_ACTIVE);
    expect(sim.ambitions.some(x => x.id === 'colony')).toBe(false);
    expect(sim.takeAmbitionReports().map(r => r.id)).toEqual(['colony']);
    void a;
  }, 30_000);

  it('measures progress from where the city stood when the ambition was set', () => {
    const sim = game();
    const me = sim.poleis[sim.player];
    const amb = { id: 'battles' as const, base: me.battlesWon, target: me.battlesWon + 3 };
    expect(sim.ambitionProgress(me, amb)).toBe(0);
    me.battlesWon += 2;
    expect(sim.ambitionProgress(me, amb)).toBeCloseTo(2 / 3);
  }, 30_000);
});

describe('scenarios', () => {
  it('end in their year', () => {
    const sim = game();
    sim.endYear = 590;
    sim.time = (600 - 590) * RULES.secondsPerYear + 1;
    (sim as any).checkEnd();
    expect(sim.status).toBe('won');
  }, 30_000);
});

describe('the run of favour at Delphi', () => {
  it('moves the odds from ill omens to blessings, up to a limit', () => {
    const none = oracleOdds(1, 0, 0);
    const run = oracleOdds(1, 0, 3);
    const long = oracleOdds(1, 0, 50);
    expect(run.blessing).toBeGreaterThan(none.blessing);
    expect(run.ill).toBeLessThan(none.ill);
    expect(long.blessing).toBeCloseTo(oracleOdds(1, 0, 5).blessing);
  });
});
