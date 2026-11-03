import { Component, computed, input, signal } from '@angular/core';

export interface ChartPoint {
  year: number;
  value: number;
}

export interface ChartMarker {
  year: number;
  label: string;
  kind: 'budget' | 'war' | 'peace' | 'built';
}

const W = 280;
const H = 64;
const PAD_TOP = 6;
const PAD_BOTTOM = 4;

/**
 * A small single-series line chart in plain SVG: one 2px line over a recessive frame, vertical
 * markers for notable moments, and a crosshair with a tooltip on hover. Years count down (BC), so
 * the x axis runs from the first recorded year to the last. A hidden table carries the numbers.
 */
@Component({
  selector: 'app-line-chart',
  standalone: true,
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.scss'
})
export class LineChartComponent {
  readonly title = input.required<string>();
  readonly points = input.required<ChartPoint[]>();
  readonly markers = input<ChartMarker[]>([]);
  /** Shared time domain for small multiples: first and last year shown. */
  readonly from = input.required<number>();
  readonly to = input.required<number>();
  readonly format = input.required<(value: number) => string>();
  readonly formatYear = input.required<(year: number) => string>();
  /** CSS colour token for the line, e.g. 'accent'. */
  readonly color = input('accent');

  readonly w = W;
  readonly h = H;
  readonly hover = signal<number | null>(null);

  private readonly span = computed(() => Math.max(1, this.from() - this.to()));
  private readonly range = computed(() => {
    const values = this.points().map(p => p.value);
    if (!values.length) return { min: 0, max: 1 };
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (max - min < 1e-6) {
      min -= 1;
      max += 1;
    }
    const pad = (max - min) * 0.08;
    // Counts never dip below zero, even with the padding.
    return { min: min >= 0 ? Math.max(0, min - pad) : min - pad, max: max + pad };
  });

  x(year: number): number {
    return ((this.from() - year) / this.span()) * W;
  }

  y(value: number): number {
    const { min, max } = this.range();
    return PAD_TOP + (1 - (value - min) / (max - min)) * (H - PAD_TOP - PAD_BOTTOM);
  }

  readonly path = computed(() =>
    this.points()
      .map((p, i) => `${i ? 'L' : 'M'}${this.x(p.year).toFixed(1)},${this.y(p.value).toFixed(1)}`)
      .join(' ')
  );

  readonly latest = computed(() => {
    const last = this.points().at(-1);
    return last ? this.format()(last.value) : '—';
  });

  readonly peak = computed(() => {
    const values = this.points().map(p => p.value);
    return values.length ? this.format()(Math.max(...values)) : '';
  });

  readonly marks = computed(() => this.markers().map(m => ({ ...m, x: this.x(m.year) })));

  /** The hovered year: its point, any markers on it, and where to put the tooltip. */
  readonly focus = computed(() => {
    const i = this.hover();
    const p = i === null ? null : this.points()[i];
    if (!p) return null;
    const x = this.x(p.year);
    const notes = this.markers().filter(m => m.year === p.year).map(m => m.label);
    return { x, y: this.y(p.value), left: (x / W) * 100, year: this.formatYear()(p.year), value: this.format()(p.value), notes };
  });

  move(event: PointerEvent) {
    const svg = event.currentTarget as SVGElement;
    const r = svg.getBoundingClientRect();
    const year = this.from() - ((event.clientX - r.left) / r.width) * this.span();
    const pts = this.points();
    if (!pts.length) return;
    let best = 0;
    for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i].year - year) < Math.abs(pts[best].year - year)) best = i;
    this.hover.set(best);
  }
}
