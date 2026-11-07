import { Component, computed, inject } from '@angular/core';
import { I18nService } from '../core/i18n/i18n.service';
import { GameService } from '../game/game.service';
import { PolisFlagComponent } from './polis-flag.component';

type Standing = 'war' | 'ally' | 'vassal' | 'client' | 'peace';

/**
 * Drawer tab "Diplomacy": every living polis with its standing towards the player and the
 * reputation between them. Wars come first, then allies, then the rest by reputation.
 */
@Component({
  selector: 'app-diplomacy-list',
  standalone: true,
  imports: [PolisFlagComponent],
  templateUrl: './diplomacy-list.component.html',
  styleUrl: './diplomacy-list.component.scss'
})
export class DiplomacyListComponent {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);

  readonly rows = computed(() => {
    const me = this.game.me();
    const t = this.i18n.t();
    if (!me) return [];
    const order: Record<Standing, number> = { war: 0, ally: 1, vassal: 2, client: 2, peace: 3 };
    return this.game
      .poleis()
      .filter(p => p.alive && !p.tribe && !p.trader && p.idx !== me.idx)
      .map(p => {
        const standing: Standing = me.wars.includes(p.idx)
          ? 'war'
          : me.allies.includes(p.idx)
            ? 'ally'
            : p.overlord === me.idx
              ? p.client
                ? 'client'
                : 'vassal'
              : 'peace';
        const rel = Math.round(p.relation);
        return {
          idx: p.idx,
          def: this.game.sim.poleis[p.idx].def,
          name: this.game.name(p.idx),
          standing,
          label: t.standings[standing],
          relation: rel > 0 ? `+${rel}` : `${rel}`,
          tone: rel <= -15 ? 'bad' : rel >= 15 ? 'good' : 'mid',
          rel
        };
      })
      .sort((a, b) => order[a.standing] - order[b.standing] || b.rel - a.rel);
  });
}
