export type Line = { from: string; to: string; kind: string; text: string; ts: string }

declare module 'claude-code' {
  interface PluginState {
    'agent-dialogue': { lines: Line[]; filter: string; problem: string }
  }
}
