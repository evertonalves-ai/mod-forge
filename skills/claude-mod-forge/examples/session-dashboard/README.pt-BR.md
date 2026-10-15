# session-dashboard

[Read in English](README.md)

**Um painel que mostra o que o Claude fez nesta sessão, com um bloco de notas que continua lá na próxima vez.**

## O que é um mod?
O Claude Code é o assistente da Anthropic para trabalhar com código, no terminal ou no app desktop do Claude. Um **mod** é um pequeno complemento para ele: pode acrescentar um painel, uma faixa acima da caixa onde você digita, um `/comando` novo, ou uma regra que confere o que o Claude vai fazer. Esta pasta é um mod completo que você pode instalar e usar do jeito que está, ou copiar como ponto de partida.

## O que ele faz
Enquanto trabalha, o Claude usa ferramentas: lê arquivos, edita, roda comandos. Normalmente isso passa rolando na tela e some. Este mod abre um painel com um resumo que você consulta quando quiser: quantas ferramentas o Claude usou, quantas deram erro, quantos turnos (uma pergunta sua e a resposta dele formam um turno) e quanto tempo cada um levou. Também tem um bloco de notas, e as notas continuam lá quando você abrir o Claude Code de novo.

## O que aparece na tela
- **Linha do topo**: o título do painel e se o Claude está trabalhando agora ("◌ 2 rodando") ou esperando ("● ocioso").
- **Aba Visão geral**: quatro cartões (Ferramentas, Erros, Turnos, Turno médio), um gráfico pequeno com a duração de cada turno e as ferramentas mais usadas.
- **Aba Atividade**: a lista das últimas ferramentas usadas, da mais nova para a mais antiga, com um filtro para ver só uma delas (por exemplo, só `Bash`).
- **Aba Notas**: um campo para escrever uma nota e a lista das notas salvas.

## Como usar
1. Digite `/dashboard` e tecle Enter. O painel abre.
2. Tecle `1`, `2` ou `3` para trocar de aba.
3. Na aba Notas, escreva a nota e tecle Enter para salvar. O `×` ao lado de uma nota apaga essa nota.
4. Tecle `Esc` para voltar a digitar seu pedido. O painel continua se atualizando enquanto o Claude trabalha.

## Atalhos de teclado
| Tecla | O que faz |
|---|---|
| `1` `2` `3` | Abas Visão geral, Atividade, Notas |
| `Tab` | Passa de um botão ou campo para o próximo |
| `c` | Limpa a lista de atividade (aba Atividade) |
| `Enter` | Salva a nota digitada (aba Notas) |
| `Esc` | Sai do painel e volta para o prompt |

## Comandos
| Digite | O que faz |
|---|---|
| `/dashboard` | Abre o painel |

## Configurações
O Claude Code pede estas informações quando você ativa o mod. Para mudar depois, abra `/config` e procure o mod pelo nome. Os nomes das opções aparecem em inglês.

| Opção | O que significa | Padrão |
|---|---|---|
| `language` (Language) | Idioma do texto que o mod mostra: `en` (inglês) ou `pt-BR` (português do Brasil). | `en` |

## Bom saber
- As contagens começam do zero a cada sessão nova. Só as notas ficam guardadas de uma sessão para outra.
- O comando `/clear` zera as contagens, como se fosse uma sessão nova.

## Instalar
Você precisa do Claude Code 2.1.287 ou mais novo no terminal, ou 2.1.286 ou mais novo no app desktop.

1. Copie esta pasta para qualquer lugar do seu computador.
2. Dentro da cópia, renomeie a pasta `_claude-plugin` para `.claude-plugin` (com ponto no começo). Ela vem sem o ponto para os exemplos nunca carregarem sem querer.
3. Abra o Claude Code com o mod:

```bash
claude --plugin-dir caminho/para/session-dashboard
```

Para deixar instalado de vez, peça à skill `claude-mod-forge` para empacotar ("empacote este mod").

## Conferir
Na pasta da skill (`skills/claude-mod-forge`), este comando confere o manifesto, os tipos em modo estrito e roda os 7 testes automáticos deste mod:

```bash
node scripts/check-mod.mjs examples/session-dashboard
```

Os testes cobrem a lógica do mod e o que ele desenha no terminal e no app desktop. A aparência na sua janela vale uma olhada rápida numa sessão de verdade.

Para quem programa: [a tabela de exemplos](../README.md) lista os hooks e as chamadas da API que este mod demonstra.
