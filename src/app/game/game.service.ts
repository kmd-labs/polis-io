import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { SplashService } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { polisName } from '../core/i18n/format';
import { loadMapData } from './map-loader';
import { IMPROVEMENTS, ImprovementId, ImprovementTree, improvementCost } from './data/improvements';
import { ConquestChoice, DevelopmentPlan, GameEvent, GameStatus, Simulation, WarReport } from './simulation';
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
  ships: number;
  slaves: number;
  prestige: number;
  allies: number[];
  tradeValue: number;
  tradeEarned: number;
  /** 0–100 contentment and the income/growth multiplier it gives. */
  satisfaction: number;
  mood: number;
  /** Polis screen buildings (filled for the player only). */
  improvements: ImprovementView[];
  vassals: number[];
  overlord: number;
  client: boolean;
  besieged: number;
  /** Diplomatic reputation between this polis and the player (−100…+100). */
  relation: number;
  tributeGold: number;
  tributeWorkers: number;
  developCost: number;
  canDevelop: boolean;
  wars: number[];
}

export interface ImprovementView {
  id: ImprovementId;
  tree: ImprovementTree;
  tier: number;
  state: 'built' | 'building' | 'available' | 'locked';
  /** 0–1 while under construction. */
  progress: number;
  drachmae: number;
  satisfaction: number;
  affordable: boolean;
}

/**
 * Something that stops the clock until the player has read it: a declaration of war (letter),
 * the spoils of a won battle, or an embassy offering an alliance.
 */
