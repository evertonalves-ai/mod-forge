# shell-guard

[Read in English](README.md)

**Uma rede de proteção que segura comandos perigosos até você autorizar, e mantém o Claude longe de arquivos com senhas e chaves.**

## O que é um mod?
O Claude Code é o assistente da Anthropic para trabalhar com código, no terminal ou no app desktop do Claude. Um **mod** é um pequeno complemento para ele: pode acrescentar um painel, uma faixa acima da caixa onde você digita, um `/comando` novo, ou uma regra que confere o que o Claude vai fazer. Esta pasta é um mod completo que você pode instalar e usar do jeito que está, ou copiar como ponto de partida.

## O que ele faz
O Claude pode rodar comandos no seu computador. A maioria é inofensiva, mas alguns apagam uma pasta de vez, jogam fora trabalho que não foi salvo no Git ou reescrevem um histórico que outras pessoas usam. Este mod olha cada comando antes de ele rodar. Quando reconhece um desses padrões arriscados, ele para e pergunta a você, explicando em palavras simples o que o comando faria. Também recusa qualquer edição em arquivos que costumam guardar segredos, como os `.env` e as chaves privadas.

## O que aparece na tela
- Quando aparece um comando arriscado: uma pergunta com o motivo ("force push (reescreve histórico compartilhado). Executar este comando?"), o comando completo e duas opções, **Executar** e **Recusar**.
- No modo de bloqueio: um aviso curto ("Bloqueado: force push") no lugar da pergunta.

## Como usar
1. Instale o mod. Ele funciona sozinho; não tem nada para abrir.
2. Quando a pergunta aparecer, leia o comando e escolha **Executar** ou **Recusar**.
3. Se preferir nunca ser perguntado, mude o modo para `block` (sempre recusa) nas configurações.

### O que conta como arriscado
- Apagar pastas à força (`rm -rf`, `Remove-Item -Recurse -Force`, `rd /s`)
- Force push no Git (`git push --force`, `-f`, `+branch`)
- `git reset --hard` e `git clean -f` (descartam trabalho não salvo ou não rastreado)
- Comandos de banco de dados que apagam ou esvaziam tabelas (`DROP TABLE`, `TRUNCATE`)
- Mudar permissões de muitos arquivos de uma vez (`chmod -R`, `chown -R`)
- Formatar um disco (`mkfs`, `format`, `Format-Volume`, `Clear-Disk`)

### Arquivos que ele protege contra edição
`.env` e `.env.alguma-coisa`, `id_rsa`, `id_ed25519`, arquivos terminados em `.pem`, `.key`, `.p12`, `.pfx`, e `credentials` / `credentials.json`.

## Atalhos de teclado
| Tecla | O que faz |
|---|---|
| Setas e `Enter` | Escolhe Executar ou Recusar na pergunta |

## Comandos
Nenhum. Ele funciona sozinho.

## Configurações
O Claude Code pede estas informações quando você ativa o mod. Para mudar depois, abra `/config` e procure o mod pelo nome. Os nomes das opções aparecem em inglês.

| Opção | O que significa | Padrão |
|---|---|---|
| `mode` (Risky command mode) | `ask`: para e pergunta. `block`: sempre recusa. `off`: proteção desligada. | `ask` |
| `language` (Language) | Idioma do texto que o mod mostra: `en` (inglês) ou `pt-BR` (português do Brasil). | `en` |

## Bom saber
- Se por algum motivo a pergunta não puder aparecer, o comando é recusado. Na dúvida, a resposta é não.
- Vale para os comandos de terminal, PowerShell e Monitor, no Windows, macOS e Linux.
- É uma rede de proteção, não uma tranca. Reconhece as formas comuns de escrever esses comandos; uma grafia incomum pode passar. Mantenha também as permissões normais do Claude Code.
- O modo `off` desliga tudo, inclusive a proteção dos arquivos secretos.
- O motivo da recusa que o Claude lê continua em inglês, de propósito.

## Instalar
Você precisa do Claude Code 2.1.287 ou mais novo no terminal, ou 2.1.286 ou mais novo no app desktop.

1. Copie esta pasta para qualquer lugar do seu computador.
2. Dentro da cópia, renomeie a pasta `_claude-plugin` para `.claude-plugin` (com ponto no começo). Ela vem sem o ponto para os exemplos nunca carregarem sem querer.
3. Abra o Claude Code com o mod:

```bash
claude --plugin-dir caminho/para/shell-guard
```

Para deixar instalado de vez, peça à skill `claude-mod-forge` para empacotar ("empacote este mod").

## Conferir
Na pasta da skill (`skills/claude-mod-forge`), este comando confere o manifesto, os tipos em modo estrito e roda os 16 testes automáticos deste mod:

```bash
node scripts/check-mod.mjs examples/shell-guard
```

Os testes cobrem a lógica do mod e o que ele desenha no terminal e no app desktop. A aparência na sua janela vale uma olhada rápida numa sessão de verdade.

Para quem programa: [a tabela de exemplos](../README.md) lista os hooks e as chamadas da API que este mod demonstra.
