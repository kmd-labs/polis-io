# Polis

A pixel real-time strategy game set in Archaic Greece, 600 BC, built on the
[KMD design system](https://github.com/kmd-labs/design-system) (Angular 21, standalone components, signals).

The map is a 1278×1257 raster of ~0.63 km pixels: coastlines and borders from Natural Earth, elevation and
sea depth from AWS Terrain Tiles. Every one of the 336,000 Greek land pixels belongs to one of 18 poleis (or a
neutral merchant city) or is still wild; land outside modern Greece is shown but never playable. Rules that measure land in pixels (reaches, speeds,
ranges, enclave sizes, settlers per pixel) are scaled by `GRID_SCALE` in `world.ts`, so the game plays the same at any
map resolution. The map is drawn as a stylised relief —
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
- **War is a front**: no armies march across the map — only the border moves, and the front between warring cities is
  drawn as a dark red line. Every month of the campaigning season (April–October; winters are quiet) a war may bring an
  event: a pitched battle of the phalanxes (the loser cedes a strip of land around the battlefield), fields ravaged while
  the defenders sit behind their walls, a border fort taken, a town betrayed, a skirmish, sickness in the camp, allies
  arriving, a raid from the sea or a landing where the sea divides the two. Each side's chance rests on its hoplites and
  mercenaries, militarism and strategos (1–3 stars), the distance of the fighting from its home, its posture, and a little
  luck. Where wilderness still lies between two cities, the fighting happens at the edge of the defender's land.
- **Posture**: chosen when a war begins and changeable once a month — all-out offensive (the citizens grumble),
  offensive, balanced, defensive, or behind the walls (hard to beat, but the fields burn).
- **Olympic truce** freezes every front for its three months. After four years a war weighs on the citizens every month
  and peace comes easier. No city fights more than three wars at once; a peace treaty holds five years.
- **Peace table** in the manner of Civilization: gold (3/6/12 months of income), a strip of land, a forced alliance,
  clientship or a public humiliation, for either side, with a live gauge of whether the enemy will accept and "What
  would make this work?". Enemies send envoys with terms. When war is declared on you, you may sue for peace for a year
  of your income.
- **Assaults**: walls seldom fell — only a city far ahead and on the offensive may storm them, and most assaults fail.
- **Polis buildings**: the Buildings button shows three trees — agriculture, trade and military —
  of six buildings each (granary → sanctuary of Demeter, agora → treasury at Delphi, gymnasium → temple of Ares).
  Each is bought by its tree's budget fund, takes a year, costs satisfaction, and grants a nationwide bonus.
- **Satisfaction** (0–100%) scales income and growth from ×0.7 to ×1.3. It falls with lost battles and land,
  settling, building and levies; it rises in quiet times, with trade, victories and power projection.
- **War reports**: when one of your wars ends (peace or the enemy's fall) the game pauses with its balance —
  duration, battles, land won and lost, the fallen, spoils and the effect on satisfaction.
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
- **Time**: a year of the calendar lasts 64 game seconds; population grows at half the earlier rate.
- **Olympic Games** every fourth year (counted from 776 BC) with the historical programme of the time — twelve contests
  in 600 BC, more later (races, wrestling, boxing, pankration, pentathlon, chariots, race in armour, heralds…). The
  sacred truce runs from two months before to a month after: no war is waged, armies march home and fleets to harbour.
  You choose how much of a year's income to spend on the delegation (none, 10%, 25%, 50%); a report shows the wreaths
  by city and every contest's winner. Every city competing gains power projection, each wreath renown and others'
  regard; a triumph (two-fifths of the wreaths, at least five) adds +1 culture.
- **Twists of fortune** every two years: a windfall for one budget branch (one to three months of income) or a
  misfortune (fire, plague, drought, pirates, earthquake, embezzlement) costing up to three months of full income.
- **Choices** in the manner of a grand-strategy event: a scene painted like a black-figure vase, the story and two or
  three answers listing their consequences (silver in months of income, prestige, contentment, culture, militarism,
  every city's regard, people, hoplites, prosperity). Fourteen come in their historical year — Solon's cancelling of
  debts (594 BC), the Sacred War on Kirrha, Thales' eclipse (585), the Pythian Games, Peisistratos' bodyguard, the gold
  of Croesus, the fall of Sardis (546), Pythagoras, Polycrates, Cleisthenes, the Ionian revolt, Darius' heralds and
  Xerxes (481) — and fifteen others at any time (the Pythia's riddles, drought, fever, blood feuds, poets, silver veins,
  coinage, suppliants, omens, ransom, Olympic victors, stone temples, pirates, the phalanx, restless serfs). They come
  about once a year at first and ever more rarely later.
- **Letters that stop the game** are kept to at most ten a year (threats and choices always come through). After a
  century the player meets at most one chance event a year (a choice or a twist of fortune), and finished buildings no
  longer stop the game.
- **The wider world** reaches the chronicle in its year: Massalia, Solon, the Pythian, Isthmian and Nemean Games,
  Naucratis, Peisistratos, Croesus and Cyrus, Alalia, Polycrates, Pythagoras at Croton, Cleisthenes, the Ionian revolt,
  Marathon, Thermopylae and Salamis, Plataea.
- **Grand-strategy HUD**: vellum panels in carved bronze frames with gilt rules and corners, the city's arms in a gilt
  medallion, the treasury and figures in a ledger of bronze roundels, the date in a bronze cartouche, carved tiles for
  the tabs and map modes, and events on bronze banners.
  They wait in the alerts row.
- **Peoples beyond the frontier**: Illyrians (north-west, beyond Epirus), Paeonians (Axios valley) and Thracians
  (Edoni and Bisaltae, between the Axios and the Strymon) sit on the non-Greek land around Hellas and cannot be
  conquered. Every 3–7 years each sends a warband of 400–2,000 men against a rich, poorly guarded city within reach;
  it carries off people and silver and sours the citizens' mood (it lays no land waste). A city it enters chooses: pay
  six months of its income for the warband to plunder someone else, or fight it in the name of Hellas (power projection
  and every Greek city's regard, more renown if it is driven off) and send out defenders. A warband that loses half its
  men turns back. They ignore the Olympic truce; city walls halve their loot.
- **Great works** for spare silver (Polis tab): money no fund can spend goes to the chosen work instead of the other
  funds — a treasury at Delphi (repeatable), a great temple, city walls or a water tunnel.
- **Small islands and neutral harbours**: islets missing from the coastline data are added (Delos, Rheneia, Donousa…);
  twelve small unclaimed islands carry neutral harbours (Delos, Syros, Ios, Ithaca…) that belong to no one,
  cannot be settled or taken, and pay merchantmen 30% more.
- **Neutral merchant cities**: Aegina, Siphnos, Thera and Keos each hold their whole small island, go to war with no
  one (nor do barbarians raid them), found no colonies and stand outside the hegemony and victory reckoning. They spend
  mostly on their harbours, keep three extra merchantmen at sea, sail twice as often and draw other cities' ships twice
  as strongly; a city their ship calls at keeps half of what it brings (30% for an ordinary city's ship).
- **Mountains**: no land above 1500 m can be taken, settled, laid waste or handed over.
- **Colonies**: settlers' expeditions only claim wilderness along the city's own borders; a colony is always one new
  city on a historical site, founded at most once in 40 years (down to 16 with a large colonization share).
- **Levies and settlers** go out in small, frequent portions.
- **Surplus of the military fund** (once the army is full): save it, hire **mercenaries** in wartime (no citizens,
  dear, double pay, gone at peace) or build **war galleys**. A fleet at war rows to the nearest enemy harbour and
  **blockades** it — no trade, no port bonus, no harbour dues — sinks enemy merchantmen and fights enemy fleets.
- **Bought out of savings** (buttons under the Military and Colonization rows): hire a double band of mercenaries
  at once in wartime (7 dr a man, twice the fund's price) or send an extra settlers' expedition before the city is
  crowded (four times the usual price); either costs at least three months of income.
- **Ports** bring in harbour dues of their own, on top of the income bonus and the ships they launch.
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
  (every city and its standing with you), *Hegemony* and *Chronicle & charts*.
- **Hegemony**: every year the three best cities in *First in Silver* (average monthly income over 10 years, tribute
  included), *First in People* (population; vassals count for themselves) and *First in Arms* (last 25 years: battle
  won 1, capital taken 5, war won 3) earn 3/2/1 points. The most points (of 9) makes the **Hegemon of Hellas**
  (a reigning Hegemon keeps the title on a tie). The laurel in the top bar shows your points; the hegemony map mode
  paints the leading three gold, silver and bronze. Podium changes go to the chronicle and the alerts row; a new
  Hegemon who has held the title for three years is announced with a popup. Each point brings +0.1 power projection a
  year; the Hegemon earns 5% more from sea trade and draws more ships. A city holding 7+ points for ten years unites
  Hellas against it — everyone's regard for it sinks 2 a year, rivals pair up and attack more readily — until its
  score drops below 6 (the coalition's pacts then lapse).
- **History**: every year the game records a snapshot of every polis. The *Chronicle & charts* tab plots your
  population, income per month, territory and hoplites on one time axis, with markers where you changed the budget
  (by 5 points or more), went to war or made peace, and completed a building. Hover the drachmae in the top bar for
  an income breakdown (workers, culture, ports, buildings, contentment, trade/tribute/spoils, hoplite pay).
- **Decade report**: every ten years the game pauses for a review drawn from the history — change in population,
  income and territory, battles won and lost, your hegemony places then and now, the average budget of the decade,
  and one line from the chroniclers. It can be switched off in the report or in the *Chronicle & charts* tab.
- **Embassies** wait in the alerts row instead of stopping the game; their envoys leave (the offer lapses) after two
  years. Cities court the Hegemon too ("Whoever stands with the Hegemon sleeps soundly").
- **Right outliner** (collapsible): wars with a strength bar, allies, sieges and the latest news.
- **Map modes** bottom-right: political, terrain relief, soil fertility and relations; the card of a selected
  foreign city appears bottom-left.
- **Alerts** under the top bar (round icons): a siege, deserting hoplites, allies at war, an idle fund, blocked
  colonization, and battle / war / survey reports waiting to be read. They never stop the game — only decisions do
  (a declaration of war, an embassy you open, the fate of a conquered city, a new Hegemon, the decade report, the end
  of the game).
- On phones the drawer and the outliner become a bottom sheet behind a tab bar.

Panel layout is remembered per browser. Keys: <kbd>Space</kbd> pauses, <kbd>1</kbd>–<kbd>5</kbd> set the speed,
<kbd>B</kbd> opens the budget, <kbd>H</kbd> the hegemony, <kbd>Esc</kbd> folds the drawer; the wheel or a pinch zooms; dragging pans.

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
