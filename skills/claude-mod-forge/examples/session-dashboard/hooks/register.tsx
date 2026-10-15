import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Activity, Note, Tab } from '../types'

// ── Identity ────────────────────────────────────────────────────────────────
const PANE = 'session-dashboard'
const TITLE = 'Session dashboard'
// The command name is written as a literal in register() and in the matcher:
// the validator reads it from source.

// ── State: lives in the host, survives hot reload. plugin/key MUST be literals ──
const tab = atom({ plugin: 'session-dashboard', key: 'tab' } as const, 'overview')
const activity = atom({ plugin: 'session-dashboard', key: 'activity' } as const, [])
const notes = atom({ plugin: 'session-dashboard', key: 'notes' } as const, [])
const filter = atom({ plugin: 'session-dashboard', key: 'filter' } as const, 'all')
const turns = atom({ plugin: 'session-dashboard', key: 'turns' } as const, [])

// ── Persistence across sessions ($.store) ──────────────────────────────────
const STORE_NOTES = 'notes'

// ── Drawing helpers (pure, no $) ───────────────────────────────────────────
const TABS: { id: Tab; label: string; hotkey: string }[] = [
  { id: 'overview', label: 'Overview', hotkey: '1' },
  { id: 'activity', label: 'Activity', hotkey: '2' },
  { id: 'notes', label: 'Notes', hotkey: '3' },
]
const BARS = '▁▂▃▄▅▆▇█'

function sparkline(values: number[], width: number): string {
  const slice = values.slice(-width)
  if (slice.length === 0) return ''
  const max = Math.max(...slice, 1)
  return slice.map(v => BARS[Math.min(7, Math.floor((v / max) * 7))] ?? BARS[0]).join('')
}

function meter(ratio: number, width: number): string {
  const full = Math.round(Math.max(0, Math.min(1, ratio)) * width)
  return '█'.repeat(full) + '░'.repeat(Math.max(0, width - full))
}

