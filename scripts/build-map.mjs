#!/usr/bin/env node
/**
 * Builds the pixel map of Hellas:
 *  1. rasterizes Natural Earth 1:10m country polygons into terrain classes
 *     (sea / Greek land, playable / foreign land, rendered only);
 *  2. samples elevation & bathymetry for every cell from AWS Terrain Tiles (Terrarium encoding).
 *
 * Output:
 *  - src/assets/map/hellas.png         R = terrain class, G/B = elevation (see ELEVATION_* below)
 *  - src/app/game/data/greece-map.ts   grid metadata
 *
 * Downloads are cached in node_modules/.cache/polis-map. Usage: node scripts/build-map.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, encodePngRgb } from './png.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(ROOT, 'node_modules/.cache/polis-map');
const OUT_PNG = path.join(ROOT, 'src/assets/map/hellas.png');
const OUT_TS = path.join(ROOT, 'src/app/game/data/greece-map.ts');

const COUNTRIES =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson';
const TILE = (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
const TILE_ZOOM = 8;

// Map window (degrees). Cells are square on the ground at the window's mid latitude.
const LON0 = 19.2;
const LON1 = 28.4;
const LAT0 = 34.75;
const LAT1 = 41.85;
const CELL_LAT = 0.00565;
const MID_LAT = (LAT0 + LAT1) / 2;
const CELL_LON = CELL_LAT / Math.cos((MID_LAT * Math.PI) / 180);
const CELL_KM = CELL_LAT * 111.2;

// Elevation is stored in 5 m steps, offset so ocean depths stay positive.
const ELEVATION_STEP = 5;
const ELEVATION_OFFSET = 1200;

const cols = Math.round((LON1 - LON0) / CELL_LON);
const rows = Math.round((LAT1 - LAT0) / CELL_LAT);

async function cached(url, file) {
  const p = path.join(CACHE, file);
  if (fs.existsSync(p)) return fs.readFileSync(p);
  console.log(`  ↓ ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, buf);
  return buf;
}

// ─── 1. Terrain classes ──────────────────────────────────────────────────────

console.log('Rasterizing coastlines & borders…');
const geo = JSON.parse((await cached(COUNTRIES, 'countries.geojson')).toString('utf8'));
const terrain = new Uint8Array(cols * rows); // 0 sea, 1 Greek, 2 foreign

function ringsOf(feature) {
  const g = feature.geometry;
  if (!g) return [];
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  const rings = [];
  for (const poly of polys) {
    for (const ring of poly) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      if (maxX < LON0 || minX > LON1 || maxY < LAT0 || minY > LAT1) continue;
      rings.push(ring);
    }
  }
  return rings;
}

/** Even-odd scanline fill of all rings, sampling at cell centres. */
function fill(rings, value) {
  for (let r = 0; r < rows; r++) {
    const lat = LAT1 - (r + 0.5) * CELL_LAT;
    const xs = [];
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if ((yi > lat) !== (yj > lat)) xs.push(xi + ((lat - yi) / (yj - yi)) * (xj - xi));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const c0 = Math.max(0, Math.ceil((xs[k] - LON0) / CELL_LON - 0.5));
      const c1 = Math.min(cols - 1, Math.floor((xs[k + 1] - LON0) / CELL_LON - 0.5));
      for (let c = c0; c <= c1; c++) terrain[r * cols + c] = value;
    }
  }
}

let foundGreece = false;
for (const f of geo.features) {
  const iso = f.properties.ADM0_A3 ?? f.properties.ISO_A3;
  const rings = ringsOf(f);
  if (!rings.length) continue;
  fill(rings, iso === 'GRC' ? 1 : 2);
  foundGreece ||= iso === 'GRC';
}
if (!foundGreece) throw new Error('Greece not found in source data');

// ─── 2. Elevation ────────────────────────────────────────────────────────────

