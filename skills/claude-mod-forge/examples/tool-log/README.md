# tool-log

[Leia em português](README.pt-BR.md)

**Keeps a written record, in a folder you pick, of every tool Claude used, with secrets hidden.**

## What is a mod?
Claude Code is Anthropic's assistant for working with code, in the terminal or in the Claude desktop app. A **mod** is a small add-on for it: it can add a panel, a bar above the box where you type, a new `/command`, or a rule that checks what Claude is about to do. This folder is one complete mod you can install and use as it is, or copy as a starting point.

## What it does
Sometimes you want to know afterwards what exactly Claude did: which commands it ran, which files it touched. This mod writes one line per tool call to a file, one file per session. Each line says which tool, when, and a short summary of what it was asked. Things that look like passwords or tokens are replaced with `***` before anything is written.

## What you see
- Nothing on screen. The record goes to files named after the session, ending in `.jsonl` (one line of data per tool call).

## How to use it
1. In the settings, pick a **Log folder**. Choose one outside your projects, so the logs never end up in Git by accident.
2. Use Claude normally. Open the folder to read the files with any text editor.
3. To pause it without uninstalling, turn off **Enabled**.

## Keyboard shortcuts
None of its own.

## Commands
None. It works on its own.

## Settings
Claude Code asks for these when you enable the mod. To change them later, open `/config` and find the mod by name.

| Setting | What it means | Default |
|---|---|---|
| `logDir` (Log folder) | Folder for the log files. Pick one outside your projects. | (empty) |
| `enabled` (Enabled) | Turn the mod off without uninstalling it. | `true` |

## Good to know
- Each summary is cut at 300 characters. File contents and tool results are never written.
- When a file reaches 2 MB, a new one starts (`-part1`, `-part2`…). An existing file is never overwritten.
- Hiding secrets is a best effort: it catches the common forms, not every possible one. Keep the folder private.
- If writing fails, Claude keeps working normally; the log never blocks your session.

## Install
You need Claude Code 2.1.287 or newer in the terminal, or 2.1.286 or newer in the desktop app.

1. Copy this folder anywhere on your computer.
2. Inside the copy, rename the folder `_claude-plugin` to `.claude-plugin` (with a dot at the start). It ships without the dot so the examples never load by accident.
3. Start Claude Code with the mod:

```bash
claude --plugin-dir path/to/tool-log
```

To keep it installed for good, ask the `claude-mod-forge` skill to package it ("package this mod").

## Check it
From the skill folder (`skills/claude-mod-forge`), this runs the manifest check, a strict type check and the 16 automated tests of this mod:

```bash
node scripts/check-mod.mjs examples/tool-log
```

The tests cover the mod's logic and what it draws in the terminal and the desktop app. How it looks in your own window is worth a quick look in a real session.

For developers: [the examples table](../README.md) lists the hooks and API calls this mod demonstrates.
