import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { byteLength, fileName, MAX_FILE_BYTES, redact, shouldRoll, summarize } from '../hooks/entry'

const DIR = { options: { logDir: 'C:/logs/claude' } }
const TURN = { answer: 'ok', durationMs: 10, isAborted: false, reason: 'answer' as const }

// An in-memory disk standing in for $.fs, plus the engine's answers. The engine hands $.fs absolute
// paths, so lookups match by file name: a test can seed a file under any folder.
function harness(on: On, failWrites = false, toasts: string[] = [], unreadable: string[] = []) {
  const files = new Map<string, string>()
  const base = (p: string) => p.split(/[\\/]/).pop() ?? p
  const keyOf = (p: string) => [...files.keys()].find(k => base(k) === base(p))
  on('fs.exists', ($, e) => ({ value: keyOf(e.path) !== undefined }))
  on('fs.stat', ($, e) => {
    const key = keyOf(e.path)
    if (key === undefined) return { deny: 'ENOENT' }
    return { value: { kind: 'file', size: byteLength(files.get(key) ?? ''), mtimeMs: 0, isLink: false } }
  })
  on('fs.read', ($, e) => (unreadable.includes(base(e.path)) ? { deny: 'over the 4 MiB read limit' } : { value: files.get(keyOf(e.path) ?? '') ?? '' }))
  on('fs.write', ($, e) => {
    if (failWrites) return { deny: 'read-only disk' }
    files.set(keyOf(e.path) ?? e.path, e.text)
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

test('redaction does not hide things that are not secrets', () => {
  expect(redact('curl https://keycloak:8443/realms/x')).toBe('curl https://keycloak:8443/realms/x')
  expect(redact('tokenizer: bpe')).toBe('tokenizer: bpe')
  expect(redact('monkey: banana')).toBe('monkey: banana')
  expect(redact('docker run -u 1000:1000 img')).toBe('docker run -u 1000:1000 img')
  // ...and still hides the real ones next to them
  expect(redact('curl -H "X-Api-Key: abcdef123456"')).toBe('curl -H "X-Api-Key: ***"')
  expect(redact('curl -u admin:hunter2secret x')).toBe('curl -u admin:*** x')
})

test('pure: redaction, summaries, file names, rolling', () => {
  expect(redact('API_TOKEN=abc123 npm publish')).toBe('API_TOKEN=*** npm publish')
  expect(redact('curl -H "Authorization: Bearer eyJhbGciOi.xyz"')).toMatch(/Authorization: Bearer \*\*\*/)
  expect(redact('git clone https://me:hunter2@host/repo')).toBe('git clone https://me:***@host/repo')
  expect(summarize('Write', { file_path: '/repo/a.ts', content: 'SECRET STUFF' })).toBe('/repo/a.ts')
  expect(fileName('C:/logs/', 'abc-123', Date.UTC(2026, 9, 15), 0)).toBe('C:/logs/2026-10-15_abc-123.jsonl')
  expect(fileName('C:/logs', 'abc-123', Date.UTC(2026, 9, 15), 2)).toBe('C:/logs/2026-10-15_abc-123-part2.jsonl')
  expect(shouldRoll(0, 10)).toBe(false)
  expect(shouldRoll(2 * 1024 * 1024 - 5, 10)).toBe(true)
  expect(byteLength('aé日')).toBe(6) // 1 + 2 + 3 bytes, while 'aé日'.length is 3
})

test('redact: Authorization keeps its scheme and closing quote, drops the value', () => {
  expect(redact('curl -H "Authorization: Bearer eyJhbGciOi.xyz" https://x')).toBe('curl -H "Authorization: Bearer ***" https://x')
  expect(redact("curl -H 'Authorization: Basic dXNlcjpwYXNz' https://x")).toBe("curl -H 'Authorization: Basic ***' https://x")
})

test('redact: key/token headers with a colon', () => {
  expect(redact('curl -H "X-Api-Key: abc123def456" https://x')).toBe('curl -H "X-Api-Key: ***" https://x')
  expect(redact('curl -H "X-Auth-Token:abc123" https://x')).toBe('curl -H "X-Auth-Token:***" https://x')
})

test('redact: curl -u / --user user:password', () => {
  expect(redact('curl -u admin:hunter2secret https://x')).toBe('curl -u admin:*** https://x')
  expect(redact('curl --user=admin:hunter2secret https://x')).toBe('curl --user=admin:*** https://x')
  expect(redact('git push -u origin main')).toBe('git push -u origin main')
})

test('redact: mysql -pSECRET glued to the flag, but not -P port', () => {
  expect(redact('mysql -u root -pS3cretPass -P 3306 db')).toBe('mysql -u root -p*** -P 3306 db')
  expect(redact('mysql -u root -p db')).toBe('mysql -u root -p db') // asks for it: nothing to hide
})

test('redact: docker login -p', () => {
  expect(redact('docker login -u me -p hunter2 registry.example.com')).toBe('docker login -u me -p *** registry.example.com')
})

test('redact: AWS access key ids', () => {
  expect(redact('aws configure set aws_access_key_id AKIAIOSFODNN7EXAMPLE')).toBe('aws configure set aws_access_key_id ***')
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

// These run last: tool-log keeps its target between tests the way it keeps it between turns.
const START = { surface: 'terminal' as const, isInteractive: true, cwd: '/work' }
const PART0 = '2026-10-15_abc-123.jsonl'
const PART1 = '2026-10-15_abc-123-part1.jsonl'
const PART2 = '2026-10-15_abc-123-part2.jsonl'
const byName = (files: Map<string, string>, name: string) =>
  [...files.entries()].find(([k]) => k.split(/[\\/]/).pop() === name)?.[1]
const FULL = `${JSON.stringify({ filler: 'x'.repeat(MAX_FILE_BYTES) })}\n`

test('after a reload, a full part0 and an existing part1 are kept: new lines go after part1', DIR, async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 15, 12) })
  const files = harness(on)
  const full = FULL
  const earlier = `${JSON.stringify({ tool: 'Glob', args: 'earlier' })}\n`
  files.set(`seed/${PART0}`, full)
  files.set(`seed/${PART1}`, earlier)
  await $.session.start(START)
  await $.tool.call({ tool: 'Glob', pattern: 'after-reload' })
  await $.turn.complete({ turnId: 't1', ...TURN })
  expect(byName(files, PART0)).toBe(full)
  const part1 = (byName(files, PART1) ?? '').trim().split('\n').map(l => JSON.parse(l) as Record<string, unknown>)
  expect(part1.map(l => l.args)).toEqual(['earlier', 'after-reload'])
})

test('rolling counts bytes, not characters: accented text rolls before the byte limit', DIR, async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 16, 12) })
  const files = harness(on)
  // 1.1 million 'é' is under MAX_FILE_BYTES in characters but 2.2 MB in bytes.
  const accented = `${JSON.stringify({ note: 'é'.repeat(1_100_000) })}\n`
  expect(accented.length < MAX_FILE_BYTES && byteLength(accented) > MAX_FILE_BYTES).toBe(true)
  files.set('seed/2026-10-16_abc-123.jsonl', accented)
  await $.session.start(START)
  await $.tool.call({ tool: 'Glob', pattern: 'bytes' })
  await $.turn.complete({ turnId: 't1', ...TURN })
  expect(byName(files, '2026-10-16_abc-123.jsonl')).toBe(accented)
  expect(byName(files, '2026-10-16_abc-123-part1.jsonl')).toMatch(/"args":"bytes"/)
})

test('a part that cannot be read is skipped, never overwritten', DIR, async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 15, 12) })
  const files = harness(on, false, [], [PART1])
  files.set(`seed/${PART0}`, FULL)
  files.set(`seed/${PART1}`, 'kept as it is\n')
  await $.session.start(START)
  await $.tool.call({ tool: 'Glob', pattern: 'skip-unreadable' })
  await $.turn.complete({ turnId: 't1', ...TURN })
  expect(byName(files, PART1)).toBe('kept as it is\n')
  expect(byName(files, PART2)).toMatch(/"args":"skip-unreadable"/)
})
