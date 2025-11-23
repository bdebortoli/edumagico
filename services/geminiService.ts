import { ContentType, FileAttachment } from "../types";

// API Base URL - usa o backend ao invés de chamar Gemini diretamente
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper para obter token de autenticação
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
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
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Você precisa estar autenticado para gerar conteúdo");
    }

    // Monta o prompt completo com todas as instruções
    let fullPrompt = promptInput;
    
    // Adiciona instruções de refinamento se houver
    if (refinementRequest) {
      fullPrompt = `${fullPrompt}\n\nREFINAMENTO SOLICITADO: "${refinementRequest}"`;
    }
    
    // Adiciona contexto de série/BNCC se houver
    if (grade) {
      fullPrompt = `${fullPrompt}\n\nSérie: ${grade}`;
    }

    // Prepara o body JSON com os arquivos em base64 (formato esperado pelo backend)
    const requestBody: any = {
      prompt: fullPrompt,
      age,
      contentType,
      files: files.map(file => ({
        mimeType: file.mimeType,
        data: file.data, // Já está em base64
        name: file.name || 'file'
      })),
    };

    if (sourceContext) {
      requestBody.sourceContext = sourceContext;
    }

    const response = await fetch(`${API_BASE}/content/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `Erro ao gerar conteúdo: ${response.statusText}`);
    }

    const data = await response.json();
    return data.generated;
  } catch (error: any) {
    console.error("Erro ao gerar conteúdo:", error);
    throw new Error(error.message || "Erro ao gerar conteúdo. Verifique sua conexão e tente novamente.");
  }
};

// Simple Chat Helper for the "Creation Chat"
export const chatForCreation = async (history: {role: 'user'|'model', text: string}[], newMessage: string) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Você precisa estar autenticado para usar o chat");
    }

    const response = await fetch(`${API_BASE}/content/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        history,
        message: newMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `Erro ao processar chat: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  } catch (error: any) {
    console.error("Chat Error:", error);
    throw new Error(error.message || "Erro ao processar chat. Verifique sua conexão e tente novamente.");
  }
};