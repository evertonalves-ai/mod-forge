# Category question banks

Ask only what the request and files have not answered. Each block lists the questions, the real data sources,
and what must never be assumed. Confirm every source in the `.d.ts` before relying on it.

## 1. Dashboard & monitoring
- Which numbers or states? Where does each come from? How often should it refresh? How much history? Alerts when?
- **Real sources:** context use `$.session.usage().context` (`tokens`, `window`, `percent`); plan limits
  `$.session.usage().rateLimits` (`kind`, `percentUsed`, `resetsAt`) when present; cost `usage().cost.usd` when present;
  per-request tokens `turn.step` result `usage`; turn totals `turn.complete` `usage`, `durationMs`, `isAborted`;
  tool calls `tool.call` (`tool`, args, result `isError`/`deny`); subagents `$.agent.list()`; builds/tests
  `$.process.run`/`spawn`; files `$.fs`; remote `$.http.fetch`.
- **Never assume:** billing history, invoices, account quotas or anything `usage()` does not return in this
  build. Optional fields (`cost`, `rateLimits`) may be absent: show "not available", never 0.
- Default: KPI cards + one trend + one list; refresh on the event that changes the value, not a timer.

## 2. Visual customisation
- Which element? Change a detail, replace it, or add beside it? Which native behaviour must stay (animation, word, focus)?
- **Sites:** `UserMessage`, `AssistantMessage`, `ToolUse`, `ToolResult`, `ToolGroup`, `CommandOutput`,
  `AskUserQuestion`, `Spinner`, `ToolProgress`*, `TurnDuration`*, `InfoNotice`*, `SessionMode`, `PromptHint` (*terminal only).
- **Never:** the permission prompt (not a render site). `AskUserQuestion` trees must hold the engine reference exactly once.
- Prefer `next({ ...e, props })` over full replacement; keep `next(e)` when there is nothing to change.

## 3. Productivity & automation
- What repeats? What triggers it (event, timer, command)? Conditions and exceptions? How is it undone?
- Automatic actions that change files or run commands need: a visible log line, an off switch (`userConfig`
  or a button), and a dry-run when the effect is destructive.

## 4. Custom commands
- Name? Arguments and their validation? Output (text Claude also reads, or `{}` and a pane)? Must it run while
  Claude works (`immediate: true`)? Does it need permissions (process/network)?
- Names: letters, digits, `_`, `-`, ≤ 64 chars, not a built-in (`$.command.register` throws on a taken name).
- `command.run` returns `{ text }` (Claude reads it) or `{}`. Only `$.prompt.submit` starts a turn.

## 5. Safety & guarding
- Which operations? Exact rule (command pattern, path, branch, time)? Warn, block, ask, or log only?
  What if nobody can answer (`claude -p`)? Should the user be able to switch it off?
- Distinguish: **observe** (log), **warn** (toast, still runs), **block** (`{ deny }`), **ask** (`$.ui.ask` hold),
  **decide** (`tool.check` → allow/ask/deny).
- Must: fail closed; deny text tells Claude what to do instead; document that regex on command text is a
  reminder layer, not a sandbox; recommend permission rules / branch protection for hard guarantees.
- Never: weaken existing rules silently, or approve in `tool.check` what a deny rule refuses.

## 6. Inspection & audit
- What is recorded? Where (debug log `$.ui.log(text, { to: 'debug' })`, `$.store`, a file)? For how long?
  Who reads it? What must be redacted?
- Redact before storing: tokens, keys, `Authorization` headers, `.env` values, passwords in URLs. Cap the size.

## 7. Tool control
- Which tools (built-in names, `mcp__server__tool`)? Rewrite arguments, retry, answer in place, or withhold results?
- Answering in place returns `{ result }` shaped like the tool's own result (see the tools types). Withholding
  after `next` does not undo what the tool did.

## 8. Context & sessions
- What to track? Shown where? Updated by which events? Must it survive reload, `/clear`, a new session?
- Sources: `$.session.usage()`, `$.session.messages()` (newest 4,096 rows), `turn.*`, `session.compact`,
  `session.end`. Not available: content outside what these return.

## 9. Code review & changes
- Which changes (last turn's edits, git diff, a branch)? Shown as a diff (`Code` with `format: 'diff'`)? Actions?
- Sources: `tool.call` on `Edit`/`Write` (file_path, strings), `$.process.run(['git', 'diff', …])`.

## 10. Integrations & external services
- Which service and endpoint? Auth method? What data in/out? Rate limits? What when it is down or slow?
- Token: `userConfig` field with `"sensitive": true`, or an env var read with `$.env.get('LITERAL_NAME')`.
  Never in code, tests, logs, toasts, `$.store` or text the model reads.
- `$.http.fetch`: 30 s total, 4 MiB bodies, ≤ 5 redirects; cross-origin redirects drop `Authorization`.
- Show offline/error states; back off on failure; never retry in a tight loop.

## 11. Team & corporate flows
- Who installs it, how (marketplace, managed settings)? Policy constraints (`allowManagedModsOnly`,
  `disableSideloadFlags`, `prependPlugins`)? Audit needs?
- A mod copied from GitHub/npm counts as a user's mod, not the organization's; org mods load from a local
  directory marketplace named in managed settings.

## 12. Native feature customisation
- Which built-in behaviour (command list, `/config` rows, tool descriptions, attribution text, prompt sections)?
- Events: `command.describe`, `config.describe`, `config.set`, `tool.describe`, `attribution.text`,
  `prompt.section`, `prompt.compose`, `skill.prompt`. Changing prompt text that varies per request breaks the
  prompt cache: say so.

## 13. Data storage & lookup
- What data, how much, who writes it, from how many sessions at once?
- `$.store`: JSON, 4 MiB total, shared by every session on the machine, get+set is not atomic → one key per item
  and re-read before writing. Larger data: files via `$.fs` (4 MiB per read/write, not atomic).

## 14. Other
Describe the goal in one sentence, map it to events + `$` methods by grepping the `.d.ts`, then reuse the
closest block above.
