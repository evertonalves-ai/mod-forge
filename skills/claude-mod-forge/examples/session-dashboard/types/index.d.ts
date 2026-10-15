export type Tab = 'overview' | 'activity' | 'notes'
export type Activity = { id: string; tool: string; at: number; isDone: boolean; isError: boolean }
export type Note = { id: string; text: string; at: number }

declare module 'claude-code' {
  interface PluginState {
    'session-dashboard': {
      tab: Tab
      activity: Activity[]
      notes: Note[]
      filter: string
      turns: number[]
    }
  }
}
