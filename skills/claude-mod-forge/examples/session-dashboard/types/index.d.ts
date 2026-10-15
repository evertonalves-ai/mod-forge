export type Tab = 'overview' | 'activity' | 'notes'
export type Activity = { id: string; tool: string; at: number; isDone: boolean; isError: boolean }
export type Note = { id: string; text: string; at: number }
// Session totals: the activity list keeps only the last 300 calls, so counts live here.
export type Totals = { calls: number; errors: number; byTool: Record<string, number> }

declare module 'claude-code' {
  interface PluginState {
    'session-dashboard': {
      tab: Tab
      activity: Activity[]
      notes: Note[]
      filter: string
      turns: number[]
      totals: Totals
    }
  }
}
