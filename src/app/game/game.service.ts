import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { SplashService } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { polisName } from '../core/i18n/format';
import { loadMapData } from './map-loader';
import { DevelopmentOutcome, GameEvent, GameStatus, Simulation } from './simulation';
import { World } from './world';

/** Immutable UI snapshot of one polis, refreshed a few times per second. */
export interface PolisView {
  idx: number;
  color: string;
  alive: boolean;
  conqueror: number;
  total: number;
  workers: number;
  warriors: number;
  drachmae: number;
  income: number;
  cells: number;
  /** Land area in km². */
  area: number;
  share: number;
  prosperity: number;
  settlers: number;
  expedition: number | null;
  canSettle: boolean;
  trainBatch: number;
  trainCost: number;
  canTrain: boolean;
  militarism: number;
  culture: number;
  farms: number;
  ports: number;
  vassals: number[];
  overlord: number;
  developCost: number;
  canDevelop: boolean;
  wars: number[];
}

/** A declaration of war against the player, delivered as a letter. */
export interface WarLetterView {
  from: number;
  /** Whether the sender thinks the player is weak. */
  tone: 'taunt' | 'challenge';
}

export type GameSpeed = 1 | 2 | 4;

const UI_REFRESH_MS = 200;

/**
 * Loads the map, drives the simulation clock outside Angular's zone and publishes signal snapshots
 * for the HUD. The canvas renderer reads `sim` directly every animation frame.
 */
