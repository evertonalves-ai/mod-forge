# scoped-approve

[Read in English](README.md)

**Deixa uma lista curta de comandos de sua confiança rodar sem a pergunta de permissão, e mais nada.**

## O que é um mod?
O Claude Code é o assistente da Anthropic para trabalhar com código, no terminal ou no app desktop do Claude. Um **mod** é um pequeno complemento para ele: pode acrescentar um painel, uma faixa acima da caixa onde você digita, um `/comando` novo, ou uma regra que confere o que o Claude vai fazer. Esta pasta é um mod completo que você pode instalar e usar do jeito que está, ou copiar como ponto de partida.

## O que ele faz
Por padrão o Claude Code pergunta antes de rodar um comando. Isso é seguro, mas responder "sim" para `npm test` pela décima vez cansa. Este mod deixa você escrever uma lista de comandos que podem rodar sem perguntar. O que não estiver na lista continua recebendo a pergunta normal, igual a antes.

## O que aparece na tela
- Quando um comando roda por estar na sua lista, uma linha clara na conversa avisa: `auto-approved by allow-list entry "npm test *": npm test -- --watch`.
- `/approvals` mostra a lista e o que foi aprovado nesta sessão.

## Como usar
1. Nas configurações, escreva os comandos de confiança em **Allowed commands**, separados por vírgula. Exemplo: `git status, npm test *`.
2. Cada item vale só para aquele comando exato. Coloque um espaço e `*` no fim para aceitar também o que vier depois: `npm test *` libera `npm test` e `npm test -- --watch`.
3. Digite `/approvals` para conferir a lista.
4. Para pausar sem desinstalar, desligue **Enabled**.

## Atalhos de teclado
Nenhum próprio.

## Comandos
| Digite | O que faz |
|---|---|
| `/approvals` | Mostra a lista e as aprovações desta sessão |

## Configurações
O Claude Code pede estas informações quando você ativa o mod. Para mudar depois, abra `/config` e procure o mod pelo nome. Os nomes das opções aparecem em inglês.

| Opção | O que significa | Padrão |
|---|---|---|
| `allowList` (Allowed commands) | Comandos que podem rodar sem perguntar, separados por vírgula. Termine um com espaço e `*` para aceitar argumentos. | (vazio) |
| `enabled` (Enabled) | Desliga o mod sem desinstalar. | `true` |

## Bom saber
- Comandos encadeados com `;`, `&&`, `|`, redirecionamentos ou `$( )` nunca são aprovados automaticamente, mesmo que comecem com um comando liberado.
- Nunca passa por cima de um "negar" das suas próprias regras de permissão e nunca aprova nada para subagentes (agentes auxiliares que o Claude abre).
- Cada item da lista é um comando que o Claude pode rodar sem te perguntar. Mantenha a lista curta e exata.
- As mensagens deste mod ficam em inglês (ele não tem a opção de idioma).

## Instalar
Você precisa do Claude Code 2.1.287 ou mais novo no terminal, ou 2.1.286 ou mais novo no app desktop.

1. Copie esta pasta para qualquer lugar do seu computador.
2. Dentro da cópia, renomeie a pasta `_claude-plugin` para `.claude-plugin` (com ponto no começo). Ela vem sem o ponto para os exemplos nunca carregarem sem querer.
3. Abra o Claude Code com o mod:

```bash
claude --plugin-dir caminho/para/scoped-approve
```

Para deixar instalado de vez, peça à skill `claude-mod-forge` para empacotar ("empacote este mod").

## Conferir
Na pasta da skill (`skills/claude-mod-forge`), este comando confere o manifesto, os tipos em modo estrito e roda os 8 testes automáticos deste mod:

```bash
node scripts/check-mod.mjs examples/scoped-approve
```

Os testes cobrem a lógica do mod e o que ele desenha no terminal e no app desktop. A aparência na sua janela vale uma olhada rápida numa sessão de verdade.

Para quem programa: [a tabela de exemplos](../README.md) lista os hooks e as chamadas da API que este mod demonstra.
