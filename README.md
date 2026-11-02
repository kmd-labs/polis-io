# Polis

A pixel real-time strategy game set in Archaic Greece, 600 BC, built on the
[KMD design system](https://github.com/kmd-labs/design-system) (Angular 21, standalone components, signals).

The whole map is a raster of ~4 km pixels rasterized from Natural Earth. Every Greek land pixel
belongs to one of 18 poleis or is still wild; land outside modern Greece is shown but never playable.

## Gameplay

- **Choose a polis**: click a city-state on the map, or pick one from the list in the dock.
- **Settle the wilderness**: sends 10% of your workers away for good. The settlers slowly claim
  wild pixels next to your borders (or found a colony across the sea when your coast is full).
  Every claimed pixel raises carrying capacity and permanently boosts growth and income (*Prosperity*).
- **Train hoplites**: arms a batch of workers for drachmae. Hoplites cost upkeep.
- **Declare war**: click another polis, then *Declare war*. Small armies march out on their own and
  seize enemy pixels one by one. When two hostile armies meet they disappear into a cartoon brawl cloud
  and only one walks out. Beating a capital's garrison annexes the whole polis.
- **Win** by holding half of the Greek land or by being the last polis standing. You lose if your capital falls.

The HUD shows total population, workers (able-bodied civilians) and warriors, plus treasury,
territory share and prosperity. <kbd>Space</kbd> pauses; the wheel or a pinch zooms; dragging pans.

## Development

```bash
npm install
npm start            # http://localhost:4200
npm run build
npm run build:map    # re-rasterize src/app/game/data/greece-map.ts from Natural Earth
```

| Path | Purpose |
| :--- | :--- |
| `src/app/game/simulation.ts` | Framework-free simulation: economy, settling, AI, armies, battles (`RULES` holds the balance) |
| `src/app/game/world.ts` | Static geography: terrain, fertility, coastline |
| `src/app/game/map-renderer.ts` | Canvas renderer (pixel raster, outlines, temples, armies) |
| `src/app/game/fight-cloud.ts` | Cartoon brawl animation |
| `src/app/game/game.service.ts` | Game clock outside the Angular zone and signal snapshots for the HUD |
| `src/app/hud/` | Dock panels (your polis, diplomacy) and the chronicle feed |
| `src/app/core/i18n/` | English and Polish dictionaries |

See [AGENTS.md](AGENTS.md) for the KMD design-system conventions this app follows.
