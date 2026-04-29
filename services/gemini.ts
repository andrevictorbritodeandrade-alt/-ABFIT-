
import { GoogleGenAI, Type } from "@google/genai";

const MODEL_TEXT = 'gemini-3-flash-preview';
const MODEL_IMAGE = 'gemini-2.5-flash-image';

// Robust API key detection for different environments (Vite, Cloud Run, etc)
const getApiKey = () => {
  return (
    (import.meta as any).env?.VITE_GEMINI_API_KEY || 
    (import.meta as any).env?.GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') ||
    (typeof process !== 'undefined' ? process.env?.API_KEY : '') ||
    ''
  );
};

let genAIInstance: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAIInstance) {
    const apiKey = getApiKey();
    if (!apiKey) {
      return null;
    }
    genAIInstance = new GoogleGenAI({ apiKey });
  }
  return genAIInstance;
}

export async function analyzeExerciseAndGenerateImage(exerciseName: string, studentProfile?: any): Promise<any> {
  const ai = getGenAI();
  if (!ai) return null;
  try {
    const brainPrompt = `Analise o exercício "${exerciseName}". 
    Instruções biomecânicas de Mestre:
    - Se HBC: Haltere (Dumbbell).
    - Se HBL: Barra Longa Olímpica.
    - Se "alternado": Execução assimétrica.
    
    Forneça JSON puro: {"description": "descrição curta", "benefits": "3 benefícios principais", "visualPrompt": "Detailed 4k gym prompt for imagen of a black athlete"}`;

    const brainResponse = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: brainPrompt,
      config: { responseMimeType: "application/json" }
    });

    const brainResult = JSON.parse(brainResponse.text || "{}");
    
    // Use gemini-2.5-flash-image for generation via generateContent
    const imageResponse = await ai.models.generateContent({
      model: MODEL_IMAGE,
      contents: brainResult.visualPrompt || `Professional athlete performing ${exerciseName}, gym setting, 4k resolution`,
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });
    
    let imageUrl = null;
    const parts = imageResponse.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    return { ...brainResult, imageUrl };
  } catch (e) {
    console.error("Erro GenAI:", e);
    return null;
  }
}

export async function generateWorkoutFromText(prompt: string): Promise<any[]> {
  const ai = getGenAI();
  if (!ai) return [];
  
  const systemInstruction = `
    Você é o ABFIT AI, um treinador Mestre. 
    Gere uma lista de exercícios baseada no pedido do usuário.
    Retorne APENAS um JSON array.
    Estrutura: [{"name": "Nome", "sets": "3", "reps": "12", "rest": "60", "method": "Normal", "load": ""}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        systemInstruction: systemInstruction
      }
    });

    const text = response.text || "[]";
    const json = JSON.parse(text);
    return Array.isArray(json) ? json : [];
  } catch (e) {
    console.error("Erro ao gerar treino por texto:", e);
    return [];
  }
}

export async function generateRunningPlan(anamneseData: any): Promise<any> {
  const ai = getGenAI();
  if (!ai) return null;
  const prompt = `Gere planilha de corrida para: ${JSON.stringify(anamneseData)}. Responda JSON: {"workouts": [{"dayOfWeek": "Segunda", "type": "Tiro", "warmupTime": 10, "sets": 1, "reps": 8, "stimulusTime": "400m", "recoveryTime": 60, "cooldownTime": 5, "totalTime": 45, "pace": "4:30"}]}`;
  try {
    const res = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text || "{}");
  } catch (e) { return null; }
}

export async function generateTechnicalCue(exerciseName: string) {
  const ai = getGenAI();
  if (!ai) return "Mantenha a estabilidade do core.";
  try {
    const res = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: `Dica biomecânica rápida de Mestre para ${exerciseName}.`
    });
    return res.text;
  } catch (e) { return "Mantenha a estabilidade do core."; }
}

export async function generateBioInsight(profile: any) {
  const ai = getGenAI();
  if (!ai) return "";
  try {
    const res = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: `Forneça 3 dicas de segurança clínica para o aluno: ${profile.name || 'Atleta'}. Foco em fisiologia.`
    });
    return res.text;
  } catch (e) { return ""; }
}

export async function generateAIMealPlan(profile: any): Promise<any> {
  const ai = getGenAI();
  if (!ai) return null;
  const prompt = `Gere um plano alimentar diário para: ${JSON.stringify(profile)}. Responda JSON: {"id": "1", "date": "2024-01-01", "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..."}`;
  try {
    const res = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text || "{}");
  } catch (e) { return null; }
}

export async function estimateFoodMacros(foodInput: string): Promise<any> {
  const ai = getGenAI();
  if (!ai) return null;
  const prompt = `Estime macros para: "${foodInput}". Responda JSON: {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}`;
  try {
    const res = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text || "{}");
  } catch (e) { return null; }
}

export async function extractWorkoutFromImage(imageBase64: string): Promise<any[]> {
  const ai = getGenAI();
  if (!ai) return [];
  
  // Limpeza de header base64 caso exista
  const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const prompt = `
    Analyze the image which contains a list of gym exercises.
    Return a JSON ARRAY containing the exercises found.
    Translate exercise names to Portuguese (Brazil) if they are in English.
    
    Structure per item:
    {
      "name": "Nome do Exercício",
      "sets": "3",
      "reps": "12",
      "rest": "60",
      "method": "Normal"
    }

    If sets/reps are not visible, use default "3" sets and "12" reps.
    Do NOT include markdown formatting. Just the raw JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: prompt }
          ]
        }
      ],
      config: { 
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "[]";
    const json = JSON.parse(text);
    return Array.isArray(json) ? json : [];

  } catch (e) {
    console.error("Erro fatal na extração:", e);
    return [];
  }
}
