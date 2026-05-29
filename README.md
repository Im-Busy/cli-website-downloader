# CLI Website Downloader

Download the complete source code of any website (including all assets) from the command line.
**No system dependencies required** — just Node.js.

## Install

```bash
npm install -g cli-website-downloader
```

Or clone and link:

```bash
git clone https://github.com/Im-Busy/cli-website-downloader.git
cd cli-website-downloader
npm install
npm link
```

## Usage

```bash
website-downloader <url> [options]
```

### Options

| Flag | Description |
|------|-------------|
| `-o, --output <dir>` | Output directory for the zip file (default: current directory) |
| `-n, --name <name>`  | Custom name for the output zip file (default: website hostname) |
| `-d, --depth <n>`    | Max recursion depth for following links (default: 1) |
| `--no-recursive`     | Download only the given page, do not follow links |
| `--no-zip`           | Skip zipping, just download the files |
| `--no-cleanup`       | Keep the downloaded website folder after zipping |
| `-v, --version`      | Show version number |
| `-h, --help`         | Show help message |

### Examples

```bash
# Download a single page + its assets (CSS, images, JS)
website-downloader https://example.com

# Deep crawl up to 3 levels
website-downloader https://example.com -d 3

# Single page only, no linked pages
website-downloader https://example.com --no-recursive

# Custom output directory and name
website-downloader https://example.com -o ./archives -n my-backup

# Download without zipping, keep the raw folder
website-downloader https://example.com --no-zip --no-cleanup
```

## How It Works

Uses [website-scraper](https://github.com/website-scraper/node-website-scraper) to recursively download a website and all its assets (CSS, JS, images, fonts, videos). All links are rewritten to relative paths for offline viewing. The result is compressed into a ZIP archive using archiver.

## License

MIT
