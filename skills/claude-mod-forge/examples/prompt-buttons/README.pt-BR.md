# prompt-buttons

[Read in English](README.md)

**Um painel de botões criados por você; cada um manda ao Claude, com uma tecla, um pedido que você usa sempre.**

## O que é um mod?
O Claude Code é o assistente da Anthropic para trabalhar com código, no terminal ou no app desktop do Claude. Um **mod** é um pequeno complemento para ele: pode acrescentar um painel, uma faixa acima da caixa onde você digita, um `/comando` novo, ou uma regra que confere o que o Claude vai fazer. Esta pasta é um mod completo que você pode instalar e usar do jeito que está, ou copiar como ponto de partida.

## O que ele faz
Alguns pedidos você digita de novo e de novo: "rode os testes e corrija o que falhar", "revise a última alteração", "escreva a mensagem do commit". Este mod deixa você salvar cada um como um botão com um nome curto. Apertar o botão (ou o número dele) manda o pedido completo ao Claude, como se você tivesse digitado. Os botões ficam guardados para as próximas sessões.

## O que aparece na tela
- Um painel chamado "Botões de prompt" com seus botões numerados de 1 a 9, cada um com um `×` para apagar.
- Uma linha de status: "● pronto", ou "◌ Claude trabalhando · novos cliques vão para a fila".
- Dois campos embaixo para criar um botão: **Nome** e **Instrução** (o texto que ele envia).

## Como usar
1. Digite `/buttons` e tecle Enter. O painel abre.
2. Em **Nome**, escreva um nome curto (por exemplo "Rodar testes e corrigir") e tecle Enter.
3. Em **Instrução**, escreva o pedido completo e tecle Enter. O botão aparece com um número.
4. Tecle esse número para enviar. Se o Claude estiver ocupado, o pedido entra na fila e vai assim que ele terminar.
5. Fora do painel, `/buttons 2` envia o botão 2 direto.

## Atalhos de teclado
| Tecla | O que faz |
|---|---|
| `1` a `9` | Envia o pedido daquele botão |
| `×` | Apaga aquele botão |
| `Tab` | Passa de um botão ou campo para o próximo |
| `Enter` | Vai para o próximo campo, ou cria o botão |

## Comandos
| Digite | O que faz |
|---|---|
| `/buttons` | Abre o painel (ou lista os botões onde não dá para desenhar painel) |
| `/buttons 2` | Envia o botão 2 na hora |

## Configurações
O Claude Code pede estas informações quando você ativa o mod. Para mudar depois, abra `/config` e procure o mod pelo nome. Os nomes das opções aparecem em inglês.

| Opção | O que significa | Padrão |
|---|---|---|
| `language` (Language) | Idioma do texto que o mod mostra: `en` (inglês) ou `pt-BR` (português do Brasil). | `en` |

## Bom saber
- Até 9 botões, um por tecla numérica. Nomes de até 40 caracteres, instruções de até 2000.
- Dá para criar botões no terminal e no app desktop.

## Instalar
Você precisa do Claude Code 2.1.287 ou mais novo no terminal, ou 2.1.286 ou mais novo no app desktop.

1. Copie esta pasta para qualquer lugar do seu computador.
2. Dentro da cópia, renomeie a pasta `_claude-plugin` para `.claude-plugin` (com ponto no começo). Ela vem sem o ponto para os exemplos nunca carregarem sem querer.
3. Abra o Claude Code com o mod:

```bash
claude --plugin-dir caminho/para/prompt-buttons
```

Para deixar instalado de vez, peça à skill `claude-mod-forge` para empacotar ("empacote este mod").

## Conferir
Na pasta da skill (`skills/claude-mod-forge`), este comando confere o manifesto, os tipos em modo estrito e roda os 7 testes automáticos deste mod:

```bash
node scripts/check-mod.mjs examples/prompt-buttons
```

Os testes cobrem a lógica do mod e o que ele desenha no terminal e no app desktop. A aparência na sua janela vale uma olhada rápida numa sessão de verdade.

Para quem programa: [a tabela de exemplos](../README.md) lista os hooks e as chamadas da API que este mod demonstra.
