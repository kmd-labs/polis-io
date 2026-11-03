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
import { formatNumber, interpolate, polisName } from '../core/i18n/format';
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
  /** Smallest zoom: the map covers the whole viewport, so no empty band ever shows. */
  private fitScale = 1;
  /** Zoom at which the whole map fits the free area; fly-to zooms are relative to it. */
  private containScale = 1;
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

    // Lists in the HUD ask for a polis to be brought into view.
    effect(() => {
      const req = this.game.focusRequest();
      if (req) untracked(() => this.flyTo(req.idx));
    });

    // Once the game begins, centre the player's capital in whatever part of the map the HUD leaves free.
    let previous = this.game.status();
    effect(() => {
      const status = this.game.status();
      const began = previous === 'choosing' && status === 'playing';
      previous = status;
      if (!began) return;
      untracked(() => requestAnimationFrame(() => this.flyTo(this.game.sim.player)));
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

  /** Fills the viewport with the map (cover), centred on the part of the screen not covered by HUD panels. */
  fit(animate = false) {
    if (!this.game.ready()) return;
    this.measure();
    const { cols, rows } = this.game.world;
    const a = this.freeArea();
    const scale = this.fitScale;
    const target = this.clamp({
      scale,
      ox: (a.left + a.right - cols * scale) / 2,
      oy: (a.top + a.bottom - rows * scale) / 2
    });
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
    this.measure();
    const a = this.freeArea();
    const { cols, rows } = this.game.world;
    const midX = (a.left + a.right) / 2;
    const midY = (a.top + a.bottom) / 2;
    // Zoom in at least far enough that the map edge does not stop the polis from reaching the centre.
    const reach = Math.max(
      midX / p.cx,
      (this.width - midX) / (cols - p.cx),
      midY / p.cy,
      (this.height - midY) / (rows - p.cy)
    );
    const scale = Math.min(MAX_SCALE, Math.max(this.cam.scale, this.fitScale, this.containScale * FOCUS_ZOOM, reach));
    this.flight = this.clamp({
      scale,
      ox: (a.left + a.right) / 2 - p.cx * scale,
      oy: (a.top + a.bottom) / 2 - p.cy * scale
    });
    this.userMoved = true;
  }

  /** Recomputes the cover and contain zooms for the current viewport and HUD. */
  private measure() {
    const { cols, rows } = this.game.world;
    const a = this.freeArea();
    this.fitScale = Math.max(this.width / cols, this.height / rows, 0.5);
    this.containScale = Math.max(0.5, Math.min((a.right - a.left) / cols, (a.bottom - a.top) / rows));
  }

  /** Keeps the map edge from ever being dragged inside the viewport. */
  private clamp(cam: Camera): Camera {
    if (!this.game.ready()) return cam;
    const { cols, rows } = this.game.world;
    const scale = Math.max(this.fitScale, cam.scale);
    return {
      scale,
      ox: Math.min(0, Math.max(this.width - cols * scale, cam.ox)),
      oy: Math.min(0, Math.max(this.height - rows * scale, cam.oy))
    };
  }

  /** Re-frames the map after HUD panels open or fold, unless the player has moved the camera. */
  reframe() {
    if (!this.userMoved) requestAnimationFrame(() => this.fit(true));
  }

  /**
   * Viewport minus the HUD: every element marked `data-occlude="top|left|right|bottom"` takes its
   * edge, and the start screen panel takes the side it sits on.
   */
  private freeArea(): Area {
    const area: Area = { left: 12, top: 64, right: this.width - 12, bottom: this.height - 12 };
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-occlude]'))) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      switch (el.dataset['occlude']) {
        case 'top':
          area.top = Math.max(area.top, r.bottom + 8);
          break;
        case 'left':
          area.left = Math.max(area.left, r.right + 12);
          break;
        case 'right':
          area.right = Math.min(area.right, r.left - 12);
          break;
        case 'bottom':
          area.bottom = Math.min(area.bottom, r.top - 8);
          break;
      }
    }
    const panel = document.querySelector('.start-screen__panel');
    if (panel) {
      const r = panel.getBoundingClientRect();
      if (r.top > this.height * 0.3) area.bottom = Math.min(area.bottom, r.top - 8);
      // A full-width bar (the collapsed budget on phones) covers the top, not the left.
      else if (r.width > this.width * 0.6) area.top = Math.max(area.top, r.bottom + 8);
      else area.left = Math.max(area.left, r.right + 12);
    }
    if (area.bottom - area.top < 160) area.bottom = area.top + 160;
    if (area.right - area.left < 160) area.right = area.left + 160;
    return area;
  }

  private resize() {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    // Keep whatever map point sat in the middle of the screen there.
    const midX = (this.width / 2 - this.cam.ox) / this.cam.scale;
    const midY = (this.height / 2 - this.cam.oy) / this.cam.scale;
    this.width = rect.width;
    this.height = rect.height;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!this.game.ready()) return this.paint(performance.now());
    if (!this.userMoved) {
      this.fit();
    } else {
      this.measure();
      this.cam = this.clamp({ scale: this.cam.scale, ox: this.width / 2 - midX * this.cam.scale, oy: this.height / 2 - midY * this.cam.scale });
      if (this.flight) this.flight = this.clamp(this.flight);
    }
    // Resizing the canvas wiped it; repaint now rather than on the next (possibly throttled) frame.
    this.paint(performance.now());
  }

  private draw(now: number) {
    const dt = this.lastFrame ? Math.min(0.1, (now - this.lastFrame) / 1000) : 0;
    this.lastFrame = now;
    this.animateCamera(dt);
    this.paint(now);
    this.frame = requestAnimationFrame(ts => this.draw(ts));
  }

  private paint(now: number) {
    if (this.renderer) {
      const t = this.i18n.t();
      const labels: MapLabel[] = [{ lon: 22.35, lat: 40.085, text: t.peakOlympus, kind: 'peak' }];
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
          names: this.game.sim.poleis.map(p => polisName(t, p.def)),
          labels,
          locale: t.htmlLang
        },
        now
      );
    } else if (this.ctx) {
      this.ctx.fillStyle = this.theme.getTokenColor('bg-deep', '#f5f7fb');
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  /** Exponential ease toward the flight target, interpolating zoom in log space. */
  private animateCamera(dt: number) {
    this.breathe();
    const f = this.flight;
    if (!f) return;
    const k = 1 - Math.exp(-dt * 5);
    const scale = Math.exp(Math.log(this.cam.scale) + (Math.log(f.scale) - Math.log(this.cam.scale)) * k);
    // Keep the point that will end up in the centre moving along a straight screen path.
    const cx = this.width / 2;
    const cy = this.height / 2;
    const mapX = (cx - this.cam.ox) / this.cam.scale + ((cx - f.ox) / f.scale - (cx - this.cam.ox) / this.cam.scale) * k;
    const mapY = (cy - this.cam.oy) / this.cam.scale + ((cy - f.oy) / f.scale - (cy - this.cam.oy) / this.cam.scale) * k;
    this.cam = this.clamp({ scale, ox: cx - mapX * scale, oy: cy - mapY * scale });
    if (Math.abs(scale - f.scale) / f.scale < 0.002 && Math.abs(this.cam.ox - f.ox) < 0.5 && Math.abs(this.cam.oy - f.oy) < 0.5) {
      this.cam = f;
      this.flight = null;
    }
  }

  /** On the untouched start screen the camera slowly pushes in and out, like an establishing shot. */
  private breathe() {
    if (this.userMoved || this.flight || !this.game.ready() || this.game.status() !== 'choosing' || this.game.selected() >= 0) return;
    const { cols, rows } = this.game.world;
    const a = this.freeArea();
    const scale = this.fitScale * (1.04 + 0.04 * Math.sin(performance.now() / 9000));
    this.cam = this.clamp({
      scale,
      ox: (a.left + a.right - cols * scale) / 2,
      oy: (a.top + a.bottom - rows * scale) / 2
    });
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
    const next = Math.max(this.fitScale, Math.min(MAX_SCALE, scale));
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    this.cam = this.clamp({
      scale: next,
      ox: px - ((px - this.cam.ox) / this.cam.scale) * next,
      oy: py - ((py - this.cam.oy) / this.cam.scale) * next
    });
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
      this.cam = this.clamp({ scale: this.cam.scale, ox: s.ox + (cx - s.x), oy: s.oy + (cy - s.y) });
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
        name: polisName(t, p.def),
        pop: formatNumber(this.game.sim.totalPopulation(p), lang)
      });
      if (p.overlord >= 0) text += ` · ${interpolate(t.vassalOf, { b: this.game.name(p.overlord) })}`;
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
