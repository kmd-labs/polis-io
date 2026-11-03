import { PolisDef, PolisId } from './poleis';

/** Coin and shield devices drawn as simple shapes (see polis-flag.component.html). */
export type EmblemSymbol = 'owl' | 'shield' | 'wheel' | 'thunderbolt' | 'trident' | 'labyrinth' | 'kantharos' | 'rose' | 'amphora';

export type Emblem = { kind: 'symbol'; symbol: EmblemSymbol } | { kind: 'letter'; text: string };

/**
 * Archaic poleis flew no flags, but their coins and shields carried a device or the initial of the
 * city's name. Each banner shows the best-known one; the rest carry their Greek initials.
 */
const EMBLEMS: Record<PolisId, Emblem> = {
  athens: { kind: 'symbol', symbol: 'owl' }, // owl of Athena on the tetradrachm
  sparta: { kind: 'letter', text: 'Λ' }, // lambda of Lakedaimon on the hoplite shield
  corinth: { kind: 'letter', text: 'Ϙ' }, // archaic koppa beneath Pegasus on Corinthian staters
  thebes: { kind: 'symbol', symbol: 'shield' }, // Boeotian shield on Theban coins
  argos: { kind: 'letter', text: 'Α' },
  chalkis: { kind: 'symbol', symbol: 'wheel' }, // the Euboean wheel
  elis: { kind: 'symbol', symbol: 'thunderbolt' }, // Olympian Zeus
  larisa: { kind: 'letter', text: 'ΛΑ' },
  korkyra: { kind: 'symbol', symbol: 'amphora' },
  ambracia: { kind: 'letter', text: 'ΑΜ' },
  potidaea: { kind: 'symbol', symbol: 'trident' }, // Poseidon, the city's namesake
  thasos: { kind: 'letter', text: 'Θ' },
  mytilene: { kind: 'letter', text: 'Μ' },
  chios: { kind: 'letter', text: 'Χ' },
  samos: { kind: 'letter', text: 'Σ' },
  naxos: { kind: 'symbol', symbol: 'kantharos' }, // Dionysus' wine cup
  knossos: { kind: 'symbol', symbol: 'labyrinth' },
  lindos: { kind: 'symbol', symbol: 'rose' } // the rose (rhodon) of Rhodes
};

/** Latin transliteration → Greek letter, longest prefix first. */
const INITIALS: [string, string][] = [
  ['th', 'Θ'], ['ph', 'Φ'], ['ch', 'Χ'], ['ps', 'Ψ'], ['a', 'Α'], ['b', 'Β'], ['g', 'Γ'], ['d', 'Δ'], ['e', 'Ε'],
  ['z', 'Ζ'], ['h', 'Η'], ['i', 'Ι'], ['k', 'Κ'], ['c', 'Κ'], ['l', 'Λ'], ['m', 'Μ'], ['n', 'Ν'], ['x', 'Ξ'],
  ['o', 'Ο'], ['p', 'Π'], ['r', 'Ρ'], ['s', 'Σ'], ['t', 'Τ'], ['u', 'Υ'], ['y', 'Υ']
];

/** The device on a polis's banner; poleis founded during the game get their Greek initial. */
export function emblemFor(def: PolisDef): Emblem {
  if (def.kind === 'major') return EMBLEMS[def.id];
  const id = def.id.toLowerCase();
  const letter = INITIALS.find(([latin]) => id.startsWith(latin))?.[1] ?? 'Π';
  return { kind: 'letter', text: letter };
}
