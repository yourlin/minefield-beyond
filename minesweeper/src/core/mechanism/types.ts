import type { CellId } from '../types/index.js';

/**
 * Identifies the information mechanism applied to a cell.
 *
 * Each cell has at most one mechanism. `None` means the cell
 * uses standard exact-number display.
 */
export enum MechanismType {
  /** No special mechanism — cell shows exact neighbor mine count. */
  None = 'none',
  /** Fuzzy hint — cell shows a range [min, max] instead of exact count. */
  FuzzyHint = 'fuzzy-hint',
  /** Delayed reveal — cell shows a countdown, number appears after N moves. */
  DelayedReveal = 'delayed-reveal',
}

/**
 * The value displayed to the player for a revealed cell.
 *
 * Uses a discriminated union keyed on `kind`. Each variant carries
 * only the data relevant to that display mode.
 */
export type DisplayValue =
  | { readonly kind: 'exact'; readonly value: number }
  | { readonly kind: 'fuzzy'; readonly min: number; readonly max: number }
  | { readonly kind: 'delayed'; readonly revealAfter: number; readonly revealed: boolean }
  | { readonly kind: 'hidden' };

/**
 * Full state of a single cell, combining truth and presentation layers.
 *
 * - `truthValue` is the real neighbor mine count (known to solver, hidden from player).
 * - `displayValue` is what the player sees (affected by the cell's mechanism).
 * - `mechanism` identifies which information mechanism is active on this cell.
 */
export interface CellState {
  /** Real neighbor mine count (truth layer). */
  readonly truthValue: number;
  /** Value shown to the player (presentation layer). */
  readonly displayValue: DisplayValue;
  /** Information mechanism applied to this cell. */
  readonly mechanism: MechanismType;
  /** Unique cell identifier. */
  readonly cellId: CellId;
}

/**
 * Configuration for the FuzzyHint mechanism.
 *
 * The displayed range is `[truthValue - offset, truthValue + offset]`,
 * clamped so that `min >= 0`.
 */
export interface FuzzyHintConfig {
  readonly type: MechanismType.FuzzyHint;
  /** Non-negative offset applied symmetrically around the truth value. */
  readonly offset: number;
}

/**
 * Configuration for the DelayedReveal mechanism.
 *
 * The cell's number is hidden for `delay` moves after being revealed,
 * then automatically shown.
 */
export interface DelayedRevealConfig {
  readonly type: MechanismType.DelayedReveal;
  /** Number of moves to wait before showing the number (>= 1). */
  readonly delay: number;
}

/**
 * Discriminated union of all mechanism configurations.
 *
 * Keyed on the `type` field for exhaustive switch handling.
 */
export type MechanismConfig = FuzzyHintConfig | DelayedRevealConfig;
