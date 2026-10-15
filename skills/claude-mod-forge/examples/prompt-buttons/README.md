# prompt-buttons

[Leia em português](README.pt-BR.md)

**A panel of buttons you create, each one sending a request you use often to Claude with a single key.**

## What is a mod?
Claude Code is Anthropic's assistant for working with code, in the terminal or in the Claude desktop app. A **mod** is a small add-on for it: it can add a panel, a bar above the box where you type, a new `/command`, or a rule that checks what Claude is about to do. This folder is one complete mod you can install and use as it is, or copy as a starting point.

## What it does
Some requests you type again and again: "run the tests and fix what fails", "review the last change", "write the commit message". This mod lets you save each one as a button with a short name. Pressing the button (or its number) sends the full request to Claude, as if you had typed it. Your buttons are kept for the next sessions.

## What you see
- A panel titled "Prompt buttons" with your buttons numbered 1 to 9, each with a `×` to delete it.
- A status line: "● ready", or "◌ Claude is working · new presses queue".
- Two fields at the bottom to create a button: **Label** (the name) and **Instruction** (the text it sends).

## How to use it
1. Type `/buttons` and press Enter. The panel opens.
2. In **Label**, write a short name (for example "Run tests and fix") and press Enter.
3. In **Instruction**, write the full request and press Enter. The button appears with a number.
4. Press that number to send the request. If Claude is busy, it waits in line and goes as soon as Claude finishes.
5. Outside the panel, `/buttons 2` sends button 2 directly.

## Keyboard shortcuts
| Key | What it does |
|---|---|
| `1` to `9` | Send that button's request |
| `×` | Delete that button |
| `Tab` | Move between buttons and fields |
| `Enter` | Go to the next field, or create the button |

## Commands
| Type | What it does |
|---|---|
| `/buttons` | Open the panel (or list the buttons where no panel can be drawn) |
| `/buttons 2` | Send button 2 right away |

## Settings
Claude Code asks for these when you enable the mod. To change them later, open `/config` and find the mod by name.

| Setting | What it means | Default |
|---|---|---|
| `language` (Language) | Language of the text the mod shows: `en` (English) or `pt-BR` (Brazilian Portuguese). | `en` |

## Good to know
- Up to 9 buttons, one per number key. Names up to 40 characters, instructions up to 2000.
- Buttons can be created in the terminal and in the desktop app.

## Install
You need Claude Code 2.1.287 or newer in the terminal, or 2.1.286 or newer in the desktop app.

1. Copy this folder anywhere on your computer.
2. Inside the copy, rename the folder `_claude-plugin` to `.claude-plugin` (with a dot at the start). It ships without the dot so the examples never load by accident.
3. Start Claude Code with the mod:

```bash
claude --plugin-dir path/to/prompt-buttons
```

To keep it installed for good, ask the `claude-mod-forge` skill to package it ("package this mod").

## Check it
From the skill folder (`skills/claude-mod-forge`), this runs the manifest check, a strict type check and the 7 automated tests of this mod:

```bash
node scripts/check-mod.mjs examples/prompt-buttons
```

The tests cover the mod's logic and what it draws in the terminal and the desktop app. How it looks in your own window is worth a quick look in a real session.

For developers: [the examples table](../README.md) lists the hooks and API calls this mod demonstrates.
