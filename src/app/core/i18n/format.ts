import { Dict, Lang } from './i18n.types';

/** Replaces `{key}` placeholders in a dictionary template. */
export function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ''));
}

/** Locale-aware integer formatting (12,400 / 12 400). */
export function formatNumber(value: number, lang: Lang): string {
  return Math.round(value).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US');
}

/** Compact signed rate, e.g. "+4.2" / "−0.8". */
export function formatRate(value: number, lang: Lang): string {
  const abs = Math.abs(value).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
  return `${value < 0 ? '−' : '+'}${abs}`;
}

/** Calendar year from the simulation's signed year (positive = BC). */
export function formatYear(year: number, t: Dict): string {
  return year > 0 ? interpolate(t.yearBC, { y: year }) : interpolate(t.yearAD, { y: 1 - year });
}
