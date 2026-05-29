# Website Downloader

Download the complete source code of any website (including all assets) from the command line.

## Requirements

- [wget](https://www.gnu.org/software/wget/) must be installed and available on your PATH
- Node.js >= 14.14.0

## Usage

```bash
npx website-downloader <url> [options]
```

### Options

| Option | Description |
|---|---|
| `-o, --output <dir>` | Output directory for the zip file (default: current directory) |
| `-n, --name <name>` | Custom name for the output zip file (default: website hostname) |
| `--no-zip` | Skip zipping, just download the files |
| `--no-cleanup` | Keep the downloaded website folder after zipping |
| `--wget-args <args>` | Additional arguments to pass to wget (comma-separated) |
| `-v, --version` | Show version number |
| `-h, --help` | Show help message |

### Examples

```bash
# Download a website
website-downloader https://example.com

# Save to a specific directory
website-downloader https://example.com -o ./downloads

# Custom output name, keep the folder
website-downloader https://example.com -n my-site --no-cleanup

# Limit download speed and add delay
website-downloader https://example.com --wget-args "--wait=1,--limit-rate=500k"
```

## License

MIT
