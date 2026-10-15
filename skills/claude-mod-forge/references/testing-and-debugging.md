# Testing and debugging

## The checker
`node scripts/check-mod.mjs <mod> [--types <d.ts>] [--json]` copies the mod to a temp folder, renames
`_claude-plugin`, runs `claude plugin validate`, strict `tsc` (TypeScript 5.6 via npx, tsconfig outside the mod)
and `claude plugin test`, and prints pass/fail/skipped per step. Skipped is never reported as passed.

## Test kit essentials
```ts
import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

test('name', async ($, on) => {             // $ here acts AS Claude Code; on registers stubs beneath the mod
  mock.clock(on, { now: 1_700_000_000_000 }) // any $.clock use
  mock.store(on, { key: 'value' })           // or explicit store.get / store.set stubs to read what was saved
  on('tool.call', () => ({ result: 'ok' }))  // engine answer for tool calls that pass the mod
  await $.tool.call({ tool: 'Bash', command: 'ls' })
})
test('with options', { options: { mode: 'block' } }, async ($, on) => { … })   // userConfig values
```
- Register every stub **before** the first `$` call.
- `session.start` does not run by itself: stub `session.start` and `command.register` then `await $.session.start({ surface, isInteractive, cwd })`.
- `$` call stubs return `{ value }` (or `{ deny }` to make the call reject); engine events return their own result (`{ result }`, `{ text }`, `{ turnId }`).
- A hook that returns `next(e)` needs a stand-in: return an element, e.g. `{ type: 'Text', props: {}, children: ['…'] }`, or JSX `<Box key="engine" />` in a `.test.tsx` using `$.ui.resolve(e)`. `null` is refused.
- `$.ui.ask` reaches the stub as a `tool.call` for `AskUserQuestion`: answer `{ result: { answers: { [question]: 'Run it' } } }`.
- Drawings: `const ui = await $.ui.mount({ plugin, surface, component, requestId?, props, viewport? })` then
  `press({ key })`, `input({ key, text })`, `select({ key, value })`, `find({ key | type | text })`, `unmount()`.
  Loop the body over `['terminal', 'desktop'] as const`; add `'vscode'`/`'mobile'` only for mods without Input/Select.
- `/clear` path: `await $.classic.SessionStart({ source: 'clear' })` with `on('classic.SessionStart', () => ({}))`.
- Timers: `const clock = mock.clock(on)`; `await clock.advance(ms)`.
- Pure helpers (rules, parsing) are imported and tested directly.
- Each test has 5 s; keep them small.

## Known pitfalls (all hit while building this skill's examples)
| Symptom | Fix |
|---|---|
| `the state library's atom takes a source the scan can read` | `atom({ plugin: 'literal', key: 'literal' } as const, init)` in a `const` |
| `X.key is not declared` | declare it in `types/index.d.ts` and point `plugin.json` `types` at it |
| `a contract exports types and nothing else` | remove `export {}`; export a type instead to keep it a module |
| `Property 'viewport' does not exist` in `session.start` | only render hooks have a viewport; just call `$.ui.open` |
| `gating hook without .catch: command.run{…}` with a non-literal name | write the command name literally in register and matcher |
| `Type instantiation is excessively deep` on `tool.call` | the matcher came from a loop variable; use an array literal `{ tool: ['Edit','Write'] }` |
| `An import path can only end with a '.ts' extension` | import helpers without an extension (`'./rules'`); the engine resolves it |
| `no implementation for clock.now` / `store.get` / `command.register` | add `mock.clock`, `mock.store`, or a stub |
| `nothing beneath the plugins answers ui.render` | a stand-in element for when the mod calls `next(e)` |
| `returned something that is not a tree element` | the stand-in returned `null`; return an element |
| `Type 'null' is not assignable to 'TurnUsage'` | omit `usage`; pass `reason: 'answer'` to `$.turn.complete` |
| `missing … origin, presentation` on `$.command.run` | `origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 }` |
| `ProcessRunResult` missing fields | add `isStdoutTruncated: false, isStderrTruncated: false` |
| `Plugin name "…" is reserved` | no `claude-`/`anthropic-`/`cc-plugin-` prefix, not `claude-mods`; name it for what it does (repo/skill may keep the name) |

## Debugging in a session
Hot reload sessions print dim lines naming the mod, event and reason. Otherwise `claude --debug-file ./mod.log`
and search for the mod name. `/plugin` shows `N mods active`. `claude plugin test` in an empty folder tells
whether mods can load at all. Full symptom table: `workflows/debug.md`.

## More pitfalls (hit while building the second batch of examples)
| Symptom | Fix |
|---|---|
| A Svg (or Input on mobile) silently missing from the tree | `'Svg' in ui` is true on every surface at run time: branch on `e.surface` (see ui-components.md) |
| `find({ key })` cannot find a row | `Text` has no `key` prop (it is ignored): key the row's `Box` |
| `prompt.submit: called from a command.run hook, it would wait on the turn this hook is holding` | schedule it: `$.clock.after(0, () => send($, …))`; in tests `await clock.settle()` |
| A `$.fs` stub sees `C:\…` while the mod wrote `C:/…` | the engine hands paths over in the platform's absolute form: compare by suffix |
| `on("ui.toast") registered twice` in a test | one stub per event (and matcher) per test: share it through the helper |
| A stub for `$.http.fetch` needs to simulate "network down" | return `{ deny: '…' }` (the call rejects in the mod) |
| Unsure what a hook drew | `console.log(JSON.stringify(await ui.drawn()))` inside the test |
