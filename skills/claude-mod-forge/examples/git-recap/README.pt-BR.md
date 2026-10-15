# git-recap

[Read in English](README.md)

**Um comando que lista seus commits recentes do Git na hora, sem gastar tempo do Claude.**

## O que é um mod?
O Claude Code é o assistente da Anthropic para trabalhar com código, no terminal ou no app desktop do Claude. Um **mod** é um pequeno complemento para ele: pode acrescentar um painel, uma faixa acima da caixa onde você digita, um `/comando` novo, ou uma regra que confere o que o Claude vai fazer. Esta pasta é um mod completo que você pode instalar e usar do jeito que está, ou copiar como ponto de partida.

## O que ele faz
O Git guarda um registro de cada alteração salva num projeto; cada alteração salva é um commit. Quando você volta a um projeto, quase sempre quer saber "o que eu fiz ontem?". Este mod cria um comando que responde isso na hora, lendo o Git direto. O Claude não é acionado, então não custa nada e não ocupa espaço na conversa.

## O que aparece na tela
- Uma lista curta de commits: o código curto de cada um, a data e a mensagem. Se não houver nenhum no período, uma linha avisando.

## Como usar
1. Abra o Claude Code dentro de um projeto que usa Git.
2. Digite `/recap` para o último dia, ou `/recap 7` para os últimos 7 dias.

## Atalhos de teclado
Nenhum próprio.

## Comandos
| Digite | O que faz |
|---|---|
| `/recap` | Commits do último dia |
| `/recap 7` | Commits dos últimos 7 dias (qualquer número de 1 a 30) |

## Bom saber
- O Git precisa estar instalado e a pasta precisa ser um repositório Git.
- Commits de merge ficam de fora, para a lista mostrar só o trabalho de fato.
- Qualquer coisa que não seja um número de 1 a 30 recebe uma mensagem curta explicando o uso.
- As mensagens deste mod ficam em inglês (ele não tem a opção de idioma).

## Instalar
Você precisa do Claude Code 2.1.287 ou mais novo no terminal, ou 2.1.286 ou mais novo no app desktop.

1. Copie esta pasta para qualquer lugar do seu computador.
2. Dentro da cópia, renomeie a pasta `_claude-plugin` para `.claude-plugin` (com ponto no começo). Ela vem sem o ponto para os exemplos nunca carregarem sem querer.
3. Abra o Claude Code com o mod:

```bash
claude --plugin-dir caminho/para/git-recap
```

Para deixar instalado de vez, peça à skill `claude-mod-forge` para empacotar ("empacote este mod").

## Conferir
Na pasta da skill (`skills/claude-mod-forge`), este comando confere o manifesto, os tipos em modo estrito e roda os 6 testes automáticos deste mod:

```bash
node scripts/check-mod.mjs examples/git-recap
```

Os testes cobrem a lógica do mod e o que ele desenha no terminal e no app desktop. A aparência na sua janela vale uma olhada rápida numa sessão de verdade.

Para quem programa: [a tabela de exemplos](../README.md) lista os hooks e as chamadas da API que este mod demonstra.
