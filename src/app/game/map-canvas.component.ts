import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  input,
  untracked
} from '@angular/core';
import { ThemeService, TooltipService } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber, interpolate } from '../core/i18n/format';
import { GameService } from './game.service';
import { Camera, MapLabel, MapRenderer, MapView } from './map-renderer';
import { FOREIGN, WILD } from './simulation';

const MAX_SCALE = 48;
const CLICK_SLOP = 5;
/** Zoom (relative to the fitted map) used when flying to a polis. */
const FOCUS_ZOOM = 2.6;

interface Area {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Full-viewport canvas hosting the pixel map. Handles DPR-aware resizing, fit-to-viewport around
 * the HUD, animated fly-to, wheel / pinch zoom, drag panning, hover tooltips and clicks.
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

  private renderer: MapRenderer | null = null;
  private ctx!: CanvasRenderingContext2D;
  private cam: Camera = { scale: 1, ox: 0, oy: 0 };
  /** Destination of an in-flight camera animation. */
  private flight: Camera | null = null;
  private width = 0;
  private height = 0;
  private fitScale = 1;
  private userMoved = false;
  private hover = -1;
  private frame = 0;
  private lastFrame = 0;
  private resizeObserver?: ResizeObserver;
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private dragStart: { x: number; y: number; ox: number; oy: number; dist: number; scale: number } | null = null;
  private dragged = false;

