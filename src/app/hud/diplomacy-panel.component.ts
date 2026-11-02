import { Component, computed, inject } from '@angular/core';
import { LucideAngularModule, Handshake, MapIcon, Swords, Users, X } from 'lucide-angular';
import { BadgeComponent, ButtonComponent, ThemeService, TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { TraitPipsComponent } from './trait-pips.component';

/** Bottom-dock panel: the selected foreign polis (declare war / offer peace) or the list of ongoing wars. */
@Component({
  selector: 'app-diplomacy-panel',
  standalone: true,
  imports: [LucideAngularModule, BadgeComponent, ButtonComponent, TooltipDirective, TraitPipsComponent],
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
    return this.atWar()
      ? { text: t.atWar, color: this.theme.getTokenColor('danger') }
      : { text: t.atPeace, color: this.theme.getTokenColor('success-600') };
  });

  readonly fallenTo = computed(() => {
    const target = this.game.target();
    return target && !target.alive && target.conqueror >= 0
      ? interpolate(this.i18n.t().fallenTo, { b: this.name(target.conqueror) })
      : '';
  });

  readonly peaceReady = computed(() => {
    const target = this.game.target();
    this.game.poleis();
    return !!target && this.game.canOfferPeace(target.idx);
  });

  readonly vassalOf = computed(() => {
    const target = this.game.target();
    return target && target.overlord >= 0 ? interpolate(this.i18n.t().vassalOf, { b: this.name(target.overlord) }) : '';
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
