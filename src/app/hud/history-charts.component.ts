import { Component, computed, inject } from '@angular/core';
import { I18nService } from '../core/i18n/i18n.service';
import { fmt1, formatCompact, formatNumber, formatYear, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { HistoryField } from '../game/history';
import { BUDGET_KEYS } from '../game/simulation';
import { ImprovementId } from '../game/data/improvements';
import { ChartMarker, LineChartComponent } from './line-chart.component';

/**
 * Four small charts of the player's polis on one shared time axis — population, income per month,
 * territory and hoplites — with markers where the budget was changed, wars began or ended and
 * buildings were completed, so the player can see whether a decision worked.
 */
@Component({
  selector: 'app-history-charts',
  standalone: true,
  imports: [LineChartComponent],
  template: `
    @if (charts(); as c) {
      <div class="charts">
        @for (chart of c.list; track chart.field) {
          <app-line-chart
            [title]="chart.title"
            [points]="chart.points"
            [markers]="c.markers"
            [from]="c.from"
            [to]="c.to"
            [format]="chart.format"
            [formatYear]="c.formatYear"
            [color]="chart.color"></app-line-chart>
        }
      </div>
      <p class="legend">{{ i18n.t().chartsLegend }}</p>
    } @else {
      <p class="legend">{{ i18n.t().chartsEmpty }}</p>
    }
  `,
  styleUrl: './history-charts.component.scss'
})
export class HistoryChartsComponent {
  readonly i18n = inject(I18nService);
  private readonly game = inject(GameService);

  readonly charts = computed(() => {
    this.game.historyVersion();
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const me = this.game.player();
    const history = this.game.history;
    const years = history.years;
    if (me < 0 || years.length < 2) return null;

    const num = (v: number) => (v >= 10000 ? formatCompact(v, lang) : formatNumber(v, lang));
    const fields: { field: HistoryField; title: string; color: string; format: (v: number) => string }[] = [
      { field: 'population', title: t.statPopulation, color: 'primary-600', format: num },
      { field: 'incomePerMonth', title: t.chartIncome, color: 'warning-600', format: v => `${fmt1(v, lang)} dr` },
      { field: 'territoryPct', title: t.statTerritory, color: 'success-600', format: v => `${fmt1(v, lang)}%` },
      { field: 'hoplites', title: t.statWarriors, color: 'danger-600', format: num }
    ];

    const markers: ChartMarker[] = history.events.map(e => {
      const when = formatYear(e.year, t);
      if (e.kind === 'budget') {
        const moves = BUDGET_KEYS.filter(k => Math.abs(e.from[k] - e.to[k]) >= 5)
          .map(k => `${t.budgetKeys[k].name} ${e.from[k]}% → ${e.to[k]}%`)
          .join(', ');
        return { year: e.year, kind: 'budget', label: `${when}: ${moves}` };
      }
      if (e.kind === 'built') {
        return { year: e.year, kind: 'built', label: interpolate(t.chartBuilt, { w: t.improvements[e.id as ImprovementId]?.name ?? '' }) };
      }
      const name = this.game.name(e.other);
      return { year: e.year, kind: e.kind, label: interpolate(e.kind === 'war' ? t.chartWar : t.chartPeace, { name }) };
    });

    return {
      from: years[0],
      to: years[years.length - 1],
      formatYear: (y: number) => formatYear(y, t),
      markers,
      list: fields.map(f => ({ ...f, points: history.series(me, f.field).map(p => ({ year: p.year, value: p.value })) }))
    };
  });
}
