// The text this mod shows, per language. Pure: no $ calls, so tests can cover it directly.
// Anything other than a known language falls back to English.

export type Language = 'en' | 'pt-BR'

const en = {
  title: 'Session dashboard',
  commandDescription: (title: string) => `Open the ${title}`,
  tabOverview: 'Overview',
  tabActivity: 'Activity',
  tabNotes: 'Notes',
  running: (n: number) => `◌ ${n} running`,
  idle: '● idle',
  kpiTools: 'Tool calls',
  kpiErrors: 'Errors',
  kpiTurns: 'Turns',
  kpiAvg: 'Avg turn',
  turnDurations: 'Turn durations',
  noFinishedTurn: 'No finished turn yet.',
  mostUsed: 'Most used',
  noToolCalls: 'No tool calls yet.',
  filter: 'Filter',
  all: 'all',
  nothingHere: 'Nothing here yet.',
  clearList: 'c: Clear list',
  newNote: 'New note',
  notePlaceholder: 'Type and press Enter',
  save: 'save',
  noteSaved: 'Note saved',
  noNotes: 'No notes. They are kept across sessions.',
  footer: '1·2·3 tabs · Tab moves · Esc back to prompt · /dashboard',
}

const ptBR: typeof en = {
  title: 'Painel da sessão',
  commandDescription: (title: string) => `Abre o ${title}`,
  tabOverview: 'Visão geral',
  tabActivity: 'Atividade',
  tabNotes: 'Notas',
  running: (n: number) => `◌ ${n} rodando`,
  idle: '● ocioso',
  kpiTools: 'Ferramentas',
  kpiErrors: 'Erros',
  kpiTurns: 'Turnos',
  kpiAvg: 'Turno médio',
  turnDurations: 'Duração dos turnos',
  noFinishedTurn: 'Nenhum turno concluído ainda.',
  mostUsed: 'Mais usadas',
  noToolCalls: 'Nenhuma ferramenta usada ainda.',
  filter: 'Filtrar',
  all: 'todas',
  nothingHere: 'Nada por aqui ainda.',
  clearList: 'c: Limpar lista',
  newNote: 'Nova nota',
  notePlaceholder: 'Digite e tecle Enter',
  save: 'salvar',
  noteSaved: 'Nota salva',
  noNotes: 'Sem notas. Elas ficam salvas entre sessões.',
  footer: '1·2·3 abas · Tab navega · Esc volta ao prompt · /dashboard',
}

export type Strings = typeof en
const TABLE: Record<Language, Strings> = { en, 'pt-BR': ptBR }

export function strings(language: unknown): Strings {
  return language === 'pt-BR' ? TABLE['pt-BR'] : TABLE.en
}
