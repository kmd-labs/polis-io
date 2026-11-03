import { Component, computed, effect, inject, output, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  LucideAngularModule,
  ChevronsLeft,
  ChevronsRight,
  Coins,
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
import { BudgetPanelComponent } from './budget-panel.component';
import { ChronicleComponent } from './chronicle.component';
import { DiplomacyListComponent } from './diplomacy-list.component';
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
    BudgetPanelComponent,
    PolisPanelComponent,
    PolisScreenComponent,
    DiplomacyListComponent,
    DiplomacyPanelComponent,
    ChronicleComponent,
    OutlinerComponent
  ],
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
    chronicle: ScrollText
  };

  readonly tabs = computed(() => {
    const t = this.i18n.t();
    return HUD_TABS.map(id => ({ id, icon: this.tabIcons[id], label: t.tabs[id], key: id === 'budget' ? 'B' : '' }));
  });

  readonly tabTitle = computed(() => this.i18n.t().tabs[this.hud.tab()]);

  readonly modes = computed(() => {
    const t = this.i18n.t();
    const modes: { id: MapView; icon: LucideIconData; label: string }[] = [
      { id: 'political', icon: Landmark, label: t.viewPolitical },
      { id: 'relief', icon: Mountain, label: t.viewRelief },
      { id: 'fertility', icon: Wheat, label: t.viewFertility },
      { id: 'relations', icon: HeartHandshake, label: t.viewRelations }
    ];
    return modes;
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
  }

  openSheet(which: HudTab | 'outliner') {
    this.game.select(-1);
    this.hud.toggleSheet(which);
  }
}
