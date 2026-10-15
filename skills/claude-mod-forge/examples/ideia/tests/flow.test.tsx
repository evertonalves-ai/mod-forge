import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import type { IdeiaEvent } from '../types'
import { parseEvents, toJsonl } from '../hooks/flow'
import { pairById } from '../hooks/pairs'

const TYPED = { origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } } as const
const PANE = {
  plugin: 'ideia',
  component: 'Pane',
  requestId: 'ideia',
  viewport: { columns: 160, rows: 50, isFullscreen: true },
  props: { title: 'Ideia', isFocused: true, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
} as const
// A test path only: the manifest default is "" so no personal path ships with the mod.
const FOLDER = 'C:/tmp/ideias'
const IDEA = 'An app to track monthly spending'
const DIR = 'ideias/2026-10-15-an-app-to-track-monthly-spending'
const USAGE = { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }

type Call = { model: string; system: string; prompt: string }
type Script = { ready?: boolean; failB?: number; mod?: 'yes' | 'no'; slowB?: number }

// Paths reach stubs in the platform's absolute form: key files by what follows the test folder.
const keyOf = (path: string) => {
  const p = path.replace(/\\/g, '/')
  const at = p.indexOf('ideias/')
  return at >= 0 ? p.slice(at) : p
}

function engine(on: On, script: Script = {}, store: Record<string, unknown> = {}, files = new Map<string, string>()) {
  const clock = mock.clock(on, { now: Date.UTC(2026, 9, 15, 12) })
  mock.store(on, store)
  const calls: Call[] = []
  const sent: string[] = []
  let bCalls = 0
  on('model.complete', async ($, e) => {
    const call = { model: e.model, system: e.system ?? '', prompt: e.prompt }
    calls.push(call)
    const answer = (text: string) => ({ value: { isAnswered: true as const, text, usage: USAGE } })
    if (call.prompt.includes('Pick the pair')) return answer('user-eng | An app has to balance what people want with what can be built.')
    if (call.prompt.includes('Summarize this round')) return answer('Decided: the budget bar\nOpen: bank import')
    if (call.system.includes('turn a design dialogue')) {
      return answer('# Budget bar\n\n## The idea in one sentence\n\nA spending app whose budget empties like a bar.\n\n## First steps\n\n- Sketch the bar')
    }
    if (call.system.includes('check that a document')) return answer(`OK\nMOD: ${script.mod ?? 'no'}`)
    const side = call.system.includes('You are side A') ? 'A' : 'B'
    if (side === 'B') {
      bCalls += 1
      if (script.slowB !== undefined) await clock.sleep(script.slowB)
      if (script.failB === bCalls) return { value: { isAnswered: false as const, reason: 'api-error' as const, status: 529, error: 'overloaded' as const, usage: USAGE } }
    }
    const round = /Round (\d+) of/.exec(call.prompt)?.[1] ?? '?'
    return answer(`${side} speaks in round ${round}.\nSTATUS: ${script.ready ? 'ready' : 'continue'}`)
  })
  on('fs.exists', ($, e) => ({ value: files.has(keyOf(e.path)) }))
  on('fs.read', ($, e) => ({ value: files.get(keyOf(e.path)) ?? '' }))
  on('fs.write', ($, e) => {
    files.set(keyOf(e.path), e.text)
    return { value: undefined }
  })
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.toast', () => ({ value: undefined }))
  on('prompt.submit', ($, e) => {
    sent.push(e.text)
    return { text: e.text }
  })
  const sides = () => calls.filter(c => c.system.includes('You are side'))
  const saved = () => parseEvents(files.get(`${DIR}/dialogue.jsonl`) ?? '')
  return { clock, calls, sides, sent, files, saved }
}

const WITH = (extra: Record<string, unknown> = {}) => ({ options: { folder: FOLDER, rounds: 2, ...extra } })

test('no folder: /ideia and the pane say how to set it, nothing is written', async ($, on) => {
  const { files } = engine(on)
  await $.command.run({ command: 'ideia', args: IDEA, ...TYPED })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ text: /Set the folder for conversations in \/config/ })).toBeDefined()
  expect(files.size).toBe(0)
})

