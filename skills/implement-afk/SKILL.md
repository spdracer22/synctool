---
name: implement-afk
description: "AFK implementation from a spec, ticket, or issue. Use when the user requests autonomous implementation without human interaction."
---

# Implement without human interaction

Implement the supplied spec, ticket, or issue without asking a human for decisions.

## 1. Establish the scope

Read the work source and applicable repository instructions. List every acceptance criterion and any pre-agreed test seams.

Record the starting commit for `/code-review`. Inspect existing changes so you can keep your edits and commits separate from unrelated work. Identify the target remote and PR base from the task or repository workflow.

Resolve questions from the spec and repository evidence. Record assumptions that do not change acceptance outcomes. If a missing decision could change scope, public behavior, or acceptance, stop and report the blocker. Use the same rule when required access or tooling is unavailable.

Proceed when the requirements, review starting point, and publication target are known.

## 2. Implement in tested slices

At pre-agreed seams, use `/tdd`. Supply the recorded agreement so the skill does not need fresh human confirmation. If a behavior change needs a new seam, report the missing agreement as a blocker.

After each slice, run the affected test files and the repository's typechecking and linting commands. Fix failures caused by your changes before continuing. For work without executable checks, record how you verify the acceptance criteria.

Commit each coherent, verified slice. Stage only the changes belonging to this work.

Continue until every acceptance criterion has an implementation and verification evidence.

## 3. Review the complete diff

Use `/code-review` with the recorded starting commit and work source. Address each finding, or record why no change is warranted. Run affected checks after fixes and commit those changes. Repeat the review until no actionable findings remain.

## 4. Verify the final state

Run typechecking, linting, and the full test suite after all review fixes. If a check does not apply, state why. Record commands and results, and distinguish pre-existing failures from regressions. Unresolved failures block publication unless the task explicitly permits them.

Proceed when all acceptance criteria have evidence, the required checks pass, and all changes belonging to this work are committed.

## 5. Push final state

Push the working branch to the identified remote. Summarize the changes, verification results, and assumptions.