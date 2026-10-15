import { expect, mock, test } from 'claude-code/testing'

// What Claude Code passes to a /command typed at the prompt.
export const TYPED = { origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } } as const

const PANE = {
  plugin: 'session-dashboard',
  component: 'Pane',
  requestId: 'session-dashboard',
  viewport: { columns: 160, rows: 40, isFullscreen: true },
  props: {
    title: 'Session dashboard',
    isFocused: true,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

test('tabs switch on every surface that draws', async ($, on) => {
  mock.clock(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ text: /Tool calls/ })).toBeDefined()
    await ui.press({ key: 'tab-notes' })
    expect(await ui.find({ text: /No notes/ })).toBeDefined()
    await ui.press({ key: 'tab-overview' })
    await ui.unmount()
  }
})

test('tool calls are counted, marked done and shown in the activity tab', async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  // Stands in for Claude Code: the first call succeeds, the second fails.
  on('tool.call', ($, e) => (e.tool === 'Bash' ? { result: 'ok' } : { result: 'boom', isError: true }))
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.tool.call({ tool: 'Read', file_path: 'missing.md' })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ text: '2' })).toBeDefined()
  await ui.press({ key: 'tab-activity' })
  expect(await ui.find({ text: '✓' })).toBeDefined()
  expect(await ui.find({ text: '✗' })).toBeDefined()
  await ui.select({ key: 'filter', value: 'Bash' })
  expect(await ui.find({ text: '✗' })).toBeUndefined()
  await ui.press({ key: 'clear-activity' })
  expect(await ui.find({ text: /Nothing here yet/ })).toBeDefined()
})

test('a note is saved to the store and comes back after /clear', async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  const saved = new Map<string, unknown>()
  on('store.get', ($, e) => ({ value: saved.get(e.key) }))
  on('store.set', ($, e) => {
    saved.set(e.key, e.value)
    return { value: undefined }
  })
  on('ui.toast', () => ({ value: undefined }))
  on('classic.SessionStart', () => ({}))

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-notes' })
  await ui.input({ key: 'new-note', text: '  ship the release  ' })
  expect(await ui.find({ text: 'ship the release' })).toBeDefined()
  expect((saved.get('notes') as { text: string }[])[0]?.text).toBe('ship the release')
  await ui.unmount()

  // /clear resets $.state; the classic.SessionStart hook reloads from the store.
  await $.classic.SessionStart({ source: 'clear' })
  const again = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await again.press({ key: 'tab-notes' })
  expect(await again.find({ text: 'ship the release' })).toBeDefined()
})

test('/dashboard opens the pane and prints nothing', async ($, on) => {
  const opened: string[] = []
  on('ui.open', ($, e) => {
    opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  const answer = await $.command.run({ command: 'dashboard', args: '', ...TYPED })
  expect(opened).toEqual(['session-dashboard'])
  expect(answer).toEqual({})
})
