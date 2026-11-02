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

export interface PolisDef {
  id: PolisId;
  lon: number;
  lat: number;
  /** Design-system palette token (resolved at runtime via ThemeService). */
  color: string;
}

/**
 * Leading Greek poleis around 600 BC — the end of the Dark Ages and the height of
 * the Archaic colonisation movement. Coordinates point at the historical urban centre.
 */
export const POLEIS: readonly PolisDef[] = [
  { id: 'athens', lon: 23.727, lat: 37.984, color: 'primary-600' },
  { id: 'sparta', lon: 22.43, lat: 37.075, color: 'danger-600' },
  { id: 'corinth', lon: 22.88, lat: 37.906, color: 'purple-500' },
  { id: 'thebes', lon: 23.32, lat: 38.32, color: 'success-600' },
  { id: 'argos', lon: 22.72, lat: 37.63, color: 'info-500' },
  { id: 'chalkis', lon: 23.6, lat: 38.46, color: 'danger-400' },
  { id: 'elis', lon: 21.37, lat: 37.89, color: 'success-400' },
  { id: 'larisa', lon: 22.42, lat: 39.64, color: 'primary-800' },
  { id: 'korkyra', lon: 19.92, lat: 39.62, color: 'info-700' },
  { id: 'ambracia', lon: 20.98, lat: 39.16, color: 'neutral-600' },
  { id: 'potidaea', lon: 23.32, lat: 40.19, color: 'danger-300' },
  { id: 'thasos', lon: 24.71, lat: 40.75, color: 'success-300' },
  { id: 'mytilene', lon: 26.555, lat: 39.105, color: 'purple-300' },
  { id: 'chios', lon: 26.1, lat: 38.37, color: 'success-800' },
  { id: 'samos', lon: 26.95, lat: 37.7, color: 'primary-400' },
  { id: 'naxos', lon: 25.43, lat: 37.06, color: 'info-300' },
  { id: 'knossos', lon: 25.163, lat: 35.298, color: 'purple-600' },
  { id: 'lindos', lon: 28.0, lat: 36.15, color: 'danger-800' }
];
