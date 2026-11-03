import { Component, computed, inject } from '@angular/core';
import { PopupService } from '@kmd/design-system';
import {
  LucideAngularModule,
  Anchor,
  Building2,
  Coins,
  Crown,
  Flag,
  Handshake,
  Landmark,
  MapIcon,
  Pickaxe,
  Sailboat,
  Shield,
  Smile,
  Sprout,
  Swords,
  TrendingUp,
  Users,
  Wheat
} from 'lucide-angular';
import { ButtonComponent, TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber, formatRate, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { TraitPipsComponent } from './trait-pips.component';
import { PolisScreenComponent } from './polis-screen.component';

/** Bottom-dock panel: the player's polis figures and its domestic actions. */
@Component({
  selector: 'app-polis-panel',
  standalone: true,
  imports: [LucideAngularModule, ButtonComponent, TooltipDirective, TraitPipsComponent],
  templateUrl: './polis-panel.component.html',
  styleUrl: './polis-panel.component.scss'
})
export class PolisPanelComponent {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);

  readonly icons = { Anchor, Building2, Coins, Crown, Flag, Handshake, Landmark, Smile, MapIcon, Pickaxe, Sailboat, Shield, Sprout, Swords, TrendingUp, Users, Wheat };

  private readonly popup = inject(PopupService);

  /** Buildings under construction, shown on the Buildings button (e.g. "1/3"). */
  readonly building = computed(() => {
    const me = this.game.me();
    const works = me?.improvements.filter(b => b.state === 'building').length ?? 0;
    return works ? `⚒ ${works}` : '';
  });

  readonly moodLevel = computed(() => {
    const s = this.game.me()?.satisfaction ?? 0;
    return s >= 60 ? 'high' : s >= 35 ? 'mid' : 'low';
  });

  readonly moodHint = computed(() => {
    const me = this.game.me();
    if (!me) return '';
    return interpolate(this.i18n.t().satisfactionHint, {
      m: me.mood.toLocaleString(this.i18n.lang(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    });
  });

  /** Opens the Polis screen; the clock stands still while the citizens are consulted. */
  openPolis() {
    const wasPaused = this.game.paused();
    this.game.paused.set(true);
    this.popup.open({
      id: 'polis',
      title: computed(() => this.name()),
      component: PolisScreenComponent,
      size: 'lg',
      onClose: () => this.game.paused.set(wasPaused),
      actions: [{ label: computed(() => this.i18n.t().close), variant: 'default' }]
    });
  }

  round(value: number): number {
    return Math.round(value);
  }

  readonly name = computed(() => {
    const me = this.game.me();
    this.i18n.t();
    return me ? this.game.name(me.idx) : '';
  });

  readonly workersHint = computed(() => {
    const t = this.i18n.t();
    const me = this.game.me();
    if (!me?.slaves) return t.statWorkersHint;
    return `${t.statWorkersHint} ${interpolate(t.slavesHint, { n: this.num(me.slaves) })}`;
  });

  readonly holdingsHint = computed(() => {
    const me = this.game.me();
    if (!me) return '';
    const lang = this.i18n.lang();
    const fmt = (v: number) => v.toLocaleString(lang, { maximumFractionDigits: 1 });
    const t = this.i18n.t();
    const hint = interpolate(t.buildingsHint, { v: fmt(me.tradeValue), t: fmt(me.tradeEarned) });
    return me.tributeGold || me.tributeWorkers
      ? `${hint} ${interpolate(t.tributeHint, { g: this.num(me.tributeGold), w: this.num(me.tributeWorkers) })}`
      : hint;
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
