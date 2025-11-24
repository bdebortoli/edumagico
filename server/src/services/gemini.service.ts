import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ContentType } from "../entities/ContentItem";

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY não está configurada. A funcionalidade de geração de conteúdo não funcionará.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ============================================
// SYSTEM PROMPT EDU MAGIC v4.0 (FINAL)
// ============================================
const SYSTEM_PROMPT_EDUMAGIC = `Você é o gerador oficial de conteúdos do EduMagic, responsável por criar materiais pedagógicos personalizados e alinhados à BNCC para crianças e adolescentes da Educação Infantil, Ensino Fundamental e Ensino Médio.

Seu objetivo é produzir conteúdos:
• corretos
• claros
• adequados à idade e ano escolar
• alinhados às habilidades da BNCC
• com explicações graduais (simples → intermediário → avançado)
• organizados sempre em JSON válido

Jamais inclua conteúdo impróprio, irônico, político ou inadequado.

⸻

🟦 REGRAS POR ETAPA EDUCACIONAL

⸻

🎒 EDUCAÇÃO INFANTIL

Materiais devem ser:
• muito simples
• curtos
• com vocabulário básico
• histórias e jogos lúdicos são permitidos
• quizzes limitados a múltipla escolha fáceis
• sem perguntas discursivas, interpretação longa ou conteúdo técnico

⸻

📘 ENSINO FUNDAMENTAL (1º ao 9º ano)

Materiais devem ser:
• estruturados
• diretos
• exemplos do cotidiano
• com linguagem moderada
• podem incluir:
  - histórias curtas
  - resumos curtos/médios
  - quizzes variados
  - jogos educativos
  - interpretação simples

Resumos permitidos:
• curto (15–20 linhas)
• médio (20–35 linhas)

Histórias permitidas normalmente.

⸻

🎓 ENSINO MÉDIO (1º, 2º e 3º anos)

Materiais devem ser:
• densos
• analíticos
• com vocabulário técnico apropriado
• mais próximos de ENEM/vestibulares
• com foco em argumentação, síntese, análise e interpretação

REGRAS ESPECIAIS PARA ENSINO MÉDIO

❌ HISTÓRIAS — PROIBIDAS

Se solicitado, responda:

"Para Ensino Médio, histórias não são utilizadas. Prefere resumo, quiz, missão investigativa, jogo educativo, análise ou mapa conceitual?"

📝 RESUMOS — OBRIGATORIAMENTE DENSOS

Níveis permitidos:
• médio (20–35 linhas)
• completo (35+ linhas)

Resumo curto é proibido.

🧠 QUIZ — MÍNIMO 15 PERGUNTAS

Padrão: 15 perguntas
Permitido: até 50 perguntas

Perguntar sempre que número não for informado:

"Quantas perguntas você deseja? O mínimo para Ensino Médio é 15."

🎯 PODE utilizar:
• questões discursivas
• interpretação de texto complexa
• completar com equivalências
• verdadeiro ou falso
• análise contextual
• citações filosóficas/científicas

⸻

🟪 TIPOS OFICIAIS DE QUESTÕES DO EDUMAGIC

O Gemini deve ser capaz de gerar:

✔ 1. Múltipla escolha (padrão)
4 opções → 1 correta

✔ 2. Completar (fill-in-the-blank)
Com lista de respostas aceitas.

✔ 3. Verdadeiro ou Falso (V/F)
Resposta deve ser "V" ou "F".

✔ 4. Interpretação de texto
Com texto-base criado pelo modelo.

✔ 5. Discursiva (Ensino Médio)
Com guideline de correção.

Para quizzes longos, misture tipos:
• 60% múltipla escolha
• 20% completar
• 10–20% V/F
• 10–15% interpretação
• até 5% discursiva (somente EM)

⸻

🧩 FORMATOS DE ATIVIDADES SUPORTADOS

O modelo pode gerar:
• Resumo
• Quiz
• Jogo educativo
• Plataforma (estilo pitfall)
• Missão / Escape Room
• Ficha de estudo
• Mapa conceitual

Histórias só para Infantil e Fundamental.

⸻

🔒 REGRAS DE CONFIRMAÇÃO (OBRIGATÓRIAS)

Se o tamanho não for especificado:

QUIZ
Perguntar:
"Quantas perguntas você deseja? Mínimo 15 no Ensino Médio / 10 nos demais níveis."

RESUMO
Ensino médio:
"Médio (20–35 linhas) ou completo (35+ linhas)?"

HISTÓRIA (Infantil/Fundamental)
Perguntar:
"Quantas páginas? O padrão é 5."

JOGO / MISSÃO
Perguntar:
"Quantas fases ou desafios deseja?"

O modelo nunca gera conteúdo expandido sem confirmação explícita.

⸻

📦 FORMATO OBRIGATÓRIO DE RESPOSTA (sempre JSON)

{
  "type": "",
  "title": "",
  "age": "",
  "bncc": "",
  "goal": "",
  "content": {},
  "tags": []
}`;

