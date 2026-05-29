#!/usr/bin/env node
'use strict';

const path = require('path');
const { download, cleanup, getFolderName } = require('../lib/wget');
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
  --no-zip              Skip zipping, just download the files
  --no-cleanup          Keep the downloaded website folder after zipping
  --wget-args <args>    Additional arguments to pass to wget (comma-separated)
  -v, --version         Show version number
  -h, --help            Show this help message

Examples:
  website-downloader https://example.com
  website-downloader https://example.com -o ./downloads
  website-downloader https://example.com -n my-site --no-cleanup
  website-downloader https://example.com --wget-args "--wait=1,--limit-rate=500k"
  website-downloader https://example.com --no-zip
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
    extraArgs: [],
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
      case '--no-zip':
        options.zip = false;
        break;
      case '--no-cleanup':
        options.cleanup = false;
        break;
      case '--wget-args':
        options.extraArgs = (argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
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

  const zipPath = path.resolve(options.output, `${siteName}.zip`);
  const startTime = Date.now();
  let lastProgress = '';
  let wgetProcess = null;

  const handleInterrupt = () => {
    console.log('\n\nCancelled by user.');

    if (wgetProcess) {
      wgetProcess.kill('SIGTERM');
    }

    const siteFolder = options.name || getFolderName(options.url);
    if (siteFolder) {
      cleanup(siteFolder);
      cleanup(zipPath);
    }

    process.exit(130);
  };

  process.on('SIGINT', handleInterrupt);
  process.on('SIGTERM', handleInterrupt);

  console.log(`\nDownloading: ${options.url}`);
  console.log(`Output: ${zipPath}`);
  if (options.extraArgs.length) {
    console.log(`Extra wget args: ${options.extraArgs.join(' ')}`);
  }
  console.log('');

  wgetProcess = download(options.url, {
    extraArgs: options.extraArgs,
    onProgress: (text) => {
      const lines = text.trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          const trimmed = line.trim();
          if (trimmed !== lastProgress) {
            lastProgress = trimmed;
            process.stdout.write(`\r  ${trimmed.substring(0, 80)}`);
          }
        }
      }
    },
    onComplete: (folder, err) => {
      // Remove interrupt handler after wget completes — archiver handles its own cleanup
      process.removeListener('SIGINT', handleInterrupt);
      process.removeListener('SIGTERM', handleInterrupt);

      if (err) {
        console.error(`\n\nError downloading: ${err.message}`);
        process.exit(1);
      }

      if (!folder) {
        console.error('\n\nError: Could not determine downloaded folder name.');
        process.exit(1);
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n\nDownload complete in ${elapsed}s`);

      if (!options.zip) {
        console.log(`Website saved to: ${path.resolve(folder)}`);
        return;
      }

      console.log(`Compressing to: ${zipPath}`);

      zip(folder, zipPath, {
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
            cleanup(folder);
          } else {
            console.log(`Website folder kept at: ${path.resolve(folder)}`);
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
      if (err.code === 'ENOENT') {
        console.error('\n\nError: wget is not installed. Please install wget first:');
        console.error('  Windows: choco install wget  or  scoop install wget');
        console.error('  macOS:   brew install wget');
        console.error('  Linux:   apt install wget  or  yum install wget');
      } else {
        console.error(`\n\nError: ${err.message}`);
      }
      process.exit(1);
    },
  });
}

main();
