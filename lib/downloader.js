'use strict';

const path = require('path');
const fs = require('fs');
const scrape = require('website-scraper').default;

function getFolderName(url) {
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `http://${url}`;
    const parsed = new URL(normalized);
    return parsed.port ? `${parsed.hostname}:${parsed.port}` : parsed.hostname;
  } catch {
    return '';
  }
}

function download(url, { directory, depth = 1, recursive = true, onProgress, onComplete, onError } = {}) {
  const resolvedDir = path.resolve(directory);
  let completed = false;
  let resourceCount = 0;

  const options = {
    urls: [url],
    directory: resolvedDir,
    recursive,
    maxDepth: recursive ? depth : 0,
    urlFilter: (linkUrl) => {
      try {
        const baseHost = new URL(url).hostname;
        const linkHost = new URL(linkUrl).hostname;
        return linkHost === baseHost || linkHost.endsWith('.' + baseHost);
      } catch {
        return false;
      }
    },
    sources: [
      { selector: 'img', attr: 'src' },
      { selector: 'img', attr: 'srcset' },
      { selector: 'link[rel="stylesheet"]', attr: 'href' },
      { selector: 'script', attr: 'src' },
      { selector: 'source', attr: 'src' },
      { selector: 'source', attr: 'srcset' },
      { selector: 'video', attr: 'src' },
      { selector: 'audio', attr: 'src' },
      { selector: 'object', attr: 'data' },
      { selector: 'embed', attr: 'src' },
      { selector: 'link[rel="icon"]', attr: 'href' },
      { selector: 'link[rel="shortcut icon"]', attr: 'href' },
    ],
    onResourceSaved: () => {
      resourceCount++;
      if (onProgress) {
        onProgress(`Downloaded ${resourceCount} resources`);
      }
    },
    onResourceError: (resource) => {
      if (onProgress) {
        onProgress(`Warning: failed to download ${resource.url}`);
      }
    },
  };

  scrape(options)
    .then(() => {
      if (completed) return;
      completed = true;
      if (onComplete) onComplete(resolvedDir, null);
    })
    .catch((err) => {
      if (completed) return;
      completed = true;
      if (onError) onError(err);
      if (onComplete) onComplete(null, err);
    });
}

function cleanup(folder) {
  const dir = path.resolve(folder);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

module.exports = { download, getFolderName, cleanup };
