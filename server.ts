import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";

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
      
      // 1. Busca o documento do treino para saber a meta
      const treinoDoc = await db.collection('treinos').doc(treinoId).get();
      if (!treinoDoc.exists) {
        return res.status(404).json({ error: 'Treino não encontrado.' });
      }
      const meta = treinoDoc.data()?.meta || 20;

      // 2. Registra o treino concluído na subcoleção do usuário
      await db
        .collection('usuarios')
        .doc(userId)
        .collection('treinosConcluidos')
        .add({
          treinoId: treinoId,
          data: admin.firestore.FieldValue.serverTimestamp(),
          timestamp: Date.now()
        });

      // 3. Conta quantos treinos desse tipo o usuário já fez
      const registros = await db
        .collection('usuarios')
        .doc(userId)
        .collection('treinosConcluidos')
        .where('treinoId', '==', treinoId)
        .get();

      const total = registros.size;

      // 3b. Conta TODOS os treinos que o usuário já fez
      const registrosTotais = await db
        .collection('usuarios')
        .doc(userId)
        .collection('treinosConcluidos')
        .get();

      const totalGlobal = registrosTotais.size;

      // 4. Retorna os dados
      res.json({
        treinoId: treinoId,
        total: total,
        totalGlobal: totalGlobal,
        meta: meta,
        metaAtingida: total >= meta,
        mensagem: total >= meta
          ? `Parabéns! Você completou as ${meta} repetições do ${treinoDoc.data()?.nome}. Considere trocar a planilha.`
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
      const ai = new GoogleGenAI({});
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
