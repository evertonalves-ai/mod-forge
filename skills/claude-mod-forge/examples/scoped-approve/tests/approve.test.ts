import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { allowedBy, parseList } from '../hooks/allow'

const TYPED = { origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } } as const
const LIST = { options: { allowList: 'git status, npm test' } }

// Stands in for Claude Code's own permission decision.
function engine(on: On, decision: 'allow' | 'ask' | 'deny') {
  on('tool.check', () => ({ decision }))
  on('ui.log', () => ({ value: undefined }))
}

test('rules: exact or with arguments, never compound', () => {
  const list = parseList(' git status ,npm test,, rm -rf x; ls ')
  expect(list).toEqual(['git status', 'npm test'])
  expect(allowedBy('git status', list)).toBe('git status')
  expect(allowedBy('git status --short', list)).toBe('git status')
  expect(allowedBy('git statusx', list)).toBeUndefined()
  expect(allowedBy('git status && rm -rf /', list)).toBeUndefined()
  expect(allowedBy('npm test | tee out', list)).toBeUndefined()
  expect(allowedBy('echo $(whoami)', list)).toBeUndefined()
})

test('an allow-listed command that would ask is approved and logged', LIST, async ($, on) => {
  mock.clock(on)
  engine(on, 'ask')
  const out = await $.tool.check({ tool: 'Bash', input: { command: 'git status --short' } })
  expect(out.decision).toBe('allow')
  const shown = await $.command.run({ command: 'approvals', args: '', ...TYPED })
  expect(shown.text).toMatch(/git status --short/)
})

test('a deny from rules or hooks is never turned into allow', LIST, async ($, on) => {
  mock.clock(on)
  engine(on, 'deny')
  const out = await $.tool.check({ tool: 'Bash', input: { command: 'git status' } })
  expect(out.decision).toBe('deny')
})

test('commands off the list keep asking', LIST, async ($, on) => {
  mock.clock(on)
  engine(on, 'ask')
  expect((await $.tool.check({ tool: 'Bash', input: { command: 'git push' } })).decision).toBe('ask')
  expect((await $.tool.check({ tool: 'Bash', input: { command: 'git status; rm -rf x' } })).decision).toBe('ask')
})

test('subagents keep the normal prompt', LIST, async ($, on) => {
  mock.clock(on)
  engine(on, 'ask')
  const out = await $.tool.check({ tool: 'Bash', input: { command: 'npm test' }, agentId: 'agent-1' })
  expect(out.decision).toBe('ask')
})

test('disabled approves nothing', { options: { allowList: 'npm test', enabled: false } }, async ($, on) => {
  mock.clock(on)
  engine(on, 'ask')
  expect((await $.tool.check({ tool: 'Bash', input: { command: 'npm test' } })).decision).toBe('ask')
})

test('if the approver breaks after deciding, the engine verdict stands', LIST, async ($, on) => {
  // No mock.clock: $.clock.now() rejects inside the hook, after next() was called.
  engine(on, 'ask')
  const out = await $.tool.check({ tool: 'Bash', input: { command: 'npm test' } })
  expect(out.decision).toBe('ask')
})
