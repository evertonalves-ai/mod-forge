# agent-board

[Read in English](README.md)

**Um painel com os agentes auxiliares que o Claude abriu nesta sessão e o que cada um está fazendo.**

## O que é um mod?
O Claude Code é o assistente da Anthropic para trabalhar com código, no terminal ou no app desktop do Claude. Um **mod** é um pequeno complemento para ele: pode acrescentar um painel, uma faixa acima da caixa onde você digita, um `/comando` novo, ou uma regra que confere o que o Claude vai fazer. Esta pasta é um mod completo que você pode instalar e usar do jeito que está, ou copiar como ponto de partida.

## O que ele faz
Em tarefas maiores o Claude pode abrir agentes auxiliares (subagentes) que trabalham em paralelo: um pesquisa, outro escreve código, outro revisa. Normalmente você só vê o relatório final deles. Este mod mostra um quadro ao vivo com cada auxiliar, o papel dele e o status, para você saber quem ainda está trabalhando.

## O que aparece na tela
- Um painel chamado "Agentes" com uma linha por auxiliar: nome, papel e status (iniciando, trabalhando, aguardando, parado, concluído, falhou, interrompido).
- Um resumo no topo ("◌ 2 trabalhando" ou "● tudo parado") e o horário da última atualização.

## Como usar
1. Digite `/agents` e tecle Enter. O painel abre.
2. Deixe aberto enquanto o Claude trabalha; ele se atualiza a cada 2 segundos.
3. Tecle `Esc` para voltar ao prompt.

## Atalhos de teclado
| Tecla | O que faz |
|---|---|
| `Esc` | Sai do painel |

## Comandos
| Digite | O que faz |
|---|---|
| `/agents` | Abre o quadro |

## Configurações
O Claude Code pede estas informações quando você ativa o mod. Para mudar depois, abra `/config` e procure o mod pelo nome. Os nomes das opções aparecem em inglês.

| Opção | O que significa | Padrão |
|---|---|---|
| `language` (Language) | Idioma do texto que o mod mostra: `en` (inglês) ou `pt-BR` (português do Brasil). | `en` |

## Bom saber
- Se o Claude não abriu nenhum auxiliar, o painel avisa.
- Combina com o agent-dialogue, que mostra o que os auxiliares estão dizendo uns aos outros.

## Instalar
Você precisa do Claude Code 2.1.287 ou mais novo no terminal, ou 2.1.286 ou mais novo no app desktop.

1. Copie esta pasta para qualquer lugar do seu computador.
2. Dentro da cópia, renomeie a pasta `_claude-plugin` para `.claude-plugin` (com ponto no começo). Ela vem sem o ponto para os exemplos nunca carregarem sem querer.
3. Abra o Claude Code com o mod:

```bash
claude --plugin-dir caminho/para/agent-board
```

Para deixar instalado de vez, peça à skill `claude-mod-forge` para empacotar ("empacote este mod").

## Conferir
Na pasta da skill (`skills/claude-mod-forge`), este comando confere o manifesto, os tipos em modo estrito e roda os 4 testes automáticos deste mod:

```bash
node scripts/check-mod.mjs examples/agent-board
```

Os testes cobrem a lógica do mod e o que ele desenha no terminal e no app desktop. A aparência na sua janela vale uma olhada rápida numa sessão de verdade.

Para quem programa: [a tabela de exemplos](../README.md) lista os hooks e as chamadas da API que este mod demonstra.
