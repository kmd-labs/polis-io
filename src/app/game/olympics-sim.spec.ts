import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JS helper shared with the map build script
import { decodePng } from '../../../scripts/png.mjs';
import { eventsOf } from './olympics';
import { RULES, Simulation } from './simulation';
import { World, decodeMapPixels } from './world';

const png = decodePng(readFileSync('src/assets/map/hellas.png'));
const world = new World(decodeMapPixels(png.data, png.channels, png.width, png.height));

/** Steps the game (handling decisions the way the UI would) until `done` holds or `limit` seconds pass. */
function runUntil(sim: Simulation, done: () => boolean, limit: number) {
  for (let t = 0; t < limit && !done(); t += 0.1) {
    sim.step(0.1);
    sim.takeReports();
    sim.takeWarReports();
    sim.takePlans();
    for (const c of sim.takeConquests()) sim.resolveConquest(c, 'subjugate');
  }
}

describe('the Olympic Games in play', () => {
  it('years last sixteen times as long as they first did', () => {
    expect(RULES.secondsPerYear).toBe(64);
  });

  it('proclaims the truce two months before the Games, stands the armies down, and holds the Games', () => {
    const sim = new Simulation(world, { seed: 9 });
    sim.choose(0);
    const athens = sim.poleis[0];
    const thebes = sim.poleis.find(p => p.def.id === 'thebes')!;
    sim.declareWar(athens.idx, thebes.idx);
    athens.garrison += 2000;

    // The first Games after the start are those of 596 BC (the 46th Olympiad).
    runUntil(sim, () => sim.truce, 6 * RULES.secondsPerYear);
    expect(sim.year).toBe(596);
    expect(sim.month).toBe(RULES.gamesMonth - RULES.truceBefore);
    expect(sim.takeOlympicInvites()).toEqual([596]);

    // No new wars while the truce lasts; those already being fought stand still.
    const warsAtTruce = [...athens.wars];
    const corinth = sim.poleis.find(p => p.def.id === 'corinth')!;
    sim.declareWar(corinth.idx, athens.idx);
    expect(corinth.wars.has(athens.idx)).toBe(false);
    expect([...athens.wars]).toEqual(warsAtTruce);

    // The player sends a lavish delegation, paid from the funds.
    const before = sim.treasury(athens);
    sim.sendDelegation(athens.idx, 0.5);
    expect(sim.treasury(athens)).toBeLessThan(before);

    // Every city army lifts its sieges and heads home (warbands from beyond the frontier, and the
    // defenders sent against them, keep fighting: the truce is a Greek custom).
    const home = (a: (typeof sim.armies)[number]) => Math.hypot(a.x - sim.poleis[a.owner].cx, a.y - sim.poleis[a.owner].cy);
    const greek = (a: (typeof sim.armies)[number]) => !sim.poleis[a.owner].tribe && a.defend < 0;
    const field = sim.armies.filter(a => !a.dead && greek(a)).map(a => ({ a, d: home(a) }));
    runUntil(sim, () => sim.month >= RULES.gamesMonth, RULES.secondsPerYear);
    for (const { a, d } of field) if (!a.dead) expect(home(a)).toBeLessThan(d + 0.01);
    expect(sim.armies.every(a => a.dead || a.siege < 0)).toBe(true);
    for (const b of sim.battles) expect([...b.attackers, ...b.defenders].some(a => !greek(a))).toBe(true);

    const [report] = sim.takeOlympics();
    expect(report.year).toBe(596);
    expect(report.olympiad).toBe(46);
    expect(report.winners).toHaveLength(eventsOf(596).length);
    const mine = report.rewards.find(r => r.idx === athens.idx)!;
    expect(mine.prestige).toBeGreaterThanOrEqual(RULES.olympicParticipation);

    // A month after the Games the truce ends and the war goes on.
    runUntil(sim, () => !sim.truce, RULES.secondsPerYear);
    expect(sim.truce).toBe(false);
    expect(sim.month).toBe(RULES.gamesMonth + RULES.truceAfter + 1);
    for (const e of warsAtTruce) if (sim.poleis[e].alive) expect(athens.wars.has(e)).toBe(true);
  }, 300_000);

  it('leaves a city that stays at home out of the Games', () => {
    const sim = new Simulation(world, { seed: 3 });
    sim.choose(0);
    runUntil(sim, () => sim.truce, 6 * RULES.secondsPerYear);
    sim.sendDelegation(0, 0);
    runUntil(sim, () => sim.month >= RULES.gamesMonth, RULES.secondsPerYear);
    const [report] = sim.takeOlympics();
    expect(report.table.some(r => r.idx === 0)).toBe(false);
    expect(report.table.length).toBeGreaterThan(10);
  }, 300_000);
});
