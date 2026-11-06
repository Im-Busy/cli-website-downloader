# CLI Website Downloader

Download public HTML pages and supported linked assets from a website, with
optional recursive crawling and ZIP output.

This is a Node.js CLI around `website-scraper` and `archiver`. It saves
client-visible resources; it cannot retrieve server-side source code,
databases or a complete working copy of an arbitrary web application.

## Install

```bash
npm install -g cli-website-downloader
```

This command requires the package to be available in your configured npm
registry. Registry availability was not checked for this documentation
update. Use Node.js 22.12 or newer with synchronous ESM loading. Although the
package declares a minimum of 14.14, its CommonJS loader uses `require()` on
the ESM-only `website-scraper` 5.x dependency. Older Node versions can fail
before displaying help. See Node's
[CommonJS module documentation](https://nodejs.org/docs/latest-v22.x/api/modules.html#loading-ecmascript-modules-using-require)
for the runtime requirement. The older package-engine declaration remains
unchanged in this documentation patch.

To install from source:

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
# Start at this page, following links to the default depth of 1
website-downloader https://example.com

# Deep crawl up to 3 levels
website-downloader https://example.com -d 3

# Request only this page and its supported assets
website-downloader https://example.com --no-recursive

# Custom output directory and name
website-downloader https://example.com -o ./archives -n my-backup

# Download without zipping; the raw folder remains
website-downloader https://example.com --no-zip --no-cleanup
```

## How It Works

The CLI passes the starting URL and recursion depth to
[website-scraper](https://github.com/website-scraper/node-website-scraper).
Its URL filter permits the starting hostname and its subdomains; it excludes
other hosts, including external asset CDNs. Configured selectors cover images,
stylesheets, scripts, selected media and icons. Resource coverage and link
rewriting depend on the scraper and the target site.

Files are saved under `<output>/<name>/`. ZIP mode creates
`<output>/<name>.zip` and removes the downloaded folder after successful
archiving unless `--no-cleanup` is set. `--no-zip` leaves the folder in place.
Use a new output name to avoid conflicts with earlier downloads.

There is no browser-rendering adapter in this source. JavaScript-generated
content, login-only pages, unsupported resources and failed downloads can
leave an incomplete offline copy. The CLI may report individual resource
failures; completing the crawl does not prove that every resource was saved.

## Checks

`npm test` invokes the CLI's help output. It does not test crawling, archive
contents or offline rendering. These behaviors were not exercised during
this documentation update.

## License

MIT
