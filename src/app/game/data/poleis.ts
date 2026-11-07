import { TraderDef, TribeDef } from './frontier';
/** Identifier of every playable city-state; names are resolved through I18nService. */
export type PolisId =
  | 'athens'
  | 'sparta'
  | 'corinth'
  | 'thebes'
  | 'argos'
  | 'chalkis'
  | 'elis'
  | 'larisa'
  | 'korkyra'
  | 'ambracia'
  | 'potidaea'
  | 'thasos'
  | 'mytilene'
  | 'chios'
  | 'samos'
  | 'naxos'
  | 'knossos'
  | 'lindos';

/** Historical towns where a vassal polis can be founded. */
export type SiteId =
  | 'tegea' | 'mantineia' | 'sikyon' | 'epidauros' | 'troizen' | 'megara' | 'plataea' | 'orchomenos'
  | 'delphi' | 'amphissa' | 'naupaktos' | 'kalydon' | 'pylos' | 'methone' | 'gytheion' | 'pharsalos'
  | 'pherai' | 'dion' | 'olynthos' | 'mende' | 'stageira' | 'abdera' | 'maroneia' | 'amphipolis'
  | 'kassope' | 'dodona' | 'thermon' | 'leukas' | 'ithaca' | 'zakynthos' | 'kythera' | 'melos'
  | 'paros' | 'andros' | 'tenos' | 'karystos' | 'eretria' | 'histiaia' | 'lamia' | 'hermione'
  | 'phleious' | 'gortyn' | 'kydonia' | 'lyttos' | 'ialysos' | 'kos' | 'methymna' | 'myrina'
  | 'samothrace' | 'skiathos';

export interface MajorPolisDef {
  kind: 'major';
  id: PolisId;
  lon: number;
  lat: number;
  /** Design-system palette token (resolved at runtime via ThemeService). */
  color: string;
  /** 1–5: slightly strengthens armies in battle. */
  militarism: number;
  /** 1–5: raises income. */
  culture: number;
}

/** A vassal polis founded during the game; it wears its overlord's colour. */
export interface SitePolisDef {
  kind: 'site';
  id: SiteId;
  lon: number;
  lat: number;
  color: string;
  militarism: number;
  culture: number;
}

export type PolisDef = MajorPolisDef | SitePolisDef | TribeDef | TraderDef;

/**
 * Leading Greek poleis around 600 BC — the end of the Dark Ages and the height of
 * the Archaic colonisation movement. Coordinates point at the historical urban centre;
 * militarism and culture reflect each city's reputation.
 */
export const POLEIS: readonly MajorPolisDef[] = [
  { kind: 'major', id: 'athens', lon: 23.727, lat: 37.984, color: 'primary-600', militarism: 2, culture: 5 },
  { kind: 'major', id: 'sparta', lon: 22.43, lat: 37.075, color: 'danger-600', militarism: 5, culture: 1 },
  { kind: 'major', id: 'corinth', lon: 22.88, lat: 37.906, color: 'purple-500', militarism: 2, culture: 4 },
  { kind: 'major', id: 'thebes', lon: 23.32, lat: 38.32, color: 'success-600', militarism: 3, culture: 2 },
  { kind: 'major', id: 'argos', lon: 22.72, lat: 37.63, color: 'info-500', militarism: 4, culture: 2 },
  { kind: 'major', id: 'chalkis', lon: 23.6, lat: 38.46, color: 'danger-400', militarism: 2, culture: 3 },
  { kind: 'major', id: 'elis', lon: 21.37, lat: 37.89, color: 'success-400', militarism: 1, culture: 4 },
  { kind: 'major', id: 'larisa', lon: 22.42, lat: 39.64, color: 'primary-800', militarism: 4, culture: 1 },
  { kind: 'major', id: 'korkyra', lon: 19.92, lat: 39.62, color: 'info-700', militarism: 3, culture: 2 },
  { kind: 'major', id: 'ambracia', lon: 20.98, lat: 39.16, color: 'neutral-600', militarism: 3, culture: 1 },
  { kind: 'major', id: 'potidaea', lon: 23.32, lat: 40.19, color: 'danger-300', militarism: 2, culture: 2 },
  { kind: 'major', id: 'thasos', lon: 24.71, lat: 40.75, color: 'success-300', militarism: 2, culture: 3 },
  { kind: 'major', id: 'mytilene', lon: 26.555, lat: 39.105, color: 'purple-300', militarism: 2, culture: 5 },
  { kind: 'major', id: 'chios', lon: 26.1, lat: 38.37, color: 'success-800', militarism: 1, culture: 4 },
  { kind: 'major', id: 'samos', lon: 26.95, lat: 37.7, color: 'primary-400', militarism: 3, culture: 4 },
  { kind: 'major', id: 'naxos', lon: 25.43, lat: 37.06, color: 'info-300', militarism: 2, culture: 3 },
  { kind: 'major', id: 'knossos', lon: 25.163, lat: 35.298, color: 'purple-600', militarism: 3, culture: 2 },
  { kind: 'major', id: 'lindos', lon: 28.0, lat: 36.15, color: 'danger-800', militarism: 2, culture: 3 }
];

