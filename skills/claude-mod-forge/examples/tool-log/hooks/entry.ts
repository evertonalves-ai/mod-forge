// Pure logic for tool-log: what an entry holds, how secrets are masked, when a file rolls. No $ here.

export const MAX_FILE_BYTES = 2 * 1024 * 1024 // stay well under the 4 MiB $.fs write limit
const ARG_CHARS = 300

const SECRETS: [RegExp, string][] = [
  [/\b(authorization\s*[:=]\s*)(bearer\s+)?\S+/gi, '$1$2***'],
  [/\bbearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, 'Bearer ***'],
  [/\b([A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD|PWD)[A-Z0-9_]*\s*=\s*)("[^"]*"|'[^']*'|\S+)/gi, '$1***'],
  [/(--?(?:password|token|api-key|secret)[= ]\s*)\S+/gi, '$1***'],
  [/\b(sk|pk|rk|ghp|gho|github_pat|xox[abp])[-_][A-Za-z0-9_-]{10,}/g, '***'],
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

export function shouldRoll(currentBytes: number, addBytes: number): boolean {
  return currentBytes > 0 && currentBytes + addBytes > MAX_FILE_BYTES
}
