// The text this mod shows, per language. Pure: no $ calls, so tests can cover it directly.
// Anything other than a known language falls back to English.

export type Language = 'en' | 'pt-BR'

const en = {
  commandDescription: 'Chart context-window use per turn',
  paneTitle: 'Context chart',
  noReading: 'No reading yet: the chart starts after Claude’s first reply.',
  alt: (turns: number, percent: number) => `Context use over ${turns} turns, now ${percent}%`,
  heading: '◆ Context',
  footer: 'one point per turn · dashed lines at 50% and 90% · Esc closes',
}

const ptBR: typeof en = {
  commandDescription: 'Gráfico do uso de contexto por turno',
  paneTitle: 'Gráfico de contexto',
  noReading: 'Nenhuma leitura ainda: o gráfico começa depois da primeira resposta do Claude.',
  alt: (turns: number, percent: number) => `Uso de contexto em ${turns} turnos, agora ${percent}%`,
  heading: '◆ Contexto',
  footer: 'um ponto por turno · linhas tracejadas em 50% e 90% · Esc fecha',
}

export type Strings = typeof en
const TABLE: Record<Language, Strings> = { en, 'pt-BR': ptBR }

export function strings(language: unknown): Strings {
  return language === 'pt-BR' ? TABLE['pt-BR'] : TABLE.en
}
