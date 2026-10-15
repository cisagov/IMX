# Dependency updates

The central Renovate runner in `eos/cde/elm/renovate` maintains this repository.
Its GitLab pipeline schedule owns execution. IMX does not need a separate
Renovate job, schedule, or bot token.

Renovate first reads `renovate.json` from the repository's default branch, which
is `main`. That configuration selects both `beta-clean` and `main` as update
targets. `useBaseBranchConfig: merge` also loads `beta-clean`'s configuration for
its monorepo tool locks. Putting a branch selection only on `beta-clean` would
not enroll that branch.

The shared preset defines the weekly update window, grouping, concurrency
limits, and major-version approval policy. Updates targeting legacy `main`
require individual approval in the Dependency Dashboard. Approve a small
number at a time because explicit dashboard requests can bypass ordinary
creation limits and schedules. CI and human review are still required before
merging.

Application manifests and their npm and uv lockfiles remain managed on `main`.
Its existing mise configuration uses floating tool selectors without a tool
lockfile, so those selectors do not provide reviewable resolved tool updates.
Use the pinned monorepo toolchain on `beta-clean` for ongoing tool maintenance.

When `main` is retired, remove it from `baseBranchPatterns` in the default
branch's configuration and remove its approval rule. If the default branch
changes, carry the branch-selection configuration into the new default branch.

Keep the shared preset reference as a relative `local>` project path. Endpoint
addresses, runner images, registry credentials, and bot credentials belong in
the central runner's CI configuration.