function clock(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function topTools(list: Activity[], n: number): [string, number][] {
  const counts = new Map<string, number>()
  for (const a of list) counts.set(a.tool, (counts.get(a.tool) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
}

// Helpers that take $ are top-level functions, so the validator can trace their calls.
async function loadNotes($: EngineInterface) {
  const saved = await $.store.get(STORE_NOTES)
  await update($, notes, () => (Array.isArray(saved) ? (saved as Note[]) : []))
}

async function saveNotes($: EngineInterface, list: Note[]) {
  await update($, notes, () => list)
  await $.store.set(STORE_NOTES, list)
}

export const register: Register = on => {
  // A turn's start time can be lost on reload without harm, so a module variable is fine.
  let turnStartedAt = 0

  // ── Lifecycle ────────────────────────────────────────────────────────────
  on('session.start', async ($, e, next) => {
    await loadNotes($)
    // Opened unasked: the pane seats from 144 columns and waits below that.
    void $.ui.open({ id: PANE, title: TITLE })
    // Register commands last: a taken name throws and would skip what follows.
    await $.command.register({ name: 'dashboard', description: `Open the ${TITLE}`, immediate: true })
    return next(e)
  })

  // /clear, /resume and /branch reset $.state and do not fire session.start again.
  on('classic.SessionStart', { source: ['clear', 'resume', 'fork'] }, async ($, e, next) => {
    await loadNotes($)
    return next(e)
  })

  on('command.run', { command: 'dashboard' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })
    return {}
  })

  // ── Data collection (observers: no .catch, a failure lets the event through) ─
  on('prompt.submit', async ($, e, next) => {
    turnStartedAt = await $.clock.now()
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined && turnStartedAt > 0) {
      const seconds = Math.round(((await $.clock.now()) - turnStartedAt) / 1000)
      await update($, turns, list => [...list, seconds].slice(-60))
    }
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const item: Activity = { id: e.tool_use_id, tool: String(e.tool), at: await $.clock.now(), isDone: false, isError: false }
    await update($, activity, list => [...list, item].slice(-300))
    const ran = await next(e)
    const isError = ran.deny !== undefined || ran.isError === true
    await update($, activity, list => list.map(a => (a.id === item.id ? { ...a, isDone: true, isError } : a)))
    return ran
  })

  // ── The pane ─────────────────────────────────────────────────────────────
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const width = Math.max(24, e.props.bodyColumns)
    const rows = Math.max(6, e.props.scroll.bodyRows - 8)

    const current = await read($, tab)
    const list = await read($, activity)
    const turnList = await read($, turns)
    const noteList = await read($, notes)
    const currentFilter = await read($, filter)

    const running = list.filter(a => !a.isDone).length
    const errors = list.filter(a => a.isError).length
    const avgTurn = turnList.length === 0 ? 0 : Math.round(turnList.reduce((s, n) => s + n, 0) / turnList.length)

    const header = (
      <Box flexDirection="column" marginBottom={1}>
        <Box justifyContent="space-between">
          <Text bold color="claude">◆ {TITLE}</Text>
          <Text color={running > 0 ? 'warning' : 'success'}>{running > 0 ? `◌ ${running} running` : '● idle'}</Text>
        </Box>
        <Box gap={2} marginTop={1}>
          {TABS.map(t => (
            <Button
              key={`tab-${t.id}`}
              label={t.label}
              hotkey={t.hotkey}
              plain
              dimColor={t.id !== current}
              onPress={() => update($, tab, () => t.id)}
            />
          ))}
        </Box>
      </Box>
    )

    const kpi = (key: string, label: string, value: string, color: string) => (
      <Box key={key} flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1} flexGrow={1}>
        <Text dimColor>{label}</Text>
        <Text bold color={color}>{value}</Text>
      </Box>
    )

    let body
    if (current === 'overview') {
      const top = topTools(list, 5)
      const topMax = top[0]?.[1] ?? 1
      body = (
        <Box flexDirection="column" gap={1}>
          <Box gap={1} flexWrap="wrap">
            {kpi('kpi-tools', 'Tool calls', String(list.length), 'text')}
            {kpi('kpi-errors', 'Errors', String(errors), errors > 0 ? 'error' : 'success')}
            {kpi('kpi-turns', 'Turns', String(turnList.length), 'text')}
            {kpi('kpi-avg', 'Avg turn', `${avgTurn}s`, avgTurn > 120 ? 'warning' : 'text')}
          </Box>
          <Box flexDirection="column">
            <Text bold>Turn durations</Text>
            <Text color="claude">{sparkline(turnList, width - 2) || 'No finished turn yet.'}</Text>
          </Box>
          <Box flexDirection="column">
            <Text bold>Most used</Text>
            {top.length === 0 && <Text dimColor>No tool calls yet.</Text>}
            {top.map(([name, count]) => (
              <Box key={`top-${name}`} gap={1}>
                <Box width={12}><Text wrap="truncate-end">{name}</Text></Box>
                <Text color="suggestion">{meter(count / topMax, Math.max(6, width - 22))}</Text>
                <Text dimColor>{String(count)}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )
    } else if (current === 'activity') {
      const tools = ['all', ...topTools(list, 8).map(([name]) => name)]
      const shown = list.filter(a => currentFilter === 'all' || a.tool === currentFilter).slice(-rows)
      body = (
        <Box flexDirection="column" gap={1}>
          {e.surface !== 'mobile' && 'Select' in ui && (
            <ui.Select
              key="filter"
              label="Filter"
              value={tools.includes(currentFilter) ? currentFilter : 'all'}
              options={tools.map(t => ({ value: t, label: t }))}
              onSelect={value => update($, filter, () => value)}
            />
          )}
          <Box flexDirection="column">
            {shown.length === 0 && <Text dimColor>Nothing here yet.</Text>}
            {shown.map(a => (
              <Box key={`act-${a.id}`} gap={1}>
                <Text dimColor>{clock(a.at)}</Text>
                <Text color={!a.isDone ? 'warning' : a.isError ? 'error' : 'success'}>{!a.isDone ? '◌' : a.isError ? '✗' : '✓'}</Text>
                <Text wrap="truncate-end">{a.tool}</Text>
              </Box>
            ))}
          </Box>
          <Box>
            <Button key="clear-activity" label="c: Clear list" hotkey="c" onPress={() => update($, activity, () => [])} />
          </Box>
        </Box>
      )
    } else {
      body = (
        <Box flexDirection="column" gap={1}>
          {e.surface !== 'mobile' && 'Input' in ui && (
            <ui.Input
              key="new-note"
              label="New note"
              placeholder="Type and press Enter"
              value=""
              submitLabel="save"
              onSubmit={async text => {
                const clean = text.trim()
                if (clean === '') return
                const now = await $.clock.now()
                await saveNotes($, [...noteList, { id: `n${now}`, text: clean.slice(0, 500), at: now }])
                $.ui.toast('Note saved')
              }}
            />
          )}
          {noteList.length === 0 && <Text dimColor>No notes. They are kept across sessions.</Text>}
          {noteList.slice(-rows).map(n => (
            <Box key={`note-${n.id}`} gap={1}>
              <Button key={`del-${n.id}`} label="×" plain onPress={() => saveNotes($, noteList.filter(x => x.id !== n.id))} />
              <Text dimColor>{clock(n.at)}</Text>
              <Box flexGrow={1}><Text wrap="wrap">{n.text}</Text></Box>
            </Box>
          ))}
        </Box>
      )
    }

    return (
      <Box flexDirection="column" paddingX={1}>
        {header}
        {body}
        <Box marginTop={1}>
          <Text dimColor>1·2·3 tabs · Tab moves · Esc back to prompt · /dashboard</Text>
        </Box>
      </Box>
    )
  })
}
