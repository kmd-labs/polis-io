import { describe, expect, it } from 'vitest';
import { BUDGET_PRESETS, PRESET_IDS, forecastFund, isValidBudget, presetOf } from './economy';

describe('budget presets', () => {
  it.each(PRESET_IDS)('%s adds up to 100% with every share at least 5%', id => {
    expect(isValidBudget(BUDGET_PRESETS[id])).toBe(true);
  });

  it('recognises a preset and falls back to custom', () => {
    expect(presetOf({ ...BUDGET_PRESETS.war })).toBe('war');
    expect(presetOf({ military: 21, colonization: 19, agriculture: 20, trade: 20, culture: 20 })).toBe('custom');
  });
});

describe('forecastFund', () => {
  const base = { share: 20, busyShare: 100, inflow: 10, upkeep: 0, balance: 0, levy: 0 };

  it('divides the missing drachmae by what the fund receives', () => {
    const f = forecastFund({ ...base, key: 'agriculture', balance: 100, next: { kind: 'farm', cost: 300 } });
    expect(f.rate).toBeCloseTo(2);
    expect(f.eta).toBeCloseTo(100);
  });

  it('is immediate when the fund already has enough', () => {
    expect(forecastFund({ ...base, key: 'culture', balance: 500, next: { kind: 'festival', cost: 200 } }).eta).toBe(0);
  });

  it('counts money passed on by idle funds', () => {
    // Only 50% of the budget has something to buy: this 20% fund gets 40% of the income.
    const f = forecastFund({ ...base, key: 'trade', busyShare: 50, next: { kind: 'port', cost: 400 } });
    expect(f.rate).toBeCloseTo(4);
    expect(f.eta).toBeCloseTo(100);
  });

  it('has no ETA for a fund with nothing to buy', () => {
    const f = forecastFund({ ...base, key: 'trade', next: null });
    expect(f.eta).toBeNull();
    expect(f.rate).toBeCloseTo(2);
  });

  it('turns the military surplus into hoplites after upkeep', () => {
    const f = forecastFund({ ...base, key: 'military', share: 50, upkeep: 1, levy: 40, next: { kind: 'hoplites', cost: 80 } });
    expect(f.rate).toBeCloseTo(4);
    expect(f.hoplitesPerSecond).toBeCloseTo(2);
    expect(f.desertIn).toBeNull();
  });

  it('warns when upkeep outruns the military share', () => {
    const f = forecastFund({ ...base, key: 'military', share: 10, upkeep: 3, balance: 20, levy: 40, next: { kind: 'hoplites', cost: 80 } });
    expect(f.rate).toBeCloseTo(-2);
    expect(f.eta).toBeNull();
    expect(f.hoplitesPerSecond).toBe(0);
    expect(f.desertIn).toBeCloseTo(10);
  });
});
