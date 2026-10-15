// Pure logic for tool-log: what an entry holds, how secrets are masked, when a file rolls. No $ here.

export const MAX_FILE_BYTES = 2 * 1024 * 1024 // stay well under the 4 MiB $.fs write limit
const ARG_CHARS = 300

// Best effort: regexes catch the common spellings, not every one. A value stops at a space or a quote so
// the command around it stays readable ("...Bearer ***" keeps its closing quote).
const SECRETS: [RegExp, string][] = [
  // Authorization: <scheme> <value>; the scheme (Bearer, Basic, Token, Digest) stays, the value goes.
  [/\b(authorization\s*[:=]\s*)((?:bearer|basic|token|digest)\s+)?[^\s"']+/gi, '$1$2***'],
  [/\bbearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, 'Bearer ***'],
  // Any other header whose name ENDS in key/token/secret as its own word: X-Api-Key: abc, X-Auth-Token: abc.
  // Not "monkey:", "tokenizer:", nor a host like https://keycloak:8443 (no "//" right before the name).
  [/(^|[^A-Za-z0-9/])((?:[A-Za-z0-9]+[-_])*(?:key|token|secret)\s*:\s*)[^\s"']+/gi, '$1$2***'],
  [/\b([A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD|PWD)[A-Z0-9_]*\s*=\s*)("[^"]*"|'[^']*'|\S+)/gi, '$1***'],
  [/(--?(?:password|token|api-key|secret)[= ]\s*)\S+/gi, '$1***'],
  // curl -u user:pass / --user user:pass: the user stays, the password goes.
  // A numeric uid:gid (docker run -u 1000:1000) is not a password and stays.
  [/((?:^|\s)(?:-u|--user)(?:=|\s+)?)(?!\d+:\d+(?:\s|$))([^\s:"']+):[^\s"']+/g, '$1$2:***'],
  // mysql -pSECRET (glued to -p; -P is the port, so case matters) and docker login -p SECRET.
  [/(\b(?:mysql|mysqldump|mysqladmin|mariadb)\b[^|;&\n]*?\s-p)[^\s"']+/g, '$1***'],
  [/(\bdocker\s+login\b[^|;&\n]*?\s-p\s+)[^\s"']+/g, '$1***'],
  [/\b(sk|pk|rk|ghp|gho|github_pat|xox[abp])[-_][A-Za-z0-9_-]{10,}/g, '***'],
  [/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, '***'], // AWS access key ids
  [/(\/\/[^/\s:@]+):[^@\s/]+@/g, '$1:***@'],
]

export function redact(text: string): string {
  return SECRETS.reduce((out, [pattern, replacement]) => out.replace(pattern, replacement), text)
}

// A short, redacted summary of the call's arguments. File contents are never logged, only paths.
export function summarize(tool: string, args: Record<string, unknown>): string {
  const pick = (k: string) => (typeof args[k] === 'string' ? (args[k] as string) : undefined)
  let text: string
  if (['Edit', 'Write', 'NotebookEdit', 'Read'].includes(tool)) text = pick('file_path') ?? pick('notebook_path') ?? ''
  else if (['Bash', 'PowerShell', 'Monitor'].includes(tool)) text = pick('command') ?? ''
  else if (tool === 'Grep' || tool === 'Glob') text = `${pick('pattern') ?? ''} ${pick('path') ?? ''}`.trim()
  else if (tool === 'WebFetch') text = pick('url') ?? ''
  else text = Object.keys(args).filter(k => !['tool', 'tool_use_id', 'agentId'].includes(k)).join(',')
  const clean = redact(text.replace(/\s+/g, ' '))
  return clean.length > ARG_CHARS ? `${clean.slice(0, ARG_CHARS)}…` : clean
}

export type Entry = {
  ts: string
  tool: string
  id: string
  agentId?: string
  status: 'ok' | 'error' | 'denied'
  ms: number
  args: string
  reason?: string
}

export function fileName(dir: string, sessionId: string, startedAt: number, part: number): string {
  const day = new Date(startedAt).toISOString().slice(0, 10)
  const base = `${dir.replace(/[\\/]+$/, '')}/${day}_${sessionId.replace(/[^A-Za-z0-9_-]/g, '')}`
  return part === 0 ? `${base}.jsonl` : `${base}-part${part}.jsonl`
}

// $.fs limits are in bytes, and string.length counts UTF-16 units: accents and CJK take more bytes.
const encoder = new TextEncoder()
export function byteLength(text: string): number {
  return encoder.encode(text).length
}

export function shouldRoll(currentBytes: number, addBytes: number): boolean {
  return currentBytes > 0 && currentBytes + addBytes > MAX_FILE_BYTES
}
