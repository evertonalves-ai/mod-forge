# Official sources (checked 2026-10-14 against Claude Code 2.1.294, types 2.1.293)

Order of trust: **this build's `claude-code.d.ts`** > official docs > official samples > this skill.

## Where the types are
- With the `plugin-authoring` skill loaded: the path it prints (`…/plugin-authoring/types/claude-code.d.ts`).
- After a mod loaded from a folder you own (hot reload, `--plugin-dir`, `CLAUDE_CODE_PLUGIN_DIRS`):
  `<mod>/.claude-plugin/types/claude-code/index.d.ts` (+ `claude-code-tools/`, `claude-code-mcp/`, `tsconfig.json`).
- Public copy (may be older): https://github.com/anthropics/claude-code/blob/main/mods/types/claude-code.d.ts
- `scripts/check-mod.mjs` finds them in that order.

## Fallback when `plugin-authoring` is unavailable
It is the built-in plugin `cc-plugin-plugin-authoring` and can be disabled, or remotely off. Without it:
write the mod in a folder of your own, start the user's session with `claude --plugin-dir <mod>` (hot reloads on
save) or add it to `CLAUDE_CODE_PLUGIN_DIRS` (env of `~/.claude/settings.json`, `;`-separated on Windows) for the
Desktop app. Types appear in `<mod>/.claude-plugin/types/` after the first load; before that, use the public copy.

## Docs (code.claude.com/docs/en/…)
| Page | Use it for |
|---|---|
| `plugins/mods/overview` | what mods are, where they run and draw, trust, built-in mods, version minimums |
| `plugins/mods/create` | file layout, hot reload approval, `--plugin-dir`, validation rules for static analysis, first tests |
| `plugins/mods/interface` | panes, band, render sites, elements, focus/hotkeys, redraw, `$.state`, `$.store`, `/clear` reload |
| `plugins/mods/events` | observe/rewrite/answer, matchers, `tool.call`, `$.ui.ask` holds, `tool.check`, `prompt.submit`, turns, ordering, `.catch` |
| `plugins/mods/api` | commands, tools, `$.model`, prompt caching, timers, `$.ui.status/toast/log`, `$.prompt.submit`, sessions, fs/process/http |
| `plugins/mods/test` | test kit, stubs table, mocks, timers, drawings, policy mods |
| `plugins/mods/troubleshoot` | why a mod does nothing, refusal messages, debug log |
| `plugins/mods/reference` | events, methods, render sites, elements, limits, settings, commands |
| `plugins/mods/admin` | org policy, `allowManagedModsOnly`, `prependPlugins`, review a mod |
| `plugins/mods/gallery` | element screenshots |
| `plugins/components#user-configuration`, `plugins/manifest-reference` | `userConfig`, manifest fields |
| `plugins/publish`, `plugins/install` | marketplaces and installing |

Index of all pages: https://code.claude.com/docs/llms.txt

## Samples
- Built-in mods with tests: https://github.com/anthropics/claude-code/tree/main/mods (`diff`, `agents-md`, `sec-default`, `telemetry`)
- Playground (Apache-2.0, unsupported): https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods
  (`token-weather` — context band from `$.session.usage()`; `blast-radius` — hold risky shell commands;
  `replay-theater` — `/replay` of last turn's edits)

## Facts worth remembering (verified)
- Version minimums: terminal ≥ 2.1.287, Desktop app ≥ 2.1.286. `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is ignored now.
- Reserved plugin/marketplace names fail `claude plugin validate`: anything starting with `claude-`, `anthropic-`,
  `anthropics-`, `cc-plugin-`; exactly `claude`, `anthropic`, `anthropics`, `claude-code`, `claude-mods`; or
  "official" next to "claude"/"anthropic". Name it for what it does (verified with validate).
- Hooks run in VS Code chat, `claude -p`, SDK and cloud sessions, but only the terminal and the Desktop app draw.
  WSL sessions in the Desktop app load no plugins.
- Mods are not sandboxed: they run with the user's permissions; the Bash sandbox does not cover `$.process`.
- A mod can approve tool calls an `ask` rule would prompt for; deny rules hold where the built-in guard loads.
- A mod cannot change the permission prompt.
- Mods Claude writes in `~/.claude/dev-mods/<session>/` are deleted after `cleanupPeriodDays`: copy them out.

## Where docs and types disagreed in this build (trust the types)
| Docs say | Types (2.1.293) say |
|---|---|
| test stub for `command.register`: `() => ({ value: undefined })` | resolves `{ command: string }` → `{ value: { command: e.name } }` |
| `$.turn.complete({ …, usage: null })` in tests | `usage?: TurnUsage` (omit it); `reason: 'answer' \| 'aborted' \| 'error'` is required |
| `$.process.run` stub `{ exitCode, stdout, stderr }` | also `isStdoutTruncated`, `isStderrTruncated` |
| `$.command.run({ command, args })` in tests | also `origin` (e.g. `{ kind: 'composer' }`) and `presentation` (`{ isFullscreen, columns }`) |
