# Changelog

## 0.1.0 — 2026-10-14
- First version of the `claude-mod-forge` skill, packaged as the `mod-forge` plugin.
- Modes: create, plan, continue, debug, improve, audit, test, package.
- Adaptive interview (A–F tree) and question banks for 14 categories.
- Five reference mods, each passing `claude plugin validate`, strict `tsc` and `claude plugin test`:
  session-dashboard, context-band, shell-guard, git-recap, spinner-counter.
- `scripts/check-mod.mjs`: validate + tsc + tests in one run, without writing into the mod.
- Acceptance (A–J), discovery and regression test definitions.
- Tested with Claude Code 2.1.294 (mods API types 2.1.293).