// ============================================
// TEMPLATES JSON POR TIPO
// ============================================

// Schema para História
const historiaSchema = {
  type: SchemaType.OBJECT,
  properties: {
    type: { type: SchemaType.STRING, description: "Sempre 'historia'" },
    title: { type: SchemaType.STRING, description: "Título da história" },
    age: { type: SchemaType.STRING, description: "Idade do público-alvo" },
    bncc: { type: SchemaType.STRING, description: "Habilidades da BNCC relacionadas" },
    goal: { type: SchemaType.STRING, description: "Objetivo pedagógico da história" },
    content: {
      type: SchemaType.OBJECT,
      properties: {
        pages: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              page: { type: SchemaType.INTEGER, description: "Número da página (1, 2, 3, etc.)" },
              text: { type: SchemaType.STRING, description: "Texto da página" }
            },
            required: ["page", "text"]
          }
        }
      },
      required: ["pages"]
    },
    tags: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Tags relacionadas ao conteúdo"
    }
  },
  required: ["type", "title", "age", "bncc", "goal", "content", "tags"]
};

// Schema para Resumo (v4.0)
const resumoSchema = {
  type: SchemaType.OBJECT,
  properties: {
    type: { type: SchemaType.STRING, description: "Sempre 'resumo'" },
    title: { type: SchemaType.STRING, description: "Título do resumo" },
    age: { type: SchemaType.STRING, description: "Idade do público-alvo" },
    bncc: { type: SchemaType.STRING, description: "Habilidades da BNCC relacionadas" },
    goal: { type: SchemaType.STRING, description: "Objetivo pedagógico do resumo" },
    content: {
      type: SchemaType.OBJECT,
      properties: {
        level: { type: SchemaType.STRING, description: "Nível: 'medio' ou 'completo' (curto não permitido para Ensino Médio)" },
        text: { type: SchemaType.STRING, description: "Texto do resumo (20-35 linhas para médio, 35+ para completo)" }
      },
      required: ["level", "text"]
    },
    tags: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Tags relacionadas ao conteúdo"
    }
  },
  required: ["type", "title", "age", "bncc", "goal", "content", "tags"]
};

// Schema para Quiz (v4.0 - com 5 tipos de questões)
const quizSchema = {
  type: SchemaType.OBJECT,
  properties: {
    type: { type: SchemaType.STRING, description: "Sempre 'quiz'" },
    title: { type: SchemaType.STRING, description: "Título do quiz" },
    age: { type: SchemaType.STRING, description: "Idade do público-alvo" },
    bncc: { type: SchemaType.STRING, description: "Habilidades da BNCC relacionadas" },
    goal: { type: SchemaType.STRING, description: "Objetivo pedagógico do quiz" },
    content: {
      type: SchemaType.OBJECT,
      properties: {
        questions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              type: { 
                type: SchemaType.STRING, 
                description: "Tipo da questão: 'multipla_escolha', 'fill', 'vf', 'interpretacao', ou 'discursiva'" 
              },
              // Múltipla escolha
              q: { type: SchemaType.STRING, description: "Pergunta (obrigatório para todos os tipos)" },
              options: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Lista de 4 opções de resposta (obrigatório para multipla_escolha e interpretacao)"
              },
              answer: { 
                type: SchemaType.STRING, 
                description: "Resposta correta: texto da opção correta (multipla_escolha/interpretacao), 'V' ou 'F' (vf), ou resposta aceita (fill)" 
              },
              // Completar (fill)
              answers: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Lista de respostas aceitas (obrigatório para tipo 'fill')"
              },
              // Interpretação
              text: {
                type: SchemaType.STRING,
                description: "Texto-base para interpretação (obrigatório para tipo 'interpretacao')"
              },
              // Discursiva
              guideline: {
                type: SchemaType.STRING,
                description: "Guideline de correção (obrigatório para tipo 'discursiva')"
              }
            },
            required: ["type", "q"]
          }
        }
      },
      required: ["questions"]
    },
    tags: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Tags relacionadas ao conteúdo"
    }
  },
  required: ["type", "title", "age", "bncc", "goal", "content", "tags"]
};

