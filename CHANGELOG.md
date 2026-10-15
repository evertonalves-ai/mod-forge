# Changelog

## 0.5.0 — 2026-10-15
- First real-session check (desktop app): the session-dashboard capture exposed three bugs the kit tests missed;
  fixed with tests: tool totals capped at 300, calls stuck "running" after an interruption, bars wrapping.
- Acceptance re-run on v0.4.0: 10/10 cases (A–J) passed; their notes applied (no-mod-needed path, buttons and
  asUser, VS Code split before round 1, tool types before first load, continue/improve clarifications,
  docs-sourced http limits, .catch replay semantics, approvers over every command tool).
- shell-guard gains the en/pt-BR language option (deny reasons stay English).
- CI: .github/workflows/check.yml runs validate + kit tests on every example without a Claude login; strict tsc
  is informational until the public types file catches up with the build.
- 12/12 examples green, 89 kit tests.

## 0.4.0 — 2026-10-15
- Two new reference mods (12 in total, 85 kit tests): `agent-board` (/agents: live status of this session's
  agents) and `agent-dialogue` (/dialogue: a conversation agents write to a shared JSONL file).
- `scripts/say.mjs`: posts to and reads that dialogue (`--file` or `MOD_DIALOGUE_FILE`); audit.md describes a
  critic + builder review round watched live with the two mods.
- Language option (`en` default, `pt-BR`) in the 8 examples with on-screen text, through a pure `hooks/i18n.ts`;
  pattern documented in ui-components.md. Commands, keys and text Claude reads stay unchanged.

## 0.3.0 — 2026-10-15
- Two-agent review (critic + builder, see tests/RESULTS.md §5): 10 findings, all closed; 69 kit tests (was 51).
- Security: the write-containment recipe now follows the d.ts placed() pattern (no symlinked-parent or
  sibling-prefix escape). scoped-approve is exact by default; " *" opts an entry into arguments.
- Data safety: tool-log never overwrites an existing part, rolls by bytes, redacts more secret forms and no
  longer hides non-secrets.
- Checker: includes the whole laid-out types folder, TypeScript 5.9.3, Windows paths with spaces, reports a
  missing claude/npx, always cleans its temp folder.
- api-status no longer delays the first prompt; mods-api.md: no awaited network/process work in session.start.
- shell-guard: fail-closed answer tested, more rm/force-push spellings, Monitor covered by a test.

## 0.2.0 — 2026-10-15
- Five new reference mods (10 in total, 51 kit tests, all passing validate + strict tsc + `claude plugin test`):
  `scoped-approve` (tool.check approver), `api-status` (http + sensitive token), `tool-log` (fs JSONL logging),
  `prompt-buttons` (user buttons + `$.prompt.submit`), `context-chart` (session.measure + Svg on desktop).
- Fixed a wrong recommendation: `'Input' in ui` / `'Svg' in ui` only narrow types; at run time every surface's
  element table lists every element. The skill and the examples now pick optional elements by `e.surface`.
- New verified rules: `$.prompt.submit` is refused inside a `command.run` hook (schedule it with
  `$.clock.after(0, …)`); `$.fs` paths reach stubs in the platform's absolute form; one stub per event per test.

## 0.1.0 — 2026-10-14
- First version of the `claude-mod-forge` skill, packaged as the `mod-forge` plugin.
- Modes: create, plan, continue, debug, improve, audit, test, package.
- Adaptive interview (A–F tree) and question banks for 14 categories.
- Five reference mods, each passing `claude plugin validate`, strict `tsc` and `claude plugin test` (22 tests):
  session-dashboard, context-band, shell-guard, git-recap, spinner-counter.
- Acceptance cases A–J run with local agents; 10/10 passed; 15 defects they surfaced fixed (see
  `skills/claude-mod-forge/tests/RESULTS.md`), including PowerShell/Monitor coverage and Windows paths in the guard.
- Idea catalog built from community lists (awesome-claude-code-mods, aitmpl / claude-code-templates).
- `scripts/check-mod.mjs`: validate + tsc + tests in one run, without writing into the mod.
- Acceptance (A–J), discovery and regression test definitions.
- Tested with Claude Code 2.1.294 (mods API types 2.1.293).
