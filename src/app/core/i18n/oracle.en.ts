import { OracleOutcome, OracleQuestion } from '../../game/oracle';

/** Texts of the oracle at Delphi. */
export interface OracleTexts {
  oracleTitle: string;
  oracleIntro: string;
  oracleOpen: string;
  oracleWait: string;
  oracleAsk: string;
  oracleOffer: string;
  oracleQuestions: Record<OracleQuestion, { name: string; ask: string }>;
  oracleStakes: string[];
  oracleStakeHint: string;
  oracleOdds: string;
  oracleOutcomes: Record<OracleOutcome, { name: string; verses: string[]; result: string }>;
  oracleConsult: string;
  oracleDrawing: string;
  oracleAgain: string;
  oracleClose: string;
  oracleCannot: string;
  evOracle: string;
}

export const ORACLE_EN: OracleTexts = {
  oracleTitle: 'The oracle at Delphi',
  oracleIntro:
    'Send envoys with an offering and a question; the Pythia draws a lot from her urn. The god may grant many times the offering — or nothing at all. Richer offerings, and treasuries raised at Delphi, find more favour. She answers each city once a year.',
  oracleOpen: 'Consult the Pythia',
  oracleWait: 'The Pythia will answer again in {t}.',
  oracleAsk: 'The question',
  oracleOffer: 'The offering',
  oracleQuestions: {
    war: { name: 'War', ask: 'Will our spears prevail?' },
    harvest: { name: 'Harvest', ask: 'Will the fields bear?' },
    sea: { name: 'Sea', ask: 'Will the sea bring wealth?' },
    colonies: { name: 'Colonies', ask: 'Where shall we send our sons?' },
    festival: { name: 'Festival', ask: 'Will the gods smile on our feasts?' }
  },
  oracleStakes: ['Modest', 'Rich', 'Royal'],
  oracleStakeHint: '{m} months of income',
  oracleOdds: 'The lots in the urn',
  oracleOutcomes: {
    blessing: {
      name: 'Blessing',
      verses: [
        '“Shining Apollo opens his hand to you: take what you asked, and more.”',
        '“As the laurel never withers, so shall your fortune flourish.”',
        '“Go, and the god goes before you.”'
      ],
      result: 'The god grants {d} dr to the {fund} fund, and Hellas hears of it: power projection +1.'
    },
    favour: {
      name: 'Favourable',
      verses: ['“What you seek, you shall find — if you do not tarry.”', '“The tide that rises lifts the ship that is ready.”', '“Ask, and Apollo gives.”'],
      result: 'The god grants {d} dr to the {fund} fund.'
    },
    riddle: {
      name: 'A riddle',
      verses: [
        '“If you go to war, a great kingdom will fall.” — But whose?',
        '“Trust to the wooden walls.” — The envoys argue all the way home.',
        '“Know thyself.” — Nothing more.'
      ],
      result: 'Half the offering comes back as the priests’ goodwill: {d} dr to the {fund} fund.'
    },
    ill: {
      name: 'Ill omen',
      verses: ['“Wretches, why sit you here? Flee to the ends of the earth!”', '“The god has turned his face away.”', '“Nothing in excess — not even hope.”'],
      result: 'The offering is lost, and the people are uneasy: satisfaction −6.'
    }
  },
  oracleConsult: 'Send the envoys · {d} dr',
  oracleDrawing: 'The Pythia sits upon the tripod and draws a lot…',
  oracleAgain: 'The god has spoken.',
  oracleClose: 'Return home',
  oracleCannot: 'Our savings do not cover this offering.',
  evOracle: '{a} consults the Pythia: {w}'
};
