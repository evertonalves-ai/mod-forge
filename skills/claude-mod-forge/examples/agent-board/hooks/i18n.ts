// The text this mod shows, per language. Pure: no $ calls, so tests can cover it directly.
// Anything other than a known language falls back to English.

export type Language = 'en' | 'pt-BR'

const en = {
  locale: 'en-US',
  status: {
    pending: 'starting',
    running: 'working',
    waiting: 'waiting',
    idle: 'idle',
    completed: 'done',
    failed: 'failed',
    killed: 'stopped',
  } as Record<string, string>,
  commandDescription: 'Show the agents of this session and the status of each',
  paneTitle: 'Agents',
  heading: '◆ Agents',
  working: (n: number) => `◌ ${n} working`,
  allIdle: '● all idle',
  noAgents: 'No agents in this session.',
  noAgentsYet: 'No agents in this session yet.',
  refresh: 'refreshes every 2 s',
  refreshLast: (time: string) => `refreshes every 2 s · last ${time}`,
}

const ptBR: typeof en = {
  locale: 'pt-BR',
  status: {
    pending: 'iniciando',
    running: 'trabalhando',
    waiting: 'aguardando',
    idle: 'parado',
    completed: 'concluído',
    failed: 'falhou',
    killed: 'interrompido',
  },
  commandDescription: 'Mostra os agentes desta sessão e o status de cada um',
  paneTitle: 'Agentes',
  heading: '◆ Agentes',
  working: (n: number) => `◌ ${n} trabalhando`,
  allIdle: '● tudo parado',
  noAgents: 'Nenhum agente nesta sessão.',
  noAgentsYet: 'Nenhum agente nesta sessão ainda.',
  refresh: 'atualiza a cada 2 s',
  refreshLast: (time: string) => `atualiza a cada 2 s · última ${time}`,
}

export type Strings = typeof en
const TABLE: Record<Language, Strings> = { en, 'pt-BR': ptBR }

export function strings(language: unknown): Strings {
  return language === 'pt-BR' ? TABLE['pt-BR'] : TABLE.en
}
