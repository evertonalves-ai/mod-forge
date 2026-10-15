import type { EngineInterface, Register } from 'claude-code'

import { byteLength, fileName, redact, shouldRoll, summarize } from './entry'
import type { Entry } from './entry'

// An OBSERVER: it never changes or blocks a tool call, and has no .catch, so a failure here
// lets the call go on untouched. $.fs has no append: every flush is read + write of the whole
// file, serialised through one promise chain because tool calls can run in parallel.

type Target = { dir: string; sessionId: string; startedAt: number; part: number }

let target: Target | undefined
let queue: Entry[] = []
let chain: Promise<void> = Promise.resolve()
let hasWarned = false
const MAX_PARTS_PER_FLUSH = 50

async function writeQueued($: EngineInterface) {
  if (target === undefined || queue.length === 0) return
  const batch = queue
  queue = []
  const add = batch.map(e => JSON.stringify(e)).join('\n') + '\n'
  try {
    // Find the part to append to. After a reload or resume `part` starts again at 0, so walk past every
    // part that already exists and is full, and always read what the chosen part holds: never assume
    // a new part is empty. A part that cannot be read is skipped, never overwritten.
    const addBytes = byteLength(add)
    let path = fileName(target.dir, target.sessionId, target.startedAt, target.part)
    let current = ''
    for (let tries = 0; ; tries += 1) {
      if (tries > MAX_PARTS_PER_FLUSH) throw new Error('no writable log part')
      path = fileName(target.dir, target.sessionId, target.startedAt, target.part)
      if (!(await $.fs.exists(path))) {
        current = ''
        break
      }
      const size = (await $.fs.stat(path)).size
      if (shouldRoll(size, addBytes)) {
        target.part += 1
        continue
      }
      const read = await $.fs.read(path).then(
        text => ({ text }),
        () => undefined,
      )
      if (read === undefined) {
        target.part += 1 // unreadable (e.g. over the 4 MiB read limit): leave it as it is, move on
        continue
      }
      current = read.text
      break
    }
    await $.fs.write(path, current + add)
  } catch (error) {
    // Lost batch is reported, never retried in a loop. No secrets in the message: only the error kind.
    $.ui.log(`tool-log: could not write the log (${error instanceof Error ? error.name : 'error'})`, { to: 'debug' })
    if (!hasWarned) {
      hasWarned = true
      $.ui.toast('tool-log: cannot write to the log folder; check it in /config')
    }
  }
}

function flush($: EngineInterface): Promise<void> {
  chain = chain.then(() => writeQueued($))
  return chain
}

export const register: Register = (on, options) => {
  const dir = String(options.logDir ?? '').trim()
  const isEnabled = options.enabled !== false && dir !== ''

  on('session.start', async ($, e, next) => {
    if (options.enabled !== false && dir === '') {
      $.ui.toast('tool-log: choose a log folder in /config to start logging')
    }
    if (isEnabled) {
      // A reload or resume keeps the same session id and day: start again at part 0 and let the
      // writer walk past the parts that are already full, so no part is ever overwritten.
      target = { dir, sessionId: await $.session.id(), startedAt: await $.clock.now(), part: 0 }
    }
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (!isEnabled || target === undefined) return next(e)
    const started = await $.clock.now()
    const result = await next(e)
    const ended = await $.clock.now()
    const status: Entry['status'] = result.deny !== undefined ? 'denied' : result.isError === true ? 'error' : 'ok'
    const tool = String(e.tool)
    queue.push({
      ts: new Date(ended).toISOString(),
      tool,
      id: e.tool_use_id,
      ...(e.agentId === undefined ? {} : { agentId: e.agentId }),
      status,
      ms: Math.max(0, ended - started),
      args: summarize(tool, e as unknown as Record<string, unknown>),
      ...(result.deny === undefined ? {} : { reason: redact(String(result.deny)).slice(0, 200) }),
    })
    if (queue.length >= 20) void flush($)
    return result // the call's result goes back exactly as it came
  })

  on('turn.complete', async ($, e, next) => {
    if (isEnabled) await flush($)
    return next(e)
  })

  on('session.end', async ($, e, next) => {
    // All session.end hooks share ~1.5 s: the last batch can be lost if the disk is slow (documented).
    if (isEnabled) await flush($)
    return next(e)
  })
}
