import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'context-band',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 3, bodyColumns: 100, scroll: { offset: 0, bodyRows: 3 }, view: {} },
} as const

const usage = (tokens: number) => ({
  value: { startedAt: 0, rateLimits: [], context: { tokens, window: 200_000, percent: Math.round((tokens / 200_000) * 100) } },
})

test('the band shows the real reading after a turn and hides on request', async ($, on) => {
  const answers = [usage(30_000), usage(130_000)]
  on('session.usage', () => answers.shift() ?? usage(130_000))
  on('turn.complete', () => ({ text: '' }))
  // Stands in for Claude Code's own (empty) band.
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box key="engine" />
  })

  const turn = { answer: 'ok', durationMs: 10, isAborted: false, reason: 'answer' as const }
  await $.turn.complete({ turnId: 't1', ...turn })
  await $.turn.complete({ turnId: 't2', ...turn })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ text: /65%/ })).toBeDefined()
    expect(await ui.find({ text: /▲ \+100\.0k/ })).toBeDefined()
    await ui.unmount()
  }

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'hide' })
  expect(await ui.find({ key: 'engine' })).toBeDefined()
})

test('no reading means no band: it never invents a number', async ($, on) => {
  on('session.usage', () => ({ deny: 'unavailable here' }))
  on('turn.complete', () => ({ text: '' }))
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box key="engine" />
  })
  await $.turn.complete({ turnId: 't1', answer: 'ok', durationMs: 10, isAborted: false, reason: 'answer' as const })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ key: 'engine' })).toBeDefined()
  expect(await ui.find({ text: /%/ })).toBeUndefined()
})

test('/context-band brings the band back after hide', async ($, on) => {
  on('session.usage', () => usage(50_000))
  on('turn.complete', () => ({ text: '' }))
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box key="engine" />
  })
  await $.turn.complete({ turnId: 't1', answer: 'ok', durationMs: 10, isAborted: false, reason: 'answer' as const })
  const typed = { args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } } as const

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'hide' })
  expect(await ui.find({ key: 'engine' })).toBeDefined()
  const shown = await $.command.run({ command: 'context-band', ...typed })
  expect(shown.text).toBe('Context band shown.')
  expect(await ui.find({ text: /25%/ })).toBeDefined()
  const hidden = await $.command.run({ command: 'context-band', ...typed })
  expect(hidden.text).toMatch(/hidden/)
})
