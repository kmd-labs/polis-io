/**
 * Choices put before the player, in the manner of a grand-strategy event: a scene, a story and two or
 * three answers with plain consequences. Historical ones come in their year (600–479 BC); the others
 * may happen at any time a condition holds. The texts live in the i18n dictionaries.
 */

/** What an answer does. Silver is counted in months of the city's income (negative: paid). */
export interface DilemmaEffects {
  silver?: number;
  prestige?: number;
  /** Satisfaction points. */
  mood?: number;
  culture?: number;
  militarism?: number;
  /** Regard of every Greek city. */
  regard?: number;
  /** Positive: a share of the people takes up arms (garrison); negative: a share of the garrison is sent away for good. */
  hoplites?: number;
  /** Share of the people gained or lost. */
  people?: number;
  prosperity?: number;
  /** Months of income paid into the colonization fund. */
  colonize?: number;
}

/** One answer as the city stands now. */
export interface DilemmaChoice {
  id: string;
  effects: DilemmaEffects;
  /** Drachmae gained (+) or paid (−). */
  silver: number;
  /** Drachmae paid into the colonization fund. */
  colonize: number;
  affordable: boolean;
}

export type DilemmaScene = 'oracle' | 'temple' | 'sea' | 'army' | 'agora' | 'harvest' | 'eclipse' | 'games' | 'east' | 'plague';

/** When a dilemma may come up. */
export type DilemmaNeed = 'coastal' | 'war' | 'peace' | 'militant' | 'warlike';

export interface DilemmaDef {
  id: DilemmaId;
  scene: DilemmaScene;
  /** Historical: the year (BC) it happens; it can still come up to three years later. */
  year?: number;
  need?: DilemmaNeed;
  /** The answers; the last one is taken if the letter is put aside. */
  options: readonly { id: string; effects: DilemmaEffects }[];
}

export type DilemmaId =
  | 'lawgiver'
  | 'sacredWar'
  | 'eclipse'
  | 'pythia'
  | 'festival'
  | 'tyrant'
  | 'croesus'
  | 'sardis'
  | 'pythagoras'
  | 'polycrates'
  | 'isonomia'
  | 'ionianRevolt'
  | 'earthAndWater'
  | 'xerxes'
  | 'oracle'
  | 'drought'
  | 'plague'
  | 'feud'
  | 'poet'
  | 'silverVein'
  | 'coinage'
  | 'exiles'
  | 'omen'
  | 'ransom'
  | 'victor'
  | 'stoneTemple'
  | 'pirates'
  | 'phalanx'
  | 'serfs';

