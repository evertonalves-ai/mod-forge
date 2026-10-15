# UI: render sites, elements and the design system

## Drawing in one paragraph
A `ui.render` hook receives one site instance (`e.component`, `e.surface`, `e.requestId`, `e.props`,
`e.viewport`) and returns a tree, `next({ ...e, props })` (engine draws with changed props), or `next(e)`.
Elements come from `const ui = $.ui.resolve(e)`; destructure `Box`, `Text`, `Button` (everywhere).
For the rest, **decide by `e.surface`** and keep `'X' in ui` only to narrow the type:
```tsx
{e.surface !== 'mobile' && 'Input' in ui && <ui.Input … />}        // Input/Select: terminal, desktop, vscode
{e.surface !== 'terminal' && 'Svg' in ui ? <ui.Svg … /> : <Text>…</Text>}   // Svg: desktop, mobile, vscode
{e.surface === 'terminal' && 'Raster' in ui && <ui.Raster … />}    // Raster/Image: terminal only
```
Verified with the 2.1.293 kit: at run time every surface's table lists **every** element, so `'Svg' in ui`
alone is true on the terminal, and the Svg is then dropped from the tree. Use the per-surface lists in
`surfaces.md`.
`TextProps` declares no `key` (a key on `Text` is ignored): to find or address a row from a test, key its `Box`.
A tree that does not validate is dropped and the engine draws its own (a dim line says why under hot reload).
To see what a hook really drew, print `JSON.stringify(await ui.drawn())` in a kit test.

## Sites
| Site | Use | Draws on |
|---|---|---|
| `Pane` (`requestId` = your id) | rich, persistent UI; width `e.props.bodyColumns`, height `e.props.scroll.bodyRows` | every surface (types); seen drawing on terminal and desktop, VS Code unconfirmed (`surfaces.md`) |
| `AbovePrompt` | one shared band above the prompt; return `next(e)` when idle; respect `e.props.hasSurvey` | terminal, desktop |
| `UserMessage`, `AssistantMessage`, `ToolUse`, `ToolResult`, `ToolGroup`, `CommandOutput`, `AskUserQuestion` | restyle native UI | every surface (types) |
| `Spinner`, `SessionMode`, `PromptHint` | restyle native UI | terminal, desktop |
| `ToolProgress`, `TurnDuration`, `InfoNotice` | restyle native UI | terminal only |
Raised-where follows the 2.1.293 types; see `surfaces.md` for the VS Code disagreement with the docs.

