import { Component, computed, inject } from '@angular/core';
import {
  LucideAngularModule,
  Handshake,
  Crown,
  Hammer,
  LucideIconData,
  PiggyBank,
  ScrollText,
  Sprout,
  Tent,
  Trophy,
  UserMinus
} from 'lucide-angular';
import { BreakpointService, TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { formatOrdinal, formatYear, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { BUDGET_KEYS } from '../game/simulation';
import { HudStateService } from './hud-state.service';

interface Alert {
  key: string;
  icon: LucideIconData;
  tone: 'danger' | 'warn' | 'info' | 'good';
  text: string;
  act: () => void;
}

/**
 * The row of round alerts under the top bar: standing problems (a siege, unpaid hoplites, an idle
 * fund…) and reports waiting to be read. Nothing here stops the game; the player clicks when ready.
 */
@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [LucideAngularModule, TooltipDirective],
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.scss'
})
export class AlertsComponent {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);
  private readonly hud = inject(HudStateService);
  private readonly bp = inject(BreakpointService);

  readonly alerts = computed<Alert[]>(() => {
    const me = this.game.me();
    const all = this.game.poleis();
    const t = this.i18n.t();
    if (!me || this.game.status() !== 'playing') return [];
    const name = (idx: number) => this.game.name(idx);
    const budget = () => (this.bp.mobile() ? this.hud.sheet.set('budget') : (this.hud.tab.set('budget'), this.hud.drawerOpen.set(true)));
    const out: Alert[] = [];

    if (me.besieged) {
      out.push({ key: 'siege', icon: Tent, tone: 'danger', text: t.alertSiege, act: () => this.game.focus(me.idx) });
    }
    for (const idx of me.allies) {
      if (all[idx]?.besieged) {
        out.push({ key: `siege-${idx}`, icon: Tent, tone: 'warn', text: interpolate(t.alertSiegeAlly, { name: name(idx) }), act: () => this.game.focus(idx) });
      }
    }
    if (me.unpaid) {
      out.push({ key: 'unpaid', icon: UserMinus, tone: 'danger', text: t.alertDeserting, act: budget });
    }
    const fighting = me.allies.filter(idx => all[idx]?.wars.length);
    if (fighting.length) {
      out.push({
        key: 'allies',
        icon: Handshake,
        tone: 'info',
        text: interpolate(t.alertAllyWar, { names: fighting.map(name).join(', ') }),
        act: () => this.game.focus(fighting[0])
      });
    }
    if (me.colonyBlocked) {
      out.push({ key: 'colony', icon: Sprout, tone: 'warn', text: t.alertColonyBlocked, act: budget });
    }
    for (const key of BUDGET_KEYS) {
      if (key === 'colonization' || me.purchases[key] !== null) continue;
      out.push({
        key: `idle-${key}`,
        icon: PiggyBank,
        tone: 'warn',
        text: interpolate(t.alertFundIdle, { fund: t.budgetKeys[key].name }),
        act: budget
      });
    }

    if (this.game.hegemony() && this.game.sim.coalitionTarget === me.idx) {
      out.push({ key: 'coalition', icon: Crown, tone: 'danger', text: t.alertCoalition, act: () => (this.bp.mobile() ? this.hud.sheet.set('hegemony') : (this.hud.tab.set('hegemony'), this.hud.drawerOpen.set(true))) });
    }
    const hegemonyTab = () => (this.bp.mobile() ? this.hud.sheet.set('hegemony') : (this.hud.tab.set('hegemony'), this.hud.drawerOpen.set(true)));
    for (const n of this.game.podiumNews()) {
      const cat = t.hegemonyCats[n.category].name;
      const place = formatOrdinal(n.place, this.i18n.lang());
      const text = !n.place
        ? interpolate(t.podOff, { cat })
        : n.place < n.was || !n.was
          ? interpolate(t.podUp, { cat, place })
          : n.by >= 0
            ? interpolate(t.podDown, { cat, place, name: name(n.by) })
            : interpolate(t.podUp, { cat, place });
      out.push({
        key: `podium-${n.id}`,
        icon: Crown,
        tone: n.place && (n.place < n.was || !n.was) ? 'good' : 'warn',
        text: `${formatYear(n.year, t)} · ${text}`,
        act: () => {
          this.game.dismissPodiumNews(n.id);
          hegemonyTab();
        }
      });
    }

    for (const r of this.game.reports()) {
      const n = r.notice;
      const when = formatYear(r.year, t);
      const text =
        n.kind === 'victory'
          ? interpolate(t.alertVictory, { place: name(n.near) })
          : n.kind === 'warEnd'
            ? interpolate(t.alertWarEnd, { name: name(n.enemy) })
            : t.alertDevelop;
      out.push({
        key: `report-${r.id}`,
        icon: n.kind === 'victory' ? Trophy : n.kind === 'warEnd' ? ScrollText : Hammer,
        tone: n.kind === 'develop' ? 'info' : 'good',
        text: `${when} · ${text} — ${t.alertOpen}`,
        act: () => this.game.openReport(r.id)
      });
    }
    return out;
  });
}
