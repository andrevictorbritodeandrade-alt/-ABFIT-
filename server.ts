import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";

// Read config once
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const projectId = firebaseConfig.projectId;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(cors());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", aiConfigured: !!GEMINI_API_KEY });
  });

  // Finalizar Treino Endpoint
  app.post("/api/finalizarTreino", async (req, res) => {
    const { userId, treinoId, duracaoMinutos, calorias, cargas } = req.body;
    
    if (!userId || !treinoId) {
      return res.status(400).json({ error: 'userId e treinoId são obrigatórios.' });
    }

    try {
      const db = admin.firestore();
      const alunoRef = db.collection('alunos').doc(userId);
      const logsRef = alunoRef.collection('logsTreino');
      const prescricoesRef = alunoRef.collection('prescricoes');

      // 1. Registra o log do treino
      const newLog = {
        prescricaoId: treinoId,
        dataHora: admin.firestore.FieldValue.serverTimestamp(),
        duracaoMinutos: duracaoMinutos || 0,
        calorias: calorias || 0,
        cargas: cargas || [],
        concluido: true,
        timestamp: Date.now()
      };
      await logsRef.add(newLog);

      // 2. Busca todas as prescrições para calcular a meta global
      const prescricoesSnap = await prescricoesRef.get();
      let targetGlobal = 0;
      let targetPerWorkout = 20;
      let nomeTreino = "Treino";

      prescricoesSnap.forEach(doc => {
        const data = doc.data();
        targetGlobal += (data.totalSessoes || 0);
        if (doc.id === treinoId) {
          targetPerWorkout = data.totalSessoes || 20;
          nomeTreino = data.nome || "Treino";
        }
      });

      // 3. Busca todos os logs para calcular o progresso
      const logsSnap = await logsRef.where('concluido', '==', true).get();
      let totalGlobal = logsSnap.size;
      let totalPerWorkout = 0;

      logsSnap.forEach(doc => {
        if (doc.data().prescricaoId === treinoId) {
          totalPerWorkout++;
        }
      });

      // 4. Retorna os dados
      res.json({
        treinoId: treinoId,
        total: totalPerWorkout, // total for this workout
        meta: targetPerWorkout,   // meta for this workout
        totalGlobal: totalGlobal,
        metaGlobal: targetGlobal,
        nomeTreino: nomeTreino,
        metaAtingida: totalPerWorkout >= targetPerWorkout,
        mensagem: totalPerWorkout >= targetPerWorkout
          ? `Parabéns! Você completou as ${targetPerWorkout} sessões do ${nomeTreino}.`
          : null
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao finalizar treino.' });
    }
  });

  // Proxy Image Generation to Backend
  app.post("/api/generateImage", async (req, res) => {
    const { prompt, model } = req.body;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "API Key not configured on server" });
    }
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const result = await ai.models.generateContent({
        model: model || 'gemini-1.5-flash',
        contents: prompt,
      });
      
      let imageUrl = null;
      const parts = result.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      res.json({ imageUrl });
    } catch (e: any) {
      console.error("Server-side AI Error:", e);
      res.status(500).json({ error: e.message || 'Erro ao gerar imagem.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`AI Configuration: ${!!GEMINI_API_KEY ? "SUCCESS" : "MISSING KEY"}`);
  });
}

startServer();
