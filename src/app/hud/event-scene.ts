import { DilemmaScene } from '../game/data/dilemmas';

/**
 * Event illustrations painted like a black-figure vase: black silhouettes on a terracotta ground
 * between two meander bands. Each scene is a small inline SVG (viewBox 0 0 400 150) built from a
 * handful of shapes; colours come from the CSS custom properties of the event card.
 */

const GROUND = 'var(--vase-ground)';
const FIGURE = 'var(--vase-figure)';
const LINE = 'var(--vase-line)';

/** A meander band across the full width at height y. */
function meander(y: number): string {
  let d = '';
  for (let x = 0; x < 400; x += 16) d += `M${x} ${y + 10}v-8h12v6h-8v-3h4 `;
  return `<rect x="0" y="${y - 2}" width="400" height="14" fill="${FIGURE}"/><path d="${d}" fill="none" stroke="${GROUND}" stroke-width="1.6"/>`;
}

function column(x: number, base: number, h: number): string {
  return `<rect x="${x - 6}" y="${base - h}" width="12" height="${h}" fill="${FIGURE}"/><rect x="${x - 9}" y="${base - h - 4}" width="18" height="5" fill="${FIGURE}"/><rect x="${x - 8}" y="${base - 3}" width="16" height="3" fill="${FIGURE}"/>`;
}

function temple(cx: number, base: number, w: number): string {
  const cols = 6;
  let s = '';
  for (let i = 0; i < cols; i++) s += column(cx - w / 2 + 10 + (i * (w - 20)) / (cols - 1), base - 6, 54);
  s += `<rect x="${cx - w / 2}" y="${base - 6}" width="${w}" height="6" fill="${FIGURE}"/>`;
  s += `<rect x="${cx - w / 2 - 4}" y="${base - 72}" width="${w + 8}" height="8" fill="${FIGURE}"/>`;
  s += `<path d="M${cx - w / 2 - 6} ${base - 72}L${cx} ${base - 96}L${cx + w / 2 + 6} ${base - 72}Z" fill="${FIGURE}"/>`;
  return s;
}

/** A hoplite in profile with round shield and spear, facing right (or left with flip). */
function hoplite(x: number, base: number, flip = false): string {
  const t = flip ? `translate(${x} ${base}) scale(-1 1)` : `translate(${x} ${base})`;
  return `<g transform="${t}">
    <path d="M-6 0l4-26h8l5 26h-5l-3-18-3 18z" fill="${FIGURE}"/>
    <rect x="-5" y="-48" width="12" height="24" rx="3" fill="${FIGURE}"/>
    <circle cx="1" cy="-55" r="7" fill="${FIGURE}"/>
    <path d="M-6 -60q7-14 16-2l-3 2q-5-6-10 2z" fill="${FIGURE}"/>
    <circle cx="10" cy="-36" r="14" fill="${FIGURE}" stroke="${GROUND}" stroke-width="1.5"/>
    <circle cx="10" cy="-36" r="5" fill="none" stroke="${GROUND}" stroke-width="1.2"/>
    <path d="M-14 -20L30 -70" stroke="${FIGURE}" stroke-width="2.4"/>
  </g>`;
}

function ship(x: number, y: number): string {
  return `<g transform="translate(${x} ${y})">
    <path d="M-60 0q60 18 112 0l12-10-6 0-8 4h-104z" fill="${FIGURE}"/>
    <path d="M64 -10q8-8 4-16" stroke="${FIGURE}" stroke-width="3" fill="none"/>
    <path d="M-2 -6v-56" stroke="${FIGURE}" stroke-width="3"/>
    <path d="M-30 -58h56v34h-56z" fill="${FIGURE}"/>
    <path d="M-30 -48h56M-30 -38h56" stroke="${GROUND}" stroke-width="1"/>
    ${Array.from({ length: 7 }, (_, i) => `<path d="M${-46 + i * 14} 4l-8 14" stroke="${FIGURE}" stroke-width="2"/>`).join('')}
  </g>`;
}

function waves(y: number): string {
  let d = `M0 ${y}`;
  for (let x = 0; x < 400; x += 20) d += `q5 -6 10 0t10 0`;
  return `<path d="${d}" fill="none" stroke="${FIGURE}" stroke-width="2"/><path d="${d.replace(`M0 ${y}`, `M10 ${y + 8}`)}" fill="none" stroke="${FIGURE}" stroke-width="1.4" opacity="0.6"/>`;
}

function amphora(x: number, base: number, s = 1): string {
  return `<g transform="translate(${x} ${base}) scale(${s})">
    <path d="M-6 0h12l-3-6q20-20 10-48l-4-6h-14l-4 6q-10 28 10 48z" fill="${FIGURE}"/>
    <rect x="-6" y="-66" width="12" height="6" fill="${FIGURE}"/>
    <path d="M-7 -56q-12 2-10 16M7 -56q12 2 10 16" stroke="${FIGURE}" stroke-width="3" fill="none"/>
    <path d="M-12 -34h24" stroke="${GROUND}" stroke-width="1.2"/>
  </g>`;
}

function tripod(x: number, base: number): string {
  return `<g transform="translate(${x} ${base})">
    <path d="M-16 0l10-34M16 0l-10-34M0 0v-34" stroke="${FIGURE}" stroke-width="3"/>
    <path d="M-20 -36h40q-4 16-20 16t-20-16z" fill="${FIGURE}"/>
    <circle cx="-14" cy="-42" r="5" fill="none" stroke="${FIGURE}" stroke-width="2"/>
    <circle cx="14" cy="-42" r="5" fill="none" stroke="${FIGURE}" stroke-width="2"/>
  </g>`;
}

