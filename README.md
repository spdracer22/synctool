# synctool

Synctool is a CLI tool that pulls specific directories from external Git repositories and syncs them into your local project. It's useful for aggregating reference documentation, templates, or other resources from multiple sources into a single location.

## Quick Start

### Installation

This project uses the [Bun](https://bun.sh) runtime. Install Bun first, then install the CLI globally from this repository or from npm after publishing:

```bash
# from a local checkout
bun install -g .
# or
npm install -g .

# after publishing
bun install -g @spdracer22/synctool
# or
npm install -g @spdracer22/synctool
```

### Create a Configuration File

In your project root, create a `synctool.json` file that defines what to sync:

```json
{
  "sources": [
    {
      "type": "git",
      "repo": "https://github.com/example/repo.git",
      "mappings": [
        {
          "from": "docs/guides",
          "to": "references/example-guides"
        }
      ]
    }
  ]
}
```

### Run synctool

```bash
synctool
```

This will clone the specified repos (using sparse checkout for efficiency), copy the mapped directories to their configured `to` paths relative to the directory containing `synctool.json`, and clean up temporary files.

## Configuration

### synctool.json Schema

**`sources`** (array, required)  
A list of external sources to pull from. Each source has:

- **`type`** (string) — Source type: `git`, `curl`, or `local-copy`
- For `git`: **`repo`** (string) — The Git URL of the repository to clone
- For `curl`: **`url`** (string) — The URL of the file to download
  - **`unzip`** (boolean, optional, default `false`) — Unzip the downloaded file before applying mappings
- **`mappings`** (array) — One or more source→destination mappings
  - **`from`** (string) — Relative path within the source to pull (ignored for non-unzipped `curl` downloads)
  - **`to`** (string) — Destination path relative to the directory containing `synctool.json`

Mapping paths must be relative paths and must not escape their base directory. Absolute paths such as `C:/users/me/somedir/mattpocock/skills` or paths containing `..` are rejected.

### Example Configuration

```json
{
  "sources": [
    {
      "type": "git",
      "repo": "https://github.com/vercel/next.js.git",
      "mappings": [
        {
          "from": "docs/api-routes",
          "to": "references/nextjs-api-docs"
        },
        {
          "from": "examples",
          "to": "references/nextjs-examples"
        }
      ]
    },
    {
      "type": "git",
      "repo": "https://github.com/microsoft/TypeScript.git",
      "mappings": [
        {
          "from": "doc/spec.md",
          "to": "references/typescript-spec"
        }
      ]
    }
  ]
}
```

When you run synctool, it will create:
- `references/nextjs-api-docs/` (contents of `docs/api-routes`)
- `references/nextjs-examples/` (contents of `examples`)
- `references/typescript-spec/` (contents of `doc/spec.md`)

## How It Works

Synctool uses [sparse checkout](https://git-scm.com/docs/git-sparse-checkout) to efficiently clone only the directories you need, rather than downloading entire repositories. For each mapping, it:

1. Creates a temporary directory
2. Clones the repo with sparse checkout
3. Copies the mapped directory to the configured `to` path relative to `synctool.json`
4. Cleans up temporary files

This makes syncing large repositories fast and storage-efficient.

## Troubleshooting

**"synctool.json not found"**  
Synctool looks for `synctool.json` in the current directory and parent directories. Make sure the file exists and is in the right location.

**Git clone fails**  
Ensure you have Git installed and can access the repositories specified in your config. For private repos, you may need SSH keys or personal access tokens configured.

**Permission errors on cleanup**  
If cleanup fails, try removing the `.tmp` directory manually: `rm -rf .tmp`
