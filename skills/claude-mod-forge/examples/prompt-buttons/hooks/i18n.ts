// The text this mod shows, per language. Pure: no $ calls, so tests can cover it directly.
// Anything other than a known language falls back to English.

export type Language = 'en' | 'pt-BR'

const en = {
  // buttons.ts (validation and /buttons n)
  tooMany: (max: number) => `At most ${max} buttons (one per digit hotkey). Delete one first.`,
  needLabel: 'Give the button a label first.',
  needText: 'Type the instruction the button should send.',
  usage: (max: number) => `Usage: /buttons [1-${max}]`,
  noButtonsAddInPane: 'No buttons yet. Add one in the pane.',
  pick: (count: number) => `Pick 1 to ${count}.`,
  // register.tsx
  couldNotSend: (label: string) => `Could not send: ${label}`,
  queued: (label: string) => `Queued: ${label} (runs when Claude is done)`,
  sent: (label: string) => `Sent: ${label}`,
  sending: (label: string) => `Sending: ${label}`,
  commandDescription: 'Open your prompt buttons, or run one: /buttons 2',
  paneTitle: 'Prompt buttons',
  noButtons: 'No buttons yet.',
  noSuchButton: 'No such button.',
  heading: '◆ Prompt buttons',
  working: '◌ Claude is working · new presses queue',
  ready: '● ready',
  emptyPane: 'No buttons yet. Add one below: a label and the instruction it sends.',
  labelField: 'Label',
  labelPlaceholder: 'e.g. Run tests and fix',
  labelSubmit: 'next',
  textField: 'Instruction',
  textPlaceholder: 'What Claude should do, then Enter to add',
  textSubmit: 'add',
  addElsewhere: 'Add buttons from the terminal or the desktop app.',
  footer: '1-9 send · × delete · Tab moves · /buttons n from anywhere',
}

const ptBR: typeof en = {
  tooMany: (max: number) => `No máximo ${max} botões (um por tecla numérica). Apague um antes.`,
  needLabel: 'Dê um nome ao botão primeiro.',
  needText: 'Digite a instrução que o botão deve enviar.',
  usage: (max: number) => `Uso: /buttons [1-${max}]`,
  noButtonsAddInPane: 'Nenhum botão ainda. Crie um no painel.',
  pick: (count: number) => `Escolha de 1 a ${count}.`,
  couldNotSend: (label: string) => `Não foi possível enviar: ${label}`,
  queued: (label: string) => `Na fila: ${label} (roda quando o Claude terminar)`,
  sent: (label: string) => `Enviado: ${label}`,
  sending: (label: string) => `Enviando: ${label}`,
  commandDescription: 'Abre seus botões de prompt, ou roda um: /buttons 2',
  paneTitle: 'Botões de prompt',
  noButtons: 'Nenhum botão ainda.',
  noSuchButton: 'Esse botão não existe.',
  heading: '◆ Botões de prompt',
  working: '◌ Claude trabalhando · novos cliques vão para a fila',
  ready: '● pronto',
  emptyPane: 'Nenhum botão ainda. Crie um abaixo: um nome e a instrução que ele envia.',
  labelField: 'Nome',
  labelPlaceholder: 'ex.: Rodar testes e corrigir',
  labelSubmit: 'próximo',
  textField: 'Instrução',
  textPlaceholder: 'O que o Claude deve fazer; Enter para criar',
  textSubmit: 'criar',
  addElsewhere: 'Crie botões pelo terminal ou pelo app desktop.',
  footer: '1-9 envia · × apaga · Tab navega · /buttons n de qualquer lugar',
}

export type Strings = typeof en
const TABLE: Record<Language, Strings> = { en, 'pt-BR': ptBR }

export function strings(language: unknown): Strings {
  return language === 'pt-BR' ? TABLE['pt-BR'] : TABLE.en
}