test('a whole conversation: suggestion, accept, rounds with a comment, document and the mod offer', WITH(), async ($, on) => {
  const { clock, sides, sent, files, saved } = engine(on, { mod: 'yes' })
  await $.command.run({ command: 'ideia', args: IDEA, ...TYPED })
  await clock.settle()
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ text: 'Suggested pair: User × Engineering' })).toBeDefined()
  expect(await ui.find({ text: /balance what people want/ })).toBeDefined()

  await ui.press({ key: 'accept' })
  await clock.settle()
  expect(sides().map(c => /You are side (.)/.exec(c.system)?.[1])).toEqual(['A', 'B', 'A'])
  expect(await ui.find({ text: 'End of round 1' })).toBeDefined()
  expect(await ui.find({ text: /Decided: the budget bar/ })).toBeDefined()
  expect(await ui.find({ text: 'B speaks in round 1.' })).toBeDefined()

  await ui.input({ key: 'comment', text: 'focus on people aged 18 to 25' })
  await ui.press({ key: 'next' })
  await clock.settle()
  const round2 = sides()[3]
  expect(round2?.prompt).toContain('User comment: focus on people aged 18 to 25')
  expect(round2?.prompt).toContain('Round 2 of at most 2. You are side A.')

  expect(await ui.find({ text: /^Saved: .*ideia\.md$/ })).toBeDefined()
  const doc = files.get(`${DIR}/ideia.md`) ?? ''
  expect(doc.startsWith('# Budget bar')).toBe(true)
  expect(doc).toContain('## How the conversation went\n\n- Round 1: User × Engineering\n- Round 2: User × Engineering')
  expect(doc).toContain('- focus on people aged 18 to 25')
  expect(saved().map(e => e.type)).toEqual(['start', 'pair', 'msg', 'msg', 'msg', 'summary', 'comment', 'msg', 'msg', 'msg', 'summary', 'doc'])

  await ui.press({ key: 'mod' })
  await clock.settle()
  expect(sent).toHaveLength(1)
  expect(sent[0]).toMatch(/claude-mod-forge skill in create mode .*ideia\.md/)
})

test('both sides ready in round 2: the document is written before the round limit', WITH({ rounds: 4, pause: false }), async ($, on) => {
  const { clock, sides, saved } = engine(on, { ready: true })
  await $.command.run({ command: 'ideia', args: IDEA, ...TYPED })
  await clock.settle()
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'accept' })
  await clock.settle()
  expect(sides()).toHaveLength(6)
  expect(saved().at(-1)?.type).toBe('doc')
})

test('pause off runs the rounds back to back; MOD: no shows no mod button', WITH({ pause: false }), async ($, on) => {
  const { clock, sides } = engine(on, { mod: 'no' })
  await $.command.run({ command: 'ideia', args: IDEA, ...TYPED })
  await clock.settle()
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'accept' })
  await clock.settle()
  expect(sides()).toHaveLength(6)
  expect(await ui.find({ text: /^Saved:/ })).toBeDefined()
  expect(await ui.find({ key: 'mod' })).toBeUndefined()
})

test('a failed call stops with the reason; try again continues', WITH(), async ($, on) => {
  const { clock, sides } = engine(on, { failB: 1 })
  await $.command.run({ command: 'ideia', args: IDEA, ...TYPED })
  await clock.settle()
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'accept' })
  await clock.settle()
  expect(await ui.find({ text: /✗ Something failed: the model API answered with an error \(overloaded\)/ })).toBeDefined()
  await ui.press({ key: 'retry' })
  await clock.settle()
  expect(sides()).toHaveLength(4)
  expect(await ui.find({ text: 'End of round 1' })).toBeDefined()
})

test('finish at a round end writes the document from what exists', WITH({ rounds: 4 }), async ($, on) => {
  const { clock, sides, files } = engine(on)
  await $.command.run({ command: 'ideia', args: IDEA, ...TYPED })
  await clock.settle()
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'accept' })
  await clock.settle()
  await ui.press({ key: 'finish' })
  await clock.settle()
  expect(sides()).toHaveLength(3)
  expect(files.get(`${DIR}/ideia.md`)).toContain('- Round 1: User × Engineering')
})

test('change pair at a round end: round 2 thinks with the new pair', WITH(), async ($, on) => {
  const { clock, sides } = engine(on)
  await $.command.run({ command: 'ideia', args: IDEA, ...TYPED })
  await clock.settle()
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'accept' })
  await clock.settle()
  await ui.press({ key: 'change' })
  await ui.select({ key: 'pair', value: 'advocate-devil' })
  expect(await ui.find({ text: "Next round: Advocate × Devil's advocate" })).toBeDefined()
  await ui.press({ key: 'next' })
  await clock.settle()
  expect(sides()[3]?.system).toContain('Your line of thought: Advocate.')
  expect(sides()[4]?.system).toContain("Your line of thought: Devil's advocate.")
})

