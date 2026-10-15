export type SpinnerCalls = number

declare module 'claude-code' {
  interface PluginState {
    'spinner-counter': { calls: SpinnerCalls }
  }
}
