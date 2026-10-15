# claude-mod-forge (em português)

[![check](https://github.com/evertonalves-ai/mod-forge/actions/workflows/check.yml/badge.svg)](https://github.com/evertonalves-ai/mod-forge/actions/workflows/check.yml)

[Read in English](README.md)

**Descreva em palavras simples o complemento que você quer para o Claude Code. Esta skill faz as perguntas
necessárias, escreve o código, testa e entrega pronto para instalar.**

## Primeiro, os termos

- **Claude Code** é o assistente da Anthropic para trabalhar com código. Roda no terminal e no app desktop do
  Claude: você escreve o que quer e ele lê arquivos, edita, roda comandos.
- **Mod** é um pequeno complemento para o Claude Code. Ele pode abrir um painel, mostrar uma faixa acima da
  caixa onde você digita, criar um comando novo como `/recap`, mudar o visual de partes do próprio Claude Code,
  ou conferir o que o Claude vai fazer e segurar o que for arriscado.
- **Skill** é um conjunto de instruções que ensina o Claude a fazer um tipo de trabalho do jeito certo. Esta
  skill ensina o Claude a construir mods.

Escrever um mod do zero exige conhecer a API de mods, os eventos, os componentes de tela e o kit de testes. Com
esta skill você só descreve o que quer.

## Um exemplo de ponta a ponta

1. Você escreve: "quero que o Claude me pergunte antes de qualquer force push".
2. A skill entende que é um mod de proteção. Como proteção mexe com segurança, ela faz uma rodada curta de
   perguntas, cada uma com uma opção recomendada. Por exemplo: "se a pergunta não puder aparecer, o comando deve
   ser recusado? (recomendado: sim)".
3. Ela escreve a especificação, o código e os testes.
4. Roda três checagens: o manifesto do plugin, os tipos em modo estrito e os testes automáticos.
5. Entrega o mod com instruções de instalação e diz com clareza o que foi testado e o que vale você conferir
   na tela.

## O que você pode pedir

| Você pede | A skill |
|---|---|
| "Cria um mod que…" | entrevista, monta a especificação, escreve código e testes, valida e entrega |
| "Planeja antes de codar" | entrega só a especificação, o plano de testes e a revisão de segurança |
| "Meu painel não aparece" | procura a causa com o validador e o log, corrige e prova com um teste |
| "Adiciona um filtro no meu mod" | cria testes do comportamento atual antes de mexer, para não quebrar nada |
| "Esse mod é seguro?" | audita o que o mod consegue acessar: arquivos, processos, internet, senhas |
| "Testa meu mod" | roda as checagens e diz o que ainda falta ver numa sessão real |
| "Quero compartilhar com a equipe" | prepara o pacote, o marketplace e as instruções de instalação |
| "Continua o mod de ontem" | lê a especificação e as decisões salvas na pasta do mod e segue de onde parou |

Não precisa saber o nome do modo. A skill escolhe pelo que você escreveu.

## Como funciona a entrevista

Antes de perguntar, a skill tira do seu pedido tudo o que der. Depois pergunta só o que falta: no máximo três
perguntas por vez, no seu idioma, sempre com uma opção recomendada. Um pedido pequeno e claro costuma não ter
pergunta nenhuma. Um painel costuma ter uma ou duas rodadas. Um mod que bloqueia, aprova, roda programas, acessa
a internet ou lida com senhas ganha uma rodada só de segurança. Se você não souber responder, ela explica as
opções. Se disser "decide você", ela escolhe padrões sensatos e anota cada um.

## Regras que ela segue

- Confere cada recurso na declaração de tipos da sua versão do Claude Code antes de usar.
- Só mostra números que vêm de uma fonte real. Não inventa dado de cobrança nem de cota.
- Todo botão, aba e campo faz alguma coisa e tem teste.
- Mod de proteção falha fechado: se der erro, a operação não roda. Pedido de "aprovar tudo" recebe uma
  explicação do risco e uma alternativa mais restrita antes de qualquer código.
- Nenhum token ou senha fica no código, nos testes ou nos registros.
- Diz o que foi testado e o que não foi. Os testes provam a lógica e o que o mod desenha; a aparência final na
  sua janela precisa ser vista numa sessão de verdade.

## Os 12 mods de exemplo

Vêm junto com a skill, prontos para usar ou copiar. Cada um tem um README em português explicando o que faz,
o que aparece na tela, atalhos e como instalar.

| Mod | Em uma frase |
|---|---|
| [session-dashboard](skills/claude-mod-forge/examples/session-dashboard/README.pt-BR.md) | Painel com o que o Claude fez na sessão, mais um bloco de notas que fica salvo |
| [context-band](skills/claude-mod-forge/examples/context-band/README.pt-BR.md) | Faixa acima do prompt com o quanto da memória da conversa já foi usado |
| [context-chart](skills/claude-mod-forge/examples/context-chart/README.pt-BR.md) | Gráfico do uso dessa memória, turno a turno |
| [shell-guard](skills/claude-mod-forge/examples/shell-guard/README.pt-BR.md) | Segura comandos perigosos até você autorizar e protege arquivos de senhas e chaves |
| [scoped-approve](skills/claude-mod-forge/examples/scoped-approve/README.pt-BR.md) | Deixa uma lista curta de comandos de confiança rodar sem perguntar |
| [git-recap](skills/claude-mod-forge/examples/git-recap/README.pt-BR.md) | `/recap` lista seus commits recentes na hora, sem gastar o Claude |
| [spinner-counter](skills/claude-mod-forge/examples/spinner-counter/README.pt-BR.md) | Mostra quantas ferramentas o Claude usou enquanto ele pensa |
| [api-status](skills/claude-mod-forge/examples/api-status/README.pt-BR.md) | Faixa com um valor ao vivo de um serviço da internet, como o status de um deploy |
| [tool-log](skills/claude-mod-forge/examples/tool-log/README.pt-BR.md) | Registro em arquivo de cada ferramenta usada, com segredos escondidos |
| [prompt-buttons](skills/claude-mod-forge/examples/prompt-buttons/README.pt-BR.md) | Botões seus que mandam ao Claude, com uma tecla, pedidos que você repete |
| [agent-board](skills/claude-mod-forge/examples/agent-board/README.pt-BR.md) | Quadro ao vivo dos agentes auxiliares da sessão e do status de cada um |
| [agent-dialogue](skills/claude-mod-forge/examples/agent-dialogue/README.pt-BR.md) | A conversa entre dois agentes que revisam um trabalho, ao vivo |

Todos passam nas três checagens (89 testes no total). Os que mostram texto têm a opção `language`: inglês por
padrão, ou `pt-BR`.

## Instalação

Você precisa do Claude Code 2.1.287 ou mais novo no terminal, ou 2.1.286 ou mais novo no app desktop. Testado na
2.1.294.

**Como plugin** (o jeito mais simples). Dentro do Claude Code, digite um comando de cada vez:
```
/plugin marketplace add evertonalves-ai/mod-forge
/plugin install mod-forge@mod-forge
```
Quando perguntar o escopo, "user" deixa a skill disponível em todos os seus projetos.

**Como skill pessoal**, a partir de uma cópia do repositório:
```bash
git clone https://github.com/evertonalves-ai/mod-forge.git
# macOS / Linux
ln -s "$PWD/mod-forge/skills/claude-mod-forge" ~/.claude/skills/claude-mod-forge
# Windows (PowerShell); a junction não precisa de administrador
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-mod-forge" -Target "$PWD\mod-forge\skills\claude-mod-forge"
```

## Usar

Abra o Claude Code e descreva o que quer, do seu jeito: "faz um mod que mostra o status do meu build num painel".
A skill entra sozinha quando o assunto é mod, painel, faixa acima do prompt, comando novo ou proteção de
comandos. Como plugin, você também pode chamar pelo nome: `/mod-forge:claude-mod-forge`.

Você também pode usar o Node.js para conferir um mod sozinho, sem pedir nada ao Claude:
```bash
node skills/claude-mod-forge/scripts/check-mod.mjs caminho/do/meu-mod
```
O script copia o mod para uma pasta temporária (nada é escrito na sua) e roda as três checagens.

## Limites

- Os testes provam a lógica e o que o mod desenha, não como o seu terminal pinta isso. Olhe numa sessão real
  (`claude --plugin-dir <pasta-do-mod>`).
- A API de mods é nova e muda entre versões. A skill confia na declaração de tipos da sua versão, não nas
  próprias anotações.
- Só o terminal e o app desktop desenham mods. No VS Code, no `claude -p`, no SDK e na nuvem os mods rodam,
  mas sem nada na tela.

## Segurança e contribuições

- Achou uma falha de segurança? Veja [SECURITY.md](SECURITY.md).
- Quer sugerir um mod de exemplo ou corrigir algo? Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

MIT. Os mods de exemplo são trabalho original. A documentação oficial é linkada, não copiada. Este é um
projeto da comunidade, sem vínculo nem endosso da Anthropic.
