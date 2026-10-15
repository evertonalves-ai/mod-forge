# spinner-counter

[Read in English](README.md)

**Acrescenta, ao lado da palavra que o Claude mostra enquanto pensa, quantas ferramentas ele já usou.**

## O que é um mod?
O Claude Code é o assistente da Anthropic para trabalhar com código, no terminal ou no app desktop do Claude. Um **mod** é um pequeno complemento para ele: pode acrescentar um painel, uma faixa acima da caixa onde você digita, um `/comando` novo, ou uma regra que confere o que o Claude vai fazer. Esta pasta é um mod completo que você pode instalar e usar do jeito que está, ou copiar como ponto de partida.

## O que ele faz
Enquanto o Claude trabalha, o Claude Code mostra uma palavra animada, como "Thinking". Ela não diz quanto trabalho está acontecendo por trás. Este mod acrescenta o número de ferramentas que o Claude usou na resposta atual, para você diferenciar uma resposta rápida de uma tarefa longa só de olhar.

## O que aparece na tela
- A palavra animada de sempre, seguida da contagem: "Thinking · 3 ferramentas". O número volta a zero a cada turno novo.

## Como usar
1. Instale o mod. Ele aparece sozinho na próxima vez que o Claude trabalhar.

## Atalhos de teclado
Nenhum próprio.

## Comandos
Nenhum. Ele funciona sozinho.

## Configurações
O Claude Code pede estas informações quando você ativa o mod. Para mudar depois, abra `/config` e procure o mod pelo nome. Os nomes das opções aparecem em inglês.

| Opção | O que significa | Padrão |
|---|---|---|
| `language` (Language) | Idioma do texto que o mod mostra: `en` (inglês) ou `pt-BR` (português do Brasil). | `en` |

## Bom saber
- A animação original do Claude Code continua; o mod só escreve depois dela.

## Instalar
Você precisa do Claude Code 2.1.287 ou mais novo no terminal, ou 2.1.286 ou mais novo no app desktop.

1. Copie esta pasta para qualquer lugar do seu computador.
2. Dentro da cópia, renomeie a pasta `_claude-plugin` para `.claude-plugin` (com ponto no começo). Ela vem sem o ponto para os exemplos nunca carregarem sem querer.
3. Abra o Claude Code com o mod:

```bash
claude --plugin-dir caminho/para/spinner-counter
```

Para deixar instalado de vez, peça à skill `claude-mod-forge` para empacotar ("empacote este mod").

## Conferir
Na pasta da skill (`skills/claude-mod-forge`), este comando confere o manifesto, os tipos em modo estrito e roda os 2 testes automáticos deste mod:

```bash
node scripts/check-mod.mjs examples/spinner-counter
```

Os testes cobrem a lógica do mod e o que ele desenha no terminal e no app desktop. A aparência na sua janela vale uma olhada rápida numa sessão de verdade.

Para quem programa: [a tabela de exemplos](../README.md) lista os hooks e as chamadas da API que este mod demonstra.
