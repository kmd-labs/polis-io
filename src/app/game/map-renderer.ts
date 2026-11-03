import { ThemeService } from '@kmd/design-system';
import { drawFightCloud, FightCloudStyle } from './fight-cloud';
import { hash01, mulberry32 } from './rng';
import { SpriteAtlas, SpritePalette } from './sprites';
import { RULES, Simulation } from './simulation';
import { Terrain } from './world';

/** Screen transform: screenX = ox + mapX * scale. */
export interface Camera {
  scale: number;
  ox: number;
  oy: number;
}

export type MapView = 'political' | 'relief' | 'fertility' | 'relations';

/** Cartographic label (a mountain peak) placed by longitude / latitude. */
export interface MapLabel {
  lon: number;
  lat: number;
  text: string;
  kind: 'peak';
}

export interface RenderOptions {
  view: MapView;
  hover: number;
  selected: number;
  /** Localized polis names, indexed like `sim.poleis`. */
  names: string[];
  labels: MapLabel[];
  /** BCP 47 locale for numbers drawn on the map. */
  locale: string;
}

type Rgb = [number, number, number];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Parses `#rgb`, `#rrggbb` and `rgb()/rgba()` strings returned by ThemeService. */
function parseColor(css: string): Rgb {
  const s = css.trim();
  if (s.startsWith('#')) {
    const hex = s.length === 4 ? [...s.slice(1)].map(ch => ch + ch).join('') : s.slice(1, 7);
    return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
  }
  const m = s.match(/[\d.]+/g) ?? ['0', '0', '0'];
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Piecewise-linear colour ramp over sorted [value, colour] stops. */
function ramp(stops: [number, Rgb][], v: number): Rgb {
  if (v <= stops[0][0]) return stops[0][1];
  for (let k = 1; k < stops.length; k++) {
    if (v <= stops[k][0]) {
      const [v0, c0] = stops[k - 1];
      const [v1, c1] = stops[k];
      return mix(c0, c1, (v - v0) / (v1 - v0));
    }
  }
  return stops[stops.length - 1][1];
}

const WAVE_TILE = 160;
/** Elevation step (m) of the terraced, contour-lined land tints. */
const LAND_BAND = 250;
/** Depth thresholds (m) of the stepped sea tints and isobaths. */
const SEA_BANDS = [0, 60, 250, 1000, 2200];

interface Cloud {
  x: number;
  y: number;
  puffs: [number, number, number][];
}

/**
 * Paints the pixel map of Hellas: a shaded-relief raster (one canvas pixel per map cell, scaled with
 * nearest-neighbour) with territories washed over it, an animated sea, cartographic labels,
 * capitals with frosted name badges, marching armies and cartoon battles.
 */
export class MapRenderer {
  private readonly raster = document.createElement('canvas');
  private readonly image: ImageData;
  /** Per-view colour of every cell without any owner overlay (RGB triplets). */
  private readonly base: Uint8ClampedArray;
  private baseView: MapView | null = null;
  private paintedKey = '';

  private readonly waves = document.createElement('canvas');
  private readonly seaMask = document.createElement('canvas');
  private readonly surf = document.createElement('canvas');
  private wavePatterns: CanvasPattern[] = [];

  private readonly clouds: Cloud[];
  private readonly sprites = new SpriteAtlas();
  private outline: Path2D | null = null;
  private outlineKey = '';

  private readonly css: Record<string, string> = {};
  private readonly rgb: Record<string, Rgb> = {};
  private polisRgb: Rgb[] = [];
  private polisCss: string[] = [];
  private hypsometric: [number, Rgb][] = [];
  private font = '"Inter", sans-serif';
  private display = '"Cinzel", serif';
  private mono = 'monospace';

  constructor(
    private readonly sim: Simulation,
    private readonly theme: ThemeService
  ) {
    const { cols, rows, size } = sim.world;
    for (const c of [this.raster, this.waves, this.seaMask, this.surf]) {
      c.width = cols;
      c.height = rows;
    }
    this.image = new ImageData(cols, rows);
    this.base = new Uint8ClampedArray(size * 3);
    // A handful of slow cumulus shadows drifting east with the meltemi.
    const rnd = mulberry32(99);
    this.clouds = Array.from({ length: 8 }, () => {
      const r = 22 + rnd() * 40;
      return {
        x: rnd() * cols,
        y: rnd() * rows,
        puffs: Array.from({ length: 3 + Math.floor(rnd() * 3) }, () => [(rnd() - 0.5) * r * 1.6, (rnd() - 0.5) * r * 0.7, r * (0.45 + rnd() * 0.5)] as [number, number, number])
      };
    });
    this.resolveTokens();
  }

  /** Reads every colour from the design-system CSS tokens and rebuilds the static layers. */
  resolveTokens() {
    const tokens = [
      'bg-deep', 'neutral-0', 'neutral-100', 'neutral-200', 'neutral-300', 'neutral-400', 'neutral-500',
      'neutral-600', 'success-100', 'success-200', 'success-600', 'warning-100', 'warning-200', 'warning-300',
      'info-50', 'info-100', 'info-200', 'info-300', 'info-400', 'info-700', 'primary-200', 'primary-300', 'primary-400',
      'primary-800', 'neutral-700', 'neutral-900', 'warning-50', 'warning-700', 'warning-800', 'success-500', 'accent', 'text-bright', 'text-main',
      'text-dim', 'panel-bg', 'panel-bg-heavy', 'line', 'line-strong', 'danger-400', 'danger-700', 'success-400', 'success-700'
    ];
    for (const t of tokens) {
      this.css[t] = this.theme.getTokenColor(t, '#888888');
      this.rgb[t] = parseColor(this.css[t]);
    }
    const c = this.rgb;
    this.hypsometric = [
      [0, mix(c['neutral-200'], c['success-200'], 0.35)],
      [300, mix(c['neutral-200'], c['success-100'], 0.3)],
      [800, mix(c['neutral-300'], c['warning-100'], 0.4)],
      [1400, mix(c['neutral-300'], c['warning-200'], 0.35)],
      [2000, mix(c['neutral-400'], c['neutral-300'], 0.5)],
      [2500, c['neutral-200']]
    ];
    this.resolvePolisColors();
    this.font = this.theme.getFontFamily();
    this.display =
      getComputedStyle(document.documentElement).getPropertyValue('--font-family-display').trim() || this.font;
    this.mono = getComputedStyle(document.documentElement).getPropertyValue('--font-family-mono').trim() || 'monospace';
    this.buildSeaLayers();
    this.sprites.clear();
    this.baseView = null;
    this.paintedKey = '';
  }

  /** Vassals founded mid-game wear their overlord's colour token. */
  private resolvePolisColors() {
    this.polisCss = this.sim.poleis.map(p => this.theme.getTokenColor(p.def.color, '#64748b'));
    this.polisRgb = this.polisCss.map(parseColor);
  }

  colorOf(idx: number): string {
    return this.polisCss[idx] ?? this.css['neutral-500'];
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, cam: Camera, opt: RenderOptions, now: number) {
    const { cols, rows } = this.sim.world;
    if (this.polisRgb.length !== this.sim.poleis.length) this.resolvePolisColors();
    this.paintRaster(opt);

    ctx.fillStyle = this.css['bg-deep'];
    ctx.fillRect(0, 0, width, height);

    const mw = cols * cam.scale;
    const mh = rows * cam.scale;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.raster, cam.ox, cam.oy, mw, mh);
    this.drawSea(ctx, cam, now / 1000);
    this.drawGrid(ctx, cam, width, height);
    this.drawPlayerOutline(ctx, cam);
    this.drawClaims(ctx, cam);
    this.drawBuildings(ctx, cam, width, height);
    this.drawShips(ctx, cam, now, width, height);
    this.drawClouds(ctx, cam, now / 1000);
    this.drawEdgeFade(ctx, cam);
    this.drawGrade(ctx, width, height);
    this.drawLabels(ctx, cam, opt, width, height);
    this.drawSieges(ctx, cam, width, height);
    this.drawCapitals(ctx, cam, opt, width, height);
    this.drawArmies(ctx, cam, now);
    this.drawTradeFx(ctx, cam, opt);
    this.drawBattles(ctx, cam);
  }

  // ─── Territory raster ─────────────────────────────────────────────────────

  /**
   * Stylised relief per cell for the given view: terraced elevation tints with contour lines, warm
   * light and cool shade, an inked coastline, stepped sea depths with isobaths and land casting a
   * soft shadow onto the water.
   */
  private buildBase(view: MapView) {
    const { size, cols, rows, terrain, elevation, shade, shallow, fertility } = this.sim.world;
    const c = this.rgb;
    const warm = mix(c['warning-50'], c['neutral-0'], 0.35);
    const cool = mix(c['primary-800'], c['neutral-700'], 0.5);
    const ink = c['neutral-700'];
    const seaTints: Rgb[] = [
      mix(c['info-50'], c['info-100'], 0.55),
      c['info-100'],
      mix(c['info-100'], c['info-200'], 0.6),
      mix(c['info-200'], c['primary-300'], 0.45),
      mix(c['primary-300'], c['info-300'], 0.35)
    ];
    const foreign = mix(c['neutral-100'], c['neutral-200'], 0.5);
    const out = this.base;

    const seaBand = (i: number) => {
      const d = -elevation[i];
      let b = 0;
      while (b + 1 < SEA_BANDS.length && d >= SEA_BANDS[b + 1]) b++;
      return b;
    };
    const landBand = (i: number) => Math.floor(Math.max(0, elevation[i]) / LAND_BAND);
    const isSea = (i: number) => terrain[i] === Terrain.Sea;

    for (let i = 0; i < size; i++) {
      const x = i % cols;
      const y = (i - x) / cols;
      const s = shade[i];
      const nbrs = [x > 0 ? i - 1 : i, x < cols - 1 ? i + 1 : i, y > 0 ? i - cols : i, y < rows - 1 ? i + cols : i];
      let col: Rgb;

      if (isSea(i)) {
        const band = seaBand(i);
        col = seaTints[band];
        if (nbrs.some(n => isSea(n) && seaBand(n) !== band)) col = mix(col, c['primary-400'], 0.14);
        // Land lit from the north-west throws a short shadow south-east over the water.
        let shadow = 0;
        for (let k = 1; k <= 4; k++) {
          const sx = x - k;
          const sy = y - k;
          if (sx >= 0 && sy >= 0 && !isSea(sy * cols + sx)) shadow = Math.max(shadow, 0.22 - k * 0.045);
        }
        col = mix(col, cool, shadow);
        col = mix(col, [col[0] * s, col[1] * s, col[2] * s], 0.4);
        if (shallow[i]) col = mix(col, c['neutral-0'], 0.45);
      } else if (terrain[i] === Terrain.Foreign) {
        col = (x + y) % 7 === 0 ? mix(foreign, c['neutral-300'], 0.4) : foreign;
        col = mix(col, [col[0] * s, col[1] * s, col[2] * s], 0.55);
        if (nbrs.some(isSea)) col = mix(col, ink, 0.2);
      } else {
        if (view === 'fertility') {
          col = mix(c['neutral-200'], c['success-600'], (fertility[i] - 0.12) / 0.88);
        } else {
          const band = landBand(i);
          col = ramp(this.hypsometric, band * LAND_BAND + LAND_BAND / 2);
          if (nbrs.some(n => !isSea(n) && landBand(n) < band)) col = mix(col, ink, 0.1);
        }
        col = s >= 1 ? mix(col, warm, Math.min(1, (s - 1) * 2.4)) : mix(col, cool, Math.min(0.55, (1 - s) * 1.5));
        const grain = 1 + (hash01(x, y, 5) - 0.5) * 0.035;
        col = [col[0] * grain, col[1] * grain, col[2] * grain];
        if (nbrs.some(isSea)) col = mix(col, ink, 0.32);
      }
      out[i * 3] = col[0];
      out[i * 3 + 1] = col[1];
      out[i * 3 + 2] = col[2];
    }
    this.baseView = view;
  }

  private paintRaster(opt: RenderOptions) {
    const sim = this.sim;
    if (this.baseView !== opt.view) this.buildBase(opt.view);
    const me = sim.poleis[sim.player];
    const wars = me ? [...me.wars].join(',') : '';
    // In the relations view, a city repaints when its standing with the player moves a step.
    const standing = opt.view === 'relations' && me ? sim.poleis.map(p => Math.round(sim.relation(p.idx, me.idx) / 10)).join(',') + [...me.allies].join(',') : '';
    const key = `${sim.resets}|${opt.view}|${opt.hover}|${opt.selected}|${sim.player}|${wars}|${standing}`;
    const dirty = sim.takeDirty();

    if (key !== this.paintedKey) {
      this.paintedKey = key;
      for (let i = 0; i < sim.world.size; i++) this.paintCell(i, opt);
    } else if (dirty.length) {
      const { cols, size } = sim.world;
      for (const i of dirty) {
        this.paintCell(i, opt);
        if (i >= cols) this.paintCell(i - cols, opt);
        if (i + cols < size) this.paintCell(i + cols, opt);
        if (i % cols) this.paintCell(i - 1, opt);
        if ((i + 1) % cols) this.paintCell(i + 1, opt);
      }
    } else {
      return;
    }
    this.raster.getContext('2d')!.putImageData(this.image, 0, 0);
  }

  private paintCell(i: number, opt: RenderOptions) {
    const sim = this.sim;
    const { cols, rows, shade } = sim.world;
    const owner = sim.owner;
    const data = this.image.data;
    const base = this.base;
    const o = owner[i];
    const p = i * 4;
    data[p + 3] = 255;

    if (o < 0) {
      data[p] = base[i * 3];
      data[p + 1] = base[i * 3 + 1];
      data[p + 2] = base[i * 3 + 2];
      return;
    }

    const x = i % cols;
    const y = (i - x) / cols;
    const border =
      (x > 0 && owner[i - 1] !== o) ||
      (x < cols - 1 && owner[i + 1] !== o) ||
      (y > 0 && owner[i - cols] !== o) ||
      (y < rows - 1 && owner[i + cols] !== o);
    const tint = this.polisRgb[o];
    const focus = o === opt.hover || o === opt.selected;
    const s = shade[i];
    let col: Rgb;

    if (border) {
      const k = Math.min(1, 0.8 + 0.2 * s);
      col = [tint[0] * k, tint[1] * k, tint[2] * k];
    } else if (opt.view === 'relations') {
      const k = 0.7 + 0.3 * s;
      const m = mix(this.relationTint(o), this.rgb['neutral-0'], focus ? 0.2 : 0.38);
      col = [m[0] * k, m[1] * k, m[2] * k];
    } else if (opt.view === 'political') {
      const me = sim.poleis[sim.player];
      const hostile = !!me && me.wars.has(o) && (x + y) % 6 === 0;
      const vassal = sim.poleis[o].overlord >= 0;
      const light = hostile ? 0.15 : focus ? 0.32 : vassal ? 0.66 : 0.52;
      const k = 0.62 + 0.38 * s;
      const m = mix(tint, this.rgb['neutral-0'], light);
      col = [m[0] * k, m[1] * k, m[2] * k];
    } else {
      // Relief and soil views keep the ground readable under a light wash of the owner's colour.
      col = mix([base[i * 3], base[i * 3 + 1], base[i * 3 + 2]], tint, focus ? 0.4 : 0.22);
    }
    data[p] = col[0];
    data[p + 1] = col[1];
    data[p + 2] = col[2];
  }

  /** Relations view: the player gold, enemies deep red, allies and vassals green, the rest by reputation. */
  private relationTint(o: number): Rgb {
    const sim = this.sim;
    const c = this.rgb;
    const me = sim.poleis[sim.player];
    if (!me || o === me.idx) return c['accent'];
    if (me.wars.has(o)) return c['danger-700'];
    if (me.allies.has(o) || sim.poleis[o].overlord === me.idx) return c['success-700'];
    const r = Math.max(-100, Math.min(100, sim.relation(o, me.idx)));
    return r < 0 ? mix(c['neutral-300'], c['danger-400'], Math.min(1, -r / 60)) : mix(c['neutral-300'], c['success-400'], Math.min(1, r / 60));
  }

  // ─── Sea ──────────────────────────────────────────────────────────────────

  private buildSeaLayers() {
    const { cols, rows, terrain, shallow, size } = this.sim.world;
    const mask = new ImageData(cols, rows);
    const surf = new ImageData(cols, rows);
    for (let i = 0; i < size; i++) {
      if (terrain[i] !== Terrain.Sea) continue;
      const p = i * 4;
      if (shallow[i]) {
        surf.data.set([255, 255, 255, 255], p);
      } else {
        mask.data.set([0, 0, 0, 255], p);
      }
    }
    this.seaMask.getContext('2d')!.putImageData(mask, 0, 0);
    this.surf.getContext('2d')!.putImageData(surf, 0, 0);

    // Two tileable layers of pixel wave crests: bright glints and darker troughs.
    const ctx = this.waves.getContext('2d')!;
    this.wavePatterns = [this.css['neutral-0'], this.css['info-400']].map((color, layer) => {
      const tile = document.createElement('canvas');
      tile.width = WAVE_TILE;
      tile.height = WAVE_TILE;
      const t = tile.getContext('2d')!;
      const rnd = mulberry32(17 + layer * 31);
      t.fillStyle = color;
      for (let k = 0; k < (layer ? 110 : 170); k++) {
        t.globalAlpha = 0.6 + rnd() * 0.4;
        t.fillRect(Math.floor(rnd() * WAVE_TILE), Math.floor(rnd() * WAVE_TILE), 3 + Math.floor(rnd() * 4), 1);
      }
      return ctx.createPattern(tile, 'repeat')!;
    });
  }

  /** Gently drifting, twinkling wave crests and a breathing line of surf along the coast. */
  private drawSea(ctx: CanvasRenderingContext2D, cam: Camera, t: number) {
    const { cols, rows } = this.sim.world;
    const w = this.waves.getContext('2d')!;
    w.globalCompositeOperation = 'source-over';
    w.clearRect(0, 0, cols, rows);
    const drift: [number, number, number][] = [
      [t * 1.1, t * 0.35, 0],
      [-t * 0.7, t * 0.2, Math.PI]
    ];
    this.wavePatterns.forEach((pattern, k) => {
      const [dx, dy, phase] = drift[k];
      pattern.setTransform(new DOMMatrix().translate(dx % WAVE_TILE, dy % WAVE_TILE));
      w.globalAlpha = (k ? 0.4 : 1) * (0.5 + 0.5 * Math.sin(t * 0.9 + phase));
      w.fillStyle = pattern;
      w.fillRect(0, 0, cols, rows);
    });
    w.globalAlpha = 1;
    w.globalCompositeOperation = 'destination-in';
    w.drawImage(this.seaMask, 0, 0);
    w.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.waves, cam.ox, cam.oy, cols * cam.scale, rows * cam.scale);
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 1.3);
    ctx.drawImage(this.surf, cam.ox, cam.oy, cols * cam.scale, rows * cam.scale);
    ctx.restore();
  }

  /**
   * Thin fair-weather clouds drifting east: a faint shadow on the ground and, lifted to the north-west
   * of it, the translucent white body of the cloud itself.
   */
  private drawClouds(ctx: CanvasRenderingContext2D, cam: Camera, t: number) {
    const { cols } = this.sim.world;
    const [sr, sg, sb] = this.rgb['neutral-900'];
    const [cr, cg, cb] = this.rgb['neutral-0'];
    const layers: [number, number, string, number][] = [
      [0, 0, `${sr}, ${sg}, ${sb}`, 0.06],
      [-7, -9, `${cr}, ${cg}, ${cb}`, 0.28]
    ];
    ctx.save();
    for (const [lx, ly, rgb, alpha] of layers) {
      for (const cloud of this.clouds) {
        const span = cols + 160;
        const cx = ((((cloud.x + t * 1.3) % span) + span) % span) - 80;
        for (const [dx, dy, pr] of cloud.puffs) {
          const x = cam.ox + (cx + dx + lx) * cam.scale;
          const y = cam.oy + (cloud.y + dy + ly) * cam.scale;
          const rad = pr * cam.scale;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
          grad.addColorStop(0, `rgba(${rgb}, ${alpha})`);
          grad.addColorStop(0.6, `rgba(${rgb}, ${alpha * 0.45})`);
          grad.addColorStop(1, `rgba(${rgb}, 0)`);
          ctx.fillStyle = grad;
          ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        }
      }
    }
    ctx.restore();
  }

  /** Cinematic grade: warm light from the north-west and a gentle vignette. */
  private drawGrade(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const diag = Math.hypot(width, height);
    const [wr, wg, wb] = this.rgb['warning-200'];
    const [vr, vg, vb] = this.rgb['neutral-900'];
    ctx.save();
    const light = ctx.createRadialGradient(width * 0.12, height * 0.05, 0, width * 0.12, height * 0.05, diag * 0.7);
    light.addColorStop(0, `rgba(${wr}, ${wg}, ${wb}, 0.16)`);
    light.addColorStop(1, `rgba(${wr}, ${wg}, ${wb}, 0)`);
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, width, height);
    const vignette = ctx.createRadialGradient(width / 2, height / 2, diag * 0.3, width / 2, height / 2, diag * 0.62);
    vignette.addColorStop(0, `rgba(${vr}, ${vg}, ${vb}, 0)`);
    vignette.addColorStop(1, `rgba(${vr}, ${vg}, ${vb}, 0.14)`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  /** Little merchantmen: wooden hull, a sail in the owner's colour and a white wake. */
  private drawShips(ctx: CanvasRenderingContext2D, cam: Camera, now: number, width: number, height: number) {
    const sim = this.sim;
    const l = Math.max(8, Math.min(16, cam.scale * 3.2));
    ctx.save();
    ctx.lineCap = 'round';
    for (const ship of sim.ships) {
      const x = cam.ox + ship.x * cam.scale;
      const y = cam.oy + ship.y * cam.scale + Math.sin(now / 300 + ship.id) * 0.6;
      if (x < -l * 3 || y < -l * 3 || x > width + l * 3 || y > height + l * 3) continue;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ship.angle);
      // Wake
      ctx.strokeStyle = this.css['neutral-0'];
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = Math.max(1, l * 0.12);
      ctx.beginPath();
      ctx.moveTo(-l * 0.5, -l * 0.12);
      ctx.lineTo(-l * 1.6, -l * 0.42);
      ctx.moveTo(-l * 0.5, l * 0.12);
      ctx.lineTo(-l * 1.6, l * 0.42);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Hull
      ctx.fillStyle = this.css['warning-800'];
      ctx.beginPath();
      ctx.moveTo(l * 0.6, 0);
      ctx.quadraticCurveTo(l * 0.15, -l * 0.32, -l * 0.55, -l * 0.22);
      ctx.lineTo(-l * 0.55, l * 0.22);
      ctx.quadraticCurveTo(l * 0.15, l * 0.32, l * 0.6, 0);
      ctx.fill();
      // Square sail across the beam
      ctx.fillStyle = this.colorOf(ship.owner);
      ctx.strokeStyle = ship.owner === sim.player ? this.css['accent'] : this.css['neutral-0'];
      ctx.lineWidth = Math.max(0.8, l * 0.1);
      ctx.beginPath();
      ctx.roundRect(-l * 0.12, -l * 0.42, l * 0.24, l * 0.84, l * 0.08);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  /** "+1.2" rising from a harbour when one of the player's voyages pays out. */
  private drawTradeFx(ctx: CanvasRenderingContext2D, cam: Camera, opt: RenderOptions) {
    const sim = this.sim;
    ctx.save();
    ctx.font = `600 11px ${this.mono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const fx of sim.tradeFx) {
      if (fx.owner !== sim.player) continue;
      const age = (sim.time - fx.t) / 2;
      const x = cam.ox + fx.x * cam.scale;
      const y = cam.oy + fx.y * cam.scale - 10 - age * 18;
      const text = `+${fx.amount.toLocaleString(opt.locale, { maximumFractionDigits: 1 })}`;
      ctx.globalAlpha = Math.max(0, 1 - age);
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.css['neutral-0'];
      ctx.strokeText(text, x, y);
      ctx.fillStyle = this.css['success-600'];
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  }

  /** Melts the rectangular map window into the page background. */
  private drawEdgeFade(ctx: CanvasRenderingContext2D, cam: Camera) {
    const { cols, rows } = this.sim.world;
    const x0 = cam.ox;
    const y0 = cam.oy;
    const w = cols * cam.scale;
    const h = rows * cam.scale;
    const f = Math.min(64, w * 0.07, h * 0.07);
    const [r, g0, b] = this.rgb['bg-deep'];
    const edge = (gx0: number, gy0: number, gx1: number, gy1: number, rx: number, ry: number, rw: number, rh: number) => {
      const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
      // Fade to the same colour at zero alpha so the ramp never passes through grey.
      g.addColorStop(0, `rgba(${r}, ${g0}, ${b}, 1)`);
      g.addColorStop(1, `rgba(${r}, ${g0}, ${b}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(rx, ry, rw, rh);
    };
    ctx.save();
    edge(x0, 0, x0 + f, 0, x0 - 1, y0 - 1, f + 1, h + 2);
    edge(x0 + w, 0, x0 + w - f, 0, x0 + w - f, y0 - 1, f + 1, h + 2);
    edge(0, y0, 0, y0 + f, x0 - 1, y0 - 1, w + 2, f + 1);
    edge(0, y0 + h, 0, y0 + h - f, x0 - 1, y0 + h - f, w + 2, f + 1);
    ctx.restore();
  }

  /** Hairline gaps between cells once they are large enough to read as tiles. */
  private drawGrid(ctx: CanvasRenderingContext2D, cam: Camera, width: number, height: number) {
    if (cam.scale < 9) return;
    const { cols, rows } = this.sim.world;
    ctx.save();
    ctx.strokeStyle = this.css['bg-deep'];
    ctx.globalAlpha = Math.min(0.45, (cam.scale - 9) / 10 + 0.15);
    ctx.lineWidth = 1;
    ctx.beginPath();
    const x0 = Math.max(0, Math.floor(-cam.ox / cam.scale));
    const x1 = Math.min(cols, Math.ceil((width - cam.ox) / cam.scale));
    const y0 = Math.max(0, Math.floor(-cam.oy / cam.scale));
    const y1 = Math.min(rows, Math.ceil((height - cam.oy) / cam.scale));
    for (let x = x0; x <= x1; x++) {
      const sx = Math.round(cam.ox + x * cam.scale) + 0.5;
      ctx.moveTo(sx, cam.oy + y0 * cam.scale);
      ctx.lineTo(sx, cam.oy + y1 * cam.scale);
    }
    for (let y = y0; y <= y1; y++) {
      const sy = Math.round(cam.oy + y * cam.scale) + 0.5;
      ctx.moveTo(cam.ox + x0 * cam.scale, sy);
      ctx.lineTo(cam.ox + x1 * cam.scale, sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  /** Accent contour tracing the cell edges of the player's territory. */
  private drawPlayerOutline(ctx: CanvasRenderingContext2D, cam: Camera) {
    const sim = this.sim;
    const me = sim.poleis[sim.player];
    if (!me) return;
    const key = `${sim.resets}|${sim.player}|${me.version}`;
    if (key !== this.outlineKey) {
      this.outlineKey = key;
      const { cols, rows } = sim.world;
      const own = sim.owner;
      const idx = sim.player;
      const path = new Path2D();
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          if (own[i] !== idx) continue;
          if (y === 0 || own[i - cols] !== idx) {
            path.moveTo(x, y);
            path.lineTo(x + 1, y);
          }
          if (y === rows - 1 || own[i + cols] !== idx) {
            path.moveTo(x, y + 1);
            path.lineTo(x + 1, y + 1);
          }
          if (x === 0 || own[i - 1] !== idx) {
            path.moveTo(x, y);
            path.lineTo(x, y + 1);
          }
          if (x === cols - 1 || own[i + 1] !== idx) {
            path.moveTo(x + 1, y);
            path.lineTo(x + 1, y + 1);
          }
        }
      }
      this.outline = path;
    }
    if (!this.outline) return;
    ctx.save();
    ctx.translate(cam.ox, cam.oy);
    ctx.scale(cam.scale, cam.scale);
    ctx.strokeStyle = this.css['accent'];
    ctx.lineWidth = Math.max(1.25, Math.min(3, cam.scale * 0.35)) / cam.scale;
    ctx.lineCap = 'square';
    ctx.stroke(this.outline);
    ctx.restore();
  }

  /** White flash on freshly settled or conquered cells. */
  private drawClaims(ctx: CanvasRenderingContext2D, cam: Camera) {
    const { cols } = this.sim.world;
    ctx.save();
    ctx.fillStyle = this.css['neutral-0'];
    for (const c of this.sim.claims) {
      const age = (this.sim.time - c.t) / 1.2;
      if (age < 0 || age > 1) continue;
      ctx.globalAlpha = (1 - age) * 0.85;
      const x = c.cell % cols;
      const y = Math.floor(c.cell / cols);
      const grow = (1 - age) * Math.max(1.5, cam.scale * 0.6);
      ctx.fillRect(cam.ox + x * cam.scale - grow / 2, cam.oy + y * cam.scale - grow / 2, cam.scale + grow, cam.scale + grow);
    }
    ctx.restore();
  }

  /** Colours shared by every pixel sprite; 'C' (owner colour) is added per sprite. */
  private spritePalette(owner: string): SpritePalette {
    return {
      K: this.css['neutral-800'],
      M: this.css['neutral-0'],
      S: this.css['neutral-400'],
      D: this.css['neutral-600'],
      R: this.css['warning-700'],
      Y: this.css['warning-300'],
      G: this.css['success-500'],
      N: this.css['info-700'],
      C: owner
    };
  }

  /** Whole-number sprite pixel size: one screen pixel on the overview, chunkier as you zoom in. */
  private pixelSize(cam: Camera, factor: number): number {
    if (cam.scale < 1.6) return 1;
    return Math.max(2, Math.min(4, Math.round(cam.scale * factor)));
  }

  /** Farms as a barn by a striped field, ports as an anchor plaque — both pixel art. */
  private drawBuildings(ctx: CanvasRenderingContext2D, cam: Camera, width: number, height: number) {
    const sim = this.sim;
    const { cols } = sim.world;
    const px = this.pixelSize(cam, 0.45);
    const palette = this.spritePalette(this.css['neutral-500']);
    for (const b of sim.buildings) {
      if (sim.owner[b.cell] < 0) continue;
      const x = cam.ox + ((b.cell % cols) + 0.5) * cam.scale;
      const y = cam.oy + (Math.floor(b.cell / cols) + 0.5) * cam.scale;
      if (x < -40 || y < -40 || x > width + 40 || y > height + 40) continue;
      this.sprites.draw(ctx, b.kind, palette, x, y, px);
    }
    // Works still under way: a faint, breathing outline of what is to come.
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.15 * Math.sin(sim.time * 3);
    for (const d of sim.pendingDevelopments) {
      const x = cam.ox + ((d.cell % cols) + 0.5) * cam.scale;
      const y = cam.oy + (Math.floor(d.cell / cols) + 0.5) * cam.scale;
      if (x < -40 || y < -40 || x > width + 40 || y > height + 40) continue;
      const sprite = d.kind === 'vassal' ? 'town' : d.kind;
      this.sprites.draw(ctx, sprite, this.spritePalette(this.colorOf(d.owner)), x, y, px);
    }
    ctx.restore();
  }

  /** Camps of the besieging armies around the walls, with a ring counting down to the assault. */
  private drawSieges(ctx: CanvasRenderingContext2D, cam: Camera, width: number, height: number) {
    const sim = this.sim;
    const px = this.pixelSize(cam, 0.45);
    ctx.save();
    for (const a of sim.armies) {
      if (a.dead || a.siege < 0) continue;
      const q = sim.poleis[a.siege];
      const cx = cam.ox + q.cx * cam.scale;
      const cy = cam.oy + q.cy * cam.scale;
      if (cx < -60 || cy < -60 || cx > width + 60 || cy > height + 60) continue;
      const color = this.colorOf(a.owner);
      const palette = this.spritePalette(color);
      const [ox, oy] = this.campOffset(a.id, cam);
      for (const [dx, dy] of [[0, 0], [-8 * px, 4 * px], [8 * px, 4 * px]]) {
        this.sprites.draw(ctx, 'tent', palette, cx + ox + dx, cy + oy + dy, px);
      }
      // Ring around the walls: dashed while besieged, filling up towards the assault.
      const r = 6.5 * this.pixelSize(cam, 0.6) + 6;
      const progress = Math.min(1, (sim.time - a.siegeStart) / Math.max(0.001, a.siegeEnd - a.siegeStart));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'butt';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Where an army pitches its camp around a besieged capital: clear of the temple, stable per army. */
  private campOffset(id: number, cam: Camera): [number, number] {
    const angle = id * 2.399;
    const r = 6.5 * this.pixelSize(cam, 0.6) + 8 * this.pixelSize(cam, 0.45) + 14;
    return [Math.cos(angle) * r, Math.sin(angle) * r * 0.85];
  }

  // ─── Labels & capitals ────────────────────────────────────────────────────

  /** A peak glyph with an italic name for landmark mountains. */
  private drawLabels(ctx: CanvasRenderingContext2D, cam: Camera, opt: RenderOptions, width: number, height: number) {
    const w = this.sim.world;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const label of opt.labels) {
      const p = w.project(label.lon, label.lat);
      const sx = cam.ox + p.x * cam.scale;
      const sy = cam.oy + p.y * cam.scale;
      if (sx < -200 || sy < -40 || sx > width + 200 || sy > height + 40) continue;
      {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = this.css['text-dim'];
        ctx.beginPath();
        ctx.moveTo(sx, sy - 5);
        ctx.lineTo(sx + 5, sy + 3);
        ctx.lineTo(sx - 5, sy + 3);
        ctx.closePath();
        ctx.fill();
        ctx.font = `italic 500 11px ${this.font}`;
        ctx.letterSpacing = '0.04em';
        ctx.fillText(label.text, sx, sy + 13);
      }
    }
    ctx.restore();
  }

  private drawCapitals(ctx: CanvasRenderingContext2D, cam: Camera, opt: RenderOptions, width: number, height: number) {
    const sim = this.sim;
    const placed: Rect[] = (this.labelRects = []);
    const px = this.pixelSize(cam, 0.6);
    const size = 13 * px;
    const margin = 40;
    const onScreen = (p: { cx: number; cy: number }) => {
      const sx = cam.ox + p.cx * cam.scale;
      const sy = cam.oy + p.cy * cam.scale;
      return sx > -margin && sy > -margin && sx < width + margin && sy < height + margin;
    };
    const order = sim.poleis
      .filter(p => p.alive && onScreen(p))
      .sort((a, b) => Number(b.idx === sim.player) - Number(a.idx === sim.player) || b.cells - a.cells);
    // Fallen poleis that live on as cities inside the victor's borders.
    const remnants = sim.poleis.filter(p => !p.alive && p.remnant === 'city' && onScreen(p));

    ctx.save();
    for (const p of remnants) {
      const owner = sim.owner[p.capital];
      const color = owner >= 0 ? this.colorOf(owner) : this.css['neutral-400'];
      this.sprites.draw(ctx, 'town', this.spritePalette(color), cam.ox + p.cx * cam.scale, cam.oy + p.cy * cam.scale, px);
    }
    for (const p of order) {
      const sx = cam.ox + p.cx * cam.scale;
      const sy = cam.oy + p.cy * cam.scale;
      const isMe = p.idx === sim.player;
      if (isMe || p.idx === opt.hover || p.idx === opt.selected) {
        // Pixel halo: a square glow behind the temple.
        ctx.fillStyle = isMe ? this.css['accent'] : this.colorOf(p.idx);
        ctx.globalAlpha = 0.28;
        const halo = size + 6 * px;
        ctx.fillRect(Math.round(sx - halo / 2), Math.round(sy - halo / 2), halo, halo);
        ctx.globalAlpha = 1;
      }
      // Founding cities raise a temple; younger poleis are humbler towns.
      const sprite = p.def.kind === 'major' ? 'temple' : 'town';
      this.sprites.draw(ctx, sprite, this.spritePalette(this.colorOf(p.idx)), sx, sy, px);
      placed.push({ x: sx - size / 2, y: sy - size / 2, w: size, h: size });
    }

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    const labels = [
      ...order.map(p => ({ p, remnant: false })),
      ...remnants.map(p => ({ p, remnant: true }))
    ];
    for (const { p, remnant } of labels) {
      const isMe = p.idx === sim.player;
      const focus = !remnant && (isMe || p.idx === opt.hover || p.idx === opt.selected);
      const label = opt.names[p.idx];
      ctx.font = remnant ? `600 10px ${this.display}` : `700 11px ${this.display}`;
      const w = ctx.measureText(label).width + (remnant ? 12 : 20);
      const h = remnant ? 15 : 18;
      const sx = cam.ox + p.cx * cam.scale;
      const sy = cam.oy + p.cy * cam.scale;
      const gap = size / 2 + 4;
      const candidates: Rect[] = [
        { x: sx - w / 2, y: sy + gap, w, h },
        { x: sx - w / 2, y: sy - gap - h, w, h },
        { x: sx + gap, y: sy - h / 2, w, h },
        { x: sx - gap - w, y: sy - h / 2, w, h }
      ].map(r => ({ ...r, x: Math.max(4, Math.min(width - r.w - 4, r.x)), y: Math.max(4, Math.min(height - r.h - 4, r.y)) }));
      const spot = candidates.find(r => !placed.some(q => overlaps(r, q))) ?? (focus ? candidates[0] : null);
      if (!spot) continue;
      placed.push(spot);

      ctx.fillStyle = focus ? this.css['panel-bg-heavy'] : this.css['panel-bg'];
      ctx.strokeStyle = isMe || focus ? (isMe ? this.css['accent'] : this.colorOf(p.idx)) : this.css['line-strong'];
      ctx.lineWidth = isMe || focus ? 1.5 : 1;
      ctx.globalAlpha = remnant ? 0.85 : 1;
      ctx.beginPath();
      ctx.roundRect(spot.x, spot.y, spot.w, spot.h, h / 2);
      ctx.fill();
      ctx.stroke();
      if (!remnant) {
        ctx.fillStyle = this.colorOf(p.idx);
        ctx.beginPath();
        ctx.arc(spot.x + 9, spot.y + h / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = remnant ? this.css['text-dim'] : this.css['text-bright'];
      ctx.fillText(label, spot.x + spot.w / 2 + (remnant ? 0 : 3), spot.y + h / 2 + 0.5);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // ─── Armies & battles ─────────────────────────────────────────────────────

  /** City labels placed this frame; army counters steer clear of them. */
  private labelRects: Rect[] = [];

  private drawArmies(ctx: CanvasRenderingContext2D, cam: Camera, now: number) {
    const sim = this.sim;
    const me = sim.poleis[sim.player];
    const base = Math.max(5, Math.min(16, cam.scale * 2.6));
    ctx.save();
    for (const a of sim.armies) {
      if (a.battle || a.dead) continue;
      // The main host carries a larger shield than the raiding parties.
      const r = a.role === 'main' ? base * 1.2 : base * 0.85;
      let sx = cam.ox + a.x * cam.scale;
      let sy = cam.oy + a.y * cam.scale + Math.sin(now / 140 + a.id) * 0.8;
      if (a.siege >= 0) {
        const q = sim.poleis[a.siege];
        const [ox, oy] = this.campOffset(a.id, cam);
        sx = cam.ox + q.cx * cam.scale + ox;
        sy = cam.oy + q.cy * cam.scale + oy - 14;
      }
      const cell = sim.world.cellAt(a.x, a.y);
      const atSea = cell < 0 || sim.world.terrain[cell] === Terrain.Sea;
      const isMe = a.owner === sim.player;

      if (atSea) {
        // Trireme hull with oars
        ctx.fillStyle = this.css['neutral-600'];
        ctx.beginPath();
        ctx.moveTo(sx - r * 1.6, sy + r * 0.3);
        ctx.quadraticCurveTo(sx, sy + r * 1.5, sx + r * 1.7, sy + r * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = this.css['neutral-500'];
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let k = -1; k <= 1; k++) {
          const ox = sx + k * r * 0.6;
          ctx.moveTo(ox, sy + r * 0.8);
          ctx.lineTo(ox - r * 0.3, sy + r * 1.5 + Math.sin(now / 120 + k) * 1.2);
        }
        ctx.stroke();
      }

      if (a.stance === 'hold') {
        // Dug in: a ring of stakes that closes as the position is fortified.
        const k = (a.fortify - 1) / (RULES.holdPowerMax - 1);
        ctx.strokeStyle = this.css['text-bright'];
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(sx, sy, r + 5, -Math.PI / 2, -Math.PI / 2 + Math.max(0.15, k) * Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Hoplite shield (aspis)
      ctx.fillStyle = this.colorOf(a.owner);
      ctx.strokeStyle = isMe ? this.css['accent'] : this.css['text-bright'];
      ctx.lineWidth = isMe ? 2 : 1.2;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = this.css['neutral-0'];
      ctx.lineWidth = Math.max(1, r * 0.18);
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();

      if (a.dwell > 0) {
        ctx.strokeStyle = this.css['text-bright'];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, r + 3, -Math.PI / 2, -Math.PI / 2 + (a.dwell / RULES.captureDwell) * Math.PI * 2);
        ctx.stroke();
      }

      const involvesMe = isMe || (!!me && me.wars.has(a.owner));
      if (cam.scale >= 1.6 || involvesMe) {
        const text = String(Math.round(a.strength));
        ctx.font = `600 10px ${this.mono}`;
        const w = ctx.measureText(text).width + 8;
        // Above the shield by default; elsewhere if that would cover a city's name.
        const spots: Rect[] = [
          { x: sx - w / 2, y: sy - r - 17, w, h: 14 },
          { x: sx - w / 2, y: sy + r + 3, w, h: 14 },
          { x: sx + r + 2, y: sy - 7, w, h: 14 },
          { x: sx - r - 2 - w, y: sy - 7, w, h: 14 }
        ];
        const spot = spots.find(q => !this.labelRects.some(l => overlaps(q, l))) ?? spots[0];
        const bx = spot.x;
        const by = spot.y;
        ctx.fillStyle = this.css['panel-bg-heavy'];
        ctx.strokeStyle = this.css['line'];
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx, by, w, 14, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = this.css['text-main'];
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, bx + 4, by + 7.5);
      }
    }
    ctx.restore();
  }

  private drawBattles(ctx: CanvasRenderingContext2D, cam: Camera) {
    const r = Math.max(16, Math.min(36, cam.scale * 7));
    for (const b of this.sim.battles) {
      const style: FightCloudStyle = {
        font: this.font,
        ink: this.css['text-bright'],
        paper: this.css['neutral-0'],
        star: this.css['warning-300'],
        shaft: this.css['neutral-600'],
        sideA: this.colorOf(b.sideA),
        sideB: this.colorOf(b.sideB)
      };
      // Pop in at the start of the brawl
      const pop = Math.min(1, (this.sim.time - b.start) / 0.15);
      // The brawl swells as reinforcements pile in.
      const crowd = 1 + 0.15 * Math.max(0, b.attackers.length + b.defenders.length - 2);
      drawFightCloud(ctx, cam.ox + b.x * cam.scale, cam.oy + b.y * cam.scale, r * crowd * (0.6 + 0.4 * pop), this.sim.time, b.id, style);
    }
  }
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

