import type { Line } from '../types'

// Tolerant JSONL parser: a half-written last line (an agent mid-append) is skipped, not fatal.
export function parseDialogue(text: string): Line[] {
  const out: Line[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line === '') continue
    try {
      const v = JSON.parse(line) as Record<string, unknown>
      if (typeof v.from !== 'string' || typeof v.text !== 'string') continue
      out.push({
        from: v.from.slice(0, 20),
        to: typeof v.to === 'string' ? v.to.slice(0, 20) : '',
        kind: typeof v.kind === 'string' ? v.kind.slice(0, 20) : 'note',
        text: v.text.slice(0, 2000),
        ts: typeof v.ts === 'string' ? v.ts : '',
      })
    } catch {
      // skip
    }
  }
  return out
}

export function hhmm(ts: string): string {
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
