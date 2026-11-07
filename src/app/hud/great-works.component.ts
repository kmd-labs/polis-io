import { Component, computed, inject } from '@angular/core';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { GreatWorkId } from '../game/data/frontier';

/**
 * The Polis tab's "Great works": where silver that no fund can spend goes — a treasury at Delphi,
 * a great temple, city walls or a water tunnel — with the progress of the chosen one.
 */
@Component({
  selector: 'app-great-works',
  standalone: true,
  templateUrl: './great-works.component.html',
  styleUrl: './great-works.component.scss'
})
export class GreatWorksComponent {
  readonly i18n = inject(I18nService);
  private readonly game = inject(GameService);

  readonly view = computed(() => {
    const me = this.game.me();
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    if (!me) return null;
    return {
      chosen: me.greatWork,
      works: me.greatWorks.map(w => {
        const chosen = me.greatWork === w.id;
        return {
          ...w,
          name: t.greatWorks[w.id].name,
          desc: t.greatWorks[w.id].desc,
          chosen,
          progress: chosen ? Math.min(1, me.greatFund / w.cost) : 0,
          status: chosen
            ? interpolate(t.greatProgress, { f: formatNumber(me.greatFund, lang), c: formatNumber(w.cost, lang) })
            : !w.open
              ? t.greatDone
              : `${formatNumber(w.cost, lang)} dr`,
          built: w.built ? interpolate(t.greatBuilt, { n: w.built }) : ''
        };
      })
    };
  });

  choose(id: GreatWorkId | null) {
    this.game.setGreatWork(id);
  }
}
