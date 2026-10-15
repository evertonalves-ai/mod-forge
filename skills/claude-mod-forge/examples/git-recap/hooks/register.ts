import type { Register } from 'claude-code'

import { formatLog, parseDays } from './recap'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({
        name: 'recap',
        description: 'List your recent commits in this repository',
        argumentHint: '[days]',
        immediate: true, // runs even while Claude is working; no turn starts
      })
    } catch (error) {
      // A taken name throws; say so instead of failing silently.
      $.ui.log(`recap: could not register /recap: ${String(error)}`)
    }
    return next(e)
  })

  // Answers its own command and never calls next. The text prints in the transcript.
  on('command.run', { command: 'recap' }, async ($, e) => {
    const parsed = parseDays(e.args)
    if ('error' in parsed) return { text: parsed.error }

    // argv list, no shell: user text never reaches a shell. The value is validated above.
    let out
    try {
      out = await $.process.run(
        ['git', 'log', `--since=${parsed.days}.days`, '--pretty=format:%h%x09%ad%x09%s', '--date=short', '--no-merges'],
        { timeoutMs: 10_000 },
      )
    } catch {
      return { text: 'git did not run (is it installed and on PATH?).' }
    }
    if (out.exitCode !== 0) {
      return { text: /not a git repository/i.test(out.stderr) ? 'This folder is not a git repository.' : `git failed: ${out.stderr.trim().slice(0, 200)}` }
    }
    return { text: formatLog(out.stdout, parsed.days) }
  })
}