export type Notice =
  | { kind: 'war'; from: number; tone: 'taunt' | 'challenge' }
  | {
      kind: 'victory';
      enemy: number;
      near: number;
      battles: number;
      gold: number;
      slaves: number;
      prestige: number;
      totalPrestige: number;
      enemyLosses: number;
      ownLosses: number;
    }
  | { kind: 'alliance'; from: number }
  | ({ kind: 'warEnd' } & WarReport)
  | { kind: 'conquest'; from: number }
  | ({ kind: 'develop' } & Omit<DevelopmentPlan, 'kind'> & { work: DevelopmentPlan['kind'] });

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
  /** Notice on screen; the game is paused while it is open. Further notices wait in a queue. */
  readonly notice = signal<Notice | null>(null);

  readonly me = computed(() => this.poleis()[this.player()] ?? null);
  readonly target = computed(() => {
    const idx = this.selected();
    return idx >= 0 && idx !== this.player() ? (this.poleis()[idx] ?? null) : null;
  });

  private lastFrame = 0;
  private lastUi = 0;
  private lastEventId = 0;
  private pausedBeforeNotice = false;
  private readonly queue: Notice[] = [];

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

  /** Sends surveyors into the countryside and tells the player what will rise there, and when. */
  develop() {
    const plan = this.sim.develop(this.sim.player);
    this.publish();
    if (plan) this.enqueue([{ kind: 'develop', work: plan.kind, months: plan.months, site: plan.site }]);
  }

  /** Localized name of any polis, including vassals founded during the game. */
  name(idx: number): string {
    const p = this.sim?.poleis[idx];
    return p ? polisName(this.i18n.t(), p.def) : '';
  }

  /** Dismisses the open notice and shows the next one, or resumes the game. */
  closeNotice() {
    if (!this.notice()) return;
    const next = this.queue.shift() ?? null;
    this.notice.set(next);
    if (!next) this.paused.set(this.pausedBeforeNotice);
  }

  improve(id: ImprovementId) {
    this.sim.improve(this.sim.player, id);
    this.publish();
  }

  resolveConquest(idx: number, choice: ConquestChoice) {
    this.sim.resolveConquest(idx, choice);
    this.publish();
  }

  acceptAlliance(from: number) {
    this.sim.ally(this.sim.player, from);
    this.publish();
  }

  declineAlliance(from: number) {
    this.sim.declineAlliance(from);
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
    this.notice.set(null);
    this.queue.length = 0;
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
        slaves: Math.round(p.slaves),
        prestige: p.prestige,
        allies: [...p.allies].filter(a => sim.poleis[a].alive),
        ships: sim.shipsOf(p.idx),
        tradeValue: sim.tradeValue(p),
        tradeEarned: p.tradeEarned,
        satisfaction: p.satisfaction,
        mood: sim.moodFactor(p),
        improvements: p.idx === sim.player ? this.improvementsOf(p.idx) : [],
        vassals: sim.vassalsOf(p.idx),
        client: p.client,
        besieged: p.besieged,
        relation: sim.player >= 0 ? sim.relation(sim.player, p.idx) : 0,
        tributeGold: Math.round(p.tributeGold),
        tributeWorkers: Math.round(p.tributeWorkers),
        overlord: p.overlord,
        developCost: sim.developCost(p),
        canDevelop: sim.canDevelop(p),
        wars: [...p.wars]
      }))
    );
    if (this.events().at(-1)?.id !== sim.events.at(-1)?.id) this.events.set([...sim.events]);
    this.collectNotices();
  }

  private improvementsOf(idx: number): ImprovementView[] {
    const sim = this.sim;
    const p = sim.poleis[idx];
    return IMPROVEMENTS.map(def => {
      const cost = improvementCost(def.tier);
      const work = p.works.find(w => w.id === def.id);
      return {
        id: def.id,
        tree: def.tree,
        tier: def.tier,
        state: sim.improvementState(p, def.id),
        progress: work ? Math.min(1, (sim.time - work.start) / (work.done - work.start)) : 0,
        drachmae: cost.drachmae,
        satisfaction: cost.satisfaction,
        affordable: sim.canImprove(p, def.id)
      };
    });
  }

  /** Turns fresh war declarations, embassies and the player's victories into notices that stop the clock. */
  private collectNotices() {
    const sim = this.sim;
    const fresh = sim.events.filter(e => e.id > this.lastEventId);
    if (fresh.length) this.lastEventId = fresh[fresh.length - 1].id;
    const reports = sim.takeReports();
    const warReports = sim.takeWarReports();
    const conquests = sim.takeConquests();
    if (sim.status !== 'playing') return;

    const me = sim.poleis[sim.player];
    const mine = sim.bloc(sim.player);
    const incoming: Notice[] = [];
    for (const e of fresh) {
      if (e.kind === 'war' && mine.includes(e.b) && !mine.includes(e.a)) {
        const ratio = sim.warriors(sim.poleis[e.a]) / Math.max(1, sim.warriors(me));
        incoming.push({ kind: 'war', from: e.a, tone: ratio > 1.4 || me.drachmae < 100 ? 'taunt' : 'challenge' });
      } else if (e.kind === 'allianceOffer' && e.b === sim.player) {
        incoming.push({ kind: 'alliance', from: e.a });
      }
    }
    // Several battles won in one breath make a single report.
    if (reports.length) {
      const sum = (key: 'gold' | 'slaves' | 'prestige' | 'enemyLosses' | 'ownLosses') =>
        reports.reduce((total, r) => total + r[key], 0);
      incoming.push({
        kind: 'victory',
        enemy: reports[0].enemy,
        near: reports[0].near,
        battles: reports.length,
        gold: sum('gold'),
        slaves: sum('slaves'),
        prestige: sum('prestige'),
        totalPrestige: me.prestige,
        enemyLosses: sum('enemyLosses'),
        ownLosses: sum('ownLosses')
      });
    }
    for (const c of conquests) incoming.push({ kind: 'conquest', from: c });
    for (const r of warReports) incoming.push({ kind: 'warEnd', ...r });
    this.enqueue(incoming);
  }

  /** Shows the first notice (pausing the game) and queues the rest. */
  private enqueue(incoming: Notice[]) {
    if (!incoming.length) return;
    if (!this.notice()) {
      this.pausedBeforeNotice = this.paused();
      this.paused.set(true);
      this.notice.set(incoming.shift()!);
    }
    this.queue.push(...incoming);
  }
}
