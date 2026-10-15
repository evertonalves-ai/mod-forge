# session-dashboard

[Leia em português](README.pt-BR.md)

**A dashboard panel that shows what Claude has been doing in this session, plus notes that stay with you.**

## What is a mod?
Claude Code is Anthropic's assistant for working with code, in the terminal or in the Claude desktop app. A **mod** is a small add-on for it: it can add a panel, a bar above the box where you type, a new `/command`, or a rule that checks what Claude is about to do. This folder is one complete mod you can install and use as it is, or copy as a starting point.

## What it does
While Claude works it calls tools: it reads files, edits them, runs commands. Normally that scrolls past and is gone. This mod opens a panel with a summary you can look at any time: how many tools Claude used, how many failed, how many turns (one question and its answer is one turn) and how long they took. It also has a small notepad whose notes are still there the next time you open Claude Code.

## What you see
- **Top line**: the panel title and whether Claude is working right now ("◌ 2 running") or waiting ("● idle").
- **Overview tab**: four cards (Tool calls, Errors, Turns, Avg turn), a small chart of how long each turn took, and the tools Claude used most.
- **Activity tab**: the list of recent tool calls, newest first, with a filter to show only one tool (for example only `Bash`).
- **Notes tab**: a field to write a note and the list of saved notes.

## How to use it
1. Type `/dashboard` and press Enter. The panel opens.
2. Press `1`, `2` or `3` to switch tabs.
3. In the Notes tab, type a note and press Enter to save it. Use `×` next to a note to delete it.
4. Press `Esc` to go back to typing your prompt. The panel keeps updating while Claude works.

## Keyboard shortcuts
| Key | What it does |
|---|---|
| `1` `2` `3` | Overview, Activity, Notes tab |
| `Tab` | Move between buttons and fields |
| `c` | Clear the activity list (Activity tab) |
| `Enter` | Save the note you typed (Notes tab) |
| `Esc` | Leave the panel and go back to the prompt |

## Commands
| Type | What it does |
|---|---|
| `/dashboard` | Open the panel |

## Settings
Claude Code asks for these when you enable the mod. To change them later, open `/config` and find the mod by name.

| Setting | What it means | Default |
|---|---|---|
| `language` (Language) | Language of the text the mod shows: `en` (English) or `pt-BR` (Brazilian Portuguese). | `en` |

## Good to know
- Counts start at zero in each new session. Notes are the only thing kept between sessions.
- Running `/clear` starts the counts again, the same as a new session.

## Install
You need Claude Code 2.1.287 or newer in the terminal, or 2.1.286 or newer in the desktop app.

1. Copy this folder anywhere on your computer.
2. Inside the copy, rename the folder `_claude-plugin` to `.claude-plugin` (with a dot at the start). It ships without the dot so the examples never load by accident.
3. Start Claude Code with the mod:

```bash
claude --plugin-dir path/to/session-dashboard
```

To keep it installed for good, ask the `claude-mod-forge` skill to package it ("package this mod").

## Check it
From the skill folder (`skills/claude-mod-forge`), this runs the manifest check, a strict type check and the 7 automated tests of this mod:

```bash
node scripts/check-mod.mjs examples/session-dashboard
```

The tests cover the mod's logic and what it draws in the terminal and the desktop app. How it looks in your own window is worth a quick look in a real session.

For developers: [the examples table](../README.md) lists the hooks and API calls this mod demonstrates.
