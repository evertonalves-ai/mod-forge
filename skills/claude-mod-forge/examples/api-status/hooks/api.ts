// Pure helpers for api-status. No $ here. Messages come from the i18n table (English by default).

import { strings } from './i18n'
import type { Strings } from './i18n'

const EN = strings('en')

// The host comes only from the user's config, never from prompts or tool output.
// https everywhere; plain http only for localhost.
export function checkUrl(raw: string, s: Strings = EN): { url: string } | { error: string } {
  const text = raw.trim()
  if (text === '') return { error: s.noUrl }
  let parsed: URL
  try {
    parsed = new URL(text)
  } catch {
    return { error: s.badUrl }
  }
  const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLocal)) {
    return { error: s.needHttps }
  }
  if (parsed.username !== '' || parsed.password !== '') return { error: s.noCredentialsInUrl }
  return { url: parsed.toString() }
}

// Reads a dotted path ("data.deploy.state") from a JSON body.
export function pickField(body: string, path: string, s: Strings = EN): { value: string } | { error: string } {
  let data: unknown
  try {
    data = JSON.parse(body)
  } catch {
    return { error: s.notJson }
  }
  let node: unknown = data
  for (const key of path.split('.').filter(Boolean)) {
    if (node === null || typeof node !== 'object' || !(key in (node as Record<string, unknown>))) {
      return { error: s.fieldMissing(path) }
    }
    node = (node as Record<string, unknown>)[key]
  }
  if (node === null || typeof node === 'object') return { error: s.fieldNotValue(path) }
  return { value: String(node).slice(0, 80) }
}

export function clock(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
