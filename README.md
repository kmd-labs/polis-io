# Polis

A pixel real-time strategy game set in Archaic Greece, 600 BC, built on the
[KMD design system](https://github.com/kmd-labs/design-system) (Angular 21, standalone components, signals).

The map is a 639×628 raster of ~1.25 km pixels: coastlines and borders from Natural Earth, elevation and
sea depth from AWS Terrain Tiles. Every one of the 84,000 Greek land pixels belongs to one of 18 poleis or is
still wild; land outside modern Greece is shown but never playable. The map is drawn as a stylised relief —
terraced contour tints with warm light and cool shade, an inked coastline, stepped sea depths with isobaths,
twinkling waves and drifting cloud shadows — and has three views: political, terrain relief and soil fertility.

## Gameplay

- **Choose a polis** on the start screen (or click it on the map), then press *Lead*.
- **Settle the wilderness**: sends 10% of your workers away for good. The settlers slowly claim
  wild pixels next to your borders, flowing over low plains and valleys first and climbing hills last
  (or found a colony across the sea when your coast is full). Lowlands are more fertile; armies march slower in mountains.
  Every claimed pixel raises carrying capacity and permanently boosts growth and income (*Prosperity*).
- **Train hoplites**: arms a batch of workers for drachmae. Hoplites cost upkeep.
- **Militarism & culture** (1–5, from each city's historical reputation): militarism slightly strengthens
  armies and garrison in battle (+4% per point); culture raises income (+8% per point).
- **Develop the countryside**: spend drachmae and, 1–12 months later (surveyors tell you what and when),
  a farm (the land feeds 2,500 more people) or a port (+12% income) appears — more often on low ground near
  the sea, rarely right under the walls. One time in ten a small vassal polis is founded on a historical site
  (Tegea, Delphi, Abdera…); vassals wear their overlord's colour and join all of its wars and treaties.
- **Armies in the field**: battles draw in nearby armies of both sides (up to four a side); an army facing an
  enemy 2.5× its size falls back, losing stragglers, and may scatter into two; 20% of overrun land — up to
  half far from home — is simply left as wilderness.
- **War letters**: when a rival declares war on you, the game pauses and a short letter arrives in the voice
  of that city (Solon of Athens, Chilon of Sparta, Periander of Corinth…) — scornful if they think you weak.
- **Declare war**: click another polis, then *Declare war*. Small armies march out on their own and
  seize enemy pixels one by one. When two hostile armies meet they disappear into a cartoon brawl cloud
  and only one walks out. Beating a capital's garrison annexes the whole polis.
- **Win** by holding half of the Greek land or by being the last polis standing. You lose if your capital falls.

The HUD is styled after classical Greece — parchment and marble panels, terracotta rules, meander friezes and
Cinzel capitals for titles, and pixel-art temples, towns, farms, ports and siege camps on the map. It shows total population, workers (able-bodied civilians) and warriors, plus treasury,
territory share and prosperity. Population follows Archaic densities: a few thousand to ten thousand people
per city at the start, 25–35 people/km² on settled lowland, and roughly 2–3 million across a fully settled Hellas. <kbd>Space</kbd> pauses; the wheel or a pinch zooms; dragging pans.

## Development

```bash
npm install
npm start            # http://localhost:4200
npm run build
npm run build:map    # rebuild src/assets/map/hellas.png (+ metadata) from Natural Earth and Terrain Tiles
```

| Path | Purpose |
| :--- | :--- |
| `src/app/game/simulation.ts` | Framework-free simulation: economy, settling, AI, armies, battles (`RULES` holds the balance) |
| `src/app/game/world.ts` | Static geography: terrain, elevation, hillshade, fertility, coastline |
| `src/app/game/map-loader.ts` | Loads and decodes `assets/map/hellas.png` (R = terrain, G/B = elevation) |
| `src/app/game/map-renderer.ts` | Canvas renderer (shaded relief, animated sea, outlines, temples, armies) |
| `src/app/game/fight-cloud.ts` | Cartoon brawl animation |
| `src/app/game/game.service.ts` | Game clock outside the Angular zone and signal snapshots for the HUD |
| `src/app/hud/` | Start screen, dock panels (your polis, diplomacy) and the chronicle feed |
| `src/app/core/i18n/` | English and Polish dictionaries |

See [AGENTS.md](AGENTS.md) for the KMD design-system conventions this app follows.

## Data

- Coastlines and borders: [Natural Earth](https://www.naturalearthdata.com/) 1:10m (public domain).
- Elevation and bathymetry: [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Mapzen Terrarium),
  derived from SRTM, GMTED, ETOPO1 and other sources — see the
  [attribution list](https://github.com/tilezen/joerd/blob/master/docs/attribution.md).
