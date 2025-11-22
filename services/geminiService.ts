import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ContentType, FileAttachment } from "../types";

// Initialize Gemini Client
// Tenta várias formas de obter a API key
const getApiKey = () => {
  // Vite usa import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  // Fallback para process.env (definido no vite.config)
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  return '';
};

const apiKey = getApiKey();
const ai = apiKey && apiKey !== 'PLACEHOLDER_API_KEY' ? new GoogleGenAI({ apiKey }) : null;

// Schemas for Structured Output
const storySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy title for the story" },
    description: { type: Type.STRING, description: "A short synopsis" },
    content: {
      type: Type.OBJECT,
      properties: {
        chapters: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              text: { type: Type.STRING, description: "The story paragraph content, approx 100 words." },
            },
            required: ["title", "text"]
          }
        }
      },
      required: ["chapters"]
    }
  },
  required: ["title", "description", "content"]
};

const quizSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Title of the quiz" },
    description: { type: Type.STRING, description: "What this quiz tests" },
    content: {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 4 possible answers" },
              correctIndex: { type: Type.INTEGER, description: "0-based index of the correct answer" },
              explanation: { type: Type.STRING, description: "Why this answer is correct (for learning)" }
            },
            required: ["id", "question", "options", "correctIndex", "explanation"]
          }
        }
      },
      required: ["questions"]
    }
  },
  required: ["title", "description", "content"]
};

const summarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    content: {
      type: Type.OBJECT,
      properties: {
        simpleExplanation: { type: Type.STRING, description: "A child-friendly explanation of the topic" },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        funFact: { type: Type.STRING, description: "An interesting fact related to the topic" }
      },
      required: ["simpleExplanation", "keyPoints", "funFact"]
    }
  },
  required: ["title", "description", "content"]
};

export const generateEducationalContent = async (
  promptInput: string,
  age: number,
  contentType: ContentType,
  files: FileAttachment[] = [],
  sourceContext?: string,
  grade?: string,
  refinementRequest?: string
): Promise<any> => {
  
  const modelId = "gemini-2.5-flash";
  
  let promptText = "";
  let responseSchema: Schema | undefined;

  // Base instruction
  const baseInstruction = `Target Audience: ${age}-year-old child. Language: Portuguese (Brazil).`;
  
  // BNCC reference when no files are provided
  const bnccInstruction = files.length === 0 
    ? `IMPORTANTE: Como não foram fornecidos arquivos (PDFs ou imagens), você deve basear o conteúdo na Base Nacional Comum Curricular (BNCC) do Brasil, adequado para a série "${grade || 'Fundamental'}". Use informações educacionais alinhadas com os objetivos de aprendizagem da BNCC para esta faixa etária.`
    : '';
  
  // File-based instruction
  const fileInstruction = files.length > 0
    ? `CRÍTICO: Arquivos (PDFs ou imagens) foram anexados. Você DEVE manter total fidelidade ao conteúdo presente nestes arquivos. Analise cuidadosamente o texto, imagens e informações contidas nos arquivos e crie o conteúdo baseado EXCLUSIVAMENTE no que está presente neles. Não invente informações que não estejam nos arquivos. Se algo não estiver claro nos arquivos, indique isso no conteúdo.`
    : '';
  
  // Refinement instruction
  const refinementInstruction = refinementRequest
    ? `\n\nREFINAMENTO SOLICITADO: "${refinementRequest}"\n\nAplique esta solicitação ao conteúdo, mantendo a estrutura e fidelidade aos arquivos originais (se houver).`
    : '';
  
  // If sourceContext is provided, we are remixing existing content
  const contextInstruction = sourceContext 
    ? `SOURCE MATERIAL: """${sourceContext}"""\n\nTASK: Based strictly on the SOURCE MATERIAL provided above, create a new ${contentType}. Do NOT output the original text, transform it into the requested format.` 
    : `TOPIC: "${promptInput}"`;

  switch (contentType) {
    case "story":
      promptText = `${baseInstruction}\n\n${fileInstruction}\n\n${bnccInstruction}\n\n${contextInstruction}${refinementInstruction}\n\nCreate an engaging, interactive educational story. Split into 3-5 chapters.`;
      responseSchema = storySchema;
      break;
    case "quiz":
      promptText = `${baseInstruction}\n\n${fileInstruction}\n\n${bnccInstruction}\n\n${contextInstruction}${refinementInstruction}\n\nCreate a fun multiple-choice quiz (5 questions). Tone: Encouraging.`;
      responseSchema = quizSchema;
      break;
    case "summary":
      promptText = `${baseInstruction}\n\n${fileInstruction}\n\n${bnccInstruction}\n\n${contextInstruction}${refinementInstruction}\n\nCreate a study summary. Explain complex concepts simply using analogies.`;
      responseSchema = summarySchema;
      break;
  }

  // Prepare contents - IMPORTANT: Files must come BEFORE the text prompt for better analysis
  const parts: any[] = [];
  
  // Add multiple files (Images or PDFs) FIRST
  files.forEach(file => {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });
  
  // Then add the text prompt
  parts.push({ text: promptText });

  try {
    if (!apiKey || !ai) {
      throw new Error("Chave da API Gemini não configurada. Por favor, configure a variável GEMINI_API_KEY no arquivo .env.local");
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    const errorMessage = error.message || "Erro ao gerar conteúdo. Verifique sua chave da API Gemini.";
    throw new Error(errorMessage);
  }
};

// Simple Chat Helper for the "Creation Chat"
export const chatForCreation = async (history: {role: 'user'|'model', text: string}[], newMessage: string) => {
  const modelId = "gemini-2.5-flash";
  
  // Construct history for the API
  const contents = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));
  
  // Add new message
  contents.push({
    role: 'user',
    parts: [{ text: newMessage }]
  });

  try {
    if (!apiKey || !ai) {
      throw new Error("Chave da API Gemini não configurada. Por favor, configure a variável GEMINI_API_KEY no arquivo .env.local");
    }

    const systemInstruction = "You are a helpful educational assistant named 'Edu'. Your goal is to help parents or teachers design a game or educational activity. Ask clarifying questions about the topic, age, and difficulty. Keep answers short and friendly (in Portuguese). Do NOT generate the JSON yet, just discuss ideas.";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: systemInstruction
      }
    });

    return response.text || '';
  } catch (error: any) {
    console.error("Chat Error:", error);
    throw error;
  }
};