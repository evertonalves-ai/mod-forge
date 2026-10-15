# claude-mod-forge (resumo em português)

Skill do Claude Code que cria [mods](https://code.claude.com/docs/en/plugins/mods/overview) a partir de uma
descrição em linguagem comum. Você diz o que quer ("um painel com o status do meu build", "me pergunte antes de
qualquer force push", "mostre o uso do contexto acima do prompt"), responde algumas perguntas e recebe o mod
pronto, com código, testes, documentação e instruções de instalação.

Mod é um plugin do Claude Code escrito em JavaScript ou TypeScript que reage a eventos (uma ferramenta prestes a
rodar, um prompt enviado, uma parte da tela sendo desenhada). Com ele dá para abrir painéis laterais, mostrar uma
faixa acima do prompt, criar comandos `/`, mudar o visual de elementos do próprio Claude Code e bloquear ou
segurar operações arriscadas.

## O que a skill faz

| Você pede | A skill |
|---|---|
| "Cria um mod que…" | entrevista, monta a especificação, escreve o código e os testes, valida e entrega |
| "Planeja antes de codar" | só especificação, plano de testes e revisão de segurança |
| "Meu painel não aparece" | investiga a causa com o validador e o log, corrige e prova com um teste |
| "Adiciona um filtro no meu mod" | cria testes do comportamento atual antes de mexer, para não quebrar nada |
| "Esse mod é seguro?" | audita o que o mod consegue acessar (arquivos, processos, rede, segredos) |
| "Testa meu mod" | roda validação, checagem de tipos e testes, e diz o que ainda falta ver numa sessão real |
| "Quero compartilhar com a equipe" | prepara o pacote, o marketplace e as instruções de instalação |
| "Continua o mod de ontem" | lê a especificação e as decisões salvas na pasta do mod e segue de onde parou |

Você não precisa saber o nome do modo. A skill escolhe pelo que você escreveu.

## Como funciona a entrevista

Antes de perguntar, a skill tira do seu pedido tudo o que der. Depois pergunta só o que falta, no máximo três
perguntas por rodada, sempre com uma opção recomendada. Um pedido pequeno e claro costuma não ter pergunta
nenhuma. Um painel costuma ter uma ou duas rodadas. Um mod que bloqueia, aprova, roda processos, acessa a
internet ou lida com senhas ganha uma rodada só de segurança. Se você responder "decide você", ela escolhe
padrões sensatos e anota cada um como premissa.

## Regras que ela segue

- Confere cada evento e método na declaração de tipos da sua versão do Claude Code antes de usar.
- Só mostra números que vêm de uma fonte real da API. Não inventa dado de cobrança nem de cota.
- Todo botão, aba e campo faz alguma coisa e tem teste.
- Mod que bloqueia falha fechado: se der erro, a operação não roda. Pedido de "aprovar tudo" recebe uma
  explicação do risco e uma alternativa mais restrita antes de qualquer código.
- Nenhum token ou senha fica no código, nos testes ou nos logs.
- Diz com clareza o que foi testado e o que não foi. Os testes provam a lógica e o que o mod desenha, mas a
  aparência final precisa ser vista numa sessão real.

## O que vem junto

- 10 mods de exemplo que passam em validação, checagem de tipos e testes (69 no total): painel com abas, faixa
  com o uso do contexto, guarda de comandos perigosos (Bash e PowerShell), comando `/recap`, personalização do
  spinner, aprovação automática restrita a uma lista, consulta a uma API com token seguro, log de ferramentas em
  arquivo, painel de botões que enviam prompts e gráfico de contexto em SVG no app desktop.
- Um script que roda as três checagens de uma vez sem escrever nada na pasta do mod.
- Um catálogo de ideias de mods, montado a partir de listas da comunidade.
- Os 10 cenários de teste de aceitação da própria skill, com os resultados.

## Instalação

Como plugin, num terminal do Claude Code:
```
/plugin install mod-forge@evertonalves-ai/claude-mod-forge
```
O repositório é privado, então sua conta do GitHub precisa ter acesso.

Requer Claude Code 2.1.287 ou mais novo no terminal (2.1.286 no app desktop). Testado na 2.1.294.

O README principal, em inglês, tem os detalhes técnicos: [README.md](README.md).
