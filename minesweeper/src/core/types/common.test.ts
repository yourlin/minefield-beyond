import { describe, it, expect } from 'vitest';
import type { Point2D, ValidationResult } from './common.js';

describe('core/types/common', () => {
  it('Point2D can be constructed with x and y', () => {
    const point: Point2D = { x: 10, y: 20 };
    expect(point.x).toBe(10);
    expect(point.y).toBe(20);
  });

  it('ValidationResult can represent a valid result', () => {
    const result: ValidationResult = { valid: true, errors: [] };
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('ValidationResult can represent an invalid result with errors', () => {
    const result: ValidationResult = {
      valid: false,
      errors: ['Missing magic number', 'Invalid version byte'],
    };
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toBe('Missing magic number');
  });
});
