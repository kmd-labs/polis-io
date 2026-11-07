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
  OlympicReport,
  PolisState,
  Purchase,
  SurplusUse,
  RULES,
  Simulation,
  WarReport
} from './simulation';
import { World } from './world';
import { BUDGET_PRESETS, FundForecast, PresetId, forecastFund } from './economy';
import { budgetChanged } from './history';
import { HEGEMONY_CATEGORIES, HEGEMONY_RULES, HegemonyCategory, HegemonyStanding } from './hegemony';
import { Annals, AnnalsYear } from './annals';
import { DecadeReport, decadeReport } from './decade';
import { olympiadOf } from './olympics';
import { Fortune } from './fortune';

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
  /** What the military fund buys once the army is full; galleys afloat; mercenaries in the field; who blockades us. */
  surplus: SurplusUse;
  warships: number;
  mercenaries: number;
  blockadedBy: number;
  hasHarbour: boolean;
  /** Seconds until this polis may found its next colony city. */
  colonyIn: number;
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
  | { kind: 'hegemon'; hegemon: number; previous: number }
  | { kind: 'decade'; report: DecadeReport }
  | { kind: 'olympicsInvite'; year: number; olympiad: number; annualIncome: number; treasury: number }
  | { kind: 'olympics'; report: OlympicReport }
  | { kind: 'fortune'; fortune: Fortune }
  | { kind: 'built'; what: 'improvement' | 'farm' | 'port'; id: ImprovementId | null }
  | ({ kind: 'develop' } & Omit<DevelopmentPlan, 'kind'> & { work: DevelopmentPlan['kind'] });

/** Clock multipliers behind the five speed keys (1–5). */
export const SPEEDS = [1, 2, 4, 8, 16] as const;
/** A report the player may read when they like (it does not stop the game). */
export interface ReportItem {
  id: number;
  notice: Extract<Notice, { kind: 'victory' | 'warEnd' | 'develop' | 'fortune' }>;
  year: number;
  time: number;
}

/** Envoys waiting for an answer; they leave after EMBASSY_TTL. */
export interface Embassy {
  id: number;
  from: number;
  reason: AllianceReason;
  enemy: number;
  year: number;
  time: number;
}

/** Envoys wait two years (game seconds) for an answer before going home. */
export const EMBASSY_TTL = 2 * RULES.secondsPerYear;
const DECADE_KEY = 'polis-io.decade';

/** A change on a hegemony podium that concerns the player (shown in the alerts row). */
export interface PodiumNews {
  id: number;
  year: number;
  time: number;
  category: HegemonyCategory;
  /** The player's new place (0 = off the podium) and the place before. */
  place: number;
  was: number;
  /** Who took the player's place, if anyone. */
  by: number;
}

