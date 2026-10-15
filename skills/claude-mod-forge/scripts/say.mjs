#!/usr/bin/env node
// say.mjs — append one message to a shared agent dialogue (a JSONL file), or read the last ones.
// The examples/agent-dialogue mod shows the same file live in a pane; point its "file" option at it.
//
//   node say.mjs [--file <path>] <from> <to> <kind> "<text>"   kind: finding | fix | question | answer | verified | reopen | note
//   node say.mjs [--file <path>] --read [n]                    print the last n messages (default 20)
//
// The file comes from --file or the MOD_DIALOGUE_FILE environment variable; there is no default path.
// One line per message: {"from","to","kind","text","ts"}. Text is cut at 2000 characters.
import { appendFileSync, existsSync, readFileSync } from 'node:fs'

const USAGE = [
  'usage: node say.mjs [--file <path>] <from> <to> <kind> "<text>"',
  '       node say.mjs [--file <path>] --read [n]',
  'The file comes from --file or MOD_DIALOGUE_FILE.',
].join('\n')

const args = process.argv.slice(2)
const at = args.indexOf('--file')
const FILE = at >= 0 ? args[at + 1] : process.env.MOD_DIALOGUE_FILE
if (at >= 0) args.splice(at, 2)
if (!FILE) {
  console.error(USAGE)
  process.exit(2)
}

if (args[0] === '--read') {
  const n = Number(args[1] ?? 20)
  const lines = existsSync(FILE) ? readFileSync(FILE, 'utf8').trim().split('\n').filter(Boolean) : []
  for (const l of lines.slice(-(Number.isFinite(n) && n > 0 ? n : 20))) {
    try {
      const m = JSON.parse(l)
      console.log(`[${m.ts}] ${m.from} -> ${m.to} (${m.kind}): ${m.text}`)
    } catch {
      // a half-written line: skip it
    }
  }
  process.exit(0)
}

const [from, to, kind, ...rest] = args
const text = rest.join(' ').trim()
if (!from || !to || !kind || !text) {
  console.error(USAGE)
  process.exit(2)
}
appendFileSync(FILE, JSON.stringify({ from, to, kind, text: text.slice(0, 2000), ts: new Date().toISOString() }) + '\n', 'utf8')
console.log('sent')
