# Release and distribution

## Where a mod lives
- **Developing:** the session mods folder (`~/.claude/dev-mods/<session>/<mod>`, hot reload after the user enables
  it) or any folder loaded with `claude --plugin-dir <mod>`. Both reload on save.
- **Keeping:** copy out of dev-mods (it is cleaned after `cleanupPeriodDays`) into the user's projects folder.
- **Never** edit an installed copy: it is cached by version. Develop on the folder, bump the version to ship.

## Local folder marketplace (personal use, recommended)
```
mods/                                   ← the user's folder of mods
├── .claude-plugin/marketplace.json
└── my-mod/ …
```
```json
{ "name": "my-mods", "owner": { "name": "<you>" }, "plugins": [{ "name": "my-mod", "source": "./my-mod" }] }
```
```bash
claude plugin marketplace add "<path>/mods"     # once
claude plugin install my-mod@my-mods
```
A folder marketplace with relative sources is read in place: edit the folder, run `/reload-plugins`, no reinstall.

## Git repository (team / public)
One repo can be both the plugin and its marketplace (`"source": "./"`), or hold many plugins.
```bash
/plugin install my-mod@<owner>/<repo>           # at a terminal Claude Code prompt
claude plugin marketplace add <owner>/<repo>    # or from the shell, then: claude plugin install my-mod@<marketplace>
```
Private repositories work for people with access to them.
Put the install line in the README with what follows it (accept the marketplace, choose a scope).

## Organization
Managed settings: a directory marketplace on every machine (`extraKnownMarketplaces` with a `directory` source),
`enabledPlugins`, and `prependPlugins`/`appendPlugins` for order. A plugin copied from GitHub/npm counts as a
user's mod. See `plugins/mods/admin`.

## Manifest checklist
`name` (kebab-case, ≤ 64, not reserved: no `claude-`/`anthropic-`/`cc-plugin-` prefix, not `claude-mods`), `version` (semver), `description` (one line), `author`, `license`,
`homepage`/`repository` (public), `types` (if `$.state`), `userConfig` (options; `sensitive` for secrets).

## README checklist
What it does · a sample of the UI (text block or screenshot) · install line · how to open it (command, hotkeys) ·
options · **what this mod can reach** (validate's `calls:` / `hooks:`) · tested Claude Code version and surfaces ·
known limits · license.

## Versioning
Patch: fixes. Minor: features. Major: renamed commands, store keys or options (write a migration or say so).
Tag releases `v<version>`. Keep a CHANGELOG.
