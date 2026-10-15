// Pure rules for prompt-buttons. No $ here.

export const MAX_BUTTONS = 9 // one digit hotkey each
export const MAX_LABEL = 40
export const MAX_TEXT = 2000
export const KEY_PREFIX = 'btn:' // one $.store key per button: sessions never overwrite each other's list

export function validate(label: string, text: string, count: number): { label: string; text: string } | { error: string } {
  const l = label.trim().replace(/\s+/g, ' ')
  const t = text.trim()
  if (count >= MAX_BUTTONS) return { error: `At most ${MAX_BUTTONS} buttons (one per digit hotkey). Delete one first.` }
  if (l === '') return { error: 'Give the button a label first.' }
  if (t === '') return { error: 'Type the instruction the button should send.' }
  return { label: l.slice(0, MAX_LABEL), text: t.slice(0, MAX_TEXT) }
}

// "/buttons 2" → index 1; anything else is an error message.
export function parseIndex(args: string, count: number): number | { error: string } | undefined {
  const raw = args.trim()
  if (raw === '') return undefined
  if (!/^\d$/.test(raw)) return { error: `Usage: /buttons [1-${MAX_BUTTONS}]` }
  const n = Number(raw)
  if (n < 1 || n > count) return { error: count === 0 ? 'No buttons yet. Add one in the pane.' : `Pick 1 to ${count}.` }
  return n - 1
}

export function byId(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}
