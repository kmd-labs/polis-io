import { Component, computed, input } from '@angular/core';
import { TooltipDirective } from '@kmd/design-system';

/** A 1–5 polis trait (militarism, culture) shown as a label and a row of pips. */
@Component({
  selector: 'app-trait-pips',
  standalone: true,
  imports: [TooltipDirective],
  templateUrl: './trait-pips.component.html',
  styleUrl: './trait-pips.component.scss'
})
export class TraitPipsComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly kind = input<'militarism' | 'culture'>('militarism');
  readonly hint = input<string | null>(null);

  readonly pips = computed(() => [1, 2, 3, 4, 5].map(n => n <= this.value()));
}
