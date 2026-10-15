# ideia

[Read in English](README.md)

**Dois pensadores com pontos de vista diferentes discutem sua ideia, rodada a rodada, e entregam um plano pronto.**

## O que é um mod?
O Claude Code é o assistente da Anthropic para trabalhar com código, no terminal ou no app desktop do Claude. Um **mod** é um pequeno complemento para ele: pode acrescentar um painel, uma faixa acima da caixa onde você digita, um `/comando` novo, ou uma regra que confere o que o Claude vai fazer. Esta pasta é um mod completo que você pode instalar e usar do jeito que está, ou copiar como ponto de partida.

## O que ele faz
Você escreve uma ideia crua, como "um app para controlar gastos do mês". Dois pensadores, A e B, conversam sobre ela. Cada um olha por um ângulo e trabalha com um método diferente: um pode pensar em quem vai usar e o outro em como construir; um pode abrir possibilidades enquanto o outro corta até o que importa. Eles conversam em rodadas, discordam quando têm motivo e constroem um em cima do outro. Você acompanha, comenta quando quiser e direciona. No fim, A escreve um documento com a ideia refinada e B confere se ele bate com o que foi dito. Se a ideia for algo que pode viver dentro do Claude Code, o painel oferece construir como mod.

## O que aparece na tela
- **Linha do topo**: a rodada ("rodada 2 de 4"), o par em uso ("Abrir × Afunilar"), quem está pensando agora e os tokens gastos até ali (um token é mais ou menos uma palavra curta; é por ele que o modelo cobra).
- **Escolha do par**: o par sugerido e o motivo, com botões para aceitar, escolher outro ou escrever o seu.
- **A conversa**: cada mensagem com quem escreveu (A ou B e o ponto de vista) e seus comentários marcados como "Você".
- **Fim de cada rodada**: um resumo de 3 a 5 linhas: decidido, em aberto, descartado.
- **No fim**: onde o documento foi salvo e, quando fizer sentido, o botão para construir como mod.

## Como usar
1. Nas configurações, escolha a **pasta** onde as conversas ficam (veja Configurações abaixo).
2. Digite `/ideia` seguido da sua ideia, por exemplo `/ideia um app para controlar gastos do mês`. Ou digite só `/ideia` e escreva a ideia no painel.
3. O painel sugere um par de pontos de vista e diz por quê. Tecle `a` para aceitar, `p` para escolher da lista, ou `e` para escrever o seu par, como `investidor × cliente`.
4. Acompanhe a rodada: A abre, B responde, A replica. Para direcionar, escreva em **Comentário** e tecle Enter; os dois leem antes da próxima mensagem.
5. No fim da rodada, leia o resumo e tecle `n` para a próxima rodada, `p` para trocar o par da próxima rodada, ou `f` para encerrar.
6. Quando terminar (limite de rodadas, os dois concordam que não falta nada, ou você teclou `f`), abra o `ideia.md` na pasta indicada.

### Os pares de pontos de vista
| Par | Linhas de pensamento e métodos (A × B) | Bom para |
|---|---|---|
| Usuário × Engenharia | jornada do usuário, "trabalho a ser feito" × primeiros princípios, limites técnicos | apps, ferramentas, mods |
| Abrir × Afunilar | SCAMPER, analogias, "e se" × MoSCoW (deve, deveria, poderia, não vai ter), corte de escopo | ideias cruas |
| Defensor × Advogado do diabo | proposta de valor × pre-mortem ("fracassou: por quê?"), riscos | testar uma ideia já formada |
| Visionário × Pé no chão | o cenário ideal em um ano × o que cabe em 30 dias | planos e roteiros |
| Público × Criador | gancho e retenção × clareza, o que dá para produzir toda semana | vídeos, canais, conteúdo |
| Cliente × Negócio | pelo que alguém pagaria × custo, preço, canal, concorrência | produtos e serviços pagos |

Você também pode escrever o seu par (`e`), como "investidor × cliente"; aí cada lado escolhe o próprio método e diz qual usou.

### O que fica salvo
Cada conversa ganha uma subpasta com a data e as primeiras palavras da ideia (por exemplo `2026-10-15-um-app-para-controlar-gastos-do-mes`). Dentro dela: `dialogue.jsonl`, a conversa inteira, uma linha por mensagem, e `ideia.md`, o documento final, com estas seções: a ideia em uma frase, o que entrou (cada decisão, o motivo e quem trouxe), o que ficou de fora, riscos e perguntas em aberto, primeiros passos e como a conversa andou.

