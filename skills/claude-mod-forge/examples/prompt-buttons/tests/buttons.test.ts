import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { parseIndex, validate } from '../hooks/buttons'

const TYPED = { origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } } as const
const PANE = {
  plugin: 'prompt-buttons',
  component: 'Pane',
  requestId: 'prompt-buttons',
  viewport: { columns: 160, rows: 40, isFullscreen: true },
  props: { title: 'Prompt buttons', isFocused: true, bodyColumns: 70, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

function engine(on: On, isPlaced = true) {
  const store = new Map<string, unknown>()
  const sent: string[] = []
  on('store.keys', () => ({ value: [...store.keys()] }))
  on('store.get', ($, e) => ({ value: store.get(e.key) }))
  on('store.set', ($, e) => {
    store.set(e.key, e.value)
    return { value: undefined }
  })
  on('store.delete', ($, e) => {
    store.delete(e.key)
    return { value: undefined }
  })
  on('prompt.submit', ($, e) => {
    sent.push(e.text)
    return { text: e.text }
  })
  on('ui.toast', () => ({ value: undefined }))
  on('ui.open', () => ({ value: isPlaced ? { isPlaced: true } : { isPlaced: false, reason: 'no surface' } }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  return { store, sent }
}

test('pure: validation and /buttons argument', () => {
  expect(validate(' Run  tests ', ' npm test and fix ', 0)).toEqual({ label: 'Run tests', text: 'npm test and fix' })
  expect('error' in validate('', 'x', 0)).toBe(true)
  expect('error' in validate('x', '  ', 0)).toBe(true)
  expect('error' in validate('x', 'y', 9)).toBe(true)
  expect(parseIndex('', 3)).toBeUndefined()
  expect(parseIndex('2', 3)).toBe(1)
  expect(parseIndex('4', 3)).toEqual({ error: 'Pick 1 to 3.' })
  expect(parseIndex('x', 3)).toEqual({ error: 'Usage: /buttons [1-9]' })
})

test('add a button in the pane, press it, and it sends its instruction', async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  const { store, sent } = engine(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    if (surface === 'terminal') {
      expect(await ui.find({ text: /No buttons yet/ })).toBeDefined()
      await ui.input({ key: 'new-label', text: 'Run tests', kind: 'change' })
      await ui.input({ key: 'new-text', text: 'Run npm test and fix what fails' })
      expect(store.size).toBe(1)
    }
    await ui.press({ key: 'run-1700000000000' })
    await ui.unmount()
  }
  expect(sent).toEqual(['Run npm test and fix what fails', 'Run npm test and fix what fails'])
})

test('empty label or instruction shows an error and adds nothing', async ($, on) => {
  mock.clock(on)
  const { store } = engine(on)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.input({ key: 'new-text', text: 'do something' })
  expect(await ui.find({ text: /Give the button a label/ })).toBeDefined()
  expect(store.size).toBe(0)
})

test('while Claude works, /buttons n is queued, says so, and sends once the hook is done', async ($, on) => {
  const clock = mock.clock(on, { now: 1_700_000_000_000 })
  const { sent } = engine(on)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.input({ key: 'new-label', text: 'Changelog', kind: 'change' })
  await ui.input({ key: 'new-text', text: 'Write the changelog' })
  await $.turn.start({ turnId: 't1', text: 'something' })
  expect(await ui.find({ text: /Claude is working/ })).toBeDefined()
  const reply = await $.command.run({ command: 'buttons', args: '1', ...TYPED })
  expect(reply.text).toBe('Queued: Changelog (runs when Claude is done)')
  await clock.settle() // the scheduled send runs outside the command hook
  expect(sent).toEqual(['Write the changelog'])
  await $.turn.complete({ turnId: 't1', answer: 'ok', durationMs: 5, isAborted: false, reason: 'answer' })
  expect(await ui.find({ text: /ready/ })).toBeDefined()
})

test('delete removes the button from the pane and the store', async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  const { store } = engine(on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.input({ key: 'new-label', text: 'Lint', kind: 'change' })
  await ui.input({ key: 'new-text', text: 'Run the linter' })
  await ui.press({ key: 'del-1700000000000' })
  expect(store.size).toBe(0)
  expect(await ui.find({ text: /No buttons yet/ })).toBeDefined()
})

test('where nothing draws, /buttons lists them as text', async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  const { store } = engine(on, false)
  store.set('btn:1', { id: '1', label: 'Run tests', text: 'npm test' })
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  await $.session.start({ surface: 'vscode', isInteractive: true, cwd: '/work' })
  const reply = await $.command.run({ command: 'buttons', args: '', ...TYPED })
  expect(reply.text).toBe('1. Run tests')
})

test('language pt-BR: pane, validation and /buttons replies are in Portuguese', { options: { language: 'pt-BR' } }, async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  engine(on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ text: '◆ Botões de prompt' })).toBeDefined()
  expect(await ui.find({ text: /Nenhum botão ainda/ })).toBeDefined()
  await ui.input({ key: 'new-text', text: 'Run the linter' })
  expect(await ui.find({ text: /Dê um nome ao botão primeiro/ })).toBeDefined()
  const reply = await $.command.run({ command: 'buttons', args: 'x', ...TYPED })
  expect(reply.text).toBe('Uso: /buttons [1-9]')
})
