import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ContentType } from "../entities/ContentItem";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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
  const modelId = "gemini-2.5-flash";
  
  let promptText = "";
  let responseSchema: Schema | undefined;

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

  const parts: any[] = [{ text: promptText }];
  
  files.forEach(file => {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });

  try {
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
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const chatForCreation = async (
  history: {role: 'user'|'model', text: string}[],
  newMessage: string
): Promise<string> => {
  const modelId = "gemini-2.5-flash";
  
  const contents = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));
  
  contents.push({
    role: 'user',
    parts: [{ text: newMessage }]
  });

  const systemInstruction = "You are a helpful educational assistant named 'Edu'. Your goal is to help parents or teachers design a game or educational activity. Ask clarifying questions about the topic, age, and difficulty. Keep answers short and friendly (in Portuguese). Do NOT generate the JSON yet, just discuss ideas.";

  const response = await ai.models.generateContent({
    model: modelId,
    contents: contents,
    config: {
      systemInstruction: systemInstruction
    }
  });

  return response.text || '';
};