## Atalhos de teclado
| Tecla | O que faz |
|---|---|
| `a` | Aceita o par sugerido |
| `p` | Escolhe um par da lista (no começo, ou para a próxima rodada) |
| `e` | Escreve o seu próprio par |
| `s` | Pausa depois da mensagem atual, ou continua |
| `n` | Próxima rodada (no fim de uma rodada); ideia nova (no final) |
| `f` | Encerra agora e escreve o documento com o que já existe |
| `t` | Tenta de novo depois de um erro |
| `r` | Retoma uma conversa que parou |
| `m` | Constrói a ideia como mod (quando oferecido) |
| `Tab` | Passa de um botão ou campo para o próximo |
| `Esc` | Volta ao prompt; a conversa continua |

## Comandos
| Digite | O que faz |
|---|---|
| `/ideia um app para…` | Começa uma conversa sobre essa ideia |
| `/ideia` | Abre o painel: mostra a conversa atual, oferece retomar uma que parou, ou pede uma ideia nova |

## Configurações
O Claude Code pede estas informações quando você ativa o mod. Para mudar depois, abra `/config` e procure o mod pelo nome. Os nomes das opções aparecem em inglês.

| Opção | O que significa | Padrão |
|---|---|---|
| `folder` (Conversations folder) | Pasta onde cada conversa ganha sua subpasta. Obrigatória: o painel pede até ela ser definida. | (vazio) |
| `rounds` (Round limit) | Máximo de rodadas por conversa, de 1 a 8. Cada rodada tem três mensagens. | `4` |
| `pause` (Pause after each round) | Para no fim de cada rodada para mostrar o resumo e esperar você. Desligado: as rodadas seguem direto. | `true` |
| `model` (Thinkers' model) | O modelo que os dois pensadores usam: `sonnet` (equilibrado), `opus` (mais profundo, custa mais), `haiku` (mais rápido e barato). | `sonnet` |
| `obsidian` (Obsidian format) | Acrescenta frontmatter (data, descrição, tags) ao documento final, para um vault do Obsidian. | `false` |
| `language` (Language) | Idioma do texto que o mod mostra: `en` (inglês) ou `pt-BR` (português do Brasil). | `en` |

## Bom saber
- Os pensadores só pensam: não têm ferramentas, então não leem seus arquivos, não mudam nada e não rodam comandos. Só o mod grava, e só esses dois arquivos dentro da sua pasta.
- Cada mensagem é uma chamada ao modelo, e cada chamada relê a conversa, então conversas longas custam mais. O limite de rodadas (4 por padrão, no máximo 8) e a contagem de tokens na tela deixam isso à vista.
- Eles trabalham só com sua ideia, a conversa e seus comentários. Não pesquisam na internet.
- Se você fechar o Claude Code no meio, o `/ideia` da próxima vez oferece continuar de onde parou.
- Com o **formato Obsidian** ligado, o documento ganha frontmatter (data, descrição, tags) e entra direto num vault. Aponte a pasta para, por exemplo, a pasta `thinking/` do seu vault.
- O botão "transformar num mod" manda ao Claude um pedido para usar a skill claude-mod-forge com o documento. Nada é enviado até você apertar.
- Uma conversa por sessão. Digitar `/ideia` de novo mostra a que está em andamento.

## Instalar
Você precisa do Claude Code 2.1.287 ou mais novo no terminal, ou 2.1.286 ou mais novo no app desktop.

1. Copie esta pasta para qualquer lugar do seu computador.
2. Dentro da cópia, renomeie a pasta `_claude-plugin` para `.claude-plugin` (com ponto no começo). Ela vem sem o ponto para os exemplos nunca carregarem sem querer.
3. Abra o Claude Code com o mod:

```bash
claude --plugin-dir caminho/para/ideia
```

Para deixar instalado de vez, peça à skill `claude-mod-forge` para empacotar ("empacote este mod").

## Conferir
Na pasta da skill (`skills/claude-mod-forge`), este comando confere o manifesto, os tipos em modo estrito e roda os 21 testes automáticos deste mod:

```bash
node scripts/check-mod.mjs examples/ideia
```

Os testes cobrem a lógica do mod e o que ele desenha no terminal e no app desktop. A aparência na sua janela vale uma olhada rápida numa sessão de verdade.

Para quem programa: [a tabela de exemplos](../README.md) lista os hooks e as chamadas da API que este mod demonstra.
