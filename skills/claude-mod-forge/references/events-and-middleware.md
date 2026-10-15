# Events and the middleware chain

## The three moves
```ts
on('tool.call', async ($, e, next) => next(e))                                  // observe
on('prompt.submit', async ($, e, next) => next({ ...e, text: e.text.trim() }))  // rewrite (e is frozen: copy it)
on('tool.call', { tool: 'Bash' }, async () => ({ deny: 'Use the file tools.' }))// answer / take over
```
After the fact: `const r = await next(e); …; return r`. Withhold a result: return `{ deny }` after `next`
(the tool already ran; nothing is undone).

## Matchers
`{ tool: 'Bash' }` · `{ tool: ['Edit', 'Write'] }` · `{ tool: /^mcp__github__/ }` · `{ component: 'Pane', requestId: 'x' }` ·
`{ source: ['clear', 'resume', 'fork'] }`. Every field must match. Event names are string literals.
`'classic.*'` matches every settings-hook event; `'*'` everything except telemetry.
One registration per event **per matcher**: two `on('session.start', …)` without a matcher fail to load.

## Events by job
| Job | Events |
|---|---|
| Tools | `tool.call` (deny / result / rewrite), `tool.check` (allow/ask/deny after rules), `tool.describe` |
| Prompts | `prompt.submit` (`text`, `context`, `drop`), `prompt.fill`, `prompt.suggest`, `prompt.edit` (50 ms!), `prompt.autocomplete`, `prompt.compose`, `prompt.section`, `prompt.context`, `prompt.attachment`, `prompt.mention`, `skill.prompt`, `attribution.text` |
| Commands/config | `command.run`, `command.describe`, `config.set`, `config.describe` |
| Turns | `turn.start`, `turn.step` (async generator), `turn.complete` (`usage`, `durationMs`, `isAborted`, `answer`, `agentId`) |
| Session | `session.start` (once per load, again on reload, NOT after /clear), `session.end`, `session.compact`, `session.receive`, `session.send`, `session.append`, `session.attach/detach`, `session.measure` |
| Subagents | `agent.offer`, `agent.spawn` |
| UI | `ui.render`, `ui.press/input/select`, `ui.focus`, `ui.scroll`, `ui.close`, `ui.message`, `ui.fault`, `ui.resolve` |
| Other mods | `plugin.register` (refuse), `engine.create` (add a namespace) |
| Settings hooks | `classic.<Event>` (`classic.SessionStart`, `classic.Stop`, …), `e` = the stdin JSON |
| Every `$` call | its own event (`fs.read`, `model.complete`, …): earlier mods can observe/refuse later mods' calls |

Each event's input and result: grep `'<event>': {` in the `.d.ts`.

## Holding a tool call for the user
```ts
let answer = 'Refuse'
try { answer = await $.ui.ask('Run this? ' + e.command, ['Run it', 'Refuse']) } catch {}
if (answer !== 'Run it') return { deny: 'The user declined. Ask before another approach.' }
return next(e)                       // the normal permission check still runs
```
`$.ui.ask` rejects when dismissed and in `claude -p`: default to the safe answer. The wait inside `$.ui.ask`
does not count against the hook's time; a wait on your own promise does.

## tool.check (decisions)
`const decided = await next(e)` gives `allow | ask | deny` from rules, mode and settings hooks; return it or
`{ decision, reason }`. A mod can approve what an `ask` rule would prompt for → treat any `allow` as a safety
decision the user must agree to. Deny rules still hold where the built-in guard loads.

## Order
1 built-in guard + org `prependPlugins` · 2 user-installed mods · 3 org `appendPlugins` · 4 other built-ins.
First = outermost: sees the event first and the result last. Within a module: the order of `on` calls.
Managed `PreToolUse` hooks run before every mod (their block is final); other `PreToolUse` hooks run after the
last mod's `next` (a mod that answers without `next` stops them from running).

## Failure
No `.catch`: failed before `next` → skipped, the chain continues (fail open); failed after `next` → its result stands.
With `.catch(($, e, next) => next.called ? next(e) : refusal)`: fail closed.
Refusals per event: `tool.call` `{ deny }`, `prompt.submit` `{ drop }`, `config.set` `{ deny }`,
`tool.check` `{ decision: 'deny', reason }` (returnable even after `next`), `plugin.register` `{ refuse }`.
`next.error.kind`: `throw` | `timeout` | `re-entry` (a call made beneath this hook's own `$` call).

## Approvers are different from guards
A `tool.check` hook that **approves** must fail to the native verdict, not to `deny` and never to `allow`:
```ts
on('tool.check', { tool: 'Bash' }, async ($, e, next) => {
  const decided = await next(e)                       // what rules, mode and settings hooks decided
  if (decided.decision !== 'ask') return decided      // never turn a deny into allow
  return isOnAllowList(e.input.command) ? { decision: 'allow', reason: 'scoped allow-list' } : decided
}).catch(($, e, next) => next(e))                     // failure → the engine's own verdict
```
- An `allow` does not dismiss tools that need the person (questions, plan approval): "approve everything" is
  impossible by design, and the native permission modes (`acceptEdits`, `bypassPermissions`) or permission
  rules are the right tool for broad approval — recommend them before writing a mod.
- Only approve when `next(e)` said `ask`; reject compound shell commands (`;`, `&&`, `|`, `$(`, backticks,
  redirections) from allow-lists so `git status && rm -rf x` cannot ride along.
- Match allow-list entries exactly by default and accept arguments only where the entry asks for it (a
  trailing ` *`): arguments change what a command does (`git diff --output=FILE` overwrites a file).
- Deny rules hold over user mods where the built-in guard loads (docs, admin page); do not rely on that in code.
