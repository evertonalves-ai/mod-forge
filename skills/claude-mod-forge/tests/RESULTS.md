# Test results — v0.1.0 (2026-10-14)

Environment: Windows 10, Claude Code CLI 2.1.294, mods API types 2.1.293, Node 24, TypeScript 5.6.3 (npx).

## 1. Reference mods (structural + types + kit), after the fixes below
| Example | validate | strict tsc | `claude plugin test` |
|---|---|---|---|
| session-dashboard | pass | pass | 4/4 |
| context-band | pass | pass | 3/3 |
| shell-guard | pass | pass | 8/8 |
| git-recap | pass | pass | 6/6 |
| spinner-counter | pass | pass | 1/1 |
| plugin `mod-forge` manifest + marketplace | pass | — | — |

Kit tests mount drawings on the `terminal` and `desktop` surfaces. **Not run:** painting in a real terminal or
Desktop app session, and anything in a real VS Code session.

## 2. Acceptance cases A–J
Method: five local subagents (two cases each) read only the skill (not this `tests/` folder), followed it in
plan-only mode with no installs and no writes, and returned their interview and spec. Each was graded against
`acceptance-tests.md`. Constraint of the method: the agents could not load `plugin-authoring` or use
AskUserQuestion, so they wrote the questions out and assumed the recommended answers.

| Case | Result | Evidence from the run |
|---|---|---|
| A context dashboard | pass 5/5 | source `$.session.usage().context`, found `session.measure` and `usage({breakdown})` in the types, refresh on events, `/clear` reset declared, empty state instead of 0%, started from context-band + session-dashboard |
| B dangerous commands | pass 5/5 | asked which commands and what happens with nobody to answer, ask/block/off, fail-closed `.catch`, "reminder layer, not a sandbox", deny text with next step |
| C above the prompt | pass 4/4 | separated band / spinner / notice and asked which, real source, `bodyColumns`, terminal+desktop only |
| D log tool calls | pass 4/4 | fields chosen, JSONL file + rolling + manual cleanup, redaction before writing, observer with no `.catch` |
| E panel of buttons | pass 4/4 | asked what each button does, no invented buttons, `asUser` only with a yes, text path `/tasks n`; chose prompts, so no `$.process.run` was needed |
| F improve | pass 4/4 | baseline with the checker, kept every message and export, 6→12 tests planned, 0.1.0→0.2.0 |
| G terminal + VS Code | pass 3/3 | split behaviour vs drawing, text path as the guaranteed route, kit tests on vscode too |
| H external API | pass 4/4 | asked auth/data/refresh, token as sensitive `userConfig`, host only from config, offline state, no retry loop |
| I approve everything | pass 4/4 | asked the goal, explained the risk, refused a broad allow, proposed an exact allow-list that only turns `ask` into `allow` |
| J continue | pass 3/3 | read MOD-SPEC/DECISIONS/code/tests, ran the checker, status + next step, one interview round only for what files did not say |

## 3. Defects found by the run, and what changed
| Found in | Defect | Fix |
|---|---|---|
| B | `shell-guard` guarded only `Bash`; on Windows the `PowerShell` tool (and `Monitor`) run commands too | guard matches `['Bash','PowerShell','Monitor']`, PowerShell/cmd patterns, `off` mode, 2 new tests |
| B (follow-up) | secret-file regex accepted only `/`, so `C:\repo\.env` passed the guard | both separators; test added |
| C | `context-band` "hide" had no way back | `/context-band` toggles it; test added; rule "hide needs a way back" |
| C | `$.ui.status` position not stated | "above/below the prompt" map in ui-components |
| G | references said VS Code never draws; the 2.1.293 types declare a `vscode` surface and raise `Pane` there | `surfaces.md` rewritten with both sources and a "text path always" rule |
| A | `session.measure` and `usage({ breakdown })` missing | added to mods-api and the dashboard quiz |
| A | built-in command names (`/context`) not warned | added |
| H | `$.http.fetch` limits presented as if from the types | labelled as docs-sourced |
| I | "guards fail closed" would make an approver deny everything on a bug | approvers fall back to the native verdict; allow only on `ask`; `allow` cannot dismiss person-only tools |
| I/H | userConfig format unverified (agent proposed `string[]`) | verified with validate: types `string number boolean directory file`, `title` required, no arrays |
| D | `$.fs` has no append/delete; no home-dir API | documented with the log default |
| E | no guidance for user-pressed buttons, busy state, hotkey cap | added |
| F/J | regression list lived in `tests/`; no rule for intended assertion changes; edit-in-place vs copy unclear; spec vs decisions conflict | `references/regression-checklist.md`, improve/continue notes, SKILL.md §0.5 |
| all | version mismatch CLI vs types; routing overlap create vs plan | SKILL.md §0.4 and routing rows |

The acceptance run was done once, before these fixes. The fixes were checked with the reference-mod
regression (section 1), not by re-running the ten agents.

## 4. Reproduce
```bash
for m in session-dashboard context-band shell-guard git-recap spinner-counter; do node scripts/check-mod.mjs examples/$m || exit 1; done
claude plugin validate ../..
```
