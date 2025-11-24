import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY não está configurada. A funcionalidade de correção não funcionará.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ============================================
// SYSTEM PROMPT CORREÇÃO DISCURSIVA v5.0
// ============================================
export const SYSTEM_PROMPT_CORRECAO = `Você é o módulo oficial de correção de respostas discursivas do EduMagic.

Sua função é comparar a resposta do aluno com a GUIDELINE fornecida, avaliar a aderência conceitual e fornecer um feedback estruturado e pedagógico.

REGRAS:

1. Compare a resposta do aluno com a guideline.

2. Classifique a aderência como: "correta", "parcial" ou "incorreta".

3. Gere SEMPRE três blocos:

   - "pontos_positivos": aspectos corretos ou bem iniciados.

   - "corrigir": conceitos faltantes, incompletos ou incorretos.

   - "resposta_modelo": uma resposta ideal, curta e pedagógica.

4. A correção deve ser respeitosa, objetiva e motivadora.

5. Nunca use notas numéricas.

6. Nunca provoque constrangimento, crítica moral ou julgamento pessoal.

7. Linguagem:

   - Simples: Infantil e Fundamental I.

   - Moderada: Fundamental II.

   - Técnica e acadêmica: Ensino Médio.

8. SEMPRE gerar JSON válido no formato:

{
  "avaliacao": {
    "aderencia_guideline": "",
    "pontos_positivos": [],
    "corrigir": [],
    "resposta_modelo": ""
  }
}`;

// Schema para validação da resposta do Gemini
const correcaoSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    avaliacao: {
      type: SchemaType.OBJECT,
      properties: {
        aderencia_guideline: {
          type: SchemaType.STRING,
          enum: ["correta", "parcial", "incorreta"],
          description: "Classificação da aderência da resposta à guideline"
        },
        pontos_positivos: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Lista de aspectos corretos ou bem iniciados na resposta"
        },
        corrigir: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Lista de conceitos faltantes, incompletos ou incorretos"
        },
        resposta_modelo: {
          type: SchemaType.STRING,
          description: "Uma resposta ideal, curta e pedagógica"
        }
      },
      required: ["aderencia_guideline", "pontos_positivos", "corrigir", "resposta_modelo"]
    }
  },
  required: ["avaliacao"]
};

export interface CorrecaoPayload {
  resposta_aluno: string;
  guideline: string;
  serie?: string;
  idade?: number;
  materia?: string;
  conteudo?: string;
}

export interface CorrecaoResult {
  step: "correcao_pronta" | "erro";
  data?: {
    avaliacao: {
      aderencia_guideline: "correta" | "parcial" | "incorreta";
      pontos_positivos: string[];
      corrigir: string[];
      resposta_modelo: string;
    };
  };
  message?: string;
}

export interface ValidatorResult {
  needed: boolean;
  message?: string;
  payload?: CorrecaoPayload;
}

export function validarCorrecao(payload: any): ValidatorResult {
  if (!payload.resposta_aluno || payload.resposta_aluno.trim() === "") {
    return {
      needed: true,
      message: "A resposta do aluno está vazia. Por favor, envie a resposta para que eu possa corrigir."
    };
  }

  if (!payload.guideline || payload.guideline.trim() === "") {
    return {
      needed: true,
      message: "A questão não possui guideline de correção. Isso impede a avaliação precisa."
    };
  }

  return { needed: false, payload: payload as CorrecaoPayload };
}

export async function corrigirResposta(payload: CorrecaoPayload): Promise<CorrecaoResult> {
  const validation = validarCorrecao(payload);
  
  if (validation.needed) {
    return {
      step: "erro",
      message: validation.message || "Erro na validação do payload"
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      step: "erro",
      message: "Chave da API do Gemini não configurada no servidor."
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-pro",
      systemInstruction: SYSTEM_PROMPT_CORRECAO,
      generationConfig: {
        responseSchema: correcaoSchema,
        temperature: 0.7,
        topP: 0.95,
        topK: 40
      }
    });

    // Construir prompt contextualizado
    const promptText = `Corrija a seguinte resposta discursiva do aluno:

RESPOSTA DO ALUNO:
${payload.resposta_aluno}

GUIDELINE DE CORREÇÃO:
${payload.guideline}

${payload.serie ? `SÉRIE: ${payload.serie}` : ''}
${payload.idade ? `IDADE: ${payload.idade} anos` : ''}
${payload.materia ? `MATÉRIA: ${payload.materia}` : ''}
${payload.conteudo ? `CONTEÚDO: ${payload.conteudo}` : ''}

Analise a resposta do aluno comparando-a com a guideline fornecida e forneça uma avaliação estruturada seguindo o formato JSON especificado.`;

    const result = await model.generateContent(promptText);

    const responseText = result.response.text();
    
    // Tentar parsear o JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      // Se falhar, tentar extrair JSON do texto
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Resposta da IA não contém JSON válido");
      }
    }

    // Validar estrutura da resposta
    if (!parsedResponse.avaliacao) {
      throw new Error("Resposta da IA não contém a estrutura esperada");
    }

    return {
      step: "correcao_pronta",
      data: parsedResponse
    };

  } catch (error: any) {
    console.error("Erro na correção:", error);
    
    let errorMessage = "Falha ao corrigir resposta. Tente novamente.";
    
    if (error.message?.includes("API_KEY")) {
      errorMessage = "Erro de configuração: A chave da API do Gemini não está configurada corretamente.";
    } else if (error.message?.includes("quota") || error.message?.includes("rate limit")) {
      errorMessage = "Limite de requisições excedido. Tente novamente em alguns instantes.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      step: "erro",
      message: errorMessage
    };
  }
}

