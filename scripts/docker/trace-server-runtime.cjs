#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { nodeFileTrace } = require('next/dist/compiled/@vercel/nft');

const base = process.cwd();
const outDir = path.resolve(process.argv[2] || '.docker-runtime/server');
const entries = [
  'apps/backend/dist/apps/backend/src/main.js',
  'apps/orchestrator/dist/apps/orchestrator/src/main.js',
  'node_modules/prisma/build/index.js',
];
const extraRuntimePaths = [
  'node_modules/.prisma',
  'node_modules/@prisma',
  'node_modules/prisma',
  'node_modules/@temporalio',
];

const forbidden = [
  /^\.env(?:\.|$)/,
  /^\.mcp\.json$/,
  /^\.mcp(?:\/|$)/,
  /^\.codex(?:\/|$)/,
  /^\.agents(?:\/|$)/,
  /^_byan(?:\/|$)/,
  /^_byan-output(?:\/|$)/,
  /^reports(?:\/|$)/,
  /^docs\/design(?:\/|$)/,
];

function normalize(relPath) {
  return relPath.split(path.sep).join('/');
}

function isForbidden(relPath) {
  const normalized = normalize(relPath);
  return forbidden.some((pattern) => pattern.test(normalized));
}

function copyFile(relPath) {
  if (isForbidden(relPath)) {
    return;
  }

  const src = path.join(base, relPath);
  const dest = path.join(outDir, relPath);

  if (!fs.existsSync(src)) {
    return;
  }

  const stat = fs.statSync(src);
  if (!stat.isFile()) {
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  fs.chmodSync(dest, stat.mode);
}

function copyPath(relPath) {
  if (isForbidden(relPath)) {
    return;
  }

  const src = path.join(base, relPath);
  const dest = path.join(outDir, relPath);

  if (!fs.existsSync(src)) {
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, {
    recursive: true,
    dereference: true,
    force: true,
  });
}

function rmByPattern(root, predicate) {
  if (!fs.existsSync(root)) {
    return;
  }

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (predicate(entry, fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      continue;
    }

    if (entry.isDirectory()) {
      rmByPattern(fullPath, predicate);
    }
  }
}

function directorySize(root) {
  if (!fs.existsSync(root)) {
    return 0;
  }

  let total = 0;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      total += directorySize(fullPath);
    } else if (entry.isFile()) {
      total += fs.statSync(fullPath).size;
    }
  }
  return total;
}

(async () => {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const { fileList, esmFileList, warnings } = await nodeFileTrace(entries, {
    base,
    processCwd: base,
    mixedModules: true,
  });

  const files = new Set([...fileList, ...(esmFileList || [])]);
  for (const entry of entries) {
    files.add(entry);
  }

  for (const relPath of files) {
    copyFile(relPath);
  }

  for (const relPath of extraRuntimePaths) {
    copyPath(relPath);
  }

  rmByPattern(outDir, (entry, fullPath) => {
    if (entry.isFile() && /\.(?:map|tsbuildinfo)$/i.test(entry.name)) {
      return true;
    }

    if (!entry.isDirectory()) {
      return false;
    }

    const name = entry.name.toLowerCase();
    return [
      '.cache',
      '__tests__',
      'coverage',
      'example',
      'examples',
      'test',
      'tests',
    ].includes(name);
  });

  const byteCount = directorySize(outDir);

  const warningCount = warnings ? warnings.size : 0;
  console.log(
    `[trace-server-runtime] copied ${files.size} traced files to ${path.relative(
      base,
      outDir
    )} (${Math.round((byteCount / 1024 / 1024) * 10) / 10} MB, ${warningCount} trace warnings)`
  );
})();
