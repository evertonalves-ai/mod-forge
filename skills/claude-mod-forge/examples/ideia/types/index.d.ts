export type Language = 'en' | 'pt-BR'
export type Side = { lens: string; method: string }
export type Pair = { id: string; a: Side; b: Side; bestFor: string }
export type Who = 'A' | 'B'
export type Position = 'open' | 'respond' | 'reply'

// One line of dialogue.jsonl. `from`, `to`, `kind` and `text` on msg and comment lines let the
// agent-dialogue mod show the same file.
export type IdeiaEvent =
  | { type: 'start'; idea: string; ts: string }
  | { type: 'pair'; round: number; pair: Pair; why: string; ts: string }
  | { type: 'msg'; side: Who; round: number; position: Position; text: string; isReady: boolean; from: string; to: string; kind: 'note'; ts: string }
  | { type: 'comment'; round: number; text: string; from: 'you'; to: 'A, B'; kind: 'note'; ts: string }
  | { type: 'summary'; round: number; text: string; ts: string }
  | { type: 'doc'; path: string; isModFit: boolean; ts: string }

export type View = 'idle' | 'setup' | 'ask' | 'resume' | 'choosing' | 'running' | 'paused' | 'roundEnd' | 'finishing' | 'done' | 'error'

// Who the runner is waiting on, for the "thinking" line.
export type Busy = '' | 'suggest' | 'A' | 'B' | 'summary' | 'writer' | 'checker'

export type Suggestion = { pair: Pair; why: string }

declare module 'claude-code' {
  interface PluginState {
    ideia: {
      view: View
      events: IdeiaEvent[]
      dir: string
      suggestion: Suggestion | null
      menu: '' | 'pick' | 'custom'
      busy: Busy
      error: string
      tokens: number
      resumeDir: string
      resumeEvents: IdeiaEvent[]
      isPausing: boolean
      preview: string
    }
  }
}
