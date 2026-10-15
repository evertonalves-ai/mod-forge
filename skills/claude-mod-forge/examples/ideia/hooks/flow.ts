import type { IdeiaEvent, Pair, Position, Who } from '../types'

// Pure: the conversation as data. The runner in register.tsx appends events; everything it
// decides (who speaks next, when a round ends, when to write the document) comes from here.

export type Msg = Extract<IdeiaEvent, { type: 'msg' }>
export type Comment = Extract<IdeiaEvent, { type: 'comment' }>
export type Entry = Msg | Comment

export type Convo = {
  idea: string
  pairs: { round: number; pair: Pair; why: string }[]
  entries: Entry[]
  summaries: Record<number, string>
  doc: { path: string; isModFit: boolean } | null
}

export function fold(events: readonly IdeiaEvent[]): Convo {
  const convo: Convo = { idea: '', pairs: [], entries: [], summaries: {}, doc: null }
  for (const e of events) {
    if (e.type === 'start') convo.idea = e.idea
    else if (e.type === 'pair') convo.pairs.push({ round: e.round, pair: e.pair, why: e.why })
    else if (e.type === 'msg' || e.type === 'comment') convo.entries.push(e)
    else if (e.type === 'summary') convo.summaries[e.round] = e.text
    else if (e.type === 'doc') convo.doc = { path: e.path, isModFit: e.isModFit }
  }
  return convo
}

// The pair in force for a round: the last one chosen at or before it.
export function pairFor(convo: Convo, round: number): { pair: Pair; why: string } | undefined {
  return [...convo.pairs].reverse().find(p => p.round <= round)
}

export function msgsOf(convo: Convo, round: number): Msg[] {
  return convo.entries.filter((e): e is Msg => e.type === 'msg' && e.round === round)
}

// The round being worked on: the highest round with a message, or the first chosen pair's.
export function currentRound(convo: Convo): number {
  const rounds = convo.entries.filter(e => e.type === 'msg').map(e => e.round)
  return rounds.length > 0 ? Math.max(...rounds) : (convo.pairs[0]?.round ?? 1)
}

export const ORDER: { side: Who; position: Position }[] = [
  { side: 'A', position: 'open' },
  { side: 'B', position: 'respond' },
  { side: 'A', position: 'reply' },
]

export type Action =
  | { kind: 'choose' }
  | { kind: 'speak'; side: Who; round: number; position: Position }
  | { kind: 'summarize'; round: number }
  | { kind: 'roundEnd'; round: number }
  | { kind: 'write' }
  | { kind: 'done' }

// Both sides said there is nothing important left, from round 2 on.
export function isConverged(convo: Convo, round: number): boolean {
  if (round < 2) return false
  const msgs = msgsOf(convo, round)
  return msgs.length === ORDER.length && msgs.every(m => m.isReady)
}

export function nextAction(convo: Convo, opts: { maxRounds: number; advance: boolean }): Action {
  if (convo.doc) return { kind: 'done' }
  if (convo.pairs.length === 0) return { kind: 'choose' }
  const round = currentRound(convo)
  const said = msgsOf(convo, round).length
  if (said < ORDER.length) {
    const turn = ORDER[said] as (typeof ORDER)[number]
    return { kind: 'speak', side: turn.side, round, position: turn.position }
  }
  if (convo.summaries[round] === undefined) return { kind: 'summarize', round }
  if (round >= opts.maxRounds || isConverged(convo, round)) return { kind: 'write' }
  if (!opts.advance) return { kind: 'roundEnd', round }
  return { kind: 'speak', side: 'A', round: round + 1, position: 'open' }
}

// Each side's message ends with "STATUS: continue" or "STATUS: ready"; the line is taken off the text.
export function parseStatus(reply: string): { text: string; isReady: boolean } {
  const match = /\n?\s*\**\s*STATUS:\s*\**\s*(continue|ready)\b[^\n]*\s*$/i.exec(reply)
  if (!match) return { text: reply.trim(), isReady: false }
  return { text: reply.slice(0, match.index).trim(), isReady: (match[1] ?? '').toLowerCase() === 'ready' }
}

// The checker's reply ends with "MOD: yes" or "MOD: no".
export function parseModFit(reply: string): { text: string; isModFit: boolean } {
  const match = /\n?\s*\**\s*MOD:\s*\**\s*(yes|no)\b[^\n]*\s*$/i.exec(reply)
  if (!match) return { text: reply.trim(), isModFit: false }
  return { text: reply.slice(0, match.index).trim(), isModFit: (match[1] ?? '').toLowerCase() === 'yes' }
}

export const MIN_ROUNDS = 1
export const MAX_ROUNDS = 8
export const DEFAULT_ROUNDS = 4

export function clampRounds(value: unknown): number {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return DEFAULT_ROUNDS
  return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, n))
}

// Folder name for a conversation: the date plus the idea's first words, [a-z0-9-] only.
// The idea's text never reaches a path any other way.
export function slug(idea: string, date: string): string {
  const words = idea
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w !== '')
  let name = ''
  for (const w of words) {
    const next = name === '' ? w : `${name}-${w}`
    if (next.length > 40) break
    name = next
  }
  if (name === '') name = (words[0] ?? 'ideia').slice(0, 40) || 'ideia'
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '0000-00-00'
  return `${day}-${name}`
}

export function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

// dialogue.jsonl: one event per line. A broken or unknown line is skipped, never fatal.
export function parseEvents(text: string): IdeiaEvent[] {
  const out: IdeiaEvent[] = []
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue
    try {
      const value: unknown = JSON.parse(line)
      if (value !== null && typeof value === 'object' && 'type' in value) {
        const t = (value as { type: unknown }).type
        if (t === 'start' || t === 'pair' || t === 'msg' || t === 'comment' || t === 'summary' || t === 'doc') out.push(value as IdeiaEvent)
      }
    } catch {
      // half-written or foreign line
    }
  }
  return out
}

export function toJsonl(events: readonly IdeiaEvent[]): string {
  return events.map(e => JSON.stringify(e)).join('\n') + '\n'
}
