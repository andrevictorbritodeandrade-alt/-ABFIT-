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
    const { userId, treinoId } = req.body;
    
    if (!userId || !treinoId) {
      return res.status(400).json({ error: 'userId e treinoId são obrigatórios.' });
    }

    try {
      const db = admin.firestore();
      const userPath = `artifacts/${projectId}/public/data/students/${userId}`;
      const userDocRef = db.doc(userPath);
      const completesCollection = userDocRef.collection('treinosConcluidos');

      // 1. Busca o documento do treino para saber a meta
      let meta = 20;
      let nomeTreino = "Treino";

      const treinoDoc = await db.collection('treinos').doc(treinoId).get();
      if (treinoDoc.exists) {
        meta = treinoDoc.data()?.meta || 20;
        nomeTreino = treinoDoc.data()?.nome || "Treino";
      } else {
        // Se não achou na coleção global, tenta no documento do usuário
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const workouts: any[] = userData?.workouts || [];
          const workout = workouts.find((w: any) => w.id === treinoId);
          if (workout) {
            meta = workout.meta || 20;
            nomeTreino = workout.title || workout.nome || "Treino";
          }
        }
      }

      // 2. Registra o treino concluído na subcoleção do usuário
      await completesCollection.add({
        treinoId: treinoId,
        data: admin.firestore.FieldValue.serverTimestamp(),
        timestamp: Date.now()
      });

      // 3. Conta quantos treinos desse tipo o usuário já fez
      const registros = await completesCollection.where('treinoId', '==', treinoId).get();
      const total = registros.size;

      // 3b. Conta TODOS os treinos que o usuário já fez
      const registrosTotais = await completesCollection.get();
      const totalGlobal = registrosTotais.size;

      // 4. Retorna os dados
      res.json({
        treinoId: treinoId,
        total: total,
        totalGlobal: totalGlobal,
        meta: meta,
        metaAtingida: total >= meta,
        mensagem: total >= meta
          ? `Parabéns! Você completou as ${meta} repetições do ${nomeTreino}. Considere trocar a planilha.`
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
