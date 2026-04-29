import * as fs from 'node:fs';
import * as path from 'node:path';
import { verifyFile } from './verify-command.js';
import type { VerifyResult } from './verify-command.js';

/**
 * Batch verification result.
 */
export interface BatchResult {
  /** Total files processed. */
  readonly total: number;
  /** Number of files with unique solutions. */
  readonly passed: number;
  /** Number of files that failed verification. */
  readonly failed: number;
  /** Individual results for each file. */
  readonly results: readonly VerifyResult[];
}

/**
 * Verify all .mswp files in a directory.
 *
 * @param dirPath - Path to the directory to scan.
 * @returns The batch verification result.
 */
export function batchVerify(dirPath: string): BatchResult {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      total: 0,
      passed: 0,
      failed: 0,
      results: [{
        filePath: dirPath,
        success: false,
        message: `❌ Failed to read directory: ${msg}`,
      }],
    };
  }

  const mswpFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith('.mswp'))
    .map((e) => path.join(dirPath, e.name))
    .sort();

  if (mswpFiles.length === 0) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      results: [{
        filePath: dirPath,
        success: false,
        message: `⚠️ No .mswp files found in ${dirPath}`,
      }],
    };
  }

  const results: VerifyResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const filePath of mswpFiles) {
    const result = verifyFile(filePath);
    results.push(result);
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }

  return { total: mswpFiles.length, passed, failed, results };
}
