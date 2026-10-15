import { expect, test } from 'claude-code/testing'

import { svgChart, textBars } from '../hooks/chart'

const TYPED = { origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } } as const
const PANE = {
  plugin: 'context-chart',
  component: 'Pane',
  requestId: 'context-chart',
  viewport: { columns: 160, rows: 40, isFullscreen: true },
  props: { title: 'Context chart', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

const measure = (tokens: number | undefined) => ({
  context: { tokens, window: 200_000, percent: tokens === undefined ? undefined : Math.round((tokens / 200_000) * 100) },
  rateLimits: [],
  changed: ['context' as const],
})

test('pure: svg is self-contained, text bars scale to width', () => {
  const pts = [{ percent: 10, tokens: 20_000, window: 200_000 }, { percent: 60, tokens: 120_000, window: 200_000 }]
  const svg = svgChart(pts, 200, 100)
  expect(svg.startsWith('<svg')).toBe(true)
  expect(svg).toContain('<path d="M')
  expect(svg).not.toMatch(/<script|href=/)
  const bars = textBars(pts, 40)
  expect(bars).toHaveLength(2)
  expect(bars[1]).toMatch(/ 60%$/)
})

test('readings come from session.measure; missing tokens are skipped, not drawn as 0', async ($, on) => {
  on('session.measure', ($, e) => ({ changed: e.changed }))
  await $.session.measure(measure(undefined))
  await $.session.measure(measure(30_000))
  await $.session.measure(measure(150_000))

  // Desktop: one Svg element with an alt text; terminal: text bars.
  const desk = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await desk.find({ type: 'Svg' })).toBeDefined()
  expect(await desk.find({ text: /75% · 150\.0k \/ 200\.0k/ })).toBeDefined()
  await desk.unmount()

  const term = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await term.find({ type: 'Svg' })).toBeUndefined()
  expect(await term.find({ text: /  2 █+░* +75%/ })).toBeDefined()
  expect(await term.find({ text: / 0%/ })).toBeUndefined()
})

test('empty state before the first reply', async ($, on) => {
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ text: /No reading yet/ })).toBeDefined()
})

test('where no pane can be placed, /context-chart answers in text', async ($, on) => {
  on('session.measure', ($, e) => ({ changed: e.changed }))
  on('ui.open', () => ({ value: { isPlaced: false, reason: 'no surface' } }))
  await $.session.measure(measure(50_000))
  const reply = await $.command.run({ command: 'context-chart', args: '', ...TYPED })
  expect(reply.text).toMatch(/25%$/)
})

test('language pt-BR: heading and empty state are in Portuguese', { options: { language: 'pt-BR' } }, async ($, on) => {
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ text: '◆ Contexto' })).toBeDefined()
  expect(await ui.find({ text: /Nenhuma leitura ainda/ })).toBeDefined()
})
