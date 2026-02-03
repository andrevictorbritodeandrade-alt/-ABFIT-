
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Trophy, MapPin, Clock, ExternalLink, Bell, ArrowLeft, 
  DollarSign, TrendingUp, Zap, X, Info, CheckCircle 
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { db, appId } from '../services/firebase';

// --- LINK ÚNICO DE INFORMAÇÕES ---
const INFO_LINK = "https://www.riorunningtour.com.br/calendario-corridas-rio-de-janeiro";

// --- IMAGENS DE FUNDO DINÂMICO ---
const BG_IMAGES = [
  "https://images.unsplash.com/photo-1532444458054-01a7dd3e9fca?q=80&w=1920&auto=format&fit=crop", // Running sunset
  "https://images.unsplash.com/photo-1552674605-46f538379c43?q=80&w=1920&auto=format&fit=crop", // Group running
  "https://images.unsplash.com/photo-1486218119243-13883505764c?q=80&w=1920&auto=format&fit=crop", // Runner shoes
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1920&auto=format&fit=crop", // Track
  "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1920&auto=format&fit=crop", // Trail
];

// --- COMPONENTE DE FIGURA (BANNER DE CABEÇALHO DO MÊS) ---
const MonthArt = ({ month }: { month: string }) => {
  const arts: Record<string, string> = {
    "Janeiro": "https://images.unsplash.com/photo-1596464716127-f9a0859b4bce?q=80&w=800&auto=format&fit=crop",
    "Fevereiro": "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?q=80&w=800&auto=format&fit=crop",
    "Março": "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=800&auto=format&fit=crop",
    "Abril": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop",
    "Maio": "https://images.unsplash.com/photo-1533561052604-c3beb6d55760?q=80&w=800&auto=format&fit=crop",
    "Junho": "https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=800&auto=format&fit=crop",
    "Julho": "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?q=80&w=800&auto=format&fit=crop",
    "Agosto": "https://images.unsplash.com/photo-1502904550040-7534597429ae?q=80&w=800&auto=format&fit=crop",
    "Setembro": "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=800&auto=format&fit=crop",
    "Outubro": "https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?q=80&w=800&auto=format&fit=crop",
    "Novembro": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=800&auto=format&fit=crop",
    "Dezembro": "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=800&auto=format&fit=crop"
  };

  const img = arts[month];

  return (
    <div className="w-full h-40 rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-6 bg-white flex items-center justify-center relative group">
      {img ? (
        <>
          <img 
            src={img} 
            alt={month} 
            className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
             <h3 className="text-4xl font-poppins font-black text-white uppercase italic tracking-tighter drop-shadow-lg">{month}</h3>
          </div>
        </>
      ) : (
        <div className="w-full h-32 bg-slate-200 flex items-center justify-center">
           <span className="font-poppins font-black uppercase text-slate-400">Mês {month}</span>
        </div>
      )}
    </div>
  );
};

