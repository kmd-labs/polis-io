import { Dict, Lang } from '../core/i18n/i18n.types';
import { formatNumber, interpolate } from '../core/i18n/format';
import { GREECE_MAP } from '../game/data/greece-map';
import { Simulation } from '../game/simulation';
import { PeaceItem } from '../game/war';

const CELL_KM2 = GREECE_MAP.cellKm * GREECE_MAP.cellKm;

/** One line per term: who gives what ("Sparta: 1,200 dr"), for letters and the chronicle. */
export function describeTerms(
  sim: Simulation,
  deal: readonly PeaceItem[],
  t: Dict,
  lang: Lang,
  name: (idx: number) => string,
  between: [number, number]
): string[] {
  return deal.map(item => {
    const to = item.from === between[0] ? between[1] : between[0];
    const amount = sim.peaceAmount(item, to);
    const what =
      item.kind === 'gold'
        ? interpolate(t.termGold, { d: formatNumber(amount, lang) })
        : item.kind === 'land'
          ? interpolate(t.termLand, { n: formatNumber(Math.round(amount * CELL_KM2), lang) })
          : t.peaceItems[item.kind].name;
    return interpolate(t.termLine, { giver: name(item.from), item: what });
  });
}
