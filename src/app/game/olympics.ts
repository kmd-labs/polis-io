/**
 * The Olympic Games: the historical programme (each contest with the Olympiad it joined and, for
 * those dropped, the last one it was held at) and a framework-free contest between the delegations.
 */

export type OlympicKind = 'race' | 'combat' | 'pentathlon' | 'armour' | 'equestrian' | 'music';

export interface OlympicEvent {
  id: string;
  kind: OlympicKind;
  /** First year held (BC), and the last for contests later dropped. */
  from: number;
  until?: number;
}

/** After the Olympic Register (Hippias, Eusebius): when each contest entered the programme. */
export const OLYMPIC_EVENTS: readonly OlympicEvent[] = [
  { id: 'stadion', kind: 'race', from: 776 },
  { id: 'diaulos', kind: 'race', from: 724 },
  { id: 'dolichos', kind: 'race', from: 720 },
  { id: 'pentathlon', kind: 'pentathlon', from: 708 },
  { id: 'pale', kind: 'combat', from: 708 },
  { id: 'pygme', kind: 'combat', from: 688 },
  { id: 'tethrippon', kind: 'equestrian', from: 680 },
  { id: 'pankration', kind: 'combat', from: 648 },
  { id: 'keles', kind: 'equestrian', from: 648 },
  { id: 'paidesStadion', kind: 'race', from: 632 },
  { id: 'paidesPale', kind: 'combat', from: 632 },
  { id: 'paidesPygme', kind: 'combat', from: 616 },
  { id: 'hoplitodromos', kind: 'armour', from: 520 },
  { id: 'apene', kind: 'equestrian', from: 500, until: 444 },
  { id: 'kalpe', kind: 'equestrian', from: 496, until: 444 },
  { id: 'synoris', kind: 'equestrian', from: 408 },
  { id: 'kerykes', kind: 'music', from: 396 },
  { id: 'salpinktai', kind: 'music', from: 396 },
  { id: 'tethripponPolon', kind: 'equestrian', from: 384 },
  { id: 'synorisPolon', kind: 'equestrian', from: 268 },
  { id: 'kelesPolon', kind: 'equestrian', from: 256 },
  { id: 'paidesPankration', kind: 'combat', from: 200 }
];

/** The first Olympiad was held in 776 BC; the Games came round every fourth year. */
export const FIRST_OLYMPIAD = 776;

export function isOlympicYear(year: number): boolean {
  return (((FIRST_OLYMPIAD - year) % 4) + 4) % 4 === 0;
}

/** Number of the Olympiad held in a given year (776 BC = 1st). */
export function olympiadOf(year: number): number {
  return Math.floor((FIRST_OLYMPIAD - year) / 4) + 1;
}

/** The programme of the Games held in a given year (BC; negative years are AD). */
export function eventsOf(year: number): OlympicEvent[] {
  return OLYMPIC_EVENTS.filter(e => year <= e.from && (e.until === undefined || year >= e.until));
}

/** One city's delegation, as the contest sees it. */
export interface Delegation {
  idx: number;
  population: number;
  /** Drachmae a year (the wealth behind chariot teams). */
  annualIncome: number;
  militarism: number;
  culture: number;
  /** Drachmae spent on the delegation, and that as a share of the city's yearly income. */
  spent: number;
  share: number;
}

export interface OlympicResults {
  year: number;
  olympiad: number;
  /** Winner of every contest, in programme order. */
  winners: { event: string; idx: number }[];
  /** Olive wreaths per city (only cities that sent a delegation are listed), best first. */
  table: { idx: number; wreaths: number; spent: number }[];
}

/** How much a delegation's purse multiplies its chances: diminishing returns on a share of the year. */
export function spendFactor(share: number): number {
  return 1 + 1.2 * Math.sqrt(Math.max(0, share));
}

/** A city's strength in one kind of contest, before luck. */
export function contestStrength(d: Delegation, kind: OlympicKind): number {
  const athletes = Math.pow(Math.max(1, d.population) / 10000, 0.4);
  const base =
    kind === 'equestrian'
      ? // Chariots and horses belong to the rich.
        Math.pow(Math.max(1, d.annualIncome) / 100, 0.5)
      : kind === 'combat' || kind === 'armour'
        ? athletes * (1 + 0.1 * d.militarism)
        : kind === 'music'
          ? athletes * (1 + 0.15 * d.culture)
          : athletes * (1 + 0.04 * d.culture);
  return base * spendFactor(d.share);
}

/**
 * Holds the Games: in every contest each delegation's strength is shaken by luck (a log-normal
 * factor) and the strongest takes the olive wreath — the Greeks gave no second prizes.
 */
export function holdGames(year: number, delegations: Delegation[], rand: () => number): OlympicResults {
  const gauss = () => {
    const u = Math.max(1e-9, rand());
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const wreaths = new Map(delegations.map(d => [d.idx, 0]));
  const winners: OlympicResults['winners'] = [];
  for (const event of eventsOf(year)) {
    let best = -1;
    let bestScore = -Infinity;
    for (const d of delegations) {
      const score = contestStrength(d, event.kind) * Math.exp(0.5 * gauss());
      if (score > bestScore) {
        bestScore = score;
        best = d.idx;
      }
    }
    if (best < 0) continue;
    winners.push({ event: event.id, idx: best });
    wreaths.set(best, (wreaths.get(best) ?? 0) + 1);
  }
  const table = delegations
    .map(d => ({ idx: d.idx, wreaths: wreaths.get(d.idx) ?? 0, spent: d.spent }))
    .sort((a, b) => b.wreaths - a.wreaths || b.spent - a.spent);
  return { year, olympiad: olympiadOf(year), winners, table };
}

/** A triumph worth a lasting name: at least five wreaths and two-fifths of the programme. */
export function isTriumph(wreaths: number, events: number): boolean {
  return wreaths >= Math.max(5, Math.ceil(events * 0.4));
}
