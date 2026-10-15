import type { Language } from '../types'

// Screen text. Prompts sent to the model live in prompts.ts (English instructions, a line asking
// for the configured language), and the request sent to Claude for the mod offer stays English.

const en = {
  commandDescription: 'Two thinkers refine an idea by dialogue: /ideia <your idea>',
  paneTitle: 'Ideia',
  heading: '◆ Ideia',
  round: (r: number, max: number) => `round ${r} of ${max}`,
  noFolder: 'Set the folder for conversations in /config → ideia.',
  noSurface: 'The ideia mod needs the terminal or the desktop app to show its pane.',
  running: 'A conversation is already open. Showing it.',
  ideaLabel: 'Your idea',
  ideaPlaceholder: 'e.g. an app to track monthly spending',
  ideaSubmit: 'start',
  resumeText: (round: number, idea: string) => `A conversation stopped at round ${round}: "${idea}"`,
  resume: 'r · resume',
  fresh: 'n · new idea',
  suggesting: '◌ choosing a pair of viewpoints…',
  suggested: 'Suggested pair',
  accept: 'a · accept',
  pick: 'p · pick another',
  custom: 'e · write your own',
  pairLabel: 'Pair',
  customLabel: 'Your pair',
  customPlaceholder: 'investor × customer',
  customSubmit: 'use',
  thinking: (who: string) => `◌ ${who} is thinking…`,
  summarizing: '◌ summing up the round…',
  writing: '◌ writing the document…',
  checking: '◌ checking it against the conversation…',
  pausing: '◌ pausing after this message…',
  paused: '⏸ paused',
  pause: 's · pause',
  unpause: 's · resume',
  finish: 'f · finish now',
  changePair: 'p · change pair (next round)',
  next: 'n · next round',
  nextPair: (a: string, b: string) => `Next round: ${a} × ${b}`,
  commentLabel: 'Comment',
  commentPlaceholder: 'Both sides read it before the next message',
  commentSubmit: 'send',
  you: 'You',
  roundEnd: (r: number) => `End of round ${r}`,
  empty: 'The first message is on its way.',
  saved: (path: string) => `Saved: ${path}`,
  modOffer: 'm · build it as a mod',
  modSent: 'Sent to Claude: build it as a mod with mod-forge.',
  modFailed: 'Could not send the request to Claude.',
  newIdea: 'n · new idea',
  failed: '✗ Something failed',
  retry: 't · try again',
  finishAnyway: 'f · finish with what exists',
  apiError: (kind: string) => `the model API answered with an error (${kind})`,
  emptyReply: 'the model answered with no text',
  aborted: 'the call took too long or was stopped',
  writeFailed: 'could not write in the conversations folder',
  tokens: (n: string) => `${n} tokens`,
  footer: 'Tab moves · Esc back to the prompt · /ideia',
}

const ptBR: typeof en = {
  commandDescription: 'Dois pensadores refinam uma ideia em diálogo: /ideia <sua ideia>',
  paneTitle: 'Ideia',
  heading: '◆ Ideia',
  round: (r: number, max: number) => `rodada ${r} de ${max}`,
  noFolder: 'Defina a pasta das conversas em /config → ideia.',
  noSurface: 'O mod ideia precisa do terminal ou do app desktop para mostrar o painel.',
  running: 'Já existe uma conversa aberta. Mostrando ela.',
  ideaLabel: 'Sua ideia',
  ideaPlaceholder: 'ex.: um app para controlar gastos do mês',
  ideaSubmit: 'começar',
  resumeText: (round: number, idea: string) => `Uma conversa parou na rodada ${round}: "${idea}"`,
  resume: 'r · continuar',
  fresh: 'n · ideia nova',
  suggesting: '◌ escolhendo um par de pontos de vista…',
  suggested: 'Par sugerido',
  accept: 'a · aceitar',
  pick: 'p · escolher outro',
  custom: 'e · escrever o seu',
  pairLabel: 'Par',
  customLabel: 'Seu par',
  customPlaceholder: 'investidor × cliente',
  customSubmit: 'usar',
  thinking: (who: string) => `◌ ${who} está pensando…`,
  summarizing: '◌ resumindo a rodada…',
  writing: '◌ escrevendo o documento…',
  checking: '◌ conferindo com a conversa…',
  pausing: '◌ pausando depois desta mensagem…',
  paused: '⏸ pausado',
  pause: 's · pausar',
  unpause: 's · continuar',
  finish: 'f · encerrar agora',
  changePair: 'p · trocar par (próxima rodada)',
  next: 'n · próxima rodada',
  nextPair: (a: string, b: string) => `Próxima rodada: ${a} × ${b}`,
  commentLabel: 'Comentário',
  commentPlaceholder: 'Os dois lados leem antes da próxima mensagem',
  commentSubmit: 'enviar',
  you: 'Você',
  roundEnd: (r: number) => `Fim da rodada ${r}`,
  empty: 'A primeira mensagem está a caminho.',
  saved: (path: string) => `Salvo: ${path}`,
  modOffer: 'm · transformar num mod',
  modSent: 'Enviado ao Claude: construir como mod com o mod-forge.',
  modFailed: 'Não foi possível enviar o pedido ao Claude.',
  newIdea: 'n · ideia nova',
  failed: '✗ Algo falhou',
  retry: 't · tentar de novo',
  finishAnyway: 'f · encerrar com o que já existe',
  apiError: (kind: string) => `a API do modelo respondeu com erro (${kind})`,
  emptyReply: 'o modelo respondeu sem texto',
  aborted: 'a chamada demorou demais ou foi interrompida',
  writeFailed: 'não foi possível gravar na pasta das conversas',
  tokens: (n: string) => `${n} tokens`,
  footer: 'Tab navega · Esc volta ao prompt · /ideia',
}

export type Strings = typeof en
const TABLE: Record<Language, Strings> = { en, 'pt-BR': ptBR }

export function language(value: unknown): Language {
  return value === 'pt-BR' ? 'pt-BR' : 'en'
}

export function strings(value: unknown): Strings {
  return TABLE[language(value)]
}

export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
