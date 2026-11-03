import { PolisId, SiteId } from '../../game/data/poleis';
import { ImprovementId, ImprovementTree } from '../../game/data/improvements';
import { AllianceReason, BudgetKey, Purchase } from '../../game/simulation';
import { PresetId } from '../../game/economy';
import { HegemonyCategory } from '../../game/hegemony';
import { DecadeVerdict } from '../../game/decade';

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
  flagOf: string;
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
  // Budget
  budget: string;
  budgetHint: string;
  budgetRule: string;
  budgetKeys: Record<BudgetKey, { name: string; desc: string }>;
  purchases: Record<Exclude<Purchase['kind'], 'improvement'>, string>;
  nextPurchase: string;
  savingOnly: string;
  armyStatus: string;
  expeditionUnderway: string;
  fundedBy: string;
  developTitle: string;
  developFarm: string;
  developPort: string;
  developVassal: string;
  developAction: string;
  monthsOne: string;
  monthsFew: string;
  monthsMany: string;
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
  buildings: string;
  polisScreenIntro: string;
  trees: Record<ImprovementTree, string>;
  improvements: Record<ImprovementId, { name: string; desc: string }>;
  buildCost: string;
  built: string;
  underConstruction: string;
  lockedHint: string;

  // War report
  warEndTitle: string;
  warEndConquest: string;
  warEndCity: string;
  warEndClient: string;
  warEndRevolt: string;
  warEndRansom: string;
  warEndAlliance: string;
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
  clientOf: string;
  underSiege: string;
  underSiegeHint: string;
  tributeHint: string;

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
  evSiege: string;
  evClient: string;
  evAnnexed: string;
  evSecession: string;
  evCaptured: string;
  evRevolt: string;
  evRansom: string;
  evFestival: string;
  evFarmPlanned: string;
  evPortPlanned: string;
  evBuilt: string;
  evPodium: string;
  evHegemon: string;
  evCoalition: string;
  evCoalitionEnd: string;

  // Conquest decision
  conquestTitle: string;
  conquestSubtitle: string;
  conquestRaze: string;
  conquestRazeDesc: string;
  conquestSubjugate: string;
  conquestSubjugateDesc: string;
  conquestAlliance: string;
  conquestAllianceDesc: string;

  // Diplomatic reputation
  relation: string;
  relationHint: string;
  relationLevels: Record<'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'cordial', string>;
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
  embassyTexts: Record<AllianceReason, string>;
  embassyWars: string;
  embassyWarning: string;
  // In-game HUD
  topBarLabel: string;
  perMonth: string;
  topHoplitesHint: string;
  topSatisfactionHint: string;
  speedN: string;
  drawerLabel: string;
  drawerCollapse: string;
  drawerExpand: string;
  tabs: Record<'budget' | 'polis' | 'diplomacy' | 'hegemony' | 'chronicle', string>;
  outlinerTitle: string;
  outlinerToggle: string;
  outWars: string;
  outAllies: string;
  outSieges: string;
  outLatest: string;
  outNoAllies: string;
  outNoSieges: string;
  outSiegeOurs: string;
  outSiegeTheirs: string;
  outAdvantageHint: string;
  mapModes: string;
  viewRelations: string;
  dipListHint: string;
  standings: Record<'war' | 'ally' | 'vassal' | 'client' | 'peace', string>;
  chronicleEmpty: string;
  alertsLabel: string;
  etaNow: string;
  viewHegemony: string;
  hegemonyCats: Record<HegemonyCategory, { name: string; desc: string }>;
  hegIntro: string;
  hegHegemon: string;
  hegNoHegemon: string;
  hegYou: string;
  hegYourPlace: string;
  hegScore: string;
  hegChart: string;
  hegEmpty: string;
  hegemonyTab: string;
  decTitle: string;
  decSubtitle: string;
  decBattles: string;
  decBattlesValue: string;
  decBudget: string;
  decVerdicts: Record<DecadeVerdict, string>;
  decOff: string;
  decAction: string;
  decToggle: string;
  alertEmbassy: string;
  incTreasuryNote: string;
  hegCoalition: string;
  hegCoalitionYou: string;
  alertCoalition: string;
  hegTrendUp: string;
  hegTrendDown: string;
  hegUnitFinance: string;
  hegUnitArms: string;
  topLaurel: string;
  podUp: string;
  podDown: string;
  podOff: string;
  hegemonTitle: string;
  hegemonText: string;
  hegemonYouTitle: string;
  hegemonYouText: string;
  hegemonOpen: string;
  hegemonAction: string;
  chartIncome: string;
  chartBuilt: string;
  chartWar: string;
  chartPeace: string;
  chartsLegend: string;
  chartsEmpty: string;
  incWorkers: string;
  incCulture: string;
  incPorts: string;
  incBuildings: string;
  incMood: string;
  incOther: string;
  incUpkeep: string;
  incTotal: string;
  etaYears: string;
  presetsLabel: string;
  presets: Record<PresetId | 'custom', string>;
  presetHints: Record<PresetId, string>;
  fcNext: string;
  fcStalled: string;
  fcHoplites: string;
  fcPay: string;
  fcDesert: string;
  fcFarm: string;
  fcPort: string;
  fcFestival: string;
  fcExpedition: string;
  fcColonyOnly: string;
  fcIdle: string;
  fcBlocked: string;
  alertOpen: string;
  alertSiege: string;
  alertSiegeAlly: string;
  alertDeserting: string;
  alertAllyWar: string;
  alertColonyBlocked: string;
  alertFundIdle: string;
  alertVictory: string;
  alertWarEnd: string;
  alertDevelop: string;
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
