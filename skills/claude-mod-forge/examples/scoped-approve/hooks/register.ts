import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { allowedBy, parseList } from './allow'

// An APPROVER, not a guard. Rules it never breaks:
// - it only turns the engine's "ask" into "allow": a deny stays a deny, an allow stays an allow;
// - only the main conversation (no agentId): subagents keep the normal prompts;
// - on failure it returns the engine's own verdict (never allow, never deny-everything).
const approvals = atom({ plugin: 'scoped-approve', key: 'approvals' } as const, [])

export const register: Register = (on, options) => {
  const list = parseList(String(options.allowList ?? ''))
  const isEnabled = options.enabled !== false

  on('tool.check', { tool: 'Bash' }, async ($, e, next) => {
    const decided = await next(e)
    if (!isEnabled || decided.decision !== 'ask' || e.agentId !== undefined) return decided

    const command = String((e.input as { command?: unknown }).command ?? '')
    const entry = allowedBy(command, list)
    if (entry === undefined) return decided

    // Every approval is visible: a dim transcript line, and the session list behind /approvals.
    $.ui.log(`auto-approved by allow-list entry "${entry}": ${command.slice(0, 120)}`)
    const at = await $.clock.now()
    await update($, approvals, l => [...l, { command: command.slice(0, 200), at }].slice(-50))
    return { decision: 'allow', reason: `scoped-approve: allow-list entry "${entry}"` }
  }).catch(($, e, next) => next(e))

  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({ name: 'approvals', description: 'Show the allow-list and what it approved this session', immediate: true })
    } catch {
      // name taken: approvals still work and still log
    }
    return next(e)
  })

  on('command.run', { command: 'approvals' }, async $ => {
    const done = await read($, approvals)
    const header = !isEnabled
      ? 'scoped-approve is off.'
      : list.length === 0
        ? 'Allow-list is empty: nothing is auto-approved.'
        : `Allow-list: ${list.join(' · ')}`
    const body = done.length === 0 ? 'Nothing approved this session.' : done.map(a => `- ${a.command}`).join('\n')
    return { text: `${header}\n${body}` }
  })
}
