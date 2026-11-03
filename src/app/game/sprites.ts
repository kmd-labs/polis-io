/**
 * Hand-drawn pixel-art sprites. Each row is a string of palette keys; '.' is transparent.
 * Keys: K ink outline, M marble, S shadow, C owner colour, D door, R roof tiles,
 * Y ripe wheat, G green field, N navy.
 */
export const SPRITES = {
  temple: [
    '......K......',
    '....KKCKK....',
    '..KKCCCCCKK..',
    'KKCCCCCCCCCKK',
    'KKKKKKKKKKKKK',
    '.KMMMMMMMMMK.',
    '..MSMSMSMSM..',
    '..MSMSMSMSM..',
    '..MSMSMSMSM..',
    '.KMMMMMMMMMK.',
    'KKKKKKKKKKKKK'
  ],
  town: [
    '...K...K...',
    '..KCK.KCK..',
    '.KCCCKCCCK.',
    'KCCCCCCCCCK',
    'KMMDMMMDMMK',
    'KMMDMMMDMMK',
    'KKKKKKKKKKK'
  ],
  farm: [
    '....KKK....',
    '...KRRRK...',
    '..KRRRRRK..',
    '..KMMDMMK..',
    'KKKKKKKKKKK',
    'KYGYGYGYGYK',
    'KGYGYGYGYGK',
    'KYGYGYGYGYK',
    'KKKKKKKKKKK'
  ],
  port: [
    'KKKKKKKKKKK',
    'KMMMMNMMMMK',
    'KMMMNMNMMMK',
    'KMMMMNMMMMK',
    'KMNNNNNNNMK',
    'KMMMMNMMMMK',
    'KNMMMNMMMNK',
    'KNNMMNMMNNK',
    'KMNNNNNNNMK',
    'KMMMMMMMMMK',
    'KKKKKKKKKKK'
  ],
  tent: [
    '...K...',
    '..KCK..',
    '.KCCCK.',
    'KCCKCCK',
    'KKKKKKK'
  ]
} as const;

export type SpriteName = keyof typeof SPRITES;
export type SpritePalette = Partial<Record<string, string>>;

/**
 * Renders sprites to small offscreen canvases (one per sprite and palette) and blits them with
 * nearest-neighbour scaling at whole-pixel positions, so they stay crisp at every zoom.
 */
export class SpriteAtlas {
  private readonly cache = new Map<string, HTMLCanvasElement>();

  draw(
    ctx: CanvasRenderingContext2D,
    name: SpriteName,
    palette: SpritePalette,
    cx: number,
    cy: number,
    pixel: number
  ) {
    const rows = SPRITES[name];
    const key = `${name}|${Object.entries(palette).map(([k, v]) => k + v).join()}`;
    let canvas = this.cache.get(key);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = rows[0].length;
      canvas.height = rows.length;
      const c = canvas.getContext('2d')!;
      rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const color = palette[row[x]];
          if (row[x] === '.' || !color) continue;
          c.fillStyle = color;
          c.fillRect(x, y, 1, 1);
        }
      });
      this.cache.set(key, canvas);
    }
    const w = canvas.width * pixel;
    const h = canvas.height * pixel;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
  }

  clear() {
    this.cache.clear();
  }
}
