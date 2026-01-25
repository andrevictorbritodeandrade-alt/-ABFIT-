
import { GoogleGenAI } from "@google/genai";

const MODEL_TEXT = 'gemini-3-flash-preview';
const MODEL_IMAGE = 'gemini-2.5-flash-image';

export async function analyzeExerciseAndGenerateImage(exerciseName: string, studentProfile?: any): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const brainPrompt = `Analise o exercício "${exerciseName}". 
    Instruções biomecânicas de PhD:
    - Se HBC: Haltere (Dumbbell).
    - Se HBL: Barra Longa Olímpica.
    - Se "alternado": Execução assimétrica.
    
    Forneça JSON puro: {"description": "descrição curta", "benefits": "3 benefícios principais", "visualPrompt": "Detailed 8k gym prompt for imagen of a black athlete"}`;

    const brainResponse = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: brainPrompt,
      config: { responseMimeType: "application/json" }
    });

    const brainResult = JSON.parse(brainResponse.text || "{}");
    
    // Usando gemini-2.5-flash-image com generateContent (mais estável)
    const imageResponse = await ai.models.generateContent({
      model: MODEL_IMAGE,
      contents: brainResult.visualPrompt || `Professional athlete performing ${exerciseName}, gym setting, 8k resolution`,
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
  } catch (e) {
    console.error("Erro GenAI:", e);
    return null;
  }
}

export async function generateRunningPlan(anamneseData: any): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: `Dica biomecânica rápida de PhD para ${exerciseName}.`
    });
    return res.text;
  } catch (e) { return "Mantenha a estabilidade do core."; }
}

export async function generateBioInsight(profile: any) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: `Forneça 3 dicas de segurança clínica para o aluno: ${profile.name || 'Atleta'}. Foco em fisiologia.`
    });
    return res.text;
  } catch (e) { return ""; }
}

export async function generateAIMealPlan(profile: any): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
