import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { I18nService } from '../core/i18n/i18n.service';
import { fmt1, formatNumber, formatYear, interpolate } from '../core/i18n/format';
import { DILEMMA_BY_ID, DilemmaChoice, DilemmaId } from '../game/data/dilemmas';
import { eventSceneSvg } from './event-scene';

/**
 * A choice put before the player, laid out like a grand-strategy event: a painted scene, the story,
 * and one wide button per answer listing what it will do.
 */
@Component({
  selector: 'app-event-card',
  standalone: true,
  template: `
    @let t = i18n.t();
    <article class="event">
      <figure class="event__scene" [innerHTML]="scene()"></figure>
      <p class="event__date">{{ date() }}</p>
      <p class="event__text">{{ text() }}</p>
      <ol class="event__options">
        @for (o of options(); track o.id) {
          <li>
            <button type="button" class="option" [disabled]="!o.affordable" (click)="choose()(o.id)">
              <span class="option__label">{{ o.label }}</span>
              <span class="option__effects">
                @for (fx of o.effects; track $index) {
                  <span class="fx" [class.fx--good]="fx.good" [class.fx--bad]="!fx.good">{{ fx.text }}</span>
                } @empty {
                  <span class="fx fx--none">{{ t.fx.none }}</span>
                }
                @if (!o.affordable) {
                  <span class="fx fx--bad">{{ t.fx.cantAfford }}</span>
                }
              </span>
            </button>
          </li>
        }
      </ol>
      <p class="event__hint">{{ t.dilemmaPutAside }}</p>
    </article>
  `,
  styleUrl: './event-card.component.scss'
})
export class EventCardComponent {
  readonly i18n = inject(I18nService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly id = input.required<DilemmaId>();
  readonly year = input.required<number>();
  readonly choices = input.required<DilemmaChoice[]>();
  readonly choose = input.required<(option: string) => void>();

  // The scene is our own static markup (no user content), safe to insert as SVG.
  readonly scene = computed(() => this.sanitizer.bypassSecurityTrustHtml(eventSceneSvg(DILEMMA_BY_ID.get(this.id())!.scene)));
  readonly date = computed(() => formatYear(this.year(), this.i18n.t()));
  readonly text = computed(() => this.i18n.t().dilemmas[this.id()].text);

  readonly options = computed(() => {
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const labels = t.dilemmas[this.id()].options;
    const signed = (v: number, digits = false) => (v > 0 ? '+' : '−') + (digits ? fmt1(Math.abs(v), lang) : formatNumber(Math.abs(v), lang));
    return this.choices().map(c => {
      const e = c.effects;
      const fx: { text: string; good: boolean }[] = [];
      const add = (v: number | undefined, tpl: string, digits = false, invert = false) => {
        if (!v) return;
        fx.push({ text: interpolate(tpl, { v: signed(v, digits) }), good: invert ? v < 0 : v > 0 });
      };
      if (c.silver) fx.push({ text: interpolate(t.fx.silver, { v: signed(c.silver) }), good: c.silver > 0 });
      if (c.colonize) fx.push({ text: interpolate(t.fx.colonize, { v: formatNumber(c.colonize, lang) }), good: true });
      add(e.prestige, t.fx.prestige, true);
      add(e.mood, t.fx.mood);
      add(e.culture, t.fx.culture, true);
      add(e.militarism, t.fx.militarism, true);
      add(e.regard, t.fx.regard);
      if (e.hoplites) {
        fx.push({
          text: interpolate(e.hoplites > 0 ? t.fx.hoplitesUp : t.fx.hoplitesDown, { v: fmt1(Math.abs(e.hoplites) * 100, lang) }),
          good: e.hoplites > 0
        });
      }
      if (e.people) fx.push({ text: interpolate(t.fx.people, { v: (e.people > 0 ? '+' : '−') + fmt1(Math.abs(e.people) * 100, lang) }), good: e.people > 0 });
      if (e.prosperity) fx.push({ text: interpolate(t.fx.prosperity, { v: (e.prosperity > 0 ? '+' : '−') + Math.round(Math.abs(e.prosperity) * 100) }), good: e.prosperity > 0 });
      return { id: c.id, label: labels[c.id] ?? c.id, affordable: c.affordable, effects: fx };
    });
  });
}