// --- DADOS TOTAIS (LISTA COMPLETA DE 23 CORRIDAS) ---
const INITIAL_PREDICTIONS = [
  { nome: "Run Experience Pão de Açúcar", data: "04/01", dataIso: "2026-01-04", cidade: "RJ", horario: "06:30", largada: "Praia Vermelha, Urca", link: INFO_LINK, valor: "R$ 189,00", info: "Trilha Morro da Urca + 5km Asfalto." },
  { nome: "2ª Maricá Night Run", data: "10/01", dataIso: "2026-01-10", cidade: "Maricá", horario: "19:00", largada: "Itaipuaçu, Maricá", link: INFO_LINK, valor: "R$ 89,90", info: "Prova nocturna com medalha especial." },
  { nome: "Run Experience Lagoa Rodrigo de Freitas", data: "11/01", dataIso: "2026-01-11", cidade: "RJ", horario: "07:30", largada: "Parque da Catacumba, Lagoa", link: INFO_LINK, valor: "R$ 179,00", info: "Run Experience com vista da Lagoa." },
  { nome: "Circuito Oceânico Niterói - Piratininga", data: "11/01", dataIso: "2026-01-11", cidade: "Niterói", horario: "07:30", largada: "Praia de Piratininga, Niterói", link: INFO_LINK, valor: "R$ 95,00", info: "Tradicional prova da Região Oceânica." },
  { nome: "Corrida de São Sebastião (5k)", data: "20/01", dataIso: "2026-01-20", cidade: "RJ", horario: "07:30", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "R$ 115,00", info: "Feriado do Padroeiro do Rio." },
  { nome: "Circuito do Sol 2026", data: "01/02", dataIso: "2026-02-01", cidade: "RJ", horario: "06:30", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "R$ 119,00", info: "Prova de alta velocidade." },
  { nome: "Run Experience Quinta da Boa Vista", data: "15/02", dataIso: "2026-02-15", cidade: "RJ", horario: "07:30", largada: "São Cristóvão", link: INFO_LINK, valor: "R$ 169,00", info: "Percurso histórico e arborizado." },
  { nome: "Circuito das Estações - Outono", data: "08/03", dataIso: "2026-03-08", cidade: "RJ", horario: "07:00", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "R$ 129,00", info: "Abertura do circuito nacional 2026." },
  { nome: "Corrida das Poderosas (Etapa 1)", data: "15/03", dataIso: "2026-03-15", cidade: "RJ", horario: "07:00", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "R$ 110,00", info: "Homenagem ao mês da mulher." },
  { nome: "Run Experience Santa Teresa", data: "12/04", dataIso: "2026-04-12", cidade: "RJ", horario: "07:00", largada: "Largo do Curvelo, Santa Teresa", link: INFO_LINK, valor: "R$ 189,00", info: "Muitas subidas e vistas icónicas." },
  { nome: "Meia do Porto - Etapa 5k", data: "26/04", dataIso: "2026-04-26", cidade: "RJ", horario: "07:00", largada: "Porto Maravilha", link: INFO_LINK, valor: "R$ 110,00", info: "Percurso plano no Boulevard Olímpico." },
  { nome: "Meia Maratona de Niterói (5k)", data: "17/05", dataIso: "2026-05-17", cidade: "Niterói", horario: "07:00", largada: "Caminho Niemeyer, Niterói", link: INFO_LINK, valor: "R$ 105,00", info: "Arquitetura e corrida à beira-mar." },
  { nome: "Circuito das Estações - Inverno", data: "31/05", dataIso: "2026-05-31", cidade: "RJ", horario: "07:00", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "R$ 129,00", info: "Segunda etapa da temporada." },
  { nome: "Maratona do Rio (Family Run 5k)", data: "04/06", dataIso: "2026-06-04", cidade: "RJ", horario: "08:00", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "R$ 160,00", info: "Feriado de Corpus Christi." },
  { nome: "Run Experience Vidigal", data: "19/07", dataIso: "2026-07-19", cidade: "RJ", horario: "07:30", largada: "Base do Vidigal", link: INFO_LINK, valor: "R$ 199,00", info: "Desafio técnico com vista deslumbrante." },
  { nome: "Meia Maratona Internacional do Rio (5k)", data: "16/08", dataIso: "2026-08-16", cidade: "RJ", horario: "07:00", largada: "Leblon", link: INFO_LINK, valor: "Em breve", info: "Uma das mais tradicionais da orla." },
  { nome: "Run Experience Niterói - MAC", data: "23/08", dataIso: "2026-08-23", cidade: "Niterói", horario: "07:30", largada: "MAC Niterói", link: INFO_LINK, valor: "R$ 179,00", info: "Corrida pela orla de Niterói." },
  { nome: "Circuito das Estações - Primavera", data: "20/09", dataIso: "2026-09-20", cidade: "RJ", horario: "07:00", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "R$ 129,00", info: "Terceira etapa da temporada." },
  { nome: "Pink Run RJ (Outubro Rosa)", data: "11/10", dataIso: "2026-10-11", cidade: "RJ", horario: "07:30", largada: "Copacabana", link: INFO_LINK, valor: "R$ 110,00", info: "Corrida solidária de prevenção." },
  { nome: "Run Experience Cristo Redentor", data: "18/10", dataIso: "2026-10-18", cidade: "RJ", horario: "06:00", largada: "Parque Lage", link: INFO_LINK, valor: "R$ 219,00", info: "Subida épica aos pés do Cristo." },
  { nome: "Run Experience Maricá - Ponta Negra", data: "08/11", dataIso: "2026-11-08", cidade: "Maricá", horario: "07:00", largada: "Farol de Ponta Negra", link: INFO_LINK, valor: "R$ 169,00", info: "Trilha e asfalto no litoral de Maricá." },
  { nome: "Night Run RJ - Etapa 2", data: "21/11", dataIso: "2026-11-21", cidade: "RJ", horario: "20:00", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "R$ 135,00", info: "Corrida nocturna com festa." },
  { nome: "Circuito das Estações - Verão", data: "13/12", dataIso: "2026-12-13", cidade: "RJ", horario: "07:00", largada: "Aterro do Flamengo", link: INFO_LINK, valor: "R$ 129,00", info: "Encerramento do circuito 2026." }
];

