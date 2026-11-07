import { describe, expect, it } from 'vitest';
import { BANES, rollFortune } from './fortune';
import { BUDGET_KEYS, RULES, seededRandom } from './simulation';

describe('rollFortune', () => {
  it('brings windfalls to every budget branch and misfortunes of at most three months', () => {
    const rand = seededRandom(5);
    const branches = new Set<string>();
    const banes = new Set<string>();
    let boons = 0;
    for (let i = 0; i < 2000; i++) {
      const f = rollFortune(rand);
      if (f.boon) {
        boons++;
        branches.add(f.branch);
        expect(f.months).toBeGreaterThanOrEqual(1);
        expect(f.months).toBeLessThanOrEqual(3);
      } else {
        banes.add(f.bane);
        expect(f.months).toBeGreaterThanOrEqual(0.5);
        expect(f.months).toBeLessThanOrEqual(RULES.fortuneMaxMonths);
      }
    }
    expect(branches.size).toBe(BUDGET_KEYS.length);
    expect(banes.size).toBe(BANES.length);
    expect(boons / 2000).toBeCloseTo(RULES.fortuneBoonChance, 1);
  });
});
