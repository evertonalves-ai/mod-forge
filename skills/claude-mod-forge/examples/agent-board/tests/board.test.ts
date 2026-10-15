import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { strings } from '../hooks/i18n'

const TYPED = { origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } } as const
const PANE = {
  plugin: 'agent-board',
  component: 'Pane',
  requestId: 'agent-board',
  viewport: { columns: 160, rows: 40, isFullscreen: true },
  props: { title: 'Agents', isFocused: true, bodyColumns: 70, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

// Stands in for Claude Code: two subagents, one working and one done.
function engine(on: On, isPlaced = true) {
  mock.clock(on)
  on('agent.list', () => ({
    value: [
      { id: 'a1', name: 'critic', type: 'general-purpose', description: 'Finds problems in the skill', status: 'running' as const },
      { id: 'a2', name: 'builder', type: 'general-purpose', description: 'Applies fixes', status: 'completed' as const },
    ],
  }))
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('ui.open', () => ({ value: isPlaced ? { isPlaced: true } : { isPlaced: false, reason: 'no surface' } }))
}

test('i18n: unknown languages fall back to English', () => {
  expect(strings('fr').heading).toBe('◆ Agents')
  expect(strings(undefined).status.running).toBe('working')
  expect(strings('pt-BR').status.running).toBe('trabalhando')
})

test('lists agents with their status on terminal and desktop', async ($, on) => {
  engine(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ text: 'critic' })).toBeDefined()
    expect(await ui.find({ text: 'working' })).toBeDefined()
    expect(await ui.find({ text: 'done' })).toBeDefined()
    expect(await ui.find({ text: /1 working/ })).toBeDefined()
    await ui.unmount()
  }
})

test('where no pane can be placed, /agents answers in text', async ($, on) => {
  engine(on, false)
  const reply = await $.command.run({ command: 'agents', args: '', ...TYPED })
  expect(reply.text).toBe('critic: working\nbuilder: done')
})

test('language pt-BR: the board is in Portuguese', { options: { language: 'pt-BR' } }, async ($, on) => {
  engine(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ text: '◆ Agentes' })).toBeDefined()
  expect(await ui.find({ text: 'trabalhando' })).toBeDefined()
  expect(await ui.find({ text: 'concluído' })).toBeDefined()
  expect(await ui.find({ text: /1 trabalhando/ })).toBeDefined()
})
