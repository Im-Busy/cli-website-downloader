'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function getFolderName(url) {
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `http://${url}`;
    const parsed = new URL(normalized);
    return parsed.port ? `${parsed.hostname}:${parsed.port}` : parsed.hostname;
  } catch {
    return '';
  }
}

function download(url, { onProgress, onComplete, onError, extraArgs = [] } = {}) {
  const args = ['-mkEpnp', '--no-if-modified-since', ...extraArgs, url];
  const child = spawn('wget', args, { cwd: process.cwd() });
  let folderName = '';
  let called = false;

  child.stderr.on('data', (data) => {
    const text = data.toString();
    if (!folderName) {
      const match = text.match(/Resolving\s+([^\s]+)\s+\(/);
      if (match && match[1]) {
        folderName = match[1];
      }
    }
    if (onProgress) onProgress(text);
  });

  child.on('close', (code) => {
    if (called) return;
    called = true;

    if (code !== 0) {
      if (onComplete) onComplete(null, new Error(`wget exited with code ${code}`));
      return;
    }

    const folder = folderName || getFolderName(url);
    if (!folder) {
      if (onComplete) onComplete(null, new Error('Unable to determine downloaded website folder.'));
      return;
    }
    if (onComplete) onComplete(folder, null);
  });

  child.on('error', (err) => {
    if (called) return;
    called = true;
    if (onError) onError(err);
  });

  return child;
}

function cleanup(folder) {
  const dir = path.resolve(folder);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

module.exports = { download, getFolderName, cleanup };
