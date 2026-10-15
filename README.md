# claude-mod-forge

[![check](https://github.com/evertonalves-ai/mod-forge/actions/workflows/check.yml/badge.svg)](https://github.com/evertonalves-ai/mod-forge/actions/workflows/check.yml)

[Leia em português](README.pt-BR.md)

**Describe, in plain words, the add-on you want for Claude Code. This skill asks what it needs to know, writes
the code, tests it and hands it over ready to install.**

## First, the terms

- **Claude Code** is Anthropic's assistant for working with code. It runs in the terminal and in the Claude
  desktop app: you say what you want and it reads files, edits them and runs commands.
- A **mod** is a small add-on for Claude Code. It can open a panel, show a bar above the box where you type, add
  a command such as `/recap`, restyle parts of Claude Code itself, or check what Claude is about to do and hold
  back anything risky. See the [official mods docs](https://code.claude.com/docs/en/plugins/mods/overview).
- A **skill** is a set of instructions that teaches Claude to do one kind of job well. This skill teaches Claude
  to build mods.

Writing a mod from scratch means learning the mods API, its events, its screen components and its test kit.
With this skill you only describe what you want.

## An example from start to finish

1. You write: "ask me before any force push".
2. The skill sees it is a guard. Guards touch safety, so it asks one short round of questions, each with a
   recommended answer. For example: "if the question cannot be shown, should the command be refused?
   (recommended: yes)".
3. It writes the spec, the code and the tests.
4. It runs three checks: the plugin manifest, a strict type check, and the automated tests.
5. It hands over the mod with install steps and says plainly what was tested and what is worth a look on
   screen.

## What you can ask for

| You say | Mode | The skill |
|---|---|---|
| "Make a mod that…" | create | interviews you, writes spec, code and tests, checks them, hands over |
| "Plan a mod for…, don't code yet" | plan | only the spec, test plan and security review |
| "My mod's pane doesn't show up" | debug | finds the cause with the validator and the log, fixes it, proves it with a test |
| "Add a filter to my dashboard mod" | improve | pins the current behavior with tests before changing anything |
| "Is this mod safe to install?" | audit | reviews what the mod can reach: files, processes, network, secrets |
| "Test my mod" | test | runs the checks and says what still needs a real session |
| "Share this mod with my team" | package | prepares the package, the marketplace and install steps |
| "Continue the mod from yesterday" | continue | reads the spec and decisions saved in the mod folder and picks up there |

You don't need the mode names. The skill picks one from what you wrote.

## How the interview works

The skill fills a spec (`templates/project-spec.md`) from your request first and asks only what is missing: at
most three questions per round, in your language, each with a recommended option. Typical: no round for a small,
clear request, one or two for a pane, one more for anything that blocks, approves, runs programs, uses the
network or handles secrets. When you don't know an answer it explains the options; when you say "you decide" it
picks sensible defaults and writes each one down.

## What it enforces

- Every event, method and prop is checked against your build's `claude-code.d.ts` before use.
- Numbers on screen come from a real API source. Billing or quota data is never invented.
- Every button, tab and field does something and has a test.
- Guards fail closed: on an error, the operation does not run. Requests to auto-approve or weaken protections
  get the risk explained and a narrower option first.
- No secrets in code, tests or logs. Options and tokens go through `userConfig` (`"sensitive": true`).
- Verification is reported by level: static checks, unit tests, real session. A level that did not run is
  never claimed.

## The 13 example mods

They ship with the skill, ready to use or copy. Each has its own README (English and Portuguese) with what it
does, what you see, shortcuts and how to install it.

| Mod | In one line |
|---|---|
| [session-dashboard](skills/claude-mod-forge/examples/session-dashboard/README.md) | A panel with what Claude did this session, plus notes that are kept |
| [context-band](skills/claude-mod-forge/examples/context-band/README.md) | A bar above the prompt with how full Claude's memory of the conversation is |
| [context-chart](skills/claude-mod-forge/examples/context-chart/README.md) | A chart of that memory use, turn by turn |
| [shell-guard](skills/claude-mod-forge/examples/shell-guard/README.md) | Holds dangerous commands until you say yes and protects files with passwords and keys |
| [scoped-approve](skills/claude-mod-forge/examples/scoped-approve/README.md) | Lets a short list of trusted commands run without asking |
| [git-recap](skills/claude-mod-forge/examples/git-recap/README.md) | `/recap` lists your recent commits instantly, without using Claude |
| [spinner-counter](skills/claude-mod-forge/examples/spinner-counter/README.md) | Shows how many tools Claude used while it is thinking |
| [api-status](skills/claude-mod-forge/examples/api-status/README.md) | A bar with one live value from a web service, such as a deploy status |
| [tool-log](skills/claude-mod-forge/examples/tool-log/README.md) | A file record of every tool call, with secrets hidden |
| [prompt-buttons](skills/claude-mod-forge/examples/prompt-buttons/README.md) | Your own buttons that send requests you repeat, with one key |
| [agent-board](skills/claude-mod-forge/examples/agent-board/README.md) | A live board of the session's helper agents and their status |
| [agent-dialogue](skills/claude-mod-forge/examples/agent-dialogue/README.md) | The conversation between two reviewing agents, live |
| [ideia](skills/claude-mod-forge/examples/ideia/README.md) | Two thinkers with different points of view refine your idea by dialogue; you steer, it writes the plan |

All pass the three checks (110 tests in total). Those with on-screen text have a `language` option: English by
default, or `pt-BR`. The [examples table](skills/claude-mod-forge/examples/README.md) lists the hooks and API
calls each one demonstrates.

## Install

You need Claude Code 2.1.287 or newer in the terminal, or 2.1.286 or newer in the desktop app. Tested with
2.1.294. Mods are on by default in those versions.

**As a plugin** (simplest). Inside Claude Code, type one command at a time:
```
/plugin marketplace add evertonalves-ai/mod-forge
/plugin install mod-forge@mod-forge
```
When asked for a scope, "user" makes the skill available in all your projects.

The plugin is named **`mod-forge`** because `claude plugin validate` refuses plugin names that start with
`claude-`. The skill inside it is `claude-mod-forge`.

**As a personal skill**, from a clone:
```bash
git clone https://github.com/evertonalves-ai/mod-forge.git
# macOS / Linux
ln -s "$PWD/mod-forge/skills/claude-mod-forge" ~/.claude/skills/claude-mod-forge
# Windows (PowerShell); a junction needs no admin rights
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-mod-forge" -Target "$PWD\mod-forge\skills\claude-mod-forge"
```

## Use

Open Claude Code and describe what you want, your own way: "make a mod that shows my build status in a pane".
The skill starts on its own when the request is about mods, panes, dashboards, bars above the prompt, guards for
tool calls, custom `/commands`, or fixing a mod. As a plugin skill you can also call it by name
(`/mod-forge:claude-mod-forge`).

## Checking a mod yourself

With Node.js installed:
```bash
node skills/claude-mod-forge/scripts/check-mod.mjs path/to/my-mod
```
It copies the mod to a temp folder (nothing is written into yours), then runs `claude plugin validate`, `tsc` in
strict mode against your build's declarations, and `claude plugin test`.

## Layout
```
.claude-plugin/          plugin.json (mod-forge) · marketplace.json
skills/claude-mod-forge/
  SKILL.md               entry point: ground truth, mode router, hard rules
  workflows/             create · plan · continue · debug · improve · audit · test · package
  references/            official docs map, interview, category quizzes, API, events, UI + design system,
                         state, security, testing, distribution, surfaces, idea catalog
  templates/             project spec · requirements · test plan · security review · release checklist
  examples/              13 reference mods, 110 kit tests, a README per mod (en + pt-BR)
  scripts/check-mod.mjs  validate + strict tsc + claude plugin test, in one run
  scripts/say.mjs        shared dialogue file for a two-agent review round (shown by agent-dialogue)
  tests/                 acceptance (A–J), discovery and regression definitions + RESULTS.md
```

## Limits

- Kit tests prove hook logic and the trees a mod draws per surface, not how a terminal paints them. Look at new
  layouts in a real session (`claude --plugin-dir <mod>`).
- The mods API is young and changes between releases. The skill trusts your build's `.d.ts` over its own notes.
- Only the terminal and the desktop app draw mod UI. VS Code, `claude -p`, SDK and cloud sessions run the hooks
  without drawing.

## Security and contributing

- Found a security problem? See [SECURITY.md](SECURITY.md).
- Want to fix something or propose an example mod? See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. The reference mods are original work. Official docs and samples are linked, not copied. This is a
community project, not made or endorsed by Anthropic.
