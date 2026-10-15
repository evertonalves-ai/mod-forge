# context-band

[Read in English](README.md)

**Uma faixa fina acima da caixa onde você digita, mostrando o quanto da memória da conversa o Claude já ocupou.**

## O que é um mod?
O Claude Code é o assistente da Anthropic para trabalhar com código, no terminal ou no app desktop do Claude. Um **mod** é um pequeno complemento para ele: pode acrescentar um painel, uma faixa acima da caixa onde você digita, um `/comando` novo, ou uma regra que confere o que o Claude vai fazer. Esta pasta é um mod completo que você pode instalar e usar do jeito que está, ou copiar como ponto de partida.

## O que ele faz
O Claude só consegue manter uma quantidade limitada de texto na cabeça de uma vez. Esse limite se chama janela de contexto. Quando ela enche, o Claude Code compacta a conversa (resume as partes antigas para abrir espaço), e algum detalhe pode se perder. Este mod mostra o tempo todo quanto desse espaço está ocupado, para você saber quando vale começar uma conversa nova ou fechar a tarefa.

## O que aparece na tela
- Uma linha acima do prompt com a porcentagem em uso, a quantidade de texto em tokens (um token é mais ou menos uma palavra curta ou um pedaço de palavra), quanto o último turno acrescentou e uma palavra que resume a situação:
- "folgado" (verde, abaixo de 50%), "enchendo" (amarelo, de 50 a 74%), "apertado" (amarelo, de 75 a 89%), "compactar logo" (vermelho, 90% ou mais).
- Um botão "ocultar" no fim da linha.

## Como usar
1. Instale o mod. A faixa aparece sozinha depois da primeira resposta do Claude.
2. Para esconder, use o botão "ocultar" no fim da faixa.
3. Para mostrar de novo, digite `/context-band`.

## Atalhos de teclado
| Tecla | O que faz |
|---|---|
| `Tab` e depois `Enter` | Chega no botão "ocultar" e aperta |

## Comandos
| Digite | O que faz |
|---|---|
| `/context-band` | Mostra a faixa de novo, ou esconde se ela estiver visível |

## Configurações
O Claude Code pede estas informações quando você ativa o mod. Para mudar depois, abra `/config` e procure o mod pelo nome. Os nomes das opções aparecem em inglês.

| Opção | O que significa | Padrão |
|---|---|---|
| `language` (Language) | Idioma do texto que o mod mostra: `en` (inglês) ou `pt-BR` (português do Brasil). | `en` |

## Bom saber
- Antes da primeira resposta ainda não existe número para mostrar, então a faixa avisa que está esperando.
- Em janelas estreitas a faixa encurta o texto para caber numa linha só.

## Instalar
Você precisa do Claude Code 2.1.287 ou mais novo no terminal, ou 2.1.286 ou mais novo no app desktop.

1. Copie esta pasta para qualquer lugar do seu computador.
2. Dentro da cópia, renomeie a pasta `_claude-plugin` para `.claude-plugin` (com ponto no começo). Ela vem sem o ponto para os exemplos nunca carregarem sem querer.
3. Abra o Claude Code com o mod:

```bash
claude --plugin-dir caminho/para/context-band
```

Para deixar instalado de vez, peça à skill `claude-mod-forge` para empacotar ("empacote este mod").

## Conferir
Na pasta da skill (`skills/claude-mod-forge`), este comando confere o manifesto, os tipos em modo estrito e roda os 4 testes automáticos deste mod:

```bash
node scripts/check-mod.mjs examples/context-band
```

Os testes cobrem a lógica do mod e o que ele desenha no terminal e no app desktop. A aparência na sua janela vale uma olhada rápida numa sessão de verdade.

Para quem programa: [a tabela de exemplos](../README.md) lista os hooks e as chamadas da API que este mod demonstra.
