import { Component, computed, inject, input } from '@angular/core';
import { Castle, LucideAngularModule, LucideIconData, Scale, Shield, Sword, Swords } from 'lucide-angular';
import { TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { GameService } from '../game/game.service';
import { POSTURES, Posture } from '../game/war';

const ICONS: Record<Posture, LucideIconData> = { 2: Swords, 1: Sword, 0: Scale, [-1]: Shield, [-2]: Castle };

/**
 * How boldly the city fights one war: five postures from an all-out offensive to sheltering behind the
 * walls. Laid out as a list of choices in a letter, or as a row of tiles in the city card.
 */
@Component({
  selector: 'app-war-posture',
  standalone: true,
  imports: [LucideAngularModule, TooltipDirective],
  template: `
    @let t = i18n.t();
    <div class="posture" [class.posture--compact]="compact()" role="radiogroup" [attr.aria-label]="t.postureLabel">
      @for (o of options(); track o.value) {
        <button
          type="button"
          role="radio"
          class="posture__opt"
          [class.posture__opt--on]="o.on"
          [attr.aria-checked]="o.on"
          [attr.aria-label]="o.name"
          [disabled]="o.disabled"
          [appTooltip]="compact() ? o.name + ' — ' + o.hint : null"
          (click)="pick(o.value)">
          <lucide-icon class="posture__icon" [img]="o.icon" [size]="compact() ? 15 : 18"></lucide-icon>
          @if (!compact()) {
            <span class="posture__text">
              <span class="posture__name">{{ o.name }}</span>
              <span class="posture__hint">{{ o.hint }}</span>
            </span>
          }
        </button>
      }
    </div>
    @if (locked()) {
      <p class="posture__note">{{ t.postureCooldown }}</p>
    }
  `,
  styleUrl: './war-posture.component.scss'
})
export class WarPostureComponent {
  readonly i18n = inject(I18nService);
  private readonly game = inject(GameService);

  readonly enemy = input.required<number>();
  readonly compact = input(false);
  /** Called after a choice (the letter closes itself). */
  readonly done = input<(() => void) | null>(null);

  readonly options = computed(() => {
    this.game.poleis();
    const t = this.i18n.t();
    const current = this.game.posture(this.enemy());
    const free = this.game.canChangePosture(this.enemy());
    return POSTURES.map((value, i) => ({
      value,
      icon: ICONS[value],
      name: t.postures[i].name,
      hint: t.postures[i].hint,
      on: value === current,
      disabled: !free && value !== current
    }));
  });

  readonly locked = computed(() => {
    this.game.poleis();
    return !this.game.canChangePosture(this.enemy());
  });

  pick(value: Posture) {
    this.game.setPosture(this.enemy(), value);
    this.done()?.();
  }
}
