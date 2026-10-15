import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Reading } from '../types'

// Data source: $.session.usage().context — the same figures the status line shows.
// No estimate, no made-up number: when the call gives nothing, the band shows nothing.
const HISTORY = 12
const BARS = '▁▂▃▄▅▆▇█'

const readings = atom({ plugin: 'context-band', key: 'readings' } as const, [])
const isHidden = atom({ plugin: 'context-band', key: 'isHidden' } as const, false)

function level(percent: number): { color: string; word: string } {
  if (percent < 50) return { color: 'success', word: 'roomy' }
  if (percent < 75) return { color: 'warning', word: 'filling' }
  if (percent < 90) return { color: 'warning', word: 'tight' }
  return { color: 'error', word: 'compact soon' }
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

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await takeReading($)
    return result
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
    const lv = level(now.percent)
    const prev = list[list.length - 2]
    const delta = prev === undefined ? 0 : now.tokens - prev.tokens
    const isWide = e.props.bodyColumns >= 70

    return (
      <Box gap={1} paddingX={1}>
        <Text color={lv.color} bold>● {now.percent}%</Text>
        <Text dimColor>context · {lv.word}</Text>
        <Text dimColor>{short(now.tokens)} / {short(now.window)}</Text>
        {isWide && list.length > 1 && <Text color="claude">{chart(list)}</Text>}
        {isWide && delta !== 0 && <Text dimColor>{delta > 0 ? `▲ +${short(delta)}` : `▼ ${short(-delta)}`} last turn</Text>}
        <Button key="hide" label="hide" plain dimColor onPress={() => update($, isHidden, () => true)} />
      </Box>
    )
  })
}
