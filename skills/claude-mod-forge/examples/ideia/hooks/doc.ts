import type { Language } from '../types'
import type { Convo } from './flow'
import { SECTIONS, sideOf } from './prompts'

// Pure: the final document. The "how the conversation went" section is built here from the
// events, so it is exact; the model writes the rest.

const HISTORY: Record<Language, { heading: string; round: string; comments: string; none: string; callout: string }> = {
  en: { heading: '## How the conversation went', round: 'Round', comments: 'Your comments', none: 'none', callout: 'In one sentence' },
  'pt-BR': { heading: '## Como a conversa andou', round: 'Rodada', comments: 'Seus comentários', none: 'nenhum', callout: 'Em uma frase' },
}

// Models sometimes wrap a whole document in a code fence.
export function unfence(text: string): string {
  const match = /^\s*```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/.exec(text)
  return (match ? (match[1] ?? '') : text).trim()
}

// One block per round: the pair, then what the round summary decided, left open or dropped.
export function historySection(convo: Convo, lang: Language): string {
  const h = HISTORY[lang]
  const rounds = [...new Set(convo.entries.filter(e => e.type === 'msg').map(e => e.round))].sort((a, b) => a - b)
  const blocks = rounds.map(r => {
    const pair = [...convo.pairs].reverse().find(p => p.round <= r)?.pair
    const who = pair ? ` · ${sideOf(pair, 'A').lens} × ${sideOf(pair, 'B').lens}` : ''
    const summary = (convo.summaries[r] ?? '')
      .split('\n')
      .map(s => s.trim().replace(/^[-*]\s+/, ''))
      .filter(s => s !== '')
      .map(s => `- ${s}`)
    return [`**${h.round} ${r}${who}**`, ...summary].join('\n')
  })
  const comments = convo.entries.filter(e => e.type === 'comment').map(e => `- ${e.text}`)
  return [h.heading, '', blocks.join('\n\n'), '', `**${h.comments}:**${comments.length === 0 ? ` ${h.none}` : ''}`, ...comments].join('\n')
}

// The "> " line under the title, else the first line under the first section, else the idea as typed.
export function oneSentence(doc: string, convo: Convo, lang: Language): string {
  const quoted = doc.split('\n').find(s => /^>\s+\S/.test(s.trim()))
  let line = quoted ? quoted.trim().replace(/^>\s+/, '') : ''
  if (line === '') {
    const heading = SECTIONS[lang][0] ?? ''
    const at = doc.indexOf(heading)
    const after = at >= 0 ? doc.slice(at + heading.length) : ''
    line = after.split('\n').map(s => s.trim().replace(/^[-*]\s+/, '')).find(s => s !== '' && !s.startsWith('#')) ?? ''
  }
  const flat = (line || convo.idea).replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
  return flat.length <= 150 ? flat : `${flat.slice(0, 147).trimEnd()}...`
}

// What the pane shows when the document is ready: the one sentence and the "In short" bullets,
// with Markdown marks taken off so the terminal reads it as plain text.
export function previewOf(written: string, lang: Language): string {
  const doc = unfence(written)
  const quoted = doc.split('\n').find(s => /^>\s+\S/.test(s.trim()))?.trim().replace(/^>\s+/, '') ?? ''
  const heading = SECTIONS[lang][0] ?? ''
  const at = doc.indexOf(heading)
  const rest = at >= 0 ? doc.slice(at + heading.length) : ''
  const section = rest.split(/\n## /)[0] ?? ''
  const bullets = section
    .split('\n')
    .map(s => s.trim())
    .filter(s => /^[-*]\s+/.test(s))
    .slice(0, 6)
    .map(s => `• ${s.replace(/^[-*]\s+/, '')}`)
  return [quoted, ...bullets]
    .filter(s => s !== '')
    .join('\n')
    .replace(/\*\*/g, '')
}

// Obsidian: the one-sentence quote becomes a callout.
function toCallout(body: string, lang: Language): string {
  const lines = body.split('\n')
  const at = lines.findIndex(s => /^>\s+\S/.test(s) && !/^>\s*\[!/.test(s))
  if (at < 0) return body
  lines.splice(at, 1, `> [!abstract] ${HISTORY[lang].callout}`, lines[at] ?? '')
  return lines.join('\n')
}

export function buildDoc(written: string, convo: Convo, lang: Language, opts: { obsidian: boolean; date: string }): string {
  const body = `${unfence(written)}\n\n${historySection(convo, lang)}\n`
  if (!opts.obsidian) return body
  const description = oneSentence(body, convo, lang).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return ['---', `date: ${opts.date}`, `description: "${description}"`, 'tags:', '  - thinking', '  - ideia', '---', '', toCallout(body, lang)].join('\n')
}
