import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { ApiReading } from '../types'
import { checkUrl, clock, pickField } from './api'

const reading = atom({ plugin: 'api-status', key: 'reading' } as const, { kind: 'loading' })
const isHidden = atom({ plugin: 'api-status', key: 'isHidden' } as const, false)

type Config = { url: string; field: string; token: string }

// One request. Never throws; never puts the token in any text, log, toast or state.
async function refresh($: EngineInterface, config: Config) {
  const target = checkUrl(config.url)
  if ('error' in target) {
    await update($, reading, () => ({ kind: 'unconfigured', reason: target.error }) satisfies ApiReading)
    return
  }
  const previous = await read($, reading)
  const last = previous.kind === 'ok' ? { lastValue: previous.value, lastAt: previous.at } : previous.kind === 'error' ? { lastValue: previous.lastValue, lastAt: previous.lastAt } : {}
  const headers: Record<string, string> = { accept: 'application/json' }
  if (config.token !== '') headers.authorization = `Bearer ${config.token}`
  let next: ApiReading
  try {
    const response = await $.http.fetch(target.url, { method: 'GET', headers })
    const at = await $.clock.now()
    if (!response.ok) {
      next = { kind: 'error', reason: `HTTP ${response.status}`, at, ...last }
    } else {
      const picked = pickField(response.text, config.field || 'status')
      next = 'error' in picked ? { kind: 'error', reason: picked.error, at, ...last } : { kind: 'ok', value: picked.value, at }
    }
  } catch {
    // Network failure, timeout (30 s), or a policy that refuses fetch. The reason text is ours, not the error's.
    next = { kind: 'error', reason: 'unreachable', at: await $.clock.now(), ...last }
  }
  await update($, reading, () => next)
}

export const register: Register = (on, options) => {
  const config: Config = {
    url: String(options.url ?? ''),
    field: String(options.field ?? 'status'),
    token: String(options.token ?? ''),
  }
  const seconds = Number(options.refreshSeconds ?? 0)
  const interval = seconds > 0 ? Math.max(15, seconds) * 1000 : 0 // never poll faster than every 15 s

  on('session.start', async ($, e, next) => {
    await refresh($, config)
    if (interval > 0) $.clock.every(interval, () => refresh($, config))
    try {
      await $.command.register({ name: 'api-status', description: 'Refresh the API status band (and show it if hidden)', immediate: true })
    } catch {
      // name taken: the band and its r button still work
    }
    return next(e)
  })

  on('command.run', { command: 'api-status' }, async $ => {
    await update($, isHidden, () => false)
    await refresh($, config)
    const now = await read($, reading)
    // The same information as text, for surfaces that draw nothing (VS Code chat, claude -p).
    const text =
      now.kind === 'ok' ? `API: ${now.value} (at ${clock(now.at)})`
      : now.kind === 'error' ? `API unavailable: ${now.reason}${now.lastValue === undefined ? '' : ` · last ${now.lastValue}`}`
      : now.kind === 'unconfigured' ? now.reason
      : 'Loading…'
    return { text }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const now = await read($, reading)
    if (e.props.hasSurvey || (await read($, isHidden))) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)

    let status
    if (now.kind === 'ok') {
      status = <><Text color="success">●</Text><Text bold>{now.value}</Text><Text dimColor>{clock(now.at)}</Text></>
    } else if (now.kind === 'error') {
      status = (
        <>
          <Text color="error">✗ unavailable</Text>
          <Text dimColor>{now.reason}</Text>
          {now.lastValue !== undefined && <Text dimColor>· last {now.lastValue}{now.lastAt === undefined ? '' : ` at ${clock(now.lastAt)}`}</Text>}
        </>
      )
    } else if (now.kind === 'unconfigured') {
      status = <Text color="warning">{now.reason}</Text>
    } else {
      status = <Text color="warning">◌ loading…</Text>
    }

    return (
      <Box gap={1} paddingX={1}>
        <Text dimColor>API</Text>
        {status}
        <Button key="refresh" label="refresh" hotkey="r" plain dimColor onPress={() => refresh($, config)} />
        <Button key="hide" label="hide (/api-status)" plain dimColor onPress={() => update($, isHidden, () => true)} />
      </Box>
    )
  })
}
