---
name: claude-mod-forge
description: Builds, plans, debugs, improves, audits, tests and packages Claude Code mods (plugins of function hooks that draw panes, bands above the prompt, custom commands, restyled native UI, tool-call guards, prompt rewrites, timers and model calls). Use whenever someone wants a mod or "a plugin that changes how Claude Code looks or behaves" — "make a mod that…", "a dashboard/pane/panel inside Claude Code", "show X above the prompt", "block/guard dangerous commands", "a /command that…", "fix/improve/continue my mod", "is this mod safe?", "package my mod" — even when they never say the word "mod". Runs an adaptive interview, picks the architecture, writes the code with tests, verifies it and ships it.
---

# Claude Mod Forge

Turns a plain-language idea into a working Claude Code mod: interview → spec → code → checks → delivery.
Answer in the language the user writes in; files and code comments stay in English unless the user asks otherwise.

## 0. Ground truth first (every session, before writing code)

1. `claude --version`. Mods need ≥ 2.1.287 in the terminal, ≥ 2.1.286 in the Desktop app. Record the version in the spec.
2. If the `plugin-authoring` skill is listed, load it with the Skill tool. It is the official base: it names this
   session's mods folder (`~/.claude/dev-mods/<session>/`), turns on hot reload, and points at **this build's**
   `claude-code.d.ts`. Remember both paths. If it is missing or disabled, use the fallback in `references/official-docs.md`.
3. The `.d.ts` is the authority. Before using any event, method, element, prop or result shape that is not in an
   example here, `grep` it in the `.d.ts` and read the declaration. Docs and this skill can lag the build.
   Never invent an event, method, prop, metric or data source.
4. Version mismatch: the `.d.ts` may be one build behind the CLI (e.g. types 2.1.293, CLI 2.1.294). Use it, record
   both versions in the spec, and once the mod has loaded prefer `<mod>/.claude-plugin/types/` (written by the running build).
5. Where to work: a new mod starts in the session mods folder. An existing mod is edited **where it lives**
   (load it with `claude --plugin-dir <path>` for hot reload); never copy it into dev-mods. If it lives in a temp or
   unknown place, ask once where the user keeps mods and offer to move it there.

## 1. Pick the mode from the request (the user never has to name it)

| The request | Mode | Read |
|---|---|---|
| A new mod, idea or vague wish | **create** | `workflows/create.md` (+ `references/idea-catalog.md` if the user is unsure what to build) |
| "plan / design / spec first"; or a mod that approves tool calls, weakens a protection, acts as the user, or sends data out | **plan** first, then create after an explicit yes | `workflows/plan.md` |
| An existing mod misbehaves, errors, draws nothing | **debug** | `workflows/debug.md` |
| Add to an existing mod without breaking it | **improve** | `workflows/improve.md` |
| A pane, dashboard or interactive UI (new or existing) | **create/improve** + `references/ui-components.md` |
| "is it safe / review / audit" | **audit** | `workflows/audit.md` |
| "test it / does it work" | **test** | `workflows/test.md` |
| "share / publish / install for my team" | **package** | `workflows/package.md` |
| "continue / pick up where we stopped" | **continue** | `workflows/continue.md` |

A mod that only *restricts* (blocks, asks, warns) stays in create with a full spec; it does not need plan mode.
An existing mod folder in the conversation or the working directory makes it improve/debug/continue, not create.
Installing a third-party mod (from a list or marketplace) goes through **audit** first.
Read the project's `MOD-SPEC.md` and `DECISIONS.md` before asking anything.

## 2. Interview only for what changes the design

Follow `references/discovery-and-quiz.md`: at most 3 questions per round (AskUserQuestion), skip anything the
request or the files already answer, recommend an option whenever the user is unsure, stop as soon as
`templates/project-spec.md` can be filled. Category-specific questions are in `references/quiz-by-category.md`.
"You decide" → choose sensible defaults and write them down as assumptions.

## 3. Hard rules

- **Real data only.** Every number on screen has a source in the API (`$.session.usage()`, `turn.complete`,
  `tool.call`, `$.fs`, `$.process`, `$.http`…). No source → say so and offer what exists. Billing, quotas and
  account data are not assumed to exist.
