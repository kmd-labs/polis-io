import { mulberry32 } from './rng';

export interface FightCloudStyle {
  font: string;
  ink: string;
  paper: string;
  star: string;
  shaft: string;
  sideA: string;
  sideB: string;
}

const GLYPHS = ['#', '@', '!', '%', '*', '&', '?'];

/**
 * Cartoon brawl cloud: a jittering ball of dust with fists, sandals and spears poking out,
 * spinning stars and grawlix symbols. Re-rolled 12 times per second for the classic
 * hand-drawn boil.
 */
export function drawFightCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  t: number,
  seed: number,
  c: FightCloudStyle
) {
  const rnd = mulberry32(seed * 977 + Math.floor(t * 12));
  const lw = Math.max(1.5, r * 0.08);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Ground shadow
  ctx.fillStyle = c.ink;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.85, r * 1.05, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Limbs and weapons sticking out from behind the cloud
  for (let k = 0; k < 4; k++) {
    const ang = rnd() * Math.PI * 2;
    const len = r * (1.05 + rnd() * 0.4);
    const ex = x + Math.cos(ang) * len;
    const ey = y + Math.sin(ang) * len * 0.8;
    const kind = rnd();
    ctx.strokeStyle = kind > 0.66 ? c.shaft : c.ink;
    ctx.lineWidth = kind > 0.66 ? lw * 0.9 : lw * 1.6;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * r * 0.4, y + Math.sin(ang) * r * 0.32);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    if (kind > 0.66) {
      // Spear head
      const s = r * 0.22;
      ctx.fillStyle = c.ink;
      ctx.beginPath();
      ctx.moveTo(ex + Math.cos(ang) * s, ey + Math.sin(ang) * s);
      ctx.lineTo(ex + Math.cos(ang + 2.4) * s * 0.5, ey + Math.sin(ang + 2.4) * s * 0.5);
      ctx.lineTo(ex + Math.cos(ang - 2.4) * s * 0.5, ey + Math.sin(ang - 2.4) * s * 0.5);
      ctx.closePath();
      ctx.fill();
    } else if (kind > 0.33) {
      // Fist
      ctx.fillStyle = c.paper;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(ex, ey, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Sandal
      ctx.fillStyle = c.ink;
      ctx.beginPath();
      ctx.ellipse(ex, ey, r * 0.2, r * 0.1, ang, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Cloud body: outline pass, then paper fill, so overlapping puffs read as one silhouette
  const puffs: [number, number, number][] = [[x, y, r * 0.62]];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + rnd() * 0.45;
    const dist = r * 0.52 * (0.85 + rnd() * 0.3);
    puffs.push([x + Math.cos(ang) * dist, y + Math.sin(ang) * dist * 0.72, r * (0.34 + rnd() * 0.14)]);
  }
  ctx.fillStyle = c.ink;
  for (const [px, py, pr] of puffs) {
    ctx.beginPath();
    ctx.arc(px, py, pr + lw, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = c.paper;
  for (const [px, py, pr] of puffs) {
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Helmet crests of both sides tumbling inside the dust
  for (const color of [c.sideA, c.sideB]) {
    const hx = x + (rnd() - 0.5) * r * 0.9;
    const hy = y + (rnd() - 0.5) * r * 0.6;
    ctx.fillStyle = color;
    ctx.strokeStyle = c.ink;
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.arc(hx, hy, r * 0.17, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Grawlix
  ctx.fillStyle = c.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.round(r * 0.36)}px ${c.font}`;
  for (let k = 0; k < 2; k++) {
    ctx.fillText(
      GLYPHS[Math.floor(rnd() * GLYPHS.length)],
      x + (rnd() - 0.5) * r * 0.9,
      y + (rnd() - 0.5) * r * 0.5
    );
  }

  // Dizzy stars orbiting the cloud
  for (let k = 0; k < 3; k++) {
    const ang = t * 3 + (k / 3) * Math.PI * 2;
    drawStar(ctx, x + Math.cos(ang) * r * 1.15, y - r * 0.55 + Math.sin(ang) * r * 0.3, r * 0.17, ang, c.star, c.ink, lw * 0.6);
  }
  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
  fill: string,
  stroke: string,
  lw: number
) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = rot + (i / 10) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.fill();
  ctx.stroke();
}