// --- CARD DE PROVA SLIM ---
const RaceCard: React.FC<{ race: any; onTips: () => void }> = ({ race, onTips }) => (
  <div className="bg-white rounded-[20px] p-4 border-2 border-black britto-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group relative overflow-hidden">
    <div className="flex justify-between items-center mb-3 text-slate-900">
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="w-2 h-6 bg-orange-600 rounded-full shrink-0"></div>
        <h4 className="text-sm font-poppins font-black leading-none uppercase italic truncate group-hover:text-orange-600 transition-colors tracking-tight">
          {race.nome}
        </h4>
      </div>
      <p className="text-xl font-poppins font-black tracking-tighter leading-none shrink-0 ml-2">{race.data}</p>
    </div>

    <div className="flex items-center gap-4 mb-3 text-[10px] font-bold text-slate-500">
      <div className="flex items-center gap-1"><Clock size={12} className="text-blue-500" />{race.horario}</div>
      <div className="flex items-center gap-1"><DollarSign size={12} className="text-green-600" />{race.valor}</div>
      <div className="flex items-center gap-1 flex-1 truncate"><MapPin size={12} className="text-red-500" />{race.largada}</div>
    </div>

    <div className="flex gap-2">
      <button 
        onClick={onTips} 
        className="flex-1 py-2 bg-orange-500 text-white border-2 border-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        <Zap size={11} fill="white" /> Estratégia IA
      </button>
      <a 
        href={INFO_LINK} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex-1 py-2 bg-blue-500 text-white border-2 border-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        Informações <ExternalLink size={11} />
      </a>
    </div>

    <div className="mt-3 pt-3 border-t-2 border-black/10 flex items-center gap-1.5 opacity-40 text-slate-900">
      <Info size={10} />
      <p className="text-[8px] font-black uppercase italic truncate">"{race.info}"</p>
    </div>
  </div>
);