/** Unread reports fade from the alerts row after this many game seconds (5 years). */
const REPORT_TTL = 5 * RULES.secondsPerYear;
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
  /** The sacred truce of the Olympic Games is on. */
  readonly truce = signal(false);
  readonly speed = signal<GameSpeed>(1);
  readonly year = signal(0);
  readonly poleis = signal<PolisView[]>([]);
  readonly events = signal<GameEvent[]>([]);
  /** Notice on screen; the game is paused while it is open. Further notices wait in a queue. */
  readonly notice = signal<Notice | null>(null);
  /** Yearly record of every polis and the player's notable moments; `historyVersion` ticks when it grows. */
  readonly annals = new Annals();
  readonly history = this.annals.history;
  readonly historyVersion = signal(0);
  /** Shares last written to the history, and the pending debounce for slider moves. */
  private loggedBudget: Budget | null = null;
  private budgetTimer = 0;
  /** This year's hegemony rankings, the player's score over the years, and podium news for the alerts. */
  readonly hegemony = signal<HegemonyStanding | null>(null);
  readonly hegemonyLog = signal<{ year: number; score: number }[]>([]);
  readonly podiumNews = signal<PodiumNews[]>([]);
  /** Rankings ten years ago, for the trend arrows. */
  readonly hegemonyPast = signal<HegemonyStanding | null>(null);
  /** Embassies waiting in the alerts row for the player's answer. */
  readonly embassies = signal<Embassy[]>([]);
  /** Whether the decade report stops the game every ten years (remembered per browser). */
  readonly decadeReports = signal(GameService.loadDecadeSetting());
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
    this.annals.clear();
    this.loggedBudget = { ...this.sim.poleis[idx].budget };
    this.publish();
  }

  /** Ranks the year just recorded (through the annals) and reports what changed on the podiums. */
  private rankYear(year: AnnalsYear) {
    const sim = this.sim;
    const { now, before } = year;
    this.hegemony.set(now);
    this.hegemonyPast.set(this.annals.tenYearsAgo);
    const me = sim.player;
    this.hegemonyLog.update(log => [...log, { year: now.year, score: now.scores[me] ?? 0 }]);
    if (!before || sim.status !== 'playing') return;

    for (const c of year.newLeaders) sim.note('podium', c.lead, c.was, c.category);
    const news: PodiumNews[] = [];
    for (const cat of HEGEMONY_CATEGORIES) {
      // The player's podium place in this category moved.
      const podium = (s: HegemonyStanding) => {
        const i = s[cat].slice(0, 3).findIndex(r => r.idx === me);
        return i < 0 ? 0 : i + 1;
      };
      const place = podium(now);
      const prev = podium(before);
      if (place !== prev) {
        const taker = prev ? (now[cat][prev - 1]?.idx ?? -1) : -1;
        news.push({ id: ++this.reportId, year: sim.year, time: sim.time, category: cat, place, was: prev, by: taker === me ? -1 : taker });
      }
    }
    if (news.length) this.podiumNews.update(list => [...list.filter(n => sim.time - n.time < REPORT_TTL), ...news].slice(-REPORTS_MAX));
    // Every ten years, the decade in review (if the player wants it).
    const years = this.history.length;
    if (years > 10 && (years - 1) % 10 === 0 && this.decadeReports()) {
      const rows = this.history.recent(11).map(r => r[me]).filter(s => s?.alive);
      if (rows.length === 11) {
        const report = decadeReport(rows, this.annals.tenYearsAgo?.places[me] ?? null, now.places[me] ?? null);
        this.enqueue([{ kind: 'decade', report }]);
      }
    }
    // A new Hegemon of Hellas stops the game — but not in the first decade, while the rankings settle.
    if (year.announce) {
      sim.note('hegemon', year.announce.hegemon, year.announce.previous);
      if (this.history.length > HEGEMONY_RULES.financeYears) this.enqueue([{ kind: 'hegemon', ...year.announce }]);
    }
  }

  /** The three poleis with the most hegemony points, best first (for the hegemony map). */
  readonly hegemonyPodium = computed(() => {
    const h = this.hegemony();
    if (!h) return [];
    const pop = new Map(h.population.map(r => [r.idx, r.value]));
    return Object.entries(h.scores)
      .map(([idx, score]) => ({ idx: Number(idx), score }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score || (pop.get(b.idx) ?? 0) - (pop.get(a.idx) ?? 0))
      .slice(0, 3)
      .map(r => r.idx);
  });

  dismissPodiumNews(id: number) {
    this.podiumNews.update(list => list.filter(n => n.id !== id));
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
    // Waiting for the next colony while there is no free land at home is not being stuck.
    if (this.sim.time < p.nextColonyAt) return false;
    const next = this.sim.nextPurchase(p, 'colonization');
    return !next || (next.kind === 'expedition' && !this.sim.canSettle(p));
  }

    private static loadDecadeSetting(): boolean {
    try {
      return localStorage.getItem(DECADE_KEY) !== 'off';
    } catch {
      return true;
    }
  }

  setDecadeReports(on: boolean) {
    this.decadeReports.set(on);
    try {
      localStorage.setItem(DECADE_KEY, on ? 'on' : 'off');
    } catch {
      // localStorage unavailable
    }
  }

  /** Receives the envoys of a waiting embassy (opens the decision); stale ones are sent home. */
  openEmbassy(id: number) {
    const e = this.embassies().find(x => x.id === id);
    if (!e) return;
    this.embassies.update(list => list.filter(x => x.id !== id));
    const from = this.sim.poleis[e.from];
    const me = this.sim.poleis[this.sim.player];
    if (!from?.alive || !me || from.wars.has(me.idx) || from.allies.has(me.idx)) return;
    this.enqueue([{ kind: 'alliance', from: e.from, reason: e.reason, enemy: e.enemy }]);
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

  /** What the military fund buys once the army is full: nothing extra, mercenaries or war galleys. */
  setSurplus(use: SurplusUse) {
    this.sim.setSurplus(this.sim.player, use);
    this.publish();
  }

  /** Sends the player's delegation to Olympia: a share of a year's income (0 = stay at home). */
  sendDelegation(share: number) {
    this.sim.sendDelegation(this.sim.player, share);
    this.publish();
  }

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
    this.embassies.set([]);
    this.annals.clear();
    this.historyVersion.update(v => v + 1);
    this.hegemony.set(null);
    this.hegemonyPast.set(null);
    this.hegemonyLog.set([]);
    this.podiumNews.set([]);
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
    this.truce.set(sim.truce);
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
        surplus: p.surplus,
        warships: sim.fleetStrength(p.idx),
        mercenaries: sim.mercenaries(p.idx),
        blockadedBy: p.blockadedBy,
        hasHarbour: p.idx === sim.player && sim.harbourOf(p) >= 0,
        colonyBlocked: p.idx === sim.player && this.colonyBlocked(p),
        colonyIn: Math.max(0, p.nextColonyAt - sim.time),
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
    const year = this.annals.update(sim);
    if (year) {
      this.historyVersion.update(v => v + 1);
      this.rankYear(year);
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
    const invites = sim.takeOlympicInvites();
    const games = sim.takeOlympics();
    if (sim.status !== 'playing') return;

    const me = sim.poleis[sim.player];
    const mine = sim.bloc(sim.player);
    const incoming: Notice[] = [];
    // Reports do not stop the game: they wait in the alerts row until read or stale.
    const filed: ReportItem['notice'][] = [];
    // Twists of fortune go to the alerts row: the money has already moved, the story waits to be read.
    for (const fortune of sim.takeFortunes()) filed.push({ kind: 'fortune', fortune });
    for (const e of fresh) {
      // The player's wars and new buildings mark the history charts.
      if ((e.kind === 'war' || e.kind === 'peace') && (e.a === sim.player || e.b === sim.player)) {
        this.history.addEvent({ kind: e.kind, year: e.year, other: e.a === sim.player ? e.b : e.a });
      } else if (e.kind === 'built' && e.a === sim.player && e.tag) {
        this.history.addEvent({ kind: 'built', year: e.year, id: e.tag });
      }
      // Every finished building of the player's gets its own message.
      if (e.a === sim.player && ((e.kind === 'built' && e.tag) || e.kind === 'farm' || e.kind === 'port')) {
        incoming.push(
          e.kind === 'built'
            ? { kind: 'built', what: 'improvement', id: e.tag as ImprovementId }
            : { kind: 'built', what: e.kind, id: null }
        );
      }
      if (e.kind === 'war' && mine.includes(e.b) && !mine.includes(e.a)) {
        const ratio = sim.warriors(sim.poleis[e.a]) / Math.max(1, sim.warriors(me));
        incoming.push({ kind: 'war', from: e.a, tone: ratio > 1.4 || sim.treasury(me) < 100 ? 'taunt' : 'challenge' });
      } else if (e.kind === 'allianceOffer' && e.b === sim.player) {
        // Envoys wait in the alerts row rather than stopping the game.
        const embassy = { id: ++this.reportId, from: e.a, reason: (e.tag as AllianceReason) ?? 'goodwill', enemy: e.n ?? -1, year: e.year, time: sim.time };
        this.embassies.update(list => [...list.filter(x => x.from !== e.a), embassy]);
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
    // The heralds of Elis proclaim the truce: how large a delegation will the city send?
    for (const year of invites) {
      incoming.push({ kind: 'olympicsInvite', year, olympiad: olympiadOf(year), annualIncome: sim.annualIncome(me), treasury: sim.treasury(me) });
    }
    for (const report of games) incoming.push({ kind: 'olympics', report });
    for (const r of warReports) filed.push({ kind: 'warEnd', ...r });
    // The player's budget founded a colony: say where and when.
    for (const { owner, plan } of sim.takePlans()) {
      if (owner === sim.player) filed.push({ kind: 'develop', work: plan.kind, months: plan.months, site: plan.site });
    }
    this.enqueue(incoming);
    // Unanswered envoys go home after two years: the offer is taken as declined.
    const waiting = this.embassies();
    const gone = waiting.filter(x => sim.time - x.time >= EMBASSY_TTL);
    if (gone.length) {
      for (const x of gone) sim.declineAlliance(x.from);
      this.embassies.set(waiting.filter(x => sim.time - x.time < EMBASSY_TTL));
    }
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
