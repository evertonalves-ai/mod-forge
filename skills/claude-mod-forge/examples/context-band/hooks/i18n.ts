// The text this mod shows, per language. Pure: no $ calls, so tests can cover it directly.
// Anything other than a known language falls back to English.

export type Language = 'en' | 'pt-BR'

const en = {
  roomy: 'roomy',
  filling: 'filling',
  tight: 'tight',
  compactSoon: 'compact soon',
  context: 'context',
  lastTurn: 'last turn',
  hide: 'hide (/context-band)',
  commandDescription: 'Show or hide the context band above the prompt',
  shown: 'Context band shown.',
  hidden: 'Context band hidden. Run /context-band to show it again.',
}

const ptBR: typeof en = {
  roomy: 'folgado',
  filling: 'enchendo',
  tight: 'apertado',
  compactSoon: 'compactar logo',
  context: 'contexto',
  lastTurn: 'no último turno',
  hide: 'ocultar (/context-band)',
  commandDescription: 'Mostra ou oculta a faixa de contexto acima do prompt',
  shown: 'Faixa de contexto visível.',
  hidden: 'Faixa de contexto oculta. Use /context-band para mostrar de novo.',
}

export type Strings = typeof en
const TABLE: Record<Language, Strings> = { en, 'pt-BR': ptBR }

export function strings(language: unknown): Strings {
  return language === 'pt-BR' ? TABLE['pt-BR'] : TABLE.en
}
