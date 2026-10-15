# claude-mod-forge

[Resumo em português](README.pt-BR.md)

A Claude Code skill that builds [mods](https://code.claude.com/docs/en/plugins/mods/overview) from a description.
You say what you want ("a pane with my build status", "ask me before any force push", "show context use above
the prompt"), answer a short interview, and get a mod with code, tests, docs and install steps. The skill checks
everything it can check before it hands the mod over.

It also debugs, improves, audits, tests and packages mods you already have, and picks up a mod where an earlier
session left it.

Packaged as the plugin **`mod-forge`** (`claude plugin validate` refuses plugin names that start with `claude-`).
The skill inside it is `claude-mod-forge`.

## Requirements
- Claude Code **2.1.287+** in the terminal or **2.1.286+** in the Desktop app (mods are on by default).
  Tested with 2.1.294.
- Node.js (only for `scripts/check-mod.mjs`; `tsc` is fetched with `npx` on first use).

## Install

As a plugin, from this repository (at a Claude Code prompt in a terminal):
```
/plugin install mod-forge@evertonalves-ai/claude-mod-forge
```
Accept the marketplace when asked, then pick a scope (user is the usual choice). The repository is private, so
your GitHub account needs access to it.

Or as a personal skill, from a clone:
```bash
git clone https://github.com/evertonalves-ai/claude-mod-forge.git
# macOS / Linux
ln -s "$PWD/claude-mod-forge/skills/claude-mod-forge" ~/.claude/skills/claude-mod-forge
# Windows (PowerShell), a junction needs no admin rights
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-mod-forge" -Target "$PWD\claude-mod-forge\skills\claude-mod-forge"
```

## Use
Describe what you want in a Claude Code session. The skill triggers on requests about mods, panes, dashboards,
bands above the prompt, guards for tool calls, custom `/commands`, or fixing a mod. As a plugin skill you can also call it by name
(`/mod-forge:claude-mod-forge`).

| You say | Mode |
|---|---|
| "Make a mod that…" | create |
| "Plan a mod for…, don't code yet" | plan |
| "My mod's pane doesn't show up" | debug |
| "Add a filter to my dashboard mod" | improve |
| "Is this mod safe to install?" | audit |
| "Test my mod" | test |
| "Share this mod with my team" | package |
| "Continue the mod from yesterday" | continue |

### How the interview works
The skill fills a spec (`templates/project-spec.md`) from your request first and asks only what is missing:
at most three questions per round, in your language, with a recommended option. Typical: no round for a small,
clear request, one or two for a pane, a third for anything that blocks, approves, runs processes, uses the
network or handles secrets. When you don't know an answer it explains the options and recommends one; when you
say "you decide" it picks defaults and writes them down as assumptions.

## What it enforces
- Every event, method and prop is checked against your build's `claude-code.d.ts` before use.
- Numbers on screen come from a real API source. Billing or quota data is never invented.
- Every button, tab and field does something and has a test.
- Guards fail closed. Requests to auto-approve or weaken protections get the risk explained first.
- No secrets in code, tests or logs. Options and tokens go through `userConfig` (`"sensitive": true`).
- Verification is reported by level: static checks, unit tests, real session. A level that did not run is
  never claimed.

## Layout
```
.claude-plugin/          plugin.json (mod-forge) · marketplace.json
skills/claude-mod-forge/
  SKILL.md               entry point: ground truth, mode router, hard rules
  workflows/             create · plan · continue · debug · improve · audit · test · package
  references/            official docs map, interview, category quizzes, API, events, UI + design system,
                         state, security, testing, distribution, surfaces
  templates/             project spec · requirements · test plan · security review · release checklist
  examples/              5 reference mods (validated, type-checked, tested)
  scripts/check-mod.mjs  validate + strict tsc + claude plugin test, in one run
  tests/                 acceptance (A–J), discovery and regression definitions + RESULTS.md
```

## Checking a mod yourself
```bash
node skills/claude-mod-forge/scripts/check-mod.mjs path/to/my-mod
```
It copies the mod to a temp folder (nothing is written into yours), then runs `claude plugin validate`,
`tsc` in strict mode against your build's declarations, and `claude plugin test`.

## Limits
- Kit tests prove hook logic and the trees a mod draws per surface, not how a terminal paints them. Look at new
  layouts in a real session (`claude --plugin-dir <mod>`).
- The mods API is young and changes between releases. The skill trusts your build's `.d.ts` over its own notes.
- Only the terminal and the Desktop app draw mod UI. VS Code, `claude -p`, SDK and cloud sessions run the hooks
  without drawing.

## License
MIT. The reference mods are original work. Official docs and samples are linked, not copied.
