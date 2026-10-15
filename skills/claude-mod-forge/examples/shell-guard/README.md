# shell-guard

[Leia em português](README.pt-BR.md)

**A safety net that stops dangerous commands until you say yes, and keeps Claude away from files that hold passwords and keys.**

## What is a mod?
Claude Code is Anthropic's assistant for working with code, in the terminal or in the Claude desktop app. A **mod** is a small add-on for it: it can add a panel, a bar above the box where you type, a new `/command`, or a rule that checks what Claude is about to do. This folder is one complete mod you can install and use as it is, or copy as a starting point.

## What it does
Claude can run commands on your computer. Most are harmless, but a few can delete a folder for good, throw away work that was not saved in Git, or rewrite history that other people share. This mod watches every command before it runs. When it sees one of those risky patterns it pauses and asks you, in plain words, what the command would do. It also refuses any edit to files that usually hold secrets, such as `.env` files and private keys.

## What you see
- When a risky command comes up: a question with the reason ("force push (rewrites shared history). Run this command?"), the full command, and two choices, **Run it** and **Refuse**.
- In block mode: a short notice ("Blocked: force push") instead of the question.

## How to use it
1. Install the mod. It works on its own; there is nothing to open.
2. When the question appears, read the command and choose **Run it** or **Refuse**.
3. If you would rather never be asked, set the mode to `block` (always refuse) in the settings.

### What counts as risky
- Deleting folders with force (`rm -rf`, `Remove-Item -Recurse -Force`, `rd /s`)
- Force push in Git (`git push --force`, `-f`, `+branch`)
- `git reset --hard` and `git clean -f` (throw away unsaved or untracked work)
- Database commands that drop or empty tables (`DROP TABLE`, `TRUNCATE`)
- Changing permissions of many files at once (`chmod -R`, `chown -R`)
- Formatting a disk (`mkfs`, `format`, `Format-Volume`, `Clear-Disk`)

### Files it protects from edits
`.env` and `.env.something`, `id_rsa`, `id_ed25519`, files ending in `.pem`, `.key`, `.p12`, `.pfx`, and `credentials` / `credentials.json`.

## Keyboard shortcuts
| Key | What it does |
|---|---|
| Arrow keys and `Enter` | Choose Run it or Refuse in the question |

## Commands
None. It works on its own.

## Settings
Claude Code asks for these when you enable the mod. To change them later, open `/config` and find the mod by name.

| Setting | What it means | Default |
|---|---|---|
| `mode` (Risky command mode) | `ask`: pause and ask you. `block`: always refuse. `off`: guard turned off. | `ask` |
| `language` (Language) | Language of the text the mod shows: `en` (English) or `pt-BR` (Brazilian Portuguese). | `en` |

## Good to know
- If the question cannot be shown for some reason, the command is refused. When in doubt, it says no.
- It checks the shell, PowerShell and Monitor tools, on Windows, macOS and Linux.
- It is a safety net, not a lock. It recognizes common ways of writing these commands; an unusual spelling can slip through. Keep your normal Claude Code permission settings as well.
- Mode `off` turns everything off, including the protection of secret files.

## Install
You need Claude Code 2.1.287 or newer in the terminal, or 2.1.286 or newer in the desktop app.

1. Copy this folder anywhere on your computer.
2. Inside the copy, rename the folder `_claude-plugin` to `.claude-plugin` (with a dot at the start). It ships without the dot so the examples never load by accident.
3. Start Claude Code with the mod:

```bash
claude --plugin-dir path/to/shell-guard
```

To keep it installed for good, ask the `claude-mod-forge` skill to package it ("package this mod").

## Check it
From the skill folder (`skills/claude-mod-forge`), this runs the manifest check, a strict type check and the 16 automated tests of this mod:

```bash
node scripts/check-mod.mjs examples/shell-guard
```

The tests cover the mod's logic and what it draws in the terminal and the desktop app. How it looks in your own window is worth a quick look in a real session.

For developers: [the examples table](../README.md) lists the hooks and API calls this mod demonstrates.
