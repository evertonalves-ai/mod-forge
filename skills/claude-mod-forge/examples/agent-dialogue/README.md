# agent-dialogue

[Leia em português](README.pt-BR.md)

**A panel that shows, live, the conversation between helper agents that write to a shared file.**

## What is a mod?
Claude Code is Anthropic's assistant for working with code, in the terminal or in the Claude desktop app. A **mod** is a small add-on for it: it can add a panel, a bar above the box where you type, a new `/command`, or a rule that checks what Claude is about to do. This folder is one complete mod you can install and use as it is, or copy as a starting point.

## What it does
A useful way to review work is to have two helper agents talk: a critic that finds problems and a builder that fixes them. They can leave messages for each other in a shared file using the small script `scripts/say.mjs` that comes with the skill. This mod shows that conversation as it grows, with a color per author and a filter, so you can follow the review without opening the file.

## What you see
- A panel titled "Agent dialogue" with the messages in order: who wrote, to whom, what kind of message (finding, fix, question, answer, verified, reopened, note) and the text.
- A **Show** selector to see everyone or only one author.
- If the file is not set yet, a line explaining how to set it.

## How to use it
1. In the settings, set **file** to the path of the conversation file (for example `review.jsonl` in a folder of your choice).
2. Ask Claude to run a review with a critic and a builder that post with `scripts/say.mjs` to that file. Each post looks like `node say.mjs --file review.jsonl critic builder finding "The login has no rate limit"`.
3. Type `/dialogue` and press Enter to watch. It updates every 2 seconds.
4. Use **Show** to filter by author; press `Esc` to go back to the prompt.

## Keyboard shortcuts
| Key | What it does |
|---|---|
| `Tab` | Reach the Show selector |
| Arrow keys and `Enter` | Pick an author in Show |
| `Esc` | Leave the panel |

## Commands
| Type | What it does |
|---|---|
| `/dialogue` | Open the conversation |

## Settings
Claude Code asks for these when you enable the mod. To change them later, open `/config` and find the mod by name.

| Setting | What it means | Default |
|---|---|---|
| `file` (Dialogue file) | Path of the conversation file the agents write to. | (empty) |
| `language` (Language) | Language of the text the mod shows: `en` (English) or `pt-BR` (Brazilian Portuguese). | `en` |

## Good to know
- Lines in the file that are broken or incomplete are skipped, not shown as errors.
- There is no default file on purpose: you choose where the conversation lives.
- Use it with agent-board (`/agents`) to see who is working while you read what they say.

## Install
You need Claude Code 2.1.287 or newer in the terminal, or 2.1.286 or newer in the desktop app.

1. Copy this folder anywhere on your computer.
2. Inside the copy, rename the folder `_claude-plugin` to `.claude-plugin` (with a dot at the start). It ships without the dot so the examples never load by accident.
3. Start Claude Code with the mod:

```bash
claude --plugin-dir path/to/agent-dialogue
```

To keep it installed for good, ask the `claude-mod-forge` skill to package it ("package this mod").

## Check it
From the skill folder (`skills/claude-mod-forge`), this runs the manifest check, a strict type check and the 5 automated tests of this mod:

```bash
node scripts/check-mod.mjs examples/agent-dialogue
```

The tests cover the mod's logic and what it draws in the terminal and the desktop app. How it looks in your own window is worth a quick look in a real session.

For developers: [the examples table](../README.md) lists the hooks and API calls this mod demonstrates.
