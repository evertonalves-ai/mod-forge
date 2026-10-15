# context-band

[Leia em português](README.pt-BR.md)

**A thin bar above the box where you type that shows how full Claude's memory of the conversation is.**

## What is a mod?
Claude Code is Anthropic's assistant for working with code, in the terminal or in the Claude desktop app. A **mod** is a small add-on for it: it can add a panel, a bar above the box where you type, a new `/command`, or a rule that checks what Claude is about to do. This folder is one complete mod you can install and use as it is, or copy as a starting point.

## What it does
Claude can only keep a limited amount of text in mind at once. That limit is called the context window. When it fills up, Claude Code compacts the conversation (it summarizes older parts to make room), and some detail can be lost. This mod shows, all the time, how much of that space is in use, so you know when it is a good moment to start a fresh conversation or wrap up a task.

## What you see
- A line above the prompt with the percentage in use, the amount of text in tokens (a token is roughly a short word or a piece of a word), how much the last turn added, and a word that sums it up:
- "roomy" (green, under 50%), "filling" (yellow, 50 to 74%), "tight" (yellow, 75 to 89%), "compact soon" (red, 90% or more).
- A "hide" button at the end of the line.

## How to use it
1. Install the mod. The bar appears on its own after Claude's first answer.
2. To hide it, press the "hide" button at the end of the bar.
3. To show it again, type `/context-band`.

## Keyboard shortcuts
| Key | What it does |
|---|---|
| `Tab` then `Enter` | Reach the "hide" button and press it |

## Commands
| Type | What it does |
|---|---|
| `/context-band` | Show the bar again, or hide it if it is showing |

## Settings
Claude Code asks for these when you enable the mod. To change them later, open `/config` and find the mod by name.

| Setting | What it means | Default |
|---|---|---|
| `language` (Language) | Language of the text the mod shows: `en` (English) or `pt-BR` (Brazilian Portuguese). | `en` |

## Good to know
- Before the first answer there is no number to show yet, so the bar says it is waiting.
- On narrow windows the bar shortens its text so it fits on one line.

## Install
You need Claude Code 2.1.287 or newer in the terminal, or 2.1.286 or newer in the desktop app.

1. Copy this folder anywhere on your computer.
2. Inside the copy, rename the folder `_claude-plugin` to `.claude-plugin` (with a dot at the start). It ships without the dot so the examples never load by accident.
3. Start Claude Code with the mod:

```bash
claude --plugin-dir path/to/context-band
```

To keep it installed for good, ask the `claude-mod-forge` skill to package it ("package this mod").

## Check it
From the skill folder (`skills/claude-mod-forge`), this runs the manifest check, a strict type check and the 4 automated tests of this mod:

```bash
node scripts/check-mod.mjs examples/context-band
```

The tests cover the mod's logic and what it draws in the terminal and the desktop app. How it looks in your own window is worth a quick look in a real session.

For developers: [the examples table](../README.md) lists the hooks and API calls this mod demonstrates.