/** Lesser towns of the Archaic world, available as sites for vassal poleis. */
export const SITES: readonly { id: SiteId; lon: number; lat: number }[] = [
  { id: 'tegea', lon: 22.4, lat: 37.46 },
  { id: 'mantineia', lon: 22.39, lat: 37.62 },
  { id: 'sikyon', lon: 22.72, lat: 37.98 },
  { id: 'epidauros', lon: 23.16, lat: 37.63 },
  { id: 'troizen', lon: 23.36, lat: 37.5 },
  { id: 'megara', lon: 23.35, lat: 38.0 },
  { id: 'plataea', lon: 23.27, lat: 38.21 },
  { id: 'orchomenos', lon: 22.97, lat: 38.49 },
  { id: 'delphi', lon: 22.5, lat: 38.48 },
  { id: 'amphissa', lon: 22.38, lat: 38.53 },
  { id: 'naupaktos', lon: 21.83, lat: 38.39 },
  { id: 'kalydon', lon: 21.53, lat: 38.37 },
  { id: 'pylos', lon: 21.7, lat: 36.91 },
  { id: 'methone', lon: 21.7, lat: 36.82 },
  { id: 'gytheion', lon: 22.57, lat: 36.76 },
  { id: 'pharsalos', lon: 22.38, lat: 39.3 },
  { id: 'pherai', lon: 22.75, lat: 39.38 },
  { id: 'dion', lon: 22.5, lat: 40.17 },
  { id: 'olynthos', lon: 23.36, lat: 40.3 },
  { id: 'mende', lon: 23.43, lat: 39.97 },
  { id: 'stageira', lon: 23.79, lat: 40.53 },
  { id: 'abdera', lon: 24.98, lat: 40.94 },
  { id: 'maroneia', lon: 25.51, lat: 40.88 },
  { id: 'amphipolis', lon: 23.85, lat: 40.82 },
  { id: 'kassope', lon: 20.68, lat: 39.15 },
  { id: 'dodona', lon: 20.79, lat: 39.55 },
  { id: 'thermon', lon: 21.67, lat: 38.58 },
  { id: 'leukas', lon: 20.7, lat: 38.83 },
  { id: 'ithaca', lon: 20.71, lat: 38.37 },
  { id: 'zakynthos', lon: 20.9, lat: 37.78 },
  { id: 'kythera', lon: 22.99, lat: 36.25 },
  { id: 'melos', lon: 24.42, lat: 36.72 },
  { id: 'paros', lon: 25.15, lat: 37.08 },
  { id: 'andros', lon: 24.94, lat: 37.84 },
  { id: 'tenos', lon: 25.16, lat: 37.54 },
  { id: 'karystos', lon: 24.42, lat: 38.02 },
  { id: 'eretria', lon: 23.79, lat: 38.39 },
  { id: 'histiaia', lon: 23.15, lat: 38.95 },
  { id: 'lamia', lon: 22.43, lat: 38.9 },
  { id: 'hermione', lon: 23.25, lat: 37.38 },
  { id: 'phleious', lon: 22.64, lat: 37.84 },
  { id: 'gortyn', lon: 24.95, lat: 35.06 },
  { id: 'kydonia', lon: 24.02, lat: 35.51 },
  { id: 'lyttos', lon: 25.37, lat: 35.23 },
  { id: 'ialysos', lon: 28.16, lat: 36.41 },
  { id: 'kos', lon: 27.29, lat: 36.89 },
  { id: 'methymna', lon: 26.18, lat: 39.37 },
  { id: 'myrina', lon: 25.06, lat: 39.88 },
  { id: 'samothrace', lon: 25.53, lat: 40.5 },
  { id: 'skiathos', lon: 23.49, lat: 39.16 }
];