// --- APP PRINCIPAL ---
export function CorreRJView({ onBack }: { onBack: () => void }) {
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaContent, setIaContent] = useState<string | null>(null);
  const [showIaModal, setShowIaModal] = useState(false);
  const [activeRace, setActiveRace] = useState<any>(null);
  const [bgIndex, setBgIndex] = useState(0);
  
  // Ref para controlar o processo de seeding e evitar loops
  const seedingRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % BG_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const racesRef = collection(db, 'artifacts', appId, 'public', 'data', 'races');
    const unsubscribe = onSnapshot(racesRef, (snapshot) => {
      const raceList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Verifica se a quantidade de corridas no banco é menor que o esperado e se o seeding já não está rodando
      if (raceList.length < INITIAL_PREDICTIONS.length && !seedingRef.current) {
        console.log("Detectadas provas faltando. Iniciando sincronização...");
        seedingRef.current = true;
        seedInitialData(raceList).then(() => {
            // Opcional: poderíamos resetar o ref, mas para essa sessão o seeding roda uma vez.
        });
      }
      
      const sorted = raceList.sort((a: any, b: any) => new Date(a.dataIso).getTime() - new Date(b.dataIso).getTime());
      setRaces(sorted);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching races:", error);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const seedInitialData = async (existingData: any[]) => {
    const existingIds = new Set(existingData.map(d => d.id));
    
    for (const race of INITIAL_PREDICTIONS) {
      // Gera ID determinístico baseado na data e nome
      const raceId = `seed_${race.dataIso}_${race.nome.toLowerCase().replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
      
      // Só grava se o ID não existir no banco
      if (!existingIds.has(raceId)) {
          try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'races', raceId), { ...race, lastScrape: new Date().toISOString() }, { merge: true });
          } catch (e) {
            console.error("Error seeding data:", e);
          }
      }
    }
  };

  const callGemini = async (prompt: string, systemInstruction: string, race: any) => {
    setIaLoading(true); setIaContent(null); setActiveRace(race); setShowIaModal(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-09-2025',
        contents: prompt,
        config: {
            systemInstruction: systemInstruction
        }
      });
      setIaContent(response.text || "Sem resposta da IA.");
    } catch (error) { 
        console.error("AI Error:", error);
        setIaContent("Erro ao carregar estratégia."); 
    } finally { 
        setIaLoading(false); 
    }
  };

  const handleGenerateRaceTips = (race: any) => {
    callGemini(`Estratégia curta e direta para a corrida de 5km "${race.nome}" no Rio de Janeiro. Foque no percurso, altimetria estimada e dicas de ritmo.`, "Você é um especialista técnico em corridas de rua do Rio de Janeiro.", race);
  };

  const monthsOrder = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const groupedRaces = useMemo(() => {
    const groups: Record<string, any[]> = {};
    races.forEach(r => {
      const date = new Date(r.dataIso + "T12:00:00Z");
      const m = isNaN(date.getTime()) ? "A Definir" : monthsOrder[date.getUTCMonth()];
      if (!groups[m]) groups[m] = [];
      groups[m].push(r);
    });
    return groups;
  }, [races]);

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-slate-100 overflow-x-hidden text-slate-900 selection:bg-orange-100 font-sans animate-in slide-in-from-bottom-10 duration-500">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,700;0,800;0,900;1,900&family=Inter:wght@400;500;600;700;800&display=swap');
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .glass-header { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); }
        .britto-shadow { box-shadow: 4px 4px 0px 0px rgba(0,0,0,1); }
      `}</style>

      {/* BACKGROUND CARROSSEL */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-black">
        {BG_IMAGES.map((img, idx) => (
          <div
            key={idx}
            className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
            style={{ 
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(10px) brightness(0.7)',
              opacity: bgIndex === idx ? 0.4 : 0,
              zIndex: bgIndex === idx ? 1 : 0
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-80 z-[2]"></div>
      </div>

      <div className="relative z-10 pb-20 h-screen overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-50 glass-header border-b border-black/5 px-4 py-5 shadow-sm">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 bg-black/10 rounded-full hover:bg-black/20 transition-colors">
                 <ArrowLeft size={24} className="text-slate-900" />
              </button>
              <div>
                <h1 className="text-2xl font-poppins font-black italic tracking-tighter uppercase leading-none text-slate-900">
                  CORRE<span className="text-orange-600">RJ</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-600 opacity-80 uppercase tracking-widest mt-1">Calendário 2026</p>
              </div>
            </div>
            <Bell size={20} className="opacity-30 text-slate-900" />
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 pt-6">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-white/10 border-t-orange-600 rounded-full animate-spin"></div>
              <p className="text-[9px] font-black opacity-40 uppercase tracking-widest text-white">Carregando provas...</p>
            </div>
          ) : (
            <div className="space-y-16 pb-24">
              {monthsOrder.map(month => groupedRaces[month] && (
                <section key={month} className="group">
                  <div className="flex items-center gap-4 mb-6 sticky top-[85px] z-40 glass-header py-2 px-4 rounded-full border border-black/5 shadow-md backdrop-blur-md mx-2">
                    <div className="w-3 h-3 bg-orange-600 rounded-full animate-pulse"></div>
                    <h3 className="text-xl font-poppins font-black uppercase italic tracking-tighter text-slate-900 leading-none">{month}</h3>
                    <div className="h-px flex-1 bg-black/10"></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{groupedRaces[month].length} Provas</span>
                  </div>

                  <MonthArt month={month} />

                  <div className="space-y-4">
                    {groupedRaces[month].map((race: any) => (
                      <RaceCard key={race.id} race={race} onTips={() => handleGenerateRaceTips(race)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
        
        <footer className="mt-16 px-8 text-center opacity-40 border-t border-white/10 pt-8 text-white pb-10">
          <p className="text-[8px] font-black uppercase tracking-[0.3em]">
            ESTRATÉGIA CORRE RJ • 2026
          </p>
        </footer>

        {showIaModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[70vh] border-4 border-black britto-shadow">
              <div className="px-5 py-4 border-b-4 border-black flex items-center justify-between bg-yellow-400">
                <div className="flex items-center gap-2">
                  <Zap size={20} fill="black" className="text-black" />
                  <h3 className="font-poppins font-black text-xs uppercase text-black">Estratégia IA</h3>
                </div>
                <button onClick={() => setShowIaModal(false)} className="bg-black text-white rounded-full p-1 hover:bg-slate-800 transition-colors"><X size={16} /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-black font-semibold text-xs leading-relaxed bg-white">
                {iaLoading ? (
                    <div className="flex flex-col items-center gap-2 py-8">
                        <div className="w-6 h-6 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black uppercase">Analisando percurso...</span>
                    </div>
                ) : (
                    <div className="space-y-2 whitespace-pre-line">{iaContent}</div>
                )}
              </div>
              <div className="p-4 bg-slate-50 flex justify-center border-t border-black/5">
                <button onClick={() => setShowIaModal(false)} className="px-8 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg hover:bg-slate-900">Entendido!</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
