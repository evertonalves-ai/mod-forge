import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { checkUrl, pickField } from '../hooks/api'

const TYPED = { origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } } as const
const BAND = {
  plugin: 'api-status',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 3, bodyColumns: 100, scroll: { offset: 0, bodyRows: 3 }, view: {} },
} as const
const CONFIG = { options: { url: 'https://status.example.com/api', field: 'data.state', token: 'secret-123' } }

type Seen = { url: string; auth?: string }
function http(on: On, answers: ({ status: number; text: string } | 'down')[]) {
  const seen: Seen[] = []
  on('http.fetch', ($, e) => {
    seen.push({ url: e.url, auth: e.init?.headers?.authorization })
    const a = answers.shift() ?? 'down'
    if (a === 'down') return { deny: 'network down' }
    return { value: { status: a.status, ok: a.status < 400, headers: {}, text: a.text } }
  })
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box key="engine" />
  })
  return seen
}

test('helpers: URL rules and JSON field picking', () => {
  expect('url' in checkUrl('https://x.dev/s')).toBe(true)
  expect('url' in checkUrl('http://localhost:3000/s')).toBe(true)
  expect('error' in checkUrl('http://x.dev/s')).toBe(true)
  expect('error' in checkUrl('https://user:pw@x.dev/s')).toBe(true)
  expect('error' in checkUrl('')).toBe(true)
  expect(pickField('{"data":{"state":"green"}}', 'data.state')).toEqual({ value: 'green' })
  expect('error' in pickField('{"data":{}}', 'data.state')).toBe(true)
  expect('error' in pickField('<html>', 'status')).toBe(true)
})

test('the band shows the value; the token goes only in the header', CONFIG, async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  const seen = http(on, [{ status: 200, text: '{"data":{"state":"green"}}' }])
  const answer = await $.command.run({ command: 'api-status', args: '', ...TYPED })
  expect(answer.text).toMatch(/^API: green/)
  expect(seen[0]?.auth).toBe('Bearer secret-123')
  expect(answer.text).not.toMatch(/secret/)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ text: 'green' })).toBeDefined()
    expect(await ui.find({ text: /secret/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('API down: error state keeps the last good value, no crash', CONFIG, async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  http(on, [{ status: 200, text: '{"data":{"state":"green"}}' }, 'down', { status: 503, text: '' }])
  await $.command.run({ command: 'api-status', args: '', ...TYPED })
  const down = await $.command.run({ command: 'api-status', args: '', ...TYPED })
  expect(down.text).toBe('API unavailable: unreachable · last green')
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'refresh' })
  expect(await ui.find({ text: 'HTTP 503' })).toBeDefined()
  expect(await ui.find({ text: /last green/ })).toBeDefined()
})

test('no URL configured: says how to fix it and never fetches', async ($, on) => {
  mock.clock(on)
  const seen = http(on, [])
  const answer = await $.command.run({ command: 'api-status', args: '', ...TYPED })
  expect(answer.text).toMatch(/No URL set/)
  expect(seen).toEqual([])
})

test('plain http to a remote host is refused before any request', { options: { url: 'http://evil.example/x' } }, async ($, on) => {
  mock.clock(on)
  const seen = http(on, [])
  const answer = await $.command.run({ command: 'api-status', args: '', ...TYPED })
  expect(answer.text).toMatch(/https/)
  expect(seen).toEqual([])
})

test('session.start registers the command and returns without waiting for the API', CONFIG, async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  const order: string[] = []
  let release: () => void = () => undefined
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', ($, e) => {
    order.push(`register ${e.name}`)
    return { value: { command: e.name } }
  })
  // A slow API: the fetch stays pending until the test releases it.
  on('http.fetch', () => {
    order.push('fetch')
    return new Promise(resolve => {
      release = () => resolve({ value: { status: 200, ok: true, headers: {}, text: '{"data":{"state":"green"}}' } })
    })
  })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(order).toEqual(['register api-status', 'fetch']) // returned while the fetch is still pending
  release()
})

test('hide, then /api-status brings the band back', CONFIG, async ($, on) => {
  mock.clock(on)
  http(on, [{ status: 200, text: '{"data":{"state":"green"}}' }, { status: 200, text: '{"data":{"state":"green"}}' }])
  await $.command.run({ command: 'api-status', args: '', ...TYPED })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'hide' })
  expect(await ui.find({ key: 'engine' })).toBeDefined()
  await $.command.run({ command: 'api-status', args: '', ...TYPED })
  expect(await ui.find({ text: 'green' })).toBeDefined()
})

test('language pt-BR: band and /api-status reply are in Portuguese', { options: { ...CONFIG.options, language: 'pt-BR' } }, async ($, on) => {
  mock.clock(on, { now: 1_700_000_000_000 })
  http(on, ['down'])
  const answer = await $.command.run({ command: 'api-status', args: '', ...TYPED })
  expect(answer.text).toBe('API indisponível: inacessível')
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ text: '✗ indisponível' })).toBeDefined()
  expect(await ui.find({ key: 'refresh' })).toBeDefined()
})

test('language pt-BR: no URL configured says how to fix it in Portuguese', { options: { language: 'pt-BR' } }, async ($, on) => {
  mock.clock(on)
  http(on, [])
  const answer = await $.command.run({ command: 'api-status', args: '', ...TYPED })
  expect(answer.text).toMatch(/Nenhuma URL definida/)
})
