/**
 * Minimal dependency-free PNG codec (8-bit greyscale / RGB / RGBA / palette, non-interlaced).
 * Used by the map build script and headless simulation tests.
 */
import zlib from 'node:zlib';

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Decodes a PNG into { width, height, channels, data } with 8-bit samples (palette expanded to RGB). */
export function decodePng(buf) {
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  let palette = null;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const body = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      bitDepth = body[8];
      colorType = body[9];
      interlace = body[12];
    } else if (type === 'PLTE') {
      palette = body;
    } else if (type === 'IDAT') {
      idat.push(body);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  if (bitDepth !== 8 || interlace) throw new Error(`Unsupported PNG (depth ${bitDepth}, interlace ${interlace})`);
  const bpp = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[dst + x - bpp] : 0;
      const b = y ? out[dst - stride + x] : 0;
      const c = x >= bpp && y ? out[dst - stride + x - bpp] : 0;
      const v = raw[src + x];
      out[dst + x] =
        filter === 0 ? v
        : filter === 1 ? v + a
        : filter === 2 ? v + b
        : filter === 3 ? v + ((a + b) >> 1)
        : v + paeth(a, b, c);
    }
  }
  if (colorType === 3) {
    const rgb = Buffer.alloc(width * height * 3);
    for (let i = 0; i < width * height; i++) palette.copy(rgb, i * 3, out[i] * 3, out[i] * 3 + 3);
    return { width, height, channels: 3, data: rgb };
  }
  return { width, height, channels: bpp, data: out };
}

/** Encodes 8-bit RGB pixels, choosing the best scanline filter per row. */
export function encodePngRgb(width, height, rgb) {
  const stride = width * 3;
  const rows = [];
  for (let y = 0; y < height; y++) {
    const cur = rgb.subarray(y * stride, (y + 1) * stride);
    const prev = y ? rgb.subarray((y - 1) * stride, y * stride) : null;
    let best = null;
    let bestScore = Infinity;
    for (let f = 0; f < 5; f++) {
      const line = Buffer.alloc(stride + 1);
      line[0] = f;
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const a = x >= 3 ? cur[x - 3] : 0;
        const b = prev ? prev[x] : 0;
        const c = x >= 3 && prev ? prev[x - 3] : 0;
        const pred = f === 0 ? 0 : f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : paeth(a, b, c);
        const v = (cur[x] - pred) & 0xff;
        line[x + 1] = v;
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) {
        bestScore = score;
        best = line;
      }
    }
    rows.push(best);
  }
  const chunk = (type, body) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(body.length, 0);
    head.write(type, 4, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
    return Buffer.concat([head, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}
