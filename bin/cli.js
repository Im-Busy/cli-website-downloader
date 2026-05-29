#!/usr/bin/env node
'use strict';

const path = require('path');
const { download, cleanup, getFolderName } = require('../lib/downloader');
const { zip } = require('../lib/archiver');

const VERSION = require('../package.json').version;

function showHelp() {
  console.log(`
Website Downloader v${VERSION} - Download the complete source code of any website

Usage:
  website-downloader <url> [options]

Options:
  -o, --output <dir>    Output directory for the zip file (default: current directory)
  -n, --name <name>     Custom name for the output zip file (default: website hostname)
  -d, --depth <n>       Max recursion depth for following links (default: 1)
  --no-recursive        Download only the given page, do not follow links
  --no-zip              Skip zipping, just download the files
  --no-cleanup          Keep the downloaded website folder after zipping
  -v, --version         Show version number
  -h, --help            Show this help message

Examples:
  website-downloader https://example.com
  website-downloader https://example.com -o ./downloads -d 3
  website-downloader https://example.com -n my-site --no-recursive
  website-downloader https://example.com --no-zip --no-cleanup
`);
  process.exit(0);
}

function showVersion() {
  console.log(VERSION);
  process.exit(0);
}

function parseArgs(argv) {
  const options = {
    url: null,
    output: '.',
    name: null,
    zip: true,
    cleanup: true,
    depth: 1,
    recursive: true,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '-v':
      case '--version':
        options.version = true;
        break;
      case '-o':
      case '--output':
        options.output = argv[++i] || '.';
        break;
      case '-n':
      case '--name':
        options.name = argv[++i] || '';
        break;
      case '-d':
      case '--depth':
        options.depth = parseInt(argv[++i], 10) || 1;
        break;
      case '--no-recursive':
        options.recursive = false;
        break;
      case '--no-zip':
        options.zip = false;
        break;
      case '--no-cleanup':
        options.cleanup = false;
        break;
      default:
        if (!arg.startsWith('-') && !options.url) {
          options.url = arg;
        }
        break;
    }
  }

  return options;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) showHelp();
  if (options.version) showVersion();
  if (!options.url) showHelp();

  const siteName = options.name || getFolderName(options.url);
  if (!siteName) {
    console.error('Error: Could not parse a hostname from the URL.');
    process.exit(1);
  }

  const outputDir = path.resolve(options.output, siteName);
  const zipPath = path.resolve(options.output, `${siteName}.zip`);
  const startTime = Date.now();
  let lastProgress = '';

  const handleInterrupt = () => {
    console.log('\n\nCancelled by user.');
    cleanup(outputDir);
    cleanup(zipPath);
    process.exit(130);
  };

  process.on('SIGINT', handleInterrupt);
  process.on('SIGTERM', handleInterrupt);

  console.log(`\nDownloading: ${options.url}`);
  console.log(`Output: ${zipPath}`);
  console.log(`Depth: ${options.recursive ? options.depth : 'none (single page)'}`);
  console.log('');

  download(options.url, {
    directory: outputDir,
    depth: options.depth,
    recursive: options.recursive,
    onProgress: (msg) => {
      if (msg !== lastProgress) {
        lastProgress = msg;
        process.stdout.write(`\r  ${msg}`);
      }
    },
    onComplete: (dir, err) => {
      process.removeListener('SIGINT', handleInterrupt);
      process.removeListener('SIGTERM', handleInterrupt);

      if (err) {
        console.error(`\n\nError downloading: ${err.message}`);
        cleanup(outputDir);
        process.exit(1);
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n\nDownload complete in ${elapsed}s`);

      if (!options.zip) {
        console.log(`Website saved to: ${dir}`);
        return;
      }

      console.log(`Compressing to: ${zipPath}`);

      zip(outputDir, zipPath, {
        onProgress: (msg) => {
          process.stdout.write(`\r  ${msg}`);
        },
        onComplete: (result, zipErr) => {
          if (zipErr) {
            console.error(`\n\nError creating zip: ${zipErr.message}`);
            process.exit(1);
          }

          const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`\n\nZip created: ${result.path} (${formatBytes(result.size)})`);
          console.log(`Total time: ${totalTime}s`);

          if (options.cleanup) {
            cleanup(outputDir);
          } else {
            console.log(`Website folder kept at: ${outputDir}`);
          }

          process.exit(0);
        },
        onError: (zipErr) => {
          console.error(`\n\nError creating zip: ${zipErr.message}`);
          process.exit(1);
        },
      });
    },
    onError: (err) => {
      console.error(`\n\nError: ${err.message}`);
      cleanup(outputDir);
      process.exit(1);
    },
  });
}

main();
