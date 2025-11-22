import { GoogleGenAI } from "@google/genai";
import { ContentType } from "../types";

const apiKey = 
  import.meta.env.VITE_GEMINI_API_KEY || 
  (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.API_KEY) ||
  '';

const ai = apiKey && apiKey !== 'PLACEHOLDER_API_KEY' ? new GoogleGenAI({ apiKey }) : null;

export interface RefinementOption {
  id: string;
  label: string;
  description: string;
  prompt: string;
}

export const REFINEMENT_OPTIONS: RefinementOption[] = [
  {
    id: 'more-complete',
    label: 'Mais Completo',
    description: 'Adicionar mais detalhes e informações',
    prompt: 'Torne este conteúdo mais completo, adicionando mais detalhes, explicações e informações relevantes sobre o tema.'
  },
  {
    id: 'more-playful',
    label: 'Mais Lúdico',
    description: 'Tornar mais divertido e interativo',
    prompt: 'Torne este conteúdo mais lúdico, divertido e interativo, usando linguagem mais descontraída, exemplos criativos e elementos que tornem o aprendizado mais prazeroso.'
  },
  {
    id: 'add-examples',
    label: 'Adicionar Exemplos Práticos',
    description: 'Incluir exemplos do dia a dia',
    prompt: 'Adicione exemplos práticos e do dia a dia que ajudem a criança a entender melhor o conteúdo, relacionando com situações familiares e cotidianas.'
  },
  {
    id: 'simpler',
    label: 'Simplificar',
    description: 'Tornar mais fácil de entender',
    prompt: 'Simplifique este conteúdo, usando linguagem mais simples, explicações mais diretas e evitando termos técnicos complexos.'
  },
  {
    id: 'more-challenging',
    label: 'Mais Desafiador',
    description: 'Aumentar o nível de dificuldade',
    prompt: 'Aumente o nível de dificuldade deste conteúdo, adicionando conceitos mais avançados e questões mais desafiadoras.'
  },
  {
    id: 'more-visual',
    label: 'Mais Visual',
    description: 'Adicionar descrições visuais e imagéticas',
    prompt: 'Torne este conteúdo mais visual, adicionando descrições detalhadas de imagens, cenários e elementos visuais que ajudem na compreensão.'
  },
  {
    id: 'add-activities',
    label: 'Adicionar Atividades',
    description: 'Incluir exercícios práticos',
    prompt: 'Adicione atividades práticas e exercícios que a criança possa fazer para reforçar o aprendizado do conteúdo apresentado.'
  },
  {
    id: 'more-engaging',
    label: 'Mais Engajante',
    description: 'Tornar mais interessante e envolvente',
    prompt: 'Torne este conteúdo mais engajante e envolvente, usando técnicas narrativas, perguntas retóricas e elementos que prendam a atenção da criança.'
  }
];

export const refineContent = async (
  currentContent: any,
  contentType: ContentType,
  refinementRequest: string,
  age: number,
  grade?: string
): Promise<any> => {
  try {
    if (!apiKey || !ai) {
      throw new Error("Chave da API Gemini não configurada");
    }

    const modelId = "gemini-2.5-flash";
    
    // Extract current content text
    let currentContentText = '';
    if (contentType === 'story') {
      currentContentText = currentContent.chapters?.map((ch: any) => `${ch.title}\n${ch.text}`).join('\n\n') || '';
    } else if (contentType === 'quiz') {
      currentContentText = currentContent.questions?.map((q: any) => `${q.question}\n${q.options.join(', ')}\nResposta: ${q.explanation}`).join('\n\n') || '';
    } else if (contentType === 'summary') {
      currentContentText = `${currentContent.simpleExplanation}\n\nPontos-chave: ${currentContent.keyPoints?.join(', ')}\n\nCuriosidade: ${currentContent.funFact}`;
    }

    const prompt = `Você está refinando um conteúdo educacional existente.

CONTEÚDO ATUAL:
"""
${currentContentText}
"""

SOLICITAÇÃO DE REFINAMENTO:
"${refinementRequest}"

INSTRUÇÕES:
- Mantenha a estrutura e formato do conteúdo original
- Aplique a solicitação de refinamento solicitada
- Mantenha a linguagem adequada para ${age} anos
- Idioma: Português (Brasil)
${grade ? `- Série: ${grade} (alinhado com BNCC)` : ''}
- Retorne o conteúdo refinado no mesmo formato JSON do original

Retorne APENAS o JSON com o conteúdo refinado, sem explicações adicionais.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Refinement Error:", error);
    throw error;
  }
};

