import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { PromptButton } from '../types'
import { KEY_PREFIX, byId, parseIndex, validate } from './buttons'

const PANE = 'prompt-buttons'
const buttons = atom({ plugin: 'prompt-buttons', key: 'buttons' } as const, [])
const isBusy = atom({ plugin: 'prompt-buttons', key: 'isBusy' } as const, false)
const draftLabel = atom({ plugin: 'prompt-buttons', key: 'draftLabel' } as const, '')
const error = atom({ plugin: 'prompt-buttons', key: 'error' } as const, '')

// Buttons live in $.store, one key each, so they survive sessions and /clear.
async function load($: EngineInterface) {
  const keys = (await $.store.keys()).filter(k => k.startsWith(KEY_PREFIX))
  const list: PromptButton[] = []
  for (const key of keys) {
    const value = await $.store.get(key)
    if (value !== null && typeof value === 'object' && 'label' in value && 'text' in value) list.push(value as PromptButton)
  }
  await update($, buttons, () => list.sort(byId))
}

// Sends the saved instruction. Claude reads it framed as sent by this mod (no asUser).
// $.prompt.submit waits until Claude is idle, so it is never awaited inside a handler, and it is
// refused when called from a command.run hook (it would wait on the turn that hook holds):
// the command path schedules it with $.clock.after(0, …) instead.
async function send($: EngineInterface, button: PromptButton): Promise<string> {
  const busy = await read($, isBusy)
  $.prompt.submit({ text: button.text }).catch(() => $.ui.toast(`Could not send: ${button.label}`))
  const note = busy ? `Queued: ${button.label} (runs when Claude is done)` : `Sent: ${button.label}`
  $.ui.toast(note)
  return note
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await load($)
    try {
      await $.command.register({ name: 'buttons', description: 'Open your prompt buttons, or run one: /buttons 2', argumentHint: '[n]', immediate: true })
    } catch {
      // name taken: the pane is still reachable when opened from session.start below
    }
    void $.ui.open({ id: PANE, title: 'Prompt buttons' })
    return next(e)
  })

  on('classic.SessionStart', { source: ['clear', 'resume', 'fork'] }, async ($, e, next) => {
    await load($)
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    await update($, isBusy, () => true)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) await update($, isBusy, () => false)
    return next(e)
  })

  on('command.run', { command: 'buttons' }, async ($, e) => {
    const list = await read($, buttons)
    const index = parseIndex(e.args, list.length)
    if (index === undefined) {
      const opened = await $.ui.open({ id: PANE, title: 'Prompt buttons', focus: true })
      if (opened.isPlaced) return {}
      // Nothing draws here (VS Code chat, claude -p): the same buttons as text.
      return { text: list.length === 0 ? 'No buttons yet.' : list.map((b, i) => `${i + 1}. ${b.label}`).join('\n') }
    }
    if (typeof index === 'object') return { text: index.error }
    const button = list[index]
    if (button === undefined) return { text: 'No such button.' }
    const busy = await read($, isBusy)
    $.clock.after(0, () => send($, button)) // outside this hook, where submit is allowed
    return { text: busy ? `Queued: ${button.label} (runs when Claude is done)` : `Sending: ${button.label}` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const list = await read($, buttons)
    const busy = await read($, isBusy)
    const label = await read($, draftLabel)
    const problem = await read($, error)

    return (
      <Box flexDirection="column" paddingX={1} gap={1}>
        <Box justifyContent="space-between">
          <Text bold color="claude">◆ Prompt buttons</Text>
          <Text color={busy ? 'warning' : 'success'}>{busy ? '◌ Claude is working · new presses queue' : '● ready'}</Text>
        </Box>

        <Box flexDirection="column">
          {list.length === 0 && <Text dimColor>No buttons yet. Add one below: a label and the instruction it sends.</Text>}
          {list.map((b, i) => (
            <Box key={`row-${b.id}`} gap={1}>
              <Button key={`run-${b.id}`} label={b.label} hotkey={String(i + 1)} plain onPress={() => send($, b)} />
              <Box flexGrow={1}><Text dimColor wrap="truncate-end">{b.text}</Text></Box>
              <Button
                key={`del-${b.id}`}
                label="×"
                plain
                dimColor
                onPress={async () => {
                  await $.store.delete(`${KEY_PREFIX}${b.id}`)
                  await update($, buttons, l => l.filter(x => x.id !== b.id))
                }}
              />
            </Box>
          ))}
        </Box>

        {e.surface !== 'mobile' && 'Input' in ui ? (
          <Box flexDirection="column">
            <ui.Input
              key="new-label"
              label="Label"
              placeholder="e.g. Run tests and fix"
              value={label}
              submitLabel="next"
              onInput={value => update($, draftLabel, () => value)}
              onSubmit={value => update($, draftLabel, () => value)}
            />
            <ui.Input
              key="new-text"
              label="Instruction"
              placeholder="What Claude should do, then Enter to add"
              value=""
              submitLabel="add"
              onSubmit={async text => {
                const checked = validate(await read($, draftLabel), text, (await read($, buttons)).length)
                if ('error' in checked) {
                  await update($, error, () => checked.error)
                  return
                }
                const id = String(await $.clock.now())
                const button: PromptButton = { id, ...checked }
                await $.store.set(`${KEY_PREFIX}${id}`, button)
                await update($, buttons, l => [...l, button].sort(byId))
                await update($, draftLabel, () => '')
                await update($, error, () => '')
              }}
            />
            {problem !== '' && <Text color="error">✗ {problem}</Text>}
          </Box>
        ) : (
          <Text dimColor>Add buttons from the terminal or the desktop app.</Text>
        )}

        <Text dimColor>1-9 send · × delete · Tab moves · /buttons n from anywhere</Text>
      </Box>
    )
  })
}
