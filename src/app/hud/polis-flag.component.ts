import { Component, computed, input } from '@angular/core';
import { PolisDef } from '../game/data/poleis';
import { emblemFor } from '../game/data/emblems';

/** A small swallow-tailed banner in the polis's colour bearing its coin device or Greek initial. */
@Component({
  selector: 'app-polis-flag',
  standalone: true,
  templateUrl: './polis-flag.component.html',
  styleUrl: './polis-flag.component.scss'
})
export class PolisFlagComponent {
  readonly def = input.required<PolisDef>();
  /** Width in px; the banner is a little taller than wide. */
  readonly size = input(22);
  /** Accessible name, e.g. "Banner of Athens". */
  readonly label = input('');

  readonly emblem = computed(() => emblemFor(this.def()));
  readonly fill = computed(() => `var(--color-${this.def().color})`);
}
