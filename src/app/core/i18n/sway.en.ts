/** Texts of the neutral cities' sway, and the map legends. */
export interface SwayTexts {
  incSway: string;
  evSway: string;
  evSwayAwe: string;
  evSwayLost: string;
  swayTitle: string;
  swayFear: string;
  swayAwe: string;
  swayTributeTo: string;
  swayAweOf: string;
  swayNone: string;
  swayYou: string;
  swayHint: string;
  outSway: string;
  outSwayNone: string;
  viewInfluence: string;
  tabsShort: { budget: string; polis: string; diplomacy: string; hegemony: string; chronicle: string };
  hegPlaceChart: string;
  hegPlace: string;
  topMore: string;
  sheetRaise: string;
  sheetLower: string;
  legend: {
    relations: { hostile: string; neutral: string; friendly: string; ally: string };
    hegemony: { first: string; second: string; third: string; rest: string };
    influence: { tribute: string; awe: string; free: string };
    fertility: { poor: string; rich: string };
  };
}

export const SWAY_EN: SwayTexts = {
  incSway: 'Tribute and gifts of neutral cities',
  evSway: '{a} pays tribute to {b}',
  evSwayAwe: '{a} is won over by {b}',
  evSwayLost: '{a} no longer heeds {b}',
  swayTitle: 'Sphere of influence',
  swayFear: 'Fear',
  swayAwe: 'Fascination',
  swayTributeTo: 'Pays tribute to {name}, out of fear of its arms.',
  swayAweOf: 'Fascinated by {name}: sends gifts and its merchantmen.',
  swayNone: 'Answers to no one: nobody is feared or admired enough here.',
  swayYou: 'Our influence: fear {f}, fascination {a} (sway from {t}).',
  swayHint:
    'Neutral cities cannot be conquered. Near a city with a mighty army they come to fear it and pay tribute (a quarter of their income); a city famed for its culture and power projection fascinates them from afar, and they send it gifts, power projection and their merchant ships.',
  outSway: 'Neutral cities',
  outSwayNone: 'No neutral city is under our sway.',
  sheetRaise: 'Pull the panel up',
  sheetLower: 'Lower the panel',
  topMore: 'More figures',
  hegPlaceChart: 'Your place in the ranking',
  hegPlace: '{n} place',
  tabsShort: { budget: 'Budget', polis: 'Polis', diplomacy: 'Diplomacy', hegemony: 'Hegemony', chronicle: 'Chronicle' },
  viewInfluence: 'Spheres of influence',
  legend: {
    relations: { hostile: 'Hostile', neutral: 'Neutral', friendly: 'Friendly', ally: 'Ally' },
    hegemony: { first: '1st place', second: '2nd place', third: '3rd place', rest: 'Others' },
    influence: { tribute: 'Pays tribute (fear)', awe: 'Fascinated (gifts)', free: 'Answers to no one' },
    fertility: { poor: 'Barren', rich: 'Fertile' }
  }
};
