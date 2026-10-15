import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { parseDialogue } from '../hooks/parse'

const TYPED = { origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } } as const
const PANE = {
  plugin: 'agent-dialogue',
  component: 'Pane',
  requestId: 'agent-dialogue',
  viewport: { columns: 160, rows: 40, isFullscreen: true },
  props: { title: 'Agent dialogue', isFocused: true, bodyColumns: 70, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const
// A test path only: the manifest default is "" so no personal path ships with the mod.
const FILE = 'C:/tmp/dialogue.jsonl'
const WITH_FILE = { options: { file: FILE } }
const TEXT = [
  JSON.stringify({ from: 'critic', to: 'builder', kind: 'finding', text: 'The README overclaims VS Code support.', ts: '2026-10-15T12:00:00Z' }),
  JSON.stringify({ from: 'builder', to: 'critic', kind: 'fix', text: 'Reworded it; checker green.', ts: '2026-10-15T12:05:00Z' }),
  '{"from":"critic","text":"half-writ',
].join('\n')

function engine(on: On, exists: boolean, reads: string[] = []) {
  mock.clock(on)
  on('fs.exists', () => ({ value: exists }))
  on('fs.read', ($, e) => {
    reads.push(e.path)
    return { value: TEXT }
  })
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
}

test('parser skips a half-written last line', () => {
  expect(parseDialogue(TEXT).map(l => l.from)).toEqual(['critic', 'builder'])
})

test('pane shows the conversation and filters by author', WITH_FILE, async ($, on) => {
  engine(on, true)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ text: /overclaims VS Code/ })).toBeDefined()
  expect(await ui.find({ text: /Reworded it/ })).toBeDefined()
  expect(await ui.find({ text: /→ builder · finding/ })).toBeDefined()
  await ui.select({ key: 'author', value: 'critic' })
  expect(await ui.find({ text: /Reworded it/ })).toBeUndefined()
})

test('before the file exists it says it is waiting', WITH_FILE, async ($, on) => {
  engine(on, false)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ text: /waiting for the agents/ })).toBeDefined()
})

test('no file configured: the pane and /dialogue say how to set it, nothing is read', async ($, on) => {
  const reads: string[] = []
  engine(on, true, reads)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ text: /Set the dialogue file in \/config/ })).toBeDefined()
  const reply = await $.command.run({ command: 'dialogue', args: '', ...TYPED })
  expect(reply.text).toMatch(/Set the dialogue file/)
  expect(reads).toEqual([])
})

test('language pt-BR: the pane is in Portuguese', { options: { file: FILE, language: 'pt-BR' } }, async ($, on) => {
  engine(on, true)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ text: '◆ Diálogo dos agentes' })).toBeDefined()
  expect(await ui.find({ text: /→ builder · achado/ })).toBeDefined()
  expect(await ui.find({ text: '2 mensagens' })).toBeDefined()
})
