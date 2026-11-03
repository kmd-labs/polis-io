import { PolisId, SiteId } from '../../game/data/poleis';
import { ImprovementId, ImprovementTree } from '../../game/data/improvements';

export type Lang = 'en' | 'pl';

export interface PolisInfo {
  region: string;
  blurb: string;
}

/** A declaration of war in the voice of a polis. */
export interface WarLetter {
  sender: string;
  /** Used when the sender thinks you are weak. */
  taunt: string;
  /** Used against a worthy rival. */
  challenge: string;
}

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
  viewRelief: string;
  viewFertility: string;
  loadingMap: string;
  loadingTerrain: string;
  loadError: string;
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

  // Start screen
  chooseTitle: string;
  startEyebrow: string;
  startIntro: string;
  startHint: string;
  startLead: string;
  statArea: string;
  areaKm2: string;

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
  develop: string;
  developHint: string;
  statMilitarism: string;
  statCulture: string;
  statMilitarismHint: string;
  statCultureHint: string;
  farms: string;
  ports: string;
  vassals: string;
  ships: string;
  allies: string;
  ally: string;
  statPrestige: string;
  statPrestigeHint: string;
  slavesHint: string;
  satisfaction: string;
  satisfactionHint: string;

  // Polis screen
  openPolis: string;
  polisScreenIntro: string;
  trees: Record<ImprovementTree, string>;
  improvements: Record<ImprovementId, { name: string; desc: string }>;
  build: string;
  buildCost: string;
  built: string;
  underConstruction: string;
  lockedHint: string;

  // War report
  warEndTitle: string;
  warEndConquest: string;
  warEndPeace: string;
  warDuration: string;
  yearsOne: string;
  yearsFew: string;
  yearsMany: string;
  warBattles: string;
  warBattlesValue: string;
  warLand: string;
  warLandValue: string;
  warSpoils: string;
  warSpoilsValue: string;
  warMoodValue: string;
  warEndAction: string;
  buildingsHint: string;
  vassalOf: string;

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
  evFarm: string;
  evPort: string;
  evVassal: string;
  evAlliance: string;
  evAllianceOffer: string;

  // Battle report
  reportTitle: string;
  reportNear: string;
  reportBattles: string;
  reportGold: string;
  reportGoldValue: string;
  reportSlaves: string;
  reportSlavesValue: string;
  reportPrestigeValue: string;
  reportLosses: string;
  reportLossesValue: string;
  reportAction: string;

  // Embassy (alliance offer)
  embassyTitle: string;
  embassySubtitle: string;
  embassyText: string;
  embassyAccept: string;
  embassyDecline: string;

  // War letters
  letterTitle: string;
  letterDeclares: string;
  letterAction: string;
  letterGeneric: WarLetter;
  letters: Record<PolisId, WarLetter>;

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
  hoverAltitude: string;

  // Cartographic labels
  peakOlympus: string;

  polisNames: Record<PolisId, string>;
  polisInfo: Record<PolisId, PolisInfo>;
  siteNames: Record<SiteId, string>;
}
