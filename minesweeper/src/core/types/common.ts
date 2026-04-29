/**
 * 2D point in screen or logical coordinate space.
 */
export interface Point2D {
  readonly x: number;
  readonly y: number;
}

/**
 * Result of a validation operation.
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}
