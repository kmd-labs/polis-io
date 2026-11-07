import { Component, HostListener, TemplateRef, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Globe,
  BookOpen,
  Landmark,
  Mountain,
  Wheat,
  Play,
  Pause,
  FastForward,
  Maximize,
  RotateCcw,
  Coins,
  Pickaxe,
  Flag,
  Swords,
  Hourglass,
  MapIcon,
  Smile
} from 'lucide-angular';
import {
  BrandComponent,
  DropdownComponent,
  DropdownOption,
  PopupComponent,
  PopupService,
  SplashComponent,
  SplashService,
  AboutService,
  TooltipComponent,
  BreakpointService,
  SeoService
} from '@kmd/design-system';
import { I18nService } from './core/i18n/i18n.service';
import { Lang } from './core/i18n/i18n.types';
import { fmt1, formatNumber, formatOrdinal, formatPlural, formatYear, formatYears, interpolate } from './core/i18n/format';
import { DecadeReport } from './game/decade';
import { HEGEMONY_CATEGORIES } from './game/hegemony';
import { GameService } from './game/game.service';
import { MapCanvasComponent } from './game/map-canvas.component';
import { MapView } from './game/map-renderer';
import { BUDGET_KEYS, ConquestChoice, FallOutcome, OlympicReport } from './game/simulation';
import { PolisFlagComponent } from './hud/polis-flag.component';
import { Fortune } from './game/fortune';
import { ImprovementId } from './game/data/improvements';
import { APP_VERSION } from './version';
import { GreatWorkId } from './game/data/frontier';
import { SiteId } from './game/data/poleis';
import { StartScreenComponent } from './hud/start-screen.component';
import { EventCardComponent } from './hud/event-card.component';
import { WarPostureComponent } from './hud/war-posture.component';
import { PeaceTableComponent } from './hud/peace-table.component';
import { describeTerms } from './hud/peace-terms';
import { CampaignReport, PeaceItem } from './game/war';
import { GREECE_MAP } from './game/data/greece-map';
import { DilemmaChoice, DilemmaId } from './game/data/dilemmas';
import { HudComponent } from './hud/hud.component';
import { HudStateService } from './hud/hud-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    BrandComponent,
    DropdownComponent,
    PopupComponent,
    SplashComponent,
    TooltipComponent,
    MapCanvasComponent,
    PolisFlagComponent,
    StartScreenComponent,
    HudComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly i18n = inject(I18nService);
  readonly bp = inject(BreakpointService);
  readonly popup = inject(PopupService);
  readonly about = inject(AboutService);
  readonly splash = inject(SplashService);
  readonly seo = inject(SeoService);
  readonly game = inject(GameService);
  readonly version = APP_VERSION;
  readonly hud = inject(HudStateService);

  @ViewChild(MapCanvasComponent) private map?: MapCanvasComponent;
  @ViewChild('rulesTpl', { static: true }) private rulesTpl!: TemplateRef<unknown>;
  @ViewChild('letterTpl', { static: true }) private letterTpl!: TemplateRef<unknown>;
  @ViewChild('reportTpl', { static: true }) private reportTpl!: TemplateRef<unknown>;
  @ViewChild('conquestTpl', { static: true }) private conquestTpl!: TemplateRef<unknown>;
  @ViewChild('decadeTpl', { static: true }) private decadeTpl!: TemplateRef<unknown>;
  @ViewChild('olympicsTpl', { static: true }) private olympicsTpl!: TemplateRef<unknown>;
  @ViewChild('inviteTpl', { static: true }) private inviteTpl!: TemplateRef<unknown>;

  /** The open Olympic report, localized. */
  readonly olympicsView = computed(() => {
    const n = this.game.notice();
    if (n?.kind !== 'olympics') return null;
    const r = n.report;
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const me = this.game.player();
    const def = (idx: number) => this.game.sim.poleis[idx].def;
    const mine = r.table.findIndex(row => row.idx === me);
    const myRow = mine >= 0 ? r.table[mine] : null;
    const reward = r.rewards.find(x => x.idx === me);
    const top = r.table.slice(0, 6).map((row, i) => ({ ...row, place: i + 1, def: def(row.idx), name: this.game.name(row.idx), mine: row.idx === me }));
    if (myRow && mine >= 6) top.push({ ...myRow, place: mine + 1, def: def(me), name: this.game.name(me), mine: true });
    return {
      verdict: myRow
        ? interpolate(myRow.wreaths ? t.olyYouWon : t.olyYouNone, {
            n: myRow.wreaths,
            place: formatOrdinal(mine + 1, lang),
            of: r.table.length
          })
        : t.olyYouStayed,
      reward: reward
        ? interpolate(t.olyReward, { p: fmt1(reward.prestige, lang), r: reward.relation })
        : '',
      triumph: r.triumphs.includes(me) ? t.olyTriumph : '',
      others: r.triumphs.filter(i => i !== me).map(i => interpolate(t.olyTriumphOther, { name: this.game.name(i) })),
      top,
      events: r.winners.map(w => ({ event: t.olympicEvents[w.event] ?? w.event, winner: this.game.name(w.idx), mine: w.idx === me }))
    };
  });

  /** The open decade report, localized. */
  readonly decadeView = computed(() => {
    const n = this.game.notice();
    if (n?.kind !== 'decade') return null;
    const r = n.report;
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const pct = (v: number | null) => (v === null ? '—' : `${v < 0 ? '−' : '+'}${fmt1(Math.abs(v * 100), lang)}%`);
    const tone = (v: number | null) => (v === null || Math.abs(v) < 0.005 ? '' : v > 0 ? 'up' : 'down');
    const place = (p: number) => (p ? formatOrdinal(p, lang) : '—');
    return {
      rows: [
        { label: t.statPopulation, value: pct(r.population), tone: tone(r.population) },
        { label: t.chartIncome, value: pct(r.income), tone: tone(r.income) },
        { label: t.statTerritory, value: pct(r.territory), tone: tone(r.territory) },
        { label: t.decBattles, value: interpolate(t.decBattlesValue, { w: r.battlesWon, l: r.battlesLost }), tone: '' }
      ],
      places: HEGEMONY_CATEGORIES.map(c => ({
        label: t.hegemonyCats[c].name,
        value: `${place(r.places[c].then)} → ${place(r.places[c].now)}`,
        tone: r.places[c].now && (!r.places[c].then || r.places[c].now < r.places[c].then) ? 'up' : r.places[c].now > r.places[c].then ? 'down' : ''
      })),
      budget: BUDGET_KEYS.map(k => ({ key: k, label: t.budgetKeys[k].name, share: r.budget[k] })),
      verdict: t.decVerdicts[r.verdict]
    };
  });

  /** The open end-of-war report, localized (rendered with the battle report template). */
  readonly warView = computed(() => {
    const n = this.game.notice();
    if (n?.kind !== 'warEnd') return null;
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const num = (v: number) => formatNumber(v, lang);
    const km2 = (cells: number) => num(Math.round((cells * this.game.world.cellKm * this.game.world.cellKm) / 10) * 10);
    const mood = n.satisfaction > 0 ? `+${n.satisfaction}` : `${n.satisfaction}`;
    return {
      battles: '',
      rows: [
        { icon: this.icons.Hourglass, label: t.warDuration, value: formatYears(n.years, t) },
        { icon: this.icons.Swords, label: t.warBattles, value: interpolate(t.warBattlesValue, { w: n.battlesWon, l: n.battlesLost }) },
        { icon: this.icons.MapIcon, label: t.warLand, value: interpolate(t.warLandValue, { g: km2(n.cellsGained), l: km2(n.cellsLost) }) },
        {
          icon: this.icons.Flag,
          label: t.reportLosses,
          value: interpolate(t.reportLossesValue, { e: num(Math.round(n.enemyLosses)), o: num(Math.round(n.ownLosses)) })
        },
        { icon: this.icons.Coins, label: t.warSpoils, value: interpolate(t.warSpoilsValue, { g: num(n.gold), c: num(n.captives) }) },
        { icon: this.icons.Smile, label: t.satisfaction, value: interpolate(t.warMoodValue, { n: mood }) }
      ]
    };
  });

  /** The open victory report, localized. */
  readonly reportView = computed(() => {
    const war = this.warView();
    if (war) return war;
    const n = this.game.notice();
    if (n?.kind !== 'victory') return null;
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const num = (v: number) => formatNumber(v, lang);
    return {
      battles: n.battles > 1 ? interpolate(t.reportBattles, { n: n.battles }) : '',
      rows: [
        { icon: this.icons.Coins, label: t.reportGold, value: interpolate(t.reportGoldValue, { n: num(n.gold) }) },
        { icon: this.icons.Pickaxe, label: t.reportSlaves, value: interpolate(t.reportSlavesValue, { n: num(n.slaves) }) },
        {
          icon: this.icons.Flag,
          label: t.statPrestige,
          value: interpolate(t.reportPrestigeValue, { n: fmt1(n.prestige, lang), t: fmt1(n.totalPrestige, lang) })
        },
        {
          icon: this.icons.Swords,
          label: t.reportLosses,
          value: interpolate(t.reportLossesValue, { e: num(n.enemyLosses), o: num(n.ownLosses) })
        }
      ]
    };
  });

  /** Sender and text of the open war letter or embassy, localized. */
  readonly letterView = computed(() => {
    const n = this.game.notice();
    if (n?.kind === 'alliance') {
      const name = this.game.name(n.from);
      const t = this.i18n.t();
      return {
        sender: interpolate(t.letterGeneric.sender, { name }),
        text: interpolate(t.embassyTexts[n.reason], { name, enemy: this.game.name(n.enemy) }),
        color: this.game.sim.poleis[n.from].def.color,
        // Accepting means joining every war the city is fighting.
        wars: [...this.game.sim.poleis[n.from].wars].map(i => ({ name: this.game.name(i), color: this.game.sim.poleis[i].def.color }))
      };
    }
    if (n?.kind !== 'war') return null;
    const letter = n;
    const t = this.i18n.t();
    const def = this.game.sim.poleis[letter.from].def;
    const name = this.game.name(letter.from);
    const voice = def.kind === 'major' ? t.letters[def.id] : t.letterGeneric;
    return {
      sender: interpolate(voice.sender, { name }),
      text: letter.tone === 'taunt' ? voice.taunt : voice.challenge,
      color: def.color,
      wars: [] as { name: string; color: string }[]
    };
  });

  readonly icons = { Globe, BookOpen, Play, Pause, FastForward, Maximize, RotateCcw, Coins, Pickaxe, Flag, Swords, Hourglass, MapIcon, Smile };

  readonly langOptions = computed<DropdownOption<Lang>[]>(() =>
    this.i18n.langs.map(l => ({
      value: l,
      label: this.i18n.dicts[l].langName,
      shortLabel: l.toUpperCase(),
      badge: l.toUpperCase()
    }))
  );

  readonly isPopupOpen = computed(() => this.popup.config() !== null);
  /** In game, on tablets the logotype folds to make room for the resource bar. */
  readonly compactBrand = computed(() => this.game.status() !== 'choosing' && this.bp.tablet() && !this.bp.mobile());
  readonly year = computed(() => formatYear(this.game.year(), this.i18n.t()));
  readonly ended = computed(() => this.game.status() === 'won' || this.game.status() === 'lost');

  constructor() {
    effect(() => {
      const t = this.i18n.t();
      this.seo.update({
        title: t.docTitle,
        description: t.seoDescription,
        image: 'assets/design-system/og-image.png'
      });
    });

    // Keep the splash up until the map is decoded and the logo reveal has played.
    effect(() => {
      if (this.splash.revealed() && this.game.ready()) untracked(() => this.splash.finish());
    });

    // Letters, embassies and battle reports stop the clock until they are read.
    effect(() => {
      const n = this.game.notice();
      if (!n) return;
      untracked(() => {
        if (n.kind === 'war') this.openLetter(n.from);
        else if (n.kind === 'alliance') this.openEmbassy(n.from);
        else if (n.kind === 'warEnd') this.openWarEnd(n.enemy, n.outcome, n.fate);
        else if (n.kind === 'conquest') this.openConquest(n.from);
        else if (n.kind === 'develop') this.openDevelopment(n.work, n.months, n.site);
        else if (n.kind === 'hegemon') this.openHegemon(n.hegemon);
        else if (n.kind === 'decade') this.openDecade(n.report);
        else if (n.kind === 'olympicsInvite') this.openOlympicsInvite(n.olympiad, n.year, n.annualIncome, n.treasury);
        else if (n.kind === 'olympics') this.openOlympicsReport(n.report);
        else if (n.kind === 'fortune') this.openFortune(n.fortune);
        else if (n.kind === 'dilemma') this.openDilemma(n.id, n.year, n.choices);
        else if (n.kind === 'built') this.openBuilt(n.what, n.id);
        else if (n.kind === 'greatWork') this.openGreatWork(n.id);
        else if (n.kind === 'raidChoice') this.openRaidChoice(n.band, n.tribe, n.men, n.cost, n.treasury);
        else if (n.kind === 'warPosture') this.openWarPosture(n.enemy);
        else if (n.kind === 'peaceOffer') this.openPeaceOffer(n.from, n.deal);
        else if (n.kind === 'peaceTable') this.openPeaceTable(n.enemy, n.deal);
        else if (n.kind === 'campaign') this.openCampaign(n.report);
        else this.openReport(n.near);
      });
    });

    // Announce the end of the game once.
    effect(() => {
      const status = this.game.status();
      if (status === 'won' || status === 'lost') untracked(() => this.openEndPopup(status));
    });
  }

  /** Space pauses, 1–5 set the speed, B opens the budget, H the hegemony, Esc folds the drawer. */
  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (event.ctrlKey || event.metaKey || event.altKey || target?.closest('input, textarea, select, [contenteditable]')) return;
    if (this.game.status() === 'choosing' || !this.game.ready()) return;
    const playing = this.game.status() === 'playing';
    const mobile = this.bp.mobile();
    if (event.key === ' ') {
      if (target?.closest('button, [role="listbox"]') || !playing || this.isPopupOpen()) return;
      event.preventDefault();
      this.game.togglePause();
    } else if (/^[1-5]$/.test(event.key)) {
      if (!playing || this.isPopupOpen()) return;
      this.game.setSpeed(Number(event.key));
    } else if (event.key === 'b' || event.key === 'B') {
      if (this.isPopupOpen()) return;
      if (mobile) this.hud.toggleSheet('budget');
      else this.hud.toggleTab('budget');
    } else if (event.key === 'h' || event.key === 'H') {
      if (this.isPopupOpen()) return;
      if (mobile) this.hud.toggleSheet('hegemony');
      else this.hud.toggleTab('hegemony');
    } else if (event.key === 'Escape') {
      if (this.isPopupOpen()) return;
      if (mobile) this.hud.sheet.set(null);
      else this.hud.drawerOpen.set(false);
    }
  }

  fitMap() {
    this.map?.fit(true);
  }

  /** HUD panels opened or folded: keep the untouched map framed in what is left. */
  reframe() {
    this.map?.reframe();
  }

  restart() {
    this.popup.close();
    this.game.restart();
    requestAnimationFrame(() => this.map?.fit(true));
  }

  openGlossary() {
    // Freeze the battlefield while reading the rules.
    const wasPaused = this.game.paused();
    this.game.paused.set(true);
    this.popup.open({
      onClose: () => this.game.paused.set(wasPaused),
      id: 'glossary',
      title: computed(() => this.i18n.t().glossary),
      description: computed(() => this.i18n.t().glossaryDesc),
      template: this.rulesTpl,
      size: 'md',
      actions: [{ label: computed(() => this.i18n.t().close), variant: 'default' }]
    });
  }

  private openLetter(from: number) {
    const name = () => this.game.name(from);
    // Suing for peace at once costs a year's income, paid to the aggressor.
    const cost = this.game.buyPeaceCost();
    const affordable = this.game.sim.treasury(this.game.sim.poleis[this.game.player()]) >= cost;
    this.popup.open({
      id: 'war-letter',
      title: computed(() => interpolate(this.i18n.t().letterTitle, { name: name() })),
      subtitle: computed(() => interpolate(this.i18n.t().letterDeclares, { name: name() })),
      template: this.letterTpl,
      size: 'sm',
      onClose: () => this.game.closeNotice(),
      actions: [
        {
          label: computed(() => interpolate(this.i18n.t().letterSuePeace, { d: formatNumber(cost, this.i18n.lang()) })),
          variant: 'default',
          disabled: !affordable,
          onClick: () => this.game.buyPeace(from)
        },
        { label: computed(() => this.i18n.t().letterAction), variant: 'play', hot: true }
      ]
    });
  }

  /** A war has begun: how boldly shall the city fight it? */
  private openWarPosture(enemy: number) {
    if (!this.game.sim.poleis[this.game.player()]?.wars.has(enemy)) {
      this.game.closeNotice();
      return;
    }
    const name = () => this.game.name(enemy);
    this.popup.open({
      id: 'war-posture',
      title: computed(() => interpolate(this.i18n.t().postureTitle, { name: name() })),
      description: computed(() => this.i18n.t().postureIntro),
      component: WarPostureComponent,
      componentInputs: { enemy, done: () => this.popup.close() },
      size: 'md',
      onClose: () => this.game.closeNotice()
    });
  }

  /** Envoys come with terms: accept them, refuse, or sit down at the table. */
  private openPeaceOffer(from: number, deal: PeaceItem[]) {
    if (!this.game.sim.poleis[this.game.player()]?.wars.has(from)) {
      this.game.closeNotice();
      return;
    }
    const t = () => this.i18n.t();
    const name = () => this.game.name(from);
    let talk = false;
    this.popup.open({
      id: 'peace-offer',
      title: computed(() => interpolate(t().peaceOfferTitle, { name: name() })),
      description: computed(() => {
        const terms = describeTerms(this.game.sim, deal, t(), this.i18n.lang(), i => this.game.name(i), [from, this.game.player()]);
        return `${interpolate(t().peaceOfferText, { name: name() })} ${terms.length ? terms.join(' · ') : t().peaceOfferNone}`;
      }),
      size: 'sm',
      onClose: () => {
        this.game.closeNotice();
        if (talk) this.game.offerPeace(from, deal);
      },
      actions: [
        { label: computed(() => t().peaceOfferRefuse), variant: 'default' },
        { label: computed(() => t().peaceOfferTalk), variant: 'default', onClick: () => (talk = true) },
        { label: computed(() => t().peaceOfferAccept), variant: 'play', hot: true, onClick: () => this.game.acceptPeace(from, deal) }
      ]
    });
  }

  /** The peace table with an enemy. */
  private openPeaceTable(enemy: number, deal: PeaceItem[]) {
    const name = () => this.game.name(enemy);
    this.popup.open({
      id: 'peace-table',
      title: computed(() => interpolate(this.i18n.t().peaceTitle, { name: name() })),
      subtitle: computed(() => this.i18n.t().peaceIntro),
      component: PeaceTableComponent,
      componentInputs: { enemy, initial: deal, close: () => this.popup.close() },
      size: 'lg',
      onClose: () => this.game.closeNotice()
    });
  }

  /** A dispatch from the front: what happened, where, and what it cost. */
  private openCampaign(r: CampaignReport) {
    const t = () => this.i18n.t();
    const lang = () => this.i18n.lang();
    const kind = () => t().campaignKinds[r.kind];
    this.popup.open({
      id: 'campaign',
      title: computed(() => kind().title),
      subtitle: computed(() => `${formatYear(r.year, t())} · ${interpolate(t().reportNear, { place: this.game.name(r.near) })}`),
      description: computed(() => {
        const lines = [interpolate(r.won ? kind().won : kind().lost, { name: this.game.name(r.enemy), place: this.game.name(r.near) })];
        const km2 = Math.round(r.cells * GREECE_MAP.cellKm * GREECE_MAP.cellKm);
        if (km2 > 0) lines.push(interpolate(r.won ? t().campaignGained : t().campaignLost, { n: formatNumber(km2, lang()) }));
        if (r.ownLosses || r.enemyLosses) {
          lines.push(interpolate(t().reportLossesValue, { e: formatNumber(r.enemyLosses, lang()), o: formatNumber(r.ownLosses, lang()) }));
        }
        if (r.gold) lines.push(interpolate(t().reportGoldValue, { n: formatNumber(r.gold, lang()) }));
        return lines.join(' ');
      }),
      size: 'sm',
      onClose: () => this.game.closeNotice(),
      actions: [{ label: computed(() => t().reportAction), variant: 'play', hot: true }]
    });
  }

  private openEmbassy(from: number) {
    const name = () => this.game.name(from);
    this.popup.open({
      id: 'embassy',
      title: computed(() => interpolate(this.i18n.t().embassyTitle, { name: name() })),
      subtitle: computed(() => this.i18n.t().embassySubtitle),
      template: this.letterTpl,
      size: 'sm',
      onClose: () => this.game.closeNotice(),
      actions: [
        {
          label: computed(() => this.i18n.t().embassyDecline),
          variant: 'default',
          onClick: () => this.game.declineAlliance(from)
        },
        {
          label: computed(() => this.i18n.t().embassyAccept),
          variant: 'play',
          hot: true,
          onClick: () => this.game.acceptAlliance(from)
        }
      ]
    });
  }

  /** The surveyors' report: what will rise in the countryside, and in how many months. */
  private openDevelopment(work: 'farm' | 'port' | 'vassal', months: number, site: SiteId | null) {
    const text = () => {
      const t = this.i18n.t();
      const m = formatPlural(months, t.monthsOne, t.monthsFew, t.monthsMany);
      const template = work === 'farm' ? t.developFarm : work === 'port' ? t.developPort : t.developVassal;
      return interpolate(template, { m, site: site ? t.siteNames[site] : '' });
    };
    this.popup.open({
      id: 'develop',
      title: computed(() => this.i18n.t().developTitle),
      description: computed(text),
      size: 'sm',
      onClose: () => this.game.closeNotice(),
      actions: [{ label: computed(() => this.i18n.t().developAction), variant: 'play', hot: true }]
    });
  }

  /** The walls are breached: the player decides the city's fate, which ends the war. */
  private openConquest(from: number) {
    const name = () => this.game.name(from);
    let decided = false;
    const decide = (choice: ConquestChoice) => () => {
      decided = true;
      this.game.resolveConquest(from, choice);
    };
    this.popup.open({
      id: 'conquest',
      title: computed(() => interpolate(this.i18n.t().conquestTitle, { name: name() })),
      subtitle: computed(() => this.i18n.t().conquestSubtitle),
      template: this.conquestTpl,
      size: 'md',
      onClose: () => {
        // Dismissing the dialog leaves the city subjugated.
        if (!decided) this.game.resolveConquest(from, 'subjugate');
        this.game.closeNotice();
      },
      actions: [
        { label: computed(() => this.i18n.t().conquestRaze), variant: 'play', hot: true, onClick: decide('raze') },
        { label: computed(() => this.i18n.t().conquestSubjugate), variant: 'play', hot: true, onClick: decide('subjugate') },
        { label: computed(() => this.i18n.t().conquestAlliance), variant: 'play', hot: true, onClick: decide('alliance') }
      ]
    });
  }

  /** Ten years in review: the clock stops while the player reads it (it can be switched off here). */
  private openDecade(report: DecadeReport) {
    const t = () => this.i18n.t();
    this.popup.open({
      id: 'decade',
      title: computed(() => interpolate(t().decTitle, { from: formatYear(report.fromYear, t()), to: formatYear(report.toYear, t()) })),
      subtitle: computed(() => t().decSubtitle),
      template: this.decadeTpl,
      size: 'sm',
      onClose: () => this.game.closeNotice(),
      actions: [
        { label: computed(() => t().decOff), variant: 'default', onClick: () => this.game.setDecadeReports(false) },
        { label: computed(() => t().decAction), variant: 'play', hot: true }
      ]
    });
  }

  /** The heralds of Elis proclaim the truce: the player decides how much to spend on the delegation. */
  /** The four purses on offer in the Olympic invitation (rendered in the popup body). */
  readonly inviteOptions = signal<{ key: 'olyStay' | 'olyModest' | 'olyGenerous' | 'olyLavish'; share: number; label: string }[]>([]);
  private inviteDecided = false;

  /** The player picks a purse for the delegation; the invitation closes. */
  chooseDelegation(share: number) {
    this.inviteDecided = true;
    this.game.sendDelegation(share);
    this.popup.close();
  }

  private openOlympicsInvite(olympiad: number, year: number, annualIncome: number, treasury: number) {
    const t = () => this.i18n.t();
    const lang = () => this.i18n.lang();
    this.inviteDecided = false;
    const label = (key: 'olyStay' | 'olyModest' | 'olyGenerous' | 'olyLavish', share: number) =>
      interpolate(t()[key], { p: Math.round(share * 100), d: formatNumber(Math.min(treasury, share * annualIncome), lang()) });
    this.inviteOptions.set(
      ([['olyStay', 0], ['olyModest', 0.1], ['olyGenerous', 0.25], ['olyLavish', 0.5]] as const).map(([key, share]) => ({
        key,
        share,
        label: label(key, share)
      }))
    );
    this.popup.open({
      id: 'olympics-invite',
      title: computed(() => interpolate(t().olyInviteTitle, { n: formatOrdinal(olympiad, lang()), year: formatYear(year, t()) })),
      description: computed(() => interpolate(t().olyInviteText, { name: this.game.name(this.game.player()) })),
      template: this.inviteTpl,
      size: 'sm',
      onClose: () => {
        // Closing without a word sends a modest team.
        if (!this.inviteDecided) this.game.sendDelegation(0.1);
        this.game.closeNotice();
      },
      actions: []
    });
  }

  /**
   * A warband has crossed into our land: pay it six months' income to plunder someone else, or
   * fight it in the name of Hellas. Closing the letter means fighting.
   */
  private openRaidChoice(band: number, tribe: number, men: number, cost: number, treasury: number) {
    const t = () => this.i18n.t();
    const lang = () => this.i18n.lang();
    const affordable = treasury >= cost;
    let answered = false;
    const answer = (choice: 'bribe' | 'fight') => () => {
      answered = true;
      this.game.answerRaid(band, choice);
    };
    this.popup.open({
      id: 'raid-choice',
      title: computed(() => interpolate(t().raidTitle, { name: this.game.name(tribe) })),
      description: computed(() =>
        interpolate(affordable ? t().raidText : t().raidTextPoor, {
          name: this.game.name(tribe),
          n: formatNumber(men, lang()),
          d: formatNumber(cost, lang())
        })
      ),
      size: 'sm',
      onClose: () => {
        if (!answered) this.game.answerRaid(band, 'fight');
        this.game.closeNotice();
      },
      actions: [
        ...(affordable
          ? [{ label: computed(() => interpolate(t().raidBribe, { d: formatNumber(cost, lang()) })), variant: 'default' as const, onClick: answer('bribe') }]
          : []),
        { label: computed(() => t().raidFight), variant: 'play' as const, hot: true, onClick: answer('fight') }
      ]
    });
  }

  /** A great work of the player's is finished. */
  private openGreatWork(id: GreatWorkId) {
    const t = () => this.i18n.t();
    this.popup.open({
      id: 'great-work',
      title: computed(() => interpolate(t().builtTitle, { name: t().greatWorks[id].name })),
      subtitle: computed(() => this.game.name(this.game.player())),
      description: computed(() => t().greatWorks[id].desc),
      size: 'sm',
      onClose: () => this.game.closeNotice(),
      actions: [{ label: computed(() => t().builtAction), variant: 'play', hot: true }]
    });
  }

  /** A building of the player's is finished. */
  private openBuilt(what: 'improvement' | 'farm' | 'port', id: ImprovementId | null) {
    const t = () => this.i18n.t();
    const name = () => (what === 'improvement' && id ? t().improvements[id].name : t().builtNames[what === 'farm' ? 'farm' : 'port']);
    this.popup.open({
      id: 'built',
      title: computed(() => interpolate(t().builtTitle, { name: name() })),
      subtitle: computed(() => this.game.name(this.game.player())),
      description: computed(() =>
        what === 'improvement' && id ? t().improvements[id].desc : t().builtTexts[what === 'farm' ? 'farm' : 'port']
      ),
      size: 'sm',
      onClose: () => this.game.closeNotice(),
      actions: [{ label: computed(() => t().builtAction), variant: 'play', hot: true }]
    });
  }

  /** A twist of fortune, read from the alerts row. */
  /**
   * A choice for the city, painted like a grand-strategy event: the scene, the story and one button per
   * answer with its consequences. Putting the letter aside takes the last answer.
   */
  private openDilemma(id: DilemmaId, year: number, choices: DilemmaChoice[]) {
    let answered = false;
    const choose = (option: string) => {
      answered = true;
      this.game.answerDilemma(option);
      this.popup.close();
    };
    this.popup.open({
      id: 'dilemma',
      title: computed(() => this.i18n.t().dilemmas[id].title),
      component: EventCardComponent,
      componentInputs: { id, year, choices, choose },
      size: 'md',
      onClose: () => {
        if (!answered) this.game.answerDilemma(choices[choices.length - 1]?.id ?? '');
        this.game.closeNotice();
      }
    });
  }

  private openFortune(f: Fortune) {
    const t = () => this.i18n.t();
    const story = () => (f.boon ? t().boons[f.branch] : t().banes[f.bane]);
    this.popup.open({
      id: 'fortune',
      title: computed(() => story().title),
      subtitle: computed(() => formatYear(f.year, t())),
      description: computed(() => {
        const amount = formatNumber(f.amount, this.i18n.lang());
        const effect = f.boon
          ? interpolate(t().fortuneGain, { d: amount, fund: t().budgetKeys[f.branch].name })
          : interpolate(t().fortuneLoss, { d: amount, m: fmt1(f.months, this.i18n.lang()) });
        return `${story().text} ${effect}`;
      }),
      size: 'sm',
      onClose: () => this.game.closeNotice(),
      actions: [{ label: computed(() => t().fortuneAction), variant: 'play', hot: true }]
    });
  }

  private openOlympicsReport(report: OlympicReport) {
    const t = () => this.i18n.t();
    this.popup.open({
      id: 'olympics',
      title: computed(() => interpolate(t().olyReportTitle, { n: formatOrdinal(report.olympiad, this.i18n.lang()), year: formatYear(report.year, t()) })),
      subtitle: computed(() => t().olyReportSubtitle),
      template: this.olympicsTpl,
      size: 'md',
      onClose: () => this.game.closeNotice(),
      actions: [{ label: computed(() => t().olyAction), variant: 'play', hot: true }]
    });
  }

  /** A new Hegemon of Hellas: the clock stops for the news. */
  private openHegemon(hegemon: number) {
    const mine = hegemon === this.game.sim.player;
    this.popup.open({
      id: 'hegemon',
      title: computed(() => (mine ? this.i18n.t().hegemonYouTitle : interpolate(this.i18n.t().hegemonTitle, { name: this.game.name(hegemon) }))),
      description: computed(() => (mine ? this.i18n.t().hegemonYouText : interpolate(this.i18n.t().hegemonText, { name: this.game.name(hegemon) }))),
      size: 'sm',
      onClose: () => this.game.closeNotice(),
      actions: [
        {
          label: computed(() => this.i18n.t().hegemonOpen),
          variant: 'default',
          onClick: () => (this.bp.mobile() ? this.hud.sheet.set('hegemony') : (this.hud.tab.set('hegemony'), this.hud.drawerOpen.set(true)))
        },
        { label: computed(() => this.i18n.t().hegemonAction), variant: 'play', hot: true }
      ]
    });
  }

  private openWarEnd(enemy: number, outcome: 'conquest' | 'peace', fate: FallOutcome | null) {
    const name = () => this.game.name(enemy);
    this.popup.open({
      id: 'war-end',
      title: computed(() => interpolate(this.i18n.t().warEndTitle, { name: name() })),
      subtitle: computed(() =>
        outcome === 'peace' ? this.i18n.t().warEndPeace : interpolate(this.fateText(fate), { name: name() })
      ),
      template: this.reportTpl,
      size: 'sm',
      onClose: () => this.game.closeNotice(),
      actions: [{ label: computed(() => this.i18n.t().warEndAction), variant: 'play', hot: true }]
    });
  }

  private fateText(fate: FallOutcome | null): string {
    const t = this.i18n.t();
    switch (fate) {
      case 'city':
        return t.warEndCity;
      case 'client':
        return t.warEndClient;
      case 'revolt':
        return t.warEndRevolt;
      case 'ransom':
        return t.warEndRansom;
      case 'alliance':
        return t.warEndAlliance;
      default:
        return t.warEndConquest;
    }
  }

  private openReport(near: number) {
    this.popup.open({
      id: 'battle-report',
      title: computed(() => this.i18n.t().reportTitle),
      subtitle: computed(() => interpolate(this.i18n.t().reportNear, { place: this.game.name(near) })),
      template: this.reportTpl,
      size: 'sm',
      onClose: () => this.game.closeNotice(),
      actions: [{ label: computed(() => this.i18n.t().reportAction), variant: 'play', hot: true }]
    });
  }

  private openEndPopup(status: 'won' | 'lost') {
    const sim = this.game.sim;
    const me = sim.poleis[sim.player];
    const name = (idx: number) => (idx >= 0 ? this.game.name(idx) : '');
    const won = status === 'won';
    this.popup.open({
      id: 'game-over',
      title: computed(() => (won ? this.i18n.t().victoryTitle : this.i18n.t().defeatTitle)),
      description: computed(() =>
        interpolate(won ? this.i18n.t().victoryDesc : this.i18n.t().defeatDesc, {
          a: name(me.idx),
          b: name(me.conqueror)
        })
      ),
      size: 'sm',
      actions: [
        { label: computed(() => this.i18n.t().close), variant: 'default' },
        { label: computed(() => this.i18n.t().playAgain), variant: 'play', hot: true, onClick: () => this.restart() }
      ]
    });
  }
}
