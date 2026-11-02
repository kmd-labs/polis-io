import { Component, computed, effect, inject } from '@angular/core';
import { LucideAngularModule, MapIcon, Play, Swords, Users } from 'lucide-angular';
import { ButtonComponent } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { POLEIS } from '../game/data/poleis';

/**
 * Opening screen: a frosted list of the eighteen poleis beside the live map. Hovering a card
 * highlights the city-state on the map; picking one flies the camera there; "Lead" starts the game.
 */
@Component({
  selector: 'app-start-screen',
  standalone: true,
  imports: [LucideAngularModule, ButtonComponent],
  templateUrl: './start-screen.component.html',
  styleUrl: './start-screen.component.scss'
})
export class StartScreenComponent {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);

  readonly icons = { MapIcon, Play, Swords, Users };

  readonly cards = computed(() => {
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const views = this.game.poleis();
    return POLEIS.map((def, idx) => {
      const v = views[idx];
      return {
        idx,
        color: def.color,
        name: t.polisNames[def.id],
        region: t.polisInfo[def.id].region,
        blurb: t.polisInfo[def.id].blurb,
        people: v ? formatNumber(v.total, lang) : '',
        warriors: v ? formatNumber(v.warriors, lang) : '',
        area: v ? interpolate(t.areaKm2, { n: formatNumber(Math.round(v.area / 10) * 10, lang) }) : ''
      };
    });
  });

  readonly chosen = computed(() => this.cards()[this.game.selected()] ?? null);

  readonly leadLabel = computed(() => {
    const c = this.chosen();
    const t = this.i18n.t();
    return c ? interpolate(t.startLead, { name: c.name }) : t.startHint;
  });

  constructor() {
    // A polis picked on the map scrolls its card into view.
    effect(() => {
      const idx = this.game.selected();
      if (idx < 0) return;
      requestAnimationFrame(() =>
        document.getElementById(`polis-card-${idx}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      );
    });
  }
}
