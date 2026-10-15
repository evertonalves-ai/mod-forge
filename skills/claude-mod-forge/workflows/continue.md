# Workflow: continue an existing mod

Never restart the interview. Rebuild the context from files.

1. Find the mod: the path the user gives, the conversation, the working directory, `~/.claude/dev-mods/*/`,
   or the user's projects folder (look for `.claude-plugin/plugin.json` + `hooks/hooks.json`).
2. Read, in order: `MOD-SPEC.md`, `DECISIONS.md`, `README.md`, `plugin.json`, `hooks/hooks.json`, the hooks
   module, `types/index.d.ts`, the tests, and `git log --oneline -15` if it is a repository.
3. Run `node scripts/check-mod.mjs <mod>` to get the current state (what passes, what fails).
4. Tell the user in 3–5 lines: what the mod does today, what the spec still lists as open, what the last
   change was, and what fails now. Then propose the next step.
5. Ask only what the files cannot answer. Continue in improve or debug mode.
6. If no spec exists, write `MOD-SPEC.md` from what the code does (mark it "reconstructed") before changing anything.
