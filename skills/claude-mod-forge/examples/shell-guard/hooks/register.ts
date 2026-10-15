import type { Register } from 'claude-code'

import { isSecretPath, riskOf } from './rules'

// Every guard here fails CLOSED: if the hook throws or times out before deciding,
// the .catch handler refuses. A guard without .catch would let the command through.
export const register: Register = (on, options) => {
  const mode = options.mode === 'block' ? 'block' : 'ask'

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const risk = riskOf(e.command)
    if (risk === undefined) return next(e)

    if (mode === 'block') {
      $.ui.toast(`Blocked: ${risk.label}`)
      return { deny: `${$.plugin.name} blocked a ${risk.label} (${risk.why}). Ask the user before trying another way.` }
    }

    // Start from the safe answer: a dismissed question, or a claude -p run, refuses.
    let answer = 'Refuse'
    try {
      // The wait happens inside a $ call, so it does not count against the hook's time limit.
      answer = await $.ui.ask(`${risk.label} (${risk.why}). Run this command?\n\n${e.command.slice(0, 400)}`, ['Run it', 'Refuse'])
    } catch {
      // Nobody could answer.
    }
    if (answer !== 'Run it') {
      return { deny: `The user declined this ${risk.label}. Ask before trying a different approach.` }
    }
    // Approved here only means "go on": the normal permission check still runs after next().
    return next(e)
  }).catch(($, e, next) => (next.called ? next(e) : { deny: `${$.plugin.name}: the check failed, so the command was not run.` }))

  on('tool.call', { tool: ['Edit', 'Write'] }, ($, e, next) =>
    isSecretPath(e.file_path)
      ? { deny: `${$.plugin.name}: ${e.file_path} holds secrets and is not edited by Claude here.` }
      : next(e),
  ).catch(($, e, next) => (next.called ? next(e) : { deny: `${$.plugin.name}: the check failed, so the edit was not made.` }))
}