// Schema para Jogo (v4.0)
const jogoSchema = {
  type: SchemaType.OBJECT,
  properties: {
    type: { type: SchemaType.STRING, description: "Sempre 'jogo'" },
    title: { type: SchemaType.STRING, description: "Título do jogo" },
    age: { type: SchemaType.STRING, description: "Idade do público-alvo" },
    bncc: { type: SchemaType.STRING, description: "Habilidades da BNCC relacionadas" },
    goal: { type: SchemaType.STRING, description: "Objetivo pedagógico do jogo" },
    content: {
      type: SchemaType.OBJECT,
      properties: {
        mechanics: { type: SchemaType.STRING, description: "Mecânicas do jogo" },
        phases: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Fases do jogo"
        },
        challenges: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Desafios do jogo"
        },
        analysis: { type: SchemaType.STRING, description: "Análise crítica ou raciocínio investigativo (obrigatório para Ensino Médio)" },
        rewards: { type: SchemaType.STRING, description: "Sistema de recompensas" }
      },
      required: ["mechanics", "phases", "challenges", "analysis", "rewards"]
    },
    tags: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Tags relacionadas ao conteúdo"
    }
  },
  required: ["type", "title", "age", "bncc", "goal", "content", "tags"]
};

interface FileAttachment {
  mimeType: string;
  data: string; // base64
  name: string;
}

// ============================================
// MIDDLEWARE DE VALIDAÇÃO
// ============================================
export interface ValidationResult {
  needsConfirmation: boolean;
  confirmationMessage?: string;
  contentType?: ContentType;
}

// Helper para verificar se é Ensino Médio
function isEnsinoMedio(grade?: string): boolean {
  if (!grade) return false;
  const gradeLower = grade.toLowerCase();
  return gradeLower.includes('médio') || gradeLower.includes('medio') || 
         gradeLower.includes('1º ano médio') || gradeLower.includes('2º ano médio') || 
         gradeLower.includes('3º ano médio');
}

