import { Component, computed, inject, output } from '@angular/core';
import {
  LucideAngularModule,
  BookOpen,
  Coins,
  Flag,
  LucideIconData,
  MapIcon,
  Pause,
  Pickaxe,
  Play,
  RotateCcw,
  Smile,
  Swords,
  Users
} from 'lucide-angular';
import { BreakpointService, ButtonComponent, TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { fmt1, formatCompact, formatNumber, formatRate, formatYear, interpolate } from '../core/i18n/format';
import { GameService, SPEEDS } from '../game/game.service';
import { PolisFlagComponent } from './polis-flag.component';

interface Resource {
  key: string;
  icon: LucideIconData;
  label: string;
  value: string;
  rate?: string;
  negative?: boolean;
  hint: string;
  tone?: 'good' | 'mid' | 'bad';
}

/**
 * The resource strip along the top edge: the player's banner, the figures that matter at a glance
 * (each with a tooltip on where it comes from), then the date and the clock controls.
 */
@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [LucideAngularModule, ButtonComponent, TooltipDirective, PolisFlagComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);
  readonly bp = inject(BreakpointService);

  readonly help = output<void>();
  readonly restart = output<void>();

  readonly icons = { BookOpen, Pause, Play, RotateCcw };
  readonly speeds = SPEEDS.map((speed, i) => ({ speed, key: i + 1 }));

  readonly year = computed(() => formatYear(this.game.year(), this.i18n.t()));
  readonly ended = computed(() => this.game.status() === 'won' || this.game.status() === 'lost');

  readonly name = computed(() => {
    const me = this.game.me();
    this.i18n.t();
    return me ? this.game.name(me.idx) : '';
  });

  readonly resources = computed<Resource[]>(() => {
    const me = this.game.me();
    if (!me) return [];
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    // Narrow screens get short numbers and only the essentials.
    const compact = this.bp.tablet();
    const num = (v: number) => (compact && v >= 10000 ? formatCompact(v, lang) : formatNumber(v, lang));
    const income = this.game.perMonth(me.income);
    const mood = Math.round(me.satisfaction);
    const all: Resource[] = [
      {
        key: 'drachmae',
        icon: Coins,
        label: t.statDrachmae,
        value: num(me.drachmae),
        rate: interpolate(t.perMonth, { n: formatRate(income, lang) }),
        negative: income < 0,
        hint: t.statDrachmaeHint
      },
      { key: 'population', icon: Users, label: t.statPopulation, value: num(me.total), hint: t.statPopulationHint },
      { key: 'workers', icon: Pickaxe, label: t.statWorkers, value: num(me.workers), hint: t.statWorkersHint },
      {
        key: 'hoplites',
        icon: Swords,
        label: t.statWarriors,
        value: `${num(me.warriors)}/${num(me.armyTarget)}`,
        hint: t.topHoplitesHint
      },
      {
        key: 'satisfaction',
        icon: Smile,
        label: t.satisfaction,
        value: `${mood}%`,
        hint: t.topSatisfactionHint,
        tone: mood >= 60 ? 'good' : mood >= 35 ? 'mid' : 'bad'
      },
      { key: 'prestige', icon: Flag, label: t.statPrestige, value: fmt1(me.prestige, lang), hint: t.statPrestigeHint },
      {
        key: 'territory',
        icon: MapIcon,
        label: t.statTerritory,
        value: `${fmt1(me.share * 100, lang)}%`,
        hint: t.statTerritoryHint
      }
    ];
    const keep = this.bp.mobile()
      ? ['drachmae', 'population', 'satisfaction']
      : compact
        ? ['drachmae', 'population', 'hoplites', 'satisfaction']
        : null;
    return keep ? all.filter(r => keep.includes(r.key)) : all;
  });

  speedLabel(speed: number): string {
    return interpolate(this.i18n.t().speedN, { n: speed });
  }
}
