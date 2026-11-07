import { CampaignKind, PeaceItemKind } from '../../game/war';

/** Texts of war and peace (postures, dispatches from the front, the peace table). */
export interface WarTexts {
  /** In the order of POSTURES: all-out offensive … behind the walls. */
  postures: { name: string; hint: string }[];
  postureTitle: string;
  postureIntro: string;
  postureLabel: string;
  postureCooldown: string;
  warScoreLabel: string;
  warScoreHint: string;
  strategosLabel: string;
  negotiate: string;
  maxWarsHint: string;
  treatyHint: string;
  campaignKinds: Record<CampaignKind, { title: string; won: string; lost: string; line: string }>;
  campaignGained: string;
  campaignLost: string;
  alertCampaign: string;
  evCampaign: string;
  evTreaty: string;
  evPeaceBought: string;
  letterSuePeace: string;
  peaceTitle: string;
  peaceIntro: string;
  peaceWeGive: string;
  peaceTheyGive: string;
  peaceItems: Record<PeaceItemKind, { name: string; hint: string }>;
  peaceGoldLevel: string;
  peaceLandLevel: string;
  peaceNoLand: string;
  peaceAccept: string;
  peaceRefuse: string;
  peaceRefused: string;
  peaceWhat: string;
  peaceWhite: string;
  peacePropose: string;
  peaceBack: string;
  peaceWeary: string;
  peaceOfferTitle: string;
  peaceOfferText: string;
  peaceOfferNone: string;
  peaceOfferAccept: string;
  peaceOfferRefuse: string;
  peaceOfferTalk: string;
  termGold: string;
  termLand: string;
  termLine: string;
}

