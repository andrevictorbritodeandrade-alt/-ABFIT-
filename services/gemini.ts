
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_PRO = 'gemini-3-pro-preview';
const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_IMAGE = 'gemini-2.5-flash-image';

export async function generatePeriodizationPlan(data: any): Promise<any> {
  const systemInstruction = `Você é um PhD em Fisiologia do Exercício e mestre em Metodologia do Treinamento de Força.
  Sua tarefa é criar um MESOCICLO de 4 semanas extremamente técnico e personalizado.
  - Responda APENAS JSON.`;

  const prompt = `Gere uma periodização para o atleta ${data.name}. Objetivo: ${data.goal}. Dias: ${data.daysPerWeek}.
  JSON: { "titulo": "", "modelo_teorico": "", "objetivo_longo_prazo": "", "microciclos": [{ "semana": 1, "tipo": "", "foco": "", "faixa_repeticoes": "", "pse_alvo": "" }], "notas_phd": "" }`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: { systemInstruction, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { return null; }
}

export async function generateRunningPlan(anamneseData: any): Promise<any> {
  const systemInstruction = `Você é um Treinador de Corrida de Elite (PhD em Fisiologia do Exercício).
  Sua tarefa é criar uma planilha de corrida semanal técnica baseada no perfil do atleta.
  - Tipos de treino permitidos: tiro, ritmo, longao, fartlek.
  - Responda APENAS JSON.`;

  const prompt = `Atleta: ${anamneseData.name}. Nível: ${anamneseData.experience}. Objetivo: ${anamneseData.goal}. 
  Gere uma lista de 3 a 5 treinos semanais.
  JSON: { "workouts": [{ "dayOfWeek": "Segunda", "type": "tiro", "warmupTime": 10, "sets": 8, "reps": 1, "stimulusTime": "400m", "recoveryTime": 90, "cooldownTime": 5, "totalTime": 45, "pace": "04:30" }] }`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: { systemInstruction, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{ \"workouts\": [] }");
  } catch (error) { return null; }
}

export async function analyzeExerciseAndGenerateImage(exerciseName: string, studentProfile?: any): Promise<any> {
  try {
    const brainPrompt = `Analise o exercício "${exerciseName}". 
    - Se HBC: Haltere. Se HBL: Barra Longa.
    - Se "alternado": Execução asimétrica.
    - Se "sumô": Pernas afastadas.
    Forneça: 1. Descrição técnica (PT). 2. 3 Benefícios (PT). 3. PROMPT VISUAL INGLÊS 8k atleta preto, luz estúdio.
    JSON: {"description": "", "benefits": "", "visualPrompt": ""}`;

    const brainResponse = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: brainPrompt,
      config: { responseMimeType: "application/json" }
    });

    const brainResult = JSON.parse(brainResponse.text || "{}");
    
    const imageResponse = await ai.models.generateContent({
      model: MODEL_IMAGE,
      contents: { parts: [{ text: brainResult.visualPrompt || `Cinematic shot of athlete doing ${exerciseName}` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    
    let imageUrl = null;
    if (imageResponse.candidates?.[0]?.content?.parts) {
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    return { ...brainResult, imageUrl };
  } catch (e) { return null; }
}

export async function generateTechnicalCue(exerciseName: string, profile?: any) {
  try {
    const res = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: { parts: [{ text: `Dica biomecânica rápida para: "${exerciseName}". Aluno: ${profile?.neurodivergence || 'padrão'}.` }] },
      config: { systemInstruction: "Você é um treinador de elite especialista em biomecânica." }
    });
    return res.text || "Mantenha o controle do movimento.";
  } catch (e) { return "Mantenha o core ativado e a execução controlada."; }
}

export async function generateBioInsight(profile: any) {
  if (!profile.nome) return "";
  try {
    const prompt = `Analise: Aluno: ${profile.nome}, TEA/TDAH: ${profile.neurodivergence}, Bariátrica: ${profile.bariatric ? 'Sim' : 'Não'}. Forneça 3 dicas curtas de segurança e foco para o treinador.`;
    const data = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
      config: { systemInstruction: "Você é um PhD em Fisiologia. Responda de forma curta e técnica." }
    });
    return data.text || "";
  } catch (err) { return ""; }
}

export async function generateAIMealPlan(profile: any): Promise<any> {
  const systemInstruction = "Você é um nutricionista esportivo de elite. Gere um plano alimentar diário baseado nos objetivos e restrições do atleta.";
  const prompt = `Gere um plano alimentar para um atleta com objetivo: ${profile.goal}. Restrições: ${profile.restrictions}. Alvos diários: ${JSON.stringify(profile.dailyTargets)}.`;

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
            id: { type: Type.STRING, description: "ID único para o plano" },
            date: { type: Type.STRING, description: "Data no formato ISO ou similar" },
            breakfast: { type: Type.STRING, description: "Descrição do café da manhã" },
            lunch: { type: Type.STRING, description: "Descrição do almoço" },
            dinner: { type: Type.STRING, description: "Descrição do jantar" },
            snacks: { type: Type.STRING, description: "Descrição dos lanches" }
          },
          required: ["id", "date", "breakfast", "lunch", "dinner", "snacks"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating meal plan:", error);
    return null;
  }
}

export async function estimateFoodMacros(foodDescription: string): Promise<any> {
  const systemInstruction = "Você é um especialista em nutrição. Estime os macronutrientes da descrição de alimento fornecida.";
  const prompt = `Estime os macronutrientes para: "${foodDescription}".`;

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
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER }
          },
          required: ["calories", "protein", "carbs", "fat"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error estimating macros:", error);
    return null;
  }
}
