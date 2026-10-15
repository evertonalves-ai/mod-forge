# State and persistence

| Keep it in | Lasts until | Use for |
|---|---|---|
| module variable | the module reloads (every save in development) | values you can lose: a turn's start time, caches |
| `$.state` (atoms) | session ends, or `/clear` · `/resume` · `/branch` | anything a drawing reads; survives hot reload; redraws readers |
| `$.store` | deleted, or unused for `cleanupPeriodDays` | settings, history, notes the user expects next session |
| files via `$.fs` | forever | large or user-visible data (4 MiB per read/write, not atomic) |
| `userConfig` | the user changes it | options and secrets (`"sensitive": true` → secure storage) |
| external service | — | shared/team data; handle offline |

## $.state recipe
```ts
// types/index.d.ts — a contract exports types only (no `export {}`, no values)
export type Note = { id: string; text: string }
declare module 'claude-code' {
  interface PluginState { 'my-mod': { notes: Note[]; tab: 'a' | 'b' } }
}
```
`plugin.json`: `"types": "./types/index.d.ts"`.
```ts
import { atom, read, update } from 'claude-code'
const notes = atom({ plugin: 'my-mod', key: 'notes' } as const, [])   // literals, const
const list = await read($, notes)                                       // in ui.render: subscribes
onPress: () => update($, notes, l => [...l, item])                      // writes from handlers/events only
```
Rules: `plugin`/`key` string literals; each atom in a `const`; every key declared in the contract; no writes
inside `ui.render`; with no declared contract the validator refuses the module.

## Surviving /clear, /resume, /branch
They reset `$.state` and do **not** fire `session.start`. Reload persisted values in both hooks:
```ts
async function load($: EngineInterface) { const s = await $.store.get('notes'); await update($, notes, () => (Array.isArray(s) ? s : [])) }
on('session.start', async ($, e, next) => { await load($); return next(e) })
on('classic.SessionStart', { source: ['clear', 'resume', 'fork'] }, async ($, e, next) => { await load($); return next(e) })
```

## $.store across sessions
Shared by every session on the machine; get-then-set is not atomic. One key per item where possible; re-read
right before writing; save on every change (so `session.start` reloads never overwrite newer data with older).
4 MiB total: cap lists (`.slice(-N)`), trim strings.

## Hot reload
`register` runs again, `session.start` fires again, timers from the old copy stop, module variables restart,
`$.state` and `$.store` stay. Anything started in `session.start` must be safe to start twice.
