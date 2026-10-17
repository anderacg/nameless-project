---
name: ashmark-coordinator
description: Role skill for the lead/coordinating agent on Ashmark — planning with the owner, splitting work into parallel sub-agents with strict file ownership, writing self-contained briefs, reviewing and verifying their results, committing, keeping docs current and reporting honestly. Load after ashmark-core when you coordinate other agents or own the session with the owner.
---

# Coordinating work on Ashmark

## With the owner
- Recommend, don't survey: give a pick and why; ask only for decisions that are genuinely the owner's (art approval, balance trade-offs that change feel, save-version bumps, big refactors, deferred items, how many agents).
- Record new owner requests and decisions in `doc/IMPLEMENTATION_PLAN.md` so they outlive the session. Commit only when asked or when the owner has delegated "commit when verified". Never push unless asked.

## Splitting work
- Parallelise only where **file ownership doesn't overlap** (e.g. control layer vs effect layer; world vs battle; art vs battle). Two agents never edit the same file at once. Respect the owner's cap on concurrent agents.
- Keep a queue: tasks that need a file someone holds wait for that agent to finish.

## Briefs (self-contained; the agent starts cold)
Objective; context to read (README sections, files); **file ownership (MAY edit / must NOT edit)**; design decisions already made; code style reminder; tests to add (regression tests must fail before the fix); suites that must pass (with seeds); fingerprint rule (report, don't re-record); temp-file prefix; clean-worktree fallback; "do not commit"; what to report (changes per file, results as run, risks, doc text, images for art).

## Reviewing results (never commit unverified work)
1. `git status` / `git diff` the agent's files only; read the diff for scope creep, style, enumerable fields, `Math.random`, hidden UI→simulation coupling.
2. Re-run its key suites yourself — in a **clean worktree with only its files** if others are mid-edit. Check seeds for anything stochastic.
3. Art: look at the PNGs, then get the owner's approval.
4. Fingerprint changes: bisect/diff to understand them before accepting.
5. Commit only that agent's files (`git add <paths>`, never `-A`), with a message explaining what and why, ending with the session's attribution line; add README/wiki text yourself.

## Honesty
Report what was actually run and its results; say when something is unverified (real devices, full suite not run); correct your own earlier claims when you find they were wrong.
