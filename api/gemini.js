// =============================================================
// FUNÇÃO DO SERVIDOR (Vercel)
// Recebe o pedido da página, junta com as instruções da IA e chama o Gemini.
// A chave fica na variável de ambiente GEMINI_API_KEY, configurada na Vercel,
// e nunca chega ao navegador de quem usa o site.
// =============================================================

const { INSTRUCAO_ANALISE, INSTRUCAO_GERACAO } = require("../lib/instrucoes");

const LIMITE_CARACTERES = 12000;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ erro: "Método não permitido." });
  }

  const chave = process.env.GEMINI_API_KEY;
  if (!chave) {
    return res.status(500).json({
      erro: "A chave da API não está configurada no servidor. Cadastre GEMINI_API_KEY nas variáveis de ambiente da Vercel."
    });
  }

  const { etapa, mensagem } = req.body || {};

  const instrucao =
    etapa === "analise" ? INSTRUCAO_ANALISE :
    etapa === "geracao" ? INSTRUCAO_GERACAO :
    null;

  if (!instrucao) {
    return res.status(400).json({ erro: "Etapa inválida." });
  }
  if (typeof mensagem !== "string" || !mensagem.trim()) {
    return res.status(400).json({ erro: "O pedido está vazio." });
  }
  if (mensagem.length > LIMITE_CARACTERES) {
    return res.status(400).json({ erro: "O pedido está muito longo. Resuma a descrição e tente de novo." });
  }

  const modelo = process.env.GEMINI_MODELO || "gemini-3.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`;

  const corpo = {
    systemInstruction: { parts: [{ text: instrucao }] },
    contents: [{ role: "user", parts: [{ text: mensagem }] }],
    generationConfig: {
      temperature: 0.5,
      responseMimeType: etapa === "analise" ? "application/json" : "text/plain"
    }
  };

  let resposta;
  try {
    resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
      body: JSON.stringify(corpo)
    });
  } catch (e) {
    return res.status(502).json({ erro: "O servidor não conseguiu se conectar ao Gemini. Tente de novo em instantes." });
  }

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const msg = (dados.error && dados.error.message) || "";
    let erro = `Erro do Gemini (${resposta.status}). Tente de novo.`;

    if (resposta.status === 400 && /api key/i.test(msg)) {
      erro = "A chave da API configurada no servidor é inválida.";
    } else if (resposta.status === 403) {
      erro = "A chave da API configurada no servidor não tem permissão.";
    } else if (resposta.status === 404) {
      erro = "Modelo não encontrado. Confira a variável GEMINI_MODELO na Vercel.";
    } else if (resposta.status === 429) {
      erro = "Muitas pessoas usando ao mesmo tempo e o limite da API foi atingido. Espere um minuto e tente de novo.";
    } else if (resposta.status >= 500) {
      erro = "O serviço do Gemini está instável no momento. Tente de novo em instantes.";
    }

    console.error("Erro do Gemini:", resposta.status, msg);
    return res.status(resposta.status === 429 ? 429 : 502).json({ erro });
  }

  const partes = (dados.candidates && dados.candidates[0] && dados.candidates[0].content && dados.candidates[0].content.parts) || [];
  const texto = partes.map((p) => p.text || "").join("").trim();

  if (!texto) {
    return res.status(502).json({ erro: "A IA não devolveu resposta. Tente reformular o pedido." });
  }

  return res.status(200).json({ texto });
};
