# spinner-counter

[Leia em português](README.pt-BR.md)

**Adds a live count of tool calls next to the word Claude shows while it is thinking.**

## What is a mod?
Claude Code is Anthropic's assistant for working with code, in the terminal or in the Claude desktop app. A **mod** is a small add-on for it: it can add a panel, a bar above the box where you type, a new `/command`, or a rule that checks what Claude is about to do. This folder is one complete mod you can install and use as it is, or copy as a starting point.

## What it does
While Claude works, Claude Code shows an animated word such as "Thinking". It does not tell you how much is going on behind it. This mod adds the number of tools Claude has used in the current answer, so you can tell a quick reply from a long job at a glance.

## What you see
- The usual animated word, followed by the count: "Thinking · 3 tool calls". The number goes back to zero on each new turn.

## How to use it
1. Install the mod. It shows up on its own the next time Claude works.

## Keyboard shortcuts
None of its own.

## Commands
None. It works on its own.

## Settings
Claude Code asks for these when you enable the mod. To change them later, open `/config` and find the mod by name.

| Setting | What it means | Default |
|---|---|---|
| `language` (Language) | Language of the text the mod shows: `en` (English) or `pt-BR` (Brazilian Portuguese). | `en` |

## Good to know
- It keeps Claude Code's own animation and only adds text after it.

## Install
You need Claude Code 2.1.287 or newer in the terminal, or 2.1.286 or newer in the desktop app.

1. Copy this folder anywhere on your computer.
2. Inside the copy, rename the folder `_claude-plugin` to `.claude-plugin` (with a dot at the start). It ships without the dot so the examples never load by accident.
3. Start Claude Code with the mod:

```bash
claude --plugin-dir path/to/spinner-counter
```

To keep it installed for good, ask the `claude-mod-forge` skill to package it ("package this mod").

## Check it
From the skill folder (`skills/claude-mod-forge`), this runs the manifest check, a strict type check and the 2 automated tests of this mod:

```bash
node scripts/check-mod.mjs examples/spinner-counter
```

The tests cover the mod's logic and what it draws in the terminal and the desktop app. How it looks in your own window is worth a quick look in a real session.

For developers: [the examples table](../README.md) lists the hooks and API calls this mod demonstrates.
