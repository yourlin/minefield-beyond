import type { CellId } from '../../core/types/index.js';

/**
 * A game command — records a player action for replay/death review.
 */
export type GameCommand =
  | { readonly action: 'reveal'; readonly cellId: CellId }
  | { readonly action: 'flag'; readonly cellId: CellId }
  | { readonly action: 'unflag'; readonly cellId: CellId };

/**
 * Append-only log of game commands for replay and death review.
 */
export class CommandLog {
  private commands: GameCommand[] = [];

  /**
   * Record a command.
   */
  push(command: GameCommand): void {
    this.commands.push(command);
  }

  /**
   * Get all recorded commands.
   */
  getAll(): readonly GameCommand[] {
    return this.commands;
  }

  /**
   * Get the number of recorded commands.
   */
  get length(): number {
    return this.commands.length;
  }

  /**
   * Get the last command, or undefined if empty.
   */
  last(): GameCommand | undefined {
    return this.commands[this.commands.length - 1];
  }

  /**
   * Remove and return the last command.
   * Returns undefined if empty.
   */
  popLast(): GameCommand | undefined {
    return this.commands.pop();
  }

  /**
   * Clear all commands.
   */
  clear(): void {
    this.commands = [];
  }
}
