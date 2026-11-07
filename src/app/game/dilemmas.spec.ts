import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS helper shared with the map build script
import { decodePng } from '../../../scripts/png.mjs';
import { DILEMMAS, WORLD_NOTES } from './data/dilemmas';
import { EN } from '../core/i18n/en';
import { PL } from '../core/i18n/pl';
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

describe('choices put before the player', () => {
  it('come often while the game is young and ever more rarely later', () => {
    const rules = RULES as unknown as Record<string, number>;
    const year = rules['secondsPerYear'];
    rules['secondsPerYear'] = 16;
    const sim = game();
    const offered: number[] = [];
    for (let s = 0; s < 60 * 16 && sim.status === 'playing'; s += 0.5) {
      sim.step(0.5);
      for (const d of sim.takeDilemmas()) offered.push(sim.gameYear);
      if (sim.pendingDilemma) sim.answerDilemma('');
      sim.takeReports();
      sim.takeWarReports();
      sim.takePlans();
      sim.takeFortunes();
      for (const c of sim.takeConquests()) sim.resolveConquest(c, 'subjugate');
    }
    rules['secondsPerYear'] = year;
    const early = offered.filter(y => y < 10).length;
    const later = offered.filter(y => y >= 30 && y < 60).length;
    expect(early).toBeGreaterThanOrEqual(6);
    // Thirty later years bring fewer than ten earlier ones did, three times over.
    expect(later / 30).toBeLessThan(early / 10 / 2);
  }, 300_000);

  it('come in their historical year: the eclipse of Thales in 585 BC', () => {
    const sim = game();
    for (const d of DILEMMAS) if (d.year && d.year > 585) (sim as any).dilemmaSeen.set(d.id, d.year);
    sim.time = 15 * RULES.secondsPerYear + 1;
    expect(sim.year).toBe(585);
    (sim as any).dilemmaTurn();
    expect(sim.takeDilemmas().map(d => d.id)).toEqual(['eclipse']);
  }, 30_000);

  it('after a century, bring at most one chance event a year', () => {
    const sim = game();
    for (const d of DILEMMAS) if (d.year) (sim as any).dilemmaSeen.set(d.id, d.year);
    sim.time = (RULES.randomCapYears + 5) * RULES.secondsPerYear + 1;
    let offered = 0;
    for (let k = 0; k < 20; k++) {
      (sim as any).nextDilemma = 0;
      (sim as any).dilemmaTurn();
      offered += sim.takeDilemmas().length;
      sim.answerDilemma('');
      sim.time += RULES.secondsPerYear / 40;
    }
    expect(offered).toBe(1);
    // A twist of fortune counts too: the next year may bring one or the other, not both.
    sim.time = (RULES.randomCapYears + 7) * RULES.secondsPerYear + 1;
    (sim as any).randomYear = sim.gameYear;
    (sim as any).nextDilemma = 0;
    (sim as any).dilemmaTurn();
    expect(sim.takeDilemmas().length).toBe(0);
  }, 30_000);

  it('do what their answers say', () => {
    const sim = game();
    const me = sim.poleis[sim.player];
    me.gross = 10;
    me.inflow = 0;
    me.drachmae += 5000;
    (sim as any).offerDilemma(DILEMMAS.find(d => d.id === 'lawgiver'));
    const choices = sim.dilemmaChoices(me, 'lawgiver');
    const cancel = choices.find(c => c.id === 'cancel')!;
    expect(cancel.silver).toBe(-Math.round((2 * 10 * RULES.secondsPerYear) / 12));
    const treasury = sim.treasury(me);
    me.satisfaction = 50;
    const prestige = me.prestige;
    sim.answerDilemma('cancel');
    expect(sim.treasury(me)).toBeCloseTo(treasury + cancel.silver, 0);
    expect(me.satisfaction).toBeGreaterThan(50);
    expect(me.prestige).toBeCloseTo(prestige + 0.5);
    expect(sim.pendingDilemma).toBeNull();
  }, 30_000);

  it('have every story and answer written in English and Polish', () => {
    for (const d of DILEMMAS) {
      for (const dict of [EN, PL]) {
        const text = dict.dilemmas[d.id];
        expect(text.title.length).toBeGreaterThan(3);
        expect(text.text.length).toBeGreaterThan(40);
        for (const o of d.options) expect(text.options[o.id], `${d.id}.${o.id}`).toBeTruthy();
      }
    }
    for (const n of WORLD_NOTES) expect(EN.worldNotes[n.id] && PL.worldNotes[n.id]).toBeTruthy();
  });
});
