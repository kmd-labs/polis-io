# Polis

A pixel real-time strategy game set in Archaic Greece, 600 BC, built on the
[KMD design system](https://github.com/kmd-labs/design-system) (Angular 21, standalone components, signals).

The map is a 639×628 raster of ~1.25 km pixels: coastlines and borders from Natural Earth, elevation and
sea depth from AWS Terrain Tiles. Every one of the 84,000 Greek land pixels belongs to one of 18 poleis or is
still wild; land outside modern Greece is shown but never playable. The map is drawn as a stylised relief —
terraced contour tints with warm light and cool shade, an inked coastline, stepped sea depths with isobaths,
twinkling waves and drifting cloud shadows — and has three views: political, terrain relief and soil fertility.

## Gameplay

- **Choose a polis** on the start screen (or click it on the map), then press *Lead*. Each city flies a banner
  with its coin or shield device — the owl of Athens, the Boeotian shield of Thebes, the wheel of Chalcis, the
  labyrinth of Knossos… — or the Greek initial it used (Λ for Sparta, Ϙ for Corinth); poleis founded during the
  game get one generated from their name.
- **Settle the wilderness** is driven by the colonization share of the budget: once the city has filled 70% of
  its land, the fund pays for an expedition that takes 10% of the workers away for good. The settlers slowly claim
  wild pixels next to your borders, flowing over low plains and valleys first and climbing hills last
  (or found a colony across the sea when your coast is full). Lowlands are more fertile; armies march slower in mountains.
  Every claimed pixel raises carrying capacity and permanently boosts growth and income (*Prosperity*).
- **Budget**: a permanent window splits all income — taxes, trade, spoils, tribute — between five funds with
  sliders that always add up to 100% (none below 5%): military, colonization, agriculture, trade and culture.
  Each fund spends itself: the military pays hoplite upkeep, raises military buildings and trains hoplites —
  a bigger share means a larger army (up to 40% of the workers) raised in bigger levies, and cutting it sends
  the surplus garrison back to work;
  colonization sends settlers and, once the wilderness nearby is gone, founds colonies; agriculture and trade
  alternate between their buildings and new farms/ports; culture holds festivals (satisfaction, culture, renown).
  A fund with nothing left to buy passes its savings to the others.
- **Militarism & culture** (1–5, from each city's historical reputation): militarism slightly strengthens
  armies and garrison in battle (+4% per point); culture raises income (+8% per point).
- **Countryside works**: farms (the land feeds 2,500 more) and ports (+12% income) appear 1–12 months after
  their fund commissions them — more often on low ground near the sea, rarely right under the walls.
- **Armies in the field**: battles draw in nearby armies of both sides (up to four a side); an army facing an
  enemy 2.5× its size falls back, losing stragglers, and may scatter into two; 20% of overrun land — up to
  half far from home — is simply left as wilderness. In wartime, cut-off pockets of up to 8 pixels pass to the
  side whose capital is nearer. A polis at war keeps at least 100 hoplites at home; armies under 200 do not lay
  siege; armies near a besieged friendly capital march to its relief, and an army with a 50% edge in power or
  numbers hunts down nearby enemy armies.
- **Polis buildings**: the Buildings button shows three trees — agriculture, trade and military —
  of six buildings each (granary → sanctuary of Demeter, agora → treasury at Delphi, gymnasium → temple of Ares).
  Each is bought by its tree's budget fund, takes a year, costs satisfaction, and grants a nationwide bonus.
- **Satisfaction** (0–100%) scales income and growth from ×0.7 to ×1.3. It falls with lost battles and land,
  settling, building and levies; it rises in quiet times, with trade, victories and power projection.
- **War reports**: when one of your wars ends (peace or the enemy's fall) the game pauses with its balance —
  duration, battles, land won and lost, the fallen, spoils and the effect on satisfaction.
- **Sieges**: an army reaching an enemy capital camps before its walls for about 2.5 years before storming
  them; the besieged city loses satisfaction, barely grows and starves its garrison, while the besiegers waste away.
- **The fall of a polis** rarely wipes it out: it may live on as a city within the victor's borders, or become a
  client state paying tribute in drachmae and workers. Founding cities are hard to raze, young colonies easy;
  sometimes a new polis breaks away in the chaos.
- **Conquest**: when your army storms an enemy capital the game pauses and you decide its fate, which ends the
  war — raze it (80%: gold and slaves, 20%: a revolt revives it), subjugate it (60%: a client state, 40%: a large
  ransom and it stays free) or force an alliance (always, with a little gold).
- **Diplomatic reputation**: every pair of poleis has a reputation from −100 to +100 drifting around neutral; wars,
  shared borders and big armies sour it, culture, power projection and contented citizens slowly sweeten it.
  It shapes AI wars, peace terms, alliance offers and trade. Neighbours fight more often (except the islands
  Samos, Naxos, Corcyra and Chios).
- **Victories**: every battle your army or garrison wins files a report in the alerts row — a little gold
  (spoils), 15% of the beaten army taken captive as workers, and +1 power projection.
- **Power projection**: makes your polis look stronger to would-be attackers, brings embassies offering a
  defensive alliance (allies join any war declared on you, and you on them), and draws merchant ships to your harbours.
- **Sea trade**: coastal poleis send small merchant ships along sea routes to the harbours of coastal poleis
  they are not at war with. Each completed voyage earns the owner 1 drachma, raised by culture (+8% per point),
  and the receiving city 30% of that; every port lets one more ship sail at a time.
- **War letters**: when a rival declares war on you, the game pauses and a short letter arrives in the voice
  of that city (Solon of Athens, Chilon of Sparta, Periander of Corinth…) — scornful if they think you weak.
- **Declare war**: click another polis, then *Declare war*. Small armies march out on their own and
  seize enemy pixels one by one. When two hostile armies meet they disappear into a cartoon brawl cloud
  and only one walks out. Beating a capital's garrison annexes the whole polis.
- **Main army and raiders**: at war a polis fields two to five armies. The main army (about half the spare hoplites,
  drawn with a larger shield) seeks out the enemy's main army; smaller raiding parties of varied size plunder the
  countryside and run from any force near their size. A main army weaker than its rival halts and digs in — its
  power climbs to 150% over a few years and it engages any enemy army within 30 cells.
- **Stray land**: scraps of four pixels or fewer cut off from their capital revert to wilderness after about four years
  (a fresh colony seed in open wilderness is spared).
- **Win** by holding half of the Greek land or by being the last polis standing. You lose if your capital falls.

The HUD is styled after classical Greece — parchment and marble panels, terracotta rules, meander friezes and
Cinzel capitals for titles, and pixel-art temples, towns, farms, ports and siege camps on the map. It shows total population, workers (able-bodied civilians) and warriors, plus treasury,
territory share and prosperity. Population follows Archaic densities: a few thousand to ten thousand people
per city at the start, 25–35 people/km² on settled lowland, and roughly 2–3 million across a fully settled Hellas.

The in-game HUD sits on the edges of the map, grand-strategy style:

- **Top bar**: your banner, drachmae (+ per month), population, workers, hoplites (now / target), satisfaction,
  power projection and territory; on the right the date, pause, five speeds and the rules.
- **Budget forecasts**: under every slider, what the fund will buy next and when ("New farm in ~2.1 yr · +2,500
  land capacity", "+120 hoplites/yr · pay 4 dr/mo", a red "Desertion in ~8 months" when pay outruns the military
  share). While a slider moves, the old figure is struck through next to the new one. Presets (Balanced, War economy,
  Expansion, Mercantile, Golden age) set all five shares at once; any manual move switches to *Custom*.
- **Left drawer** (collapsible to an icon rail): *Budget*, *Polis* (figures and building trees), *Diplomacy*
  (every city and its standing with you) and *Chronicle*.
- **History**: every year the game records a snapshot of every polis. The *Chronicle & charts* tab plots your
  population, income per month, territory and hoplites on one time axis, with markers where you changed the budget
  (by 5 points or more), went to war or made peace, and completed a building. Hover the drachmae in the top bar for
  an income breakdown (workers, culture, ports, buildings, contentment, trade/tribute/spoils, hoplite pay).
- **Right outliner** (collapsible): wars with a strength bar, allies, sieges and the latest news.
- **Map modes** bottom-right: political, terrain relief, soil fertility and relations; the card of a selected
  foreign city appears bottom-left.
- **Alerts** under the top bar (round icons): a siege, deserting hoplites, allies at war, an idle fund, blocked
  colonization, and battle / war / survey reports waiting to be read. They never stop the game — only decisions do
  (a declaration of war, an embassy, the fate of a conquered city, the end of the game).
- On phones the drawer and the outliner become a bottom sheet behind a tab bar.

Panel layout is remembered per browser. Keys: <kbd>Space</kbd> pauses, <kbd>1</kbd>–<kbd>5</kbd> set the speed,
<kbd>B</kbd> opens the budget, <kbd>Esc</kbd> folds the drawer; the wheel or a pinch zooms; dragging pans.

## Development

```bash
npm install
npm start            # http://localhost:4200
npm run build
npm test             # unit tests (Vitest) for the pure functions
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
| `src/app/hud/` | Start screen and the in-game HUD (`app-hud`: top bar, drawer tabs, outliner, map modes) |
| `src/app/core/i18n/` | English and Polish dictionaries |

See [AGENTS.md](AGENTS.md) for the KMD design-system conventions this app follows.

## Data

- Coastlines and borders: [Natural Earth](https://www.naturalearthdata.com/) 1:10m (public domain).
- Elevation and bathymetry: [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Mapzen Terrarium),
  derived from SRTM, GMTED, ETOPO1 and other sources — see the
  [attribution list](https://github.com/tilezen/joerd/blob/master/docs/attribution.md).