function figure(x: number, base: number, arms: 'up' | 'out' | 'down' = 'down', flip = false): string {
  const t = flip ? `translate(${x} ${base}) scale(-1 1)` : `translate(${x} ${base})`;
  const a = arms === 'up' ? 'M-4 -40l-10 -18M6 -40l10 -18' : arms === 'out' ? 'M-4 -40l-16 4M6 -40l16 -6' : 'M-4 -40l-6 16M6 -40l6 16';
  return `<g transform="${t}">
    <path d="M-9 0l5-44h10l5 44z" fill="${FIGURE}"/>
    <circle cx="1" cy="-50" r="6" fill="${FIGURE}"/>
    <path d="${a}" stroke="${FIGURE}" stroke-width="3" stroke-linecap="round"/>
    <path d="M-6 -30h14M-7 -18h16" stroke="${GROUND}" stroke-width="0.8"/>
  </g>`;
}

function hills(base: number): string {
  return `<path d="M0 ${base}q60 -40 120 -16t140 -26t140 20v${150 - base}h-400z" fill="${FIGURE}" opacity="0.18"/>`;
}

function sun(x: number, y: number, r: number, eclipsed = false): string {
  let rays = '';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    rays += `M${x + Math.cos(a) * (r + 4)} ${y + Math.sin(a) * (r + 4)}L${x + Math.cos(a) * (r + 12)} ${y + Math.sin(a) * (r + 12)}`;
  }
  return `<path d="${rays}" stroke="${FIGURE}" stroke-width="2"/>${
    eclipsed ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${FIGURE}"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${LINE}" stroke-width="2"/>` : `<circle cx="${x}" cy="${y}" r="${r}" fill="${FIGURE}"/>`
  }`;
}

function sheaf(x: number, base: number): string {
  let s = '';
  for (let i = -3; i <= 3; i++) s += `<path d="M${x} ${base}q${i * 3} -26 ${i * 8} -46" stroke="${FIGURE}" stroke-width="2" fill="none"/><ellipse cx="${x + i * 8}" cy="${base - 50}" rx="3" ry="7" fill="${FIGURE}" transform="rotate(${i * 8} ${x + i * 8} ${base - 50})"/>`;
  return s + `<path d="M${x - 10} ${base - 18}h20" stroke="${FIGURE}" stroke-width="3"/>`;
}

function laurel(x: number, y: number): string {
  let s = '';
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.15 + i * 0.1);
    s += `<ellipse cx="${x - Math.cos(a) * 24}" cy="${y - Math.sin(a) * 18 + 18}" rx="3" ry="7" fill="${FIGURE}" transform="rotate(${-60 + i * 14} ${x - Math.cos(a) * 24} ${y - Math.sin(a) * 18 + 18})"/>`;
    s += `<ellipse cx="${x + Math.cos(a) * 24}" cy="${y - Math.sin(a) * 18 + 18}" rx="3" ry="7" fill="${FIGURE}" transform="rotate(${60 - i * 14} ${x + Math.cos(a) * 24} ${y - Math.sin(a) * 18 + 18})"/>`;
  }
  return s;
}

function scene(kind: DilemmaScene): string {
  const base = 130;
  switch (kind) {
    case 'temple':
      return hills(base) + temple(200, base, 150) + figure(84, base, 'up') + amphora(320, base, 0.9);
    case 'oracle':
      return hills(base) + column(70, base, 70) + column(330, base, 70) + tripod(200, base) + figure(240, base, 'out', true) + figure(150, base, 'up') +
        `<path d="M196 ${base - 40}q-8 -20 4 -36q10 -14 0 -30" stroke="${FIGURE}" stroke-width="1.6" fill="none" opacity="0.6"/>`;
    case 'sea':
      return sun(330, 46, 14) + ship(170, 112) + waves(122) + waves(134);
    case 'army':
      return hills(base) + hoplite(110, base) + hoplite(150, base) + hoplite(190, base) + hoplite(290, base, true) + hoplite(330, base, true);
    case 'agora':
      return column(40, base, 80) + column(360, base, 80) + `<rect x="30" y="${base - 88}" width="340" height="6" fill="${FIGURE}"/>` +
        figure(120, base, 'out') + figure(170, base, 'down', true) + figure(220, base, 'up') + figure(280, base, 'out', true);
    case 'harvest':
      return sun(70, 44, 16) + hills(base) + sheaf(150, base) + sheaf(250, base) + figure(200, base, 'down') + amphora(330, base, 0.8);
    case 'eclipse':
      return sun(200, 60, 24, true) + figure(110, base, 'up') + figure(290, base, 'up', true) + hills(base);
    case 'games':
      return laurel(200, 40) + figure(130, base, 'out') + figure(200, base, 'up') + figure(270, base, 'out', true) + amphora(340, base, 0.8) + amphora(60, base, 0.8);
    case 'east':
      return hills(base) + `<path d="M260 ${base}v-60l20-16 20 16v60z M300 ${base}v-44l14-12 14 12v44z" fill="${FIGURE}"/>` +
        figure(120, base, 'out') + figure(160, base, 'down') + amphora(200, base, 0.7);
    case 'plague':
      return hills(base) + temple(290, base, 110) + figure(100, base, 'up') + figure(150, base, 'down', true) +
        `<path d="M0 30q100 20 200 0t200 0" stroke="${FIGURE}" stroke-width="10" opacity="0.15" fill="none"/>`;
  }
}

/** The full illustration for a scene, as SVG markup. */
export function eventSceneSvg(kind: DilemmaScene): string {
  return `<svg viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="400" height="150" fill="${GROUND}"/>
    ${scene(kind)}
    ${meander(2)}${meander(138)}
  </svg>`;
}
