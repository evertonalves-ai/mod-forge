import { expect, test } from 'claude-code/testing'

const SPINNER = {
  plugin: 'spinner-counter',
  component: 'Spinner',
  props: { word: 'Thinking', message: null, suffix: '…', mode: 'thinking' },
} as const

test('the native spinner is kept and the count is added after its word', async ($, on) => {
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('tool.call', () => ({ result: 'ok' }))
  // Stands in for Claude Code's spinner: draws the suffix it receives.
  on('ui.render', { component: 'Spinner' }, ($, e) => ({ type: 'Text', props: {}, children: [`${e.props.word}${e.props.suffix}`] }))

  for (const surface of ['terminal', 'desktop'] as const) {
    const before = await $.ui.mount({ ...SPINNER, surface })
    expect(await before.find({ text: 'Thinking…' })).toBeDefined()
    await before.unmount()
  }

  await $.turn.start({ turnId: 't1', text: 'go' })
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.tool.call({ tool: 'Read', file_path: 'a.md' })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...SPINNER, surface })
    expect(await ui.find({ text: 'Thinking… · 2 tool calls' })).toBeDefined()
    await ui.unmount()
  }

  // A new turn starts the count again, back to the untouched spinner.
  await $.turn.start({ turnId: 't2', text: 'again' })
  const ui = await $.ui.mount({ ...SPINNER, surface: 'terminal' })
  expect(await ui.find({ text: 'Thinking…' })).toBeDefined()
})

test('language pt-BR: the count is written in Portuguese', { options: { language: 'pt-BR' } }, async ($, on) => {
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('tool.call', () => ({ result: 'ok' }))
  on('ui.render', { component: 'Spinner' }, ($, e) => ({ type: 'Text', props: {}, children: [`${e.props.word}${e.props.suffix}`] }))
  await $.turn.start({ turnId: 't1', text: 'go' })
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.tool.call({ tool: 'Read', file_path: 'a.md' })
  const ui = await $.ui.mount({ ...SPINNER, surface: 'terminal' })
  expect(await ui.find({ text: 'Thinking… · 2 ferramentas' })).toBeDefined()
})