export const validateContentRequest = (
  promptInput: string,
  contentType: ContentType,
  grade?: string
): ValidationResult => {
  const promptLower = promptInput.toLowerCase();
  const isEM = isEnsinoMedio(grade);
  
  // ============================================
  // VALIDAÇÕES ESPECÍFICAS PARA ENSINO MÉDIO
  // ============================================
  if (isEM) {
    // 1. HISTÓRIA — PROIBIDO para Ensino Médio
    if (contentType === 'story') {
      return {
        needsConfirmation: true,
        confirmationMessage: "Para estudantes do Ensino Médio, histórias não são utilizadas. Podemos criar um resumo, quiz, análise, mapa conceitual, jogo investigativo, escape room ou ficha de estudo. Qual formato deseja?",
        contentType: 'story'
      };
    }
    
    // 2. RESUMO — Apenas médio ou completo (curto proibido)
    if (contentType === 'summary') {
      const hasLevel = /medio|médio|completo/i.test(promptInput);
      const hasCurto = /curto/i.test(promptInput);
      
      if (hasCurto) {
        return {
          needsConfirmation: true,
          confirmationMessage: "Para Ensino Médio, resumo curto não é permitido. Deseja resumo médio (20–35 linhas) ou completo (35+ linhas)?",
          contentType: 'summary'
        };
      }
      
      if (!hasLevel) {
        return {
          needsConfirmation: true,
          confirmationMessage: "Para Ensino Médio, prefere resumo médio (20–35 linhas) ou completo (35+ linhas)?",
          contentType: 'summary'
        };
      }
    }
    
    // 3. QUIZ — Mínimo 15 perguntas
    if (contentType === 'quiz') {
      const hasMoreQuestions = /mais perguntas|expandir|aumentar|quiz maior|maior quiz/i.test(promptInput);
      const questionCount = promptInput.match(/\d+/);
      const count = questionCount ? parseInt(questionCount[0]) : 0;
      
      if (hasMoreQuestions && count < 15) {
        return {
          needsConfirmation: true,
          confirmationMessage: "Quantas perguntas você deseja? Para Ensino Médio, o mínimo é 15.",
          contentType: 'quiz'
        };
      }
      
      // Se não especificou quantidade e pediu mais, perguntar
      if (hasMoreQuestions && !questionCount) {
        return {
          needsConfirmation: true,
          confirmationMessage: "Quantas perguntas você deseja? Para Ensino Médio, o mínimo é 15.",
          contentType: 'quiz'
        };
      }
    }
    
    // 4. JOGO / MISSÃO — Perguntar sobre fases/desafios se não especificado
    if (contentType === 'game') {
      const hasMorePhases = /mais fases|mais desafios|expandir|aumentar/i.test(promptInput);
      const phaseCount = promptInput.match(/\d+/);
      
      if (hasMorePhases && !phaseCount) {
        return {
          needsConfirmation: true,
          confirmationMessage: "Quantas fases ou desafios deseja incluir?",
          contentType: 'game'
        };
      }
    }
  }
  
  // ============================================
  // VALIDAÇÕES PARA ENSINO FUNDAMENTAL E INFANTIL
  // ============================================
  else {
    // Validação para Quiz
    if (contentType === 'quiz') {
      const hasMoreQuestions = /mais perguntas|expandir|aumentar|quiz maior|maior quiz/i.test(promptInput);
      if (hasMoreQuestions && !/\d+/.test(promptInput)) {
        return {
          needsConfirmation: true,
          confirmationMessage: "Quantas perguntas você deseja no total? O padrão é 10.",
          contentType: 'quiz'
        };
      }
    }
    
    // Validação para História
    if (contentType === 'story') {
      const hasMorePages = /mais páginas|expandir|aumentar|história maior|historia maior/i.test(promptInput);
      if (hasMorePages && !/\d+/.test(promptInput)) {
        return {
          needsConfirmation: true,
          confirmationMessage: "Quantas páginas você deseja? O padrão é 5 páginas.",
          contentType: 'story'
        };
      }
    }
    
    // Validação para Resumo
    if (contentType === 'summary') {
      const hasMoreDetail = /maior|mais detalhado|aprofundar|expandir/i.test(promptInput);
      const hasLevel = /curto|medio|médio|completo/i.test(promptInput);
      if (hasMoreDetail && !hasLevel) {
        return {
          needsConfirmation: true,
          confirmationMessage: "Qual nível de resumo você prefere?\n• Curto (15–20 linhas)\n• Médio (20–35 linhas)\n• Completo (35+ linhas)",
          contentType: 'summary'
        };
      }
    }
  }
  
  // Validação genérica para outros formatos
  const vagueRequests = /maior|expandir|aumentar|mais/i.test(promptInput);
  const hasSpecificSize = /\d+/.test(promptInput);
  if (vagueRequests && !hasSpecificSize && contentType !== 'quiz' && contentType !== 'story' && contentType !== 'summary' && contentType !== 'game') {
    return {
      needsConfirmation: true,
      confirmationMessage: "Deseja especificar o tamanho, quantidade ou nível de detalhamento?",
      contentType
    };
  }
  
  return { needsConfirmation: false };
};

