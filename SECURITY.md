# Security

[Português abaixo](#português)

## Reporting a problem

Please do not open a public issue for a security problem. Use GitHub's private report instead: the
**Security** tab of this repository, then **Report a vulnerability**. Include what you found, how to reproduce
it, and which file or example mod it affects.

You will get an answer within 7 days. Once a fix is out, the report is credited in the changelog unless you ask
otherwise.

## What counts

- An example mod that lets a command through that it should hold or refuse (`shell-guard`, `scoped-approve`).
- A secret (token, password, key) that ends up in a log, on screen or in a file (`api-status`, `tool-log`).
- A file written outside the folder a mod was given.
- Guidance in the skill (`SKILL.md`, `workflows/`, `references/`) that would lead Claude to build an unsafe mod.
- `scripts/check-mod.mjs` or `scripts/say.mjs` touching files they should not.

## Known limits (not bugs)

- `shell-guard` matches common spellings of risky commands. An unusual spelling can get through; it is a safety
  net next to your Claude Code permission rules, not a replacement for them.
- `tool-log` hides secrets on a best-effort basis. Keep its folder private.

## Supported versions

Only the latest release gets fixes.

---

## Português

**Não abra uma issue pública para falha de segurança.** Use o relato privado do GitHub: aba **Security** deste
repositório, depois **Report a vulnerability**. Conte o que encontrou, como reproduzir e qual arquivo ou mod de
exemplo é afetado. A resposta vem em até 7 dias.

Contam como falha: um mod de exemplo que deixa passar um comando que deveria segurar ou recusar, um segredo que
vai parar num registro, na tela ou num arquivo, um arquivo escrito fora da pasta permitida, uma orientação da
skill que levaria o Claude a construir um mod inseguro, ou os scripts mexendo em arquivos que não deveriam.

Não são falhas: o `shell-guard` reconhece as formas comuns de escrever comandos arriscados, e uma grafia incomum
pode passar; o `tool-log` esconde segredos como esforço de boa-fé. Só a versão mais recente recebe correções.
