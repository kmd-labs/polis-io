import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { SplashService } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { polisName } from '../core/i18n/format';
import { loadMapData } from './map-loader';
import { IMPROVEMENTS, ImprovementId, ImprovementTree, improvementCost } from './data/improvements';
import {
  AllianceReason,
  BUDGET_KEYS,
  Budget,
  BudgetKey,
  ConquestChoice,
  DevelopmentPlan,
  GameEvent,
  GameStatus,
  PolisState,
  Purchase,
  RULES,
  Simulation,
  WarReport
} from './simulation';
import { World } from './world';
import { BUDGET_PRESETS, FundForecast, PresetId, forecastFund } from './economy';
import { GameHistory, budgetChanged } from './history';

/** Immutable UI snapshot of one polis, refreshed a few times per second. */
export interface PolisView {
  idx: number;
  color: string;
  alive: boolean;
  conqueror: number;
  total: number;
  workers: number;
  warriors: number;
  /** Everything in the five funds. */
  drachmae: number;
  /** Net income per second (after hoplite upkeep). */
  income: number;
  cells: number;
  /** Land area in km². */
  area: number;
  share: number;
  prosperity: number;
  settlers: number;
  expedition: number | null;
  /** Hoplites the military share aims for. */
  armyTarget: number;
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
  /** Income from work and hoplite pay per second, and smoothed cash reaching the funds per second. */
  gross: number;
  upkeep: number;
  inflow: number;
  /** Hoplites raised per military purchase. */
  levy: number;
  /** Player only: hoplites are deserting for want of pay; colonization has nowhere to go. */
  unpaid: boolean;
  colonyBlocked: boolean;
  /** Diplomatic reputation between this polis and the player (−100…+100). */
  relation: number;
  tributeGold: number;
  tributeWorkers: number;
  /** Shares (%), fund balances and what each fund is saving for (player only). */
  budget: Budget;
  funds: Budget;
  purchases: Partial<Record<BudgetKey, Purchase | null>>;
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
  /** Drachmae saved so far in the fund that pays for this tree. */
  saved: number;
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
  | { kind: 'alliance'; from: number; reason: AllianceReason; enemy: number }
  | ({ kind: 'warEnd' } & WarReport)
  | { kind: 'conquest'; from: number }
  | ({ kind: 'develop' } & Omit<DevelopmentPlan, 'kind'> & { work: DevelopmentPlan['kind'] });

/** Clock multipliers behind the five speed keys (1–5). */
export const SPEEDS = [1, 2, 4, 8, 16] as const;
/** A report the player may read when they like (it does not stop the game). */
export interface ReportItem {
  id: number;
  notice: Extract<Notice, { kind: 'victory' | 'warEnd' | 'develop' }>;
  year: number;
  time: number;
}

/** Unread reports fade from the alerts row after this many game seconds (5 years). */
const REPORT_TTL = 20;
const REPORTS_MAX = 6;

export type GameSpeed = (typeof SPEEDS)[number];

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
  /** The map camera flies to this polis whenever a new request is set. */
  readonly focusRequest = signal<{ idx: number } | null>(null);
  /** Polis highlighted while hovering the start screen list. */
  readonly preview = signal(-1);
  readonly paused = signal(false);
  readonly speed = signal<GameSpeed>(1);
  readonly year = signal(0);
  readonly poleis = signal<PolisView[]>([]);
  readonly events = signal<GameEvent[]>([]);
  /** Notice on screen; the game is paused while it is open. Further notices wait in a queue. */
  readonly notice = signal<Notice | null>(null);
  /** Yearly record of every polis and the player's notable moments; `historyVersion` ticks when it grows. */
  readonly history = new GameHistory();
  readonly historyVersion = signal(0);
  /** Shares last written to the history, and the pending debounce for slider moves. */
  private loggedBudget: Budget | null = null;
  private budgetTimer = 0;
  /** Battle, war and survey reports waiting in the alerts row. */
  readonly reports = signal<ReportItem[]>([]);

  readonly me = computed(() => this.poleis()[this.player()] ?? null);
  readonly target = computed(() => {
    const idx = this.selected();
    return idx >= 0 && idx !== this.player() ? (this.poleis()[idx] ?? null) : null;
  });

