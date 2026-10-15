// Pure helpers for api-status. No $ here.

// The host comes only from the user's config, never from prompts or tool output.
// https everywhere; plain http only for localhost.
export function checkUrl(raw: string): { url: string } | { error: string } {
  const text = raw.trim()
  if (text === '') return { error: 'No URL set. Configure it in /config → api-status.' }
  let parsed: URL
  try {
    parsed = new URL(text)
  } catch {
    return { error: 'The configured URL is not valid.' }
  }
  const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLocal)) {
    return { error: 'Use an https:// URL (http:// is allowed only for localhost).' }
  }
  if (parsed.username !== '' || parsed.password !== '') return { error: 'Put credentials in the token option, not in the URL.' }
  return { url: parsed.toString() }
}

// Reads a dotted path ("data.deploy.state") from a JSON body.
export function pickField(body: string, path: string): { value: string } | { error: string } {
  let data: unknown
  try {
    data = JSON.parse(body)
  } catch {
    return { error: 'The response is not JSON.' }
  }
  let node: unknown = data
  for (const key of path.split('.').filter(Boolean)) {
    if (node === null || typeof node !== 'object' || !(key in (node as Record<string, unknown>))) {
      return { error: `Field "${path}" not found in the response.` }
    }
    node = (node as Record<string, unknown>)[key]
  }
  if (node === null || typeof node === 'object') return { error: `Field "${path}" is not a single value.` }
  return { value: String(node).slice(0, 80) }
}

export function clock(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