console.log('Sampling elevation…');
const n = 2 ** TILE_ZOOM;
const tileX = lon => ((lon + 180) / 360) * n;
const tileY = lat => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
};
const tiles = new Map();
for (let ty = Math.floor(tileY(LAT1)); ty <= Math.floor(tileY(LAT0)); ty++) {
  for (let tx = Math.floor(tileX(LON0)); tx <= Math.floor(tileX(LON1)); tx++) {
    const png = decodePng(await cached(TILE(TILE_ZOOM, tx, ty), `terrarium-${TILE_ZOOM}-${tx}-${ty}.png`));
    tiles.set(`${tx}/${ty}`, png);
  }
}

/** Terrarium elevation (metres) at a global tile-pixel coordinate. */
function pixel(px, py) {
  const tx = Math.floor(px / 256);
  const ty = Math.floor(py / 256);
  const t = tiles.get(`${tx}/${ty}`);
  if (!t) return 0;
  const i = ((py - ty * 256) * 256 + (px - tx * 256)) * t.channels;
  return t.data[i] * 256 + t.data[i + 1] + t.data[i + 2] / 256 - 32768;
}

/** Mean elevation over the cell footprint (tile pixels are ~0.5 km at zoom 8). */
function sample(lon, lat) {
  const x0 = tileX(lon - CELL_LON / 2) * 256;
  const x1 = tileX(lon + CELL_LON / 2) * 256;
  const y0 = tileY(lat + CELL_LAT / 2) * 256;
  const y1 = tileY(lat - CELL_LAT / 2) * 256;
  let sum = 0;
  let count = 0;
  for (let py = Math.floor(y0); py <= Math.floor(y1); py++) {
    for (let px = Math.floor(x0); px <= Math.floor(x1); px++) {
      sum += pixel(px, py);
      count++;
    }
  }
  return sum / count;
}

const rgb = Buffer.alloc(cols * rows * 3);
for (let r = 0; r < rows; r++) {
  const lat = LAT1 - (r + 0.5) * CELL_LAT;
  for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    let e = sample(LON0 + (c + 0.5) * CELL_LON, lat);
    // Keep the coastline consistent with Natural Earth.
    e = terrain[i] === 0 ? Math.min(e, -2) : Math.max(e, 2);
    const v = Math.max(0, Math.min(65535, Math.round(e / ELEVATION_STEP) + ELEVATION_OFFSET));
    rgb[i * 3] = terrain[i];
    rgb[i * 3 + 1] = v >> 8;
    rgb[i * 3 + 2] = v & 255;
  }
}

fs.mkdirSync(path.dirname(OUT_PNG), { recursive: true });
fs.writeFileSync(OUT_PNG, encodePngRgb(cols, rows, rgb));

const greekCells = terrain.reduce((s, t) => s + (t === 1 ? 1 : 0), 0);
fs.writeFileSync(
  OUT_TS,
  `// AUTO-GENERATED by scripts/build-map.mjs. Do not edit.
// Sources: Natural Earth 1:10m (public domain), AWS Terrain Tiles / Mapzen Terrarium.

/** Grid metadata of src/assets/map/hellas.png (R = terrain class, G/B = elevation). */
export const GREECE_MAP = {
  url: 'assets/map/hellas.png',
  cols: ${cols},
  rows: ${rows},
  lon0: ${LON0},
  lat1: ${LAT1},
  cellLon: ${CELL_LON.toFixed(7)},
  cellLat: ${CELL_LAT},
  /** Edge length of one cell on the ground. */
  cellKm: ${CELL_KM.toFixed(3)},
  greekCells: ${greekCells},
  elevationStep: ${ELEVATION_STEP},
  elevationOffset: ${ELEVATION_OFFSET}
} as const;
`,
  'utf8'
);
const kb = (fs.statSync(OUT_PNG).size / 1024).toFixed(0);
console.log(`✅ ${cols}×${rows} cells (${greekCells} Greek), hellas.png ${kb} KB`);
