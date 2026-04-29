import * as fs from 'node:fs';
import { verifyFile } from './verify-command.js';
import { batchVerify } from './batch-verify.js';

// Ensure topology registry is populated (side-effect import)
import '../../core/topology/topology-registry.js';

/**
 * Run the verifier CLI.
 *
 * @param args - Command-line arguments (excluding node and script path).
 * @returns Exit code: 0 = all unique, 1 = some failed, 2 = usage error.
 */
export function run(args: string[]): number {
  if (args.length === 0) {
    printUsage();
    return 2;
  }

  const target = args[0];

  let stat: fs.Stats;
  try {
    stat = fs.statSync(target);
  } catch {
    console.error(`❌ Path not found: ${target}`);
    return 2;
  }

  if (stat.isDirectory()) {
    // Batch mode
    const result = batchVerify(target);

    for (const r of result.results) {
      console.log(r.message);
    }

    console.log('');
    console.log(`📊 Results: ${result.passed}/${result.total} passed, ${result.failed} failed`);

    return result.failed > 0 ? 1 : 0;
  }

  // Single file mode
  const result = verifyFile(target);
  console.log(result.message);

  return result.success ? 0 : 1;
}

/**
 * Print usage information.
 */
function printUsage(): void {
  console.log('Usage: mswp-verify <file.mswp | directory>');
  console.log('');
  console.log('Verify solvability of .mswp level files.');
  console.log('');
  console.log('  file.mswp   Verify a single level file');
  console.log('  directory   Verify all .mswp files in a directory');
  console.log('');
  console.log('Exit codes:');
  console.log('  0  All levels have unique solutions');
  console.log('  1  Some levels failed verification');
  console.log('  2  Usage error or file not found');
}
