import { GoogleGenAI, Type } from "@google/genai";
import { NutritionProfile, MealPlan, MacroNutrients } from "../types";

// Initialize the Google GenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_PRO = 'gemini-3-pro-preview';
const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_IMAGE = 'gemini-2.5-flash-image';

/**
 * Generates a technical periodization plan for a student using the Pro model.
 */
export async function generatePeriodizationPlan(data: any): Promise<any> {
  const systemInstruction = `Você é um PhD em Fisiologia do Exercício e mestre em Metodologia do Treinamento de Força.
  Sua tarefa é criar um MESOCICLO de 4 semanas extremamente técnico e personalizado baseado em PBE (Prática Baseada em Evidências).
  - Responda APENAS JSON.`;

  const prompt = `Gere uma periodização para o atleta ${data.name}. Objetivo: ${data.goal}. Dias por semana: ${data.daysPerWeek}.
  JSON esperado: { "titulo": "NOME DO MESOCICLO", "modelo_teorico": "EX: BLOCO DE ACUMULAÇÃO", "objetivo_longo_prazo": "DESCRIÇÃO TÉCNICA", "microciclos": [{ "semana": 1, "tipo": "CHOQUE/RECUPERAÇÃO/ESTABILIZAÇÃO", "foco": "VOLUME/INTENSIDADE", "faixa_repeticoes": "6-8", "pse_alvo": "8-9" }], "notas_phd": "NOTAS TÉCNICAS DO TREINADOR" }`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: { systemInstruction, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { return null; }
}

/**
 * Generates a technical running plan using the Pro model.
 */
export async function generateRunningPlan(anamneseData: any): Promise<any> {
  const systemInstruction = `Você é um Treinador de Corrida de Elite (PhD em Fisiologia do Exercício).
  Sua tarefa é criar uma planilha de corrida semanal técnica baseada no perfil biomecânico e fisiológico do atleta.
  - Tipos de treino permitidos: tiro (HIIT), ritmo (TEMPO RUN), longao (LSD), fartlek.
  - Responda APENAS JSON.`;

  const prompt = `Atleta: ${anamneseData.name}. Nível: ${anamneseData.experience}. Objetivo: ${anamneseData.goal}. 
  Gere uma lista de 3 a 5 treinos semanais.
  JSON esperado: { "workouts": [{ "dayOfWeek": "Segunda", "type": "TIRO/RITMO/ETC", "warmupTime": 10, "sets": 8, "reps": 1, "stimulusTime": "400m", "recoveryTime": 90, "cooldownTime": 5, "totalTime": 45, "pace": "04:30" }] }`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: { systemInstruction, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{ \"workouts\": [] }");
  } catch (error) { return null; }
}

/**
 * Analyzes an exercise and generates a corresponding image using Flash and Image models.
 */
export async function analyzeExerciseAndGenerateImage(exerciseName: string, studentProfile?: any): Promise<any> {
  try {
    const brainPrompt = `Analise o exercício "${exerciseName}". 
    Instruções biomecânicas de PhD:
    - Se HBC: Haltere (Dumbbell). Nunca use barra se for HBC.
    - Se HBL: Barra Longa Olímpica.
    - Se "alternado": Um membro no topo em isometria enquanto outro executa, ou troca rítmica.
    - Se "sumô": Base larga, abdução de quadril.
    - Se "supino": Atleta em decúbito dorsal.
    
    Forneça:
    1. Descrição biomecânica curta (português).
    2. 3 Benefícios fisiológicos listados (português).
    3. PROMPT VISUAL INGLÊS 8k realista descrevendo atleta negro de elite em academia de luxo, foco na musculatura e luz dramática.
    JSON: {"description": "", "benefits": "", "visualPrompt": ""}`;

    const brainResponse = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: brainPrompt,
      config: { responseMimeType: "application/json" }
    });

    const brainResult = JSON.parse(brainResponse.text || "{}");
    
    const imageResponse = await ai.models.generateContent({
      model: MODEL_IMAGE,
      contents: { parts: [{ text: brainResult.visualPrompt || `Professional black athlete performing ${exerciseName} in elite high-end gym environment, cinematic lighting, 8k resolution` }] },
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

/**
 * Generates a quick technical cue for a specific exercise using the Flash model.
 */
export async function generateTechnicalCue(exerciseName: string, profile?: any) {
  try {
    const res = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: { parts: [{ text: `Dica biomecânica rápida de elite para: "${exerciseName}". Seja técnico e direto.` }] },
      config: { systemInstruction: "Você é um treinador PhD especialista em biomecânica aplicada ao treinamento de força." }
    });
    return res.text || "Mantenha o controle excêntrico e a estabilidade escapular.";
  } catch (e) { return "Mantenha o core ativado e a execução controlada."; }
}

/**
 * Generates biological insights for an athlete profile using the Flash model.
 */
export async function generateBioInsight(profile: any) {
  if (!profile.nome) return "";
  try {
    const prompt = `Analise fisiologicamente: Atleta: ${profile.nome}. Forneça 3 diretrizes de segurança de elite para o treinador.`;
    const data = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
      config: { systemInstruction: "Você é um PhD em Fisiologia do Esforço. Responda de forma curta e extremamente técnica." }
    });
    return data.text || "";
  } catch (err) { return ""; }
}

/**
 * Generates a professional AI meal plan based on the student's profile.
 */
export async function generateAIMealPlan(profile: NutritionProfile): Promise<MealPlan | null> {
  const systemInstruction = `Você é um nutricionista esportivo de elite (PhD). 
  Sua tarefa é criar um plano alimentar diário técnico baseado no objetivo e restrições do atleta.
  - Responda APENAS JSON.`;

  const prompt = `Atleta: Objetivo: ${profile.goal}. Restrições: ${profile.restrictions}. 
  JSON esperado: { "id": "${Date.now()}", "date": "${new Date().toISOString().split('T')[0]}", "breakfast": "descrição técnica detalhada", "lunch": "descrição técnica detalhada", "dinner": "descrição técnica detalhada", "snacks": "descrição técnica detalhada" }`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: { systemInstruction, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "null");
  } catch (error) {
    console.error("Error generating meal plan:", error);
    return null;
  }
}

/**
 * Estimates macronutrients for a text-based food input using the Flash model.
 */
export async function estimateFoodMacros(foodInput: string): Promise<MacroNutrients | null> {
  const systemInstruction = `Você é um especialista em composição de alimentos e nutrição esportiva. 
  Sua tarefa é estimar os macronutrientes (calorias, proteínas, carboidratos e gorduras) para a descrição de alimento fornecida.
  - Responda APENAS JSON.`;

  const prompt = `Alimento: ${foodInput}. 
  JSON esperado: { "calories": number, "protein": number, "carbs": number, "fat": number }`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
      config: { systemInstruction, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "null");
  } catch (error) {
    console.error("Error estimating macros:", error);
    return null;
  }
}