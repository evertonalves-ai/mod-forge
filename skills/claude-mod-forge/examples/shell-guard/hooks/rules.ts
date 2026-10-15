// Pure rules, kept apart from the hooks so tests can cover them directly.
// Every tool that runs commands must be guarded: Bash, PowerShell (Windows) and Monitor.
// List them from the tools types (claude-code-tools) for the build you target.
// A regex on command text is a reminder layer, not a sandbox: spellings it misses get through.
// Pair it with permission rules (deny/ask) and branch protection for anything that must hold.

export type Risk = { label: string; why: string }

const RISKS: { pattern: RegExp; label: string; why: string }[] = [
  { pattern: /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\b/i, label: 'recursive force delete', why: 'deletes files with no undo' },
  { pattern: /\bgit\s+push\b.*(--force\b|--force-with-lease\b|\s-f\b)/i, label: 'force push', why: 'rewrites shared history' },
  { pattern: /\bgit\s+reset\s+--hard\b/i, label: 'hard reset', why: 'drops uncommitted work' },
  { pattern: /\bgit\s+clean\s+-[a-z]*f/i, label: 'git clean', why: 'deletes untracked files' },
  { pattern: /\b(drop|truncate)\s+(table|database|schema)\b/i, label: 'destructive SQL', why: 'removes data' },
  { pattern: /\b(chmod|chown)\s+-R\b/i, label: 'recursive permission change', why: 'changes many files at once' },
  { pattern: /\b(mkfs|format)\b/i, label: 'disk format', why: 'erases a volume' },
  // PowerShell / cmd (Windows): the PowerShell tool runs commands too, not only Bash.
  { pattern: /\bRemove-Item\b(?=.*\s-Recurse\b)(?=.*\s-Force\b)/i, label: 'recursive force delete', why: 'deletes files with no undo' },
  { pattern: /\b(rd|rmdir)\s+\/s\b/i, label: 'recursive delete', why: 'deletes a folder tree' },
  { pattern: /\b(Format-Volume|Clear-Disk|Initialize-Disk)\b/i, label: 'disk format', why: 'erases a volume' },
]

export function riskOf(command: string): Risk | undefined {
  const hit = RISKS.find(r => r.pattern.test(command))
  return hit && { label: hit.label, why: hit.why }
}

// Both separators: Windows paths use backslashes.
const SECRET_FILE = /(^|[\\/])(\.env(\.[\w-]+)?|id_(rsa|ed25519)(\.pub)?|[^\\/]+\.(pem|key|p12|pfx)|credentials(\.json)?)$/i

export function isSecretPath(path: string): boolean {
  return SECRET_FILE.test(path)
}
