'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const SCRIPT_EXTENSIONS = new Set(['.js', '.ts']);
const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.idea',
  '.vscode',
  'node_modules',
  'release',
  'dist',
  'out',
  'coverage'
]);

async function listScripts(rootDirectory) {
  if (!rootDirectory) {
    throw new Error('A script directory is required.');
  }

  const root = path.resolve(rootDirectory);
  const scripts = [];
  await walk(root, root, scripts);

  return scripts.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function walk(root, currentDirectory, scripts) {
  const entries = await fs.readdir(currentDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDirectory, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        await walk(root, fullPath, scripts);
      }
      continue;
    }

    if (!entry.isFile() || !SCRIPT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    const stat = await fs.stat(fullPath);
    scripts.push({
      name: entry.name,
      path: fullPath,
      relativePath: path.relative(root, fullPath),
      size: stat.size,
      modifiedAt: stat.mtime.toISOString()
    });
  }
}

async function readScript(filePath) {
  if (!filePath) {
    throw new Error('A script file path is required.');
  }

  const resolvedPath = path.resolve(filePath);
  const source = await fs.readFile(resolvedPath, 'utf8');
  const stat = await fs.stat(resolvedPath);

  return {
    filePath: resolvedPath,
    name: path.basename(resolvedPath),
    source,
    modifiedAt: stat.mtime.toISOString()
  };
}

async function writeScript(filePath, source) {
  if (!filePath) {
    throw new Error('A script file path is required.');
  }

  const resolvedPath = path.resolve(filePath);
  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.writeFile(resolvedPath, source, 'utf8');
  const stat = await fs.stat(resolvedPath);

  return {
    filePath: resolvedPath,
    name: path.basename(resolvedPath),
    modifiedAt: stat.mtime.toISOString()
  };
}

module.exports = {
  listScripts,
  readScript,
  writeScript
};
