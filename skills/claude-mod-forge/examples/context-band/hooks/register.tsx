import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Reading } from '../types'
import { strings } from './i18n'
import type { Strings } from './i18n'

// Data source: $.session.usage().context — the same figures the status line shows.
// No estimate, no made-up number: when the call gives nothing, the band shows nothing.
const HISTORY = 12
const BARS = '▁▂▃▄▅▆▇█'

const readings = atom({ plugin: 'context-band', key: 'readings' } as const, [])
const isHidden = atom({ plugin: 'context-band', key: 'isHidden' } as const, false)

function level(percent: number, t: Strings): { color: string; word: string } {
  if (percent < 50) return { color: 'success', word: t.roomy }
  if (percent < 75) return { color: 'warning', word: t.filling }
  if (percent < 90) return { color: 'warning', word: t.tight }
  return { color: 'error', word: t.compactSoon }
}

function short(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function chart(list: Reading[]): string {
  const top = Math.max(...list.map(r => r.tokens), 1)
  return list.map(r => BARS[Math.min(7, Math.floor((r.tokens / top) * 7))] ?? BARS[0]).join('')
}

async function takeReading($: EngineInterface) {
  try {
    const { context } = await $.session.usage()
    if (!context.window || context.tokens === undefined) return
    const percent = Math.round(context.percent ?? (context.tokens / context.window) * 100)
    const reading: Reading = { tokens: context.tokens, window: context.window, percent }
    // The reading before the first response is 0; drop zeros once real ones arrive.
    await update($, readings, list => [...list.filter(r => r.tokens > 0), reading].slice(-HISTORY))
  } catch {
    // No reading this time; the band keeps the last one.
  }
}

export const register: Register = (on, options) => {
  const t = strings(options.language)

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await takeReading($)
    try {
      // The way back after "hide": every control needs an undo.
      await $.command.register({ name: 'context-band', description: t.commandDescription, immediate: true })
    } catch {
      // Name taken: the band still works, only the toggle is missing.
    }
    return result
  })

  on('command.run', { command: 'context-band' }, async $ => {
    const hidden = await read($, isHidden)
    await update($, isHidden, () => !hidden)
    return { text: hidden ? t.shown : t.hidden }
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId === undefined) await takeReading($) // subagent turns use their own window
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, readings)
    const now = list[list.length - 1]
    if (e.props.hasSurvey || now === undefined || (await read($, isHidden))) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const lv = level(now.percent, t)
    const prev = list[list.length - 2]
    const delta = prev === undefined ? 0 : now.tokens - prev.tokens
    const isWide = e.props.bodyColumns >= 70

    return (
      <Box gap={1} paddingX={1}>
        <Text color={lv.color} bold>● {now.percent}%</Text>
        <Text dimColor>{t.context} · {lv.word}</Text>
        <Text dimColor>{short(now.tokens)} / {short(now.window)}</Text>
        {isWide && list.length > 1 && <Text color="claude">{chart(list)}</Text>}
        {isWide && delta !== 0 && <Text dimColor>{delta > 0 ? `▲ +${short(delta)}` : `▼ ${short(-delta)}`} {t.lastTurn}</Text>}
        <Button key="hide" label={t.hide} plain dimColor onPress={() => update($, isHidden, () => true)} />
      </Box>
    )
  })
}
