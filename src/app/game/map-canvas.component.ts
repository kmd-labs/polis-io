import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
  input
} from '@angular/core';
import { ThemeService, TooltipService } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber, interpolate } from '../core/i18n/format';
import { GameService } from './game.service';
import { Camera, MapRenderer, MapView } from './map-renderer';
import { FOREIGN, WILD } from './simulation';

const MAX_SCALE = 40;
const CLICK_SLOP = 5;

/**
 * Full-viewport canvas hosting the pixel map. Handles DPR-aware resizing,
 * fit-to-viewport, wheel / pinch zoom, drag panning, hover tooltips and clicks.
 */
@Component({
  selector: 'app-map-canvas',
  standalone: true,
  templateUrl: './map-canvas.component.html',
  styleUrl: './map-canvas.component.scss'
})
export class MapCanvasComponent implements AfterViewInit, OnDestroy {
  readonly view = input<MapView>('political');

  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly zone = inject(NgZone);
  private readonly game = inject(GameService);
  private readonly i18n = inject(I18nService);
  private readonly theme = inject(ThemeService);
  private readonly tooltip = inject(TooltipService);

  private renderer!: MapRenderer;
  private ctx!: CanvasRenderingContext2D;
  private cam: Camera = { scale: 4, ox: 0, oy: 0 };
  private width = 0;
  private height = 0;
  private fitScale = 4;
  private userMoved = false;
  private hover = -1;
  private frame = 0;
  private resizeObserver?: ResizeObserver;
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private dragStart: { x: number; y: number; ox: number; oy: number; dist: number; scale: number } | null = null;
  private dragged = false;

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.renderer = new MapRenderer(this.game.sim, this.theme);

    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(canvas);
      const dock = document.querySelector('.dock-wrap');
      if (dock) this.resizeObserver.observe(dock);

      canvas.addEventListener('wheel', this.onWheel, { passive: false });
      canvas.addEventListener('pointerdown', this.onPointerDown);
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
      window.addEventListener('pointercancel', this.onPointerUp);
      canvas.addEventListener('pointerleave', this.onPointerLeave);
      this.frame = requestAnimationFrame(t => this.draw(t));
    });
    // Web fonts may land after the first paint; refresh canvas text metrics.
    document.fonts?.ready.then(() => this.renderer.resolveTokens());
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    const canvas = this.canvasRef.nativeElement;
    canvas.removeEventListener('wheel', this.onWheel);
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointerleave', this.onPointerLeave);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
  }

  /** Frames the whole map between the header pills and the bottom dock. */
  fit() {
    const { cols, rows } = this.game.world;
    const dockTop = document.querySelector('.dock-wrap .dock')?.getBoundingClientRect().top ?? this.height;
    const top = 60;
    const bottom = Math.max(top + 200, Math.min(this.height, dockTop) - 8);
    const availW = this.width - 24;
    const availH = bottom - top;
    this.fitScale = Math.max(1, Math.min(availW / cols, availH / rows));
    this.cam = {
      scale: this.fitScale,
      ox: (this.width - cols * this.fitScale) / 2,
      oy: top + (availH - rows * this.fitScale) / 2
    };
    this.userMoved = false;
  }

  private resize() {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!this.userMoved) this.fit();
  }

  private draw(now: number) {
    const t = this.i18n.t();
    this.renderer.render(
      this.ctx,
      this.width,
      this.height,
      this.cam,
      {
        view: this.view(),
        hover: this.hover,
        selected: this.game.selected(),
        names: this.game.sim.poleis.map(p => t.polisNames[p.def.id])
      },
      now
    );
    this.frame = requestAnimationFrame(ts => this.draw(ts));
  }

  // ─── Interaction ──────────────────────────────────────────────────────────

  private toMap(clientX: number, clientY: number) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return {
      x: (clientX - rect.left - this.cam.ox) / this.cam.scale,
      y: (clientY - rect.top - this.cam.oy) / this.cam.scale
    };
  }

  private zoomAt(clientX: number, clientY: number, scale: number) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const next = Math.max(this.fitScale * 0.8, Math.min(MAX_SCALE, scale));
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    this.cam.ox = px - ((px - this.cam.ox) / this.cam.scale) * next;
    this.cam.oy = py - ((py - this.cam.oy) / this.cam.scale) * next;
    this.cam.scale = next;
    this.userMoved = true;
  }

  private readonly onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.zoomAt(e.clientX, e.clientY, this.cam.scale * Math.exp(-e.deltaY * 0.0015));
  };

  private readonly onPointerDown = (e: PointerEvent) => {
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.dragged = false;
    this.startGesture();
  };

  private startGesture() {
    const pts = [...this.pointers.values()];
    if (!pts.length) {
      this.dragStart = null;
      return;
    }
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    this.dragStart = { x: cx, y: cy, ox: this.cam.ox, oy: this.cam.oy, dist, scale: this.cam.scale };
  }

  private readonly onPointerMove = (e: PointerEvent) => {
    if (this.pointers.has(e.pointerId)) {
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const s = this.dragStart;
      if (!s) return;
      const pts = [...this.pointers.values()];
      const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
      const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
      if (!this.dragged && Math.hypot(cx - s.x, cy - s.y) < CLICK_SLOP && pts.length < 2) return;
      this.dragged = true;
      this.hideTooltip();
      this.cam.ox = s.ox + (cx - s.x);
      this.cam.oy = s.oy + (cy - s.y);
      this.userMoved = true;
      if (pts.length > 1 && s.dist > 0) {
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        this.zoomAt(cx, cy, s.scale * (dist / s.dist));
        this.startGesture();
      }
      return;
    }
    if (e.pointerType === 'mouse' && e.target === this.canvasRef.nativeElement) this.updateHover(e.clientX, e.clientY);
  };

  private readonly onPointerUp = (e: PointerEvent) => {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.delete(e.pointerId);
    if (!this.dragged && this.pointers.size === 0) {
      const { x, y } = this.toMap(e.clientX, e.clientY);
      const cell = this.game.world.cellAt(x, y);
      const owner = cell >= 0 ? this.game.sim.owner[cell] : -1;
      this.zone.run(() => this.game.select(owner >= 0 ? owner : -1));
      if (e.pointerType !== 'mouse') this.updateHover(e.clientX, e.clientY, 1800);
    }
    this.startGesture();
  };

  private readonly onPointerLeave = () => {
    this.hover = -1;
    this.hideTooltip();
  };

  private updateHover(clientX: number, clientY: number, autoHideMs = 0) {
    const { x, y } = this.toMap(clientX, clientY);
    const cell = this.game.world.cellAt(x, y);
    const owner = cell >= 0 ? this.game.sim.owner[cell] : -3;
    this.hover = owner >= 0 ? owner : -1;
    const canvas = this.canvasRef.nativeElement;
    canvas.style.cursor = owner >= 0 ? 'pointer' : 'grab';

    const t = this.i18n.t();
    let text = '';
    if (owner >= 0) {
      const p = this.game.sim.poleis[owner];
      text = interpolate(t.hoverPolis, {
        name: t.polisNames[p.def.id],
        pop: formatNumber(this.game.sim.totalPopulation(p), this.i18n.lang())
      });
    } else if (owner === WILD) {
      text = t.hoverWild;
    } else if (owner === FOREIGN) {
      text = t.hoverForeign;
    }
    this.zone.run(() => {
      if (text) this.tooltip.show(text, clientX, clientY - 14, 'top', autoHideMs, { noWrap: true });
      else this.tooltip.hide();
    });
  }

  private hideTooltip() {
    this.zone.run(() => this.tooltip.hide());
  }
}
