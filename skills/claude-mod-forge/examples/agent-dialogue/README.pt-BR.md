# agent-dialogue

[Read in English](README.md)

**Um painel que mostra ao vivo a conversa entre agentes auxiliares que escrevem num arquivo compartilhado.**

## O que é um mod?
O Claude Code é o assistente da Anthropic para trabalhar com código, no terminal ou no app desktop do Claude. Um **mod** é um pequeno complemento para ele: pode acrescentar um painel, uma faixa acima da caixa onde você digita, um `/comando` novo, ou uma regra que confere o que o Claude vai fazer. Esta pasta é um mod completo que você pode instalar e usar do jeito que está, ou copiar como ponto de partida.

## O que ele faz
Um jeito bom de revisar trabalho é pôr dois agentes auxiliares para conversar: um crítico que acha problemas e um construtor que corrige. Eles deixam mensagens um para o outro num arquivo compartilhado usando o script `scripts/say.mjs`, que vem com a skill. Este mod mostra essa conversa enquanto ela cresce, com uma cor por autor e um filtro, para você acompanhar a revisão sem abrir o arquivo.

## O que aparece na tela
- Um painel chamado "Diálogo dos agentes" com as mensagens em ordem: quem escreveu, para quem, o tipo da mensagem (achado, correção, pergunta, resposta, conferido, reaberto, nota) e o texto.
- Um seletor **Mostrar** para ver todos ou só um autor.
- Se o arquivo ainda não foi definido, uma linha explicando como definir.

## Como usar
1. Nas configurações, coloque em **file** o caminho do arquivo da conversa (por exemplo `revisao.jsonl` numa pasta à sua escolha).
2. Peça ao Claude uma revisão com um crítico e um construtor que escrevam com `scripts/say.mjs` nesse arquivo. Cada mensagem fica assim: `node say.mjs --file revisao.jsonl critic builder finding "O login não tem limite de tentativas"`.
3. Digite `/dialogue` e tecle Enter para acompanhar. Ele se atualiza a cada 2 segundos.
4. Use **Mostrar** para filtrar por autor; tecle `Esc` para voltar ao prompt.

## Atalhos de teclado
| Tecla | O que faz |
|---|---|
| `Tab` | Chega no seletor Mostrar |
| Setas e `Enter` | Escolhe um autor em Mostrar |
| `Esc` | Sai do painel |

## Comandos
| Digite | O que faz |
|---|---|
| `/dialogue` | Abre a conversa |

## Configurações
O Claude Code pede estas informações quando você ativa o mod. Para mudar depois, abra `/config` e procure o mod pelo nome. Os nomes das opções aparecem em inglês.

| Opção | O que significa | Padrão |
|---|---|---|
| `file` (Dialogue file) | Caminho do arquivo da conversa onde os agentes escrevem. | (vazio) |
| `language` (Language) | Idioma do texto que o mod mostra: `en` (inglês) ou `pt-BR` (português do Brasil). | `en` |

## Bom saber
- Linhas quebradas ou incompletas no arquivo são puladas, não aparecem como erro.
- Não existe arquivo padrão de propósito: você escolhe onde a conversa fica.
- Use junto com o agent-board (`/agents`) para ver quem está trabalhando enquanto lê o que eles dizem.

## Instalar
Você precisa do Claude Code 2.1.287 ou mais novo no terminal, ou 2.1.286 ou mais novo no app desktop.

1. Copie esta pasta para qualquer lugar do seu computador.
2. Dentro da cópia, renomeie a pasta `_claude-plugin` para `.claude-plugin` (com ponto no começo). Ela vem sem o ponto para os exemplos nunca carregarem sem querer.
3. Abra o Claude Code com o mod:

```bash
claude --plugin-dir caminho/para/agent-dialogue
```

Para deixar instalado de vez, peça à skill `claude-mod-forge` para empacotar ("empacote este mod").

## Conferir
Na pasta da skill (`skills/claude-mod-forge`), este comando confere o manifesto, os tipos em modo estrito e roda os 5 testes automáticos deste mod:

```bash
node scripts/check-mod.mjs examples/agent-dialogue
```

Os testes cobrem a lógica do mod e o que ele desenha no terminal e no app desktop. A aparência na sua janela vale uma olhada rápida numa sessão de verdade.

Para quem programa: [a tabela de exemplos](../README.md) lista os hooks e as chamadas da API que este mod demonstra.
