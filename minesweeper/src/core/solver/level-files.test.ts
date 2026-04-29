import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import { BinaryLevelCodec } from '../binary/binary-codec.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const levelsDir = path.resolve(__dirname, '../../../levels');

describe('Generated level files', () => {
  const codec = new BinaryLevelCodec();

  it('all .mswp files are valid binary format', () => {
    const files = fs.readdirSync(levelsDir).filter((f) => f.endsWith('.mswp'));
    expect(files.length).toBeGreaterThanOrEqual(3);

    for (const file of files) {
      const filePath = path.join(levelsDir, file);
      const data = fs.readFileSync(filePath);
      const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

      // Validate format
      const validation = codec.validate(buffer);
      expect(validation.valid, `${file}: ${validation.errors.join('; ')}`).toBe(true);

      // Decode
      const level = codec.decode(buffer);
      expect(level.cells.length).toBeGreaterThan(0);
      expect(level.minePositions.length).toBeGreaterThan(0);
      expect(level.minePositions.length).toBeLessThan(level.cells.length);
    }
  });
});
