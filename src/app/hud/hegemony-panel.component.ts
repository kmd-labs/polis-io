import { Component, computed, inject } from '@angular/core';
import { LucideAngularModule, ArrowDown, ArrowUp, Crown } from 'lucide-angular';
import { TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { fmt1, formatCompact, formatNumber, formatOrdinal, formatYear, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { HEGEMONY_CATEGORIES, HegemonyCategory } from '../game/hegemony';
import { LineChartComponent } from './line-chart.component';
import { PolisFlagComponent } from './polis-flag.component';

/**
 * Drawer tab "Hegemony": the Hegemon of Hellas, the podium of each category (with a trend arrow
 * against ten years ago), the player's place in each even off the podium, and a chart of the
 * player's hegemony points over time.
 */
@Component({
  selector: 'app-hegemony-panel',
  standalone: true,
  imports: [LucideAngularModule, TooltipDirective, LineChartComponent, PolisFlagComponent],
  templateUrl: './hegemony-panel.component.html',
  styleUrl: './hegemony-panel.component.scss'
})
export class HegemonyPanelComponent {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);

  readonly icons = { ArrowDown, ArrowUp, Crown };

  readonly view = computed(() => {
    const h = this.game.hegemony();
    const past = this.game.hegemonyPast();
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const me = this.game.player();
    if (!h) return null;
    const value = (cat: HegemonyCategory, v: number) =>
      cat === 'finance'
        ? interpolate(t.hegUnitFinance, { n: fmt1(v, lang) })
        : cat === 'population'
          ? v >= 10000
            ? formatCompact(v, lang)
            : formatNumber(v, lang)
          : interpolate(t.hegUnitArms, { n: formatNumber(v, lang) });
    const def = (idx: number) => this.game.sim.poleis[idx].def;

    const categories = HEGEMONY_CATEGORIES.map(cat => ({
      cat,
      name: t.hegemonyCats[cat].name,
      desc: t.hegemonyCats[cat].desc,
      podium: h[cat].slice(0, 3).map((r, i) => {
        const then = past?.[cat].find(x => x.idx === r.idx)?.value;
        const trend = then === undefined ? 0 : r.value > then * 1.05 ? 1 : r.value < then * 0.95 ? -1 : 0;
        return {
          idx: r.idx,
          place: i + 1,
          def: def(r.idx),
          name: this.game.name(r.idx),
          value: value(cat, r.value),
          mine: r.idx === me,
          trend,
          trendLabel: trend > 0 ? t.hegTrendUp : trend < 0 ? t.hegTrendDown : ''
        };
      })
    }));

    const places = h.places[me];
    const mine = places
      ? HEGEMONY_CATEGORIES.map(cat => interpolate(t.hegYourPlace, { place: formatOrdinal(places[cat], lang), cat: t.hegemonyCats[cat].name }))
      : [];
    const log = this.game.hegemonyLog();
    return {
      hegemon: h.hegemon >= 0 ? { idx: h.hegemon, def: def(h.hegemon), name: this.game.name(h.hegemon), mine: h.hegemon === me } : null,
      categories,
      mine,
      score: interpolate(t.hegScore, { s: h.scores[me] ?? 0 }),
      myName: me >= 0 ? this.game.name(me) : '',
      chart:
        log.length > 1
          ? {
              points: log.map(l => ({ year: l.year, value: l.score })),
              from: log[0].year,
              to: log[log.length - 1].year,
              format: (v: number) => interpolate(t.hegScore, { s: Math.round(v) }),
              formatYear: (y: number) => formatYear(y, t)
            }
          : null
    };
  });
}