export const DILEMMAS: readonly DilemmaDef[] = [
  // ── Historical, in their year ──
  {
    id: 'lawgiver',
    scene: 'agora',
    year: 594,
    options: [
      { id: 'cancel', effects: { mood: 15, prestige: 0.5, silver: -2 } },
      { id: 'code', effects: { culture: 0.2, mood: 4, silver: -1 } },
      { id: 'creditors', effects: { silver: 2, mood: -10 } }
    ]
  },
  {
    id: 'sacredWar',
    scene: 'oracle',
    year: 591,
    options: [
      { id: 'hoplites', effects: { hoplites: -0.1, prestige: 1.5, regard: 4 } },
      { id: 'silver', effects: { silver: -2, prestige: 0.5, regard: 2 } },
      { id: 'refuse', effects: { regard: -3 } }
    ]
  },
  {
    id: 'eclipse',
    scene: 'eclipse',
    year: 585,
    options: [
      { id: 'sacrifice', effects: { silver: -1, mood: 8 } },
      { id: 'thales', effects: { culture: 0.3, mood: -4 } }
    ]
  },
  {
    id: 'pythia',
    scene: 'games',
    year: 582,
    options: [
      { id: 'choir', effects: { silver: -1.5, prestige: 1, culture: 0.15 } },
      { id: 'athletes', effects: { silver: -1, prestige: 0.8, mood: 3 } },
      { id: 'stay', effects: { mood: -1 } }
    ]
  },
  {
    id: 'festival',
    scene: 'temple',
    year: 566,
    options: [
      { id: 'grand', effects: { silver: -2, mood: 10, culture: 0.2 } },
      { id: 'modest', effects: { silver: -0.5, mood: 4 } }
    ]
  },
  {
    id: 'tyrant',
    scene: 'agora',
    year: 561,
    options: [
      { id: 'grant', effects: { mood: 8, militarism: 0.3, prestige: -0.5, prosperity: 0.05 } },
      { id: 'refuse', effects: { mood: -4, regard: 2 } }
    ]
  },
  {
    id: 'croesus',
    scene: 'east',
    year: 556,
    options: [
      { id: 'accept', effects: { silver: 4, regard: -3 } },
      { id: 'gifts', effects: { silver: 1.5, prestige: 0.3 } },
      { id: 'decline', effects: { prestige: 0.8 } }
    ]
  },
  {
    id: 'sardis',
    scene: 'sea',
    year: 546,
    need: 'coastal',
    options: [
      { id: 'welcome', effects: { people: 0.04, mood: -4, culture: 0.2 } },
      { id: 'craftsmen', effects: { silver: -1, people: 0.02, prosperity: 0.05 } },
      { id: 'turn', effects: { mood: 2 } }
    ]
  },
  {
    id: 'pythagoras',
    scene: 'temple',
    year: 530,
    options: [
      { id: 'host', effects: { culture: 0.4, mood: -3 } },
      { id: 'refuse', effects: { prestige: -0.2, mood: 1 } }
    ]
  },
  {
    id: 'polycrates',
    scene: 'sea',
    year: 525,
    need: 'coastal',
    options: [
      { id: 'tribute', effects: { silver: -2, prosperity: 0.03 } },
      { id: 'warships', effects: { silver: -3, militarism: 0.2, prestige: 0.5 } },
      { id: 'endure', effects: { prosperity: -0.05, mood: -4 } }
    ]
  },
  {
    id: 'isonomia',
    scene: 'agora',
    year: 508,
    options: [
      { id: 'grant', effects: { mood: 15, militarism: -0.2, culture: 0.2 } },
      { id: 'refuse', effects: { mood: -10, militarism: 0.2 } }
    ]
  },
  {
    id: 'ionianRevolt',
    scene: 'sea',
    year: 499,
    options: [
      { id: 'ships', effects: { silver: -2, prestige: 1.5, regard: 4 } },
      { id: 'refuse', effects: { prestige: -0.5 } }
    ]
  },
  {
    id: 'earthAndWater',
    scene: 'east',
    year: 491,
    options: [
      { id: 'refuse', effects: { prestige: 1.5, mood: 6, regard: 3 } },
      { id: 'submit', effects: { silver: 3, prestige: -2, regard: -8 } }
    ]
  },
  {
    id: 'xerxes',
    scene: 'army',
    year: 481,
    options: [
      { id: 'swear', effects: { hoplites: -0.15, prestige: 3, regard: 10 } },
      { id: 'neutral', effects: { silver: -1, regard: -5 } },
      { id: 'medize', effects: { silver: 4, prestige: -3, regard: -15 } }
    ]
  },
  // ── At any time ──
  {
    id: 'oracle',
    scene: 'oracle',
    options: [
      { id: 'colony', effects: { silver: -0.5, colonize: 3 } },
      { id: 'war', effects: { silver: -0.5, militarism: 0.2, mood: 3 } },
      { id: 'silence', effects: { silver: -0.5, culture: 0.1 } }
    ]
  },
  {
    id: 'drought',
    scene: 'harvest',
    options: [
      { id: 'grain', effects: { silver: -2 } },
      { id: 'ration', effects: { mood: -8, people: -0.02 } }
    ]
  },
  {
    id: 'plague',
    scene: 'plague',
    options: [
      { id: 'physicians', effects: { silver: -1.5, people: -0.01 } },
      { id: 'purify', effects: { silver: -1, mood: 3, culture: 0.1, people: -0.02 } },
      { id: 'pray', effects: { people: -0.04, mood: -4 } }
    ]
  },
  {
    id: 'feud',
    scene: 'agora',
    options: [
      { id: 'nobles', effects: { militarism: 0.2, mood: -5 } },
      { id: 'demos', effects: { mood: 6, prestige: -0.3 } },
      { id: 'exile', effects: { mood: 2, regard: -1 } }
    ]
  },
  {
    id: 'poet',
    scene: 'games',
    options: [
      { id: 'patron', effects: { silver: -1, culture: 0.25, prestige: 0.3 } },
      { id: 'decline', effects: {} }
    ]
  },
  {
    id: 'silverVein',
    scene: 'harvest',
    options: [
      { id: 'slaves', effects: { silver: 3, mood: -3 } },
      { id: 'citizens', effects: { silver: 1.5, mood: 3 } }
    ]
  },
  {
    id: 'coinage',
    scene: 'agora',
    options: [
      { id: 'mint', effects: { silver: -1.5, prosperity: 0.08 } },
      { id: 'barter', effects: {} }
    ]
  },
  {
    id: 'exiles',
    scene: 'agora',
    options: [
      { id: 'shelter', effects: { prestige: 0.5, regard: -2, hoplites: 0.005 } },
      { id: 'refuse', effects: { regard: 1 } }
    ]
  },
  {
    id: 'omen',
    scene: 'army',
    need: 'war',
    options: [
      { id: 'sacrifice', effects: { silver: -0.5, mood: 5 } },
      { id: 'march', effects: { prestige: 0.3, mood: -2 } }
    ]
  },
  {
    id: 'ransom',
    scene: 'army',
    need: 'war',
    options: [
      { id: 'pay', effects: { silver: -1, mood: 6 } },
      { id: 'refuse', effects: { mood: -6, prestige: 0.3 } }
    ]
  },
  {
    id: 'victor',
    scene: 'games',
    need: 'peace',
    options: [
      { id: 'statue', effects: { silver: -1, prestige: 1, mood: 5 } },
      { id: 'wreath', effects: { mood: 2 } }
    ]
  },
  {
    id: 'stoneTemple',
    scene: 'temple',
    options: [
      { id: 'stone', effects: { silver: -3, culture: 0.3, mood: 6 } },
      { id: 'timber', effects: { silver: -1, mood: 2 } }
    ]
  },
  {
    id: 'pirates',
    scene: 'sea',
    need: 'coastal',
    options: [
      { id: 'escort', effects: { silver: -1.5, prosperity: 0.03 } },
      { id: 'endure', effects: { prosperity: -0.05, mood: -3 } }
    ]
  },
  {
    id: 'phalanx',
    scene: 'army',
    need: 'militant',
    options: [
      { id: 'arm', effects: { silver: -1, hoplites: 0.02, mood: 5 } },
      { id: 'refuse', effects: { mood: -4 } }
    ]
  },
  {
    id: 'serfs',
    scene: 'harvest',
    need: 'warlike',
    options: [
      { id: 'concede', effects: { silver: -1, mood: 4 } },
      { id: 'crush', effects: { mood: -3, militarism: 0.2, people: -0.01 } }
    ]
  }
];