- **Every control works.** No button, tab, field or setting without a real, tested effect. No demo screens.
- **Guards fail closed** (`.catch` that refuses); observers fail open (no `.catch`); approvers (`tool.check` allow)
  fall back to the native verdict (`next(e)` / `ask`), never to `deny`-everything and never to `allow`.
- **Never weaken the user's safety silently.** Auto-approve, deny-rule overrides, prompt rewrites and hidden
  `$.prompt.submit` need the risk explained and an explicit yes. A mod's approval is not the user's consent.
- **No secrets** in code, tests, logs, examples or URLs; use `userConfig` with `"sensitive": true`.
- **Least capability.** Call only the `$` methods the feature needs; `claude plugin validate` lists them, and they go in the README.
- **Honest verification.** Separate static checks, unit tests and a real session. Never claim a visual or
  cross-surface result you did not run. Hooks run everywhere; drawing is guaranteed only in the terminal and the
  Desktop app. The types declare a `vscode` surface while the docs say VS Code does not draw: give every drawn
  view a text path (a command reply) and treat VS Code drawing as unverified (`references/surfaces.md`).
- **Code lives where the user keeps code.** Develop in the session mods folder (hot reload); deliver to the
  user's projects folder (ask once if unknown) with a marketplace entry. Never delete the user's files.

## 4. Build and verify

Start from the closest example in `examples/` (rename `_claude-plugin` → `.claude-plugin` in the copy):

| Example | Shows |
|---|---|
| `session-dashboard` | Pane with tabs, KPI cards, sparkline, Select filter, Input, store + `/clear` reload, command |
| `context-band` | Band above the prompt from `$.session.usage()`, hide button + `/context-band` to show it again, no-data fallback |
| `shell-guard` | Guard on every command tool (Bash, PowerShell, Monitor), `$.ui.ask` hold-and-confirm, `userConfig` mode (ask/block/off), fail-closed `.catch`, pure rules module, Windows paths |
| `git-recap` | `/command` with `argumentHint`, argument validation, `$.process.run` argv, error paths |
| `spinner-counter` | Restyling a native site (`Spinner`) with `next({ ...e, props })`, per-turn state |
| `scoped-approve` | `tool.check` approver: only `ask` → `allow` for an exact allow-list (arguments only where an entry ends in ` *`), never over a deny, subagents untouched, falls back to the native verdict |
| `api-status` | `$.http.fetch` to a configured https host, token as `sensitive` userConfig, offline state keeping the last value, optional timer ≥ 15 s |
| `tool-log` | Observer writing redacted JSONL with `$.fs` (no append: serialised read-modify-write, file rolling by bytes, flush per turn), best-effort regex redaction, `directory` userConfig |
| `prompt-buttons` | User-defined buttons in `$.store` (one key each), `$.prompt.submit` scheduled out of `command.run`, busy state, text path for VS Code |
| `context-chart` | Data pushed by `session.measure`; one data layer, two renderings: `Svg` on desktop, text bars on the terminal, picked by `e.surface` |
| `agent-board` | `/agents` pane of this session's subagents from `$.agent.list()` polled every 2 s, status labels, text fallback |
| `agent-dialogue` | `/dialogue` pane that tails a JSONL file agents append to (`scripts/say.mjs`), tolerant parser, author `Select`, `file` userConfig with no default path |

Every example with visible text takes a `language` option (`en` default, `pt-BR`) through `hooks/i18n.ts`;
see "Language option" in `references/ui-components.md`.

Then run the checker (validate + strict tsc + `claude plugin test`) until it is green:

```bash
node "<skill-dir>/scripts/check-mod.mjs" "<mod-dir>"
```

API details: `references/mods-api.md`, `references/events-and-middleware.md`, `references/state-and-persistence.md`.
Pitfalls already hit and fixed: `references/testing-and-debugging.md#known-pitfalls`.

## 5. Deliver

Report: path, what it does, how to load it (hot reload / `--plugin-dir` / install), the commands and hotkeys,
the capabilities it uses, what was verified and how, and what still needs a look in a real session.
Keep `MOD-SPEC.md` and `DECISIONS.md` in the mod folder up to date so the next session can continue.
