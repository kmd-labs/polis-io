import { ISLETS } from './data/frontier';
import { GREECE_MAP } from './data/greece-map';
import { hash01, valueNoise } from './rng';

export enum Terrain {
  Sea = 0,
  Greek = 1,
  Foreign = 2
}

/** Decoded contents of the map raster. */
export interface MapData {
  cols: number;
  rows: number;
  terrain: Uint8Array;
  /** Metres above sea level; negative values are sea depth. */
  elevation: Float32Array;
}

/**
 * Decodes the R (terrain) and G/B (elevation) channels of `assets/map/hellas.png`.
 * `channels` is the stride of `pixels` (3 for RGB, 4 for canvas RGBA).
 */
export function decodeMapPixels(pixels: ArrayLike<number>, channels: number, cols: number, rows: number): MapData {
  const size = cols * rows;
  const terrain = new Uint8Array(size);
  const elevation = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    const p = i * channels;
    terrain[i] = pixels[p];
    elevation[i] = (pixels[p + 1] * 256 + pixels[p + 2] - GREECE_MAP.elevationOffset) * GREECE_MAP.elevationStep;
  }
  return { cols, rows, terrain, elevation };
}

/** Vertical exaggeration of the hillshade on land and on the sea floor. */
/**
 * Cells per edge of the original 1.26 km cell the game was tuned on: lengths measured in cells scale
 * by this, areas (cell counts) by its square.
 */
export const GRID_SCALE = Math.round((0.0113 / GREECE_MAP.cellLat) * 1000) / 1000;

const RELIEF_LAND = 1.6;
const RELIEF_SEA = 0.5;

/**
 * Static geography of the pixel map: terrain class, elevation, hillshade, fertility and coastline.
 * Cells are addressed by flat index `i = y * cols + x`.
 */
export class World {
  readonly cols: number;
  readonly rows: number;
  readonly size: number;
  readonly cellKm = GREECE_MAP.cellKm;
  readonly terrain: Uint8Array;
  readonly elevation: Float32Array;
  /** Lambert hillshade, lit from the north-west; 1 = flat ground. */
  readonly shade: Float32Array;
  /** 0.12 – 1.0 agricultural yield of a Greek land cell (0 elsewhere). */
  readonly fertility: Float32Array;
  /** Sea cell touching land — rendered as surf. */
  readonly shallow: Uint8Array;
  /** Which body of land each cell belongs to (−1 for the sea): cities on the same one can march on each other. */
  landmass: Int32Array = new Int32Array(0);
  /** Flat indices of every Greek land cell that touches the sea (where a harbour can be). */
  coastalGreek: Int32Array = new Int32Array(0);
  /** Flat indices of every Greek land cell. */
  readonly greekCells: Int32Array;

