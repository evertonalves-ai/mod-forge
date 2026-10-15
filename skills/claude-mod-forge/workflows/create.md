# Workflow: create a new mod

## 1. Ground truth
Version, `plugin-authoring`, `.d.ts` path (SKILL.md §0). Check the working directory for an existing mod first:
a `.claude-plugin/plugin.json` with `hooks/hooks.json` means this is improve/continue, not create.

## 2. Interview
`references/discovery-and-quiz.md` round 1 (problem, where it shows, observe vs change). Add round 2/3 only for
what is still unknown. Pull the category questions from `references/quiz-by-category.md`.
Map every answer to a spec field; when a field can be filled by looking (repo, docs, `.d.ts`), look instead of asking.

## 3. Spec
- Small = one hook **or** one render site, no persistence (`$.store`, files), and no capability from the matrix
  in `references/security-review.md`: a 5-line plan in chat, then build. Anything with a pane + a command +
  state (atoms or store) is not small: it gets the full `templates/project-spec.md`.
- Medium/large, or anything that blocks, approves, rewrites prompts, runs processes, calls the network or a model:
  fill `templates/project-spec.md` and show it. Ask for confirmation only for decisions that change safety,
  native behaviour or project structure; otherwise go on and list the assumptions.

## 4. Choose the architecture
| Need | Use |
|---|---|
| Show something persistent and rich | `Pane` (+ command to open it) |
| One line of always-visible status | `AbovePrompt` band, or `$.ui.status` if no interaction |
| A transient notice | `$.ui.toast` / `$.ui.log` |
| Change something Claude Code already draws | `ui.render` on that site with `next({ ...e, props })` |
| Act on demand | `$.command.register` + `command.run` (`immediate: true` if it must run mid-turn) |
| Give Claude a capability | `$.tool.register` + `tool.call` on `mcp__<plugin>__<name>` |
| Stop / hold / rewrite a tool call | `tool.call` guard (+ `$.ui.ask` to hold) — or `tool.check` for allow/ask/deny decisions |
| Change what is sent | `prompt.submit` (`text`, `context`, `drop`) |
| Periodic work | `$.clock.every` started in `session.start` |
| Summarise / classify | `$.model.complete` (or `$.model.fork` for the conversation) — only on a user action |

Keep pure logic (rules, parsing, formatting) in its own file with no `$`, so tests cover it directly.

## 5. Build
1. Copy the nearest `examples/<name>` to `<dev-mods>/<mod-name>/`, rename `_claude-plugin` → `.claude-plugin`.
2. Rename every occurrence of the example's name (manifest, `types/index.d.ts`, `atom` refs, pane ids, tests).
   Mod names: lowercase kebab-case, not starting with `claude-` (validation refuses it).
3. Write `hooks/register.ts(x)`, `types/index.d.ts` (if `$.state`), `tests/*.test.ts(x)`.
4. Write `MOD-SPEC.md` (from the spec) and `DECISIONS.md` (one line per non-obvious choice) in the mod folder.
5. Write `README.md`: what it does, how to load, commands/hotkeys, options, capabilities used, tested version.

## 6. Verify
`node scripts/check-mod.mjs <mod>` until green. Then `workflows/test.md` for the session-level checks.
Run `workflows/audit.md` when the mod uses any capability listed in the capability matrix of
`references/security-review.md` (its "Capability (validate line)" column; match it against the validate output).

## 7. Deliver
Hot reload loads it when the turn ends (if the user enabled it). Then copy it to the user's projects folder and
offer `workflows/package.md`. Final message: SKILL.md §5.
