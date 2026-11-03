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
  Swords
} from 'lucide-angular';
import {
  BrandComponent,
  ButtonComponent,
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
import { formatNumber, formatYear, interpolate } from './core/i18n/format';
import { GameService } from './game/game.service';
import { MapCanvasComponent } from './game/map-canvas.component';
import { MapView } from './game/map-renderer';
import { PolisPanelComponent } from './hud/polis-panel.component';
import { DiplomacyPanelComponent } from './hud/diplomacy-panel.component';
import { ChronicleComponent } from './hud/chronicle.component';
import { StartScreenComponent } from './hud/start-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    BrandComponent,
    ButtonComponent,
    DropdownComponent,
    PopupComponent,
    SplashComponent,
    TooltipComponent,
    MapCanvasComponent,
    PolisPanelComponent,
    DiplomacyPanelComponent,
    ChronicleComponent,
    StartScreenComponent
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

  @ViewChild(MapCanvasComponent) private map?: MapCanvasComponent;
  @ViewChild('rulesTpl', { static: true }) private rulesTpl!: TemplateRef<unknown>;
  @ViewChild('letterTpl', { static: true }) private letterTpl!: TemplateRef<unknown>;
  @ViewChild('reportTpl', { static: true }) private reportTpl!: TemplateRef<unknown>;

  /** The open victory report, localized. */
  readonly reportView = computed(() => {
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
          value: interpolate(t.reportPrestigeValue, { n: num(n.prestige), t: num(n.totalPrestige) })
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
        text: interpolate(t.embassyText, { name }),
        color: this.game.sim.poleis[n.from].def.color
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
      color: def.color
    };
  });

  readonly icons = { Globe, BookOpen, Play, Pause, FastForward, Maximize, RotateCcw, Coins, Pickaxe, Flag, Swords };

  readonly currentView = signal<MapView>('political');

  readonly langOptions = computed<DropdownOption<Lang>[]>(() =>
    this.i18n.langs.map(l => ({
      value: l,
      label: this.i18n.dicts[l].langName,
      shortLabel: l.toUpperCase(),
      badge: l.toUpperCase()
    }))
  );

  readonly viewOptions = computed<DropdownOption<MapView>[]>(() => {
    const t = this.i18n.t();
    return [
      { value: 'political', label: t.viewPolitical, icon: Landmark },
      { value: 'relief', label: t.viewRelief, icon: Mountain },
      { value: 'fertility', label: t.viewFertility, icon: Wheat }
    ];
  });

  readonly currentViewIcon = computed(
    () => this.viewOptions().find(o => o.value === this.currentView())?.icon ?? Landmark
  );

  readonly isPopupOpen = computed(() => this.popup.config() !== null);
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
        else this.openReport(n.near);
      });
    });

    // Announce the end of the game once.
    effect(() => {
      const status = this.game.status();
      if (status === 'won' || status === 'lost') untracked(() => this.openEndPopup(status));
    });
  }

  @HostListener('document:keydown.space', ['$event'])
  onSpace(event: Event) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, input, textarea, [role="listbox"]') || this.game.status() !== 'playing') return;
    event.preventDefault();
    this.game.togglePause();
  }

  fitMap() {
    this.map?.fit(true);
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
