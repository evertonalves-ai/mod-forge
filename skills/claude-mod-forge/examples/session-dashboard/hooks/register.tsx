import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Activity, Note, Tab } from '../types'
import { strings } from './i18n'
import type { Strings } from './i18n'

// ── Identity ────────────────────────────────────────────────────────────────
const PANE = 'session-dashboard'
// The title and every other visible text come from i18n.ts (options.language).
// The command name is written as a literal in register() and in the matcher:
// the validator reads it from source.

// ── State: lives in the host, survives hot reload. plugin/key MUST be literals ──
const tab = atom({ plugin: 'session-dashboard', key: 'tab' } as const, 'overview')
const activity = atom({ plugin: 'session-dashboard', key: 'activity' } as const, [])
const notes = atom({ plugin: 'session-dashboard', key: 'notes' } as const, [])
const filter = atom({ plugin: 'session-dashboard', key: 'filter' } as const, 'all')
const turns = atom({ plugin: 'session-dashboard', key: 'turns' } as const, [])
const totals = atom({ plugin: 'session-dashboard', key: 'totals' } as const, { calls: 0, errors: 0, byTool: {} })

// ── Persistence across sessions ($.store) ──────────────────────────────────
const STORE_NOTES = 'notes'

// ── Drawing helpers (pure, no $) ───────────────────────────────────────────
const tabs = (t: Strings): { id: Tab; label: string; hotkey: string }[] => [
  { id: 'overview', label: t.tabOverview, hotkey: '1' },
  { id: 'activity', label: t.tabActivity, hotkey: '2' },
  { id: 'notes', label: t.tabNotes, hotkey: '3' },
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

function topTools(byTool: Record<string, number>, n: number): [string, number][] {
  return Object.entries(byTool).sort((a, b) => b[1] - a[1]).slice(0, n)
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

export const register: Register = (on, options) => {
  const t = strings(options.language)
  const TITLE = t.title
  // A turn's start time can be lost on reload without harm, so a module variable is fine.
  let turnStartedAt = 0

  // ── Lifecycle ────────────────────────────────────────────────────────────
  on('session.start', async ($, e, next) => {
    await loadNotes($)
    // Opened unasked: the pane seats from 144 columns and waits below that.
    void $.ui.open({ id: PANE, title: TITLE })
    // Register commands last: a taken name throws and would skip what follows.
    await $.command.register({ name: 'dashboard', description: t.commandDescription(TITLE), immediate: true })
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
    const tool = String(e.tool)
    const item: Activity = { id: e.tool_use_id, tool, at: await $.clock.now(), isDone: false, isError: false }
    await update($, activity, list => [...list, item].slice(-300))
    await update($, totals, t => ({ ...t, calls: t.calls + 1, byTool: { ...t.byTool, [tool]: (t.byTool[tool] ?? 0) + 1 } }))
    // finally: an interrupted or failing call is still marked done, never left "running" forever.
    let isError = true
    try {
      const ran = await next(e)
      isError = ran.deny !== undefined || ran.isError === true
      return ran
    } finally {
      await update($, activity, list => list.map(a => (a.id === item.id ? { ...a, isDone: true, isError } : a)))
      if (isError) await update($, totals, t => ({ ...t, errors: t.errors + 1 }))
    }
  })

  // ── The pane ─────────────────────────────────────────────────────────────
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const width = Math.max(24, e.props.bodyColumns)
    const rows = Math.max(6, e.props.scroll.bodyRows - 8)

    const current = await read($, tab)
    const list = await read($, activity)
    const sums = await read($, totals)
    const turnList = await read($, turns)
    const noteList = await read($, notes)
    const currentFilter = await read($, filter)

    const running = list.filter(a => !a.isDone).length
    const avgTurn = turnList.length === 0 ? 0 : Math.round(turnList.reduce((s, n) => s + n, 0) / turnList.length)

    const header = (
      <Box flexDirection="column" marginBottom={1}>
        <Box justifyContent="space-between">
          <Text bold color="claude">◆ {TITLE}</Text>
          <Text color={running > 0 ? 'warning' : 'success'}>{running > 0 ? t.running(running) : t.idle}</Text>
        </Box>
        <Box gap={2} marginTop={1}>
          {tabs(t).map(item => (
            <Button
              key={`tab-${item.id}`}
              label={item.label}
              hotkey={item.hotkey}
              plain
              dimColor={item.id !== current}
              onPress={() => update($, tab, () => item.id)}
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
      const top = topTools(sums.byTool, 5)
      const topMax = top[0]?.[1] ?? 1
      body = (
        <Box flexDirection="column" gap={1}>
          <Box gap={1} flexWrap="wrap">
            {kpi('kpi-tools', t.kpiTools, String(sums.calls), 'text')}
            {kpi('kpi-errors', t.kpiErrors, String(sums.errors), sums.errors > 0 ? 'error' : 'success')}
            {kpi('kpi-turns', t.kpiTurns, String(turnList.length), 'text')}
            {kpi('kpi-avg', t.kpiAvg, `${avgTurn}s`, avgTurn > 120 ? 'warning' : 'text')}
          </Box>
          <Box flexDirection="column">
            <Text bold>{t.turnDurations}</Text>
            <Text color="claude">{sparkline(turnList, width - 2) || t.noFinishedTurn}</Text>
          </Box>
          <Box flexDirection="column">
            <Text bold>{t.mostUsed}</Text>
            {top.length === 0 && <Text dimColor>{t.noToolCalls}</Text>}
            {top.map(([name, count]) => (
              <Box key={`top-${name}`} gap={1}>
                <Box width={12}><Text wrap="truncate-end">{name}</Text></Box>
                <Box flexGrow={1}><Text color="suggestion" wrap="truncate-end">{meter(count / topMax, Math.max(6, width - 24))}</Text></Box>
                <Text dimColor>{String(count)}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )
    } else if (current === 'activity') {
      const tools = ['all', ...topTools(sums.byTool, 8).map(([name]) => name)]
      const shown = list.filter(a => currentFilter === 'all' || a.tool === currentFilter).slice(-rows)
      body = (
        <Box flexDirection="column" gap={1}>
          {e.surface !== 'mobile' && 'Select' in ui && (
            <ui.Select
              key="filter"
              label={t.filter}
              value={tools.includes(currentFilter) ? currentFilter : 'all'}
              options={tools.map(tool => ({ value: tool, label: tool === 'all' ? t.all : tool }))}
              onSelect={value => update($, filter, () => value)}
            />
          )}
          <Box flexDirection="column">
            {shown.length === 0 && <Text dimColor>{t.nothingHere}</Text>}
            {shown.map(a => (
              <Box key={`act-${a.id}`} gap={1}>
                <Text dimColor>{clock(a.at)}</Text>
                <Text color={!a.isDone ? 'warning' : a.isError ? 'error' : 'success'}>{!a.isDone ? '◌' : a.isError ? '✗' : '✓'}</Text>
                <Text wrap="truncate-end">{a.tool}</Text>
              </Box>
            ))}
          </Box>
          <Box>
            <Button key="clear-activity" label={t.clearList} hotkey="c" onPress={() => update($, activity, () => [])} />
          </Box>
        </Box>
      )
    } else {
      body = (
        <Box flexDirection="column" gap={1}>
          {e.surface !== 'mobile' && 'Input' in ui && (
            <ui.Input
              key="new-note"
              label={t.newNote}
              placeholder={t.notePlaceholder}
              value=""
              submitLabel={t.save}
              onSubmit={async text => {
                const clean = text.trim()
                if (clean === '') return
                const now = await $.clock.now()
                await saveNotes($, [...noteList, { id: `n${now}`, text: clean.slice(0, 500), at: now }])
                $.ui.toast(t.noteSaved)
              }}
            />
          )}
          {noteList.length === 0 && <Text dimColor>{t.noNotes}</Text>}
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
          <Text dimColor>{t.footer}</Text>
        </Box>
      </Box>
    )
  })
}
