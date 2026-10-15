# Workflow: debug a mod

Reproduce, find the cause, fix the cause, prove it with a test. Do not guess.

## 1. Static picture
`node scripts/check-mod.mjs <mod>`. The validate step answers most "does nothing" cases:
- no `hooks:` line → `hooks/hooks.json` has no `modules` key;
- an event missing from `hooks:` → misspelled event, or the name is not a string literal;
- `is not declared` / `takes a source the scan can read` → `$.state` contract or non-literal atom ref;
- `$.ui is used as a value` → `$` or a namespace was destructured or stored.

## 2. Can mods load at all?
`claude plugin test` from a folder with no mod: `no hooks module to load` means yes. `turned off here` means
`disableAllHooks` or policy. `allowManagedModsOnly` is not reported there; check the debug log.

## 3. Runtime evidence
- Session that hot-reloads (dev-mods with hot reload on, or `--plugin-dir`): dim transcript lines name the mod,
  the event and the reason (`hook skipped: threw …`, `ui.render (Pane) refused: …`, `reload failed …`).
- Installed mod: `claude --debug-file ./mod.log`, then search the file for the mod name. A loaded mod has
  `hooks module <name>@… loaded (…); events: …`.
- `/plugin` shows `N mods active · <names>`.

## 4. Symptom → usual cause
| Symptom | Cause |
|---|---|
| Pane never appears | opened unasked in < 144 columns (`isPlaced: false`); open it from a command or button |
| Pane shows the engine's content | tree did not validate: element missing on the surface, bad prop, bad `borderStyle` |
| Value resets on save | kept in a module variable; move it to `$.state` (session) or `$.store` (across sessions) |
| Value resets after `/clear` | reload it in `classic.SessionStart` with `source: ['clear','resume','fork']` |
| `/cmd` says no hook answered | matcher name differs, hook returned `next(e)`, or the hook was skipped |
| Hotkeys do nothing | the pane lacks focus: open with `focus: true` from a command, or Ctrl+X Tab |
| Guard lets a command through | hook threw without `.catch`, or the pattern misses that spelling |
| Edits to an installed mod do nothing | the installed copy is cached by version; use `--plugin-dir` or a folder marketplace + `/reload-plugins` |
| Toast missing | a pane with `holdToasts` is open, or a newer toast replaced it |
| Works in terminal, not desktop | element is terminal-only (`Raster`, `Image`) or the site is terminal-only |

## 5. Fix
Write a failing test first when the bug is in logic or drawing (`references/testing-and-debugging.md`), fix,
rerun the checker, record the cause in `DECISIONS.md`.
