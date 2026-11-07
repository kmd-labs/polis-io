/**
 * Hellas's frontier: the peoples beyond its borders, the small islands of its seas and the
 * neutral harbours on them, and the great works a city can sink its spare silver into.
 */

/** Peoples on the northern fringe c. 600 BC, raiding the Greek lands from beyond the map's Greek border. */
export type TribeId = 'illyrians' | 'paeonians' | 'thracians';

export interface TribeDef {
  kind: 'tribe';
  id: TribeId;
  /** Heartland (the seat is the nearest non-Greek land cell). */
  lon: number;
  lat: number;
  color: string;
  militarism: number;
  culture: number;
}

/**
 * Illyrians (Taulantii and the southern tribes) beyond Epirus, raiders by land and pirates by sea;
 * Paeonians on both banks of the Axios; Thracians (Edoni, Bisaltae) between the Axios and the Strymon.
 */
export const TRIBES: readonly TribeDef[] = [
  { kind: 'tribe', id: 'illyrians', lon: 19.8, lat: 41.0, color: 'neutral-900', militarism: 4, culture: 0 },
  { kind: 'tribe', id: 'paeonians', lon: 22.2, lat: 41.4, color: 'warning-900', militarism: 3, culture: 0 },
  { kind: 'tribe', id: 'thracians', lon: 23.9, lat: 41.3, color: 'neutral-700', militarism: 4, culture: 0 }
];

/** Neutral merchant cities on small islands: they hold their island, never go to war and live by the sea trade. */
export type TraderId = 'aegina' | 'siphnos' | 'thera' | 'keos';

export interface TraderDef {
  kind: 'trader';
  id: TraderId;
  lon: number;
  lat: number;
  color: string;
  militarism: number;
  culture: number;
}

/**
 * Aegina — the great carrying trader of the Archaic Aegean, first to strike silver coins, a partner
 * in the Greek emporion at Naucratis; Siphnos — rich from its silver and gold mines; Thera — the
 * Dorian island that sent out the founders of Cyrene (c. 630 BC); Keos — four small poleis trading
 * across the Saronic and Cycladic waters.
 */
export const TRADERS: readonly TraderDef[] = [
  { kind: 'trader', id: 'aegina', lon: 23.43, lat: 37.75, color: 'warning-500', militarism: 1, culture: 3 },
  { kind: 'trader', id: 'siphnos', lon: 24.71, lat: 36.98, color: 'warning-300', militarism: 1, culture: 2 },
  { kind: 'trader', id: 'thera', lon: 25.43, lat: 36.4, color: 'warning-700', militarism: 1, culture: 2 },
  { kind: 'trader', id: 'keos', lon: 24.33, lat: 37.63, color: 'warning-400', militarism: 1, culture: 2 }
];

/** Islets too small for the map's coastline data: added as land where the raster shows only sea. */
export const ISLETS: readonly { id: string; lon: number; lat: number; r: number }[] = [
  { id: 'delos', lon: 25.27, lat: 37.4, r: 1 },
  { id: 'rheneia', lon: 25.22, lat: 37.4, r: 1 },
  { id: 'gyaros', lon: 24.72, lat: 37.61, r: 1 },
  { id: 'donousa', lon: 25.81, lat: 37.1, r: 1 },
  { id: 'iraklia', lon: 25.45, lat: 36.84, r: 1 },
  { id: 'schinoussa', lon: 25.52, lat: 36.87, r: 1 },
  { id: 'koufonisia', lon: 25.59, lat: 36.93, r: 1 },
  { id: 'kimolos', lon: 24.57, lat: 36.8, r: 1 },
  { id: 'sikinos', lon: 25.1, lat: 36.68, r: 1 },
  { id: 'christiana', lon: 25.21, lat: 36.24, r: 1 },
  { id: 'makronisos', lon: 24.12, lat: 37.7, r: 1 },
  { id: 'antikythera', lon: 23.3, lat: 35.86, r: 1 },
  { id: 'strophades', lon: 21.0, lat: 37.25, r: 1 },
  { id: 'agathonisi', lon: 26.97, lat: 37.46, r: 1 },
  { id: 'lipsi', lon: 26.77, lat: 37.3, r: 1 },
  { id: 'pserimos', lon: 27.13, lat: 36.93, r: 1 },
  { id: 'kinaros', lon: 26.29, lat: 36.98, r: 1 },
  { id: 'levitha', lon: 26.47, lat: 37.0, r: 1 },
  { id: 'agiosEfstratios', lon: 24.99, lat: 39.53, r: 1 },
  { id: 'alonissos', lon: 23.88, lat: 39.15, r: 1 },
  { id: 'kyraPanagia', lon: 24.07, lat: 39.32, r: 1 },
  { id: 'kalamos', lon: 20.93, lat: 38.62, r: 1 },
  { id: 'atokos', lon: 20.83, lat: 38.48, r: 1 },
  { id: 'paxoi', lon: 20.17, lat: 39.2, r: 1 },
  { id: 'othonoi', lon: 19.4, lat: 39.85, r: 1 }
];

/** Trading harbours on small islands that belong to no polis: anyone may sell there, no one may take them. */
export type NeutralPortId =
  | 'delos'
  | 'syros'
  | 'seriphos'
  | 'ios'
  | 'skiathos'
  | 'peparethos'
  | 'psara'
  | 'astypalaia'
  | 'leros'
  | 'telos'
  | 'ithaca'
  | 'kythnos';

export const NEUTRAL_PORTS: readonly { id: NeutralPortId; lon: number; lat: number }[] = [
  { id: 'delos', lon: 25.27, lat: 37.4 },
  { id: 'syros', lon: 24.92, lat: 37.44 },
  { id: 'seriphos', lon: 24.47, lat: 37.15 },
  { id: 'ios', lon: 25.28, lat: 36.73 },
  { id: 'skiathos', lon: 23.48, lat: 39.17 },
  { id: 'peparethos', lon: 23.72, lat: 39.13 },
  { id: 'psara', lon: 25.57, lat: 38.55 },
  { id: 'astypalaia', lon: 26.35, lat: 36.55 },
  { id: 'leros', lon: 26.85, lat: 37.15 },
  { id: 'telos', lon: 27.38, lat: 36.43 },
  { id: 'ithaca', lon: 20.7, lat: 38.38 },
  { id: 'kythnos', lon: 24.42, lat: 37.4 }
];

/** Where spare silver can go once no budget fund has anything left to buy. */
export type GreatWorkId = 'delphi' | 'temple' | 'walls' | 'aqueduct';

export interface GreatWorkDef {
  id: GreatWorkId;
  /** Drachmae, before scaling with the city's size; a repeatable work grows dearer each time. */
  cost: number;
  repeatable: boolean;
}

/**
 * A treasury at Delphi (cities vied to dedicate one: Siphnos, Corinth, Athens…), a great Doric
 * temple, a ring of stone walls, and a water tunnel like Eupalinos's at Samos (c. 530 BC).
 */
export const GREAT_WORKS: readonly GreatWorkDef[] = [
  { id: 'delphi', cost: 500, repeatable: true },
  { id: 'temple', cost: 1500, repeatable: false },
  { id: 'walls', cost: 1200, repeatable: false },
  { id: 'aqueduct', cost: 1000, repeatable: false }
];
