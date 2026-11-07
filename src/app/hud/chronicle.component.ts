import { Component, computed, inject, input } from '@angular/core';
import { LucideAngularModule, ScrollText } from 'lucide-angular';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber, formatOrdinal, formatPlural, formatYear, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { GameEventKind } from '../game/simulation';
import { ImprovementId } from '../game/data/improvements';
import { HegemonyCategory } from '../game/hegemony';

const TEMPLATE_KEY = {
  war: 'evWar',
  peace: 'evPeace',
  peaceRefused: 'evPeaceRefused',
  settle: 'evSettle',
  colony: 'evColony',
  fall: 'evFall',
  farm: 'evFarm',
  port: 'evPort',
  vassal: 'evVassal',
  alliance: 'evAlliance',
  allianceOffer: 'evAllianceOffer',
  siege: 'evSiege',
  client: 'evClient',
  annexed: 'evAnnexed',
  secession: 'evSecession',
  captured: 'evCaptured',
  revolt: 'evRevolt',
  ransom: 'evRansom',
  festival: 'evFestival',
  farmPlanned: 'evFarmPlanned',
  portPlanned: 'evPortPlanned',
  built: 'evBuilt',
  podium: 'evPodium',
  hegemon: 'evHegemon',
  coalition: 'evCoalition',
  coalitionEnd: 'evCoalitionEnd',
  mercenaries: 'evMercenaries',
  warship: 'evWarship',
  navalBattle: 'evNavalBattle',
  blockade: 'evBlockade',
  truce: 'evTruce',
  truceEnd: 'evTruceEnd',
  olympics: 'evOlympics'
} as const satisfies Record<GameEventKind, string>;

/** Feed of the latest wars, treaties, colonies and conquests: a few lines in the outliner, the full record in the drawer. */
@Component({
  selector: 'app-chronicle',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './chronicle.component.html',
  styleUrl: './chronicle.component.scss'
})
export class ChronicleComponent {
  readonly i18n = inject(I18nService);
  private readonly game = inject(GameService);

  /** How many of the latest entries to show. */
  readonly limit = input(5);
  /** Draw its own glass panel and heading, or sit bare inside another panel. */
  readonly framed = input(true);

  readonly scrollIcon = ScrollText;

  readonly entries = computed(() => {
    const t = this.i18n.t();
    const player = this.game.player();
    const name = (idx: number) => (idx >= 0 ? this.game.name(idx) : '');
    const limit = this.limit();
    return this.game
      .events()
      // Other poleis' settling and building are routine; only the player's own projects are news.
      .filter(e => {
        // Sieges and the war at sea are news when they touch the player; their own hiring and building likewise.
        if (['siege', 'navalBattle', 'blockade'].includes(e.kind)) return e.a === player || e.b === player;
        if (['settle', 'colony', 'farm', 'port', 'festival', 'farmPlanned', 'portPlanned', 'built', 'mercenaries', 'warship'].includes(e.kind)) return e.a === player;
        return e.kind !== 'allianceOffer';
      })
      .slice(-limit)
      .reverse()
      .map(e => ({
        id: e.id,
        year: formatYear(e.year, t),
        text: interpolate(t[TEMPLATE_KEY[e.kind]], {
          a: name(e.a),
          b: name(e.b),
          m: e.n ? formatPlural(e.n, t.monthsOne, t.monthsFew, t.monthsMany) : '',
          n: e.n ? (e.kind === 'truce' ? formatOrdinal(e.n, this.i18n.lang()) : formatNumber(e.n, this.i18n.lang())) : '',
          w:
            e.kind === 'built' && e.tag
              ? (t.improvements[e.tag as ImprovementId]?.name ?? '')
              : e.kind === 'podium' && e.tag
                ? (t.hegemonyCats[e.tag as HegemonyCategory]?.name ?? '')
                : ''
        }),
        mine: e.a === player || e.b === player,
        hostile: ['war', 'fall', 'siege', 'client', 'annexed', 'revolt', 'blockade', 'navalBattle'].includes(e.kind) && e.a !== player
      }));
  });
}
