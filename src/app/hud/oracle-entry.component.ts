import { Component, computed, inject } from '@angular/core';
import { I18nService } from '../core/i18n/i18n.service';
import { formatEta, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { RULES } from '../game/simulation';

/** The oracle at Delphi in the Polis tab: what it is, and the button to send envoys (once a year). */
@Component({
  selector: 'app-oracle-entry',
  standalone: true,
  template: `
    @let t = i18n.t();
    <section class="entry">
      <h3 class="entry__title">{{ t.oracleTitle }}</h3>
      <p class="entry__text">{{ t.oracleIntro }}</p>
      @if (state(); as s) {
        @if (s.ready) {
          <button type="button" class="entry__go" (click)="game.openOracle()">{{ t.oracleOpen }}</button>
        } @else {
          <p class="entry__wait">{{ s.wait }}</p>
        }
      }
    </section>
  `,
  styleUrl: './oracle-entry.component.scss'
})
export class OracleEntryComponent {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);

  readonly state = computed(() => {
    this.game.poleis();
    const sim = this.game.sim;
    const me = sim.poleis[this.game.player()];
    if (!me) return null;
    const t = this.i18n.t();
    return {
      ready: sim.oracleReady(me),
      wait: interpolate(t.oracleWait, { t: formatEta(sim.oracleWait(me), RULES.secondsPerYear, t, this.i18n.lang()) })
    };
  });
}
