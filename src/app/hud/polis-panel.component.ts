import { Component, computed, inject } from '@angular/core';
import { LucideAngularModule, Coins, MapIcon, Shield, Sprout, Swords, TrendingUp, Users, Pickaxe } from 'lucide-angular';
import { ButtonComponent, TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber, formatRate, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { POLEIS } from '../game/data/poleis';

/** Bottom-dock panel: the player's polis figures and its domestic actions. */
@Component({
  selector: 'app-polis-panel',
  standalone: true,
  imports: [LucideAngularModule, ButtonComponent, TooltipDirective],
  templateUrl: './polis-panel.component.html',
  styleUrl: './polis-panel.component.scss'
})
export class PolisPanelComponent {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);

  readonly icons = { Coins, MapIcon, Shield, Sprout, Swords, TrendingUp, Users, Pickaxe };

  readonly name = computed(() => {
    const me = this.game.me();
    return me ? this.i18n.t().polisNames[POLEIS[me.idx].id] : '';
  });

  readonly settleLabel = computed(() => {
    const t = this.i18n.t();
    const me = this.game.me();
    if (me?.expedition != null) return interpolate(t.settling, { p: Math.round(me.expedition * 100) });
    return t.settle;
  });

  readonly settleHint = computed(() => {
    const t = this.i18n.t();
    const me = this.game.me();
    if (!me) return '';
    if (!me.canSettle && me.expedition == null && this.game.sim.wildCells === 0) return t.settleNoLand;
    return interpolate(t.settleHint, { n: this.num(me.settlers) });
  });

  readonly trainHint = computed(() => {
    const me = this.game.me();
    return me ? interpolate(this.i18n.t().trainHint, { n: this.num(me.trainBatch), c: this.num(me.trainCost) }) : '';
  });

  num(value: number): string {
    return formatNumber(value, this.i18n.lang());
  }

  rate(value: number): string {
    return formatRate(value, this.i18n.lang());
  }

  percent(share: number): string {
    return `${(share * 100).toLocaleString(this.i18n.lang(), { maximumFractionDigits: 1 })}%`;
  }

  multiplier(value: number): string {
    return `×${value.toLocaleString(this.i18n.lang(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