### "Put it above / below the prompt" — which place is meant
| The user says | Candidates (ask which, with these words) |
|---|---|
| "above the prompt" | the **band** (`AbovePrompt`, empty unless a mod draws, shared, has the engine's own `[-]` collapse / ctrl+x ctrl+a) · the **spinner line** while Claude works (`Spinner`) · notices under the logo (`InfoNotice`, terminal only) |
| "under the prompt" / "status line" | `$.ui.status(text)` (one pinned line **under** the prompt, prefixed with the mod name) · the hint line (`PromptHint`) |
| "a popup / notification" | `$.ui.toast` (4 s, top right in fullscreen, under the prompt in classic) |
| "in the chat" | `$.ui.log` (dim transcript line Claude does not read) or a `/command` reply (Claude reads it) |
Not a site: the permission prompt.

## Elements
| Element | Key props | Where |
|---|---|---|
| `Box` | `key`, flex (`flexDirection`, `gap`, `columnGap`, `justifyContent`, `alignItems`, `flexGrow`, `flexWrap`), `width`, `height`, padding/margin, `borderStyle` (`single double round bold singleDouble doubleSingle classic arrow dashed quote`), `borderColor`, `backgroundColor`, `position`, `hover`, `display` | all |
| `Text` | `color`, `backgroundColor`, `bold`, `dimColor`, `italic`, `underline`, `inverse`, `wrap` | all |
| `Button` | `key`, `label`, `onPress`, `hotkey` (1 digit or lowercase letter), `plain`, `variant` (`primary`/`secondary`), `role: 'dismiss'`, `dimColor`, `autoFocus: true`, `action` | all |
| `Link`, `Code`, `Markdown` | `href`/`label`; `source`/`language`/`format: 'diff'`; `text` (not children) | all |
| `Input` | `key`, `label`, `placeholder`, `value`, `submitLabel`, `onSubmit(value)`, `onInput(value)` | terminal, desktop, vscode |
| `Select` | `key`, `label`, `options: {value,label?}[]` (≥1, unique), `value`, `onSelect(value)` | terminal, desktop, vscode |
| `Svg` | SVG source ≤ 131,072 chars | desktop, mobile, vscode |
| `Raster`, `Image` | cell grid (`columns ≤ 512`, `rows ≤ 256`, base64 cells) / picture | terminal |
| `Client` | a separate module for animation/pointer input | terminal, desktop |
Boolean "flag" props (`focus`, `closeOnEscape`, `holdToasts`, `autoFocus`) accept only `true`: omit them otherwise.

## Panes
`$.ui.open({ id, title, focus?, closeOnEscape?, holdToasts?, rows?, columns? })` → `{ isPlaced, reason? }`.
Opened by the user (command, button): any width. Opened unasked (`session.start`, timer): from 144 columns
(110 after the user opened it once). `focus: true` is granted only when the prompt is empty.
`holdToasts` only for dialogs that close. `$.ui.close({ id })`.

## Keyboard
Keys reach a pane/band only while it has focus (opened with `focus`, Ctrl+X Tab, or a click). Tab/arrows move,
Enter presses, a `hotkey` presses its button (unless an Input has focus), Esc returns to the prompt.
Terminal bracketed buttons do not show the hotkey: put it in the label (`'c: Clear'`) or use `plain`.
A digit hotkey on the band also fires from an empty prompt.

## Redraw
`$.state` reads subscribe automatically: writing the atom redraws its readers. Module variables need
`$.ui.invalidate('ui.render')`. Timers: `$.clock.every(ms, …)`. Throttled to 10/s (30/s visible pane in terminal).

## Design system (what "professional" means here)
**Anatomy of a pane:** header (title `bold color="claude"` + state on the right) → tabs (plain Buttons with
hotkeys 1..9, inactive ones `dimColor`) → body → footer (available keys in `dimColor`).

**Hierarchy:** one `claude`-coloured bold title per pane; section titles `bold` without colour; secondary text
(labels, times, counts) `dimColor`; `gap={1}` between sections; `paddingX={1}` on the root.

**Semantic colour (theme keys, never hex):** `success` ok/done · `warning` running/attention · `error`
failed/blocked · `suggestion` bars/neutral highlights · `claude` brand · `subtle` card borders. Theme keys
follow light/dark themes.

**Text glyphs (single-width, no emoji):** `●` active · `◌` running · `✓` ok · `✗` error · `◆` brand ·
`·` separator · `›` selected · `▲▼` trend.

**Charts in text:** sparkline `▁▂▃▄▅▆▇█` normalised to the window max; meter `█`×n + `░`; dense grids →
`Raster` (terminal) / `Svg` (desktop) with a text fallback.

**Responsive:** size from `e.props.bodyColumns`, never `e.viewport.columns`; hide secondary parts below ~60–70
columns; KPI cards `flexGrow={1}` inside `flexWrap="wrap"`; long text `wrap="truncate-end"` inside a fixed-width Box.

**States every view needs:** empty (says what will appear), loading (`◌ loading…` in `warning`), error (`✗` + short
reason in `error` + a retry button `r`), and a no-data fallback that never shows an invented number.

**Hide needs a way back.** A "hide" button must be paired with a command (or a hotkey on another site) that
shows the view again; otherwise the control breaks the "every control works" rule after one press.
The engine's own band collapse (`[-]`, ctrl+x ctrl+a) is reversible and needs no code.

**Button count.** Hotkeys are one digit or one lowercase letter: at most 9 numbered actions per view. More
actions go to a second tab, a `Select`, or Tab/arrow navigation.

**Interaction:** every control has a stable `key` (`tab-<id>`, `del-<id>`, `act-<id>`); one primary action;
destructive per-row actions are small `plain` `×` buttons; confirmations of done actions are short toasts;
continuous state goes to `$.ui.status`.

**Surfaces without drawing** (VS Code chat, `claude -p`, SDK, cloud): make the command reply with the same
information as text, and keep hooks useful without UI.
