import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { TooltipDirective } from '@kmd/design-system';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { GREECE_MAP } from '../game/data/greece-map';
import { RULES } from '../game/simulation';
import { PEACE_GOLD_MONTHS, PEACE_ITEMS, PeaceItem, PeaceItemKind } from '../game/war';
import { PolisFlagComponent } from './polis-flag.component';

const CELL_KM2 = GREECE_MAP.cellKm * GREECE_MAP.cellKm;

/**
 * The peace table, in the manner of Civilization: what each side puts on it — gold, land, an alliance,
 * clientship, a public humiliation — and whether the other side will accept, weighed as you go.
 */
@Component({
  selector: 'app-peace-table',
  standalone: true,
  imports: [TooltipDirective, PolisFlagComponent],
  templateUrl: './peace-table.component.html',
  styleUrl: './peace-table.component.scss'
})
export class PeaceTableComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly game = inject(GameService);

  readonly enemy = input.required<number>();
  /** Terms already on the table (e.g. an envoy's offer). */
  readonly initial = input<PeaceItem[]>([]);
  /** Called when peace is made, or when the player goes back to war. */
  readonly close = input.required<(peace: boolean) => void>();

  readonly deal = signal<PeaceItem[]>([]);
  readonly refused = signal(false);

  ngOnInit() {
    this.deal.set([...this.initial()]);
  }

  readonly sides = computed(() => {
    this.game.poleis();
    const t = this.i18n.t();
    const lang = this.i18n.lang();
    const me = this.game.player();
    const enemy = this.enemy();
    const deal = this.deal();
    return [me, enemy].map(from => {
      const to = from === me ? enemy : me;
      const rows = PEACE_ITEMS.map(kind => {
        const has = (level: number) => deal.some(i => i.kind === kind && i.from === from && i.level === level);
        const levels =
          kind === 'gold' || kind === 'land'
            ? [1, 2, 3].map(level => {
                const amount = this.game.sim.peaceAmount({ kind, from, level }, to);
                return {
                  level,
                  on: has(level),
                  disabled: amount <= 0,
                  label:
                    kind === 'gold'
                      ? interpolate(t.peaceGoldLevel, { d: formatNumber(amount, lang), m: PEACE_GOLD_MONTHS[level - 1] })
                      : interpolate(t.peaceLandLevel, { n: formatNumber(Math.round(amount * CELL_KM2), lang) })
                };
              })
            : [];
        const noLand = kind === 'land' && levels.every(l => l.disabled);
        return {
          kind,
          name: t.peaceItems[kind].name,
          hint: noLand ? t.peaceNoLand : t.peaceItems[kind].hint,
          levels,
          on: levels.length ? levels.some(l => l.on) : has(1),
          disabled: noLand
        };
      });
      return {
        from,
        title: from === me ? t.peaceWeGive : interpolate(t.peaceTheyGive, { name: this.game.name(from) }),
        rows
      };
    });
  });

  readonly verdict = computed(() => {
    this.game.poleis();
    const v = this.game.peaceVerdict(this.enemy(), this.deal());
    const t = this.i18n.t();
    // How close the deal is to what they need, on a gauge from far off to comfortably enough.
    const fill = Math.max(0.04, Math.min(1, 0.5 + (v.net - v.need) / 40));
    return { ...v, fill, text: v.accept ? t.peaceAccept : t.peaceRefuse };
  });

  /** The balance at the table: the fighting, shifted by how content each side's citizens are. */
  readonly score = computed(() => {
    this.game.poleis();
    const t = this.i18n.t();
    const s = Math.round(this.game.peaceBalance(this.enemy()));
    const war = Math.round(this.game.warScore(this.enemy()));
    const sim = this.game.sim;
    const mood = (idx: number) => Math.round(sim.poleis[idx]?.satisfaction ?? 0);
    return {
      value: (s > 0 ? '+' : '') + s,
      fill: (s + 100) / 2,
      note: interpolate(t.peaceMoodLine, {
        w: (war > 0 ? '+' : '') + war,
        a: mood(this.game.player()),
        b: mood(this.enemy()),
        name: this.game.name(this.enemy())
      })
    };
  });

  readonly years = computed(() => {
    this.game.poleis();
    const f = this.game.sim.front(this.game.player(), this.enemy());
    return f ? (this.game.sim.time - f.start) / RULES.secondsPerYear : 0;
  });

  toggle(kind: PeaceItemKind, from: number, level = 1) {
    this.refused.set(false);
    const deal = this.deal();
    const same = deal.find(i => i.kind === kind && i.from === from);
    const rest = deal.filter(i => !(i.kind === kind && i.from === from));
    this.deal.set(same && same.level === level ? rest : [...rest, { kind, from, level }]);
  }

  ask() {
    this.refused.set(false);
    this.deal.set(this.game.peaceDemand(this.enemy()));
  }

  white() {
    this.refused.set(false);
    this.deal.set([]);
  }

  propose() {
    if (this.game.proposePeace(this.enemy(), this.deal())) this.close()(true);
    else this.refused.set(true);
  }

  back() {
    this.close()(false);
  }
}
