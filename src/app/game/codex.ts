/**
 * The Codex of Hellas: what the player has seen across all their games, kept in this browser — the
 * Pythia's prophecies, the events lived through, the ambitions fulfilled, the wreaths won — and the
 * best score in each scenario. Saved in localStorage; the game plays the same without it.
 */
import { AmbitionId } from './ambitions';
import { DilemmaId } from './data/dilemmas';
import { PolisId } from './data/poleis';
import { OracleOutcome } from './oracle';

export interface CodexData {
  verses: string[];
  events: DilemmaId[];
  ambitions: AmbitionId[];
  wreaths: number;
  best: Record<string, number>;
}

const KEY = 'polis-io.codex';

export function loadCodex(): CodexData {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? (JSON.parse(raw) as Partial<CodexData>) : {};
    return { verses: data.verses ?? [], events: data.events ?? [], ambitions: data.ambitions ?? [], wreaths: data.wreaths ?? 0, best: data.best ?? {} };
  } catch {
    return { verses: [], events: [], ambitions: [], wreaths: 0, best: {} };
  }
}

export function saveCodex(data: CodexData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Private windows and blocked storage: the codex simply is not kept.
  }
}

export function verseKey(outcome: OracleOutcome, verse: number): string {
  return `${outcome}.${verse}`;
}

/** A short game with a story and a score: one city, about fifty years. */
export interface Scenario {
  id: string;
  polis: PolisId;
  /** The game ends in this year (BC). */
  endYear: number;
}

export const SCENARIOS: readonly Scenario[] = [
  { id: 'miletus', polis: 'miletus', endYear: 546 },
  { id: 'athens', polis: 'athens', endYear: 550 },
  { id: 'sparta', polis: 'sparta', endYear: 550 },
  { id: 'syracuse', polis: 'syracuse', endYear: 550 }
];

/** The score of a finished scenario, part by part. */
export interface ScenarioScore {
  hegemony: number;
  land: number;
  ambitions: number;
  wreaths: number;
  sway: number;
  satisfaction: number;
  total: number;
}