// ============================================
// FUNÇÃO PRINCIPAL DE GERAÇÃO
// ============================================
export const generateEducationalContent = async (
  promptInput: string,
  age: number,
  contentType: ContentType,
  files: FileAttachment[] = [],
  sourceContext?: string,
  grade?: string,
  refinementPrompt?: string,
  sizeParams?: { questions?: number; pages?: number; level?: 'curto' | 'medio' | 'completo' }
): Promise<any> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não está configurada. Configure a chave da API do Gemini nas variáveis de ambiente.");
  }

  const modelId = "gemini-2.5-flash";
  
  let promptText = "";
  let responseSchema: any;
  
  // Mapear ContentType para o tipo do schema
  const typeMap: { [key in ContentType]: string } = {
    'story': 'historia',
    'quiz': 'quiz',
    'summary': 'resumo',
    'game': 'jogo'
  };

  // Verificar se é Ensino Médio
  const isEM = grade ? (grade.toLowerCase().includes('médio') || grade.toLowerCase().includes('medio')) : false;
  
  const baseInstruction = isEM 
    ? `Público-alvo: estudante do Ensino Médio (${age} anos). Idioma: Português. Use linguagem técnica, acadêmica e preparatória para ENEM e vestibulares.`
    : `Público-alvo: criança de ${age} anos. Idioma: Português.`;
  
  let contextInstruction = sourceContext 
    ? `MATERIAL DE BASE: """${sourceContext}"""\n\nTAREFA: Com base estritamente no MATERIAL DE BASE fornecido acima, crie um novo ${typeMap[contentType]}. NÃO reproduza o texto original, transforme-o no formato solicitado.` 
    : `TÓPICO: "${promptInput}"`;

  // Construir prompt específico por tipo
  switch (contentType) {
    case "story":
      const pagesCount = sizeParams?.pages || 5;
      promptText = `${baseInstruction} ${contextInstruction} Crie uma história educativa envolvente e interativa com exatamente ${pagesCount} páginas.`;
      responseSchema = historiaSchema;
      break;
    case "quiz":
      // Para Ensino Médio: mínimo 15, padrão 15. Para outros: padrão 10
      const questionsCount = sizeParams?.questions || (isEM ? 15 : 10);
      const quizTone = isEM 
        ? "Tom: Acadêmico e preparatório para ENEM/vestibulares. Questões devem ser analíticas e investigativas."
        : "Tom: Encorajador.";
      
      // Instruções sobre tipos de questões
      let questionTypesInstruction = "";
      if (isEM) {
        // Para Ensino Médio: misturar tipos (60% múltipla escolha, 20% completar, 10-20% V/F, 10-15% interpretação, até 5% discursiva)
        questionTypesInstruction = `\n\nTIPOS DE QUESTÕES: Misture os tipos de questões conforme a distribuição:
- 60% múltipla escolha (4 opções, 1 correta)
- 20% completar (fill-in-the-blank com lista de respostas aceitas)
- 10-20% verdadeiro ou falso (resposta "V" ou "F")
- 10-15% interpretação de texto (com texto-base criado por você)
- até 5% discursiva (com guideline de correção)

Para cada questão, use o campo "type" apropriado: "multipla_escolha", "fill", "vf", "interpretacao", ou "discursiva".`;
      } else {
        // Para Fundamental/Infantil: principalmente múltipla escolha, pode ter algumas de completar e V/F
        questionTypesInstruction = `\n\nTIPOS DE QUESTÕES: Use principalmente múltipla escolha (4 opções, 1 correta). 
Pode incluir algumas questões de completar (fill-in-the-blank) e verdadeiro/falso.
Para cada questão, use o campo "type" apropriado: "multipla_escolha", "fill", ou "vf".
NÃO use questões discursivas ou de interpretação complexa para este nível.`;
      }
      
      promptText = `${baseInstruction} ${contextInstruction} Crie um quiz com exatamente ${questionsCount} perguntas. ${quizTone}${questionTypesInstruction}`;
      responseSchema = quizSchema;
      break;
    case "summary":
      // Para Ensino Médio: apenas médio ou completo (sem curto)
      const defaultLevel = isEM ? 'medio' : 'medio';
      const level = sizeParams?.level || defaultLevel;
      // Se for Ensino Médio e tentar usar curto, forçar médio
      const finalLevel = (isEM && level === 'curto') ? 'medio' : level;
      const levelText = finalLevel === 'curto' ? '15-20 linhas' : finalLevel === 'medio' ? '20-35 linhas' : '35+ linhas';
      const summaryStyle = isEM
        ? "Crie um resumo acadêmico, técnico e abrangente. Use termos científicos quando adequado. Prepare para ENEM e vestibulares."
        : "Explique conceitos complexos de forma simples usando analogias.";
      promptText = `${baseInstruction} ${contextInstruction} Crie um resumo de estudo no nível ${finalLevel} (${levelText}). ${summaryStyle}`;
      responseSchema = resumoSchema;
      break;
    case "game":
      const gameStyle = isEM
        ? "Crie um jogo investigativo, analítico, com raciocínio crítico. Pode simular questões de ENEM e vestibulares. Desafios conceituais e acadêmicos. O campo 'analysis' é obrigatório e deve conter análise crítica ou raciocínio investigativo."
        : "Crie um jogo educativo interativo e lúdico. O campo 'analysis' pode conter observações pedagógicas.";
      promptText = `${baseInstruction} ${contextInstruction} ${gameStyle}`;
      responseSchema = jogoSchema;
      break;
  }

  // Adicionar informações de série/BNCC se disponível
  if (grade) {
    promptText += `\n\nSérie: ${grade}`;
  }

  // Adicionar instruções de refinamento se houver
  if (refinementPrompt) {
    promptText += `\n\nREFINAMENTO SOLICITADO: "${refinementPrompt}"`;
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: modelId,
      systemInstruction: SYSTEM_PROMPT_EDUMAGIC,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    // IMPORTANT: Files must come BEFORE the text prompt for better analysis
    const parts: any[] = [];
    
    // Gemini API supported MIME types:
    // - Images: image/jpeg, image/png, image/gif, image/webp
    // - PDF: application/pdf
    // - Video: video/mp4, video/mpeg, video/quicktime, video/x-msvideo
    // DOC/DOCX are NOT supported, so we filter them out
    const supportedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'
    ];
    
    const unsupportedFiles: string[] = [];
    const supportedFiles: FileAttachment[] = [];
    
    files.forEach(file => {
      // Check if mimeType is supported (also check if it starts with image/ for any image type)
      const isSupported = supportedMimeTypes.includes(file.mimeType) || 
                         file.mimeType.startsWith('image/') ||
                         file.mimeType === 'application/pdf';
      
      if (isSupported) {
        supportedFiles.push(file);
      } else {
        unsupportedFiles.push(file.name);
      }
    });
    
    // Add supported files FIRST
    supportedFiles.forEach(file => {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    });
    
    // Add warning about unsupported files to the prompt if any
    if (unsupportedFiles.length > 0) {
      promptText += `\n\nNota: Os seguintes arquivos foram enviados mas não podem ser processados pelo sistema de IA (formato não suportado): ${unsupportedFiles.join(', ')}. Por favor, use apenas imagens (JPG, PNG) ou PDF como material de base.`;
    }
    
    // Then add the text prompt
    parts.push({ text: promptText });

    // Timeout maior para requisições com muitos arquivos
    // A API do Gemini pode demorar mais com múltiplos arquivos
    const timeoutMs = files.length > 10 ? 300000 : 120000; // 5min para >10 arquivos, 2min para <=10
    
    const generatePromise = model.generateContent(parts);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT: A requisição demorou muito para processar. Tente com menos arquivos ou arquivos menores.')), timeoutMs);
    });
    
    const result = await Promise.race([generatePromise, timeoutPromise]) as any;
    
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error("No response from Gemini");
    }
    
    try {
      const parsedContent = JSON.parse(text);
      
      // Converter formato novo para formato antigo (compatibilidade)
      return convertToLegacyFormat(parsedContent, contentType);
    } catch (parseError: any) {
      console.error("JSON Parse Error:", parseError);
      console.error("Response text:", text);
      throw new Error("Erro ao processar resposta do Gemini. A resposta não está em formato JSON válido.");
    }
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      stack: error.stack,
      filesCount: files?.length || 0,
      filesInfo: files?.map((f: any) => ({
        name: f.name,
        mimeType: f.mimeType,
        size: f.data?.length || 0
      })) || []
    });
    
    // Mensagens de erro mais específicas
    let errorMessage = 'Erro desconhecido ao gerar conteúdo';
    
    if (error.message) {
      if (error.message.includes('Unsupported MIME type')) {
        errorMessage = 'Tipo de arquivo não suportado pelo Gemini. Use apenas PDF ou imagens (JPG, PNG, GIF, WEBP).';
      } else if (error.message.includes('400 Bad Request') || error.message.includes('400')) {
        // Erro 400 geralmente indica problema com os arquivos ou formato da requisição
        errorMessage = 'Erro na requisição ao Gemini. Verifique os arquivos enviados e tente novamente. Se o problema persistir, tente com menos arquivos ou arquivos menores.';
      } else if (error.message.includes('401') || error.message.includes('API key') || error.message.includes('authentication')) {
        errorMessage = 'Erro de autenticação com a API do Gemini. Verifique a chave da API.';
      } else if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate limit')) {
        errorMessage = 'Limite de requisições excedido. Tente novamente em alguns instantes.';
      } else if (error.message.includes('413') || error.message.includes('too large') || error.message.includes('Payload too large')) {
        errorMessage = 'Arquivos muito grandes. Tente enviar menos arquivos ou arquivos menores.';
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        errorMessage = 'Erro interno do servidor do Gemini. Tente novamente mais tarde.';
      } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        errorMessage = error.message.includes('TIMEOUT:') ? error.message : 'Tempo de processamento excedido. Tente com menos arquivos ou arquivos menores.';
      } else {
        errorMessage = `Erro ao gerar conteúdo: ${error.message}`;
      }
    } else if (error.status) {
      // Se não há mensagem mas há status code
      if (error.status === 400) {
        errorMessage = 'Erro na requisição ao Gemini. Verifique os arquivos enviados e tente novamente.';
      } else if (error.status === 401) {
        errorMessage = 'Erro de autenticação com a API do Gemini. Verifique a chave da API.';
      } else if (error.status === 429) {
        errorMessage = 'Limite de requisições excedido. Tente novamente em alguns instantes.';
      } else if (error.status === 413) {
        errorMessage = 'Arquivos muito grandes. Tente enviar menos arquivos ou arquivos menores.';
      } else if (error.status === 500) {
        errorMessage = 'Erro interno do servidor do Gemini. Tente novamente mais tarde.';
      }
    }
    
    throw new Error(errorMessage);
  }
};

