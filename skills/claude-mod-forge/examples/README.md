# Reference mods (12 mods, 85 kit tests)

Complete, working mods the skill copies from. Each one passes `claude plugin validate`, strict `tsc` and
`claude plugin test` (run `node ../scripts/check-mod.mjs <name>`). The manifest folder is stored as
`_claude-plugin` so these examples are never loaded as plugins by accident: rename it to `.claude-plugin`
in your copy.

Every mod with visible text has a `language` option (`en` default, `pt-BR`) through a pure `hooks/i18n.ts`;
see "Language option" in `../references/ui-components.md`. Deny reasons Claude reads stay in English.

| Mod | What it does | Shows how to | Hooks | `$` calls | Tests |
|---|---|---|---|---|---|
| `session-dashboard` | `/dashboard` pane: KPI cards, tool activity with a filter, turn-duration sparkline, notes saved across sessions | tabs with hotkeys, Select, Input, `$.state` atoms, `$.store`, reload after `/clear`, empty states, language option | session.start, classic.SessionStart, command.run, prompt.submit, turn.complete, tool.call, ui.render(Pane) | clock, command, state, store, ui | 5 |
| `context-band` | band above the prompt with context-window use, a trend, a hide button and `/context-band` to show it again | a real data source (`$.session.usage()`), no-data fallback, `next(e)` when idle, every control has an undo, language option | session.start, command.run, turn.complete, ui.render(AbovePrompt) | command, session.usage, state, ui | 4 |
| `shell-guard` | holds risky shell/PowerShell commands for the user's decision; blocks edits to secret files (Windows paths too) | guards on every command tool, `$.ui.ask`, fail-closed `.catch`, `userConfig` mode ask/block/off, pure rules module | tool.call(Bash\|PowerShell\|Monitor), tool.call(Edit\|Write) | ui.ask, ui.toast | 14 |
| `git-recap` | `/recap [days]` lists recent commits, without a Claude turn | argument validation, `argumentHint`, `immediate`, `$.process.run` argv, error replies | session.start, command.run | command, process.run, ui.log | 6 |
| `spinner-counter` | adds "· N tool calls" after the native spinner word | restyling a native site with `next({ ...e, props })`, per-turn state, language option | turn.start, tool.call, ui.render(Spinner) | state | 2 |
| `scoped-approve` | auto-approves only an exact allow-list of shell commands (arguments only where an entry ends in ` *`); `/approvals` lists them | `tool.check` approver that falls back to the native verdict, exact match by default, compound-command rejection, `boolean` + `string` userConfig | tool.check(Bash), session.start, command.run | clock, command, state, ui.log | 8 |
| `api-status` | band with one value from an HTTP API you configure; `/api-status` refreshes and shows it as text | `$.http.fetch`, `sensitive` token, https-only host from config, offline state with last value, timer ≥ 15 s, first fetch not awaited in session.start, language option | session.start, command.run, ui.render(AbovePrompt) | http.fetch, clock, command, state, ui | 9 |
| `tool-log` | one redacted JSON line per tool call in a per-session file; redaction is best effort (regexes catch common spellings, not all), so keep the folder private | `$.fs` without append (serialised read-modify-write, rolling by bytes, never overwriting a part after a reload), redaction, `directory` userConfig, fail-open observer | session.start, tool.call, turn.complete, session.end | fs, session.id, clock, ui | 16 |
| `prompt-buttons` | pane of user-defined buttons that send saved instructions; `/buttons n` | `$.store` one key per item, `$.prompt.submit` scheduled with `$.clock.after`, busy state, `isPlaced` text fallback, language option | session.start, classic.SessionStart, turn.start, turn.complete, command.run, ui.render(Pane) | store, prompt.submit, clock, command, state, ui | 7 |
| `context-chart` | `/context-chart` pane: context use per turn | `session.measure` push, `Svg` on desktop and text bars on terminal chosen by `e.surface`, language option | session.measure, session.start, command.run, ui.render(Pane) | command, state, ui | 5 |
| `agent-board` | `/agents` pane: every subagent of this session with its role and live status | `$.agent.list()` polled every 2 s (no push event), status table, text fallback, language option | session.start, command.run, ui.render(Pane) | agent.list, clock, command, state, ui | 4 |
| `agent-dialogue` | `/dialogue` pane: the live conversation agents append to a JSONL file (`../scripts/say.mjs`), with an author filter | tolerant JSONL parser, `file` userConfig with no default path (the pane says how to set it), `Select` filter, text fallback, language option | session.start, command.run, ui.render(Pane) | fs, clock, command, state, ui | 5 |

What these tests cover: hook logic and drawn trees on the `terminal` and `desktop` surfaces through the
official test kit. They do not cover painting in a real terminal or the Desktop app: check that in a session
(`claude --plugin-dir <copy>`).