export const WAR_EN: WarTexts = {
  postures: [
    { name: 'All-out offensive', hint: 'Every man to the front: we seize the initiative and seek battle — but the citizens grumble month after month.' },
    { name: 'Offensive', hint: 'We carry the war into their land: more battles and raids, a little stronger in attack.' },
    { name: 'Balanced', hint: 'We fight where we must: ready to meet them in the field, ready to hold the walls.' },
    { name: 'Defensive', hint: 'We hold our ground and only fight on good terms: stronger in defence, we seldom strike.' },
    { name: 'Behind the walls', hint: 'Everyone inside the walls, as Pericles would have it: hard to defeat, but the enemy burns our fields.' }
  ],
  postureTitle: 'War with {name}: how shall we fight?',
  postureIntro: 'Choose how boldly the city wages this war. The posture can be changed once a month.',
  postureLabel: 'Posture',
  postureCooldown: 'The posture can be changed again next month.',
  warScoreLabel: 'Balance of the war',
  warScoreHint: 'Who has the upper hand: battles, raids and towns taken move it; the further ahead, the more one can ask at the peace table.',
  strategosLabel: 'Strategos',
  negotiate: 'Negotiate peace',
  maxWarsHint: 'A city fights no more than three wars at once.',
  treatyHint: 'A peace treaty holds until {year}.',
  campaignKinds: {
    battle: {
      title: 'A pitched battle',
      won: 'Our phalanx broke the line of {name} near {place}. The field and the trophy are ours.',
      lost: 'The phalanx of {name} broke our line near {place}. We have lost the field and the dead must be asked back under truce.',
      line: '{a} defeats {b} in battle near {w}'
    },
    ravage: {
      title: 'Fields ablaze',
      won: 'Our men marched through the land of {name} near {place}, cutting the olives and burning the grain, and came home laden.',
      lost: '{name} ravaged our fields near {place} while our men watched from the walls.',
      line: '{a} ravages the land of {b} near {w}'
    },
    fort: {
      title: 'A border fort',
      won: 'We stormed a border fort of {name} near {place}; the land around it is ours.',
      lost: '{name} took one of our border forts near {place}, and the land around it.',
      line: '{a} takes a border fort of {b} near {w}'
    },
    skirmish: {
      title: 'A skirmish',
      won: 'Our light troops got the better of {name} in a skirmish near {place}.',
      lost: 'Our men were worsted by {name} in a skirmish near {place}.',
      line: '{a} wins a skirmish against {b} near {w}'
    },
    treachery: {
      title: 'Treachery',
      won: 'Friends inside a town of {name} near {place} opened the gates to us at night.',
      lost: 'Traitors opened the gates of one of our towns near {place} to {name}.',
      line: 'Traitors open a town of {b} to {a} near {w}'
    },
    plague: {
      title: 'Sickness in the camp',
      won: 'Sickness broke out among the men of {name} near {place}; they are burying their dead.',
      lost: 'Sickness broke out among our men near {place}; many are dead.',
      line: 'Sickness strikes the men of {b} near {w}'
    },
    allies: {
      title: 'Allies arrive',
      won: 'Our allies have sent a contingent against {name}.',
      lost: 'Allies of {name} have joined the fighting near {place}.',
      line: 'Allies of {a} join the war against {b}'
    },
    navalRaid: {
      title: 'A raid from the sea',
      won: 'Our ships fell on the coast of {name} near {place} and carried off what they could.',
      lost: 'Ships of {name} raided our coast near {place}.',
      line: '{a} raids the coast of {b} near {w}'
    },
    landing: {
      title: 'A landing',
      won: 'Our hoplites came ashore on the coast of {name} near {place} and fortified a headland.',
      lost: '{name} landed on our coast near {place} and fortified a headland.',
      line: '{a} lands on the coast of {b} near {w}'
    },
    assault: {
      title: 'The walls are stormed',
      won: 'Our men stormed the walls of {name}!',
      lost: '{name} stormed our walls!',
      line: '{a} storms the walls of {b}'
    }
  },
  campaignGained: '{n} km² are ours.',
  campaignLost: 'We have lost {n} km².',
  alertCampaign: '{title} near {place}',
  evCampaign: '{w}',
  evTreaty: 'Peace between {a} and {b}{w}',
  evPeaceBought: '{a} buys peace from {b} for {n} dr',
  letterSuePeace: 'Sue for peace · {d} dr',
  peaceTitle: 'Peace talks with {name}',
  peaceIntro: 'Put terms on the table for both sides; the gauge shows whether they will accept.',
  peaceWeGive: 'We give',
  peaceTheyGive: '{name} gives',
  peaceItems: {
    gold: { name: 'Gold', hint: 'A sum in silver: three, six or twelve months of the giver’s income.' },
    land: { name: 'Land', hint: 'A strip of the giver’s land along the common border.' },
    alliance: { name: 'Forced alliance', hint: 'The two cities become allies: each must come to the other’s aid.' },
    client: { name: 'Client state', hint: 'The giver serves the other as a client and pays it tribute.' },
    humiliation: { name: 'Humiliation', hint: 'A public humiliation: the giver loses renown, the other gains it.' }
  },
  peaceGoldLevel: '{d} dr',
  peaceLandLevel: '{n} km²',
  peaceNoLand: 'Our lands do not touch: no land can change hands.',
  peaceAccept: 'They will accept',
  peaceRefuse: 'They will refuse',
  peaceRefused: 'They refused these terms.',
  peaceWhat: 'What would make this work?',
  peaceWhite: 'White peace',
  peacePropose: 'Propose peace',
  peaceBack: 'Back to war',
  peaceWeary: 'After four years of war both cities are weary: terms come easier.',
  peaceOfferTitle: 'Envoys of {name}',
  peaceOfferText: 'The envoys of {name} propose peace on these terms:',
  peaceOfferNone: 'a white peace, with no terms.',
  peaceOfferAccept: 'Accept',
  peaceOfferRefuse: 'Refuse',
  peaceOfferTalk: 'Negotiate',
  termGold: '{d} dr',
  termLand: '{n} km² of land',
  termLine: '{giver}: {item}'
};
