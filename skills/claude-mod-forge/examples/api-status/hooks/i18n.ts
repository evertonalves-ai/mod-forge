// The text this mod shows, per language. Pure: no $ calls, so tests can cover it directly.
// Anything other than a known language falls back to English.

export type Language = 'en' | 'pt-BR'

const en = {
  // api.ts (URL and response checks)
  noUrl: 'No URL set. Configure it in /config → api-status.',
  badUrl: 'The configured URL is not valid.',
  needHttps: 'Use an https:// URL (http:// is allowed only for localhost).',
  noCredentialsInUrl: 'Put credentials in the token option, not in the URL.',
  notJson: 'The response is not JSON.',
  fieldMissing: (path: string) => `Field "${path}" not found in the response.`,
  fieldNotValue: (path: string) => `Field "${path}" is not a single value.`,
  // register.tsx
  unreachable: 'unreachable',
  commandDescription: 'Refresh the API status band (and show it if hidden)',
  textOk: (value: string, at: string) => `API: ${value} (at ${at})`,
  textError: (reason: string) => `API unavailable: ${reason}`,
  textLast: (value: string) => ` · last ${value}`,
  loadingText: 'Loading…',
  unavailable: '✗ unavailable',
  last: '· last',
  at: 'at',
  loading: '◌ loading…',
  refresh: 'refresh',
  hide: 'hide (/api-status)',
}

const ptBR: typeof en = {
  noUrl: 'Nenhuma URL definida. Configure em /config → api-status.',
  badUrl: 'A URL configurada não é válida.',
  needHttps: 'Use uma URL https:// (http:// só é aceito para localhost).',
  noCredentialsInUrl: 'Coloque as credenciais na opção token, não na URL.',
  notJson: 'A resposta não é JSON.',
  fieldMissing: (path: string) => `Campo "${path}" não encontrado na resposta.`,
  fieldNotValue: (path: string) => `Campo "${path}" não é um valor único.`,
  unreachable: 'inacessível',
  commandDescription: 'Atualiza a faixa de status da API (e mostra se estiver oculta)',
  textOk: (value: string, at: string) => `API: ${value} (às ${at})`,
  textError: (reason: string) => `API indisponível: ${reason}`,
  textLast: (value: string) => ` · último ${value}`,
  loadingText: 'Carregando…',
  unavailable: '✗ indisponível',
  last: '· último',
  at: 'às',
  loading: '◌ carregando…',
  refresh: 'atualizar',
  hide: 'ocultar (/api-status)',
}

export type Strings = typeof en
const TABLE: Record<Language, Strings> = { en, 'pt-BR': ptBR }

export function strings(language: unknown): Strings {
  return language === 'pt-BR' ? TABLE['pt-BR'] : TABLE.en
}
