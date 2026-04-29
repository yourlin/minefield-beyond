// core/mechanism — barrel file
// Information mechanism type definitions and rule engine

export { MechanismType } from './types.js';
export type { DisplayValue, CellState, FuzzyHintConfig, DelayedRevealConfig, MechanismConfig } from './types.js';
export { computeFuzzyDisplay } from './fuzzy-hint.js';
export { computeDelayedDisplay, isDelayComplete } from './delayed-reveal.js';
export { MechanismRegistry } from './mechanism-registry.js';
export type { MechanismHandler } from './mechanism-registry.js';
