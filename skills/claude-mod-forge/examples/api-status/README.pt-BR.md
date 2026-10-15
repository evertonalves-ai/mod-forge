# api-status

[Read in English](README.md)

**Uma faixa acima do prompt com um valor ao vivo vindo de um serviço da internet que você escolhe, como o status de um deploy.**

## O que é um mod?
O Claude Code é o assistente da Anthropic para trabalhar com código, no terminal ou no app desktop do Claude. Um **mod** é um pequeno complemento para ele: pode acrescentar um painel, uma faixa acima da caixa onde você digita, um `/comando` novo, ou uma regra que confere o que o Claude vai fazer. Esta pasta é um mod completo que você pode instalar e usar do jeito que está, ou copiar como ponto de partida.

## O que ele faz
Muitos serviços publicam o próprio status como dados num endereço da web (uma API). Um serviço de deploy, por exemplo, pode responder `{"status": "ok"}`. Este mod lê um valor desse endereço e deixa à vista acima do prompt, para você não precisar abrir o navegador para conferir. Se o serviço pedir um token (uma espécie de senha), o mod guarda no armazenamento seguro do Claude Code.

## O que aparece na tela
- Uma linha acima do prompt com o valor e o horário da leitura: "API: ok às 14:32".
- Durante a leitura: "◌ carregando…". Se o serviço não responder: "✗ indisponível", seguido do último valor que funcionou.
- Dois botões: "atualizar" e "ocultar".

## Como usar
1. Abra as configurações (`/config` e depois o item api-status).
2. Em **Status URL**, cole o endereço. Ele precisa começar com `https://` (`http://` só é aceito para o seu próprio computador, `localhost`).
3. Em **JSON field**, escreva qual valor mostrar. Para `{"data": {"deploy": {"state": "ok"}}}` você escreveria `data.deploy.state`.
4. Se o serviço pedir token, cole em **API token**. Ele fica guardado com segurança e nunca aparece na tela.
5. Para atualizar sozinho, coloque 15 segundos ou mais em **Refresh every**. Com 0, só atualiza quando você pedir.

## Atalhos de teclado
| Tecla | O que faz |
|---|---|
| `r` | Atualiza agora |
| `Tab` e depois `Enter` | Chega no botão "ocultar" e aperta |

## Comandos
| Digite | O que faz |
|---|---|
| `/api-status` | Atualiza e mostra o valor em texto (também traz a faixa de volta se estiver oculta) |

## Configurações
O Claude Code pede estas informações quando você ativa o mod. Para mudar depois, abra `/config` e procure o mod pelo nome. Os nomes das opções aparecem em inglês.

| Opção | O que significa | Padrão |
|---|---|---|
| `url` (Status URL) | O endereço a ler. Precisa começar com `https://` (`http://` só para `localhost`). | (vazio) |
| `field` (JSON field) | Qual valor da resposta mostrar, como caminho com pontos: `status` ou `data.deploy.state`. | `status` |
| `token` (API token) | Token opcional enviado ao serviço. Fica no armazenamento seguro, nunca aparece. | (armazenamento seguro) |
| `refreshSeconds` (Refresh every (seconds)) | Atualiza sozinho a cada N segundos (15 ou mais). `0` significa só quando você pedir. | `0` |
| `language` (Language) | Idioma do texto que o mod mostra: `en` (inglês) ou `pt-BR` (português do Brasil). | `en` |

## Bom saber
- Nunca coloque senha ou token dentro da URL; o mod recusa e pede para usar o campo de token.
- Se a URL estiver faltando ou errada, a faixa diz exatamente o que corrigir.
- O intervalo automático mínimo é de 15 segundos, para não encher o serviço de pedidos.

## Instalar
Você precisa do Claude Code 2.1.287 ou mais novo no terminal, ou 2.1.286 ou mais novo no app desktop.

1. Copie esta pasta para qualquer lugar do seu computador.
2. Dentro da cópia, renomeie a pasta `_claude-plugin` para `.claude-plugin` (com ponto no começo). Ela vem sem o ponto para os exemplos nunca carregarem sem querer.
3. Abra o Claude Code com o mod:

```bash
claude --plugin-dir caminho/para/api-status
```

Para deixar instalado de vez, peça à skill `claude-mod-forge` para empacotar ("empacote este mod").

## Conferir
Na pasta da skill (`skills/claude-mod-forge`), este comando confere o manifesto, os tipos em modo estrito e roda os 9 testes automáticos deste mod:

```bash
node scripts/check-mod.mjs examples/api-status
```

Os testes cobrem a lógica do mod e o que ele desenha no terminal e no app desktop. A aparência na sua janela vale uma olhada rápida numa sessão de verdade.

Para quem programa: [a tabela de exemplos](../README.md) lista os hooks e as chamadas da API que este mod demonstra.