  private lastFrame = 0;
  private lastUi = 0;
  private lastEventId = 0;
  private reportId = 0;
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

  /** Selects a polis from a list and brings it into view. */
  focus(idx: number) {
    this.select(idx);
    this.focusRequest.set({ idx });
  }

  /** Starts the game leading the pre-selected polis. */
  begin() {
    const idx = this.selected();
    if (idx < 0) return;
    this.sim.choose(idx);
    this.selected.set(-1);
    this.preview.set(-1);
    this.paused.set(false);
    this.history.clear();
    this.loggedBudget = { ...this.sim.poleis[idx].budget };
    this.publish();
  }

  /** Writes a budget change to the history once the sliders have rested a second (≥5 points moved). */
  private noteBudget() {
    clearTimeout(this.budgetTimer);
    this.budgetTimer = window.setTimeout(() => {
      const me = this.sim.poleis[this.sim.player];
      if (!me || !this.loggedBudget || !budgetChanged(this.loggedBudget, me.budget)) return;
      this.history.addEvent({ kind: 'budget', year: this.sim.year, from: this.loggedBudget, to: { ...me.budget } });
      this.loggedBudget = { ...me.budget };
      this.historyVersion.update(v => v + 1);
    }, 1000);
  }

  /** Moves one budget slider; the others give way so the shares still add up to 100%. */
  setBudget(key: BudgetKey, value: number) {
    this.sim.setBudget(this.sim.player, key, value);
    this.noteBudget();
    this.publish();
  }

  /** Localized name of any polis, including vassals founded during the game. */
  name(idx: number): string {
    const p = this.sim?.poleis[idx];
    return p ? polisName(this.i18n.t(), p.def) : '';
  }

  /** Nothing for the colonization fund to do: no expedition can set out and no colony site is left. */
  private colonyBlocked(p: PolisState): boolean {
    if (p.expedition) return false;
    const next = this.sim.nextPurchase(p, 'colonization');
    return !next || (next.kind === 'expedition' && !this.sim.canSettle(p));
  }

    /** Opens a report from the alerts row (the game waits while it is read). */
  openReport(id: number) {
    const item = this.reports().find(r => r.id === id);
    if (!item) return;
    this.reports.update(list => list.filter(r => r.id !== id));
    this.enqueue([item.notice]);
  }

