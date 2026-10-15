# Where a mod runs and where it draws

| Where Claude Code runs | Hooks run | Mod UI draws | Plan for |
|---|---|---|---|
| `claude` in a terminal (incl. editor terminals, JetBrains plugin) | yes | yes (all elements incl. `Raster`, `Image`) | full UI |
| Desktop app, Code tab (local) | yes | yes, except terminal-only elements/sites | `Svg` instead of `Raster`; no `ToolProgress`/`TurnDuration`/`InfoNotice` |
| Desktop app, WSL session | no (no plugins) | no | nothing loads |
| VS Code extension chat panel | yes | **no** | command text replies, toasts/logs may not show: keep behaviour useful without UI |
| `claude -p`, Agent SDK | yes | no | no one to ask: `$.ui.ask` rejects → safe default; hot reload approval impossible |
| Remote Control (claude.ai / mobile) | yes, on the local machine | in the local terminal | — |
| Cloud sessions | yes, if the plugin reaches the session | no | — |

`e.surface` in render hooks is `terminal`, `desktop`, `vscode` or `mobile`; the element table differs per surface
(`mobile` has no `Input`/`Select`). Narrow with `'Input' in ui` rather than assuming.

## "Make it work in the terminal and in VS Code" (acceptance case G)
Separate the two questions:
1. **Behaviour** (guards, rewrites, commands, timers, tools): runs in both. Test it once with the kit.
2. **Drawing**: terminal and Desktop only. For VS Code provide an equivalent through what runs there:
   a `/command` that returns the same information as `{ text }`, `$.ui.log` lines, or a tool Claude can call.
State this split to the user before building; do not promise a pane in VS Code.

## Narrow terminals
Panes opened unasked wait below 144 columns; inline panes sit above the prompt; size everything from
`bodyColumns`. Test the drawing at 40 and 100 `bodyColumns` in the kit.
