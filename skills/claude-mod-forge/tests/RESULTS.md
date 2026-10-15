# Test results — v0.1.0 (2026-10-14), examples updated in v0.2.0 (2026-10-15)

Environment: Windows 10, Claude Code CLI 2.1.294, mods API types 2.1.293, Node 24, TypeScript 5.9.3 (npx; 5.6.3 before the round-1 review fixes).

## 1. Reference mods (structural + types + kit), after the fixes below
| Example | validate | strict tsc | `claude plugin test` |
|---|---|---|---|
| session-dashboard | pass | pass | 7/7 |
| context-band | pass | pass | 4/4 |
| shell-guard | pass | pass | 16/16 |
| git-recap | pass | pass | 6/6 |
| spinner-counter | pass | pass | 2/2 |
| scoped-approve (0.2.0) | pass | pass | 8/8 |
| api-status (0.2.0) | pass | pass | 9/9 |
| tool-log (0.2.0) | pass | pass | 16/16 |
| prompt-buttons (0.2.0) | pass | pass | 7/7 |
| context-chart (0.2.0) | pass | pass | 5/5 |
| agent-board (new) | pass | pass | 4/4 |
| agent-dialogue (new) | pass | pass | 5/5 |
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
| I approve everything | pass 4/4 | asked the goal, explained the risk, refused a broad allow, proposed an exact allow-list that only turns `ask` into `allow` (the example now matches exactly; an entry accepts arguments only with a trailing ` *`) |
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
for d in examples/*/; do m=$(basename $d); node scripts/check-mod.mjs examples/$m || exit 1; done
claude plugin validate ../..
```

## 5. Critic / builder rounds (v0.3.0, 2026-10-15)
Two local agents reviewed the skill: "critic" (read-only) and "builder" (edits), talking through a shared log
shown live by the agent-dialogue mod. Round 1: critic filed 10 findings with evidence. Builder applied 9 and
part of 1, each with a test that fails on the previous code. Round 2: critic re-ran its reproductions on scratch
copies, verified 9 and reopened 1 (low). The orchestrator closed the reopened item and the critic's minor notes:
a pure, tested fail-closed answer for the shell-guard .catch; quote-glued rm flags and quoted +refspecs;
redaction no longer hides non-secrets (monkey:, tokenizer:, https://keycloak:8443, -u 1000:1000).

| Finding | Severity | Result |
|---|---|---|
| write-containment helper bypassable (symlinked parent, sibling prefix) | high | fixed (d.ts placed() pattern) |
| tool-log could overwrite part1 after reload/resume | high | fixed, test fails on old code |
| checker ignored claude-code-tools in laid-out types | high | fixed (whole folder; TypeScript 5.9.3) |
| checker broke on Windows paths with spaces; silent ENOENT | high | fixed |
| scoped-approve "exact" list accepted any arguments | medium | fixed: exact by default, trailing " *" opts in |
| api-status awaited a network call in session.start | medium | fixed + rule in mods-api.md |
| tool-log redaction leaks (curl -u, X-Api-Key, mysql -p, docker -p, AKIA) | medium | fixed, one test each |
| tool-log rolled by characters, limits are bytes | medium | fixed (TextEncoder, stat size) |
| shell-guard fail-closed untested; rm/refspec spellings | medium | fixed (reopened once, closed by orchestrator) |
| docs: surface tables, dead reference, store expiry claim | low | fixed |

Totals after the rounds: 10/10 examples green, 69 kit tests.

After round 3 (agent-board and agent-dialogue added as examples 11-12, `language` option en/pt-BR on the eight
examples with visible text, `scripts/say.mjs`): 12/12 examples green, 85 kit tests.

## 6. Acceptance re-run on v0.4.0 (2026-10-15)
Method as in section 2: five local subagents (two cases each) read only the skill, followed it in plan-only
mode with no installs and no writes, and were graded against `acceptance-tests.md`.

Result: **10/10 cases passed (A–J).** Notes from the run, applied in v0.5.0:
- `.catch` semantics: `next(e)` after `next` was already called returns that call's result and does not run the
  tool again; approvers cover every command tool (Bash, PowerShell) and `e.ceiling` is noted (cap unverified).
- `$.http.fetch` limits labelled as docs-sourced wherever they appear.
- A "no mod needed" path: native permission rules and modes first, settings changed only with an explicit yes.
- Buttons: more than 9 actions → second tab, `Select` or navigation; `$.prompt.submit` without `asUser` is not
  acting as the user, `asUser` needs a yes.
- The terminal / VS Code split is stated before interview round 1; no "where should it show" when the request
  already names the place.
- Built-in tool input types exist only after the first load; re-run the checker then.
- continue/improve: undated spec loses to a dated decision, "untouched example" defined, README created if missing;
  validate's "gating hook without .catch" is expected for observers and self-answering commands.
- create: "small" defined (one hook or site, no persistence, no matrix capability).
- `shell-guard` gained the en/pt-BR language option (question, options, toast; deny reasons stay English).
- CI: `.github/workflows/check.yml` runs validate and the kit tests of every example on push and pull request;
  strict tsc there is non-blocking because the public types file is from an older build (see the workflow).

Totals after v0.5.0: 12/12 examples green, 89 kit tests (table in section 1).