  constructor(data: MapData) {
    this.cols = data.cols;
    this.rows = data.rows;
    this.size = data.cols * data.rows;
    this.terrain = data.terrain;
    this.elevation = data.elevation;
    this.shade = new Float32Array(this.size);
    this.fertility = new Float32Array(this.size);
    this.shallow = new Uint8Array(this.size);

    this.addIslets();
    const { cols, rows, terrain, elevation } = this;
    const cellM = this.cellKm * 1000;
    // Light from the north-west, 40° above the horizon.
    const lx = -0.54;
    const ly = -0.54;
    const lz = 0.64;
    const greek: number[] = [];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const sea = terrain[i] === Terrain.Sea;
        // Clamp across the coastline so the shore itself does not read as a cliff.
        const h = (j: number) => (sea ? Math.min(elevation[j], 0) : Math.max(elevation[j], 0));
        const xl = x > 0 ? i - 1 : i;
        const xr = x < cols - 1 ? i + 1 : i;
        const yu = y > 0 ? i - cols : i;
        const yd = y < rows - 1 ? i + cols : i;
        const z = sea ? RELIEF_SEA : RELIEF_LAND;
        const dx = ((h(xr) - h(xl)) / (2 * cellM)) * z;
        const dy = ((h(yd) - h(yu)) / (2 * cellM)) * z;
        const len = Math.hypot(dx, dy, 1);
        this.shade[i] = Math.max(0.68, Math.min(1.22, (-dx * lx - dy * ly + lz) / len / lz));

        let coastal = false;
        for (let dy2 = -1; dy2 <= 1 && !coastal; dy2++) {
          for (let dx2 = -1; dx2 <= 1; dx2++) {
            const nx = x + dx2;
            const ny = y + dy2;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            if ((terrain[ny * cols + nx] === Terrain.Sea) !== sea) {
              coastal = true;
              break;
            }
          }
        }
        if (sea) {
          this.shallow[i] = coastal ? 1 : 0;
          continue;
        }
        if (terrain[i] !== Terrain.Greek) continue;
        greek.push(i);
        // Plains and gentle valleys feed people; mountains and steep slopes do not.
        const altitude = 1 - Math.min(1, elevation[i] / 1500) * 0.8;
        const slope = 1 - Math.min(0.45, (Math.hypot(dx, dy) / RELIEF_LAND) * 15);
        const noise = 0.85 + 0.3 * valueNoise(x / (14 * GRID_SCALE), y / (14 * GRID_SCALE), 7) + 0.05 * (hash01(x, y, 2) - 0.5);
        this.fertility[i] = Math.min(1, Math.max(0.12, altitude * slope * noise + (coastal ? 0.06 : 0)));
      }
    }
    this.greekCells = Int32Array.from(greek);
    this.labelLandmasses();
    this.coastalGreek = Int32Array.from(greek.filter(i => [0, 1, 2, 3].some(k => {
      const n = this.neighbour(i, k);
      return n >= 0 && terrain[n] === Terrain.Sea;
    })));
  }

  /** Small islands the coastline data misses become low Greek land (only where the raster is sea). */
  private addIslets() {
    for (const islet of ISLETS) {
      const p = this.project(islet.lon, islet.lat);
      const r = Math.round(islet.r * GRID_SCALE);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.hypot(dx, dy) > r + 0.25) continue;
          const c = this.cellAt(p.x + dx, p.y + dy);
          if (c < 0 || this.terrain[c] !== Terrain.Sea) continue;
          this.terrain[c] = Terrain.Greek;
          this.elevation[c] = 20 + Math.round(hash01(c % this.cols, Math.floor(c / this.cols), 11) * 90);
        }
      }
    }
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

  /** Numbers every connected body of land (4-neighbours), so armies need no ships within one. */
  private labelLandmasses() {
    const mass = new Int32Array(this.size).fill(-1);
    const stack: number[] = [];
    let next = 0;
    for (let i = 0; i < this.size; i++) {
      if (mass[i] >= 0 || this.terrain[i] === Terrain.Sea) continue;
      mass[i] = next;
      stack.push(i);
      while (stack.length) {
        const c = stack.pop()!;
        for (let k = 0; k < 4; k++) {
          const n = this.neighbour(c, k);
          if (n < 0 || mass[n] >= 0 || this.terrain[n] === Terrain.Sea) continue;
          mass[n] = next;
          stack.push(n);
        }
      }
      next++;
    }
    this.landmass = mass;
  }

  /** The k-th (0–3: west, east, north, south) neighbour of a cell, or -1 off the map. Allocation-free for hot loops. */
  neighbour(c: number, k: number): number {
    const cols = this.cols;
    if (k === 0) return c % cols > 0 ? c - 1 : -1;
    if (k === 1) return c % cols < cols - 1 ? c + 1 : -1;
    if (k === 2) return c >= cols ? c - cols : -1;
    return c + cols < this.size ? c + cols : -1;
  }

  neighbours4(x: number, y: number): number[] {
    const out: number[] = [];
    if (x > 0) out.push(this.index(x - 1, y));
    if (x < this.cols - 1) out.push(this.index(x + 1, y));
    if (y > 0) out.push(this.index(x, y - 1));
    if (y < this.rows - 1) out.push(this.index(x, y + 1));
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
