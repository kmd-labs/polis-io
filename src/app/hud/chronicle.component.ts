import { Component, computed, inject } from '@angular/core';
import { LucideAngularModule, ScrollText } from 'lucide-angular';
import { BreakpointService } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { formatYear, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { POLEIS } from '../game/data/poleis';
import { GameEventKind } from '../game/simulation';

const TEMPLATE_KEY = {
  war: 'evWar',
  peace: 'evPeace',
  peaceRefused: 'evPeaceRefused',
  settle: 'evSettle',
  colony: 'evColony',
  fall: 'evFall'
} as const satisfies Record<GameEventKind, string>;

/** Floating feed of the latest wars, treaties, colonies and conquests (top-right, under the view switcher). */
@Component({
  selector: 'app-chronicle',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './chronicle.component.html',
  styleUrl: './chronicle.component.scss'
})
export class ChronicleComponent {
  readonly i18n = inject(I18nService);
  private readonly game = inject(GameService);
  private readonly bp = inject(BreakpointService);

  readonly scrollIcon = ScrollText;

  readonly entries = computed(() => {
    const t = this.i18n.t();
    const player = this.game.player();
    const name = (idx: number) => (idx >= 0 ? t.polisNames[POLEIS[idx].id] : '');
    const limit = this.bp.mobile() ? 2 : 5;
    return this.game
      .events()
      // Other poleis' settling and colonies are routine; only the player's own expeditions are news.
      .filter(e => (e.kind !== 'settle' && e.kind !== 'colony') || e.a === player)
      .slice(-limit)
      .reverse()
      .map(e => ({
        id: e.id,
        year: formatYear(e.year, t),
        text: interpolate(t[TEMPLATE_KEY[e.kind]], { a: name(e.a), b: name(e.b) }),
        mine: e.a === player || e.b === player,
        hostile: e.kind === 'war' || e.kind === 'fall'
      }));
  });
}