@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly zone = inject(NgZone);
  private readonly splash = inject(SplashService);
  private readonly i18n = inject(I18nService);

  /** Available once `ready()` is true. */
  world!: World;
  sim!: Simulation;

  readonly ready = signal(false);
  readonly status = signal<GameStatus>('choosing');
  readonly player = signal(-1);
  /** Polis inspected on the map (or pre-selected on the start screen). */
  readonly selected = signal(-1);
  /** Polis highlighted while hovering the start screen list. */
  readonly preview = signal(-1);
  readonly paused = signal(false);
  readonly speed = signal<GameSpeed>(1);
  readonly year = signal(0);
  readonly poleis = signal<PolisView[]>([]);
  readonly events = signal<GameEvent[]>([]);
  /** Pending war letter; the game is paused while it is open. */
  readonly letter = signal<WarLetterView | null>(null);

  readonly me = computed(() => this.poleis()[this.player()] ?? null);
  readonly target = computed(() => {
    const idx = this.selected();
    return idx >= 0 && idx !== this.player() ? (this.poleis()[idx] ?? null) : null;
  });

  private lastFrame = 0;
  private lastUi = 0;
  private lastEventId = 0;
  private pausedBeforeLetter = false;

  constructor() {
    void this.load();
  }

  private async load() {
    const t = this.i18n.t();
    try {
      this.splash.setProgress(10, t.loadingMap);
      const data = await loadMapData(f => this.splash.setProgress(10 + f * 70, t.loadingMap));
      this.splash.setProgress(85, t.loadingTerrain);
      // Let the status paint before the synchronous terrain analysis.
      await new Promise(r => setTimeout(r, 16));
      this.world = new World(data);
      this.sim = new Simulation(this.world);
      this.splash.setProgress(100, '');
      this.ready.set(true);
      this.publish();
      this.zone.runOutsideAngular(() => requestAnimationFrame(ts => this.loop(ts)));
    } catch (err) {
      console.error(err);
      this.splash.setError(t.loadError);
    }
  }

  /** On the start screen a click pre-selects; in game it inspects another polis. */
  select(idx: number) {
    if (this.sim.status === 'choosing') {
      this.selected.set(idx);
      return;
    }
    this.selected.set(idx === this.player() ? -1 : idx);
  }

  /** Starts the game leading the pre-selected polis. */
  begin() {
    const idx = this.selected();
    if (idx < 0) return;
    this.sim.choose(idx);
    this.selected.set(-1);
    this.preview.set(-1);
    this.paused.set(false);
    this.publish();
  }

  settle() {
    this.sim.settle(this.sim.player);
    this.publish();
  }

  train() {
    this.sim.train(this.sim.player);
    this.publish();
  }

  develop(): DevelopmentOutcome | null {
    const outcome = this.sim.develop(this.sim.player);
    this.publish();
    return outcome;
  }

  /** Localized name of any polis, including vassals founded during the game. */
  name(idx: number): string {
    const p = this.sim?.poleis[idx];
    return p ? polisName(this.i18n.t(), p.def) : '';
  }

  closeLetter() {
    if (!this.letter()) return;
    this.letter.set(null);
    this.paused.set(this.pausedBeforeLetter);
  }

  declareWar(target: number) {
    this.sim.declareWar(this.sim.player, target);
    this.publish();
  }

  offerPeace(target: number) {
    this.sim.offerPeace(this.sim.player, target);
    this.publish();
  }

  canOfferPeace(target: number): boolean {
    const me = this.sim.poleis[this.sim.player];
    return !!me && this.sim.canOfferPeace(me, target);
  }

  togglePause() {
    this.paused.update(p => !p);
  }

  cycleSpeed() {
    this.speed.update(s => (s === 1 ? 2 : s === 2 ? 4 : 1));
  }

  restart() {
    this.sim.reset();
    this.letter.set(null);
    this.lastEventId = 0;
    this.selected.set(-1);
    this.preview.set(-1);
    this.paused.set(false);
    this.speed.set(1);
    this.publish();
  }

  private loop(now: number) {
    const dt = this.lastFrame ? Math.min(0.25, (now - this.lastFrame) / 1000) : 0;
    this.lastFrame = now;
    if (!this.paused()) this.sim.step(dt * this.speed());
    if (now - this.lastUi > UI_REFRESH_MS) {
      this.lastUi = now;
      this.zone.run(() => this.publish());
    }
    requestAnimationFrame(t => this.loop(t));
  }

  private publish() {
    const sim = this.sim;
    const greek = this.world.greekCells.length;
    const cellArea = this.world.cellKm * this.world.cellKm;
    this.status.set(sim.status);
    this.player.set(sim.player);
    this.year.set(sim.year);
    this.poleis.set(
      sim.poleis.map(p => ({
        idx: p.idx,
        color: p.def.color,
        alive: p.alive,
        conqueror: p.conqueror,
        total: sim.totalPopulation(p),
        workers: sim.workers(p),
        warriors: sim.warriors(p),
        drachmae: Math.floor(p.drachmae),
        income: p.income,
        cells: p.cells,
        area: p.cells * cellArea,
        share: p.cells / greek,
        prosperity: p.prosperity,
        settlers: sim.settlers(p),
        expedition: p.expedition ? 1 - p.expedition.settlers / p.expedition.initial : null,
        canSettle: sim.canSettle(p),
        trainBatch: sim.trainBatch(p),
        trainCost: sim.trainCost(p),
        canTrain: sim.canTrain(p),
        militarism: p.militarism,
        culture: p.culture,
        farms: p.farms,
        ports: p.ports,
        vassals: sim.vassalsOf(p.idx),
        overlord: p.overlord,
        developCost: sim.developCost(p),
        canDevelop: sim.canDevelop(p),
        wars: [...p.wars]
      }))
    );
    if (this.events().at(-1)?.id !== sim.events.at(-1)?.id) this.events.set([...sim.events]);
    this.deliverLetters();
  }

  /** A rival declaring war on the player (or a vassal) sends a letter and stops the clock. */
  private deliverLetters() {
    const sim = this.sim;
    const fresh = sim.events.filter(e => e.id > this.lastEventId);
    if (!fresh.length) return;
    this.lastEventId = fresh[fresh.length - 1].id;
    if (sim.status !== 'playing' || this.letter()) return;
    const mine = sim.bloc(sim.player);
    const war = fresh.find(e => e.kind === 'war' && mine.includes(e.b) && !mine.includes(e.a));
    if (!war) return;
    const me = sim.poleis[sim.player];
    const ratio = sim.warriors(sim.poleis[war.a]) / Math.max(1, sim.warriors(me));
    this.pausedBeforeLetter = this.paused();
    this.paused.set(true);
    this.letter.set({ from: war.a, tone: ratio > 1.4 || me.drachmae < 100 ? 'taunt' : 'challenge' });
  }
}
