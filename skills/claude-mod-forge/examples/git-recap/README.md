# git-recap

[Leia em português](README.pt-BR.md)

**A command that lists your recent Git commits, instantly and without spending any of Claude's time.**

## What is a mod?
Claude Code is Anthropic's assistant for working with code, in the terminal or in the Claude desktop app. A **mod** is a small add-on for it: it can add a panel, a bar above the box where you type, a new `/command`, or a rule that checks what Claude is about to do. This folder is one complete mod you can install and use as it is, or copy as a starting point.

## What it does
Git keeps a record of every saved change in a project; each saved change is a commit. When you come back to a project you often want to know "what did I do yesterday?". This mod adds a command that answers that right away, by reading Git directly. Claude is not asked, so it costs nothing and does not add to the conversation.

## What you see
- A short list of commits: the short code of each commit, its date and its message. If there are none in that period, a line saying so.

## How to use it
1. Open Claude Code inside a project that uses Git.
2. Type `/recap` for the last day, or `/recap 7` for the last 7 days.

## Keyboard shortcuts
None of its own.

## Commands
| Type | What it does |
|---|---|
| `/recap` | Commits from the last day |
| `/recap 7` | Commits from the last 7 days (any number from 1 to 30) |

## Good to know
- Git must be installed and the folder must be a Git repository.
- Merge commits are left out, so the list shows the actual work.
- Anything other than a number from 1 to 30 gets a short message explaining how to use it.

## Install
You need Claude Code 2.1.287 or newer in the terminal, or 2.1.286 or newer in the desktop app.

1. Copy this folder anywhere on your computer.
2. Inside the copy, rename the folder `_claude-plugin` to `.claude-plugin` (with a dot at the start). It ships without the dot so the examples never load by accident.
3. Start Claude Code with the mod:

```bash
claude --plugin-dir path/to/git-recap
```

To keep it installed for good, ask the `claude-mod-forge` skill to package it ("package this mod").

## Check it
From the skill folder (`skills/claude-mod-forge`), this runs the manifest check, a strict type check and the 6 automated tests of this mod:

```bash
node scripts/check-mod.mjs examples/git-recap
```

The tests cover the mod's logic and what it draws in the terminal and the desktop app. How it looks in your own window is worth a quick look in a real session.

For developers: [the examples table](../README.md) lists the hooks and API calls this mod demonstrates.