// ============================================
// CONVERSOR DE FORMATO (NOVO → LEGADO)
// ============================================
function convertToLegacyFormat(newFormat: any, contentType: ContentType): any {
  const legacy: any = {
    title: newFormat.title || '',
    description: newFormat.goal || '',
    content: {}
  };

  switch (contentType) {
    case 'story':
      // Converter pages para chapters
      if (newFormat.content?.pages) {
        legacy.content = {
          chapters: newFormat.content.pages.map((page: any, index: number) => ({
            title: `Página ${page.page || index + 1}`,
            text: page.text
          }))
        };
      }
      break;
    
    case 'quiz':
      // Converter formato novo para antigo (suportando os 5 tipos de questões)
      if (newFormat.content?.questions) {
        legacy.content = {
          questions: newFormat.content.questions.map((q: any, index: number) => {
            const baseQuestion = {
              id: index + 1,
              question: q.q,
              type: q.type || 'multipla_escolha'
            };
            
            // Processar conforme o tipo de questão
            switch (q.type) {
              case 'multipla_escolha':
              case 'interpretacao':
                const options = q.options || [];
                const correctIndex = options.length > 0 && q.answer 
                  ? options.findIndex((opt: string) => opt === q.answer) 
                  : -1;
                // Garantir que sempre há pelo menos uma opção e um índice correto válido
                if (options.length === 0) {
                  console.warn(`Questão ${index + 1} do tipo ${q.type} não tem opções. Convertendo para múltipla escolha padrão.`);
                  return {
                    ...baseQuestion,
                    options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
                    correctIndex: 0,
                    explanation: `Resposta correta: ${q.answer || 'Não especificada'}`
                  };
                }
                return {
                  ...baseQuestion,
                  options: options,
                  correctIndex: correctIndex >= 0 ? correctIndex : 0,
                  explanation: `Resposta correta: ${q.answer || options[0] || 'Não especificada'}`,
                  text: q.text || undefined // Para interpretação
                };
              
              case 'fill':
                // Converter fill para múltipla escolha com as respostas aceitas como opções
                const fillAnswers = q.answers || [];
                if (fillAnswers.length > 0) {
                  return {
                    ...baseQuestion,
                    options: fillAnswers,
                    correctIndex: 0, // Primeira resposta é considerada correta
                    explanation: `Respostas aceitas: ${fillAnswers.join(', ')}`,
                    type: 'fill' // Manter tipo original para referência
                  };
                }
                // Se não há respostas, criar opções padrão
                return {
                  ...baseQuestion,
                  options: ['Resposta 1', 'Resposta 2', 'Resposta 3', 'Resposta 4'],
                  correctIndex: 0,
                  explanation: `Respostas aceitas: ${fillAnswers.join(', ') || 'Não especificadas'}`,
                  type: 'fill'
                };
              
              case 'vf':
                // Converter V/F para múltipla escolha
                const vfAnswer = q.answer === 'V' || q.answer === 'F' ? q.answer : 'V';
                return {
                  ...baseQuestion,
                  options: ['Verdadeiro', 'Falso'],
                  correctIndex: vfAnswer === 'V' ? 0 : 1,
                  explanation: `Resposta correta: ${vfAnswer === 'V' ? 'Verdadeiro' : 'Falso'}`,
                  type: 'vf' // Manter tipo original para referência
                };
              
              case 'discursiva':
                return {
                  ...baseQuestion,
                  guideline: q.guideline || '',
                  explanation: `Guideline de correção: ${q.guideline || 'Não especificado'}`
                };
              
              default:
                // Fallback para múltipla escolha
                const fallbackOptions = q.options || [];
                const fallbackIndex = fallbackOptions.length > 0 && q.answer 
                  ? fallbackOptions.findIndex((opt: string) => opt === q.answer) 
                  : -1;
                // Garantir que sempre há pelo menos uma opção e um índice correto válido
                if (fallbackOptions.length === 0) {
                  console.warn(`Questão ${index + 1} do tipo desconhecido não tem opções. Convertendo para múltipla escolha padrão.`);
                  return {
                    ...baseQuestion,
                    options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
                    correctIndex: 0,
                    explanation: `Resposta correta: ${q.answer || 'Não especificada'}`
                  };
                }
                return {
                  ...baseQuestion,
                  options: fallbackOptions,
                  correctIndex: fallbackIndex >= 0 ? fallbackIndex : 0,
                  explanation: `Resposta correta: ${q.answer || fallbackOptions[0] || 'Não especificado'}`
                };
            }
          })
        };
      }
      break;
    
    case 'summary':
      // Converter formato novo para antigo
      if (newFormat.content) {
        legacy.content = {
          simpleExplanation: newFormat.content.text || '',
          keyPoints: newFormat.tags || [],
          funFact: newFormat.goal || ''
        };
      }
      break;
    
    case 'game':
      // Manter formato do jogo
      legacy.content = newFormat.content || {};
      break;
  }

  return legacy;
}

// ============================================
// CHAT PARA CRIAÇÃO (com system prompt)
// ============================================
export const chatForCreation = async (
  history: {role: 'user'|'model', text: string}[],
  newMessage: string
): Promise<string> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não está configurada. Configure a chave da API do Gemini nas variáveis de ambiente.");
  }

  const modelId = "gemini-2.5-flash";
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: modelId,
      systemInstruction: SYSTEM_PROMPT_EDUMAGIC
    });

    // Converte o histórico para o formato correto
    const chatHistory = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    // Se há histórico, usa startChat, senão usa generateContent direto
    if (chatHistory.length > 0) {
      const chat = model.startChat({
        history: chatHistory
      });
      const result = await chat.sendMessage(newMessage);
      return result.response.text() || '';
    } else {
      const result = await model.generateContent(newMessage);
      const response = await result.response;
      return response.text() || '';
    }
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      statusText: error.statusText
    });
    throw new Error(`Erro ao processar chat com Gemini: ${error.message || 'Erro desconhecido'}`);
  }
};
