import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

// Rewrites a native render site instead of replacing it: next() with changed props keeps
// Claude Code's spinner (animation, word, mode) and only adds text after the word.
const calls = atom({ plugin: 'spinner-counter', key: 'calls' } as const, 0)

export const register: Register = on => {
  on('turn.start', async ($, e, next) => {
    await update($, calls, () => 0)
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId === undefined) await update($, calls, n => n + 1) // main conversation only
    return next(e)
  })

  // Spinner is raised on the terminal and the desktop. Other surfaces simply never call this.
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const n = await read($, calls)
    if (n === 0) return next(e) // nothing to add: leave the native spinner untouched
    const suffix = `${e.props.suffix} · ${n} tool call${n === 1 ? '' : 's'}`
    return next({ ...e, props: { ...e.props, suffix } })
  })
}
