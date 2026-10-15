import type { Register } from 'claude-code'

import { strings } from './i18n'
import { failureAnswer, isSecretPath, riskOf } from './rules'

// Every guard here fails CLOSED: if the hook throws or times out before deciding,
// the .catch handler refuses. A guard without .catch would let the command through.
// What the user sees follows options.language; deny reasons stay English (Claude reads them).
export const register: Register = (on, options) => {
  const mode = options.mode === 'block' || options.mode === 'off' ? options.mode : 'ask'
  const t = strings(options.language)

  // One guard for every tool that runs a command. Monitor's command is optional.
  on('tool.call', { tool: ['Bash', 'PowerShell', 'Monitor'] }, async ($, e, next) => {
    if (mode === 'off') return next(e)
    const risk = riskOf(String(e.command ?? ''))
    if (risk === undefined) return next(e)

    if (mode === 'block') {
      $.ui.toast(t.blocked(t.label(risk.label)))
      return { deny: `${$.plugin.name} blocked a ${risk.label} (${risk.why}). Ask the user before trying another way.` }
    }

    // Start from the safe answer: a dismissed question, or a claude -p run, refuses.
    let answer = t.refuse
    try {
      // The wait happens inside a $ call, so it does not count against the hook's time limit.
      const question = t.question(t.label(risk.label), t.why(risk.why), String(e.command ?? '').slice(0, 400))
      answer = await $.ui.ask(question, [t.runIt, t.refuse])
    } catch {
      // Nobody could answer.
    }
    if (answer !== t.runIt) {
      return { deny: `The user declined this ${risk.label}. Ask before trying a different approach.` }
    }
    // Approved here only means "go on": the normal permission check still runs after next().
    return next(e)
  }).catch(($, e, next) => failureAnswer($.plugin.name, next.called, 'command') ?? next(e))

  on('tool.call', { tool: ['Edit', 'Write'] }, ($, e, next) =>
    mode !== 'off' && isSecretPath(e.file_path)
      ? { deny: `${$.plugin.name}: ${e.file_path} holds secrets and is not edited by Claude here.` }
      : next(e),
  ).catch(($, e, next) => failureAnswer($.plugin.name, next.called, 'edit') ?? next(e))
}
