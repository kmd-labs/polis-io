import { PolisId } from '../../game/data/poleis';

export type Lang = 'en' | 'pl';

export interface GlossaryEntry {
  term: string;
  desc: string;
}

/**
 * Every user-facing text of the application in one language.
 * Add new translation keys here first so TypeScript enforces parity across en.ts and pl.ts.
 */
export interface Dict {
  htmlLang: string;
  docTitle: string;
  langName: string;
  appName: string;
  seoDescription: string;

  // Top HUD & Navigation
  changeLanguage: string;
  chooseView: string;
  viewPolitical: string;
  viewFertility: string;
  stageAriaLabel: string;

  // Bottom Dock & Glossary
  glossary: string;
  glossaryDesc: string;
  glossaryItems: GlossaryEntry[];
  close: string;

  // Calendar & time controls
  yearBC: string;
  yearAD: string;
  play: string;
  pause: string;
  speed: string;
  fitMap: string;

  // Choosing a polis
  chooseTitle: string;
  chooseHint: string;
  choosePick: string;

  // Player polis panel
  yourPolis: string;
  statPopulation: string;
  statWorkers: string;
  statWarriors: string;
  statDrachmae: string;
  statTerritory: string;
  statGrowth: string;
  statPopulationHint: string;
  statWorkersHint: string;
  statWarriorsHint: string;
  statDrachmaeHint: string;
  statTerritoryHint: string;
  statGrowthHint: string;
  settle: string;
  settleHint: string;
  settling: string;
  settleNoLand: string;
  train: string;
  trainHint: string;

  // Diplomacy panel
  warsTitle: string;
  noWars: string;
  targetHint: string;
  atWar: string;
  atPeace: string;
  fallen: string;
  fallenTo: string;
  declareWar: string;
  declareWarHint: string;
  offerPeace: string;
  offerPeaceHint: string;
  peaceCooldown: string;

  // Chronicle (event feed)
  chronicle: string;
  evWar: string;
  evPeace: string;
  evPeaceRefused: string;
  evSettle: string;
  evColony: string;
  evFall: string;

  // End of game
  victoryTitle: string;
  victoryDesc: string;
  defeatTitle: string;
  defeatDesc: string;
  playAgain: string;

  // Map hover
  hoverPolis: string;
  hoverWild: string;
  hoverForeign: string;

  polisNames: Record<PolisId, string>;
}
