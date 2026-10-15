export type ApiReading =
  | { kind: 'unconfigured'; reason: string }
  | { kind: 'loading' }
  | { kind: 'ok'; value: string; at: number }
  | { kind: 'error'; reason: string; at: number; lastValue?: string; lastAt?: number }

declare module 'claude-code' {
  interface PluginState {
    'api-status': { reading: ApiReading; isHidden: boolean }
  }
}
