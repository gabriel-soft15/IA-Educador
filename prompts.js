// =============================================================
// PROMPTS E MODELOS
// Modelos usados pela página:
//  1. TIPOS: o que um bom prompt de cada tipo de atividade precisa ter.
//  2. FORMATOS: como a IA posterior deve entregar a atividade.
// As instruções que orientam a IA ficam no servidor, em lib/instrucoes.js.
// Para criar um tipo novo, basta copiar um bloco de TIPOS e ajustar.
// =============================================================

const ELEMENTOS_COMUNS = [
  "Ano/série e disciplina",
  "Conteúdo e objetivo de aprendizagem (o que o aluno deve aprender ou demonstrar)",
  "Nível de dificuldade adequado à turma",
  "Adaptações para alunos com dificuldades ou deficiência, se necessário",
  "Formato pronto para imprimir ou projetar"
];

const TIPOS = [
  {
    id: "lista",
    nome: "Lista de exercícios",
    descricao: "Exercícios para praticar um conteúdo",
    elementos: [
      "Quantidade de exercícios",
      "Tipos de questão (objetiva, dissertativa, cálculo, completar, verdadeiro ou falso)",
      "Progressão de dificuldade (do mais fácil ao mais difícil)",
      "Uso de situações do cotidiano dos alunos",
      "Gabarito para o professor"
    ]
  },
  {
    id: "prova",
    nome: "Prova ou avaliação",
    descricao: "Avaliação com pontuação e critérios",
    elementos: [
      "Quantidade de questões e tipos de questão",
      "Pontuação total e valor de cada questão",
      "Tempo disponível para a prova",
      "Habilidades ou conteúdos avaliados",
      "Gabarito e critérios de correção das questões abertas"
    ]
  },
  {
    id: "ludica",
    nome: "Atividade lúdica",
    descricao: "Caça-palavras, cruzadinha, ligue, jogos",
    elementos: [
      "Formato da atividade (caça-palavras, cruzadinha, ligue as colunas, bingo, jogo da memória etc.)",
      "Palavras ou conceitos que devem aparecer",
      "Tamanho da atividade (quantidade de palavras, itens ou rodadas)",
      "Instruções simples para o aluno",
      "Nível de leitura da turma",
      "Respostas para o professor"
    ]
  },
  {
    id: "texto",
    nome: "Produção de texto",
    descricao: "Proposta de redação ou escrita",
    elementos: [
      "Gênero textual (narrativa, carta, notícia, artigo de opinião etc.)",
      "Tema e situação de escrita (para quem e para quê o aluno escreve)",
      "Textos ou imagens motivadoras",
      "Extensão esperada (linhas ou parágrafos)",
      "Critérios de avaliação ou rubrica"
    ]
  },
  {
    id: "situacao",
    nome: "Situação-problema",
    descricao: "Estudo de caso ou desafio",
    elementos: [
      "Contexto realista e próximo dos alunos",
      "Perguntas orientadoras",
      "Trabalho individual ou em grupo",
      "Duração prevista",
      "Produto final esperado (resposta, cartaz, apresentação etc.)",
      "Critérios de avaliação"
    ]
  }
];

// Formatos em que a IA que vai criar a atividade deve entregar o resultado.
// "orientacao" diz ao IA Educadores o que o prompt final precisa pedir.
const FORMATOS = [
  {
    id: "texto",
    nome: "Texto na conversa",
    descricao: "Para ler, copiar e colar",
    orientacao: "A atividade deve vir como texto na própria conversa, bem organizada com títulos e numeração, pronta para o professor copiar e colar num editor de texto."
  },
  {
    id: "documento",
    nome: "Documento Word",
    descricao: "Arquivo para editar e imprimir",
    orientacao: "A IA deve gerar um arquivo Word (.docx) para download, formatado para impressão em folha A4, com cabeçalho e espaço para respostas. Se a IA não puder criar arquivos, deve entregar o texto já formatado para colar no Word ou no Google Docs."
  },
  {
    id: "pdf",
    nome: "Arquivo PDF",
    descricao: "Pronto para imprimir",
    orientacao: "A IA deve gerar um arquivo PDF para download, em folha A4, com layout limpo, cabeçalho e espaço para respostas. Se a IA não puder criar arquivos, deve entregar o texto já formatado para o professor salvar como PDF."
  },
  {
    id: "imagem",
    nome: "Imagem",
    descricao: "Folha ilustrada ou cartaz",
    orientacao: "A IA deve gerar uma imagem da atividade (folha ilustrada, em formato retrato). Como geradores de imagem erram textos longos, o prompt deve pedir pouco texto, letras grandes e legíveis, escrita em português sem erros e no máximo 4 ou 5 itens por imagem. O gabarito deve vir separado, em texto na conversa."
  }
];
