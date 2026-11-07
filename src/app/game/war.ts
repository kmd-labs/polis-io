/**
 * War in the manner of Archaic and Classical Greece: no armies march across the map. Each war is a
 * front between two cities whose border shifts after the season's events — a pitched battle of the
 * phalanxes, fields ravaged while the defenders sit behind their walls, a border fort taken, a town
 * betrayed, plague in the camp. Each side chooses how boldly to fight; the war ends at a table where
 * terms are weighed (gold, land, alliance, clientship, humiliation).
 */

/** How boldly a city fights: −2 shelter behind the walls … +2 all-out offensive. */
export type Posture = -2 | -1 | 0 | 1 | 2;
export const POSTURES: readonly Posture[] = [2, 1, 0, -1, -2];

export type CampaignKind =
  | 'battle'
  | 'ravage'
  | 'fort'
  | 'skirmish'
  | 'treachery'
  | 'plague'
  | 'allies'
  | 'navalRaid'
  | 'landing'
  | 'assault';

/** One war between two cities: the balance of the fighting and how each side fights. */
export interface Front {
  a: number;
  b: number;
  /** −100…+100, positive when a has the upper hand. */
  score: number;
  start: number;
  /** When the next month of the war is reckoned. */
  nextMonth: number;
  /** Posture of a and b, and when each last changed it. */
  posture: [Posture, Posture];
  postureAt: [number, number];
  /** Quality of each side's strategos (1–3 stars). */
  stars: [number, number];
}

/** What befell one side in a month of war, for the player's dispatches. */
export interface CampaignReport {
  kind: CampaignKind;
  enemy: number;
  /** Whether it went the player's way. */
  won: boolean;
  /** Closest city to where it happened. */
  near: number;
  cells: number;
  ownLosses: number;
  enemyLosses: number;
  gold: number;
  year: number;
}

/** Terms on the peace table. Gold and land come in three sizes; the others are all-or-nothing. */
export type PeaceItemKind = 'gold' | 'land' | 'alliance' | 'client' | 'humiliation';
export const PEACE_ITEMS: readonly PeaceItemKind[] = ['gold', 'land', 'alliance', 'client', 'humiliation'];

export interface PeaceItem {
  kind: PeaceItemKind;
  /** The city that gives it. */
  from: number;
  /** 1–3 for gold and land. */
  level: number;
}

/** Gold: months of the giver's income at each level; land: share of the giver's land. */
export const PEACE_GOLD_MONTHS = [3, 6, 12];
export const PEACE_LAND_SHARE = [0.04, 0.08, 0.15];

/** How a posture weighs: the chance to take the initiative, and strength attacking or holding. */
export const POSTURE_TABLE: Record<Posture, { initiative: number; attack: number; hold: number; meetsBattle: number }> = {
  2: { initiative: 2.8, attack: 1.2, hold: 0.9, meetsBattle: 1 },
  1: { initiative: 1.9, attack: 1.1, hold: 0.95, meetsBattle: 1 },
  0: { initiative: 1, attack: 1, hold: 1, meetsBattle: 1 },
  [-1]: { initiative: 0.45, attack: 0.92, hold: 1.18, meetsBattle: 0.55 },
  [-2]: { initiative: 0.15, attack: 0.85, hold: 1.35, meetsBattle: 0.12 }
};
