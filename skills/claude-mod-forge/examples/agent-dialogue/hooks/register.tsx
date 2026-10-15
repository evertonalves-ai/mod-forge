import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { strings } from './i18n'
import type { Strings } from './i18n'
import { hhmm, parseDialogue } from './parse'

// Shows a conversation that agents append to a JSONL file (scripts/say.mjs writes one).
// Reads only: the file path comes from userConfig, never from the file's own content, and the
// messages are drawn as text, never acted on.
const PANE = 'agent-dialogue'
const lines = atom({ plugin: 'agent-dialogue', key: 'lines' } as const, [])
const filter = atom({ plugin: 'agent-dialogue', key: 'filter' } as const, 'all')
const problem = atom({ plugin: 'agent-dialogue', key: 'problem' } as const, '')

const COLORS = ['claude', 'suggestion', 'success', 'warning']

async function poll($: EngineInterface, file: string, t: Strings) {
  try {
    if (!(await $.fs.exists(file))) {
      await update($, problem, () => t.waiting)
      return
    }
    const parsed = parseDialogue(await $.fs.read(file))
    await update($, lines, () => parsed.slice(-200))
    await update($, problem, () => '')
  } catch {
    await update($, problem, () => t.cannotRead)
  }
}

export const register: Register = (on, options) => {
  const file = String(options.file ?? '').trim()
  const t = strings(options.language)

  on('session.start', async ($, e, next) => {
    if (file === '') {
      // No default path: the pane says how to set one.
      await update($, problem, () => t.noFile)
    } else {
      await poll($, file, t)
      $.clock.every(2000, () => poll($, file, t))
    }
    try {
      await $.command.register({ name: 'dialogue', description: t.commandDescription, immediate: true })
    } catch {
      // name taken
    }
    return next(e)
  })

  on('command.run', { command: 'dialogue' }, async $ => {
    if (file === '') return { text: t.noFile }
    await poll($, file, t)
    const opened = await $.ui.open({ id: PANE, title: t.paneTitle, focus: true })
    if (opened.isPlaced) return {}
    // Nothing draws here (VS Code chat, claude -p): the last messages as text.
    const all = await read($, lines)
    return { text: all.length === 0 ? t.noMessages : all.slice(-15).map(l => `${l.from} → ${l.to || t.everyone}: ${l.text}`).join('\n') }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const all = await read($, lines)
    const current = await read($, filter)
    const note = file === '' ? t.noFile : await read($, problem)
    const authors = [...new Set(all.map(l => l.from))]
    const shown = all.filter(l => current === 'all' || l.from === current).slice(-Math.max(6, e.props.scroll.bodyRows - 6))
    const color = (who: string) => COLORS[Math.max(0, authors.indexOf(who)) % COLORS.length] ?? 'text'

    return (
      <Box flexDirection="column" paddingX={1} gap={1}>
        <Box justifyContent="space-between">
          <Text bold color="claude">{t.heading}</Text>
          <Text dimColor>{t.messages(all.length)}</Text>
        </Box>
        {e.surface !== 'mobile' && 'Select' in ui && authors.length > 0 && (
          <ui.Select
            key="author"
            label={t.show}
            value={current}
            options={[{ value: 'all', label: t.everyone }, ...authors.map(a => ({ value: a, label: a }))]}
            onSelect={value => update($, filter, () => value)}
          />
        )}
        <Box flexDirection="column" gap={1}>
          {shown.length === 0 && <Text dimColor>{note || t.noMessages}</Text>}
          {shown.map((l, i) => (
            <Box key={`msg-${i}-${l.ts}`} flexDirection="column">
              <Box gap={1}>
                <Text bold color={color(l.from)}>{l.from}</Text>
                <Text dimColor>{`→ ${l.to || t.everyone} · ${t.kind[l.kind] ?? l.kind}${hhmm(l.ts) ? ` · ${hhmm(l.ts)}` : ''}`}</Text>
              </Box>
              <Text wrap="wrap">{l.text}</Text>
            </Box>
          ))}
        </Box>
        <Text dimColor>{t.footer}</Text>
      </Box>
    )
  })
}
