# Synctool

Synctool keeps reference material in a project fresh while leaving adoption and modification under the project's control.

## Language

**Reference material**:
External content copied into the project so changes are visible and reviewable in Git.
_Avoid_: dependency, package

**Source**:
An external or local origin that can be materialized before selected content is copied or linked into the project.
_Avoid_: provider, fetcher

**Local source**:
A source whose content already exists on the local filesystem and whose mappings can copy or link reference material into the project.
_Avoid_: local-copy source, symlink source, local adapter

**Materialized source**:
A filesystem location containing a source's content in a form mappings can read from.
_Avoid_: checkout, download directory

**Mapping**:
A configured selection from a materialized source to a destination path in the project.
_Avoid_: copy rule, route

**Reference sync run**:
One execution that materializes sources and applies mappings to refresh reference material for a project.
_Avoid_: sync job, pipeline
