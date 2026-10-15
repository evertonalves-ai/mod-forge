# context-chart

[Leia em português](README.pt-BR.md)

**A chart of how full Claude's memory of the conversation got, turn by turn.**

## What is a mod?
Claude Code is Anthropic's assistant for working with code, in the terminal or in the Claude desktop app. A **mod** is a small add-on for it: it can add a panel, a bar above the box where you type, a new `/command`, or a rule that checks what Claude is about to do. This folder is one complete mod you can install and use as it is, or copy as a starting point.

## What it does
Claude can only keep a limited amount of text in mind at once (the context window). The context-band mod shows the current number; this one shows the whole story as a chart, so you can see which turns made it grow fast, for example a large file being read.

## What you see
- In the desktop app: a line chart, one point per turn, with dashed lines at 50% and 90%.
- In the terminal: the same data as rows of text bars.
- Before Claude's first answer: a line saying the chart starts after it.

## How to use it
1. Type `/context-chart` and press Enter. The panel opens.
2. Keep working; a new point appears after each of Claude's answers.
3. Press `Esc` to close.

## Keyboard shortcuts
| Key | What it does |
|---|---|
| `Esc` | Close the panel |

## Commands
| Type | What it does |
|---|---|
| `/context-chart` | Open the chart |

## Settings
Claude Code asks for these when you enable the mod. To change them later, open `/config` and find the mod by name.

| Setting | What it means | Default |
|---|---|---|
| `language` (Language) | Language of the text the mod shows: `en` (English) or `pt-BR` (Brazilian Portuguese). | `en` |

## Good to know
- The chart only gets new data when Claude Code reports it, after each answer; it does not poll in the background.

## Install
You need Claude Code 2.1.287 or newer in the terminal, or 2.1.286 or newer in the desktop app.

1. Copy this folder anywhere on your computer.
2. Inside the copy, rename the folder `_claude-plugin` to `.claude-plugin` (with a dot at the start). It ships without the dot so the examples never load by accident.
3. Start Claude Code with the mod:

```bash
claude --plugin-dir path/to/context-chart
```

To keep it installed for good, ask the `claude-mod-forge` skill to package it ("package this mod").

## Check it
From the skill folder (`skills/claude-mod-forge`), this runs the manifest check, a strict type check and the 5 automated tests of this mod:

```bash
node scripts/check-mod.mjs examples/context-chart
```

The tests cover the mod's logic and what it draws in the terminal and the desktop app. How it looks in your own window is worth a quick look in a real session.

For developers: [the examples table](../README.md) lists the hooks and API calls this mod demonstrates.
