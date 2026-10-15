# Discovery: the adaptive interview

Goal: enough facts to fill `templates/project-spec.md`, with as few questions as possible.

## Rules
1. **Extract before asking.** Parse the request into the spec fields first. A field the request answers is
   never asked. A field the files, repo or `.d.ts` can answer is looked up, not asked.
2. **Max 3 questions per round**, with AskUserQuestion (if that tool is unavailable, ask the same questions as
   a short numbered list in chat, options lettered, recommendation marked), options written in the user's words (no API jargon),
   the recommended option first and marked "(Recommended)". "Other" is always available.
3. **Most design-changing question first.** Order: what problem → where it shows → observe or change →
   the rest. Stop when the spec can be filled.
4. **When the user doesn't know**, explain the options in one line each and recommend one. Example:
   "A pane stays open beside the chat and holds a lot; a band is one line above the prompt; a command answers
   only when you type it. For a live counter I'd use the band."
5. **Explain observe / change / take over** whenever behaviour is involved:
   - *observe*: the mod watches and Claude Code goes on as usual (safe, invisible to Claude);
   - *change*: the mod edits the event before it continues (Claude sees the edited version);
   - *take over*: the mod answers itself and Claude Code's own behaviour does not run (blocking lives here).
6. **"You decide"** → pick defaults from the table at the end, write them as assumptions in the spec.
7. **Safety questions are never skipped** (they may take their own round; the 3-question cap is per round) when the mod blocks, approves, rewrites, runs processes, reaches the
   network, writes files or touches secrets (section E).
8. **Typical totals:** small mod 0–1 rounds, medium 1–2, large 2–3. More than 3 rounds means the request should
   be split into phases.

## The decision tree

### A. Category (usually inferred, rarely asked)
1 Dashboard & monitoring · 2 Visual customisation · 3 Productivity & automation · 4 Custom commands ·
5 Safety & guarding · 6 Inspection & audit · 7 Tool control · 8 Context & sessions · 9 Code review & changes ·
10 Integrations & external services · 11 Team & corporate flows · 12 Native feature customisation ·
13 Data storage & lookup · 14 Other (describe).
Several can apply. Load the matching blocks from `quiz-by-category.md`.

### B. Behaviour (ask when the request involves an action, not just a view)
- Only watch what happens? → observe hooks, no `.catch`.
- Change data before it continues? → rewrite via `next({ ...e, … })`.
- Block or replace an operation? → answer without `next`; guard with fail-closed `.catch`.
- Add a capability? → command, tool, pane.
- Do something after an event? → `await next(e)` then act.
- Wrap an operation and look at the result? → `await next(e)`, inspect, return it (or withhold with `{ deny }`).
- Let the user decide? → hold with `$.ui.ask`, or a pane with buttons.

### C. Interface (ask when anything is shown)
Options to offer: band above the prompt · side pane · `/command` reply · restyle an existing element
(spinner, tool row, message…) · status line / toast / log line · no UI (behaviour only) · a combination.
If a pane: which information, which actions, how it updates (on event / timer / button).
Do not push a dashboard onto a mod that does not need one.

### D. State
Session only? History? Survives reload? Survives `/clear`? Across sessions? Shared across sessions?
External source? → see `state-and-persistence.md` for the mapping.

### E. Permissions and risk
Which of: read files · write files · run processes · network · read the session · intercept tool calls ·
approve/deny · sensitive data. For each "yes": explain the consequence in one sentence and confirm the need.
Drop any capability without a functional reason.

### F. Audience and delivery level
Personal · team · public · corporate (managed policy). Prototype · working · complete with tests · ready to
distribute. Lower levels cut scope, never code quality: a prototype still validates and has tests for what it does.

## Defaults when the user leaves it to you
| Field | Default |
|---|---|
| Surface | terminal + desktop; text fallback elsewhere |
| Rich info | pane opened by a command, also opened unasked from `session.start` (seats from 144 cols) |
| One-line info | band with a hide button |
| State | `$.state` for UI; `$.store` only for what the user expects next session |
| Guard style | hold and ask (`$.ui.ask`), with a `block` option in `userConfig` |
| Model calls | none; if needed, `haiku`, on a button/command, `maxTokens` ≤ 512, `timeoutMs` 15000 |
| Timer | none; if needed ≥ 15 s for network, ≥ 2 s for local files |
| Delivery | complete with tests, local folder marketplace |

## Round templates
**Round 1 (almost always):**
1. "What should this help you with?" (only if the request does not say). Options from `idea-catalog.md`
   closest to the request, e.g. "Show how this session is going (context, turns, tools) (Recommended)" ·
   "Stop or ask before risky commands" · "A /command that does a job for me" · "Something else".
   Round-1 option sets must fit the request: a logging mod asks "where should the log go" (file / pane /
   transcript lines / debug log), not "where should it show".
2. "Where should it show?" — band / side pane / when I type a command / no screen, just behaviour.
   Skip it when the request already names the place ("a dashboard", "a panel", "a pane", "a band above the
   prompt", "a /command"): ask instead **what it shows** (which data, which actions), with options drawn from
   the real data sources for that category.
3. "Should it only watch, or also change or block things?" (only if behaviour is implied)

**Round 2 (as needed):** the category block's top questions + persistence.
**Round 3 (risky mods):** section E for each capability + what to do when the user does not answer.
