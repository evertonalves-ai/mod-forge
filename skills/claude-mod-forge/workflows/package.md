# Workflow: package and distribute

Follow `references/release-and-distribution.md` for details. Steps:

1. Checker green; `templates/release-checklist.md` filled.
2. Move the mod out of `~/.claude/dev-mods/<session>/` (it is deleted after `cleanupPeriodDays`) into the user's
   projects folder. Ask where once if unknown; reuse that answer.
3. Manifest: `name` (not `claude-…`), `version` (semver), `description`, `author`, `license`, `repository`
   if public. `types` if it uses `$.state`. `userConfig` for options and secrets.
4. README: what it does, a screenshot or text sample of the UI, install line, commands/hotkeys, options,
   **capabilities used** (copied from validate's `calls:`), tested Claude Code version, known limits.
5. Pick the channel:
   - personal: a local folder marketplace (`.claude-plugin/marketplace.json` with `"source": "./<mod>"`),
     `claude plugin marketplace add <folder>` once, then `claude plugin install <mod>@<marketplace>`.
     Edits then apply with `/reload-plugins`, no reinstall.
   - team / public: a Git repository with `.claude-plugin/marketplace.json`; others run
     `/plugin install <mod>@<owner>/<repo>` (or `claude plugin marketplace add <owner>/<repo>` then install).
   - organization: managed settings, see the admin docs (`references/official-docs.md`).
6. Installing, adding a marketplace, creating a repository or pushing are outward or persistent actions:
   ask before each one.
7. `claude plugin validate <repo-root>` checks the marketplace file too. Tag the release with the version.
