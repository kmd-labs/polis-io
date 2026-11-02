#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const appTitle = 'Polis Io';
const appSlug = 'polis-io';

let logoSvg = '';
const logoCandidates = [
  path.join(root, 'src/design-system/assets/logo/kmd-black-orange.svg'),
  path.join(root, 'assets/design-system/logo/kmd-black-orange.svg')
];
for (const p of logoCandidates) {
  if (fs.existsSync(p)) {
    logoSvg = fs.readFileSync(p, 'utf8');
    break;
  }
}

const pathsMatch = logoSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
const innerLogoPaths = pathsMatch ? pathsMatch[1].trim() : '';

const width = 1200;
const height = 630;
const cardW = 1060;
const cardH = 490;
const cardX = (width - cardW) / 2;
const cardY = (height - cardH) / 2;

const svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background: airy neutral-50 -->
  <rect width="${width}" height="${height}" fill="#f5f7fb"/>

  <!-- Subtle planetary arcs in background -->
  <circle cx="1080" cy="110" r="280" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="8 8"/>
  <circle cx="1080" cy="110" r="380" fill="none" stroke="#eef2f7" stroke-width="1.5"/>
  <circle cx="120" cy="540" r="220" fill="none" stroke="#eef2f7" stroke-width="1.5"/>

  <!-- Central Card Shadow & Surface -->
  <rect x="${cardX}" y="${cardY + 8}" width="${cardW}" height="${cardH}" rx="28" fill="#e2e8f0" opacity="0.6"/>
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="28" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- Card Content -->
  <g transform="translate(${cardX + 64}, ${cardY + 54})">
    <!-- Top Row: Exact KMD Official SVG Logotype -->
    <g transform="translate(0, 0)">
      <g transform="scale(0.72)">
        ${innerLogoPaths}
      </g>
    </g>

    <!-- Kicker -->
    <text x="0" y="152" font-family="DejaVu-Sans, Inter, -apple-system, sans-serif" font-size="14" font-weight="bold" letter-spacing="3" fill="#D37400">INTERACTIVE DATA VISUALIZATION · OBSERVATORY</text>

    <!-- App Title (Dynamic from repository) -->
    <text x="0" y="218" font-family="DejaVu-Sans, Inter, -apple-system, sans-serif" font-size="52" font-weight="bold" fill="#0f172a">${appTitle}</text>

    <!-- App Description -->
    <text x="0" y="274" font-family="DejaVu-Sans, Inter, -apple-system, sans-serif" font-size="22" fill="#475569">Zero-friction 3D WebGL simulation and planetary telemetry.</text>
    <text x="0" y="308" font-family="DejaVu-Sans, Inter, -apple-system, sans-serif" font-size="20" fill="#64748b">Open scientific datasets by KMD Labs.</text>

    <!-- Divider Line -->
    <line x1="0" y1="344" x2="${cardW - 128}" y2="344" stroke="#e2e8f0" stroke-width="1.5"/>

    <!-- Bottom Footer Badges -->
    <g transform="translate(0, 368)">
      <!-- Repo URL Pill -->
      <rect x="0" y="0" width="270" height="34" rx="17" fill="#fdf6ed" stroke="#f7cfa0" stroke-width="1"/>
      <text x="135" y="22" font-family="DejaVu-Sans, Inter, -apple-system, sans-serif" font-size="13" font-weight="bold" fill="#D37400" text-anchor="middle">kmd-labs.github.io/${appSlug}</text>

      <!-- Award Pill -->
      <rect x="284" y="0" width="320" height="34" rx="17" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
      <text x="444" y="22" font-family="DejaVu-Sans, Inter, -apple-system, sans-serif" font-size="13" fill="#334155" text-anchor="middle">EUSPA 11th CASSINI Hackathon EU Winners</text>

      <!-- Main Domain link -->
      <text x="${cardW - 128}" y="22" font-family="DejaVu-Sans, Inter, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="end">kmd-labs.org →</text>
    </g>
  </g>
</svg>`;

const assetsDir = path.join(root, 'src/assets');
fs.mkdirSync(assetsDir, { recursive: true });

const svgPath = path.join(assetsDir, 'og-image.svg');
const pngPath = path.join(assetsDir, 'og-image.png');
fs.writeFileSync(svgPath, svgContent, 'utf8');

let converted = false;
try {
  execSync(`convert -font DejaVu-Sans "${svgPath}" "${pngPath}"`, { stdio: 'pipe' });
  converted = true;
} catch {
  try {
    execSync(`rsvg-convert -w 1200 -h 630 "${svgPath}" -o "${pngPath}"`, { stdio: 'pipe' });
    converted = true;
  } catch {}
}

if (!converted) {
  const fallbackPng = path.join(root, 'src/design-system/assets/og-image.png');
  if (fs.existsSync(fallbackPng)) {
    fs.copyFileSync(fallbackPng, pngPath);
  }
}
console.log('✅ Generated OpenGraph social preview assets (og-image.svg & og-image.png)');
