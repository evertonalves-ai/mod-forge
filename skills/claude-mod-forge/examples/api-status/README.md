# api-status

[Leia em português](README.pt-BR.md)

**A bar above the prompt with one live value from a web service you choose, such as the status of a deploy.**

## What is a mod?
Claude Code is Anthropic's assistant for working with code, in the terminal or in the Claude desktop app. A **mod** is a small add-on for it: it can add a panel, a bar above the box where you type, a new `/command`, or a rule that checks what Claude is about to do. This folder is one complete mod you can install and use as it is, or copy as a starting point.

## What it does
Many services publish their status as data on a web address (an API). For example, a deploy service may answer `{"status": "ok"}`. This mod reads one value from that address and keeps it in sight above the prompt, so you do not have to open a browser to check. If the service needs a password-like token, the mod keeps it in Claude Code's secure storage.

## What you see
- A line above the prompt with the value and the time it was read: "API: ok at 14:32".
- While reading: "◌ loading…". If the service cannot be reached: "✗ unavailable", followed by the last value that worked.
- Two buttons: "refresh" and "hide".

## How to use it
1. Open the settings (`/config`, then the api-status entry).
2. In **Status URL**, paste the address. It must start with `https://` (`http://` is accepted only for your own computer, `localhost`).
3. In **JSON field**, write which value to show. For `{"data": {"deploy": {"state": "ok"}}}` you would write `data.deploy.state`.
4. If the service needs a token, paste it in **API token**. It is stored securely and never shown.
5. To refresh on its own, set **Refresh every** to 15 seconds or more. With 0 it refreshes only when you ask.

## Keyboard shortcuts
| Key | What it does |
|---|---|
| `r` | Refresh now |
| `Tab` then `Enter` | Reach the "hide" button and press it |

## Commands
| Type | What it does |
|---|---|
| `/api-status` | Refresh and show the value as text (also brings the bar back if it was hidden) |

## Settings
Claude Code asks for these when you enable the mod. To change them later, open `/config` and find the mod by name.

| Setting | What it means | Default |
|---|---|---|
| `url` (Status URL) | The address to read. Must start with `https://` (`http://` only for `localhost`). | (empty) |
| `field` (JSON field) | Which value of the answer to show, as a dotted path, like `status` or `data.deploy.state`. | `status` |
| `token` (API token) | Optional token sent to the service. Kept in secure storage, never shown. | (secure storage) |
| `refreshSeconds` (Refresh every (seconds)) | Refresh on its own every N seconds (15 or more). `0` means only when you ask. | `0` |
| `language` (Language) | Language of the text the mod shows: `en` (English) or `pt-BR` (Brazilian Portuguese). | `en` |

## Good to know
- Never put a password or token inside the URL; the mod refuses it and asks you to use the token field.
- If the URL is missing or wrong, the bar says exactly what to fix.
- The minimum automatic interval is 15 seconds, so the service is not flooded with requests.

## Install
You need Claude Code 2.1.287 or newer in the terminal, or 2.1.286 or newer in the desktop app.

1. Copy this folder anywhere on your computer.
2. Inside the copy, rename the folder `_claude-plugin` to `.claude-plugin` (with a dot at the start). It ships without the dot so the examples never load by accident.
3. Start Claude Code with the mod:

```bash
claude --plugin-dir path/to/api-status
```

To keep it installed for good, ask the `claude-mod-forge` skill to package it ("package this mod").

## Check it
From the skill folder (`skills/claude-mod-forge`), this runs the manifest check, a strict type check and the 9 automated tests of this mod:

```bash
node scripts/check-mod.mjs examples/api-status
```

The tests cover the mod's logic and what it draws in the terminal and the desktop app. How it looks in your own window is worth a quick look in a real session.

For developers: [the examples table](../README.md) lists the hooks and API calls this mod demonstrates.
