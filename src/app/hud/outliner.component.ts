import { Component, computed, inject } from '@angular/core';
import { LucideAngularModule, ChevronDown, Handshake, ScrollText, Swords, Tent } from 'lucide-angular';
import { TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { ChronicleComponent } from './chronicle.component';
import { HudStateService, OutlinerGroup } from './hud-state.service';
import { PolisFlagComponent } from './polis-flag.component';

/**
 * The right-hand outliner: the player's wars (with a strength bar), allies, sieges and the latest
 * chronicle entries. Each group folds; clicking a city selects it and brings it into view.
 */
@Component({
  selector: 'app-outliner',
  standalone: true,
  imports: [LucideAngularModule, TooltipDirective, ChronicleComponent, PolisFlagComponent],
  templateUrl: './outliner.component.html',
  styleUrl: './outliner.component.scss'
})
export class OutlinerComponent {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);
  readonly hud = inject(HudStateService);

  readonly icons = { ChevronDown, Handshake, ScrollText, Swords, Tent };

  /** Each war with our share of the hoplites both sides can field (0–1). */
  readonly wars = computed(() => {
    const me = this.game.me();
    const all = this.game.poleis();
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    if (!me) return [];
    return me.wars.map(idx => {
      const foe = all[idx];
      const ours = me.warriors;
      const theirs = foe?.warriors ?? 0;
      return {
        idx,
        name: this.game.name(idx),
        def: this.game.sim.poleis[idx].def,
        // The balance of the war (−100…+100) as a share of the bar.
        advantage: (this.game.warScore(idx) + 100) / 200,
        hint: `${t.warScoreLabel}: ${Math.round(this.game.warScore(idx))} · ${interpolate(t.outAdvantageHint, { a: formatNumber(ours, lang), b: formatNumber(theirs, lang) })}`
      };
    });
  });

  readonly allies = computed(() => {
    const me = this.game.me();
    this.i18n.t();
    return (me?.allies ?? []).map(idx => ({ idx, name: this.game.name(idx), def: this.game.sim.poleis[idx].def }));
  });

  /** Sieges the player is part of: our armies before enemy walls, or enemies before ours or an ally's. */
  readonly sieges = computed(() => {
    const me = this.game.me();
    this.game.poleis();
    const t = this.i18n.t();
    if (!me) return [];
    const friends = new Set([me.idx, ...me.allies]);
    const seen = new Set<string>();
    const out: { key: string; city: number; text: string; ours: boolean }[] = [];
    for (const a of this.game.sim.armies) {
      if (a.dead || a.siege < 0) continue;
      const ours = a.owner === me.idx;
      if (!ours && !friends.has(a.siege)) continue;
      const key = `${a.owner}-${a.siege}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        key,
        city: a.siege,
        ours,
        text: interpolate(ours ? t.outSiegeOurs : t.outSiegeTheirs, { a: this.game.name(a.owner), b: this.game.name(a.siege) })
      });
    }
    return out;
  });

  folded(group: OutlinerGroup): boolean {
    return this.hud.folded().includes(group);
  }
}
