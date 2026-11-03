/** The three development trees of the "Polis" screen. */
export type ImprovementTree = 'agriculture' | 'trade' | 'military';

export type ImprovementId =
  | 'granary' | 'irrigation' | 'olives' | 'vineyards' | 'terraces' | 'demeter'
  | 'agora' | 'mint' | 'shipyard' | 'guild' | 'emporion' | 'treasury'
  | 'gymnasium' | 'armoury' | 'walls' | 'drill' | 'barracks' | 'ares';

/** Nationwide bonuses; fractions are added to a multiplier (0.1 = +10%). */
export interface ImprovementEffects {
  /** Land carrying capacity. */
  capacity: number;
  /** Population growth rate. */
  growth: number;
  /** Income. */
  income: number;
  /** Land claimed per settler. */
  settle: number;
  /** Value of trade voyages. */
  trade: number;
  /** Extra merchant ships at sea. */
  ships: number;
  /** Discount on developing the polis. */
  develop: number;
  /** One-off power projection on completion. */
  prestige: number;
  /** Discount on training hoplites. */
  train: number;
  /** Battle strength. */
  battle: number;
  /** Strength of a garrison behind its walls. */
  walls: number;
  /** Extra armies in the field. */
  armies: number;
  /** March speed on land. */
  armySpeed: number;
  /** Satisfaction recovered per second. */
  regen: number;
}

export interface ImprovementDef {
  id: ImprovementId;
  tree: ImprovementTree;
  /** 1–6; each tier requires the previous one in the same tree. */
  tier: number;
  effects: Partial<ImprovementEffects>;
}

export const TREES: readonly ImprovementTree[] = ['agriculture', 'trade', 'military'];

export const IMPROVEMENTS: readonly ImprovementDef[] = [
  { id: 'granary', tree: 'agriculture', tier: 1, effects: { capacity: 0.08 } },
  { id: 'irrigation', tree: 'agriculture', tier: 2, effects: { capacity: 0.1 } },
  { id: 'olives', tree: 'agriculture', tier: 3, effects: { income: 0.1 } },
  { id: 'vineyards', tree: 'agriculture', tier: 4, effects: { income: 0.05, regen: 0.05 } },
  { id: 'terraces', tree: 'agriculture', tier: 5, effects: { settle: 0.25, capacity: 0.05 } },
  { id: 'demeter', tree: 'agriculture', tier: 6, effects: { growth: 0.15, capacity: 0.1 } },

  { id: 'agora', tree: 'trade', tier: 1, effects: { income: 0.08 } },
  { id: 'mint', tree: 'trade', tier: 2, effects: { income: 0.1 } },
  { id: 'shipyard', tree: 'trade', tier: 3, effects: { ships: 1 } },
  { id: 'guild', tree: 'trade', tier: 4, effects: { trade: 0.5 } },
  { id: 'emporion', tree: 'trade', tier: 5, effects: { develop: 0.2, ships: 1 } },
  { id: 'treasury', tree: 'trade', tier: 6, effects: { prestige: 2, income: 0.1 } },

  { id: 'gymnasium', tree: 'military', tier: 1, effects: { train: 0.2 } },
  { id: 'armoury', tree: 'military', tier: 2, effects: { battle: 0.05 } },
  { id: 'walls', tree: 'military', tier: 3, effects: { walls: 0.3 } },
  { id: 'drill', tree: 'military', tier: 4, effects: { battle: 0.07 } },
  { id: 'barracks', tree: 'military', tier: 5, effects: { armies: 1, armySpeed: 0.15 } },
  { id: 'ares', tree: 'military', tier: 6, effects: { prestige: 2, battle: 0.05 } }
];

export const IMPROVEMENT_BY_ID = new Map(IMPROVEMENTS.map(d => [d.id, d]));

/** Drachmae and satisfaction a building of the given tier costs; every tier is dearer than the last. */
export function improvementCost(tier: number): { drachmae: number; satisfaction: number } {
  return { drachmae: Math.round(300 * Math.pow(1.7, tier - 1)), satisfaction: 3 + tier };
}

export const NO_EFFECTS: ImprovementEffects = {
  capacity: 0,
  growth: 0,
  income: 0,
  settle: 0,
  trade: 0,
  ships: 0,
  develop: 0,
  prestige: 0,
  train: 0,
  battle: 0,
  walls: 0,
  armies: 0,
  armySpeed: 0,
  regen: 0
};
