
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const AICoach: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: 'Olá! Sou seu treinador de elite da ABFIT. Posso ajudar com dicas de treino, nutrição ou motivação. Qual é o foco de hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Fix: Initialize GoogleGenAI with named parameter apiKey from process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Fix: Use systemInstruction in config and pass simplified input to contents as per @google/genai guidelines
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: {
          systemInstruction: 'Você é um treinador de fitness de elite chamado ABFIT Coach. Responda de forma motivadora, direta e técnica.',
        },
      });

      // Fix: Directly access the .text property (not a method) from GenerateContentResponse
      const text = response.text;
      const botMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: text || "Desculpe, não consegui processar sua solicitação." };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error calling Gemini:", error);
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: "Erro de conexão com o Coach. Tente novamente." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-black">
        <div className="p-4 border-b border-zinc-900 bg-zinc-950/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-700 to-orange-500 flex items-center justify-center shadow-lg shadow-red-900/20">
                    <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="font-bold text-white">Elite AI Coach</h2>
                    <p className="text-xs text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Online
                    </p>
                </div>
            </div>
            <Sparkles className="w-5 h-5 text-zinc-600" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div className={`max-w-[85%] rounded-2xl p-4 ${
                        msg.role === 'user' 
                            ? 'bg-red-600 text-white rounded-tr-none' 
                            : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none'
                    }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                     <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 rounded-tl-none flex gap-1">
                        <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                        <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                     </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-zinc-900 bg-black">
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Pergunte sobre treinos..."
                    className="w-full bg-zinc-900 text-white border border-zinc-800 rounded-full py-3.5 pl-5 pr-12 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder:text-zinc-600"
                />
                <button 
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="absolute right-2 p-2 bg-red-600 rounded-full hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 transition-colors"
                >
                    <Send className="w-4 h-4 text-white" />
                </button>
            </div>
        </div>
    </div>
  );
};

export default AICoach;
