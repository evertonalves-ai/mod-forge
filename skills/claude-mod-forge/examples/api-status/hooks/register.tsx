import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { ApiReading } from '../types'
import { checkUrl, clock, pickField } from './api'
import { strings } from './i18n'
import type { Strings } from './i18n'

const reading = atom({ plugin: 'api-status', key: 'reading' } as const, { kind: 'loading' })
const isHidden = atom({ plugin: 'api-status', key: 'isHidden' } as const, false)

type Config = { url: string; field: string; token: string }

// One request. Never throws; never puts the token in any text, log, toast or state.
async function refresh($: EngineInterface, config: Config, t: Strings) {
  const target = checkUrl(config.url, t)
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
      const picked = pickField(response.text, config.field || 'status', t)
      next = 'error' in picked ? { kind: 'error', reason: picked.error, at, ...last } : { kind: 'ok', value: picked.value, at }
    }
  } catch {
    // Network failure, timeout (30 s), or a policy that refuses fetch. The reason text is ours, not the error's.
    next = { kind: 'error', reason: t.unreachable, at: await $.clock.now(), ...last }
  }
  await update($, reading, () => next)
}

export const register: Register = (on, options) => {
  const config: Config = {
    url: String(options.url ?? ''),
    field: String(options.field ?? 'status'),
    token: String(options.token ?? ''),
  }
  const t = strings(options.language)
  const seconds = Number(options.refreshSeconds ?? 0)
  const interval = seconds > 0 ? Math.max(15, seconds) * 1000 : 0 // never poll faster than every 15 s

  // The first session.start is awaited before the first prompt: no awaited network here. Register the
  // command, then let the first fetch run on its own (the band shows "loading" until it lands).
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({ name: 'api-status', description: t.commandDescription, immediate: true })
    } catch {
      // name taken: the band and its r button still work
    }
    void refresh($, config, t).catch(() => undefined)
    if (interval > 0) $.clock.every(interval, () => refresh($, config, t))
    return next(e)
  })

  on('command.run', { command: 'api-status' }, async $ => {
    await update($, isHidden, () => false)
    await refresh($, config, t)
    const now = await read($, reading)
    // The same information as text, for surfaces that draw nothing (VS Code chat, claude -p).
    const text =
      now.kind === 'ok' ? t.textOk(now.value, clock(now.at))
      : now.kind === 'error' ? `${t.textError(now.reason)}${now.lastValue === undefined ? '' : t.textLast(now.lastValue)}`
      : now.kind === 'unconfigured' ? now.reason
      : t.loadingText
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
      // A fragment's children are RenderNode (element or string): `cond && <X/>` there yields a false,
      // which strict tsc 5.9 rejects. Pick between two whole fragments instead.
      status =
        now.lastValue === undefined ? (
          <>
            <Text color="error">{t.unavailable}</Text>
            <Text dimColor>{now.reason}</Text>
          </>
        ) : (
          <>
            <Text color="error">{t.unavailable}</Text>
            <Text dimColor>{now.reason}</Text>
            <Text dimColor>{t.last} {now.lastValue}{now.lastAt === undefined ? '' : ` ${t.at} ${clock(now.lastAt)}`}</Text>
          </>
        )
    } else if (now.kind === 'unconfigured') {
      status = <Text color="warning">{now.reason}</Text>
    } else {
      status = <Text color="warning">{t.loading}</Text>
    }

    return (
      <Box gap={1} paddingX={1}>
        <Text dimColor>API</Text>
        {status}
        <Button key="refresh" label={t.refresh} hotkey="r" plain dimColor onPress={() => refresh($, config, t)} />
        <Button key="hide" label={t.hide} plain dimColor onPress={() => update($, isHidden, () => true)} />
      </Box>
    )
  })
}
