// Pure allow-list logic. No $ here, so tests cover it directly.

// Anything that chains, substitutes or redirects is never auto-approved:
// "git status && rm -rf x" must not ride along with "git status".
const COMPOUND = /[;&|`<>\n\r]|\$\(/

// An entry is EXACT by default: "git diff" approves "git diff" and nothing else, because arguments can
// change what a command does ("git diff --output=FILE" overwrites a file). Arguments are accepted only
// when the entry says so with a trailing " *": "npm test *" approves "npm test" and "npm test -- foo".
// A "*" anywhere else, or an entry that is only "*", is dropped: it would approve far more than it says.
const ARGS = ' *'

export function parseList(raw: string): string[] {
  return raw
    .split(',')
    .map(s => s.trim().replace(/\s+/g, ' '))
    .filter(s => s.length > 0 && !COMPOUND.test(s))
    .filter(s => {
      const base = s.endsWith(ARGS) ? s.slice(0, -ARGS.length) : s
      return base.length > 0 && !base.includes('*')
    })
}

// Returns the entry that allows the command, or undefined.
export function allowedBy(command: string, list: readonly string[]): string | undefined {
  const cmd = command.trim().replace(/\s+/g, ' ')
  if (cmd === '' || COMPOUND.test(cmd)) return undefined
  return list.find(entry => {
    if (!entry.endsWith(ARGS)) return cmd === entry
    const base = entry.slice(0, -ARGS.length)
    return cmd === base || cmd.startsWith(`${base} `)
  })
}
