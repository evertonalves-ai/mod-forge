# context-chart

[Read in English](README.md)

**Um gráfico de quanto a memória da conversa do Claude foi enchendo, turno a turno.**

## O que é um mod?
O Claude Code é o assistente da Anthropic para trabalhar com código, no terminal ou no app desktop do Claude. Um **mod** é um pequeno complemento para ele: pode acrescentar um painel, uma faixa acima da caixa onde você digita, um `/comando` novo, ou uma regra que confere o que o Claude vai fazer. Esta pasta é um mod completo que você pode instalar e usar do jeito que está, ou copiar como ponto de partida.

## O que ele faz
O Claude só consegue manter uma quantidade limitada de texto na cabeça de uma vez (a janela de contexto). O mod context-band mostra o número atual; este mostra a história inteira num gráfico, para você ver quais turnos fizeram o uso subir rápido, como a leitura de um arquivo grande.

## O que aparece na tela
- No app desktop: um gráfico de linha, um ponto por turno, com linhas tracejadas em 50% e 90%.
- No terminal: os mesmos dados em barras de texto.
- Antes da primeira resposta do Claude: uma linha avisando que o gráfico começa depois dela.

## Como usar
1. Digite `/context-chart` e tecle Enter. O painel abre.
2. Continue trabalhando; aparece um ponto novo depois de cada resposta do Claude.
3. Tecle `Esc` para fechar.

## Atalhos de teclado
| Tecla | O que faz |
|---|---|
| `Esc` | Fecha o painel |

## Comandos
| Digite | O que faz |
|---|---|
| `/context-chart` | Abre o gráfico |

## Configurações
O Claude Code pede estas informações quando você ativa o mod. Para mudar depois, abra `/config` e procure o mod pelo nome. Os nomes das opções aparecem em inglês.

| Opção | O que significa | Padrão |
|---|---|---|
| `language` (Language) | Idioma do texto que o mod mostra: `en` (inglês) ou `pt-BR` (português do Brasil). | `en` |

## Bom saber
- O gráfico só recebe dado novo quando o Claude Code informa, depois de cada resposta; ele não fica consultando em segundo plano.

## Instalar
Você precisa do Claude Code 2.1.287 ou mais novo no terminal, ou 2.1.286 ou mais novo no app desktop.

1. Copie esta pasta para qualquer lugar do seu computador.
2. Dentro da cópia, renomeie a pasta `_claude-plugin` para `.claude-plugin` (com ponto no começo). Ela vem sem o ponto para os exemplos nunca carregarem sem querer.
3. Abra o Claude Code com o mod:

```bash
claude --plugin-dir caminho/para/context-chart
```

Para deixar instalado de vez, peça à skill `claude-mod-forge` para empacotar ("empacote este mod").

## Conferir
Na pasta da skill (`skills/claude-mod-forge`), este comando confere o manifesto, os tipos em modo estrito e roda os 5 testes automáticos deste mod:

```bash
node scripts/check-mod.mjs examples/context-chart
```

Os testes cobrem a lógica do mod e o que ele desenha no terminal e no app desktop. A aparência na sua janela vale uma olhada rápida numa sessão de verdade.

Para quem programa: [a tabela de exemplos](../README.md) lista os hooks e as chamadas da API que este mod demonstra.
