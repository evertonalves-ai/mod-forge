# Where a mod runs and where it draws

Two sources, and they disagree on VS Code. Keep both in mind and design so either can be true.

**Docs (reference "as of v2.1.290"):**
| Where Claude Code runs | Hooks run | Mod UI draws |
|---|---|---|
| `claude` in a terminal (incl. editor terminals, JetBrains plugin) | yes | yes (all elements incl. `Raster`, `Image`) |
| Desktop app, Code tab (local) | yes | yes, except terminal-only elements/sites |
| Desktop app, WSL session | no (no plugins) | no |
| VS Code extension chat panel | yes | **no** |
| `claude -p`, Agent SDK | yes | no |
| Remote Control (claude.ai / mobile) | yes, on the local machine | in the local terminal |
| Cloud sessions | yes, if the plugin reaches the session | no |

**Types (2.1.293):** `RenderSurface = 'terminal' | 'desktop' | 'mobile' | 'vscode'`; remote surfaces (desktop,
mobile, vscode) "draw the tree where they have a slot for it". There is a `vscode` element table (Box, Text,
Button, Input, Select, Svg, Link, Code, Markdown; no Client), and the test kit mounts on `vscode`.

### Which sites are raised where (types, 2.1.293)
| Raised on | Sites |
|---|---|
| every surface | `Pane`, `CommandOutput`, `AskUserQuestion`, `UserMessage`, `AssistantMessage`, `ToolUse`, `ToolResult`, `ToolGroup` |
| terminal + desktop | `AbovePrompt`, `Spinner`, `SessionMode`, `PromptHint` |
| terminal only | `ToolProgress`, `TurnDuration`, `InfoNotice` |

`$.session.surfaces()` answers which surfaces the session draws on right now (empty under `claude -p`).
Narrow elements with `'Input' in ui` etc. instead of assuming a table.

## Design rule
1. **Behaviour** (guards, rewrites, commands, timers, tools) runs on every surface: test it once with the kit.
2. **Drawing** is guaranteed in the terminal and the Desktop app. For anything drawn, also give a **text path**:
   a `/command` that returns the same information as `{ text }`. Check `$.ui.open(...)`'s `isPlaced` and fall
   back to text when it is false.
3. A `Pane` may draw in VS Code per the types; do not promise it. Record what a real VS Code session showed.
4. `AbovePrompt` and `Spinner` are never raised in VS Code: do not base a VS Code feature on them.
5. `$.ui.ask`, toasts, status and log lines are not documented for VS Code: guards must default to the safe
   answer when `$.ui.ask` rejects.

When the user asks for "terminal and VS Code", state this split before building.

## Narrow terminals
Panes opened unasked wait below 144 columns (110 after the user opened them once); inline panes sit above the
prompt; size everything from `bodyColumns`. Test drawings at about 40 and 100 `bodyColumns` in the kit.
