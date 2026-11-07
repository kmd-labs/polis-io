import { Component, computed, inject } from '@angular/core';
import {
  LucideAngularModule,
  Handshake,
  Crown,
  Hammer,
  Mail,
  Sparkles,
  Flame,
  Anchor,
  LucideIconData,
  PiggyBank,
  ScrollText,
  Sprout,
  Tent,
  Trophy,
  UserMinus, Swords } from 'lucide-angular';
import { BreakpointService, TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { formatEta, formatOrdinal, formatYear, interpolate } from '../core/i18n/format';
import { EMBASSY_TTL, GameService } from '../game/game.service';
import { RULES } from '../game/simulation';
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
    for (const band of this.game.sim.armies) {
      if (band.dead || band.raid !== me.idx || band.homeward) continue;
      out.push({ key: `raid-${band.id}`, icon: Flame, tone: 'danger', text: interpolate(t.alertRaid, { name: name(band.owner) }), act: () => this.game.focusRequest.set({ idx: me.idx }) });
    }
    for (const key of BUDGET_KEYS) {
      if (key === 'colonization' || me.purchases[key] !== null || me.greatWork) continue;
      out.push({
        key: `idle-${key}`,
        icon: PiggyBank,
        tone: 'warn',
        text: interpolate(t.alertFundIdle, { fund: t.budgetKeys[key].name }),
        act: budget
      });
    }

    if (me.blockadedBy >= 0) {
      out.push({ key: 'blockaded', icon: Anchor, tone: 'danger', text: interpolate(t.alertBlockaded, { name: name(me.blockadedBy) }), act: () => this.game.focus(me.blockadedBy) });
    }
    for (const q of all) {
      if (q.blockadedBy === me.idx) {
        out.push({ key: `blockading-${q.idx}`, icon: Anchor, tone: 'good', text: interpolate(t.alertBlockading, { name: name(q.idx) }), act: () => this.game.focus(q.idx) });
      }
    }
    for (const e of this.game.embassies()) {
      const left = formatEta(EMBASSY_TTL - (this.game.sim.time - e.time), RULES.secondsPerYear, t, this.i18n.lang());
      out.push({
        key: `embassy-${e.id}`,
        icon: Mail,
        tone: 'info',
        text: interpolate(t.alertEmbassy, { name: name(e.from), t: left }),
        act: () => this.game.openEmbassy(e.id)
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
            : n.kind === 'fortune'
              ? n.fortune.boon
                ? t.boons[n.fortune.branch].title
                : t.banes[n.fortune.bane].title
              : n.kind === 'campaign'
                ? interpolate(t.alertCampaign, { title: t.campaignKinds[n.report.kind].title, place: name(n.report.near) })
                : t.alertDevelop;
      out.push({
        key: `report-${r.id}`,
        icon:
          n.kind === 'victory'
            ? Trophy
            : n.kind === 'warEnd'
              ? ScrollText
              : n.kind === 'fortune'
                ? n.fortune.boon
                  ? Sparkles
                  : Flame
                : n.kind === 'campaign'
                  ? Swords
                  : Hammer,
        tone:
          n.kind === 'develop'
            ? 'info'
            : (n.kind === 'fortune' && !n.fortune.boon) || (n.kind === 'campaign' && !n.report.won)
              ? 'danger'
              : 'good',
        text: `${when} · ${text} — ${t.alertOpen}`,
        act: () => this.game.openReport(r.id)
      });
    }
    return out;
  });
}
