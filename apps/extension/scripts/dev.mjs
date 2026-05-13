import { readFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const extensionRoot = resolve(__dirname, '..');
const projectRoot = resolve(extensionRoot, '../..');
const distDir = join(extensionRoot, 'dist');
const viteCli = join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');

await rm(distDir, { recursive: true, force: true });

const env = {
  ...process.env,
  ...(await readEnvFile(join(projectRoot, '.env'))),
  HOT_RELOAD_EXTENSION_VITE_PORT: '8081',
  NODE_ENV: 'development',
};

await run(process.execPath, [viteCli, 'build', '--config', 'vite.config.chrome.ts', '--mode', 'development', '--watch'], extensionRoot, env);

function run(command, args, cwd, env) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
      env,
    });

    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) {
        resolveRun();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function readEnvFile(path) {
  try {
    const content = await readFile(path, 'utf8');
    const values = {};

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith('#')) {
        continue;
      }

      const separator = line.indexOf('=');
      if (separator === -1) {
        continue;
      }

      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');

      if (key) {
        values[key] = value;
      }
    }

    return values;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return {};
    }

    throw error;
  }
}
