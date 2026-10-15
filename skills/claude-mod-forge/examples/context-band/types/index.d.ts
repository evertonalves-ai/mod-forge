export type Reading = { tokens: number; window: number; percent: number }

declare module 'claude-code' {
  interface PluginState {
    'context-band': { readings: Reading[]; isHidden: boolean }
  }
}
