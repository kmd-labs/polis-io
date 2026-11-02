import { ThemeService } from '@kmd/design-system';
import { drawFightCloud, FightCloudStyle } from './fight-cloud';
import { hash01 } from './rng';
import { FOREIGN, RULES, SEA, Simulation, WILD } from './simulation';
import { Terrain } from './world';

/** Screen transform: screenX = ox + mapX * scale. */
export interface Camera {
  scale: number;
  ox: number;
  oy: number;
}

export type MapView = 'political' | 'fertility';

export interface RenderOptions {
  view: MapView;
  hover: number;
  selected: number;
  /** Localized polis names, indexed like `sim.poleis`. */
  names: string[];
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

/**
 * Paints the pixel map of Hellas: territory raster (one canvas pixel per map cell, scaled
 * with nearest-neighbour), settlement flashes, capitals with frosted name badges,
 * marching armies and cartoon battles.
 */
export class MapRenderer {
  private readonly raster = document.createElement('canvas');
  private readonly image: ImageData;
  private paintedKey = '';
  private outline: Path2D | null = null;
  private outlineKey = '';

  private readonly css: Record<string, string> = {};
  private readonly rgb: Record<string, Rgb> = {};
  private polisRgb: Rgb[] = [];
  private polisCss: string[] = [];
  private font = '"Inter", sans-serif';
  private mono = 'monospace';

  constructor(
    private readonly sim: Simulation,
    private readonly theme: ThemeService
  ) {
    const { cols, rows } = sim.world;
    this.raster.width = cols;
    this.raster.height = rows;
    this.image = new ImageData(cols, rows);
    this.resolveTokens();
  }

  /** Reads every colour from the design-system CSS tokens. */
  resolveTokens() {
    const tokens = [
      'bg-deep', 'neutral-0', 'neutral-100', 'neutral-200', 'neutral-300', 'neutral-400', 'neutral-500',
      'neutral-600', 'neutral-800', 'success-100', 'success-600', 'success-800', 'accent', 'warning-300',
      'text-bright', 'text-main', 'panel-bg', 'panel-bg-heavy', 'line', 'line-strong', 'danger-600'
    ];
    for (const t of tokens) {
      this.css[t] = this.theme.getTokenColor(t, '#888888');
      this.rgb[t] = parseColor(this.css[t]);
    }
    this.polisCss = this.sim.poleis.map(p => this.theme.getTokenColor(p.def.color, '#64748b'));
    this.polisRgb = this.polisCss.map(parseColor);
    this.font = this.theme.getFontFamily();
    this.mono = getComputedStyle(document.documentElement).getPropertyValue('--font-family-mono').trim() || 'monospace';
    this.paintedKey = '';
  }

  colorOf(idx: number): string {
    return this.polisCss[idx] ?? this.css['neutral-500'];
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, cam: Camera, opt: RenderOptions, now: number) {
    const { cols, rows } = this.sim.world;
    this.paintRaster(opt);

    ctx.fillStyle = this.css['bg-deep'];
    ctx.fillRect(0, 0, width, height);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.raster, cam.ox, cam.oy, cols * cam.scale, rows * cam.scale);

    this.drawGrid(ctx, cam, width, height);
    this.drawPlayerOutline(ctx, cam);
    this.drawClaims(ctx, cam);
    this.drawCapitals(ctx, cam, opt, width, height);
    this.drawArmies(ctx, cam, now);
    this.drawBattles(ctx, cam);
  }

  // ─── Territory raster ─────────────────────────────────────────────────────

