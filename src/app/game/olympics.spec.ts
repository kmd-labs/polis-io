import { describe, expect, it } from 'vitest';
import { Delegation, eventsOf, holdGames, isOlympicYear, isTriumph, olympiadOf, spendFactor } from './olympics';
import { seededRandom } from './simulation';

const city = (idx: number, fields: Partial<Delegation> = {}): Delegation => ({
  idx,
  population: 10000,
  annualIncome: 100,
  militarism: 2,
  culture: 2,
  spent: 10,
  share: 0.1,
  ...fields
});

describe('the Olympic calendar', () => {
  it('counts Olympiads from 776 BC, every fourth year', () => {
    expect(isOlympicYear(776)).toBe(true);
    expect(isOlympicYear(600)).toBe(true);
    expect(isOlympicYear(596)).toBe(true);
    expect(isOlympicYear(598)).toBe(false);
    expect(olympiadOf(776)).toBe(1);
    expect(olympiadOf(600)).toBe(45);
    expect(olympiadOf(596)).toBe(46);
  });

  it('grows the programme as contests are added and drops those discontinued', () => {
    expect(eventsOf(776).map(e => e.id)).toEqual(['stadion']);
    expect(eventsOf(600)).toHaveLength(12);
    // Heralds and trumpeters joined in 396 BC (sixteen contests); the foal races brought it to eighteen by 268 BC.
    expect(eventsOf(392)).toHaveLength(16);
    expect(eventsOf(268)).toHaveLength(18);
    expect(eventsOf(472).map(e => e.id)).toContain('apene');
    expect(eventsOf(440).map(e => e.id)).not.toContain('apene');
  });
});

describe('holdGames', () => {
  it('awards one wreath per contest', () => {
    const r = holdGames(596, [city(0), city(1), city(2)], seededRandom(1));
    expect(r.winners).toHaveLength(eventsOf(596).length);
    expect(r.table.reduce((s, x) => s + x.wreaths, 0)).toBe(eventsOf(596).length);
    expect(r.olympiad).toBe(46);
  });

  it('favours a big, generously funded delegation over many Games', () => {
    const rand = seededRandom(7);
    let rich = 0;
    let poor = 0;
    for (let i = 0; i < 40; i++) {
      const r = holdGames(596, [city(0, { population: 40000, share: 0.5, annualIncome: 400 }), city(1, { share: 0 })], rand);
      rich += r.table.find(x => x.idx === 0)!.wreaths;
      poor += r.table.find(x => x.idx === 1)!.wreaths;
    }
    expect(rich).toBeGreaterThan(poor * 2);
  });

  it('gives diminishing returns on money and calls two-fifths of the programme a triumph', () => {
    expect(spendFactor(0)).toBe(1);
    expect(spendFactor(0.5) - spendFactor(0.25)).toBeLessThan(spendFactor(0.25) - spendFactor(0));
    expect(isTriumph(5, 12)).toBe(true);
    expect(isTriumph(4, 12)).toBe(false);
    expect(isTriumph(7, 18)).toBe(false);
    expect(isTriumph(8, 18)).toBe(true);
  });
});