  constructor() {
    effect(() => {
      if (!this.game.ready() || !this.ctx) return;
      untracked(() => {
        this.renderer ??= new MapRenderer(this.game.sim, this.theme);
        this.fit();
        // HUD panels appear in the same change detection pass; refit once they are laid out.
        requestAnimationFrame(() => !this.userMoved && this.fit());
      });
    });

    // On the start screen, glide to whichever polis is picked.
    effect(() => {
      const idx = this.game.selected();
      if (this.game.status() !== 'choosing' || idx < 0 || !this.game.ready()) return;
      untracked(() => this.flyTo(idx));
    });
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(canvas);

      canvas.addEventListener('wheel', this.onWheel, { passive: false });
      canvas.addEventListener('pointerdown', this.onPointerDown);
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
      window.addEventListener('pointercancel', this.onPointerUp);
      canvas.addEventListener('pointerleave', this.onPointerLeave);
      this.frame = requestAnimationFrame(t => this.draw(t));
    });
    // Web fonts may land after the first paint; refresh canvas text metrics.
    document.fonts?.ready.then(() => this.renderer?.resolveTokens());
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

  /** Frames the whole map in the part of the screen not covered by HUD panels. */
  fit(animate = false) {
    if (!this.game.ready()) return;
    const { cols, rows } = this.game.world;
    const a = this.freeArea();
    const scale = Math.max(0.5, Math.min((a.right - a.left) / cols, (a.bottom - a.top) / rows));
    this.fitScale = scale;
    const target = {
      scale,
      ox: (a.left + a.right - cols * scale) / 2,
      oy: (a.top + a.bottom - rows * scale) / 2
    };
    this.userMoved = false;
    if (animate) {
      this.flight = target;
    } else {
      this.cam = target;
      this.flight = null;
    }
  }

  /** Smoothly centres a polis in the free area. */
  flyTo(idx: number) {
    const p = this.game.sim.poleis[idx];
    if (!p) return;
    const a = this.freeArea();
    const scale = Math.min(MAX_SCALE, Math.max(this.cam.scale, this.fitScale * FOCUS_ZOOM));
    this.flight = {
      scale,
      ox: (a.left + a.right) / 2 - p.cx * scale,
      oy: (a.top + a.bottom) / 2 - p.cy * scale
    };
    this.userMoved = true;
  }

  /** Viewport minus the header strip, the bottom dock and the start screen panel. */
  private freeArea(): Area {
    const area: Area = { left: 12, top: 64, right: this.width - 12, bottom: this.height - 12 };
    const dock = document.querySelector('.dock-wrap .dock');
    if (dock) area.bottom = Math.min(area.bottom, dock.getBoundingClientRect().top - 8);
    const panel = document.querySelector('.start-screen__panel');
    if (panel) {
      const r = panel.getBoundingClientRect();
      if (r.top > this.height * 0.3) area.bottom = Math.min(area.bottom, r.top - 8);
      else area.left = Math.max(area.left, r.right + 12);
    }
    if (area.bottom - area.top < 160) area.bottom = area.top + 160;
    return area;
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
    const dt = this.lastFrame ? Math.min(0.1, (now - this.lastFrame) / 1000) : 0;
    this.lastFrame = now;
    this.animateCamera(dt);

    if (this.renderer) {
      const t = this.i18n.t();
      const labels: MapLabel[] = [
        { lon: 19.75, lat: 37.55, text: t.seaIonian, kind: 'sea' },
        { lon: 25.0, lat: 39.25, text: t.seaAegean, kind: 'sea' },
        { lon: 25.0, lat: 35.85, text: t.seaCretan, kind: 'sea' },
        { lon: 22.35, lat: 40.085, text: t.peakOlympus, kind: 'peak' }
      ];
      const preview = this.game.preview();
      this.renderer.render(
        this.ctx,
        this.width,
        this.height,
        this.cam,
        {
          view: this.view(),
          hover: this.hover >= 0 ? this.hover : preview,
          selected: this.game.selected(),
          names: this.game.sim.poleis.map(p => t.polisNames[p.def.id]),
          labels
        },
        now
      );
    } else if (this.ctx) {
      this.ctx.fillStyle = this.theme.getTokenColor('bg-deep', '#f5f7fb');
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
    this.frame = requestAnimationFrame(ts => this.draw(ts));
  }

  /** Exponential ease toward the flight target, interpolating zoom in log space. */
  private animateCamera(dt: number) {
    const f = this.flight;
    if (!f) return;
    const k = 1 - Math.exp(-dt * 5);
    const scale = Math.exp(Math.log(this.cam.scale) + (Math.log(f.scale) - Math.log(this.cam.scale)) * k);
    // Keep the point that will end up in the centre moving along a straight screen path.
    const cx = this.width / 2;
    const cy = this.height / 2;
    const mapX = (cx - this.cam.ox) / this.cam.scale + ((cx - f.ox) / f.scale - (cx - this.cam.ox) / this.cam.scale) * k;
    const mapY = (cy - this.cam.oy) / this.cam.scale + ((cy - f.oy) / f.scale - (cy - this.cam.oy) / this.cam.scale) * k;
    this.cam = { scale, ox: cx - mapX * scale, oy: cy - mapY * scale };
    if (Math.abs(scale - f.scale) / f.scale < 0.002 && Math.abs(this.cam.ox - f.ox) < 0.5 && Math.abs(this.cam.oy - f.oy) < 0.5) {
      this.cam = f;
      this.flight = null;
    }
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
    this.flight = null;
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
      this.flight = null;
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
    if (!this.dragged && this.pointers.size === 0 && this.game.ready()) {
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
    if (!this.game.ready()) return;
    const { x, y } = this.toMap(clientX, clientY);
    const world = this.game.world;
    const cell = world.cellAt(x, y);
    const owner = cell >= 0 ? this.game.sim.owner[cell] : -3;
    this.hover = owner >= 0 ? owner : -1;
    this.canvasRef.nativeElement.style.cursor = owner >= 0 ? 'pointer' : 'grab';

    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const altitude = cell >= 0 ? interpolate(t.hoverAltitude, { m: formatNumber(Math.max(0, world.elevation[cell]), lang) }) : '';
    let text = '';
    if (owner >= 0) {
      const p = this.game.sim.poleis[owner];
      text = interpolate(t.hoverPolis, {
        name: t.polisNames[p.def.id],
        pop: formatNumber(this.game.sim.totalPopulation(p), lang)
      });
      text += ` · ${altitude}`;
    } else if (owner === WILD) {
      text = `${t.hoverWild} · ${altitude}`;
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
