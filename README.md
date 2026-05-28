# synctool

Synctool is a CLI tool that pulls specific directories from external Git repositories and syncs them into your local project. It's useful for aggregating reference documentation, templates, or other resources from multiple sources into a single location.

## Quick Start

### Installation

This project uses [Bun](https://bun.sh). Install it if you haven't already, then:

```bash
bun install
```

### Create a Configuration File

In your project root, create a `synctool.json` file that defines what to sync:

```json
{
  "references-dir": "references",
  "dependencies": [
    {
      "repo": "https://github.com/example/repo.git",
      "mappings": [
        {
          "from": "docs/guides",
          "to": "example-guides"
        }
      ]
    }
  ]
}
```

### Run synctool

```bash
bun src/index.ts
```

This will clone the specified repos (using sparse checkout for efficiency), copy the mapped directories into your `references-dir`, and clean up temporary files.

## Configuration

### synctool.json Schema

**`references-dir`** (string, required)  
The local directory where synced content will be placed. This is created relative to wherever your `synctool.json` file lives.

**`dependencies`** (array, required)  
A list of external repositories to pull from. Each dependency has:

- **`repo`** (string) — The Git URL of the repository to clone
- **`mappings`** (array) — One or more source→destination mappings
  - **`from`** (string) — Path within the repo to pull (e.g., `docs/guides`)
  - **`to`** (string) — Relative path within `references-dir` to place it

### Example Configuration

```json
{
  "references-dir": "references",
  "dependencies": [
    {
      "repo": "https://github.com/vercel/next.js.git",
      "mappings": [
        {
          "from": "docs/api-routes",
          "to": "nextjs-api-docs"
        },
        {
          "from": "examples",
          "to": "nextjs-examples"
        }
      ]
    },
    {
      "repo": "https://github.com/microsoft/TypeScript.git",
      "mappings": [
        {
          "from": "doc/spec.md",
          "to": "typescript-spec"
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
3. Copies the mapped directory to your `references-dir`
4. Cleans up temporary files

This makes syncing large repositories fast and storage-efficient.

## Troubleshooting

**"synctool.json not found"**  
Synctool looks for `synctool.json` in the current directory and parent directories. Make sure the file exists and is in the right location.

**Git clone fails**  
Ensure you have Git installed and can access the repositories specified in your config. For private repos, you may need SSH keys or personal access tokens configured.

**Permission errors on cleanup**  
If cleanup fails, try removing the `.tmp` directory manually: `rm -rf .tmp`
