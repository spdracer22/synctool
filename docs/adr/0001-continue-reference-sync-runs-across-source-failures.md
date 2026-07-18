# Continue reference sync runs across source failures

A reference sync run should fail fast within a source but continue to later sources when one source fails. This maximizes useful refreshed reference material while still returning per-source results so the CLI can exit non-zero when any source failed.

## Consequences

A source is failed if materialization fails or any mapping for that source fails; remaining mappings for that source are skipped. The reference sync run still guarantees cleanup after partial failure.
