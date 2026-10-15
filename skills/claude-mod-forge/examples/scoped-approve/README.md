# scoped-approve

[Leia em português](README.pt-BR.md)

**Lets a short list of commands you trust run without the permission question, and nothing else.**

## What is a mod?
Claude Code is Anthropic's assistant for working with code, in the terminal or in the Claude desktop app. A **mod** is a small add-on for it: it can add a panel, a bar above the box where you type, a new `/command`, or a rule that checks what Claude is about to do. This folder is one complete mod you can install and use as it is, or copy as a starting point.

## What it does
By default Claude Code asks before running a command. That is safe, but answering "yes" to `npm test` for the tenth time gets old. This mod lets you write a list of commands that may run without asking. Anything not on the list gets the normal question, exactly as before.

## What you see
- When a command runs because it is on your list, a faint line in the conversation says so: `auto-approved by allow-list entry "npm test *": npm test -- --watch`.
- `/approvals` shows your list and what was approved in this session.

## How to use it
1. In the settings, write the commands you trust in **Allowed commands**, separated by commas. Example: `git status, npm test *`.
2. An entry matches only that exact command. Add a space and `*` at the end to also accept anything after it: `npm test *` allows `npm test` and `npm test -- --watch`.
3. Type `/approvals` to check what is on the list.
4. To pause it without uninstalling, turn off **Enabled**.

## Keyboard shortcuts
None of its own.

## Commands
| Type | What it does |
|---|---|
| `/approvals` | Show the list and the approvals of this session |

## Settings
Claude Code asks for these when you enable the mod. To change them later, open `/config` and find the mod by name.

| Setting | What it means | Default |
|---|---|---|
| `allowList` (Allowed commands) | Commands that may run without asking, separated by commas. End one with a space and `*` to accept arguments. | (empty) |
| `enabled` (Enabled) | Turn the mod off without uninstalling it. | `true` |

## Good to know
- Commands joined with `;`, `&&`, `|`, redirections or `$( )` are never approved automatically, even if they start with an allowed command.
- It never overrides a "deny" from your own permission rules and never approves for subagents (helper agents Claude starts).
- Every entry is a command Claude may run without asking you. Keep the list short and exact.

## Install
You need Claude Code 2.1.287 or newer in the terminal, or 2.1.286 or newer in the desktop app.

1. Copy this folder anywhere on your computer.
2. Inside the copy, rename the folder `_claude-plugin` to `.claude-plugin` (with a dot at the start). It ships without the dot so the examples never load by accident.
3. Start Claude Code with the mod:

```bash
claude --plugin-dir path/to/scoped-approve
```

To keep it installed for good, ask the `claude-mod-forge` skill to package it ("package this mod").

## Check it
From the skill folder (`skills/claude-mod-forge`), this runs the manifest check, a strict type check and the 8 automated tests of this mod:

```bash
node scripts/check-mod.mjs examples/scoped-approve
```

The tests cover the mod's logic and what it draws in the terminal and the desktop app. How it looks in your own window is worth a quick look in a real session.

For developers: [the examples table](../README.md) lists the hooks and API calls this mod demonstrates.
