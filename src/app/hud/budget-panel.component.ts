import { Component, computed, effect, inject, signal } from '@angular/core';
import { LucideAngularModule, ChevronDown, Coins, Landmark, LucideIconData, Shield, Sprout, Wheat, Ship } from 'lucide-angular';
import { BreakpointService, TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber, formatRate, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { BUDGET_KEYS, BUDGET_MIN, BudgetKey, Purchase } from '../game/simulation';

/**
 * The permanent budget window: five sliders dividing all income between the military,
 * colonization, agriculture, trade and culture funds. Shares always add up to 100%, none below 5%;
 * each fund spends itself on what it is saving for.
 */
@Component({
  selector: 'app-budget-panel',
  standalone: true,
  imports: [LucideAngularModule, TooltipDirective],
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

  /** Collapsed to its header on small screens until opened. */
  readonly open = signal(true);

  constructor() {
    effect(() => this.open.set(!this.bp.tablet()));
  }

  readonly summary = computed(() => {
    const me = this.game.me();
    const lang = this.i18n.lang();
    return me ? { treasury: formatNumber(me.drachmae, lang), income: formatRate(me.income, lang), negative: me.income < 0 } : null;
  });

  readonly rows = computed(() => {
    const me = this.game.me();
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    if (!me) return [];
    return BUDGET_KEYS.map(key => {
      const next = me.purchases[key] ?? null;
      const fund = me.funds[key];
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
        progress: next ? Math.min(1, fund / Math.max(1, next.cost)) : 0
      };
    });
  });

  set(key: BudgetKey, event: Event) {
    this.game.setBudget(key, Number((event.target as HTMLInputElement).value));
  }

  toggle() {
    this.open.update(o => !o);
  }

  private purchaseName(p: Purchase): string {
    const t = this.i18n.t();
    return p.kind === 'improvement' ? t.improvements[p.id].name : t.purchases[p.kind];
  }
}
