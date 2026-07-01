import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const auditScript = resolve(repoRoot, 'scripts/rules-audit.mjs');

const AUDITABLE_PATTERN = /\.(?:ts|vue|scss)$/;
const TYPESCRIPT_SOURCE_PATTERN = /\.(?:ts|vue)$/;
const TSCONFIG_PATTERN = /^tsconfig\.json$/;

/** @description [Rules] - собирает уникальные пути незакоммиченных файлов из git. */
function collectChangedFilePaths() {
  const gitCommands = [
    ['git', ['diff', '--name-only', '--diff-filter=ACMR']],
    ['git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR']],
    ['git', ['ls-files', '--others', '--exclude-standard']],
  ];

  const paths = new Set();

  for (const [command, args] of gitCommands) {
    const result = spawnSync(command, args, {
      cwd: repoRoot,
      encoding: 'utf-8',
    });

    if (result.status !== 0) {
      console.error(`Failed to run ${command} ${args.join(' ')}`);
      if (result.stderr) {
        console.error(result.stderr.trim());
      }
      process.exit(2);
    }

    const output = `${result.stdout ?? ''}`.trim();
    if (!output) {
      continue;
    }

    for (const line of output.split(/\r?\n/)) {
      const normalizedLine = line.trim().replace(/\\/g, '/');
      if (normalizedLine) {
        paths.add(normalizedLine);
      }
    }
  }

  return [...paths].sort();
}

/** @description [Rules] - оставляет только файлы, которые проверяет rules-audit. */
function filterAuditablePaths(filePaths) {
  return filePaths.filter((filePath) => {
    if (!AUDITABLE_PATTERN.test(filePath) && !TSCONFIG_PATTERN.test(filePath)) {
      return false;
    }

    const absolutePath = resolve(repoRoot, filePath);
    return existsSync(absolutePath);
  });
}

/** @description [Rules] - запускает rules-audit для одного пути и возвращает вывод. */
function runAuditForPath(filePath) {
  const result = spawnSync(process.execPath, [auditScript, filePath], {
    cwd: repoRoot,
    encoding: 'utf-8',
  });

  return {
    filePath,
    status: result.status ?? 1,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
  };
}

const changedPaths = collectChangedFilePaths();

if (!changedPaths.length) {
  console.log('No uncommitted changes detected.');
  process.exit(0);
}

console.log('Uncommitted files (git):');
for (const filePath of changedPaths) {
  console.log(`  - ${filePath}`);
}
console.log('');

const auditablePaths = filterAuditablePaths(changedPaths);

if (!auditablePaths.length) {
  console.log('No auditable source files in uncommitted changes (.ts, .vue, .scss, tsconfig.json).');
  process.exit(0);
}

const failedRuns = [];
let passedCount = 0;

for (const filePath of auditablePaths) {
  console.log(`--- ${filePath} ---`);
  const runResult = runAuditForPath(filePath);

  if (runResult.output) {
    console.log(runResult.output);
  }

  if (runResult.status === 0) {
    passedCount += 1;
    console.log('OK');
  } else {
    failedRuns.push(runResult);
    console.log('FAIL');
  }

  console.log('');
}

const hasTypeScriptChanges = changedPaths.some(
  (filePath) =>
    TYPESCRIPT_SOURCE_PATTERN.test(filePath) &&
    (filePath.startsWith('src/') || TSCONFIG_PATTERN.test(filePath)),
);

console.log('Summary');
console.log(`  Audited: ${auditablePaths.length}`);
console.log(`  Passed: ${passedCount}`);
console.log(`  Failed: ${failedRuns.length}`);

if (hasTypeScriptChanges) {
  console.log('');
  console.log('TypeScript/Nuxt checks recommended for changed src/** or tsconfig.json:');
  console.log('  npx nuxt prepare');
  console.log('  npm run typecheck');
}

if (failedRuns.length) {
  process.exit(1);
}

process.exit(0);
