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
import { fmt1, formatNumber, formatPlural, formatYear, formatYears, interpolate } from './core/i18n/format';
import { GameService } from './game/game.service';
import { MapCanvasComponent } from './game/map-canvas.component';
import { MapView } from './game/map-renderer';
import { ConquestChoice, FallOutcome } from './game/simulation';
import { SiteId } from './game/data/poleis';
import { StartScreenComponent } from './hud/start-screen.component';
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
  readonly hud = inject(HudStateService);

  @ViewChild(MapCanvasComponent) private map?: MapCanvasComponent;
  @ViewChild('rulesTpl', { static: true }) private rulesTpl!: TemplateRef<unknown>;
  @ViewChild('letterTpl', { static: true }) private letterTpl!: TemplateRef<unknown>;
  @ViewChild('reportTpl', { static: true }) private reportTpl!: TemplateRef<unknown>;
  @ViewChild('conquestTpl', { static: true }) private conquestTpl!: TemplateRef<unknown>;

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
        else this.openReport(n.near);
      });
    });

    // Announce the end of the game once.
    effect(() => {
      const status = this.game.status();
      if (status === 'won' || status === 'lost') untracked(() => this.openEndPopup(status));
    });
  }

  /** Space pauses, 1–5 set the speed, B opens the budget, Esc folds the drawer. */
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
    this.popup.open({
      id: 'war-letter',
      title: computed(() => interpolate(this.i18n.t().letterTitle, { name: name() })),
      subtitle: computed(() => interpolate(this.i18n.t().letterDeclares, { name: name() })),
      template: this.letterTpl,
      size: 'sm',
      onClose: () => this.game.closeNotice(),
      actions: [{ label: computed(() => this.i18n.t().letterAction), variant: 'play', hot: true }]
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
