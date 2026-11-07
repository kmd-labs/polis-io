import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { LucideAngularModule, ChevronDown, Coins, Landmark, LucideIconData, Shield, Sprout, Wheat, Ship } from 'lucide-angular';
import { BreakpointService, TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { fmt1, formatEta, formatNumber, formatRate, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { BUDGET_KEYS, BUDGET_MIN, BudgetKey, Purchase, RULES, SurplusUse } from '../game/simulation';
import { PRESET_IDS, PresetId, presetOf } from '../game/economy';

/**
 * The permanent budget window: five sliders dividing all income between the military,
 * colonization, agriculture, trade and culture funds. Shares always add up to 100%, none below 5%;
 * each fund spends itself on what it is saving for.
 */
@Component({
  selector: 'app-budget-panel',
  standalone: true,
  imports: [LucideAngularModule, TooltipDirective],
  host: { '[class.embedded]': 'embedded()' },
  templateUrl: './budget-panel.component.html',
  styleUrl: './budget-panel.component.scss'
})
export class BudgetPanelComponent {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);
  private readonly bp = inject(BreakpointService);

  readonly icons = { ChevronDown, Coins };
  readonly min = BUDGET_MIN;
  readonly max = 100 - BUDGET_MIN * (BUDGET_KEYS.length - 1);
  private readonly keyIcons: Record<BudgetKey, LucideIconData> = {
    military: Shield,
    colonization: Sprout,
    agriculture: Wheat,
    trade: Ship,
    culture: Landmark
  };

  /** Inside the HUD drawer: always open, no frame or heading of its own. */
  readonly embedded = input(false);

  /** While a slider is held: each fund's headline figure from before the move, to show "before → now". */
  private readonly before = signal<Partial<Record<BudgetKey, string>> | null>(null);
  private releaseTimer = 0;

  readonly presets = computed(() => {
    const t = this.i18n.t();
    const me = this.game.me();
    const active = me ? presetOf(me.budget) : 'custom';
    return {
      active,
      items: PRESET_IDS.map(id => ({ id, label: t.presets[id], hint: t.presetHints[id], on: active === id })),
      custom: t.presets.custom
    };
  });

  /** Collapsed to its header on small screens until opened. */
  readonly open = signal(true);

  constructor() {
    effect(() => this.open.set(this.embedded() || !this.bp.tablet()));
  }

  readonly summary = computed(() => {
    const me = this.game.me();
    const lang = this.i18n.lang();
    return me ? { treasury: formatNumber(me.drachmae, lang), income: formatRate(this.game.perMonth(me.income), lang), negative: me.income < 0 } : null;
  });

  readonly rows = computed(() => {
    const me = this.game.me();
    const forecasts = this.game.forecasts();
    const before = this.before();
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    if (!me || !forecasts) return [];
    return BUDGET_KEYS.map(key => {
      const next = me.purchases[key] ?? null;
      const fund = me.funds[key];
      const forecast = this.forecastLine(key);
      const was = before?.[key];
      // The colonization row follows the expedition on the march; the military row the army's size.
      const extra =
        key === 'military'
          ? interpolate(t.armyStatus, { w: formatNumber(me.warriors, lang), t: formatNumber(me.armyTarget, lang) })
          : key === 'colonization' && me.expedition !== null
            ? interpolate(t.expeditionUnderway, { p: Math.round(me.expedition * 100) })
            : '';
      return {
        key,
        extra,
        icon: this.keyIcons[key],
        name: t.budgetKeys[key].name,
        desc: t.budgetKeys[key].desc,
        share: me.budget[key],
        fund: formatNumber(fund, lang),
        next: next ? interpolate(t.nextPurchase, { what: this.purchaseName(next), c: formatNumber(next.cost, lang) }) : t.savingOnly,
        forecast,
        was: was !== undefined && was !== forecast.metric ? was : null,
        progress: next ? Math.min(1, fund / Math.max(1, next.cost)) : 0
      };
    });
  });

  set(key: BudgetKey, event: Event) {
    this.hold();
    this.game.setBudget(key, Number((event.target as HTMLInputElement).value));
  }

  /** A slider is grabbed: remember every fund's headline figure so the change can be shown. */
  hold() {
    clearTimeout(this.releaseTimer);
    if (this.before()) return;
    this.before.set(Object.fromEntries(BUDGET_KEYS.map(k => [k, this.forecastLine(k).metric])));
  }

  /** Let go: keep the comparison on screen a moment longer. */
  release() {
    clearTimeout(this.releaseTimer);
    this.releaseTimer = window.setTimeout(() => this.before.set(null), 2500);
  }

  readonly surplusUses: readonly SurplusUse[] = ['none', 'mercenaries', 'fleet'];

  /** The military row's choice of what to buy once the army is full. */
  readonly surplus = computed(() => {
    const me = this.game.me();
    const t = this.i18n.t();
    if (!me) return null;
    return {
      label: t.surplusLabel,
      options: this.surplusUses.map(use => ({
        use,
        name: t.surplusUses[use].name,
        hint: use === 'fleet' && !me.hasHarbour ? t.surplusNoHarbour : t.surplusUses[use].hint,
        on: me.surplus === use,
        disabled: use === 'fleet' && !me.hasHarbour
      }))
    };
  });

  setSurplus(use: SurplusUse) {
    this.game.setSurplus(use);
  }

  applyPreset(id: PresetId) {
    this.game.applyPreset(id);
  }

  /**
   * One fund's forecast as text: the headline figure (time to the next purchase, or hoplites a year)
   * between its words, what that purchase brings, and a warning if pay is running out.
   */
  private forecastLine(key: BudgetKey): { pre: string; metric: string; post: string; warn: string } {
    const me = this.game.me()!;
    const fc = this.game.forecasts()![key];
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const next = me.purchases[key] ?? null;
    const eta = (s: number | null) => (s === null ? t.fcStalled : formatEta(s, RULES.secondsPerYear, t, lang));
    const pay = interpolate(t.fcPay, { u: fmt1(this.game.perMonth(me.upkeep), lang) });
    const warn = fc.desertIn !== null ? interpolate(t.fcDesert, { t: eta(fc.desertIn) }) : '';
    if (!next) {
      const idle =
        key === 'colonization' && me.colonyIn > 0 && !me.colonyBlocked
          ? interpolate(t.fcColonyWait, { t: eta(me.colonyIn) })
          : key === 'colonization' && me.colonyBlocked
          ? t.fcBlocked
          : key === 'military' && me.surplus === 'mercenaries' && !me.wars.length
            ? t.fcMercenariesPeace
            : t.fcIdle;
      return { pre: key === 'military' ? `${pay} · ` : '', metric: '', post: idle, warn };
    }
    if (next.kind === 'hoplites') {
      const [pre, post] = t.fcHoplites.split('{t}');
      const perYear = Math.round(fc.hoplitesPerSecond * RULES.secondsPerYear);
      return { pre, metric: formatNumber(perYear, lang), post: `${post} · ${pay}`, warn };
    }
    const effect =
      next.kind === 'farm'
        ? interpolate(t.fcFarm, { n: formatNumber(RULES.farmCapacity, lang) })
        : next.kind === 'port'
          ? interpolate(t.fcPort, { n: Math.round(RULES.portBonus * 100) })
          : next.kind === 'festival'
            ? interpolate(t.fcFestival, { n: RULES.festivalMood })
            : next.kind === 'expedition'
              ? interpolate(t.fcExpedition, { n: formatNumber(me.settlers, lang) })
              : next.kind === 'colony'
                ? t.fcColonyCity
                : next.kind === 'mercenaries'
                  ? interpolate(t.fcMercenaries, { n: formatNumber(Math.round(next.cost / RULES.mercenaryCost), lang) })
                  : next.kind === 'warship'
                    ? interpolate(t.fcWarship, { n: me.warships, m: me.warships + 1 })
                : key === 'military'
                  ? pay
                  : '';
    const [pre, post] = t.fcNext.replace('{what}', this.purchaseName(next)).split('{t}');
    const what = pre.charAt(0).toUpperCase() + pre.slice(1);
    return { pre: what, metric: eta(fc.eta), post: effect ? `${post} · ${effect}` : post, warn };
  }

  toggle() {
    this.open.update(o => !o);
  }

  private purchaseName(p: Purchase): string {
    const t = this.i18n.t();
    return p.kind === 'improvement' ? t.improvements[p.id].name : t.purchases[p.kind];
  }
}
