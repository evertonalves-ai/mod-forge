export type PromptButton = { id: string; label: string; text: string }

declare module 'claude-code' {
  interface PluginState {
    'prompt-buttons': { buttons: PromptButton[]; isBusy: boolean; draftLabel: string; error: string }
  }
}
