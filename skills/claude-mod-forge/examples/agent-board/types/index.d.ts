export type AgentRow = { id: string; name: string; role: string; status: string }

declare module 'claude-code' {
  interface PluginState {
    'agent-board': { agents: AgentRow[]; checkedAt: number }
  }
}
