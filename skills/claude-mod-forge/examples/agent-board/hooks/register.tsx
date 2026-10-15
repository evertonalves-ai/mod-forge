import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AgentRow } from '../types'
import { strings } from './i18n'

// A live board of this session's subagents. Data source: $.agent.list(), polled every 2 s
// (there is no push event for subagent status). Reads only: it never starts or stops an agent.
const PANE = 'agent-board'
const agents = atom({ plugin: 'agent-board', key: 'agents' } as const, [])
const checkedAt = atom({ plugin: 'agent-board', key: 'checkedAt' } as const, 0)

// Icon and color per status; the label comes from i18n.ts.
const STATUS: Record<string, { icon: string; color: string }> = {
  pending: { icon: '◌', color: 'warning' },
  running: { icon: '◌', color: 'warning' },
  waiting: { icon: '…', color: 'suggestion' },
  idle: { icon: '●', color: 'subtle' },
  completed: { icon: '✓', color: 'success' },
  failed: { icon: '✗', color: 'error' },
  killed: { icon: '✗', color: 'error' },
}

async function poll($: EngineInterface) {
  try {
    const list = await $.agent.list()
    const rows: AgentRow[] = list.map(a => ({
      id: a.id,
      name: a.name ?? a.type,
      role: a.description.slice(0, 80),
      status: a.status,
    }))
    const at = await $.clock.now()
    await update($, agents, () => rows)
    await update($, checkedAt, () => at)
  } catch {
    // keep the last list
  }
}

export const register: Register = (on, options) => {
  const t = strings(options.language)
  const label = (status: string) => t.status[status] ?? status

  on('session.start', async ($, e, next) => {
    await poll($)
    $.clock.every(2000, () => poll($))
    try {
      await $.command.register({ name: 'agents', description: t.commandDescription, immediate: true })
    } catch {
      // name taken
    }
    return next(e)
  })

  on('command.run', { command: 'agents' }, async $ => {
    await poll($)
    const opened = await $.ui.open({ id: PANE, title: t.paneTitle, focus: true })
    if (opened.isPlaced) return {}
    // Nothing draws here (VS Code chat, claude -p): the same list as text.
    const rows = await read($, agents)
    return { text: rows.length === 0 ? t.noAgents : rows.map(r => `${r.name}: ${label(r.status)}`).join('\n') }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const rows = await read($, agents)
    const at = await read($, checkedAt)
    const working = rows.filter(r => r.status === 'running' || r.status === 'pending').length

    return (
      <Box flexDirection="column" paddingX={1} gap={1}>
        <Box justifyContent="space-between">
          <Text bold color="claude">{t.heading}</Text>
          <Text color={working > 0 ? 'warning' : 'success'}>{working > 0 ? t.working(working) : t.allIdle}</Text>
        </Box>
        <Box flexDirection="column">
          {rows.length === 0 && <Text dimColor>{t.noAgentsYet}</Text>}
          {rows.map(r => {
            const s = STATUS[r.status] ?? { icon: '?', color: 'text' }
            return (
              <Box key={`agent-${r.id}`} gap={1}>
                <Text color={s.color}>{s.icon}</Text>
                <Box width={14}><Text bold wrap="truncate-end">{r.name}</Text></Box>
                <Box width={12}><Text color={s.color}>{label(r.status)}</Text></Box>
                <Box flexGrow={1}><Text dimColor wrap="truncate-end">{r.role}</Text></Box>
              </Box>
            )
          })}
        </Box>
        <Text dimColor>{at === 0 ? t.refresh : t.refreshLast(new Date(at).toLocaleTimeString(t.locale))}</Text>
      </Box>
    )
  })
}
