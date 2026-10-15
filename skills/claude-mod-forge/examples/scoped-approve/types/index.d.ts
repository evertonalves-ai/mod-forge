export type Approval = { command: string; at: number }

declare module 'claude-code' {
  interface PluginState {
    'scoped-approve': { approvals: Approval[] }
  }
}
