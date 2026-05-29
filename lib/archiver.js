'use strict';

const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

function zip(folder, outputPath, { onProgress, onComplete, onError } = {}) {
  const resolvedFolder = path.resolve(folder);
  const resolvedOutput = path.resolve(outputPath);

  if (!fs.existsSync(resolvedFolder)) {
    const err = new Error(`Folder not found: ${resolvedFolder}`);
    if (onError) onError(err);
    if (onComplete) onComplete(null, err);
    return null;
  }

  const outputDir = path.dirname(resolvedOutput);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const output = fs.createWriteStream(resolvedOutput);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    const size = archive.pointer();
    if (onComplete) onComplete({ size, path: resolvedOutput }, null);
  });

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      if (onProgress) onProgress(`Warning: ${err.message}`);
    } else if (onError) {
      onError(err);
    }
  });

  archive.on('error', (err) => {
    if (onError) onError(err);
    if (onComplete) onComplete(null, err);
  });

  archive.on('progress', (data) => {
    if (onProgress) {
      onProgress(`Compressing: ${data.entries.processed} files processed, ${(data.fs.processedBytes / 1024 / 1024).toFixed(1)} MB`);
    }
  });

  archive.pipe(output);

  const folderName = path.basename(resolvedFolder);
  archive.directory(resolvedFolder, folderName);

  archive.finalize();

  return { archive, output, path: resolvedOutput };
}

module.exports = { zip };
