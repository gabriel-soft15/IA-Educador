# IA Educadores (versão web)

Assistente que ajuda professores a criar prompts para gerar atividades com IA.
Esta versão é feita para ser publicada na Vercel. A chave da API fica no servidor.

## Arquivos

- `index.html`, `style.css`: página e visual
- `app.js`: fluxo da página (chama o servidor em /api/gemini)
- `prompts.js`: tipos de atividade e formatos de entrega
- `api/gemini.js`: função do servidor que guarda a chave e chama o Gemini
- `lib/instrucoes.js`: instruções que orientam a IA

## Variáveis de ambiente na Vercel

- `GEMINI_API_KEY` (obrigatória): sua chave do Google AI Studio
- `GEMINI_MODELO` (opcional): nome do modelo; padrão `gemini-3.5-flash`

Depois de mudar uma variável, faça um novo deploy (Deployments > ... > Redeploy).

## Como funciona

1. O professor escolhe o tipo de atividade, o formato de entrega e descreve o pedido.
2. A IA compara o pedido com o modelo daquele tipo e pergunta o que falta.
3. Com as respostas, a IA escreve o prompt final para usar em outra IA.
