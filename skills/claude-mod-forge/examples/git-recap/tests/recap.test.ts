import { expect, test } from 'claude-code/testing'

import { formatLog, parseDays } from '../hooks/recap'

const TYPED = { origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } } as const

test('arguments: default, valid, invalid and out of range', () => {
  expect(parseDays('')).toEqual({ days: 1 })
  expect(parseDays(' 7 ')).toEqual({ days: 7 })
  expect('error' in parseDays('abc')).toBe(true)
  expect('error' in parseDays('0')).toBe(true)
  expect('error' in parseDays('31')).toBe(true)
  expect('error' in parseDays('7; rm -rf /')).toBe(true)
})

test('formatting: empty log and a two-commit log', () => {
  expect(formatLog('', 3)).toBe('No commits in the last 3 day(s).')
  expect(formatLog('abc123\t2026-10-14\tfix: x\ndef456\t2026-10-13\tfeat: y', 2)).toMatch(/^2 commit\(s\)[\s\S]*abc123 fix: x/)
})

test('/recap 3 runs git with an argv list and prints the commits', async ($, on) => {
  let argv: readonly string[] = []
  on('process.run', ($, e) => {
    argv = e.argv
    return { value: { exitCode: 0, stdout: 'abc123\t2026-10-14\tfix: login', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  const answer = await $.command.run({ command: 'recap', args: '3', ...TYPED })
  expect(argv[0]).toBe('git')
  expect(argv).toContain('--since=3.days')
  expect(answer.text).toMatch(/1 commit\(s\) in the last 3 day\(s\)/)
})

test('/recap outside a repository explains instead of failing', async ($, on) => {
  on('process.run', () => ({ value: { exitCode: 128, stdout: '', stderr: 'fatal: not a git repository', isStdoutTruncated: false, isStderrTruncated: false } }))
  const answer = await $.command.run({ command: 'recap', args: '', ...TYPED })
  expect(answer.text).toBe('This folder is not a git repository.')
})

test('/recap with bad input never starts a process', async ($, on) => {
  let calls = 0
  on('process.run', () => {
    calls += 1
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  const answer = await $.command.run({ command: 'recap', args: 'lots', ...TYPED })
  expect(answer.text).toMatch(/not a number of days/)
  expect(calls).toBe(0)
})

test('session.start registers /recap with its hint', async ($, on) => {
  const registered: { name: string; argumentHint?: string }[] = []
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', ($, e) => {
    registered.push(e)
    // The types say command.register resolves to { command }; the docs' table says undefined.
    return { value: { command: e.name } }
  })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(registered[0]?.name).toBe('recap')
  expect(registered[0]?.argumentHint).toBe('[days]')
})
