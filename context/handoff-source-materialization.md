# Handoff: Source materialization refactor

## Summary

This session refactored `synctool` source handling so source-specific handlers are only responsible for materializing source data into a path, while `src/index.ts` owns mappings and copy behavior.

The user disliked the prior `SyncSource = (from, to) => Promise<void>` abstraction because it forced each source into the same generic function shape and required `index.ts`/`createSource` to convert typed source config into a generic object. The agreed direction was to keep source handlers focused on getting data from the source into a temp/source path, and centralize mapping/copy/modifier behavior in `index.ts`.

## Key decisions and requirements

- Mappings should be handled by `src/index.ts`, not by source handlers.
- Source handlers should not know about `mappings`.
- Source-specific schemas should define only source-specific input fields.
- A generic/envelope schema should add common config properties:
  - `type`
  - `mappings`
- Source handlers should accept their input object directly and return a materialized source path.
- `index.ts` copies from the materialized source path using each mapping's `from`/`to` values.
- This structure is intended to support future sync modifiers, such as `unzip`, in `index.ts` without changing individual source handlers.
- Local copy does not require temp materialization; it currently returns the configured local path for consistency with the materialized source pattern.
- `ora` spinners should be created with `discardStdin: false` because the process appeared to hang in Bun/TTY until Enter was pressed.

## Current implementation

Important files:

- `src/index.ts`
  - Loads config.
  - Creates temp/reference dirs.
  - Calls `materializeSource(dep, { tempDir })` once per source.
  - Iterates `dep.mappings`.
  - Copies `path.join(sourcePath, map.from)` to `path.join(refDir, map.to)`.
  - Uses a local `createSpinner()` helper with `ora({ text, discardStdin: false }).start()`.

- `src/schemas/source-envelope.ts`
  - Defines `SourceEnvelopeSchema(type, schema)`.
  - Extends source input schemas with `type` and `mappings`.

- `src/schemas/source-git.ts`
  - Defines `GitInputSchema` with `repo` only.
  - Defines `GitSourceSchema = SourceEnvelopeSchema('git', GitInputSchema)`.

- `src/schemas/source-curl.ts`
  - Defines `CurlInputSchema` with `url` only.
  - Defines `CurlSourceSchema = SourceEnvelopeSchema('curl', CurlInputSchema)`.

- `src/schemas/source-local.ts`
  - Defines `LocalCopyInputSchema` with `path` only.
  - Defines `LocalCopySourceSchema = SourceEnvelopeSchema('local-copy', LocalCopyInputSchema)`.

- `src/lib/materializeSource.ts`
  - Dispatches by `source.type` and returns a materialized path.

- `src/lib/SourceContext.ts`
  - Defines `{ tempDir: string }`.

- `src/sources/GitSource.ts`
  - Clones the git repo into a temp subdirectory and returns that clone path.

- `src/sources/CurlSource.ts`
  - Downloads the URL to `<temp-subdir>/download` and returns the temp subdirectory.
  - Because mappings are now handled centrally, a curl mapping can use `from: "download"` to copy the downloaded file.

- `src/sources/LocalCopySource.ts`
  - Returns `source.path` directly.

Deleted/replaced concepts:

- `src/schemas/SyncSource.ts` was removed.
- `src/sources/createSource.ts` was replaced by `src/lib/materializeSource.ts`.

## Validation

`bun run check` passed after the refactor.

The command `bun run src/index.ts` was tested and completed successfully in the harness. The user had reported a hang at the last source until pressing Enter; this was attributed to `ora`'s default stdin discarding behavior and fixed by using `discardStdin: false`.

## Commit message suggested

```text
Refactor source handling around materialized sources

- Replace generic SyncSource abstraction with source materialization flow
- Add source envelope schema helper for type, mappings, and source inputs
- Keep mappings out of source-specific schemas
- Update source handlers to materialize data and return a source path
- Move mapping copy behavior into index.ts
- Rename source dispatcher to materializeSource
- Disable ora stdin discarding to avoid Bun TTY hangs
```

## Notes for next agent

- The working tree appeared clean when this handoff was written, so the user or environment may already have committed the changes.
- If adding modifiers such as `unzip`, implement them near the mapping/copy pipeline in `src/index.ts` or extract that pipeline into a lib module; avoid putting modifier logic into source handlers.
- Preserve the design boundary: sources materialize, index/lib sync pipeline transforms and copies.
