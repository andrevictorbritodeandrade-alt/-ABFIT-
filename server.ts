import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import cors from "cors";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";

const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(cors());

  // API Routes
  app.post("/api/ai/generate", async (req, res) => {
    if (!genAI) {
      return res.status(500).json({ error: "A CHAVE DA IA (GEMINI_API_KEY) NÃO ESTÁ CONFIGURADA NO SERVIDOR." });
    }

    const { 
      model: modelName, 
      prompt, 
      systemInstruction, 
      responseMimeType, 
      isImageGeneration,
      isImageAnalysis,
      imageBase64 
    } = req.body;

    try {
      const model = modelName || 'gemini-3-flash-preview';

      let contents: any[] = [];
      if (isImageAnalysis && imageBase64) {
        const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        contents = [
          {
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
              { text: prompt }
            ]
          }
        ];
      } else {
        contents = [{ parts: [{ text: prompt }] }];
      }

      const result = await genAI.models.generateContent({
        model: model,
        contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      if (isImageGeneration || modelName === 'gemini-2.5-flash-image') {
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
        return res.json({ imageUrl });
      }

      res.json({ text: result.text });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", aiConfigured: !!genAI });
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
    console.log(`AI Configuration: ${!!genAI ? "SUCCESS" : "MISSING KEY"}`);
  });
}

startServer();
