import { Injectable, effect, signal } from '@angular/core';
import { MapView } from '../game/map-renderer';

export type HudTab = 'budget' | 'polis' | 'diplomacy' | 'chronicle';
export const HUD_TABS: readonly HudTab[] = ['budget', 'polis', 'diplomacy', 'chronicle'];

/** Outliner groups that can be folded away one by one. */
export type OutlinerGroup = 'wars' | 'allies' | 'sieges' | 'chronicle';

interface Saved {
  drawer: boolean;
  tab: HudTab;
  outliner: boolean | null;
  folded: OutlinerGroup[];
}

const STORAGE_KEY = 'polis-io.hud';

/**
 * Which HUD panels are open, which drawer tab is showing and which map mode is on. Panel layout is
 * remembered per browser so the screen looks the same after a reload.
 */
@Injectable({ providedIn: 'root' })
export class HudStateService {
  readonly drawerOpen = signal(true);
  readonly tab = signal<HudTab>('budget');
  /** null = never set by the player: open on wide screens, folded on narrow ones. */
  readonly outlinerOpen = signal<boolean | null>(null);
  readonly folded = signal<OutlinerGroup[]>([]);
  readonly mapMode = signal<MapView>('political');
  /** Phones: the bottom sheet (drawer or outliner) is pulled up. Not remembered. */
  readonly sheet = signal<HudTab | 'outliner' | null>(null);

  constructor() {
    this.restore();
    effect(() => {
      const saved: Saved = { drawer: this.drawerOpen(), tab: this.tab(), outliner: this.outlinerOpen(), folded: this.folded() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch {
        // localStorage unavailable
      }
    });
  }

  /** Shows a tab; picking the tab that is already showing folds the drawer away. */
  toggleTab(tab: HudTab) {
    if (this.drawerOpen() && this.tab() === tab) {
      this.drawerOpen.set(false);
    } else {
      this.tab.set(tab);
      this.drawerOpen.set(true);
    }
  }

  toggleSheet(which: HudTab | 'outliner') {
    this.sheet.update(s => (s === which ? null : which));
  }

  toggleGroup(group: OutlinerGroup) {
    this.folded.update(f => (f.includes(group) ? f.filter(g => g !== group) : [...f, group]));
  }

  private restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Saved>;
      if (typeof saved.drawer === 'boolean') this.drawerOpen.set(saved.drawer);
      if (saved.tab && HUD_TABS.includes(saved.tab)) this.tab.set(saved.tab);
      if (typeof saved.outliner === 'boolean') this.outlinerOpen.set(saved.outliner);
      if (Array.isArray(saved.folded)) this.folded.set(saved.folded.filter(g => typeof g === 'string'));
    } catch {
      // Corrupt or unavailable storage: keep the defaults.
    }
  }
}
