import { Component, computed, inject } from '@angular/core';
import { LucideAngularModule, Handshake, MapIcon, Swords, Users, X } from 'lucide-angular';
import { BadgeComponent, ButtonComponent, ThemeService, TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber, formatYear, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { RULES } from '../game/simulation';
import { TraitPipsComponent } from './trait-pips.component';
import { PolisFlagComponent } from './polis-flag.component';
import { WarPostureComponent } from './war-posture.component';


/** Bottom-dock panel: the selected foreign polis (declare war / offer peace) or the list of ongoing wars. */
@Component({
  selector: 'app-diplomacy-panel',
  standalone: true,
  imports: [LucideAngularModule, BadgeComponent, ButtonComponent, TooltipDirective, TraitPipsComponent, PolisFlagComponent, WarPostureComponent],
  templateUrl: './diplomacy-panel.component.html',
  styleUrl: './diplomacy-panel.component.scss'
})
export class DiplomacyPanelComponent {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);
  private readonly theme = inject(ThemeService);

  readonly icons = { Handshake, MapIcon, Swords, Users, X };

  readonly atWar = computed(() => {
    const target = this.game.target();
    return !!target && !!this.game.me()?.wars.includes(target.idx);
  });

  readonly statusBadge = computed(() => {
    const t = this.i18n.t();
    const target = this.game.target();
    if (!target) return null;
    if (!target.alive) return { text: t.fallen, color: this.theme.getTokenColor('neutral-500') };
    if (this.atWar()) return { text: t.atWar, color: this.theme.getTokenColor('danger') };
    if (this.game.me()?.allies.includes(target.idx)) return { text: t.ally, color: this.theme.getTokenColor('accent') };
    return { text: t.atPeace, color: this.theme.getTokenColor('success-600') };
  });

  readonly fallenTo = computed(() => {
    const target = this.game.target();
    return target && !target.alive && target.conqueror >= 0
      ? interpolate(this.i18n.t().fallenTo, { b: this.name(target.conqueror) })
      : '';
  });

  /** The war with the selected city: its balance and our strategos. */
  readonly war = computed(() => {
    const target = this.game.target();
    this.game.poleis();
    if (!target || !this.atWar()) return null;
    const score = Math.round(this.game.warScore(target.idx));
    const stars = this.game.sim.strategos(this.game.player(), target.idx);
    return { score: (score > 0 ? '+' : '') + score, fill: (score + 100) / 2, stars: '★'.repeat(stars) + '☆'.repeat(3 - stars) };
  });

  /** Why war cannot be declared on the selected city right now, if it cannot. */
  readonly declareBlock = computed(() => {
    const target = this.game.target();
    this.game.poleis();
    const t = this.i18n.t();
    if (!target) return '';
    if (this.game.truce()) return t.truceHint;
    const sim = this.game.sim;
    const me = sim.poleis[this.game.player()];
    if (!me) return '';
    const until = me.treaties.get(target.idx) ?? 0;
    if (until > sim.time) {
      const year = sim.year - Math.floor((until - sim.time) / RULES.secondsPerYear);
      return interpolate(t.treatyHint, { year: formatYear(year, t) });
    }
    if (!sim.canDeclareWar(me.idx, target.idx)) return t.maxWarsHint;
    return '';
  });

  readonly peaceReady = computed(() => {
    const target = this.game.target();
    this.game.poleis();
    return !!target && this.game.canOfferPeace(target.idx);
  });

  readonly vassalOf = computed(() => {
    const target = this.game.target();
    if (!target || target.overlord < 0) return '';
    return interpolate(target.client ? this.i18n.t().clientOf : this.i18n.t().vassalOf, { b: this.name(target.overlord) });
  });

  /** Reputation with the selected polis: −100…+100 mapped to a centred bar and a word. */
  readonly relation = computed(() => {
    const target = this.game.target();
    if (!target) return null;
    const t = this.i18n.t();
    const v = Math.round(target.relation);
    const level = v <= -50 ? 'hostile' : v < -15 ? 'unfriendly' : v <= 15 ? 'neutral' : v < 50 ? 'friendly' : 'cordial';
    return {
      value: v > 0 ? `+${v}` : `${v}`,
      word: t.relationLevels[level],
      level,
      left: Math.min(50, 50 + v / 2),
      width: Math.abs(v) / 2
    };
  });

  name(idx: number): string {
    this.i18n.t();
    return this.game.name(idx);
  }

  num(value: number): string {
    return formatNumber(value, this.i18n.lang());
  }

  percent(share: number): string {
    return `${(share * 100).toLocaleString(this.i18n.lang(), { maximumFractionDigits: 1 })}%`;
  }
}
