import { Component, computed, inject } from '@angular/core';
import { LucideAngularModule, Check, Coins, Hammer, Lock, Shield, Smile, Wheat } from 'lucide-angular';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { TREES } from '../game/data/improvements';

/** The "Polis" screen: three trees of six buildings each, built one year at a time. */
@Component({
  selector: 'app-polis-screen',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './polis-screen.component.html',
  styleUrl: './polis-screen.component.scss'
})
export class PolisScreenComponent {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);

  readonly icons = { Check, Coins, Hammer, Lock, Smile };
  private readonly treeIcons = { agriculture: Wheat, trade: Coins, military: Shield };

  readonly trees = computed(() => {
    const t = this.i18n.t();
    const me = this.game.me();
    const lang = this.i18n.lang();
    if (!me) return [];
    return TREES.map(tree => ({
      tree,
      icon: this.treeIcons[tree],
      title: t.trees[tree],
      items: me.improvements
        .filter(b => b.tree === tree)
        .sort((a, b) => a.tier - b.tier)
        .map(b => ({
          ...b,
          name: t.improvements[b.id].name,
          desc: t.improvements[b.id].desc,
          cost: interpolate(t.buildCost, { d: formatNumber(b.drachmae, lang), s: b.satisfaction }),
          funding: interpolate(t.fundedBy, {
            budget: t.budgetKeys[b.tree].name,
            f: formatNumber(Math.min(b.saved, b.drachmae), lang),
            c: formatNumber(b.drachmae, lang)
          }),
          funded: Math.min(1, b.saved / b.drachmae)
        }))
    }));
  });

  readonly mood = computed(() => {
    const me = this.game.me();
    return me ? Math.round(me.satisfaction) : 0;
  });
}
