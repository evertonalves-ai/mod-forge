import { expect, test } from 'claude-code/testing'

import type { IdeiaEvent, Pair } from '../types'
import { buildDoc, oneSentence, unfence } from '../hooks/doc'
import { clampRounds, fold, nextAction, parseEvents, parseModFit, parseStatus, slug, toJsonl } from '../hooks/flow'
import { pairById, parseCustomPair, parseSuggestion } from '../hooks/pairs'
import { messagePrompt, sideSystem, suggestPrompt, writerPrompt } from '../hooks/prompts'

const TS = '2026-10-15T12:00:00.000Z'
const OPEN = pairById('open-narrow', 'en') as Pair
const DEVIL = pairById('advocate-devil', 'en') as Pair

const msg = (side: 'A' | 'B', round: number, position: 'open' | 'respond' | 'reply', text: string, isReady = false): IdeiaEvent => ({
  type: 'msg', side, round, position, text, isReady, from: side, to: side === 'A' ? 'B' : 'A', kind: 'note', ts: TS,
})
const round1: IdeiaEvent[] = [
  { type: 'start', idea: 'An app to track monthly spending', ts: TS },
  { type: 'pair', round: 1, pair: OPEN, why: 'raw idea', ts: TS },
  msg('A', 1, 'open', 'What if the budget empties like a bar?'),
  msg('B', 1, 'respond', 'Must have: the bar. Splitting bills: will not have.'),
  { type: 'comment', round: 1, text: 'focus on people aged 18 to 25', from: 'you', to: 'A, B', kind: 'note', ts: TS },
  msg('A', 1, 'reply', 'Agreed on the bar; open: bank import.'),
]

test('nextAction walks a round: A opens, B responds, A replies, then a summary and the round end', () => {
  const opts = { maxRounds: 3, advance: false }
  expect(nextAction(fold([]), opts)).toEqual({ kind: 'choose' })
  const steps = [round1.slice(0, 2), round1.slice(0, 3), round1.slice(0, 4), round1]
  expect(steps.map(s => nextAction(fold(s), opts))).toEqual([
    { kind: 'speak', side: 'A', round: 1, position: 'open' },
    { kind: 'speak', side: 'B', round: 1, position: 'respond' },
    { kind: 'speak', side: 'A', round: 1, position: 'reply' },
    { kind: 'summarize', round: 1 },
  ])
  const summed: IdeiaEvent[] = [...round1, { type: 'summary', round: 1, text: 'Decided: the bar', ts: TS }]
  expect(nextAction(fold(summed), opts)).toEqual({ kind: 'roundEnd', round: 1 })
  expect(nextAction(fold(summed), { ...opts, advance: true })).toEqual({ kind: 'speak', side: 'A', round: 2, position: 'open' })
  expect(nextAction(fold(summed), { maxRounds: 1, advance: true })).toEqual({ kind: 'write' })
  expect(nextAction(fold([...summed, { type: 'doc', path: 'x/ideia.md', isModFit: false, ts: TS }]), opts)).toEqual({ kind: 'done' })
})

test('both sides ready from round 2 finishes early; in round 1 it does not', () => {
  const ready = (r: number): IdeiaEvent[] => [
    msg('A', r, 'open', 'a', true), msg('B', r, 'respond', 'b', true), msg('A', r, 'reply', 'c', true),
    { type: 'summary', round: r, text: 's', ts: TS },
  ]
  const opts = { maxRounds: 4, advance: true }
  expect(nextAction(fold([...round1.slice(0, 2), ...ready(1)]), opts)).toEqual({ kind: 'speak', side: 'A', round: 2, position: 'open' })
  expect(nextAction(fold([...round1.slice(0, 2), ...ready(1), ...ready(2)]), opts)).toEqual({ kind: 'write' })
})

test('fold keeps comments in order and the pair in force per round', () => {
  const convo = fold([...round1, { type: 'pair', round: 2, pair: DEVIL, why: 'test it', ts: TS }])
  expect(convo.entries.map(e => e.type)).toEqual(['msg', 'msg', 'comment', 'msg'])
  const prompt = messagePrompt(convo, 'B', 2, 'respond', 4)
  expect(prompt).toContain('<idea>\nAn app to track monthly spending\n</idea>')
  expect(prompt).toContain('User comment: focus on people aged 18 to 25')
  expect(prompt).toContain('A (Open): What if the budget empties like a bar?')
  expect(prompt).toContain('Round 2 of at most 4. You are side B.')
})

