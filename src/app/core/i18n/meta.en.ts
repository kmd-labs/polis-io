import { AmbitionId } from '../../game/ambitions';

/** Texts of the ambitions, the horizon, the codex, the scenarios and the oracle's run of luck. */
export interface MetaTexts {
  ambitions: Record<AmbitionId, { name: string; goal: string }>;
  outAmbitions: string;
  ambitionReward: string;
  ambitionDone: string;
  ambitionDoneText: string;
  evAmbition: string;
  outHorizon: string;
  horizon: { games: string; truce: string; oracle: string; oracleReady: string; colony: string; weary: string; treaty: string; end: string };
  horizonNone: string;
  codexTitle: string;
  codexIntro: string;
  codexVerses: string;
  codexEvents: string;
  codexAmbitions: string;
  codexWreaths: string;
  codexBest: string;
  codexLocked: string;
  scenarioFree: string;
  scenarioFreeText: string;
  scenarioPick: string;
  scenarioBest: string;
  scenarios: Record<string, { title: string; text: string }>;
  scenarioEndTitle: string;
  scenarioEndText: string;
  scoreParts: { hegemony: string; land: string; ambitions: string; wreaths: string; sway: string; satisfaction: string; total: string };
  scoreRecord: string;
  scoreBest: string;
  oracleStreak: string;
  oracleStreakNone: string;
}

export const META_EN: MetaTexts = {
  ambitions: {
    land: { name: 'Wider fields', goal: 'Hold {t}% of the Greek land' },
    people: { name: 'A crowded agora', goal: 'Grow to {t} people' },
    treasury: { name: 'A full treasury', goal: 'Save a year of income ({t} months)' },
    colony: { name: 'Sons across the sea', goal: 'Found a colony' },
    farms: { name: 'New fields', goal: 'Build three farms' },
    ports: { name: 'New moorings', goal: 'Build two ports' },
    wreath: { name: 'An olive wreath', goal: 'Win a wreath at Olympia' },
    sway: { name: 'Islands at our feet', goal: 'Hold sway over {t} neutral cities' },
    warWon: { name: 'A war won', goal: 'Win a war' },
    battles: { name: 'Three trophies', goal: 'Win three battles' },
    happy: { name: 'A golden age', goal: 'Keep satisfaction above 80% for {t} years' },
    greatWork: { name: 'A work for the ages', goal: 'Complete a great work' },
    blessing: { name: 'Apollo’s favour', goal: 'Win a favourable answer at Delphi' },
    repel: { name: 'Shield of Hellas', goal: 'Drive off a warband' },
    culture: { name: 'A school of Hellas', goal: 'Raise culture to {t}' },
    hegemon: { name: 'First of the Greeks', goal: 'Become the Hegemon of Hellas' }
  },
  outAmbitions: 'Ambitions',
  ambitionReward: 'Reward: {d} months of income · +{p} power projection',
  ambitionDone: 'Ambition fulfilled: {name}',
  ambitionDoneText: '{d} dr into the treasury and +{p} power projection. A new ambition takes its place.',
  evAmbition: '{a} fulfils an ambition: {w}',
  outHorizon: 'On the horizon',
  horizon: {
    games: 'Olympic Games',
    truce: 'Sacred truce now',
    oracle: 'The Pythia answers',
    oracleReady: 'The Pythia awaits your envoys',
    colony: 'Next colony possible',
    weary: 'War weariness — {name}',
    treaty: 'Treaty with {name} ends',
    end: 'End of the scenario'
  },
  horizonNone: 'Nothing on the horizon.',
  codexTitle: 'Codex of Hellas',
  codexIntro: 'What you have seen in all your games: prophecies, events, ambitions and wreaths. Kept in this browser.',
  codexVerses: 'Prophecies of the Pythia',
  codexEvents: 'Events lived through',
  codexAmbitions: 'Ambitions fulfilled',
  codexWreaths: 'Olympic wreaths won',
  codexBest: 'Best scores',
  codexLocked: 'not yet seen',
  scenarioFree: 'Free game',
  scenarioFreeText: 'Any city, no end but victory or defeat.',
  scenarioPick: 'Scenario',
  scenarioBest: 'best {n}',
  scenarios: {
    miletus: { title: 'Miletus before the Persians', text: '600–546 BC. Hold Ionia together until Sardis falls — and be first in silver when it does.' },
    athens: { title: 'The Athens of Solon', text: '600–550 BC. Laws, olives and the sea: make Athens the school of Hellas in fifty years.' },
    sparta: { title: 'Sparta and the Peloponnese', text: '600–550 BC. Bring Tegea and Argos to heel and make the Peloponnese yours.' },
    syracuse: { title: 'The pearl of the West', text: '600–550 BC. From Ortygia, become the first city of Sicily and Magna Graecia.' }
  },
  scenarioEndTitle: 'The scenario is over',
  scenarioEndText: '{name}, {year}. Your score: {s}.',
  scoreParts: {
    hegemony: 'Hegemony points',
    land: 'Land held',
    ambitions: 'Ambitions fulfilled',
    wreaths: 'Olympic wreaths',
    sway: 'Neutral cities under sway',
    satisfaction: 'Satisfaction',
    total: 'Total'
  },
  scoreRecord: 'A new best score!',
  scoreBest: 'Best so far: {n}',
  oracleStreak: 'Run of favour: {n} — blessings come easier, and the god gives more.',
  oracleStreakNone: 'Each favourable answer in a row raises the odds of a blessing; an ill omen ends the run.'
};
