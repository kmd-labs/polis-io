import { describe, expect, it } from 'vitest';
import { rankHegemony } from './hegemony';
import { Snapshot } from './history';

const budget = { military: 20, colonization: 20, agriculture: 20, trade: 20, culture: 20 };

/** A polis-year with sensible zeros; override what the test is about. */
function snap(idx: number, year: number, fields: Partial<Snapshot> = {}): Snapshot {
  return {
    year,
    idx,
    budget,
    alive: 1,
    drachmae: 0,
    incomePerMonth: 0,
    population: 1000,
    workers: 500,
    hoplites: 100,
    territoryPct: 1,
    satisfaction: 60,
    prestige: 0,
    battlesWon: 0,
    battlesLost: 0,
    tributePerMonth: 0,
    capitalsTaken: 0,
    warsWon: 0,
    ...fields
  };
}

/** `years` rows for poleis 0..n-1 built by `make(idx, yearOffset)`. */
function rows(n: number, years: number, make: (idx: number, t: number) => Partial<Snapshot>): Snapshot[][] {
  return Array.from({ length: years }, (_, t) => Array.from({ length: n }, (_, idx) => snap(idx, 600 - t, make(idx, t))));
}

describe('rankHegemony', () => {
  it('awards 3/2/1 points per category and names the top scorer Hegemon', () => {
    const data = rows(4, 30, (idx, t) => ({
      incomePerMonth: [40, 30, 20, 10][idx],
      population: [5000, 9000, 7000, 1000][idx],
      battlesWon: t * [1, 0, 2, 0][idx]
    }));
    const s = rankHegemony(data, 571);
    expect(s.finance.slice(0, 3).map(r => r.idx)).toEqual([0, 1, 2]);
    expect(s.population.slice(0, 3).map(r => r.idx)).toEqual([1, 2, 0]);
    expect(s.arms.slice(0, 2).map(r => r.idx)).toEqual([2, 0]);
    // 0: finance 3 + population 1 + arms 2 = 6; 1: 2 + 3 = 5; 2: 1 + 2 + 3 = 6 → tie, larger population wins.
    expect(s.scores).toEqual({ 0: 6, 1: 5, 2: 6, 3: 0 });
    expect(s.hegemon).toBe(2);
    // Polis 3 ties polis 1 at zero arms; the larger population (polis 1) goes first.
    expect(s.places[3]).toEqual({ finance: 4, population: 4, arms: 4 });
  });

  it('averages finance over the last ten years only', () => {
    // Polis 0 was rich long ago, polis 1 only lately.
    const data = rows(2, 20, (idx, t) => ({ incomePerMonth: idx === 0 ? (t < 10 ? 100 : 5) : t < 10 ? 5 : 50 }));
    const s = rankHegemony(data, 581);
    expect(s.finance[0]).toEqual({ idx: 1, value: 50 });
    expect(s.finance[1].value).toBeCloseTo(5);
  });

  it('counts feats of arms over the last 25 years: battle 1, capital 5, war 3', () => {
    const data = rows(2, 40, (idx, t) =>
      idx === 0
        ? { battlesWon: t >= 30 ? 10 : 0 } // ten battles, recent
        : { capitalsTaken: t >= 5 ? 3 : 0, warsWon: t >= 5 ? 3 : 0 } // old glory, before the window
    );
    const s = rankHegemony(data, 561);
    expect(s.arms[0]).toEqual({ idx: 0, value: 10 });
    expect(s.arms[1]).toEqual({ idx: 1, value: 0 });
    // A capital and a war won inside the window.
    const recent = rows(1, 30, (_, t) => ({ capitalsTaken: t >= 20 ? 1 : 0, warsWon: t >= 20 ? 1 : 0 }));
    expect(rankHegemony(recent, 571).arms[0].value).toBe(8);
  });

  it('leaves out a polis destroyed during the window', () => {
    const data = rows(3, 12, (idx, t) => ({ alive: idx === 0 && t === 11 ? 0 : 1, population: [99999, 2000, 1000][idx], incomePerMonth: 10 }));
    const s = rankHegemony(data, 589);
    expect(s.population.map(r => r.idx)).toEqual([1, 2]);
    expect(s.scores[0]).toBeUndefined();
    expect(s.hegemon).toBe(1);
  });

  it('ranks a vassal on its own: its people do not count for the overlord', () => {
    // Polis 1 is polis 0's vassal; only their own populations are compared.
    const data = rows(3, 5, idx => ({ population: [3000, 2500, 2800][idx] }));
    const s = rankHegemony(data, 596);
    expect(s.population.map(r => r.idx)).toEqual([0, 2, 1]);
  });

  it('lets the reigning Hegemon keep the title on a tie', () => {
    const data = rows(4, 30, (idx, t) => ({
      incomePerMonth: [40, 30, 20, 10][idx],
      population: [5000, 9000, 7000, 1000][idx],
      battlesWon: t * [1, 0, 2, 0][idx]
    }));
    // Poleis 0 and 2 both score 6; 2 wins on population unless 0 already reigns.
    expect(rankHegemony(data, 571).hegemon).toBe(2);
    expect(rankHegemony(data, 571, 0).hegemon).toBe(0);
    expect(rankHegemony(data, 571, 1).hegemon).toBe(2);
  });

  it('crowns nobody when nobody scores', () => {
    const s = rankHegemony([[snap(0, 600, { population: 0 })]], 600);
    expect(s.hegemon).toBe(-1);
  });

  it('measures a polis founded during the window from zero', () => {
    const data = rows(1, 30, (_, t) => ({ battlesWon: t }));
    // Polis 1 appears in the last 5 years with 4 battles already won.
    for (let t = 25; t < 30; t++) data[t].push(snap(1, 600 - t, { battlesWon: 4 }));
    const s = rankHegemony(data, 571);
    expect(s.arms.find(r => r.idx === 1)!.value).toBe(4);
    expect(s.arms.find(r => r.idx === 0)!.value).toBe(25);
  });
});
