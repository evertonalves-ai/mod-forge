# TEST-PLAN: <mod-name>

Claude Code version: · Date:

## Level 1–3 (automatic): `node scripts/check-mod.mjs <mod>`
| Step | Result | Notes |
|---|---|---|
| validate | | capabilities listed match the spec? |
| tsc (strict) | | types version |
| plugin test | n pass / n fail | |

## Test cases (kit)
| # | Hook / control | Case | Expected | Test name | Result |
|---|---|---|---|---|---|
| 1 | | matching event | | | |
| 2 | | irrelevant event (not touched) | `next` reached unchanged | | |
| 3 | | rewrite / block path | | | |
| 4 | | `$` call fails (`{ deny }` stub) | safe fallback | | |
| 5 | | invalid input | clear message, no side effect | | |
| 6 | UI | empty state, each surface | | | |
| 7 | UI | each control by key | | | |
| 8 | state | survives `/clear` (if persisted) | | | |
| 9 | guard | fail closed when the hook throws | | | |

## Level 4 (real session) — done by: · surface:
| Check | Result |
|---|---|
| `/plugin` shows the mod active | |
| command listed and works | |
| pane/band draws, hotkeys respond after focus | |
| narrow and wide terminal | |
| Desktop app (if relevant) | |

Not run, and why:
