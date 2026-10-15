export type Point = { percent: number; tokens: number; window: number }

declare module 'claude-code' {
  interface PluginState {
    'context-chart': { points: Point[] }
  }
}