test('resume: a conversation without a document is offered and continues where it stopped', WITH(), async ($, on) => {
  const pair = pairById('open-narrow', 'en')
  const ts = '2026-10-14T10:00:00.000Z'
  const old: IdeiaEvent[] = [
    { type: 'start', idea: 'A channel about city history', ts },
    { type: 'pair', round: 1, pair: pair!, why: '', ts },
    { type: 'msg', side: 'A', round: 1, position: 'open', text: 'What if each video is one street?', isReady: false, from: 'A · Open', to: 'B · Narrow', kind: 'note', ts },
    { type: 'msg', side: 'B', round: 1, position: 'respond', text: 'Must have: one street per video.', isReady: false, from: 'B · Narrow', to: 'A · Open', kind: 'note', ts },
  ]
  const files = new Map([['ideias/2026-10-14-a-channel/dialogue.jsonl', toJsonl(old)]])
  const { clock, sides } = engine(on, {}, { 'ideia:last': 'C:/tmp/ideias/2026-10-14-a-channel' }, files)
  await $.command.run({ command: 'ideia', args: '', ...TYPED })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ text: 'A conversation stopped at round 1: "A channel about city history"' })).toBeDefined()
  await ui.press({ key: 'resume' })
  await clock.settle()
  expect(sides()).toHaveLength(1)
  expect(sides()[0]?.prompt).toContain('Reply to side B')
  expect(await ui.find({ text: 'End of round 1' })).toBeDefined()
  expect(parseEvents(files.get('ideias/2026-10-14-a-channel/dialogue.jsonl') ?? '')).toHaveLength(6)
})

test('pt-BR: the pane is in Portuguese and the thinkers are asked to write in Portuguese', WITH({ language: 'pt-BR', rounds: 1, pause: false }), async ($, on) => {
  const { clock, calls, sides } = engine(on)
  await $.command.run({ command: 'ideia', args: 'Um app para controlar gastos', ...TYPED })
  await clock.settle()
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ text: 'Par sugerido: Usuário × Engenharia' })).toBeDefined()
  await ui.press({ key: 'accept' })
  await clock.settle()
  expect(sides().every(c => c.system.includes('Write in Brazilian Portuguese.'))).toBe(true)
  expect(calls.find(c => c.prompt.includes('Summarize'))?.prompt).toContain('"Decidido:"')
  expect(await ui.find({ text: /^Salvo:/ })).toBeDefined()
})

test('the round end draws on the terminal and the desktop', WITH(), async ($, on) => {
  const { clock } = engine(on)
  await $.command.run({ command: 'ideia', args: IDEA, ...TYPED })
  await clock.settle()
  const first = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await first.press({ key: 'accept' })
  await clock.settle()
  await first.unmount()
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ text: 'End of round 1' })).toBeDefined()
    expect(await ui.find({ text: 'A speaks in round 1.' })).toBeDefined()
    expect(await ui.find({ key: 'comment' })).toBeDefined()
    await ui.unmount()
  }
})

test('pause during a round stops after the message in flight; resume finishes the round', WITH(), async ($, on) => {
  const { clock, sides } = engine(on, { slowB: 5000 })
  await $.command.run({ command: 'ideia', args: IDEA, ...TYPED })
  await clock.settle()
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'accept' })
  await clock.settle()
  expect(await ui.find({ text: /B · Engineering is thinking/ })).toBeDefined()
  await ui.press({ key: 'pause' })
  expect(await ui.find({ text: /pausing after this message/ })).toBeDefined()
  await clock.advance(5000)
  expect(await ui.find({ text: /⏸ paused/ })).toBeDefined()
  expect(sides()).toHaveLength(2)
  await ui.press({ key: 'unpause' })
  await clock.settle()
  expect(sides()).toHaveLength(3)
  expect(await ui.find({ text: 'End of round 1' })).toBeDefined()
})

test('finish now while a side is thinking writes the document from what exists', WITH({ rounds: 4 }), async ($, on) => {
  const { clock, files, saved } = engine(on, { slowB: 60_000 })
  await $.command.run({ command: 'ideia', args: IDEA, ...TYPED })
  await clock.settle()
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'accept' })
  await clock.settle()
  await ui.press({ key: 'finish' })
  // The engine resolves an aborted call as "aborted"; this stub's own wait is the test's, so let it end.
  await clock.advance(60_000)
  expect(saved().filter(e => e.type === 'msg').length).toBeLessThanOrEqual(2)
  expect(files.get(`${DIR}/ideia.md`)).toContain('- Round 1: User × Engineering')
  expect(await ui.find({ text: /^Saved:/ })).toBeDefined()
})

test('resume ignores a saved folder outside the configured one', WITH(), async ($, on) => {
  const files = new Map([['ideias/x/dialogue.jsonl', '{"type":"start","idea":"old","ts":""}\n']])
  engine(on, {}, { 'ideia:last': 'C:/elsewhere/2026-10-14-old' }, files)
  await $.command.run({ command: 'ideia', args: '', ...TYPED })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ key: 'idea' })).toBeDefined()
  expect(await ui.find({ key: 'resume' })).toBeUndefined()
})
