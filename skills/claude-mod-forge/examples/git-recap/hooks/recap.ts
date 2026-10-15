// Pure logic for /recap: argument parsing and output formatting. No $ here.

export const MAX_DAYS = 30

export type ParsedArgs = { days: number } | { error: string }

export function parseDays(args: string): ParsedArgs {
  const raw = args.trim()
  if (raw === '') return { days: 1 }
  if (!/^\d{1,3}$/.test(raw)) return { error: `"${raw.slice(0, 20)}" is not a number of days. Usage: /recap [days], 1 to ${MAX_DAYS}.` }
  const days = Number(raw)
  if (days < 1 || days > MAX_DAYS) return { error: `Pick 1 to ${MAX_DAYS} days.` }
  return { days }
}

// git log --pretty=format:%h%x09%ad%x09%s --date=short
export function formatLog(stdout: string, days: number): string {
  const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return `No commits in the last ${days} day(s).`
  const rows = lines.slice(0, 50).map(line => {
    const [hash = '', date = '', ...subject] = line.split('\t')
    return `- ${date} ${hash} ${subject.join(' ')}`
  })
  const more = lines.length > 50 ? `\n…and ${lines.length - 50} more.` : ''
  return `${lines.length} commit(s) in the last ${days} day(s):\n${rows.join('\n')}${more}`
}