  private paintRaster(opt: RenderOptions) {
    const sim = this.sim;
    const me = sim.poleis[sim.player];
    const wars = me ? [...me.wars].join(',') : '';
    const key = `${sim.version}|${opt.view}|${opt.hover}|${opt.selected}|${sim.player}|${wars}`;
    if (key === this.paintedKey) return;
    this.paintedKey = key;

    const { cols, rows, terrain, fertility, shallow } = sim.world;
    const owner = sim.owner;
    const data = this.image.data;
    const c = this.rgb;
    const white = c['neutral-0'];
    const fertLow = c['neutral-200'];
    const fertHigh = c['success-600'];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const o = owner[i];
        let col: Rgb;

        if (o === SEA) {
          col = shallow[i] ? c['neutral-100'] : c['bg-deep'];
        } else if (o === FOREIGN) {
          col = (x + y) % 6 === 0 ? mix(c['neutral-100'], c['neutral-200'], 0.7) : c['neutral-100'];
        } else {
          const border =
            (x > 0 && owner[i - 1] !== o) ||
            (x < cols - 1 && owner[i + 1] !== o) ||
            (y > 0 && owner[i - cols] !== o) ||
            (y < rows - 1 && owner[i + cols] !== o);

          if (opt.view === 'fertility') {
            col = mix(fertLow, fertHigh, (fertility[i] - 0.2) / 0.8);
            if (o >= 0 && border) col = this.polisRgb[o];
          } else if (o === WILD) {
            // Scrubland speckle — darker where the soil is poor
            const speck = hash01(x, y, 5) < 0.18 - fertility[i] * 0.1;
            col = speck ? mix(c['neutral-300'], c['neutral-400'], 0.55) : c['neutral-300'];
          } else {
            const base = this.polisRgb[o];
            const focus = o === opt.hover || o === opt.selected;
            const hostile = !!me && me.wars.has(o) && (x + y) % 4 === 0;
            if (border) {
              col = base;
            } else if (hostile) {
              col = mix(base, white, 0.15);
            } else {
              col = mix(base, white, focus ? 0.28 : 0.48);
            }
          }
        }

        const p = i * 4;
        data[p] = col[0];
        data[p + 1] = col[1];
        data[p + 2] = col[2];
        data[p + 3] = terrain[i] === Terrain.Sea && !shallow[i] ? 0 : 255;
      }
    }
    this.raster.getContext('2d')!.putImageData(this.image, 0, 0);
  }

  /** Hairline gaps between cells once they are large enough to read as tiles. */
  private drawGrid(ctx: CanvasRenderingContext2D, cam: Camera, width: number, height: number) {
    if (cam.scale < 9) return;
    const { cols, rows } = this.sim.world;
    ctx.save();
    ctx.strokeStyle = this.css['bg-deep'];
    ctx.globalAlpha = Math.min(0.5, (cam.scale - 9) / 10 + 0.2);
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
    if (sim.player < 0) return;
    const key = `${sim.version}|${sim.player}`;
    if (key !== this.outlineKey) {
      this.outlineKey = key;
      const { cols, rows } = sim.world;
      const own = sim.owner;
      const me = sim.player;
      const path = new Path2D();
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          if (own[i] !== me) continue;
          if (y === 0 || own[i - cols] !== me) {
            path.moveTo(x, y);
            path.lineTo(x + 1, y);
          }
          if (y === rows - 1 || own[i + cols] !== me) {
            path.moveTo(x, y + 1);
            path.lineTo(x + 1, y + 1);
          }
          if (x === 0 || own[i - 1] !== me) {
            path.moveTo(x, y);
            path.lineTo(x, y + 1);
          }
          if (x === cols - 1 || own[i + 1] !== me) {
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
    ctx.lineWidth = Math.max(1.5, Math.min(3, cam.scale * 0.3)) / cam.scale;
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
      ctx.globalAlpha = (1 - age) * 0.9;
      const x = c.cell % cols;
      const y = Math.floor(c.cell / cols);
      const grow = (1 - age) * cam.scale * 0.6;
      ctx.fillRect(cam.ox + x * cam.scale - grow / 2, cam.oy + y * cam.scale - grow / 2, cam.scale + grow, cam.scale + grow);
    }
    ctx.restore();
  }

  // ─── Capitals & labels ────────────────────────────────────────────────────

  private drawCapitals(ctx: CanvasRenderingContext2D, cam: Camera, opt: RenderOptions, width: number, height: number) {
    const placed: Rect[] = [];
    const size = Math.max(9, Math.min(20, cam.scale * 2));
    const margin = 40;
    const order = this.sim.poleis
      .filter(p => {
        const sx = cam.ox + p.cx * cam.scale;
        const sy = cam.oy + p.cy * cam.scale;
        return p.alive && sx > -margin && sy > -margin && sx < width + margin && sy < height + margin;
      })
      .sort((a, b) => Number(b.idx === this.sim.player) - Number(a.idx === this.sim.player) || b.cells - a.cells);

    ctx.save();
    for (const p of order) {
      const sx = cam.ox + p.cx * cam.scale;
      const sy = cam.oy + p.cy * cam.scale;
      const isMe = p.idx === this.sim.player;
      this.drawTemple(ctx, sx, sy, size, this.colorOf(p.idx), isMe);
      placed.push({ x: sx - size / 2, y: sy - size / 2, w: size, h: size });
    }

    ctx.font = `600 11px ${this.font}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    for (const p of order) {
      const isMe = p.idx === this.sim.player;
      const focus = isMe || p.idx === opt.hover || p.idx === opt.selected;
      const label = opt.names[p.idx];
      const w = ctx.measureText(label).width + 16;
      const h = 18;
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
      ctx.strokeStyle = isMe ? this.css['accent'] : this.css['line-strong'];
      ctx.lineWidth = isMe ? 1.5 : 1;
      ctx.beginPath();
      ctx.roundRect(spot.x, spot.y, spot.w, spot.h, h / 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = this.colorOf(p.idx);
      ctx.beginPath();
      ctx.arc(spot.x + 8, spot.y + h / 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.css['text-bright'];
      ctx.fillText(label, spot.x + spot.w / 2 + 3, spot.y + h / 2 + 0.5);
    }
    ctx.restore();
  }

  /** Tiny Doric temple: stylobate, three columns and a pediment. */
  private drawTemple(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, isMe: boolean) {
    const ink = this.css['text-bright'];
    if (isMe) {
      ctx.fillStyle = this.css['accent'];
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(x, y, s * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    const l = x - s / 2;
    const t = y - s / 2;
    ctx.fillStyle = this.css['neutral-0'];
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1, s / 12);
    ctx.beginPath();
    ctx.moveTo(l, t + s * 0.36);
    ctx.lineTo(x, t);
    ctx.lineTo(l + s, t + s * 0.36);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = this.css['neutral-0'];
    ctx.fillRect(l + s * 0.08, t + s * 0.42, s * 0.84, s * 0.4);
    ctx.fillStyle = ink;
    for (let k = 0; k < 3; k++) ctx.fillRect(l + s * (0.18 + k * 0.28), t + s * 0.42, Math.max(1, s * 0.1), s * 0.4);
    ctx.fillRect(l, t + s * 0.84, s, s * 0.14);
  }

  // ─── Armies & battles ─────────────────────────────────────────────────────

  private drawArmies(ctx: CanvasRenderingContext2D, cam: Camera, now: number) {
    const sim = this.sim;
    const me = sim.poleis[sim.player];
    const r = Math.max(4.5, Math.min(16, cam.scale * 0.95));
    ctx.save();
    for (const a of sim.armies) {
      if (a.battle || a.dead) continue;
      const sx = cam.ox + a.x * cam.scale;
      const sy = cam.oy + a.y * cam.scale + Math.sin(now / 140 + a.id) * 0.8;
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
      if (cam.scale >= 4.5 || involvesMe) {
        const text = String(Math.round(a.strength));
        ctx.font = `600 10px ${this.mono}`;
        const w = ctx.measureText(text).width + 8;
        const bx = sx + r + 2;
        const by = sy - 7;
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
    const r = Math.max(15, Math.min(34, cam.scale * 2.4));
    for (const b of this.sim.battles) {
      const style: FightCloudStyle = {
        font: this.font,
        ink: this.css['text-bright'],
        paper: this.css['neutral-0'],
        star: this.css['warning-300'],
        shaft: this.css['neutral-600'],
        sideA: this.colorOf(b.attacker.owner),
        sideB: this.colorOf(b.defenderIdx)
      };
      // Pop in at the start of the brawl
      const pop = Math.min(1, (this.sim.time - b.start) / 0.15);
      drawFightCloud(ctx, cam.ox + b.x * cam.scale, cam.oy + b.y * cam.scale, r * (0.6 + 0.4 * pop), this.sim.time, b.id, style);
    }
  }
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
