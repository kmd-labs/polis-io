import { describe, expect, it } from 'vitest';
import { decadeReport } from './decade';
import { Snapshot } from './history';

function snap(t: number, fields: Partial<Snapshot> = {}): Snapshot {
  return {
    year: 600 - t,
    idx: 0,
    budget: { military: 20, colonization: 20, agriculture: 20, trade: 20, culture: 20 },
    alive: 1,
    drachmae: 0,
    incomePerMonth: 10,
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

const decade = (make: (t: number) => Partial<Snapshot>) => Array.from({ length: 11 }, (_, t) => snap(t, make(t)));

describe('decadeReport', () => {
  it('compares the last year with ten years before', () => {
    const r = decadeReport(decade(t => ({ population: 1000 + t * 20, incomePerMonth: 10 + t, territoryPct: 1 })), null, null);
    expect(r.fromYear).toBe(600);
    expect(r.toYear).toBe(590);
    expect(r.population).toBeCloseTo(0.2);
    expect(r.income).toBeCloseTo(1);
    expect(r.territory).toBeCloseTo(0);
    expect(r.verdict).toBe('silver');
  });

  it('averages the budget over the ten years of the decade', () => {
    const rows = decade(t => ({ budget: { military: t <= 5 ? 20 : 50, colonization: 20, agriculture: 20, trade: t <= 5 ? 20 : 5, culture: t <= 5 ? 20 : 5 } }));
    expect(decadeReport(rows, null, null).budget).toEqual({ military: 35, colonization: 20, agriculture: 20, trade: 13, culture: 13 });
  });

  it('counts the battles of the decade only', () => {
    const r = decadeReport(decade(t => ({ battlesWon: 5 + t, battlesLost: 2 })), null, null);
    expect(r.battlesWon).toBe(10);
    expect(r.battlesLost).toBe(0);
    expect(r.verdict).toBe('arms');
  });

  it('calls a decade of lost battles a war lost', () => {
    expect(decadeReport(decade(t => ({ battlesWon: t > 8 ? 1 : 0, battlesLost: t })), null, null).verdict).toBe('war');
  });

  it('calls hard times when everything shrank, and quiet when little changed', () => {
    expect(decadeReport(decade(t => ({ population: 1000 - t * 20, incomePerMonth: 10 - t * 0.3, territoryPct: 1 - t * 0.02 })), null, null).verdict).toBe('hard');
    expect(decadeReport(decade(() => ({})), null, null).verdict).toBe('quiet');
  });

  it('carries the hegemony places then and now', () => {
    const r = decadeReport(decade(() => ({})), { finance: 4, population: 2, arms: 9 }, { finance: 1, population: 2, arms: 7 });
    expect(r.places.finance).toEqual({ then: 4, now: 1 });
    expect(r.places.arms).toEqual({ then: 9, now: 7 });
  });

  it('gives no percentage when there was nothing ten years ago', () => {
    expect(decadeReport(decade(t => ({ incomePerMonth: t ? 5 : 0 })), null, null).income).toBeNull();
  });
});
