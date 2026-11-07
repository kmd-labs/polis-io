import { Component, computed, inject, input } from '@angular/core';
import { LucideAngularModule, ScrollText } from 'lucide-angular';
import { I18nService } from '../core/i18n/i18n.service';
import { formatNumber, formatOrdinal, formatPlural, formatYear, interpolate } from '../core/i18n/format';
import { GameService } from '../game/game.service';
import { GameEventKind } from '../game/simulation';
import { ImprovementId } from '../game/data/improvements';
import { HegemonyCategory } from '../game/hegemony';
import { GreatWorkId } from '../game/data/frontier';
import { DilemmaId, WorldNoteId } from '../game/data/dilemmas';
import { CampaignKind, PeaceItemKind } from '../game/war';

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
  olympics: 'evOlympics',
  raid: 'evRaid',
  raidRepelled: 'evRaidRepelled',
  raidBribed: 'evRaidBribed',
  raidStand: 'evRaidStand',
  greatWork: 'evGreatWork',
  dilemma: 'evDilemma',
  world: 'evWorld',
  campaign: 'evCampaign',
  treaty: 'evTreaty',
  peaceBought: 'evPeaceBought'
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
        if (['siege', 'navalBattle', 'blockade', 'raid', 'raidRepelled', 'raidBribed', 'raidStand'].includes(e.kind)) return e.a === player || e.b === player;
        // From the fronts: the player's own fighting, and the great battles and fallen walls of Hellas.
        if (e.kind === 'campaign') return e.a === player || e.b === player || e.tag === 'battle' || e.tag === 'assault';
        if (['settle', 'colony', 'farm', 'port', 'festival', 'farmPlanned', 'portPlanned', 'built', 'mercenaries', 'warship', 'greatWork', 'dilemma'].includes(e.kind)) return e.a === player;
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
                : e.kind === 'greatWork' && e.tag
                  ? (t.greatWorks[e.tag as GreatWorkId]?.name ?? '')
                  : e.kind === 'world' && e.tag
                    ? (t.worldNotes[e.tag as WorldNoteId] ?? '')
                    : e.kind === 'dilemma' && e.tag
                      ? this.dilemmaLine(e.tag)
                      : e.kind === 'campaign' && e.tag
                        ? interpolate(t.campaignKinds[e.tag as CampaignKind]?.line ?? '', { a: name(e.a), b: name(e.b), w: name(e.n ?? -1) })
                        : e.kind === 'treaty'
                          ? this.treatyTerms(e.tag ?? '')
                          : ''
        }),
        mine: e.a === player || e.b === player,
        world: e.kind === 'world',
        hostile:
          (['war', 'fall', 'siege', 'client', 'annexed', 'revolt', 'blockade', 'navalBattle', 'raid'].includes(e.kind) && e.a !== player) ||
          (e.kind === 'campaign' && e.b === player)
      }));
  });

  /** "Title — answer" for a choice the player made. */
  private dilemmaLine(tag: string): string {
    const [id, option] = tag.split('.') as [DilemmaId, string];
    const text = this.i18n.t().dilemmas[id];
    return text ? `${text.title} — ${text.options[option] ?? ''}` : '';
  }

  /** " — Sparta: gold, land" for a treaty's terms, or " — white peace". */
  private treatyTerms(tag: string): string {
    const t = this.i18n.t();
    if (!tag) return ` — ${t.peaceWhite.toLowerCase()}`;
    const terms = tag.split(',').map(part => {
      const [kind, , from] = part.split(':');
      return `${this.game.name(Number(from))}: ${t.peaceItems[kind as PeaceItemKind]?.name.toLowerCase() ?? ''}`;
    });
    return ` — ${terms.join(', ')}`;
  }
}
