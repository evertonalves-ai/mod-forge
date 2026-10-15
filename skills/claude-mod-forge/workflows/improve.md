# Workflow: improve without breaking

1. Run `workflows/continue.md` steps 1–3 to load context and get a baseline.
2. **Baseline.** Save the checker output. If there are no tests, write characterisation tests first: one per
   behaviour the mod has today (each hook's observable effect, each button, each command reply). They must pass
   on the unchanged code. These are the regression suite (`tests/regression-tests.md` lists the usual ones).
3. Interview only for the new behaviour (`references/discovery-and-quiz.md`, usually one round).
4. Change in small steps. After each: checker green, regression tests still green.
5. Keep compatibility unless the user agrees to break it: same command names, same `$.store` keys (or a
   migration that reads the old key), same `userConfig` field names, same pane ids.
6. Bump `version` in `plugin.json` (patch for fixes, minor for features). Installed copies only update on a new version.
7. Update `MOD-SPEC.md`, `DECISIONS.md`, `README.md` and `CHANGELOG.md` (if present) with what changed and why.
8. Report: what changed, what was kept, test count before → after, anything not verified in a real session.
