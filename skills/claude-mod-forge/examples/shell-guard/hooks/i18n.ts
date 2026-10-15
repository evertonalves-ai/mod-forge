// The text the USER sees (question, options, toast), per language. Pure: no $ calls.
// Anything other than a known language falls back to English.
// Deny reasons are not here on purpose: Claude reads them, so they stay in English.

export type Language = 'en' | 'pt-BR'

const en = {
  // Risk labels and reasons come from rules.ts in English; a table maps them for display.
  label: (english: string) => english,
  why: (english: string) => english,
  question: (label: string, why: string, command: string) => `${label} (${why}). Run this command?\n\n${command}`,
  runIt: 'Run it',
  refuse: 'Refuse',
  blocked: (label: string) => `Blocked: ${label}`,
}

const LABELS: Record<string, string> = {
  'recursive force delete': 'exclusão recursiva forçada',
  'force push': 'push forçado',
  'hard reset': 'reset --hard',
  'git clean': 'git clean',
  'destructive SQL': 'SQL destrutivo',
  'recursive permission change': 'mudança recursiva de permissões',
  'disk format': 'formatação de disco',
  'recursive delete': 'exclusão recursiva',
}

const WHYS: Record<string, string> = {
  'deletes files with no undo': 'apaga arquivos sem como desfazer',
  'rewrites shared history': 'reescreve o histórico compartilhado',
  'drops uncommitted work': 'descarta trabalho não commitado',
  'deletes untracked files': 'apaga arquivos não rastreados',
  'removes data': 'remove dados',
  'changes many files at once': 'altera muitos arquivos de uma vez',
  'erases a volume': 'apaga um volume',
  'deletes a folder tree': 'apaga uma árvore de pastas',
}

const ptBR: typeof en = {
  label: english => LABELS[english] ?? english,
  why: english => WHYS[english] ?? english,
  question: (label, why, command) => `${label} (${why}). Executar este comando?\n\n${command}`,
  runIt: 'Executar',
  refuse: 'Recusar',
  blocked: label => `Bloqueado: ${label}`,
}

export type Strings = typeof en
const TABLE: Record<Language, Strings> = { en, 'pt-BR': ptBR }

export function strings(language: unknown): Strings {
  return language === 'pt-BR' ? TABLE['pt-BR'] : TABLE.en
}
