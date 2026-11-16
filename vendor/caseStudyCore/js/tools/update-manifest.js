'use strict';

// Writes core/manifest.json: the sha256 of every file a consumer vendors, and
// one tree hash over them. See core/spec/versioning.md.
//   node js/tools/update-manifest.js          (from core/)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const coreDir = path.join(__dirname, '..', '..');
const ROOTS = ['schema', 'fixtures', 'spec', 'js', 'php'];

function walk(relative, out) {
  for (const entry of fs.readdirSync(path.join(coreDir, relative), { withFileTypes: true })) {
    // Editor and package manager leftovers are not part of the core.
    if (entry.name.startsWith('.') || /^(package-lock[.]json|yarn[.]lock|pnpm-lock[.]yaml|Thumbs[.]db)$/.test(entry.name)) continue;
    const child = relative + '/' + entry.name;
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walk(child, out);
    } else if (entry.isFile()) {
      out.push(child);
    }
  }
}

function listManifestFiles() {
  const files = [];
  for (const root of ROOTS) walk(root, files);
  return files.sort(); // paths are ASCII, so this is byte order (LC_ALL=C)
}

function hashFile(relative) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(coreDir, relative))).digest('hex');
}

// sha256 over "<hash>  <path>\n" for every file in byte order of path (LC_ALL=C).
function treeHash(files) {
  const lines = Object.keys(files).sort().map((file) => files[file] + '  ' + file + '\n').join('');
  return crypto.createHash('sha256').update(lines).digest('hex');
}

function buildManifest() {
  const index = require('..');
  const files = {};
  for (const file of listManifestFiles()) files[file] = hashFile(file);
  return {
    core_version: index.CORE_VERSION,
    schema_version: index.SCHEMA_VERSION,
    tree_sha256: treeHash(files),
    files,
  };
}

if (require.main === module) {
  const manifest = buildManifest();
  fs.writeFileSync(path.join(coreDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('manifest.json written: ' + Object.keys(manifest.files).length + ' files, tree ' + manifest.tree_sha256);
}

module.exports = { listManifestFiles, hashFile, treeHash, buildManifest };
