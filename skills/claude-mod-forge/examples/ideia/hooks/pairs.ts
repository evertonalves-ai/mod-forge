import type { Language, Pair } from '../types'

// The menu of pairs. Each side is a line of thought (lens) plus the method it contributes with.
// Adding a pair is adding one entry here, with both languages.
type Entry = { id: string; en: Omit<Pair, 'id'>; pt: Omit<Pair, 'id'> }

const MENU: Entry[] = [
  {
    id: 'user-eng',
    en: {
      a: { lens: 'User', method: 'user journey and jobs to be done: who uses it, when, what they are trying to get done' },
      b: { lens: 'Engineering', method: 'first principles and technical limits: what it must be made of, what is hard, what is cheap' },
      bestFor: 'apps, tools, mods',
    },
    pt: {
      a: { lens: 'Usuário', method: 'jornada do usuário e "trabalho a ser feito": quem usa, quando, o que está tentando resolver' },
      b: { lens: 'Engenharia', method: 'primeiros princípios e limites técnicos: do que é feito, o que é difícil, o que é barato' },
      bestFor: 'apps, ferramentas, mods',
    },
  },
  {
    id: 'open-narrow',
    en: {
      a: { lens: 'Open', method: 'SCAMPER (substitute, combine, adapt, modify, put to other use, eliminate, reverse), analogies and "what if" questions' },
      b: { lens: 'Narrow', method: 'MoSCoW (must, should, could, will not have) and scope cuts' },
      bestFor: 'raw ideas',
    },
    pt: {
      a: { lens: 'Abrir', method: 'SCAMPER (substituir, combinar, adaptar, modificar, outro uso, eliminar, inverter), analogias e perguntas "e se"' },
      b: { lens: 'Afunilar', method: 'MoSCoW (deve, deveria, poderia, não vai ter) e corte de escopo' },
      bestFor: 'ideias cruas',
    },
  },
  {
    id: 'advocate-devil',
    en: {
      a: { lens: 'Advocate', method: 'value proposition: what makes it worth doing and different from what exists' },
      b: { lens: "Devil's advocate", method: 'pre-mortem ("it failed a year from now: why?") and risks' },
      bestFor: 'testing a formed idea',
    },
    pt: {
      a: { lens: 'Defensor', method: 'proposta de valor: o que faz valer a pena e o que diferencia do que já existe' },
      b: { lens: 'Advogado do diabo', method: 'pre-mortem ("fracassou daqui a um ano: por quê?") e riscos' },
      bestFor: 'testar uma ideia já formada',
    },
  },
  {
    id: 'vision-ground',
    en: {
      a: { lens: 'Visionary', method: 'the ideal picture a year from now, working backwards from it' },
      b: { lens: 'Feet on the ground', method: 'what fits in 30 days with what already exists' },
      bestFor: 'plans and roadmaps',
    },
    pt: {
      a: { lens: 'Visionário', method: 'o cenário ideal daqui a um ano, trabalhando de trás para frente' },
      b: { lens: 'Pé no chão', method: 'o que cabe em 30 dias com o que já existe' },
      bestFor: 'planos e roteiros',
    },
  },
  {
    id: 'audience-creator',
    en: {
      a: { lens: 'Audience', method: 'hook and retention: what makes a person stop, stay and come back' },
      b: { lens: 'Creator', method: 'clarity, accuracy and what can be produced every week' },
      bestFor: 'videos, channels, content',
    },
    pt: {
      a: { lens: 'Público', method: 'gancho e retenção: o que faz a pessoa parar, ficar e voltar' },
      b: { lens: 'Criador', method: 'clareza, precisão e o que dá para produzir toda semana' },
      bestFor: 'vídeos, canais, conteúdo',
    },
  },
  {
    id: 'client-business',
    en: {
      a: { lens: 'Customer', method: 'what a buyer would pay for and why, in their own words' },
      b: { lens: 'Business', method: 'cost, price, sales channel and competition' },
      bestFor: 'paid products and services',
    },
    pt: {
      a: { lens: 'Cliente', method: 'pelo que alguém pagaria e por quê, nas palavras dele' },
      b: { lens: 'Negócio', method: 'custo, preço, canal de venda e concorrência' },
      bestFor: 'produtos e serviços pagos',
    },
  },
]

export const FALLBACK_ID = 'open-narrow'

const FREE = {
  en: 'free: pick the technique that fits best and name it',
  pt: 'livre: escolha a técnica que melhor servir e diga qual',
}

const TEXT = {
  en: {
    customError: 'Write the two sides separated by ×, x, / or vs. Example: investor × customer',
    fallbackWhy: 'A general pair for a raw idea: one side opens possibilities, the other cuts to what matters.',
  },
  pt: {
    customError: 'Escreva os dois lados separados por ×, x, / ou vs. Exemplo: investidor × cliente',
    fallbackWhy: 'Um par geral para ideia crua: um lado abre possibilidades, o outro corta até o que importa.',
  },
}

const key = (lang: Language) => (lang === 'pt-BR' ? 'pt' : 'en')

export function pairsFor(lang: Language): Pair[] {
  return MENU.map(entry => ({ id: entry.id, ...entry[key(lang)] }))
}

export function pairById(id: string, lang: Language): Pair | undefined {
  return pairsFor(lang).find(p => p.id === id)
}

export function menuIds(): string[] {
  return MENU.map(entry => entry.id)
}

const MAX_SIDE = 60

// "investor × customer", "investor x customer", "investor / customer", "investor vs customer".
export function parseCustomPair(text: string, lang: Language): Pair | { error: string } {
  const parts = text
    .split(/\s*×\s*|\s*\/\s*|\s+x\s+|\s+vs\.?\s+/i)
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(s => s !== '')
  if (parts.length !== 2) return { error: TEXT[key(lang)].customError }
  const [a, b] = parts.map(s => s.slice(0, MAX_SIDE)) as [string, string]
  const method = FREE[key(lang)]
  return { id: 'custom', a: { lens: a, method }, b: { lens: b, method }, bestFor: '' }
}

// The suggestion call answers "id | reason". Anything else falls back to the general pair.
export function parseSuggestion(reply: string, lang: Language): { pair: Pair; why: string } {
  const match = /^\s*([a-z-]+)\s*\|\s*(.+)$/m.exec(reply)
  const pair = match ? pairById(match[1] ?? '', lang) : undefined
  if (match && pair) return { pair, why: (match[2] ?? '').trim().slice(0, 300) }
  return { pair: pairById(FALLBACK_ID, lang) as Pair, why: TEXT[key(lang)].fallbackWhy }
}

export function fallbackSuggestion(lang: Language): { pair: Pair; why: string } {
  return parseSuggestion('', lang)
}
