// Pure rules for prompt-buttons. No $ here. Messages come from the i18n table (English by default).

import { strings } from './i18n'
import type { Strings } from './i18n'

const EN = strings('en')

export const MAX_BUTTONS = 9 // one digit hotkey each
export const MAX_LABEL = 40
export const MAX_TEXT = 2000
export const KEY_PREFIX = 'btn:' // one $.store key per button: sessions never overwrite each other's list

export function validate(label: string, text: string, count: number, s: Strings = EN): { label: string; text: string } | { error: string } {
  const l = label.trim().replace(/\s+/g, ' ')
  const t = text.trim()
  if (count >= MAX_BUTTONS) return { error: s.tooMany(MAX_BUTTONS) }
  if (l === '') return { error: s.needLabel }
  if (t === '') return { error: s.needText }
  return { label: l.slice(0, MAX_LABEL), text: t.slice(0, MAX_TEXT) }
}

// "/buttons 2" → index 1; anything else is an error message.
export function parseIndex(args: string, count: number, s: Strings = EN): number | { error: string } | undefined {
  const raw = args.trim()
  if (raw === '') return undefined
  if (!/^\d$/.test(raw)) return { error: s.usage(MAX_BUTTONS) }
  const n = Number(raw)
  if (n < 1 || n > count) return { error: count === 0 ? s.noButtonsAddInPane : s.pick(count) }
  return n - 1
}

export function byId(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}
