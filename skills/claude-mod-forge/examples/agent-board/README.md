# agent-board

[Leia em português](README.pt-BR.md)

**A panel listing the helper agents Claude started in this session and what each one is doing.**

## What is a mod?
Claude Code is Anthropic's assistant for working with code, in the terminal or in the Claude desktop app. A **mod** is a small add-on for it: it can add a panel, a bar above the box where you type, a new `/command`, or a rule that checks what Claude is about to do. This folder is one complete mod you can install and use as it is, or copy as a starting point.

## What it does
For bigger tasks Claude can start helper agents (subagents) that work in parallel: one researches, another writes code, another reviews. Normally you only see their final reports. This mod shows a live board with every helper, its role and its status, so you know who is still working.

## What you see
- A panel titled "Agents" with one row per helper: name, role and status (starting, working, waiting, idle, completed, failed, stopped).
- A summary at the top ("◌ 2 working" or "● all idle") and the time of the last update.

## How to use it
1. Type `/agents` and press Enter. The panel opens.
2. Leave it open while Claude works; it updates every 2 seconds.
3. Press `Esc` to go back to the prompt.

## Keyboard shortcuts
| Key | What it does |
|---|---|
| `Esc` | Leave the panel |

## Commands
| Type | What it does |
|---|---|
| `/agents` | Open the board |

## Settings
Claude Code asks for these when you enable the mod. To change them later, open `/config` and find the mod by name.

| Setting | What it means | Default |
|---|---|---|
| `language` (Language) | Language of the text the mod shows: `en` (English) or `pt-BR` (Brazilian Portuguese). | `en` |

## Good to know
- If Claude has not started any helper, the panel says so.
- It pairs well with agent-dialogue, which shows what the helpers are saying to each other.

## Install
You need Claude Code 2.1.287 or newer in the terminal, or 2.1.286 or newer in the desktop app.

1. Copy this folder anywhere on your computer.
2. Inside the copy, rename the folder `_claude-plugin` to `.claude-plugin` (with a dot at the start). It ships without the dot so the examples never load by accident.
3. Start Claude Code with the mod:

```bash
claude --plugin-dir path/to/agent-board
```

To keep it installed for good, ask the `claude-mod-forge` skill to package it ("package this mod").

## Check it
From the skill folder (`skills/claude-mod-forge`), this runs the manifest check, a strict type check and the 4 automated tests of this mod:

```bash
node scripts/check-mod.mjs examples/agent-board
```

The tests cover the mod's logic and what it draws in the terminal and the desktop app. How it looks in your own window is worth a quick look in a real session.

For developers: [the examples table](../README.md) lists the hooks and API calls this mod demonstrates.
