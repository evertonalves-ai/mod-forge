# ideia

[Leia em português](README.pt-BR.md)

**Two thinkers with different points of view talk your idea through, round by round, and hand you a finished plan.**

## What is a mod?
Claude Code is Anthropic's assistant for working with code, in the terminal or in the Claude desktop app. A **mod** is a small add-on for it: it can add a panel, a bar above the box where you type, a new `/command`, or a rule that checks what Claude is about to do. This folder is one complete mod you can install and use as it is, or copy as a starting point.

## What it does
You type a raw idea, such as "an app to track monthly spending". Two thinkers, A and B, discuss it. Each one looks at it from a different angle and works with a different method: one may think about the person who will use it and the other about how to build it; one may open up possibilities while the other cuts down to what matters. They talk in rounds, disagree when they have a reason, and build on each other. You read along, add comments whenever you like, and steer. At the end, A writes one document with the refined idea and B checks that it matches what was said. If the idea is something that could live inside Claude Code, the panel offers to build it as a mod.

## What you see
- **Top line**: the round ("round 2 of 4"), the pair in use ("Open × Narrow"), who is thinking right now, and the tokens used so far (a token is roughly a short word; it is what the model charges by).
- **Choosing the pair**: the suggested pair and why, with buttons to accept it, pick another or write your own.
- **The conversation**: each message with who wrote it (A or B and their point of view) and your comments marked "You".
- **End of each round**: a 3 to 5 line summary: decided, open, dropped.
- **At the end**: where the document was saved and, when it fits, the button to build it as a mod.

## How to use it
1. In the settings, choose the **folder** where conversations are saved (see Settings below).
2. Type `/ideia` followed by your idea, for example `/ideia an app to track monthly spending`. Or type just `/ideia` and write the idea in the panel.
3. The panel suggests a pair of points of view and says why. Press `a` to accept, `p` to choose from the list, or `e` to write your own pair, such as `investor × customer`.
4. Watch the round: A opens, B responds, A replies. To steer, type in **Comment** and press Enter; both thinkers read it before the next message.
5. At the end of the round, read the summary and press `n` for the next round, `p` to change the pair for the next round, or `f` to finish.
6. When it ends (round limit reached, both thinkers agree nothing is left, or you pressed `f`), open `ideia.md` in the folder shown.

### The pairs of points of view
| Pair | Lines of thought and methods (A × B) | Good for |
|---|---|---|
| User × Engineering | user journey, "job to be done" × first principles, technical limits | apps, tools, mods |
| Open × Narrow | SCAMPER, analogies, "what if" × MoSCoW (must, should, could, will not), scope cuts | raw ideas |
| Advocate × Devil's advocate | value proposition × pre-mortem ("it failed: why?"), risks | testing a formed idea |
| Visionary × Feet on the ground | the ideal picture in a year × what fits in 30 days | plans and roadmaps |
| Audience × Creator | hook and retention × clarity, what can be produced weekly | videos, channels, content |
| Customer × Business | what someone would pay for × cost, price, channel, competition | paid products and services |

You can also write your own pair (`e`), such as "investor × customer"; then each side picks its own method and says which.

### What gets saved
Each conversation gets its own subfolder, named with the date and the first words of the idea (for example `2026-10-15-an-app-to-track-monthly-spending`). Inside: `dialogue.jsonl`, the whole conversation, one line per message, and `ideia.md`, the final document, with these sections: the idea in one sentence, what went in (each decision, why, and who brought it), what was left out, risks and open questions, first steps, and how the conversation went.

## Keyboard shortcuts
| Key | What it does |
|---|---|
| `a` | Accept the suggested pair |
| `p` | Choose a pair from the list (at the start, or for the next round) |
| `e` | Write your own pair |
| `s` | Pause after the current message, or resume |
| `n` | Next round (at a round end); new idea (at the end) |
| `f` | Finish now and write the document with what exists |
| `t` | Try again after an error |
| `r` | Resume a conversation that stopped |
| `m` | Build the idea as a mod (when offered) |
| `Tab` | Move between buttons and fields |
| `Esc` | Back to the prompt; the conversation keeps going |

## Commands
| Type | What it does |
|---|---|
| `/ideia an app to…` | Start a conversation about that idea |
| `/ideia` | Open the panel: show the current conversation, offer to resume one that stopped, or ask for a new idea |

## Settings
Claude Code asks for these when you enable the mod. To change them later, open `/config` and find the mod by name.

| Setting | What it means | Default |
|---|---|---|
| `folder` (Conversations folder) | Folder where each conversation gets its own subfolder. Required: the panel asks for it until it is set. | (empty) |
| `rounds` (Round limit) | Most rounds per conversation, 1 to 8. Each round is three messages. | `4` |
| `pause` (Pause after each round) | Stop at the end of each round to show the summary and wait for you. Off: rounds run back to back. | `true` |
| `model` (Thinkers' model) | The model the two thinkers use: `sonnet` (balanced), `opus` (deepest, costs more), `haiku` (fastest, cheapest). | `sonnet` |
| `obsidian` (Obsidian format) | Add frontmatter (date, description, tags) to the final document, for an Obsidian vault. | `false` |
| `language` (Language) | Language of the text the mod shows: `en` (English) or `pt-BR` (Brazilian Portuguese). | `en` |

## Good to know
- The thinkers only think: they have no tools, so they cannot read your files, change anything or run commands. The mod alone writes, and only those two files inside your folder.
- Each message is a call to the model, and every call re-reads the conversation, so longer conversations cost more. The round limit (4 by default, 8 at most) and the token count on screen keep it in sight.
- They work only from your idea, the conversation and your comments. They do not search the web.
- If you close Claude Code in the middle, `/ideia` next time offers to resume where it stopped.
- With **Obsidian format** on, the document gets frontmatter (date, description, tags), so it drops straight into a vault. Point the folder at, for example, your vault's `thinking/` folder.
- The "build it as a mod" button sends Claude a request to use the claude-mod-forge skill with the document. Nothing is sent until you press it.
- One conversation per session. Typing `/ideia` again shows the one in progress.

## Install
You need Claude Code 2.1.287 or newer in the terminal, or 2.1.286 or newer in the desktop app.

1. Copy this folder anywhere on your computer.
2. Inside the copy, rename the folder `_claude-plugin` to `.claude-plugin` (with a dot at the start). It ships without the dot so the examples never load by accident.
3. Start Claude Code with the mod:

```bash
claude --plugin-dir path/to/ideia
```

To keep it installed for good, ask the `claude-mod-forge` skill to package it ("package this mod").

## Check it
From the skill folder (`skills/claude-mod-forge`), this runs the manifest check, a strict type check and the 21 automated tests of this mod:

```bash
node scripts/check-mod.mjs examples/ideia
```

The tests cover the mod's logic and what it draws in the terminal and the desktop app. How it looks in your own window is worth a quick look in a real session.

For developers: [the examples table](../README.md) lists the hooks and API calls this mod demonstrates.