  /** Dismisses the open notice and shows the next one, or resumes the game. */
  closeNotice() {
    if (!this.notice()) return;
    const next = this.queue.shift() ?? null;
    this.notice.set(next);
    if (!next) this.paused.set(this.pausedBeforeNotice);
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
    this.speed.update(s => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]);
  }

  /** Speed by key: 1 = normal … 5 = fastest. */
  setSpeed(level: number) {
    const speed = SPEEDS[level - 1];
    if (speed) this.speed.set(speed);
  }

  /** Forecast for each of the player's funds at today's income (see `forecastFund`). */
  readonly forecasts = computed(() => {
    const me = this.me();
    if (!me) return null;
    const busy = BUDGET_KEYS.filter(k => me.purchases[k] || (k === 'colonization' && me.expedition !== null));
    const busyShare = busy.reduce((sum, k) => sum + me.budget[k], 0);
    return Object.fromEntries(
      BUDGET_KEYS.map(key => [
        key,
        forecastFund({
          key,
          share: me.budget[key],
          busyShare,
          inflow: me.inflow,
          upkeep: me.upkeep,
          balance: me.funds[key],
          next: me.purchases[key] ?? null,
          levy: me.levy
        })
      ])
    ) as Record<BudgetKey, FundForecast>;
  });

  /** The player's income, line by line (per second), for the treasury tooltip. */
  readonly incomeBreakdown = computed(() => {
    const me = this.me();
    return me ? this.sim.incomeBreakdown(this.sim.poleis[me.idx]) : null;
  });

  /** Sets all five shares from a preset. */
  applyPreset(id: PresetId) {
    this.sim.setShares(this.sim.player, BUDGET_PRESETS[id]);
    this.noteBudget();
    this.publish();
  }

  /** Converts a per-second simulation rate into a per-month figure for display. */
  perMonth(perSecond: number): number {
    return (perSecond * RULES.secondsPerYear) / 12;
  }

  restart() {
    this.sim.reset();
    this.notice.set(null);
    this.reports.set([]);
    this.history.clear();
    this.historyVersion.update(v => v + 1);
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
        drachmae: Math.floor(sim.treasury(p)),
        income: p.income,
        cells: p.cells,
        area: p.cells * cellArea,
        share: p.cells / greek,
        prosperity: p.prosperity,
        settlers: sim.settlers(p),
        expedition: p.expedition ? 1 - p.expedition.settlers / p.expedition.initial : null,
        armyTarget: Math.round(sim.armyTarget(p)),
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
        unpaid: p.unpaid,
        gross: p.gross,
        upkeep: p.upkeep,
        inflow: p.inflow,
        levy: sim.levySize(p),
        colonyBlocked: p.idx === sim.player && this.colonyBlocked(p),
        relation: sim.player >= 0 ? sim.relation(sim.player, p.idx) : 0,
        tributeGold: Math.round(p.tributeGold),
        tributeWorkers: Math.round(p.tributeWorkers),
        overlord: p.overlord,
        budget: { ...p.budget },
        funds: { ...p.funds },
        purchases: p.idx === sim.player ? Object.fromEntries(BUDGET_KEYS.map(k => [k, sim.nextPurchase(p, k)])) : {},
        wars: [...p.wars]
      }))
    );
    if (this.events().at(-1)?.id !== sim.events.at(-1)?.id) this.events.set([...sim.events]);
    if (sim.status !== 'choosing' && this.history.years.at(-1) !== sim.year) {
      this.history.record(sim);
      this.historyVersion.update(v => v + 1);
    }
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
        drachmae: sim.improvementPrice(p, def.id),
        satisfaction: cost.satisfaction,
        saved: Math.floor(p.funds[def.tree])
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
    // Reports do not stop the game: they wait in the alerts row until read or stale.
    const filed: ReportItem['notice'][] = [];
    for (const e of fresh) {
      // The player's wars and new buildings mark the history charts.
      if ((e.kind === 'war' || e.kind === 'peace') && (e.a === sim.player || e.b === sim.player)) {
        this.history.addEvent({ kind: e.kind, year: e.year, other: e.a === sim.player ? e.b : e.a });
      } else if (e.kind === 'built' && e.a === sim.player && e.tag) {
        this.history.addEvent({ kind: 'built', year: e.year, id: e.tag });
      }
      if (e.kind === 'war' && mine.includes(e.b) && !mine.includes(e.a)) {
        const ratio = sim.warriors(sim.poleis[e.a]) / Math.max(1, sim.warriors(me));
        incoming.push({ kind: 'war', from: e.a, tone: ratio > 1.4 || sim.treasury(me) < 100 ? 'taunt' : 'challenge' });
      } else if (e.kind === 'allianceOffer' && e.b === sim.player) {
        incoming.push({ kind: 'alliance', from: e.a, reason: (e.tag as AllianceReason) ?? 'goodwill', enemy: e.n ?? -1 });
      }
    }
    // Several battles won in one breath make a single report.
    if (reports.length) {
      const sum = (key: 'gold' | 'slaves' | 'prestige' | 'enemyLosses' | 'ownLosses') =>
        reports.reduce((total, r) => total + r[key], 0);
      filed.push({
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
    for (const r of warReports) filed.push({ kind: 'warEnd', ...r });
    // The player's budget founded a colony: say where and when.
    for (const { owner, plan } of sim.takePlans()) {
      if (owner === sim.player) filed.push({ kind: 'develop', work: plan.kind, months: plan.months, site: plan.site });
    }
    this.enqueue(incoming);
    const live = this.reports().filter(r => sim.time - r.time < REPORT_TTL);
    const added = filed.map(notice => ({ id: ++this.reportId, notice, year: sim.year, time: sim.time }));
    if (added.length || live.length !== this.reports().length) this.reports.set([...live, ...added].slice(-REPORTS_MAX));
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
