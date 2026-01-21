
import { GoogleGenAI, Type } from "@google/genai";

// Inicialização segura com a chave do ambiente conforme as diretrizes
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Conforme diretrizes: Pro para tarefas complexas (Periodização), Flash para tarefas básicas
const MODEL_PRO = 'gemini-3-pro-preview';
const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_IMAGE = 'gemini-2.5-flash-image';

/**
 * Gera um plano de periodização científica nível PhD (EEFD/UFRJ)
 * Utiliza o modelo PRO para maior precisão em raciocínio esportivo complexo.
 */
export async function generatePeriodizationPlan(data: any): Promise<any> {
  const systemInstruction = `Você é um PhD em Fisiologia do Exercício e mestre em Metodologia do Treinamento de Força.
  Sua tarefa é criar um MESOCICLO de 4 semanas extremamente técnico e personalizado.
  
  CONTEXTO CIENTÍFICO OBRIGATÓRIO:
  - Aplicação de Matveev (Carga Progressiva) e Bompa (Periodização de Força).
  - Ajuste de PSE (Percepção Subjetão de Esforço) conforme a fase.
  - Otimização de volume conforme a frequência semanal do atleta.

  REGRAS DE RESPOSTA:
  - Responda APENAS com o objeto JSON solicitado.
  - Não use blocos de código markdown.
  - Use termos técnicos em português do Brasil.`;

  const prompt = `Gere uma periodização para o atleta ${data.name}.
  Objetivo: ${data.goal}
  Modelo: ${data.model}
  Fase: ${data.phase}
  Frequência: ${data.daysPerWeek} dias por semana
  Atividade Concorrente: ${data.concurrent ? 'Sim' : 'Não'}

  JSON esperado:
  {
    "titulo": "Nome Técnico do Mesociclo",
    "modelo_teorico": "Explicação breve do modelo aplicado",
    "objetivo_longo_prazo": "Meta para o final do ciclo",
    "distribuicao_volume": "Como o volume variará semanalmente",
    "microciclos": [
      {
        "semana": 1,
        "tipo": "Ordinário/Choque/Recuperação",
        "foco": "Força/Hipertrofia/RML",
        "faixa_repeticoes": "Ex: 8-10",
        "pse_alvo": "Ex: 7-8",
        "descricao_carga": "Indicação de intensidade"
      }
    ],
    "notas_phd": "Recomendação biomecânica final"
  }`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const jsonStr = text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Periodization Error:", error);
    return null;
  }
}

/**
 * Gera uma imagem para o exercício especificado usando o modelo de imagem nano banana
 */
export async function generateExerciseImage(exerciseName: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_IMAGE,
      contents: { parts: [{ text: `Cinematic high-detail action shot of an athlete performing ${exerciseName} correctly in a professional training facility, dramatic lighting` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (e) { 
    console.error("Image Gen Error:", e);
    return null; 
  }
}

/**
 * Fornece uma instrução biomecânica crucial (cue técnico)
 */
export async function generateTechnicalCue(exerciseName: string) {
  try {
    const res = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: { parts: [{ text: `Forneça uma instrução biomecânica crucial (cue técnico) para o exercício: ${exerciseName}` }] },
      config: { systemInstruction: "Você é um treinador de elite especialista em biomecânica." }
    });
    return res.text || "Mantenha o controle do movimento.";
  } catch (e) { return "Mantenha o core ativado e a execução controlada."; }
}

/**
 * Gera um plano alimentar diário usando IA
 */
export async function generateAIMealPlan(profile: any): Promise<any> {
  const systemInstruction = "Você é um nutricionista esportivo de elite. Gere um plano alimentar diário (Café da manhã, Almoço, Jantar, Snacks) baseado no perfil do usuário.";
  const prompt = `Gere um plano alimentar para um atleta com objetivo de ${profile.goal}. Restrições: ${profile.restrictions}. Metas diárias: ${profile.dailyTargets.calories} kcal.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            breakfast: { type: Type.STRING, description: "Café da manhã sugerido" },
            lunch: { type: Type.STRING, description: "Almoço sugerido" },
            dinner: { type: Type.STRING, description: "Jantar sugerido" },
            snacks: { type: Type.STRING, description: "Lanches sugeridos" },
          },
          required: ["breakfast", "lunch", "dinner", "snacks"],
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    const data = JSON.parse(text.trim());
    return {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      ...data
    };
  } catch (error) {
    console.error("Meal Plan Error:", error);
    return null;
  }
}

/**
 * Estima macronutrientes para uma descrição de alimento
 */
export async function estimateFoodMacros(foodDescription: string): Promise<any> {
  const systemInstruction = "Você é um especialista em nutrição. Estime os macronutrientes (calorias, proteínas, carboidratos, gorduras) para a descrição de comida fornecida.";
  const prompt = `Estime os macros para: "${foodDescription}"`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER, description: "Calorias em kcal" },
            protein: { type: Type.NUMBER, description: "Proteínas em gramas" },
            carbs: { type: Type.NUMBER, description: "Carboidratos em gramas" },
            fat: { type: Type.NUMBER, description: "Gorduras em gramas" }
          },
          required: ["calories", "protein", "carbs", "fat"]
        }
      }
    });
    const text = response.text;
    return text ? JSON.parse(text.trim()) : null;
  } catch (error) {
    console.error("Macro Estimation Error:", error);
    return null;
  }
}
