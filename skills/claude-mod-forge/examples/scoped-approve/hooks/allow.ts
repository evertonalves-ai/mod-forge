// Pure allow-list logic. No $ here, so tests cover it directly.

// Anything that chains, substitutes or redirects is never auto-approved:
// "git status && rm -rf x" must not ride along with "git status".
const COMPOUND = /[;&|`<>\n\r]|\$\(/

export function parseList(raw: string): string[] {
  return raw
    .split(',')
    .map(s => s.trim().replace(/\s+/g, ' '))
    .filter(s => s.length > 0 && !COMPOUND.test(s))
}

// Returns the entry that allows the command, or undefined.
export function allowedBy(command: string, list: readonly string[]): string | undefined {
  const cmd = command.trim().replace(/\s+/g, ' ')
  if (cmd === '' || COMPOUND.test(cmd)) return undefined
  return list.find(entry => cmd === entry || cmd.startsWith(entry + ' '))
}
