// =============================================================
// IA EDUCADORES - lógica principal
// Versão web (Vercel): a chave da API fica no servidor.
// Fluxo: pedido do professor -> IA analisa e pergunta o que falta
//        -> professor responde -> IA gera o prompt final
// =============================================================

(function () {
  const $ = (id) => document.getElementById(id);

  // Guarda o pedido atual e as perguntas feitas pela IA
  let pedidoAtual = null;
  let perguntasAtuais = [];
  let ultimasRespostas = [];

  // ---------- Inicialização ----------

  function renderizarTipos() {
    const lista = $("lista-tipos");
    TIPOS.forEach((tipo) => {
      const opcao = document.createElement("label");
      opcao.className = "tipo-opcao";
      opcao.innerHTML = `
        <input type="radio" name="tipo" value="${tipo.id}">
        <span class="nome"></span>
        <span class="desc"></span>`;
      opcao.querySelector(".nome").textContent = tipo.nome;
      opcao.querySelector(".desc").textContent = tipo.descricao;
      lista.appendChild(opcao);
    });
  }

  function renderizarFormatos() {
    const lista = $("lista-formatos");
    FORMATOS.forEach((formato, i) => {
      const opcao = document.createElement("label");
      opcao.className = "tipo-opcao";
      opcao.innerHTML = `
        <input type="radio" name="formato" value="${formato.id}" ${i === 0 ? "checked" : ""}>
        <span class="nome"></span>
        <span class="desc"></span>`;
      opcao.querySelector(".nome").textContent = formato.nome;
      opcao.querySelector(".desc").textContent = formato.descricao;
      lista.appendChild(opcao);
    });
  }

  // ---------- Comunicação com a IA ----------

  // A página não fala direto com o Gemini: ela chama a função do servidor
  // (api/gemini.js), que guarda a chave da API em segredo.
  async function chamarIA(etapa, mensagem) {
    if (location.protocol === "file:") {
      throw new Error("Esta versão precisa estar publicada na Vercel. Para usar no computador sem publicar, use a versão local.");
    }

    let resposta;
    try {
      resposta = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa, mensagem })
      });
    } catch (e) {
      throw new Error("Não foi possível conectar ao servidor. Verifique a internet e tente de novo.");
    }

    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      throw new Error(dados.erro || `Erro no servidor (${resposta.status}). Tente de novo.`);
    }
    if (!dados.texto) {
      throw new Error("A IA não devolveu resposta. Tente reformular o pedido.");
    }
    return dados.texto;
  }

  function lerJSON(texto) {
    const limpo = texto.replace(/```json|```/g, "").trim();
    return JSON.parse(limpo);
  }

  // Monta o contexto que a IA recebe nas duas etapas
  function montarContexto(pedido) {
    const elementos = [...pedido.tipo.elementos, ...ELEMENTOS_COMUNS]
      .map((e) => `- ${e}`)
      .join("\n");

    return [
      `TIPO DE ATIVIDADE: ${pedido.tipo.nome}`,
      ``,
      `ELEMENTOS QUE UM BOM PROMPT DESTE TIPO PRECISA TER:`,
      elementos,
      ``,
      `ANO/SÉRIE: ${pedido.serie || "não informado"}`,
      `DISCIPLINA: ${pedido.disciplina || "não informada"}`,
      ``,
      `FORMATO DE ENTREGA: ${pedido.formato.nome}`,
      `ORIENTAÇÃO PARA O FORMATO: ${pedido.formato.orientacao}`,
      ``,
      `PEDIDO DO PROFESSOR:`,
      pedido.descricao
    ].join("\n");
  }

  // ---------- Interface: estados e mensagens ----------

  function mostrarErro(id, mensagem) {
    const el = $(id);
    el.textContent = mensagem;
    el.hidden = !mensagem;
  }

  function limparErros() {
    ["erro-1", "erro-2", "erro-3"].forEach((id) => mostrarErro(id, ""));
  }

  function ocupado(botao, textoOcupado, statusTexto) {
    botao.dataset.textoOriginal = botao.textContent;
    botao.textContent = textoOcupado;
    botao.disabled = true;
    $("status").textContent = statusTexto;
  }

  function livre(botao) {
    botao.textContent = botao.dataset.textoOriginal || botao.textContent;
    botao.disabled = false;
    $("status").textContent = "";
  }

  // ---------- Etapa 1: analisar o pedido ----------

  async function analisarPedido() {
    limparErros();


    const tipoEscolhido = document.querySelector('input[name="tipo"]:checked');
    const descricao = $("descricao").value.trim();

    if (!tipoEscolhido) {
      mostrarErro("erro-1", "Escolha um tipo de atividade.");
      return;
    }
    if (descricao.length < 10) {
      mostrarErro("erro-1", "Descreva a atividade com um pouco mais de detalhe.");
      $("descricao").focus();
      return;
    }

    pedidoAtual = {
      tipo: TIPOS.find((t) => t.id === tipoEscolhido.value),
      serie: $("serie").value.trim(),
      disciplina: $("disciplina").value.trim(),
      formato: FORMATOS.find(
        (f) => f.id === (document.querySelector('input[name="formato"]:checked') || {}).value
      ) || FORMATOS[0],
      descricao
    };

    $("etapa-2").hidden = true;
    $("etapa-3").hidden = true;

    const botao = $("btn-analisar");
    ocupado(botao, "Analisando…", "A IA está lendo o seu pedido.");

    try {
      const texto = await chamarIA("analise", montarContexto(pedidoAtual));
      const analise = lerJSON(texto);
      perguntasAtuais = Array.isArray(analise.perguntas) ? analise.perguntas.slice(0, 4) : [];

      if (perguntasAtuais.length === 0) {
        // Pedido completo: vai direto para o prompt
        livre(botao);
        await gerarPrompt([], botao);
        return;
      }

      $("entendimento").textContent = analise.entendimento || "";
      $("entendimento").hidden = !analise.entendimento;
      renderizarPerguntas(perguntasAtuais);
      $("etapa-2").hidden = false;
      $("etapa-2").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (erro) {
      const msg = erro instanceof SyntaxError
        ? "A IA respondeu num formato inesperado. Clique em Analisar pedido de novo."
        : erro.message;
      mostrarErro("erro-1", msg);
    } finally {
      livre(botao);
    }
  }

  // ---------- Etapa 2: perguntas ----------

  function renderizarPerguntas(perguntas) {
    const area = $("perguntas");
    area.innerHTML = "";

    perguntas.forEach((p, i) => {
      const bloco = document.createElement("div");
      bloco.className = "pergunta";

      const label = document.createElement("label");
      label.htmlFor = `resp-${i}`;
      label.textContent = p.pergunta;

      const input = document.createElement("input");
      input.type = "text";
      input.id = `resp-${i}`;
      input.autocomplete = "off";

      bloco.append(label, input);

      if (Array.isArray(p.sugestoes) && p.sugestoes.length) {
        const sugestoes = document.createElement("div");
        sugestoes.className = "sugestoes";

        p.sugestoes.slice(0, 4).forEach((s) => {
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "chip";
          chip.textContent = s;
          chip.setAttribute("aria-pressed", "false");
          chip.addEventListener("click", () => {
            input.value = s;
            sugestoes.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
            chip.setAttribute("aria-pressed", "true");
          });
          sugestoes.appendChild(chip);
        });

        // Se o professor digitar, desmarca as sugestões
        input.addEventListener("input", () => {
          sugestoes.querySelectorAll(".chip").forEach((c) => {
            c.setAttribute("aria-pressed", String(c.textContent === input.value));
          });
        });

        bloco.appendChild(sugestoes);
      }

      area.appendChild(bloco);
    });
  }

  function coletarRespostas() {
    return perguntasAtuais.map((p, i) => ({
      pergunta: p.pergunta,
      resposta: ($(`resp-${i}`)?.value || "").trim()
    }));
  }

  // ---------- Etapa 3: gerar o prompt ----------

  async function gerarPrompt(respostas, botao) {
    limparErros();
    ultimasRespostas = respostas;

    const complementos = respostas.length
      ? respostas
          .map((r) => `- ${r.pergunta}\n  Resposta: ${r.resposta || "sem resposta (use um padrão adequado)"}`)
          .join("\n")
      : "- Nenhuma (o professor não respondeu perguntas adicionais)";

    const mensagem = `${montarContexto(pedidoAtual)}\n\nINFORMAÇÕES COMPLEMENTARES DO PROFESSOR:\n${complementos}`;

    ocupado(botao, "Gerando…", "A IA está escrevendo o seu prompt.");

    try {
      const prompt = await chamarIA("geracao", mensagem);
      $("prompt-final").textContent = prompt;
      $("etapa-3").hidden = false;
      $("etapa-3").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (erro) {
      const alvo = $("etapa-3").hidden ? ($("etapa-2").hidden ? "erro-1" : "erro-2") : "erro-3";
      mostrarErro(alvo, erro.message);
    } finally {
      livre(botao);
    }
  }

  // ---------- Ações finais ----------

  async function copiarPrompt() {
    const texto = $("prompt-final").textContent;
    const botao = $("btn-copiar");
    try {
      await navigator.clipboard.writeText(texto);
    } catch (e) {
      // Plano B para navegadores que bloqueiam a área de transferência
      const area = document.createElement("textarea");
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    botao.textContent = "Prompt copiado";
    setTimeout(() => (botao.textContent = "Copiar prompt"), 2000);
  }

  function novoPedido() {
    pedidoAtual = null;
    perguntasAtuais = [];
    ultimasRespostas = [];
    $("descricao").value = "";
    $("perguntas").innerHTML = "";
    $("prompt-final").textContent = "";
    $("etapa-2").hidden = true;
    $("etapa-3").hidden = true;
    limparErros();
    window.scrollTo({ top: 0, behavior: "smooth" });
    $("descricao").focus();
  }

  // ---------- Eventos ----------

  document.addEventListener("DOMContentLoaded", () => {
    renderizarTipos();
    renderizarFormatos();

    $("btn-analisar").addEventListener("click", analisarPedido);
    $("btn-gerar").addEventListener("click", () => gerarPrompt(coletarRespostas(), $("btn-gerar")));
    $("btn-pular").addEventListener("click", () => gerarPrompt([], $("btn-pular")));
    $("btn-copiar").addEventListener("click", copiarPrompt);
    $("btn-regerar").addEventListener("click", () => gerarPrompt(ultimasRespostas, $("btn-regerar")));
    $("btn-novo").addEventListener("click", novoPedido);
  });
})();
