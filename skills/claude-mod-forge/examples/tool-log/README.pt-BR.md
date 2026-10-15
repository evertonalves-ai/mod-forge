# tool-log

[Read in English](README.md)

**Guarda um registro escrito, numa pasta que você escolhe, de cada ferramenta que o Claude usou, com os segredos escondidos.**

## O que é um mod?
O Claude Code é o assistente da Anthropic para trabalhar com código, no terminal ou no app desktop do Claude. Um **mod** é um pequeno complemento para ele: pode acrescentar um painel, uma faixa acima da caixa onde você digita, um `/comando` novo, ou uma regra que confere o que o Claude vai fazer. Esta pasta é um mod completo que você pode instalar e usar do jeito que está, ou copiar como ponto de partida.

## O que ele faz
Às vezes você quer saber depois o que exatamente o Claude fez: quais comandos rodou, quais arquivos mexeu. Este mod escreve uma linha por ferramenta usada num arquivo, um arquivo por sessão. Cada linha diz qual ferramenta, quando, e um resumo curto do que foi pedido. O que parecer senha ou token vira `***` antes de ir para o arquivo.

## O que aparece na tela
- Nada na tela. O registro vai para arquivos com o nome da sessão, terminados em `.jsonl` (uma linha de dados por ferramenta).

## Como usar
1. Nas configurações, escolha a **Log folder** (pasta do registro). Prefira uma fora dos seus projetos, para os registros nunca irem parar no Git sem querer.
2. Use o Claude normalmente. Abra a pasta e leia os arquivos em qualquer editor de texto.
3. Para pausar sem desinstalar, desligue **Enabled**.

## Atalhos de teclado
Nenhum próprio.

## Comandos
Nenhum. Ele funciona sozinho.

## Configurações
O Claude Code pede estas informações quando você ativa o mod. Para mudar depois, abra `/config` e procure o mod pelo nome. Os nomes das opções aparecem em inglês.

| Opção | O que significa | Padrão |
|---|---|---|
| `logDir` (Log folder) | Pasta dos arquivos de registro. Prefira uma fora dos seus projetos. | (vazio) |
| `enabled` (Enabled) | Desliga o mod sem desinstalar. | `true` |

## Bom saber
- Cada resumo é cortado em 300 caracteres. Conteúdo de arquivo e resultado das ferramentas nunca são gravados.
- Quando um arquivo chega a 2 MB, começa outro (`-part1`, `-part2`…). Um arquivo que já existe nunca é sobrescrito.
- Esconder segredos é um esforço de boa-fé: pega as formas comuns, não todas as possíveis. Mantenha a pasta privada.
- Se a gravação falhar, o Claude continua trabalhando normalmente; o registro nunca trava sua sessão.
- O registro é escrito em inglês (este mod não tem a opção de idioma).

## Instalar
Você precisa do Claude Code 2.1.287 ou mais novo no terminal, ou 2.1.286 ou mais novo no app desktop.

1. Copie esta pasta para qualquer lugar do seu computador.
2. Dentro da cópia, renomeie a pasta `_claude-plugin` para `.claude-plugin` (com ponto no começo). Ela vem sem o ponto para os exemplos nunca carregarem sem querer.
3. Abra o Claude Code com o mod:

```bash
claude --plugin-dir caminho/para/tool-log
```

Para deixar instalado de vez, peça à skill `claude-mod-forge` para empacotar ("empacote este mod").

## Conferir
Na pasta da skill (`skills/claude-mod-forge`), este comando confere o manifesto, os tipos em modo estrito e roda os 16 testes automáticos deste mod:

```bash
node scripts/check-mod.mjs examples/tool-log
```

Os testes cobrem a lógica do mod e o que ele desenha no terminal e no app desktop. A aparência na sua janela vale uma olhada rápida numa sessão de verdade.

Para quem programa: [a tabela de exemplos](../README.md) lista os hooks e as chamadas da API que este mod demonstra.
