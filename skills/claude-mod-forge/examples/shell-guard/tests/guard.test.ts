import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { isSecretPath, riskOf } from '../hooks/rules'

// Stands in for Claude Code: answers every tool call that gets past the guard,
// and answers $.ui.ask (which reaches the engine as an AskUserQuestion call).
function engine(on: On, pick: string) {
  const ran: string[] = []
  on('tool.call', ($, e) => {
    if (e.tool === 'AskUserQuestion') {
      const question = (e as unknown as { questions: { question: string }[] }).questions[0]?.question ?? ''
      return { result: { answers: { [question]: pick } } }
    }
    ran.push(String(e.tool))
    return { result: 'ran' }
  })
  return ran
}

test('rules: risky commands and secret paths are recognised, safe ones are not', () => {
  expect(riskOf('rm -rf build')?.label).toBe('recursive force delete')
  expect(riskOf('git push -f origin main')?.label).toBe('force push')
  expect(riskOf('git push origin feature')).toBeUndefined()
  expect(riskOf('ls -la')).toBeUndefined()
  expect(isSecretPath('/repo/.env.local')).toBe(true)
  expect(isSecretPath('C:\keys\server.pem')).toBe(true)
  expect(isSecretPath('/repo/src/env.ts')).toBe(false)
})

test('a safe command runs without a question', async ($, on) => {
  const ran = engine(on, 'Refuse')
  const out = await $.tool.call({ tool: 'Bash', command: 'npm test' })
  expect(out.deny).toBeUndefined()
  expect(ran).toEqual(['Bash'])
})

test('a risky command runs only when the user picks Run it', async ($, on) => {
  const ran = engine(on, 'Run it')
  const out = await $.tool.call({ tool: 'Bash', command: 'rm -rf dist' })
  expect(out.deny).toBeUndefined()
  expect(ran).toEqual(['Bash'])
})

test('a risky command is refused when the user refuses', async ($, on) => {
  const ran = engine(on, 'Refuse')
  const out = await $.tool.call({ tool: 'Bash', command: 'git reset --hard HEAD~3' })
  expect(out.deny).toMatch(/declined/)
  expect(ran).toEqual([])
})

test('block mode refuses without asking', { options: { mode: 'block' } }, async ($, on) => {
  const ran = engine(on, 'Run it')
  on('ui.toast', () => ({ value: undefined }))
  const out = await $.tool.call({ tool: 'Bash', command: 'git push --force' })
  expect(out.deny).toMatch(/blocked a force push/)
  expect(ran).toEqual([])
})

test('edits to secret files are refused, other edits go through', async ($, on) => {
  const ran = engine(on, 'Refuse')
  const denied = await $.tool.call({ tool: 'Write', file_path: '/repo/.env', content: 'X=1' })
  expect(denied.deny).toMatch(/holds secrets/)
  const ok = await $.tool.call({ tool: 'Edit', file_path: '/repo/src/app.ts', old_string: 'a', new_string: 'b' })
  expect(ok.deny).toBeUndefined()
  expect(ran).toEqual(['Edit'])
})
