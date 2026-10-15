// The text this mod shows, per language. Pure: no $ calls, so tests can cover it directly.
// Anything other than a known language falls back to English.

export type Language = 'en' | 'pt-BR'

const en = {
  kind: {
    finding: 'finding',
    fix: 'fix',
    question: 'question',
    answer: 'answer',
    verified: 'verified',
    reopen: 'reopened',
    note: 'note',
  } as Record<string, string>,
  waiting: 'waiting for the agents to start writing…',
  cannotRead: 'could not read the dialogue file',
  noFile: 'Set the dialogue file in /config → agent-dialogue.',
  commandDescription: 'Show the conversation between the agents',
  paneTitle: 'Agent dialogue',
  heading: '◆ Agent dialogue',
  messages: (n: number) => `${n} messages`,
  show: 'Show',
  everyone: 'everyone',
  noMessages: 'No messages yet.',
  footer: 'refreshes every 2 s · /dialogue · /agents for status',
}

const ptBR: typeof en = {
  kind: {
    finding: 'achado',
    fix: 'correção',
    question: 'pergunta',
    answer: 'resposta',
    verified: 'conferido',
    reopen: 'reaberto',
    note: 'nota',
  },
  waiting: 'aguardando os agentes começarem a escrever…',
  cannotRead: 'não consegui ler o arquivo do diálogo',
  noFile: 'Defina o arquivo do diálogo em /config → agent-dialogue.',
  commandDescription: 'Mostra a conversa entre os agentes',
  paneTitle: 'Diálogo dos agentes',
  heading: '◆ Diálogo dos agentes',
  messages: (n: number) => `${n} mensagens`,
  show: 'Mostrar',
  everyone: 'todos',
  noMessages: 'Nenhuma mensagem ainda.',
  footer: 'atualiza a cada 2 s · /dialogue · /agents para o status',
}

export type Strings = typeof en
const TABLE: Record<Language, Strings> = { en, 'pt-BR': ptBR }

export function strings(language: unknown): Strings {
  return language === 'pt-BR' ? TABLE['pt-BR'] : TABLE.en
}
