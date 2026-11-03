import { describe, expect, it } from 'vitest';
import { fmt1, formatCompact, formatNumber, formatRate } from './format';

describe('fmt1', () => {
  it('hides float noise', () => {
    expect(fmt1(0.6000000000000001, 'en')).toBe('0.6');
    expect(fmt1(0.1 + 0.2, 'en')).toBe('0.3');
  });

  it('keeps at most one decimal and drops a trailing zero', () => {
    expect(fmt1(2.46, 'en')).toBe('2.5');
    expect(fmt1(3, 'en')).toBe('3');
  });

  it('uses the Polish decimal comma', () => {
    expect(fmt1(0.6000000000000001, 'pl')).toBe('0,6');
  });
});

describe('formatNumber / formatRate', () => {
  it('rounds to whole numbers', () => {
    expect(formatNumber(1234.6, 'en')).toBe('1,235');
  });

  it('signs rates with one decimal', () => {
    expect(formatRate(4.25, 'en')).toBe('+4.3');
    expect(formatRate(-0.8, 'en')).toBe('−0.8');
  });
});

describe('formatCompact', () => {
  it('shortens large numbers for narrow bars', () => {
    expect(formatCompact(18146, 'en')).toBe('18.1K');
    expect(formatCompact(950, 'en')).toBe('950');
  });
});
