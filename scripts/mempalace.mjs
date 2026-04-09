/**
 * Запуск mempalace.cli с UTF-8 для stdout (избегает UnicodeEncodeError на Windows cp1251)
 * и единым поведением в cmd / PowerShell / npm.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { existsSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const pythonDir = isWin ? 'Scripts' : 'bin';
const pythonExe = isWin ? 'python.exe' : 'python';
const python = path.join(root, '.venv', pythonDir, pythonExe);

const passthrough = process.argv.slice(2);

if (passthrough.length === 0) {
  console.error(
    'Usage: npm run mem -- <mempalace args…>\nExamples:\n  npm run mem -- mine .\n  npm run mem -- search "your query"',
  );
  process.exit(1);
}

if (!existsSync(python)) {
  console.error(`Python venv not found at ${python}. Create .venv and install mempalace.`);
  process.exit(1);
}

const env = {
  ...process.env,
  PYTHONIOENCODING: 'utf-8',
  PYTHONUTF8: '1',
};

const isInit = passthrough[0] === 'init';

const result = spawnSync(
  python,
  ['-m', 'mempalace.cli', '--palace', './.mempalace/palace', ...passthrough],
  {
    cwd: root,
    stdio: 'inherit',
    env,
    // как legacy `echo.|` для неинтерактивного init
    input: isInit ? '\n' : undefined,
  },
);

process.exit(result.status === null ? 1 : result.status);
