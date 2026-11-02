import { GREECE_MAP } from './data/greece-map';
import { MapData, Terrain, decodeMapPixels } from './world';

/**
 * Fetches and decodes `assets/map/hellas.png` in the browser. Colour management is disabled so the
 * terrain and elevation bytes arrive exactly as encoded; the Greek cell count guards against drift.
 */
export async function loadMapData(onProgress?: (fraction: number) => void): Promise<MapData> {
  const res = await fetch(GREECE_MAP.url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${GREECE_MAP.url}`);
  onProgress?.(0.4);
  const bitmap = await createImageBitmap(await res.blob(), {
    colorSpaceConversion: 'none',
    premultiplyAlpha: 'none'
  });
  onProgress?.(0.6);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0);
  const pixels = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
  const data = decodeMapPixels(pixels, 4, bitmap.width, bitmap.height);

  let greek = 0;
  for (const t of data.terrain) if (t === Terrain.Greek) greek++;
  if (greek !== GREECE_MAP.greekCells) throw new Error(`Map decoded inconsistently (${greek} Greek cells)`);
  onProgress?.(0.8);
  return data;
}
