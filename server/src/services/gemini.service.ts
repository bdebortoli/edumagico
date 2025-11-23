import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ContentType } from "../entities/ContentItem";

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY não está configurada. A funcionalidade de geração de conteúdo não funcionará.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const storySchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING, description: "A catchy title for the story" },
    description: { type: SchemaType.STRING, description: "A short synopsis" },
    content: {
      type: SchemaType.OBJECT,
      properties: {
        chapters: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              text: { type: SchemaType.STRING, description: "The story paragraph content, approx 100 words." },
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

const quizSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING, description: "Title of the quiz" },
    description: { type: SchemaType.STRING, description: "What this quiz tests" },
    content: {
      type: SchemaType.OBJECT,
      properties: {
        questions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.INTEGER },
              question: { type: SchemaType.STRING },
              options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "List of 4 possible answers" },
              correctIndex: { type: SchemaType.INTEGER, description: "0-based index of the correct answer" },
              explanation: { type: SchemaType.STRING, description: "Why this answer is correct (for learning)" }
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

const summarySchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    content: {
      type: SchemaType.OBJECT,
      properties: {
        simpleExplanation: { type: SchemaType.STRING, description: "A child-friendly explanation of the topic" },
        keyPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        funFact: { type: SchemaType.STRING, description: "An interesting fact related to the topic" }
      },
      required: ["simpleExplanation", "keyPoints", "funFact"]
    }
  },
  required: ["title", "description", "content"]
};

interface FileAttachment {
  mimeType: string;
  data: string; // base64
  name: string;
}

export const generateEducationalContent = async (
  promptInput: string,
  age: number,
  contentType: ContentType,
  files: FileAttachment[] = [],
  sourceContext?: string
): Promise<any> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não está configurada. Configure a chave da API do Gemini nas variáveis de ambiente.");
  }

  const modelId = "gemini-1.5-flash";
  
  let promptText = "";
  let responseSchema: any;

  const baseInstruction = `Target Audience: ${age}-year-old child. Language: Portuguese.`;
  
  const contextInstruction = sourceContext 
    ? `SOURCE MATERIAL: """${sourceContext}"""\n\nTASK: Based strictly on the SOURCE MATERIAL provided above, create a new ${contentType}. Do NOT output the original text, transform it into the requested format.` 
    : `TOPIC: "${promptInput}"`;

  switch (contentType) {
    case "story":
      promptText = `${baseInstruction} ${contextInstruction} Create an engaging, interactive educational story. Split into 3-5 chapters.`;
      responseSchema = storySchema;
      break;
    case "quiz":
      promptText = `${baseInstruction} ${contextInstruction} Create a fun multiple-choice quiz (5 questions). Tone: Encouraging.`;
      responseSchema = quizSchema;
      break;
    case "summary":
      promptText = `${baseInstruction} ${contextInstruction} Create a study summary. Explain complex concepts simply using analogies.`;
      responseSchema = summarySchema;
      break;
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: modelId,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    // IMPORTANT: Files must come BEFORE the text prompt for better analysis
    const parts: any[] = [];
    
    // Add files FIRST
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

    const result = await model.generateContent(parts);
    
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error("No response from Gemini");
    }
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      statusText: error.statusText
    });
    throw new Error(`Erro ao gerar conteúdo com Gemini: ${error.message || 'Erro desconhecido'}`);
  }
};

export const chatForCreation = async (
  history: {role: 'user'|'model', text: string}[],
  newMessage: string
): Promise<string> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não está configurada. Configure a chave da API do Gemini nas variáveis de ambiente.");
  }

  const modelId = "gemini-1.5-flash";
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: modelId,
      systemInstruction: "You are a helpful educational assistant named 'Edu'. Your goal is to help parents or teachers design a game or educational activity. Ask clarifying questions about the topic, age, and difficulty. Keep answers short and friendly (in Portuguese). Do NOT generate the JSON yet, just discuss ideas."
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

