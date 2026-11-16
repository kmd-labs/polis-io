/**
 * Ambitions: three goals the city sets itself at a time — a wreath at Olympia, two neutral cities
 * under its sway, a warband driven off, three happy years… Each shows its progress; fulfilled, it
 * brings silver and power projection, and a new ambition takes its place.
 */

export type AmbitionId =
  | 'land'
  | 'people'
  | 'treasury'
  | 'colony'
  | 'farms'
  | 'ports'
  | 'wreath'
  | 'sway'
  | 'warWon'
  | 'battles'
  | 'happy'
  | 'greatWork'
  | 'blessing'
  | 'repel'
  | 'culture'
  | 'hegemon';

export interface AmbitionDef {
  id: AmbitionId;
  /** Reward: months of income in silver, and power projection. */
  silver: number;
  prestige: number;
  /** Only for a city with a harbour, or one within reach of a warband. */
  need?: 'coastal' | 'raided';
}

export const AMBITIONS: readonly AmbitionDef[] = [
  { id: 'land', silver: 4, prestige: 1 },
  { id: 'people', silver: 4, prestige: 1 },
  { id: 'treasury', silver: 2, prestige: 0.5 },
  { id: 'colony', silver: 4, prestige: 1 },
  { id: 'farms', silver: 3, prestige: 0.5 },
  { id: 'ports', silver: 3, prestige: 0.5, need: 'coastal' },
  { id: 'wreath', silver: 3, prestige: 1.5 },
  { id: 'sway', silver: 4, prestige: 1.5 },
  { id: 'warWon', silver: 5, prestige: 2 },
  { id: 'battles', silver: 3, prestige: 1 },
  { id: 'happy', silver: 3, prestige: 1 },
  { id: 'greatWork', silver: 3, prestige: 1.5 },
  { id: 'blessing', silver: 2, prestige: 1 },
  { id: 'repel', silver: 3, prestige: 1.5, need: 'raided' },
  { id: 'culture', silver: 4, prestige: 1.5 },
  { id: 'hegemon', silver: 8, prestige: 3 }
];

export const AMBITION_BY_ID = new Map(AMBITIONS.map(a => [a.id, a]));

/** An ambition being pursued: the measure when it was set, and the mark to reach. */
export interface Ambition {
  id: AmbitionId;
  base: number;
  target: number;
}

/** How many ambitions the city pursues at once. */
export const AMBITIONS_ACTIVE = 3;
