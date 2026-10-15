# Contributing

[Português abaixo](#português)

Thanks for helping. Bug reports, fixes, clearer docs and new example mods are all welcome.

## Reporting a bug

Open an issue with:
- what you asked the skill, or which example mod you used;
- what happened and what you expected;
- your Claude Code version (`claude --version`), your system, and terminal or desktop app.

Security problems go through [SECURITY.md](SECURITY.md), not issues.

## Changing something

1. Fork the repository and create a branch.
2. Make the change. Repository files are in English; an example mod's on-screen text goes through its
   `hooks/i18n.ts` with both `en` and `pt-BR`.
3. Run the checks on every example you touched:
   ```bash
   node skills/claude-mod-forge/scripts/check-mod.mjs skills/claude-mod-forge/examples/<name>
   ```
   All three steps must pass: `claude plugin validate`, strict `tsc`, `claude plugin test`.
4. If a behavior changed, add or update a test, and update the mod's `README.md` and `README.pt-BR.md`.
5. Add a line to `CHANGELOG.md` and open a pull request saying what changed and how you checked it.

CI runs the validate and test steps on every push. It runs strict `tsc` too, as information only, because the
public types file lags behind current builds.

## A new example mod

An example earns its place when it shows something the other examples don't: a new event, a new surface, a
new kind of safety rule. It needs:
- `_claude-plugin/plugin.json` (with the underscore, so it never loads by accident), `hooks/`, `tests/`;
- data from a real source only, no invented numbers;
- a test for every button, field and command, and a fail-closed answer if it guards anything;
- a plain-language `README.md` and `README.pt-BR.md` that someone new to Claude Code can follow;
- a row in `skills/claude-mod-forge/examples/README.md`.

## Style

Plain words, short sentences, no marketing. Say what was tested and what was not.

---

## Português

Obrigado pela ajuda. Relatos de bug, correções, documentação mais clara e novos mods de exemplo são bem-vindos.

- **Bug:** abra uma issue dizendo o que pediu à skill (ou qual mod usou), o que aconteceu, o que esperava, a
  versão do Claude Code (`claude --version`), o sistema e se foi no terminal ou no app desktop. Falha de
  segurança vai pelo [SECURITY.md](SECURITY.md).
- **Mudança:** faça um fork e uma branch, rode `check-mod.mjs` em cada exemplo que mexeu (as três etapas
  precisam passar), atualize testes e os dois READMEs do mod, acrescente uma linha no `CHANGELOG.md` e abra o
  pull request explicando o que mudou e como conferiu.
- **Mod de exemplo novo:** precisa mostrar algo que os outros não mostram, usar só dados reais, ter teste para
  cada botão, campo e comando, e READMEs em inglês e português que um iniciante consiga seguir.

Os arquivos do repositório ficam em inglês; o texto que um mod mostra na tela tem as duas versões, `en` e `pt-BR`.
