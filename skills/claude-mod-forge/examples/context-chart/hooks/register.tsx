import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Point } from '../types'
import { HISTORY, short, svgChart, textBars } from './chart'
import { strings } from './i18n'

const PANE = 'context-chart'
const points = atom({ plugin: 'context-chart', key: 'points' } as const, [])

export const register: Register = (on, options) => {
  const t = strings(options.language)

  // Pushed after each main-thread turn: no timer, no polling. Readings without tokens
  // (before the first reply, right after a compaction) are skipped, never drawn as 0.
  on('session.measure', async ($, e, next) => {
    const { tokens, window, percent } = e.context
    if (e.changed.includes('context') && tokens !== undefined && window > 0) {
      const point: Point = { tokens, window, percent: Math.round(percent ?? (tokens / window) * 100) }
      await update($, points, list => [...list, point].slice(-HISTORY))
    }
    return next(e)
  })

  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({ name: 'context-chart', description: t.commandDescription, immediate: true })
    } catch {
      // name taken
    }
    return next(e)
  })

  on('command.run', { command: 'context-chart' }, async $ => {
    const opened = await $.ui.open({ id: PANE, title: t.paneTitle, focus: true, closeOnEscape: true })
    if (opened.isPlaced) return {}
    const list = await read($, points)
    return { text: list.length === 0 ? t.noReading : textBars(list, 60).join('\n') }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const list = await read($, points)
    const now = list[list.length - 1]

    let chart
    if (now === undefined) {
      chart = <Text dimColor>{t.noReading}</Text>
    } else if (e.surface !== 'terminal' && 'Svg' in ui) {
      // Decide by e.surface: at run time every surface's table lists every element, so
      // `'Svg' in ui` alone is true on the terminal too (it only narrows the type).
      const width = Math.max(120, e.props.bodyColumns * 8)
      chart = <ui.Svg key="chart" source={svgChart(list, width, 120)} alt={t.alt(list.length, now.percent)} />
    } else {
      chart = <Text color="claude">{textBars(list, e.props.bodyColumns).join('\n')}</Text>
    }

    return (
      <Box flexDirection="column" paddingX={1} gap={1}>
        <Box justifyContent="space-between">
          <Text bold color="claude">{t.heading}</Text>
          {now !== undefined && (
            <Text color={now.percent < 75 ? 'success' : now.percent < 90 ? 'warning' : 'error'}>
              {`${now.percent}% · ${short(now.tokens)} / ${short(now.window)}`}
            </Text>
          )}
        </Box>
        {chart}
        <Text dimColor>{t.footer}</Text>
      </Box>
    )
  })
}
