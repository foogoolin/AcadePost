import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const extensionRoot = resolve(__dirname, '..');
const projectRoot = resolve(extensionRoot, '../..');
const distDir = join(extensionRoot, 'dist');
const zipPath = join(extensionRoot, 'extension.zip');
const viteCli = join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < CRC_TABLE.length; i += 1) {
  let value = i;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  CRC_TABLE[i] = value >>> 0;
}

await rm(distDir, { recursive: true, force: true });
await rm(zipPath, { force: true });
await run(process.execPath, [viteCli, 'build'], extensionRoot);
await mkdir(distDir, { recursive: true });
await cp(join(extensionRoot, 'manifest.json'), join(distDir, 'manifest.json'));
await zipDirectory(distDir, zipPath);

function run(command, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
      env: process.env,
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

async function zipDirectory(sourceDir, outputPath) {
  const files = await collectFiles(sourceDir);
  const chunks = [];
  const centralDirectory = [];
  let offset = 0;

  for (const file of files) {
    const data = await readFile(file.absolutePath);
    const name = Buffer.from(file.zipPath, 'utf8');
    const crc = crc32(data);
    const { time, date } = dosDateTime(file.mtime);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);

    chunks.push(localHeader, name, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(date, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralDirectory.push(centralHeader, name);

    offset += localHeader.length + name.length + data.length;
  }

  const centralSize = centralDirectory.reduce((size, chunk) => size + chunk.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  await writeFile(outputPath, Buffer.concat([...chunks, ...centralDirectory, end]));
}

async function collectFiles(dir, root = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, root)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const fileStat = await stat(absolutePath);
    files.push({
      absolutePath,
      mtime: fileStat.mtime,
      zipPath: relative(root, absolutePath).split(sep).join('/'),
    });
  }

  return files.sort((a, b) => a.zipPath.localeCompare(b.zipPath));
}

function dosDateTime(value) {
  const date = new Date(value);
  const year = Math.max(date.getFullYear(), 1980);

  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}
