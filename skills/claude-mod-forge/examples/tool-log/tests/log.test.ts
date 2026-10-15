import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { fileName, redact, shouldRoll, summarize } from '../hooks/entry'

const DIR = { options: { logDir: 'C:/logs/claude' } }
const TURN = { answer: 'ok', durationMs: 10, isAborted: false, reason: 'answer' as const }

// An in-memory disk standing in for $.fs, plus the engine's answers.
function harness(on: On, failWrites = false, toasts: string[] = []) {
  const files = new Map<string, string>()
  on('fs.exists', ($, e) => ({ value: files.has(e.path) }))
  on('fs.read', ($, e) => ({ value: files.get(e.path) ?? '' }))
  on('fs.write', ($, e) => {
    if (failWrites) return { deny: 'read-only disk' }
    files.set(e.path, e.text)
    return { value: undefined }
  })
  on('session.id', () => ({ value: 'abc-123' }))
  on('session.start', () => ({ cwd: '/work' }))
  on('turn.complete', () => ({ text: '' }))
  on('ui.toast', ($, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.log', () => ({ value: undefined }))
  on('tool.call', ($, e) =>
    e.tool === 'Bash' && String((e as unknown as { command: string }).command).startsWith('rm')
      ? { deny: 'blocked by policy' }
      : e.tool === 'Read' ? { result: 'missing', isError: true } : { result: 'ok' },
  )
  return files
}

const lines = (files: Map<string, string>) =>
  [...files.values()].join('').trim().split('\n').filter(Boolean).map(l => JSON.parse(l) as Record<string, unknown>)

test('pure: redaction, summaries, file names, rolling', () => {
  expect(redact('API_TOKEN=abc123 npm publish')).toBe('API_TOKEN=*** npm publish')
  expect(redact('curl -H "Authorization: Bearer eyJhbGciOi.xyz"')).toMatch(/Authorization: Bearer \*\*\*/)
  expect(redact('git clone https://me:hunter2@host/repo')).toBe('git clone https://me:***@host/repo')
  expect(summarize('Write', { file_path: '/repo/a.ts', content: 'SECRET STUFF' })).toBe('/repo/a.ts')
  expect(fileName('C:/logs/', 'abc-123', Date.UTC(2026, 9, 15), 0)).toBe('C:/logs/2026-10-15_abc-123.jsonl')
  expect(fileName('C:/logs', 'abc-123', Date.UTC(2026, 9, 15), 2)).toBe('C:/logs/2026-10-15_abc-123-part2.jsonl')
  expect(shouldRoll(0, 10)).toBe(false)
  expect(shouldRoll(2 * 1024 * 1024 - 5, 10)).toBe(true)
})

test('each call becomes one redacted line, flushed at the end of the turn', DIR, async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 15, 12) })
  const files = harness(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

  await $.tool.call({ tool: 'Bash', command: 'GITHUB_TOKEN=ghp_abcdefghijklmnop git push' })
  await $.tool.call({ tool: 'Write', file_path: '/repo/.env', content: 'DB_PASSWORD=hunter2' })
  await $.tool.call({ tool: 'Read', file_path: '/repo/missing.md' })
  await $.tool.call({ tool: 'Bash', command: 'rm -rf dist' })
  expect(files.size).toBe(0) // nothing written mid-turn below the batch size

  await $.turn.complete({ turnId: 't1', ...TURN })
  const log = lines(files)
  // The engine hands $.fs paths over in the platform's absolute form: compare by name.
  const written = [...files.keys()].map(k => k.split('\\').join('/'))
  expect(written.length).toBe(1)
  expect(written[0]?.endsWith('logs/claude/2026-10-15_abc-123.jsonl')).toBe(true)
  expect(log.map(l => l.status)).toEqual(['ok', 'ok', 'error', 'denied'])
  expect(log[0]?.args).toBe('GITHUB_TOKEN=*** git push')
  expect(log[1]?.args).toBe('/repo/.env')
  expect(log[3]?.reason).toBe('blocked by policy')
  expect([...files.values()].join('')).not.toMatch(/hunter2|ghp_abc/)
})

test('a second turn appends to the same file', DIR, async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 15, 12) })
  const files = harness(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.tool.call({ tool: 'Glob', pattern: '*.ts' })
  await $.turn.complete({ turnId: 't1', ...TURN })
  await $.tool.call({ tool: 'Glob', pattern: '*.md' })
  await $.turn.complete({ turnId: 't2', ...TURN })
  expect(lines(files).map(l => l.args)).toEqual(['*.ts', '*.md'])
})

test('the tool result is never changed', DIR, async ($, on) => {
  mock.clock(on)
  harness(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(await $.tool.call({ tool: 'Bash', command: 'rm -rf x' })).toMatchObject({ deny: 'blocked by policy' })
  expect(await $.tool.call({ tool: 'Glob', pattern: '*' })).toMatchObject({ result: 'ok' })
})

test('no folder configured: nothing is logged, the user is told once', async ($, on) => {
  mock.clock(on)
  const toasts: string[] = []
  const files = harness(on, false, toasts)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.tool.call({ tool: 'Glob', pattern: '*' })
  await $.turn.complete({ turnId: 't1', ...TURN })
  expect(files.size).toBe(0)
  expect(toasts[0]).toMatch(/choose a log folder/)
})

test('an unwritable folder never breaks tool calls', DIR, async ($, on) => {
  mock.clock(on)
  harness(on, true)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(await $.tool.call({ tool: 'Glob', pattern: '*' })).toMatchObject({ result: 'ok' })
  await $.turn.complete({ turnId: 't1', ...TURN })
  expect(await $.tool.call({ tool: 'Glob', pattern: '*' })).toMatchObject({ result: 'ok' })
})
