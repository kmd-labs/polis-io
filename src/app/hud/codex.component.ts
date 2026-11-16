import { Component, computed, inject } from '@angular/core';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { AMBITIONS } from '../game/ambitions';
import { DILEMMAS } from '../game/data/dilemmas';
import { ORACLE_OUTCOMES } from '../game/oracle';
import { SCENARIOS } from '../game/codex';

/** The Codex of Hellas: what the player has seen across all games — the found and the still hidden. */
@Component({
  selector: 'app-codex',
  standalone: true,
  template: `
    @let t = i18n.t();
    @let v = view();
    <section class="codex">
      <h3 class="codex__title">{{ t.codexTitle }}</h3>
      <p class="codex__intro">{{ t.codexIntro }}</p>
      @for (part of v.parts; track part.key) {
        <details class="part" [open]="part.key === 'verses'">
          <summary class="part__head">
            <span>{{ part.title }}</span>
            <span class="part__count">{{ part.found }} / {{ part.items.length }}</span>
          </summary>
          <ul class="part__list">
            @for (item of part.items; track $index) {
              <li class="part__item" [class.part__item--locked]="!item.found">{{ item.found ? item.text : '— ' + t.codexLocked + ' —' }}</li>
            }
          </ul>
        </details>
      }
      <p class="codex__line">{{ t.codexWreaths }}: <b>{{ v.wreaths }}</b></p>
      @if (v.best.length) {
        <p class="codex__line">{{ t.codexBest }}:</p>
        <ul class="part__list">
          @for (b of v.best; track b.id) {
            <li class="part__item">{{ b.title }} — <b>{{ b.score }}</b></li>
          }
        </ul>
      }
    </section>
  `,
  styleUrl: './codex.component.scss'
})
export class CodexComponent {
  readonly i18n = inject(I18nService);
  private readonly game = inject(GameService);

  readonly view = computed(() => {
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const c = this.game.codex();
    const verses = ORACLE_OUTCOMES.flatMap(o =>
      t.oracleOutcomes[o].verses.map((text, i) => ({ found: c.verses.includes(`${o}.${i}`), text: `${t.oracleOutcomes[o].name}: ${text}` }))
    );
    const events = DILEMMAS.map(d => ({ found: c.events.includes(d.id), text: t.dilemmas[d.id].title }));
    const ambitions = AMBITIONS.map(a => ({ found: c.ambitions.includes(a.id), text: t.ambitions[a.id].name }));
    const count = (items: { found: boolean }[]) => items.filter(i => i.found).length;
    return {
      parts: [
        { key: 'verses', title: t.codexVerses, items: verses, found: count(verses) },
        { key: 'events', title: t.codexEvents, items: events, found: count(events) },
        { key: 'ambitions', title: t.codexAmbitions, items: ambitions, found: count(ambitions) }
      ],
      wreaths: formatNumber(c.wreaths, lang),
      best: SCENARIOS.filter(s => c.best[s.id]).map(s => ({ id: s.id, title: t.scenarios[s.id].title, score: formatNumber(c.best[s.id], lang) }))
    };
  });
}
