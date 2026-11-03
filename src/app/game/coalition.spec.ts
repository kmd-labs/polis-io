import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS helper shared with the map build script
import { decodePng } from '../../../scripts/png.mjs';
import { Annals } from './annals';
import { RULES, Simulation } from './simulation';
import { World, decodeMapPixels } from './world';

/**
 * Two centuries of Hellas with nobody at the helm (every city, the "player's" too, run by the AI):
 * the coalition must stop any Hegemon from holding 7+ points for much more than forty years.
 */
describe('coalition against the Hegemon (autoplay)', () => {
  const png = decodePng(readFileSync('src/assets/map/hellas.png'));
  const world = new World(decodeMapPixels(png.data, png.channels, png.width, png.height));

  it('rewards points with renown and unites Hellas against a decade-long dominator', () => {
    const sim = new Simulation(world, { seed: 1 });
    sim.choose(0);
    const [a, b, c] = [1, 2, 3].map(i => sim.poleis[i]);
    const prestige = a.prestige;
    const relation = sim.relation(b.idx, a.idx);
    for (let year = 1; year <= RULES.coalitionYears; year++) {
      sim.applyHegemony({ [a.idx]: 8, [b.idx]: 1 }, a.idx);
      // Ten years at 8 points: +0.8 power projection a year; the coalition forms in the tenth.
      expect(sim.coalitionTarget).toBe(year < RULES.coalitionYears ? -1 : a.idx);
    }
    expect(a.prestige - prestige).toBeCloseTo(RULES.coalitionYears * 8 * RULES.hegemonyPrestige);
    expect(sim.hegemon).toBe(a.idx);
    const asHegemon = sim.tradeValue(a);
    // Everyone else's regard for the dominator sinks by 2 a year while the coalition lasts.
    expect(sim.relation(b.idx, a.idx)).toBeCloseTo(Math.max(-100, relation + RULES.coalitionRelation));
    const before = sim.relation(c.idx, a.idx);
    sim.applyHegemony({ [a.idx]: 8 }, a.idx);
    expect(sim.relation(c.idx, a.idx)).toBeCloseTo(Math.max(-100, before + RULES.coalitionRelation));
    // Its score falls: the coalition breaks up.
    sim.applyHegemony({ [a.idx]: 3 }, b.idx);
    expect(sim.coalitionTarget).toBe(-1);
    // No longer Hegemon: the 5% trade premium is gone.
    expect(sim.tradeValue(a)).toBeCloseTo(asHegemon / (1 + RULES.hegemonTradeBonus));
    expect(sim.events.some(e => e.kind === 'coalition' && e.a === a.idx)).toBe(true);
    expect(sim.events.some(e => e.kind === 'coalitionEnd' && e.a === a.idx)).toBe(true);
  }, 60_000);

  it.each([2, 6])('caps a dominant reign over 200 years (seed %i)', seed => {
    const sim = new Simulation(world, { seed, autoplay: true });
    sim.choose(0);
    const annals = new Annals();
    let holder = -1;
    let streak = 0;
    let longest = 0;
    let coalitions = 0;
    for (let year = 0; year < 200 && sim.status === 'playing'; year++) {
      annals.update(sim);
      const s = annals.current!;
      if (s.hegemon >= 0 && s.scores[s.hegemon] >= RULES.coalitionScore) {
        streak = s.hegemon === holder ? streak + 1 : 1;
        holder = s.hegemon;
      } else {
        holder = -1;
        streak = 0;
      }
      longest = Math.max(longest, streak);
      if (sim.events.some(e => e.kind === 'coalition' && e.year === sim.year)) coalitions++;
      const next = sim.year - 1;
      while (sim.year > next && sim.status === 'playing') sim.step(0.5);
      sim.takeReports();
      sim.takeWarReports();
      sim.takePlans();
      for (const c of sim.takeConquests()) sim.resolveConquest(c, 'subjugate');
    }
    console.info(`seed ${seed}: longest 7+ reign ${longest} years, coalitions formed ${coalitions}`);
    expect(longest).toBeLessThanOrEqual(45);
  }, 300_000);
});
