# Regression tests

## For the skill
Run after any change to the skill:
1. `node scripts/check-mod.mjs examples/<name>` for all five examples → all green.
   ```bash
   for m in session-dashboard context-band shell-guard git-recap spinner-counter; do node scripts/check-mod.mjs examples/$m || exit 1; done
   ```
2. `claude plugin validate <repo-root>` → passes (manifest + marketplace).
3. Re-run any acceptance case whose reference file changed.

## For a mod being improved (characterisation suite)
Write these before changing code; they must pass before and after:
- each command: reply text for a normal and an invalid argument;
- each `tool.call` hook: an irrelevant tool passes through unchanged; the matching tool gets the documented effect;
- each guard: block path, allow path, fail-closed path;
- each render site: draws on `terminal` and `desktop`; each control by key changes what it should;
- each persisted value: written to `$.store`, reloaded after `classic.SessionStart({ source: 'clear' })`;
- each `userConfig` option: both values via `test(name, { options }, …)`.
