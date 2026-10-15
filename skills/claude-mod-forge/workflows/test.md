# Workflow: test a mod

Report each level separately; never let a lower level stand in for a higher one.

| Level | How | Proves |
|---|---|---|
| 1. Structural | `claude plugin validate <mod>` | manifest, module scan, state contract, what it hooks and calls |
| 2. Types | strict `tsc` against this build's `.d.ts` (the checker does it) | the code matches the API of this version |
| 3. Unit / kit | `claude plugin test <mod>` | hook logic, results, drawings as trees, per surface |
| 4. Real session | hot reload or `claude --plugin-dir <mod>` | it loads, draws, responds to keys, in this terminal/desktop |

Run 1–3 with `node scripts/check-mod.mjs <mod>`.

## What the tests must cover
Use `templates/test-plan.md`. At minimum, for each hook: the matching event and an irrelevant one; normal
continuation (`next` reached); the rewrite or block path; a failing `$` call (stub returning `{ deny }`);
invalid input. For UI: mount on `terminal` and `desktop`, press/type/select by key, empty state, and (if state is
reloaded) `classic.SessionStart` with `source: 'clear'`. For guards: fail-closed behaviour.

## Level 4 checklist (ask the user to do what you cannot see)
- `/plugin` lists the mod as active.
- The command appears when typing `/`.
- The pane/band draws; tab hotkeys work after focusing (Ctrl+X Tab or opened with `focus`).
- Resize the terminal narrow and wide; the layout holds.
- Desktop app (if relevant): the same view draws.
- For guards: trigger the rule once on purpose with a harmless command.

Write results to the mod's `TEST-PLAN.md`: what ran, pass/fail, what was not run and why.
Never write "tested in the terminal" unless a session actually showed it.
