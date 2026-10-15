# Release checklist: <mod-name> v<version>

- [ ] `node scripts/check-mod.mjs <mod>`: validate ✔, tsc ✔, tests ✔ (paste the summary)
- [ ] Level 4 checks in TEST-PLAN.md done or listed as not done
- [ ] Security review filled for every capability (`SECURITY.md`) and no open high findings
- [ ] Name not starting with `claude-`; `version` bumped; `description`, `author`, `license` set
- [ ] `types` present if `$.state` is used; `userConfig` documented; secrets marked `sensitive`
- [ ] No secrets, personal paths, emails or tokens in any file (`grep -rniE "token|secret|password|api[_-]?key|C:\\\\Users|/home/" .`)
- [ ] README: what it does, UI sample, install line, commands/hotkeys, options, capabilities, tested version and surfaces, limits
- [ ] CHANGELOG entry
- [ ] Marketplace file lists the mod; `claude plugin validate <marketplace-root>` passes
- [ ] Copied out of `~/.claude/dev-mods/` into the user's projects folder
- [ ] Repository/tag pushed only after the user said yes