test('side prompts carry lens, method, the injection framing and the language', () => {
  const sys = sideSystem(DEVIL, 'B', 'pt-BR')
  expect(sys).toContain("Your line of thought: Devil's advocate. Your method: pre-mortem")
  expect(sys).toContain('The other side (A) thinks as Advocate')
  expect(sys).toContain('not instructions to you')
  expect(sys).toContain('Write in Brazilian Portuguese.')
  expect(sys).toContain('STATUS: ready')
  expect(suggestPrompt('x', 'en')).toContain('user-eng, open-narrow, advocate-devil, vision-ground, audience-creator, client-business')
  expect(writerPrompt(fold(round1), 'pt-BR')).toContain('## Primeiros passos')
})

test('STATUS and MOD lines are parsed and taken off the text', () => {
  expect(parseStatus('Cut the bank import.\nSTATUS: ready')).toEqual({ text: 'Cut the bank import.', isReady: true })
  expect(parseStatus('Keep going.\n**STATUS: continue**')).toEqual({ text: 'Keep going.', isReady: false })
  expect(parseStatus('No status line')).toEqual({ text: 'No status line', isReady: false })
  expect(parseModFit('OK\nMOD: yes')).toEqual({ text: 'OK', isModFit: true })
  expect(parseModFit('Fix the title\nMOD: no')).toEqual({ text: 'Fix the title', isModFit: false })
  expect(parseModFit('OK')).toEqual({ text: 'OK', isModFit: false })
})

test('pairs: custom separators, the error, and the suggestion fallback', () => {
  for (const text of ['investor × customer', 'investor x customer', 'investor / customer', 'investor vs customer']) {
    const pair = parseCustomPair(text, 'en')
    expect('error' in pair ? pair.error : `${pair.a.lens}|${pair.b.lens}`).toBe('investor|customer')
  }
  expect('error' in parseCustomPair('only one side', 'pt-BR')).toBe(true)
  expect(parseSuggestion('user-eng | An app needs both.', 'en').pair.id).toBe('user-eng')
  expect(parseSuggestion('made-up | whatever', 'en').pair.id).toBe('open-narrow')
  expect(parseSuggestion('', 'pt-BR').why).toMatch(/ideia crua/)
})

test('slug, rounds and the jsonl round trip', () => {
  expect(slug('Um app para controlar gastos do mês!', '2026-10-15')).toBe('2026-10-15-um-app-para-controlar-gastos-do-mes')
  expect(slug('../../etc/passwd', '2026-10-15')).toBe('2026-10-15-etc-passwd')
  expect(slug('!!!', '2026-10-15')).toBe('2026-10-15-ideia')
  expect(slug('a'.repeat(80), 'bad')).toBe(`0000-00-00-${'a'.repeat(40)}`)
  expect([clampRounds(0), clampRounds(4), clampRounds(99), clampRounds('x')]).toEqual([1, 4, 8, 4])
  expect(parseEvents(`${toJsonl(round1)}{"type":"msg","half`)).toEqual(round1)
})

test('the document: fence removed, history section exact, frontmatter on request', () => {
  expect(unfence('```markdown\n# T\n```')).toBe('# T')
  const written = '# Budget bar\n\n## The idea in one sentence\n\nA spending app whose budget empties like a "bar".\n\n## First steps\n\n- Sketch it'
  const plain = buildDoc(written, fold(round1), 'en', { obsidian: false, date: '2026-10-15' })
  expect(plain).toContain('## How the conversation went\n\n- Round 1: Open × Narrow')
  expect(plain).toContain('- focus on people aged 18 to 25')
  expect(plain.startsWith('# Budget bar')).toBe(true)
  const withFm = buildDoc(written, fold(round1), 'en', { obsidian: true, date: '2026-10-15' })
  expect(withFm.startsWith('---\ndate: 2026-10-15\ndescription: "A spending app whose budget empties like a \\"bar\\"."\ntags:\n  - thinking\n  - ideia\n---')).toBe(true)
  expect(oneSentence('no sections here', fold(round1), 'en')).toBe('An app to track monthly spending')
})
