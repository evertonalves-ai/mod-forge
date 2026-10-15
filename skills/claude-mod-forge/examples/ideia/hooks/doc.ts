import type { Language } from '../types'
import type { Convo } from './flow'
import { SECTIONS, sideOf } from './prompts'

// Pure: the final document. The "how the conversation went" section is built here from the
// events, so it is exact; the model writes the rest.

const HISTORY: Record<Language, { heading: string; round: string; comments: string; none: string }> = {
  en: { heading: '## How the conversation went', round: 'Round', comments: 'Your comments', none: 'none' },
  'pt-BR': { heading: '## Como a conversa andou', round: 'Rodada', comments: 'Seus comentários', none: 'nenhum' },
}

// Models sometimes wrap a whole document in a code fence.
export function unfence(text: string): string {
  const match = /^\s*```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/.exec(text)
  return (match ? (match[1] ?? '') : text).trim()
}

export function historySection(convo: Convo, lang: Language): string {
  const h = HISTORY[lang]
  const rounds = [...new Set(convo.entries.filter(e => e.type === 'msg').map(e => e.round))].sort((a, b) => a - b)
  const lines = rounds.map(r => {
    const pair = [...convo.pairs].reverse().find(p => p.round <= r)?.pair
    const who = pair ? `${sideOf(pair, 'A').lens} × ${sideOf(pair, 'B').lens}` : ''
    return `- ${h.round} ${r}: ${who}`
  })
  const comments = convo.entries.filter(e => e.type === 'comment').map(e => `- ${e.text}`)
  return [h.heading, '', ...lines, '', `**${h.comments}:**${comments.length === 0 ? ` ${h.none}` : ''}`, ...comments].join('\n')
}

// The sentence under the first heading, else the idea as typed; at most 150 characters.
export function oneSentence(doc: string, convo: Convo, lang: Language): string {
  const heading = SECTIONS[lang][0] ?? ''
  const at = doc.indexOf(heading)
  const after = at >= 0 ? doc.slice(at + heading.length) : ''
  const line = after.split('\n').map(s => s.trim()).find(s => s !== '' && !s.startsWith('#')) ?? convo.idea
  const flat = line.replace(/\s+/g, ' ').trim()
  return flat.length <= 150 ? flat : `${flat.slice(0, 147).trimEnd()}...`
}

export function buildDoc(written: string, convo: Convo, lang: Language, opts: { obsidian: boolean; date: string }): string {
  const body = `${unfence(written)}\n\n${historySection(convo, lang)}\n`
  if (!opts.obsidian) return body
  const description = oneSentence(body, convo, lang).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return ['---', `date: ${opts.date}`, `description: "${description}"`, 'tags:', '  - thinking', '  - ideia', '---', '', body].join('\n')
}
