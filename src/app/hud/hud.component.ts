import { Component, computed, effect, inject, output, signal, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  LucideAngularModule,
  ChevronsLeft,
  ChevronsRight,
  Coins,
  Crown,
  Compass,
  Handshake,
  HeartHandshake,
  Landmark,
  LucideIconData,
  Maximize,
  Mountain,
  PanelRightClose,
  PanelRightOpen,
  ScrollText,
  Wheat,
  X
} from 'lucide-angular';
import { BreakpointService, TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { GameService } from '../game/game.service';
import { MapView } from '../game/map-renderer';
import { AlertsComponent } from './alerts.component';
import { OracleEntryComponent } from './oracle-entry.component';
import { CodexComponent } from './codex.component';
import { BudgetPanelComponent } from './budget-panel.component';
import { ChronicleComponent } from './chronicle.component';
import { DiplomacyListComponent } from './diplomacy-list.component';
import { HistoryChartsComponent } from './history-charts.component';
import { HegemonyPanelComponent } from './hegemony-panel.component';
import { GreatWorksComponent } from './great-works.component';
import { DiplomacyPanelComponent } from './diplomacy-panel.component';
import { HUD_TABS, HudStateService, HudTab } from './hud-state.service';
import { OutlinerComponent } from './outliner.component';
import { PolisPanelComponent } from './polis-panel.component';
import { PolisScreenComponent } from './polis-screen.component';
import { TopBarComponent } from './top-bar.component';

/**
 * The in-game HUD, laid out on the edges of the map like a grand-strategy game: resource bar on top,
 * a tabbed drawer on the left, the outliner on the right, map modes bottom-right and the card of the
 * selected foreign city bottom-left. The middle stays clear (and click-through) for the map.
 * On phones the drawer and outliner become a bottom sheet behind a tab bar.
 */
@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    LucideAngularModule,
    TooltipDirective,
    TopBarComponent,
    AlertsComponent,
    BudgetPanelComponent,
    PolisPanelComponent,
    PolisScreenComponent,
    DiplomacyListComponent,
    HistoryChartsComponent,
    HegemonyPanelComponent,
    GreatWorksComponent,
    DiplomacyPanelComponent,
    ChronicleComponent,
    OutlinerComponent, OracleEntryComponent, CodexComponent],
  templateUrl: './hud.component.html',
  styleUrl: './hud.component.scss'
})
export class HudComponent {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);
  readonly bp = inject(BreakpointService);
  readonly hud = inject(HudStateService);

  readonly help = output<void>();
  readonly restart = output<void>();
  readonly fit = output<void>();
  /** Panels opened or folded: the map may re-frame itself around them. */
  readonly layoutChange = output<void>();

  readonly icons = { ChevronsLeft, ChevronsRight, Compass, Maximize, PanelRightClose, PanelRightOpen, X };

  private readonly tabIcons: Record<HudTab, LucideIconData> = {
    budget: Coins,
    polis: Landmark,
    diplomacy: Handshake,
    hegemony: Crown,
    chronicle: ScrollText
  };

  readonly tabs = computed(() => {
    const t = this.i18n.t();
    return HUD_TABS.map(id => ({
      id,
      icon: this.tabIcons[id],
      label: t.tabs[id],
      short: t.tabsShort[id],
      key: id === 'budget' ? 'B' : id === 'hegemony' ? 'H' : ''
    }));
  });

  readonly tabTitle = computed(() => this.i18n.t().tabs[this.hud.tab()]);

  readonly modes = computed(() => {
    const t = this.i18n.t();
    const modes: { id: MapView; icon: LucideIconData; label: string }[] = [
      { id: 'political', icon: Landmark, label: t.viewPolitical },
      { id: 'relief', icon: Mountain, label: t.viewRelief },
      { id: 'fertility', icon: Wheat, label: t.viewFertility },
      { id: 'relations', icon: HeartHandshake, label: t.viewRelations },
      { id: 'hegemony', icon: Crown, label: t.viewHegemony },
      { id: 'influence', icon: Coins, label: t.viewInfluence }
    ];
    return modes;
  });

  /** Phones: the list of map modes behind the single mode button, and a sheet pulled up to full height. */
  readonly modesOpen = signal(false);
  readonly sheetTall = signal(false);

  readonly currentMode = computed(() => this.modes().find(m => m.id === this.hud.mapMode()) ?? this.modes()[0]);

  /** What the colours of the current map mode mean. */
  readonly legend = computed(() => {
    const t = this.i18n.t();
    const L = t.legend;
    const v = (name: string) => `var(--color-${name})`;
    switch (this.hud.mapMode()) {
      case 'relations':
        return [
          { swatch: v('danger-700'), label: L.relations.hostile },
          { swatch: v('neutral-300'), label: L.relations.neutral },
          { swatch: v('success-400'), label: L.relations.friendly },
          { swatch: v('success-700'), label: L.relations.ally }
        ];
      case 'hegemony':
        return [
          { swatch: v('warning-400'), label: L.hegemony.first },
          { swatch: v('neutral-400'), label: L.hegemony.second },
          { swatch: v('warning-700'), label: L.hegemony.third },
          { swatch: v('neutral-200'), label: L.hegemony.rest }
        ];
      case 'influence':
        return [
          { swatch: `repeating-linear-gradient(135deg, ${v('primary-600')} 0 3px, ${v('primary-200')} 3px 6px)`, label: L.influence.tribute },
          { swatch: v('primary-400'), label: L.influence.awe },
          { swatch: v('warning-200'), label: L.influence.free }
        ];
      case 'fertility':
        return [
          { swatch: v('neutral-200'), label: L.fertility.poor },
          { swatch: v('success-600'), label: L.fertility.rich }
        ];
      default:
        return null;
    }
  });

  /** Unless the player chose, the outliner starts folded on narrow screens. */
  readonly outlinerOpen = computed(() => this.hud.outlinerOpen() ?? !this.bp.tablet());

  readonly sheetTitle = computed(() => {
    const s = this.hud.sheet();
    const t = this.i18n.t();
    return s === 'outliner' ? t.outlinerTitle : s ? t.tabs[s] : '';
  });

  constructor() {
    effect(() => {
      this.hud.drawerOpen();
      this.outlinerOpen();
      this.bp.mobile();
      untracked(() => this.layoutChange.emit());
    });

    // Phones: a sheet coming up moves the camera so the player's city stays in sight above it.
    effect(() => {
      const sheet = this.hud.sheet();
      this.sheetTall();
      if (!sheet || !this.bp.mobile()) return;
      untracked(() => setTimeout(() => this.game.centre(this.game.player()), 120));
    });

    // Phones: picking a city on the map swaps the sheet for that city's card.
    effect(() => {
      if (this.game.target() && this.bp.mobile()) untracked(() => this.hud.sheet.set(null));
    });
  }

  toggleOutliner() {
    this.hud.outlinerOpen.set(!this.outlinerOpen());
  }

  setMode(mode: MapView) {
    this.hud.mapMode.set(mode);
    this.modesOpen.set(false);
  }

  openSheet(which: HudTab | 'outliner') {
    this.game.select(-1);
    this.hud.toggleSheet(which);
  }
}
