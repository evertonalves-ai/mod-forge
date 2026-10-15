# Mods API — what you will use most

Grep the `.d.ts` for anything else. Every call is written in full, `$.namespace.method(...)`:
never destructure `$`, store `$.ui` in a variable or index it with a computed name (validation fails).
A helper that takes `$` must be a top-level function in the same file (validate then shows `(via helper)`).

## Files and structure
```
<mod>/
├── .claude-plugin/plugin.json   name, version, description, author, types?, userConfig?
├── hooks/hooks.json             { "modules": ["./register.ts"] }   one path, relative
├── hooks/register.ts(x)         export const register: Register = (on, options) => { … }
├── hooks/*.ts                   pure helpers, imported with relative paths (no extension needed)
├── types/index.d.ts             PluginState contract (only if $.state is used)
└── tests/*.test.ts(x)           claude plugin test
```
ES modules only: no `require`, no dynamic `import()`. The only bare import is `claude-code`
(types + `atom`, `read`, `update`, `derive`, `memberOf`). JSX compiles against global `h` / `Fragment`.
No DOM, no Node, no `setTimeout`/`setInterval`: use `$.clock`. Web APIs (`URL`, `TextEncoder`, `crypto.subtle`) exist.

## Namespaces
| Namespace | Methods | Notes |
|---|---|---|
| `$.plugin` | `name`, `root` | |
| `$.ui` | `resolve`, `invalidate`, `open`, `close`, `panes`, `focus`, `scroll`, `toast`, `status`, `log`, `notice`, `ask`, `copy`, `selection`, `blit` | see ui-components.md |
| `$.command` | `register`, `run`, `list` | register in `session.start`, last |
| `$.tool` | `register`, `call`, `check`, `list` | tool name becomes `mcp__<plugin>__<name>`; `isDeferred: false` to load upfront |
| `$.agent` | `register`, `spawn`, `list` | |
| `$.model` | `complete`, `fork`, `classify` | check `isAnswered`; never throws on API errors |
| `$.prompt` | `submit`, `read`, `fill`, `suggest`, `compose` | `submit` starts a turn when idle; `asUser: true` hides the sender — ask first |
| `$.turn` | `abort` | |
| `$.session` | `messages`, `cwd`, `root`, `model`, `turns`, `id`, `repo`, `surfaces`, `usage`, `version`, `compact`, `send`, `append`, `authorize` | `usage()` → `{ startedAt, context{tokens?,window,percent?}, rateLimits[], cost? }` |
| `$.config` | `list`, `set` | |
| `$.settings` | `read` | can expose secrets: justify |
| `$.env` | `get`, `set` | literal names only; `set` affects every child process |
| `$.fs` | `read`, `write`, `list`, `exists`, `stat`, `ancestors` | 4 MiB per file; `write` not atomic; `stat(p,{resolve:true}).realPath` for guards |
| `$.store` | `get`, `set`, `delete`, `keys` | JSON, 4 MiB total, shared by all sessions, not atomic |
| `$.state` | `get`, `set` (+ helpers) | session-scoped, reactive, survives reload, reset by `/clear` |
| `$.clock` | `now`, `sleep`, `after`, `every` | timers return `{ cancel() }`; stop on reload |
| `$.http` | `fetch` | `{ status, ok, headers, text }`; 30 s; 4 MiB; ≤ 5 redirects |
| `$.process` | `run`, `spawn` | argv list, no shell; `run` → `{ exitCode, stdout, stderr, is…Truncated }`; 30 s default, rejects if it can't start |
| `$.mcp` | `call`, `connect` | under the session's permission rules |
| `$.audio` | `play`, `speak` | |
| `$.telemetry` | `log`, `mark` | |

## Commands
```ts
on('session.start', async ($, e, next) => {
  await $.command.register({ name: 'recap', description: 'List recent commits', argumentHint: '[days]', immediate: true })
  return next(e)
})
on('command.run', { command: 'recap' }, async ($, e) => ({ text: `…${e.args}` }))   // or {} to print nothing
```
Name literal in both places. Throws on a taken/built-in name: register last or wrap in try/catch.

## Tools for Claude
```ts
await $.tool.register({ name: 'ticket', description: '…', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } })
on('tool.call', { tool: 'mcp__my-mod__ticket' }, async ($, e) => ({ result: '…' }))
```

## Model calls
```ts
const r = await $.model.complete({ model: 'haiku', system: '…', prompt: e.args, maxTokens: 200, timeoutMs: 15000 })
const text = r.isAnswered ? r.text : `unavailable (${r.reason})`
```
Bills the user's plan/key. Run on a user action, not on every event. Cache long static prefixes with
`prompt: [{ text: RULES, cache: true }, { text: input }]`.

## Background work
```ts
on('session.start', async ($, e, next) => {
  $.clock.every(60_000, async () => { /* … */ await update($, atom, …) })
  return next(e)
})
```
A timer callback that throws is logged and runs again next interval. Long work inside a hook: pass `next.signal`.

## Limits that bite
Hook: 10 s own time (waits inside `$` calls and `next` don't count, `$.clock.sleep` does). `.catch`: 1 s.
`session.end` hooks together: 1.5 s. Redraws: ≤ 10/s (30/s in terminal for the visible pane/band).
Toast: 4 s default. Names: `[A-Za-z0-9_-]{1,64}`. Tree text: first 100,000 chars drawn. Test: 5 s each.
