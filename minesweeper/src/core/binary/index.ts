// core/binary — barrel file
// Binary level format codec abstraction

export { MAGIC_NUMBER, VERSION_BYTE } from './constants.js';
export type { ILevelCodec } from './codec-types.js';
export { BinaryLevelCodec } from './binary-codec.js';
export { JsonLevelCodec } from './json-codec.js';
