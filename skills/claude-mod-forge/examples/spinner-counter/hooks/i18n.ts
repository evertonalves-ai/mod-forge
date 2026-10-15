// The text this mod shows, per language. Pure: no $ calls, so tests can cover it directly.
// Anything other than a known language falls back to English.

export type Language = 'en' | 'pt-BR'

const en = {
  toolCalls: (n: number) => `${n} tool call${n === 1 ? '' : 's'}`,
}

const ptBR: typeof en = {
  toolCalls: (n: number) => `${n} ferramenta${n === 1 ? '' : 's'}`,
}

export type Strings = typeof en
const TABLE: Record<Language, Strings> = { en, 'pt-BR': ptBR }

export function strings(language: unknown): Strings {
  return language === 'pt-BR' ? TABLE['pt-BR'] : TABLE.en
}
