# Reference mods

Complete, working mods the skill copies from. Each one passes `claude plugin validate`, strict `tsc` and
`claude plugin test` (run `node ../scripts/check-mod.mjs <name>`). The manifest folder is stored as
`_claude-plugin` so these examples are never loaded as plugins by accident: rename it to `.claude-plugin`
in your copy.

| Mod | What it does | Shows how to | Hooks | `$` calls | Tests |
|---|---|---|---|---|---|
| `session-dashboard` | `/dashboard` pane: KPI cards, tool activity with a filter, turn-duration sparkline, notes saved across sessions | tabs with hotkeys, Select, Input, `$.state` atoms, `$.store`, reload after `/clear`, empty states | session.start, classic.SessionStart, command.run, prompt.submit, turn.complete, tool.call, ui.render(Pane) | clock, command, state, store, ui | 4 |
| `context-band` | band above the prompt with context-window use, a trend and a hide button | a real data source (`$.session.usage()`), no-data fallback, `next(e)` when idle | session.start, turn.complete, ui.render(AbovePrompt) | session.usage, state, ui | 2 |
| `shell-guard` | holds risky shell commands for the user's decision; blocks edits to secret files | `tool.call` guards, `$.ui.ask`, fail-closed `.catch`, `userConfig` option, pure rules module | tool.call(Bash), tool.call(Edit\|Write) | ui.ask, ui.toast | 6 |
| `git-recap` | `/recap [days]` lists recent commits, without a Claude turn | argument validation, `argumentHint`, `immediate`, `$.process.run` argv, error replies | session.start, command.run | command, process.run, ui.log | 6 |
| `spinner-counter` | adds "· N tool calls" after the native spinner word | restyling a native site with `next({ ...e, props })`, per-turn state | turn.start, tool.call, ui.render(Spinner) | state | 1 |

What these tests cover: hook logic and drawn trees on the `terminal` and `desktop` surfaces through the
official test kit. They do not cover painting in a real terminal or the Desktop app: check that in a session
(`claude --plugin-dir <copy>`).
