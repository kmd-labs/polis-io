import { GREECE_MAP } from './data/greece-map';
import { valueNoise } from './rng';

export enum Terrain {
  Sea = 0,
  Greek = 1,
  Foreign = 2
}

/**
 * Static geography of the pixel map: terrain class, fertility and coastline per cell.
 * Cells are addressed by flat index `i = y * cols + x`.
 */
export class World {
  readonly cols = GREECE_MAP.cols;
  readonly rows = GREECE_MAP.rows;
  readonly size = this.cols * this.rows;
  readonly terrain = new Uint8Array(this.size);
  /** 0.2 – 1.0 agricultural yield of a Greek land cell (0 elsewhere). */
  readonly fertility = new Float32Array(this.size);
  /** Sea cell touching land — rendered as shallow water. */
  readonly shallow = new Uint8Array(this.size);
  /** Flat indices of every Greek land cell. */
  readonly greekCells: Int32Array;

  constructor() {
    let i = 0;
    for (const m of GREECE_MAP.rle.matchAll(/(\d+)(.)/g)) {
      const t = m[2] === 'g' ? Terrain.Greek : m[2] === 'f' ? Terrain.Foreign : Terrain.Sea;
      this.terrain.fill(t, i, i + Number(m[1]));
      i += Number(m[1]);
    }

    const greek: number[] = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const c = y * this.cols + x;
        if (this.terrain[c] === Terrain.Sea) {
          this.shallow[c] = this.neighbours8(x, y).some(n => this.terrain[n] !== Terrain.Sea) ? 1 : 0;
          continue;
        }
        if (this.terrain[c] !== Terrain.Greek) continue;
        greek.push(c);
        const n = 0.6 * valueNoise(x / 9, y / 9, 7) + 0.4 * valueNoise(x / 3.5, y / 3.5, 11);
        const coastal = this.neighbours8(x, y).some(k => this.terrain[k] === Terrain.Sea) ? 0.12 : 0;
        this.fertility[c] = Math.min(1, Math.max(0.2, 0.15 + n * 0.85 + coastal));
      }
    }
    this.greekCells = Int32Array.from(greek);
  }

  index(x: number, y: number): number {
    return y * this.cols + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }

  /** Cell under a fractional map coordinate, or -1 when outside the map. */
  cellAt(x: number, y: number): number {
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    return this.inBounds(cx, cy) ? this.index(cx, cy) : -1;
  }

  /** Map coordinates (cell units) of a longitude / latitude. */
  project(lon: number, lat: number): { x: number; y: number } {
    return {
      x: (lon - GREECE_MAP.lon0) / GREECE_MAP.cellLon,
      y: (GREECE_MAP.lat1 - lat) / GREECE_MAP.cellLat
    };
  }

  neighbours4(x: number, y: number): number[] {
    const out: number[] = [];
    if (x > 0) out.push(this.index(x - 1, y));
    if (x < this.cols - 1) out.push(this.index(x + 1, y));
    if (y > 0) out.push(this.index(x, y - 1));
    if (y < this.rows - 1) out.push(this.index(x, y + 1));
    return out;
  }

  neighbours8(x: number, y: number): number[] {
    const out: number[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if ((dx || dy) && this.inBounds(x + dx, y + dy)) out.push(this.index(x + dx, y + dy));
      }
    }
    return out;
  }

  /** Nearest Greek land cell to a (possibly off-shore) coordinate. */
  nearestGreekCell(x: number, y: number): number {
    let best = -1;
    let bestD = Infinity;
    for (const c of this.greekCells) {
      const dx = (c % this.cols) + 0.5 - x;
      const dy = Math.floor(c / this.cols) + 0.5 - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }
}
