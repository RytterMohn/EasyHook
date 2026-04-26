'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const directories = ['src', 'examples', 'scripts'];
const ignored = new Set(['node_modules', 'release', 'dist', 'out', '.git']);
const files = [];

for (const directory of directories) {
  collect(path.join(root, directory));
}

for (const file of files) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}

console.log(`Checked ${files.length} JavaScript file(s).`);

function collect(currentPath) {
  if (!fs.existsSync(currentPath)) {
    return;
  }

  const stat = fs.statSync(currentPath);
  if (stat.isDirectory()) {
    if (ignored.has(path.basename(currentPath))) {
      return;
    }

    for (const entry of fs.readdirSync(currentPath)) {
      collect(path.join(currentPath, entry));
    }
    return;
  }

  if (stat.isFile() && path.extname(currentPath) === '.js') {
    files.push(currentPath);
  }
}
