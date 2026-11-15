import { Component, NgZone, computed, inject, output, signal } from '@angular/core';
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
import { BreakpointService, ButtonComponent, TooltipDirective, breakpointPx } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { fmt1, formatCompact, formatNumber, formatOrdinal, formatRate, formatYear, interpolate } from '../core/i18n/format';
import { HEGEMONY_CATEGORIES } from '../game/hegemony';
import { HudStateService } from './hud-state.service';
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
  private readonly hud = inject(HudStateService);
  private readonly zone = inject(NgZone);

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
        value: this.bp.mobile() ? num(me.warriors) : `${num(me.warriors)}/${num(me.armyTarget)}`,
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
    return all;
  });

  /** The figures that fit the bar at this width (the rest wait behind the ⋯ button): money, hoplites and
   * satisfaction always; population and power projection when there is room; everything on wide screens. */
  readonly shown = computed(() => {
    const keep =
      this.bp.tablet() || this.narrow()
        ? ['drachmae', 'hoplites', 'satisfaction']
        : this.medium()
          ? ['drachmae', 'population', 'hoplites', 'satisfaction', 'prestige']
          : null;
    const all = this.resources();
    return keep ? all.filter(r => keep.includes(r.key)) : all;
  });

  readonly hidden = computed(() => {
    const shown = new Set(this.shown().map(r => r.key));
    return this.resources().filter(r => !shown.has(r.key));
  });

  /** At or below the desktop breakpoint (1280 px): room for five figures, not seven. */
  private readonly narrow = (() => {
    const state = signal(false);
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return state;
    const mql = window.matchMedia(`(max-width: ${breakpointPx('desktop')}px)`);
    state.set(mql.matches);
    mql.addEventListener('change', e => this.zone.run(() => state.set(e.matches)));
    return state;
  })();

  /** Up to 1600 px: room for five figures. */
  private readonly medium = (() => {
    const state = signal(false);
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return state;
    const mql = window.matchMedia('(max-width: 1600px)');
    state.set(mql.matches);
    mql.addEventListener('change', e => this.zone.run(() => state.set(e.matches)));
    return state;
  })();

  /** The ⋯ list (on touch screens it opens on a tap). */
  readonly moreOpen = signal(false);

  /** Income line by line, per month, for the treasury popover. */
  readonly breakdown = computed(() => {
    const b = this.game.incomeBreakdown();
    if (!b) return null;
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const month = (v: number) => this.game.perMonth(v);
    const dr = (v: number) => `${v < 0 ? '−' : '+'}${fmt1(Math.abs(month(v)), lang)} dr`;
    const pct = (v: number) => `${v < 0 ? '−' : '+'}${fmt1(Math.abs(v * 100), lang)}%`;
    const rows = [
      { label: interpolate(t.incWorkers, { n: formatNumber(b.workers, lang) }), value: dr(b.base) },
      { label: t.incCulture, value: pct(b.culture) },
      { label: t.incPorts, value: pct(b.ports) },
      { label: t.incDues, value: dr(b.dues) },
      { label: t.incBuildings, value: pct(b.buildings) },
      { label: t.incMood, value: `×${b.mood.toLocaleString(t.htmlLang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: t.incSway, value: dr(b.sway) },
      { label: t.incOther, value: dr(b.other) },
      { label: t.incUpkeep, value: dr(-b.upkeep) }
    ];
    return { rows, total: dr(b.gross + b.sway + b.other - b.upkeep), blockaded: b.blockaded };
  });

  /** The laurel: the player's hegemony points and places in the three categories. */
  readonly laurel = computed(() => {
    const h = this.game.hegemony();
    const me = this.game.player();
    if (!h || !h.places[me]) return null;
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const score = h.scores[me] ?? 0;
    const places = HEGEMONY_CATEGORIES.map(c => `${t.hegemonyCats[c].name} ${formatOrdinal(h.places[me][c], lang)}`).join(' · ');
    return { score: `${score}/9`, hint: interpolate(t.topLaurel, { s: score, places }), hegemon: h.hegemon === me };
  });

  openHegemony() {
    this.hud.tab.set('hegemony');
    this.hud.drawerOpen.set(true);
  }

  speedLabel(speed: number): string {
    return interpolate(this.i18n.t().speedN, { n: speed });
  }
}
