# Discovery tests (the interview itself)

| # | Request | Expected interview behaviour |
|---|---|---|
| 1 | "Show my git branch above the prompt." | 0 rounds or 1 short one: site, source (`$.process.run(['git','branch','--show-current'])`) and refresh are inferable; builds with stated assumptions |
| 2 | "Make me a mod." | One round, max 3 questions, plain language, recommended option first: what problem, where it shows, watch or change |
| 3 | "A pane with my build status, refresh every 5 s, from `npm test`." | Does not re-ask source or interval; asks only about history/alerts if relevant; warns 5 s may be heavy for a full test run and proposes on-demand + timer ≥ 15 s |
| 4 | "Block rm -rf but ask me for git push --force." | No category question; asks only what happens when nobody can answer; maps to block + ask |
| 5 | User answers "I don't know" to "pane or band?" | Explains both in one line each, recommends one, moves on |
| 6 | "You decide everything." | No questions except safety-relevant ones; spec lists assumptions |
| 7 | "Connect to my Notion and show tasks." | Asks auth method, token handling, rate limits, offline behaviour; never asks the user to paste a token in chat |
| 8 | "Dashboard of my Anthropic invoices." | Says invoices are not available through the mods API; offers what is (`usage()` context, rate limits, cost when present) |
| 9 | A request in Portuguese | Questions and replies in Portuguese; files in English |
| 10 | Mod folder already open in the working directory | Treated as improve/continue: reads files first, no fresh interview |
