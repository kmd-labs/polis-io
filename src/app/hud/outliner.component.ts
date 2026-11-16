import { Component, computed, inject } from '@angular/core';
import { LucideAngularModule, ChevronDown, Handshake, ScrollText, Swords, Tent, Coins, Star, Hourglass, Trophy } from 'lucide-angular';
import { TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { fmt1, formatEta, formatNumber, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { ChronicleComponent } from './chronicle.component';
import { HudStateService, OutlinerGroup } from './hud-state.service';
import { PolisFlagComponent } from './polis-flag.component';
import { AMBITION_BY_ID } from '../game/ambitions';
import { RULES } from '../game/simulation';
import { isOlympicYear } from '../game/olympics';

/**
 * The right-hand outliner: the player's wars (with a strength bar), allies, sieges and the latest
 * chronicle entries. Each group folds; clicking a city selects it and brings it into view.
 */
@Component({
  selector: 'app-outliner',
  standalone: true,
  imports: [LucideAngularModule, TooltipDirective, ChronicleComponent, PolisFlagComponent],
  templateUrl: './outliner.component.html',
  styleUrl: './outliner.component.scss'
})
export class OutlinerComponent {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);
  readonly hud = inject(HudStateService);

  readonly icons = { ChevronDown, Coins, Handshake, Hourglass, ScrollText, Star, Swords, Tent, Trophy };

  /** Each war with our share of the hoplites both sides can field (0–1). */
  readonly wars = computed(() => {
    const me = this.game.me();
    const all = this.game.poleis();
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    if (!me) return [];
    return me.wars.map(idx => {
      const foe = all[idx];
      const ours = me.warriors;
      const theirs = foe?.warriors ?? 0;
      return {
        idx,
        name: this.game.name(idx),
        def: this.game.sim.poleis[idx].def,
        // The balance of the war (−100…+100) as a share of the bar.
        advantage: (this.game.warScore(idx) + 100) / 200,
        hint: `${t.warScoreLabel}: ${Math.round(this.game.warScore(idx))} · ${interpolate(t.outAdvantageHint, { a: formatNumber(ours, lang), b: formatNumber(theirs, lang) })}`
      };
    });
  });

  /** The player's three ambitions, with their progress. */
  readonly ambitions = computed(() => {
    this.game.poleis();
    const sim = this.game.sim;
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const me = sim.poleis[this.game.player()];
    if (!me) return [];
    return sim.ambitions.map(a => {
      const def = AMBITION_BY_ID.get(a.id)!;
      const target = a.id === 'land' ? fmt1(a.target, lang) : formatNumber(Math.round(a.target), lang);
      return {
        id: a.id,
        name: t.ambitions[a.id].name,
        goal: interpolate(t.ambitions[a.id].goal, { t: target }),
        reward: interpolate(t.ambitionReward, { d: def.silver, p: fmt1(def.prestige, lang) }),
        progress: sim.ambitionProgress(me, a)
      };
    });
  });

  /** What is coming: the Games, the oracle, the next colony, war weariness, treaties ending, the scenario's end. */
  readonly horizon = computed(() => {
    this.game.poleis();
    const sim = this.game.sim;
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const me = sim.poleis[this.game.player()];
    if (!me) return [];
    const Y = RULES.secondsPerYear;
    const eta = (s: number) => formatEta(Math.max(0, s), Y, t, lang);
    const out: { key: string; label: string; when: string; soon: boolean }[] = [];
    if (sim.truce) out.push({ key: 'truce', label: t.horizon.truce, when: '', soon: true });
    else {
      // The next truce: two months before the Games of the next Olympic year.
      for (let year = sim.year; year > sim.year - 6; year--) {
        if (!isOlympicYear(year)) continue;
        const at = (RULES.startYear - year) * Y + ((RULES.gamesMonth - RULES.truceBefore) / 12) * Y;
        if (at <= sim.time) continue;
        out.push({ key: 'games', label: t.horizon.games, when: eta(at - sim.time), soon: at - sim.time < Y / 2 });
        break;
      }
    }
    const oracle = sim.oracleWait(me);
    out.push({ key: 'oracle', label: oracle > 0 ? t.horizon.oracle : t.horizon.oracleReady, when: oracle > 0 ? eta(oracle) : '', soon: oracle <= 0 });
    if (me.nextColonyAt > sim.time) out.push({ key: 'colony', label: t.horizon.colony, when: eta(me.nextColonyAt - sim.time), soon: false });
    for (const e of me.wars) {
      const f = sim.front(me.idx, e);
      if (!f) continue;
      const at = f.start + RULES.wearyYears * Y;
      if (at > sim.time) out.push({ key: `weary-${e}`, label: interpolate(t.horizon.weary, { name: this.game.name(e) }), when: eta(at - sim.time), soon: at - sim.time < Y });
    }
    for (const [idx, until] of me.treaties) {
      if (until > sim.time && sim.poleis[idx]?.alive) out.push({ key: `treaty-${idx}`, label: interpolate(t.horizon.treaty, { name: this.game.name(idx) }), when: eta(until - sim.time), soon: until - sim.time < Y });
    }
    if (sim.endYear) out.push({ key: 'end', label: t.horizon.end, when: eta((RULES.startYear - sim.endYear) * Y - sim.time), soon: false });
    return out;
  });

  /** Every neutral city: who holds sway over it (ours first). */
  readonly neutrals = computed(() => {
    const me = this.game.player();
    const t = this.i18n.t();
    return this.game
      .poleis()
      .filter(p => p.trader && p.alive)
      .map(p => ({
        idx: p.idx,
        name: this.game.name(p.idx),
        def: this.game.sim.poleis[p.idx].def,
        patron: p.patron,
        patronDef: p.patron >= 0 ? this.game.sim.poleis[p.patron].def : null,
        patronName: p.patron >= 0 ? this.game.name(p.patron) : '',
        kind: p.patronKind,
        mine: p.patron === me,
        hint: p.patron < 0 ? t.swayNone : interpolate(p.patronKind === 'tribute' ? t.swayTributeTo : t.swayAweOf, { name: this.game.name(p.patron) })
      }))
      .sort((a, b) => Number(b.mine) - Number(a.mine) || a.name.localeCompare(b.name));
  });

  readonly mineCount = computed(() => this.neutrals().filter(n => n.mine).length);

  readonly allies = computed(() => {
    const me = this.game.me();
    this.i18n.t();
    return (me?.allies ?? []).map(idx => ({ idx, name: this.game.name(idx), def: this.game.sim.poleis[idx].def }));
  });

  /** Sieges the player is part of: our armies before enemy walls, or enemies before ours or an ally's. */
  readonly sieges = computed(() => {
    const me = this.game.me();
    this.game.poleis();
    const t = this.i18n.t();
    if (!me) return [];
    const friends = new Set([me.idx, ...me.allies]);
    const seen = new Set<string>();
    const out: { key: string; city: number; text: string; ours: boolean }[] = [];
    for (const a of this.game.sim.armies) {
      if (a.dead || a.siege < 0) continue;
      const ours = a.owner === me.idx;
      if (!ours && !friends.has(a.siege)) continue;
      const key = `${a.owner}-${a.siege}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        key,
        city: a.siege,
        ours,
        text: interpolate(ours ? t.outSiegeOurs : t.outSiegeTheirs, { a: this.game.name(a.owner), b: this.game.name(a.siege) })
      });
    }
    return out;
  });

  folded(group: OutlinerGroup): boolean {
    return this.hud.folded().includes(group);
  }
}
