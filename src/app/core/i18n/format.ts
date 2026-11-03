import { Dict, Lang } from './i18n.types';
import { PolisDef } from '../../game/data/poleis';

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

/** Display name of a polis, including vassals founded on historical sites. */
export function polisName(t: Dict, def: PolisDef): string {
  return def.kind === 'site' ? t.siteNames[def.id] : t.polisNames[def.id];
}

/** Picks one/few/many plural forms (1 / 2–4 / 5+, Polish-style; English uses the same "many" form). */
export function formatPlural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const form = n === 1 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many;
  return interpolate(form, { n });
}

/** "{n} year(s)". */
export function formatYears(n: number, t: Dict): string {
  return formatPlural(n, t.yearsOne, t.yearsFew, t.yearsMany);
}

/** A number with at most one decimal place (power projection, culture…), never float noise. */
export function fmt1(value: number, lang: Lang): string {
  return value.toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US', { maximumFractionDigits: 1 });
}

/** Short form for tight spaces: 18,146 → "18.1K" / "18,1 tys.". */
export function formatCompact(value: number, lang: Lang): string {
  return Math.round(value).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US', { notation: 'compact', maximumFractionDigits: 1 });
}

/** Time until something happens: "now", "~5 months" under a year, else "~3.2 yr" (one decimal). */
export function formatEta(seconds: number, secondsPerYear: number, t: Dict, lang: Lang): string {
  if (seconds <= 0) return t.etaNow;
  const years = seconds / secondsPerYear;
  if (years < 1) {
    const months = Math.max(1, Math.round(years * 12));
    return `~${formatPlural(months, t.monthsOne, t.monthsFew, t.monthsMany)}`;
  }
  return interpolate(t.etaYears, { n: years.toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
}