export const DILEMMA_BY_ID = new Map(DILEMMAS.map(d => [d.id, d]));

/** What happened in the wider world, year by year (BC): lines for the chronicle. */
export type WorldNoteId =
  | 'massalia'
  | 'solon'
  | 'sacredWar'
  | 'halys'
  | 'pythian'
  | 'isthmian'
  | 'nemean'
  | 'naucratis'
  | 'panathenaia'
  | 'peisistratos'
  | 'croesus'
  | 'cyrus'
  | 'sardis'
  | 'alalia'
  | 'polycrates'
  | 'croton'
  | 'egypt'
  | 'cleomenes'
  | 'hipparchus'
  | 'tyrantsFall'
  | 'cleisthenes'
  | 'ionia'
  | 'miletus'
  | 'marathon'
  | 'salamis'
  | 'plataea';

export const WORLD_NOTES: readonly { id: WorldNoteId; year: number }[] = [
  { id: 'massalia', year: 600 },
  { id: 'solon', year: 594 },
  { id: 'sacredWar', year: 595 },
  { id: 'halys', year: 585 },
  { id: 'pythian', year: 582 },
  { id: 'isthmian', year: 581 },
  { id: 'nemean', year: 573 },
  { id: 'naucratis', year: 570 },
  { id: 'panathenaia', year: 566 },
  { id: 'peisistratos', year: 561 },
  { id: 'croesus', year: 560 },
  { id: 'cyrus', year: 550 },
  { id: 'sardis', year: 546 },
  { id: 'alalia', year: 540 },
  { id: 'polycrates', year: 538 },
  { id: 'croton', year: 530 },
  { id: 'egypt', year: 525 },
  { id: 'cleomenes', year: 520 },
  { id: 'hipparchus', year: 514 },
  { id: 'tyrantsFall', year: 510 },
  { id: 'cleisthenes', year: 508 },
  { id: 'ionia', year: 499 },
  { id: 'miletus', year: 494 },
  { id: 'marathon', year: 490 },
  { id: 'salamis', year: 480 },
  { id: 'plataea', year: 479 }
];
