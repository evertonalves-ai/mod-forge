import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { failureAnswer, isSecretPath, riskOf } from '../hooks/rules'

// Stands in for Claude Code: answers every tool call that gets past the guard,
// and answers $.ui.ask (which reaches the engine as an AskUserQuestion call).
// pick 'nobody' makes the question fail, as a closed dialog or a claude -p run does.
function engine(on: On, pick: string) {
  const ran: string[] = []
  on('tool.call', ($, e) => {
    if (e.tool === 'AskUserQuestion') {
      if (pick === 'nobody') throw new Error('no one to answer')
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
  expect(riskOf('Remove-Item -Path .\\dist -Recurse -Force')?.label).toBe('recursive force delete')
  expect(riskOf('Remove-Item notes.txt')).toBeUndefined()
  expect(riskOf('Format-Volume -DriveLetter D')?.label).toBe('disk format')
  expect(isSecretPath('/repo/.env.local')).toBe(true)
  expect(isSecretPath('C:\\keys\\server.pem')).toBe(true)
  expect(isSecretPath('C:\\repo\\.env')).toBe(true)
  expect(isSecretPath('/repo/src/env.ts')).toBe(false)
})

test('rules: rm with recursive and force flags in any order or spelling', () => {
  for (const cmd of ['rm -rf build', 'rm -fr build', 'rm -r -f build', 'rm -f -r build', 'rm -R -f build', 'rm --recursive --force build', 'rm --force -r build'])
    expect(riskOf(cmd)?.label).toBe('recursive force delete')
  for (const cmd of ['rm -r build', 'rm -f notes.txt', 'rm notes.txt', 'rm -r build && ls -f'])
    expect(riskOf(cmd)).toBeUndefined()
})

test('rules: git push with a +refspec forces too', () => {
  expect(riskOf('git push origin +main')?.label).toBe('force push')
  expect(riskOf('git push origin +HEAD:main')?.label).toBe('force push')
  expect(riskOf('git push origin main')).toBeUndefined()
})

test('fails closed: if nobody can answer the question, the command is refused', async ($, on) => {
  const ran = engine(on, 'nobody')
  const out = await $.tool.call({ tool: 'Bash', command: 'rm -rf dist' })
  expect(out.deny).toMatch(/declined/)
  expect(ran).toEqual([])
})

test('Monitor commands are guarded; a Monitor call with no command goes through', async ($, on) => {
  const ran = engine(on, 'Refuse')
  const risky = await $.tool.call({ tool: 'Monitor', command: 'rm -r -f /tmp/watch', description: 'watch', timeout_ms: 1000 })
  expect(risky.deny).toMatch(/declined/)
  const plain = await $.tool.call({ tool: 'Monitor', description: 'watch', timeout_ms: 1000, ws: { url: 'wss://example.test' } })
  expect(plain.deny).toBeUndefined()
  expect(ran).toEqual(['Monitor'])
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

test('PowerShell commands are guarded too, not only Bash', async ($, on) => {
  const ran = engine(on, 'Refuse')
  const out = await $.tool.call({ tool: 'PowerShell', command: 'Remove-Item -Recurse -Force C:\\repo\\build' })
  expect(out.deny).toMatch(/declined/)
  const ok = await $.tool.call({ tool: 'PowerShell', command: 'Get-ChildItem' })
  expect(ok.deny).toBeUndefined()
  expect(ran).toEqual(['PowerShell'])
})

test('off mode passes everything through', { options: { mode: 'off' } }, async ($, on) => {
  const ran = engine(on, 'Refuse')
  const out = await $.tool.call({ tool: 'Bash', command: 'rm -rf dist' })
  expect(out.deny).toBeUndefined()
  expect(ran).toEqual(['Bash'])
})

test('fail closed: the .catch answer refuses before next() and defers to next() after it', () => {
  // The guards wire this into .catch (validate lists them as "gating hook with .catch").
  expect(failureAnswer('shell-guard', false, 'command')?.deny).toMatch(/the check failed, so the command was not run/)
  expect(failureAnswer('shell-guard', false, 'edit')?.deny).toMatch(/edit was not made/)
  expect(failureAnswer('shell-guard', true, 'command')).toBeUndefined()
})

test('rules: a flag glued to a quote and a quoted +refspec are still caught', () => {
  expect(riskOf('rm -rf"$DIR"')?.label).toBe('recursive force delete')
  expect(riskOf("rm -r -f'/tmp/x'")?.label).toBe('recursive force delete')
  expect(riskOf('git push origin "+main"')?.label).toBe('force push')
  expect(riskOf("git push origin '+HEAD:main'")?.label).toBe('force push')
  expect(riskOf('git push origin "main"')).toBeUndefined()
})

test('language pt-BR: the question and its options are in Portuguese, the deny reason stays English', { options: { language: 'pt-BR' } }, async ($, on) => {
  const asked: { question: string; options: string[] }[] = []
  on('tool.call', ($, e) => {
    if (e.tool === 'AskUserQuestion') {
      const q = (e as unknown as { questions: { question: string; options: { label: string }[] }[] }).questions[0]
      asked.push({ question: q?.question ?? '', options: (q?.options ?? []).map(o => o.label) })
      return { result: { answers: { [q?.question ?? '']: 'Recusar' } } }
    }
    return { result: 'ran' }
  })
  const out = await $.tool.call({ tool: 'Bash', command: 'git reset --hard HEAD~3' })
  expect(asked[0]?.question).toMatch(/^reset --hard \(descarta trabalho não commitado\)\. Executar este comando\?/)
  expect(asked[0]?.options).toEqual(['Executar', 'Recusar'])
  expect(out.deny).toMatch(/The user declined this hard reset/)
})

test('language pt-BR: block mode toasts in Portuguese', { options: { mode: 'block', language: 'pt-BR' } }, async ($, on) => {
  const toasts: string[] = []
  engine(on, 'Executar')
  on('ui.toast', ($, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  const out = await $.tool.call({ tool: 'Bash', command: 'git push --force' })
  expect(toasts).toEqual(['Bloqueado: push forçado'])
  expect(out.deny).toMatch(/blocked a force push/)
})
