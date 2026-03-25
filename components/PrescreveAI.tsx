import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronRight, Activity, Download, FileText, AlertCircle, Dumbbell, Zap, Target, Loader2, Building2, TreePine, ClipboardList, BookOpen, User, Users, Image as ImageIcon, Shirt, Sparkles, BrainCircuit, ShieldAlert } from 'lucide-react';

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

// ==========================================
// CONSTANTES DE CONFIGURAÇÃO
// ==========================================
const FILTROS_MUSCULARES = [
  'TODOS', 'PEITORAL', 'DORSAIS', 'OMBROS', 'BÍCEPS', 'TRÍCEPS', 
  'QUADRÍCEPS', 'POSTERIORES DE COXA', 'GLÚTEOS', 'ADUTORES', 
  'PANTURRILHA', 'PARAVERTEBRAIS', 'ABDOMINAIS'
];

const JERSEYS_DATA = {
  "ÁFRICA DO SUL 26": "Authentic South Africa 2026 jersey, vibrant green with darker green vertical textured stripes, white polo collar, yellow Adidas stripes on shoulders, vintage white Adidas Trefoil logo.",
  "REAL MADRID 81": "Authentic Real Madrid 1981 Home jersey, pure white with purple Adidas stripes on shoulders, purple Zanussi sponsor, purple vintage Adidas Trefoil logo.",
  "FLAMENGO 81 (HOME)": "Authentic Flamengo 1981 Home jersey, wide horizontal red and black hoops, white Lubrax sponsor, white vintage Adidas Trefoil logo, white V-neck collar.",
  "FLAMENGO 81 (AWAY)": "Authentic Flamengo 1981 Away jersey, white base with red and black stripes on shoulders and sleeves, red Lubrax sponsor, red vintage Adidas Trefoil logo.",
  "PERU 26 (AWAY)": "Authentic Peru 2026 Away jersey: black base with vibrant red graphic panels on the sides and red stripes on shoulders, featuring the vintage Adidas Trefoil logo.",
  "ARÁBIA SAUDITA 26": "Authentic Saudi Arabia 2026 Away jersey, white with green palm-leaf inspired graphic patterns, green vintage Adidas Trefoil logo.",
  "CURAÇAO 26": "Authentic Curaçao 2026 jersey: bright yellow base with blue collar trim and red/blue accents on the shoulders, featuring the vintage Adidas Trefoil logo."
};

const EXERCISE_CATALOG = {
  "PEITORAL": ["CRUCIFIXO ABERTO ALTERNADO NO BANCO 30 GRAUS NO CROSS", "CRUCIFIXO ABERTO NO BANCO RETO COM HALTER", "SUPINO ABERTO NO SMITH", "PULL UP NO CROSS", "EXTENSÃO DE COTOVELOS NO SOLO", "VOADOR PEITORAL", "SUPINO ABERTO COM HALTER", "CRUCIFIXO NO VOADOR PEITORAL", "SUPINO VERTICAL NA MÁQUINA"],
  "OMBROS": ["ENCOLHIMENTO DE OMBROS NO CROSS", "ABDUÇÃO DE OMBROS ALTERNADO EM PÉ", "DESENVOLVIMENTO ARNOLD EM PÉ", "REMADA ALTA EM PÉ NO CROSS", "ROTAÇÃO EXTERNA DE OMBRO NO CROSS", "DESENVOLVIMENTO NO SMITH"],
  "DORSAIS": ["ADUÇÃO DE OMBROS NO CROSS", "EXTENSÃO DE OMBROS NO CROSS", "PULL OVER COM HALTER", "PUXADA ABERTA NA BARRA FIXA", "REMADA CURVADA COM HALTER", "PUXADA NEUTRA NO PULLEY", "REMADA CAVALO NA MÁQUINA"],
  "TRÍCEPS": ["SUPINO FECHADO NO BANCO RETO", "TRÍCEPS COICE NO CROSS", "TRÍCEPS FRANCÊS NO BANCO 75 GRAUS", "TRÍCEPS TESTA COM BARRA H", "TRÍCEPS NA PARALELA", "TRÍCEPS SUPERMAN NO CROSS"],
  "BÍCEPS": ["BÍCEPS ALTERNADO NO BANCO 60 GRAUS", "BÍCEPS SCOTT NA MÁQUINA", "BÍCEPS CONCENTRADO", "BÍCEPS EM PÉ COM BARRA W", "BÍCEPS NO CROSS COM CORDA"],
  "QUADRÍCEPS": ["AGACHAMENTO LIVRE", "AGACHAMENTO NO SMITH", "LEG PRESS 45 GRAUS", "CADEIRA EXTENSORA", "AGACHAMENTO PASSADA", "LEG PRESS 90 GRAUS", "AGACHAMENTO NO SISSY"],
  "ADUTORES": ["ADUÇÃO DE QUADRIL NO CROSS", "CADEIRA ADUTORA", "ADUÇÃO COM CANELEIRA", "AGACHAMENTO SUMÔ COM ROTAÇÃO EXTERNA"],
  "GLÚTEOS": ["AGACHAMENTO SUMÔ COM HALTER", "ELEVAÇÃO DE QUADRIL NO SMITH", "LEVANTAMENTO TERRA NO CROSS", "STIFF EM PÉ", "CADEIRA ABDUTORA", "EXTENSÃO DE QUADRIL NO GRAVITON"],
  "POSTERIORES DE COXA": ["CADEIRA FLEXORA", "FLEXÃO DE JOELHO NÓRDICA", "MESA FLEXORA", "STIFF UNILATERAL", "FLEXÃO DE JOELHO NA BOLA"],
  "PANTURRILHA": ["FLEXÃO PLANTAR NO LEG PRESS", "FLEXÃO PLANTAR EM PÉ", "FLEXÃO PLANTAR NO SMITH", "FLEXÃO PLANTAR NO DEGRAU"],
  "PARAVERTEBRAIS": ["ELEVAÇÃO DE QUADRIL NO SOLO", "EXTENSÃO DE TRONCO NO APARELHO", "PERDIGUEIRO NO SOLO", "MATA-BORRÃO"],
  "ABDOMINAIS": ["ABDOMINAL CRUNCH MÁQUINA", "ABDOMINAL INFRA PENDURADO", "PRANCHA VENTRAL", "ABDOMINAL SUPRA NA BOLA"]
};

// ==========================================
// UTILS & API HELPERS
// ==========================================
const fetchWithRetry = async (url: string, options: any, retries = 5, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return await response.json();
      if (response.status === 429) {
        await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
        continue;
      }
      throw new Error(`Erro API: ${response.status}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
    }
  }
};

export function PrescreveAI({ onBack, initialExerciseName }: { onBack?: () => void, initialExerciseName?: string }) {
  const [environment, setEnvironment] = useState('ACADEMIA');
  const [selectedModel, setSelectedModel] = useState('MULHER');
  const [selectedJersey, setSelectedJersey] = useState('ÁFRICA DO SUL 26');
  const [searchTerm, setSearchTerm] = useState(initialExerciseName || '');
  const [activeFilter, setActiveFilter] = useState('TODOS');
  const [selectedExercise, setSelectedExercise] = useState<{group: string, name: string} | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [performanceInsight, setPerformanceInsight] = useState<any>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fullExerciseList = useMemo(() => {
    return Object.entries(EXERCISE_CATALOG).flatMap(([group, items]) => 
      items.map(name => ({ group, name }))
    );
  }, []);

  useEffect(() => {
    if (initialExerciseName) {
      const found = fullExerciseList.find(ex => ex.name.toLowerCase() === initialExerciseName.toLowerCase());
      if (found) {
        setSelectedExercise(found);
      }
    }
  }, [initialExerciseName, fullExerciseList]);

  const filteredExercises = useMemo(() => {
    let list = fullExerciseList;
    if (activeFilter !== 'TODOS') list = list.filter(ex => ex.group === activeFilter);
    if (searchTerm.trim()) list = list.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return list.slice(0, 500); 
  }, [searchTerm, activeFilter, fullExerciseList]);

  const handleFilterClick = (tag: string) => {
    setActiveFilter(tag);
    setSearchTerm(''); 
    setSelectedExercise(null);
    setShowDropdown(true);
  };

  const handleGenerate = async () => {
    if (!selectedExercise) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedData(null);
    setPerformanceInsight(null);
    setShowDropdown(false);

    try {
      const jerseyPrompt = JERSEYS_DATA[selectedJersey as keyof typeof JERSEYS_DATA];
      
      const modelSpecs = selectedModel === 'HOMEM' 
        ? "Full-body hyper-realistic professional photography of a powerful muscular athletic black man, 1.85m tall, short hair. Very detailed skin texture with pores and natural sweat."
        : "Full-body hyper-realistic professional photography of a black woman, 1.77m tall, dark retinta skin. Ultra-detailed skin texture showing pores and natural sweat. Biotype: Slim Curvy with very thick muscular thighs and glutes, extremely narrow waist, large breasts, and a normal, natural, soft abdomen. Lean defined athletic arms.";
      
      const clothesSpecs = selectedModel === 'HOMEM'
        ? `strictly wearing the ${selectedJersey} jersey in a STANDARD REGULAR MALE FIT (full length covering the entire torso), black Adidas track pants with three white stripes, and white Adidas Superstar sneakers. The jersey MUST feature the vintage Adidas Trefoil logo.`
        : `strictly wearing the ${selectedJersey} jersey as a CROP TOP (raised or tied up) to fully show her navel area and a silver piercing. She wears short black Adidas shorts with white stripes and white Adidas Superstar sneakers. No visible socks. The jersey MUST feature the vintage Adidas Trefoil logo.`;

      // REGRAS BIOMECÂNICAS INTEGRADAS
      const biomechanicalLogic = `
        - SE PEITORAL: (Crucifixo/Voador -> FLY COM TERABAND), (Supino 30/Smith -> PUSH-UP PÉS ELEVADOS), (Supino Declinado -> PUSH-UP INCLINADA MÃOS NO BANCO), (Supino Reto -> FLEXÃO + TERABAND).
        - SE OMBROS: (Encolhimento -> SHRUG TERABAND), (Manguito -> ROTAÇÃO ELÁSTICO), (Desenvolvimento -> PIKE PUSH-UP), (Elevação Lateral -> ELEVAÇÃO TERABAND).
        - SE TRÍCEPS: (Coice -> KICKBACK TERABAND), (Testa/Francês -> EXTENSION TRX), (Paralela -> DIPS BANCO).
        - SE DORSAIS: (Remada -> REMADA INVERTIDA TRX), (Puxada/Barra -> PULL-UP BARRA FIXA).
        - SE QUADRÍCEPS: (Agachamento -> LIVRE/TRX), (Sissy -> SISSY CALISTÊNICO), (Passada -> AFUNDO BÚLGARO).
        - SE BÍCEPS: BÍCEPS CURL TRX/TERABAND.
        - SE PANTURRILHA: CALF RAISE NO DEGRAU.
      `;

      const systemPrompt = `Você é um Doutor em Biomecânica Especialista. Retorne um JSON estrito.
      
CRÍTICO - MODO OUTDOOR: Se o ambiente for OUTDOOR, você DEVE seguir estas regras de adaptação técnica:
${biomechanicalLogic}

EQUIPAMENTO: O objeto usado no START deve ser EXATAMENTE O MESMO no FINISH. Não troque pesos por barras entre os quadros.

REGRAS JSON:
1. "visualPrompt": Imagem diptych (Split-screen). START (esquerda) e FINISH (direita).
   PROIBIÇÃO ABSOLUTA: "DO NOT WRITE ANY WORDS ON THE IMAGE. NO START/FINISH TEXT. NO LABELS. IMAGE MUST BE 100% CLEAN OF TEXT."
   QUALIDADE: "Professional studio lighting, 8k, authentic human skin texture, cinematic detail."
   DESCRIÇÃO: "${modelSpecs}, wearing the EXACT jersey: ${jerseyPrompt}, and ${clothesSpecs}. Consistent environment and equipment in both panels."
2. "nomeAdaptado": Nome profissional da variação outdoor seguindo a lógica acima.
3. "agonistas": Músculos principais.
4. "sinergistas": Músculos auxiliares.
5. "cinesiologia": Explicação técnica da variação proposta.
6. "citacao": Citação acadêmica realista.
7. "guiaPassos": ARRAY de strings numeradas com os passos de execução precisos.`;

      const data = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Modo: ${environment}. Exercício: ${selectedExercise.name}` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { 
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                visualPrompt: { type: "STRING" },
                nomeAdaptado: { type: "STRING" },
                agonistas: { type: "STRING" },
                sinergistas: { type: "STRING" },
                cinesiologia: { type: "STRING" },
                citacao: { type: "STRING" },
                guiaPassos: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["visualPrompt", "nomeAdaptado", "agonistas", "sinergistas", "cinesiologia", "citacao", "guiaPassos"]
            }
          }
        })
      }).then((res: any) => JSON.parse(res.candidates[0].content.parts[0].text));

      const imgResult = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: [{ prompt: data.visualPrompt }], parameters: { sampleCount: 1 } })
      });
      data.image = `data:image/png;base64,${imgResult.predictions[0].bytesBase64Encoded}`;

      setGeneratedData(data);
    } catch (err) {
      console.error(err);
      setError("Falha técnica na geração. Verifique a ligação e tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateInsight = async () => {
    if (!generatedData) return;
    setIsGeneratingInsight(true);
    try {
      const insightPrompt = `Como Doutor em Performance, gere uma análise avançada para o exercício: ${generatedData.nomeAdaptado}.
      Retorne um JSON com:
      - "mentoria": Uma dica de mestre sobre cadência ou contração de pico.
      - "erros": Um erro biomecânico perigoso e como evitar.
      - "intensidade": Sugestão de RPE (0-10) e método de progressão (ex: Drop-set, Cluster-set).`;

      const insightData = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: insightPrompt }] }],
          generationConfig: { 
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                mentoria: { type: "STRING" },
                erros: { type: "STRING" },
                intensidade: { type: "STRING" }
              }
            }
          }
        })
      }).then((res: any) => JSON.parse(res.candidates[0].content.parts[0].text));

      setPerformanceInsight(insightData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased p-4 sm:p-8 flex flex-col items-center overflow-y-auto">
      
      {/* HEADER PREMIUM - LOGOTIPO ALINHADO CENTRALMENTE AO NOME */}
      <header className="max-w-6xl w-full flex items-center gap-1.5 sm:gap-2.5 mb-12 pt-4 relative">
        {onBack && (
          <button onClick={onBack} className="absolute -top-4 left-0 p-2 text-slate-500 hover:text-slate-900 transition-colors">
            &larr; Voltar
          </button>
        )}
        <div className="bg-gradient-to-tr from-blue-600 to-emerald-400 p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl shrink-0">
          <Dumbbell size={52} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 leading-[0.85] uppercase">
            PRESCREVEAI
          </h1>
          <p className="text-[10px] sm:text-sm font-bold text-slate-500 uppercase tracking-widest border-t border-slate-200 mt-2 pt-1">
            PRESCRIÇÃO E BIOMECÂNICA DE ALTA PERFORMANCE
          </p>
        </div>
      </header>

      {/* CONTROLES */}
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => setEnvironment('ACADEMIA')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${environment === 'ACADEMIA' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Academia</button>
          <button onClick={() => setEnvironment('OUTDOOR')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${environment === 'OUTDOOR' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Outdoor / Casa</button>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => setSelectedModel('HOMEM')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${selectedModel === 'HOMEM' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Homem</button>
          <button onClick={() => setSelectedModel('MULHER')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${selectedModel === 'MULHER' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Mulher</button>
        </div>
      </div>

      {/* SELETOR DE CAMISAS */}
      <div className="max-w-4xl w-full flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-12 overflow-x-auto custom-scrollbar whitespace-nowrap">
        {Object.keys(JERSEYS_DATA).map(team => (
          <button 
            key={team} 
            onClick={() => setSelectedJersey(team)} 
            className={`flex-none px-6 py-3 rounded-xl text-[10px] font-black transition-all ${selectedJersey === team ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Shirt size={14} className="inline mr-2" /> {team}
          </button>
        ))}
      </div>

      {/* BUSCA */}
      <section className="max-w-4xl w-full relative z-50 mb-12" ref={searchRef}>
        <div className="relative group">
          <div className="absolute -inset-1 rounded-[3rem] blur-lg opacity-20 bg-gradient-to-r from-blue-600 to-emerald-400"></div>
          <div className="relative bg-white border border-slate-100 rounded-[3rem] p-2 flex items-center shadow-lg transition-all">
            <div className="pl-6 pr-2"><Search size={26} className="text-blue-500" /></div>
            <input
              type="text"
              placeholder={`Qual o exercício de ${activeFilter.toLowerCase()} vamos prescrever?`}
              className="w-full bg-transparent text-xl text-slate-800 placeholder-slate-400 py-4 px-2 focus:outline-none font-medium"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
            />
            {selectedExercise && (
              <button onClick={handleGenerate} disabled={isGenerating} className="hidden md:flex ml-2 mr-2 bg-gradient-to-r from-blue-600 to-emerald-500 text-white px-8 py-4 rounded-full font-bold hover:scale-[1.02] active:scale-95 transition-all items-center gap-2 disabled:opacity-50 shadow-lg">
                {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Zap size={20}/>} Gerar Foto 8K
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {FILTROS_MUSCULARES.map(tag => (
            <button key={tag} onClick={() => handleFilterClick(tag)} className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest transition-all shadow-sm ${activeFilter === tag ? 'bg-blue-600 text-white scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:text-blue-600'}`}>{tag}</button>
          ))}
        </div>

        {showDropdown && (
          <div className="absolute top-[105px] w-full bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95">
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 scroll-smooth">
              {filteredExercises.map((ex, idx) => (
                <button key={idx} onClick={() => { setSelectedExercise(ex); setSearchTerm(ex.name); setShowDropdown(false); }} className="w-full text-left px-5 py-4 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-between group border-b border-slate-50 last:border-0">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase mb-1 block">{ex?.group || ""}</span>
                    <span className="text-base text-slate-700 font-bold capitalize group-hover:text-blue-600">{ex.name.toLowerCase()}</span>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ÁREA DE RESULTADOS */}
      {(isGenerating || generatedData) && (
        <section className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-100 p-5 rounded-[2.5rem] shadow-xl relative overflow-hidden h-fit">
               {isGenerating ? (
                 <div className="aspect-video flex flex-col items-center justify-center bg-slate-50 rounded-[2rem]">
                    <Loader2 size={64} className="animate-spin text-blue-500 mb-4" strokeWidth={2.5}/>
                    <p className="text-slate-700 font-black text-xl animate-pulse uppercase tracking-widest text-center">Modelando Biomecânica Realista...</p>
                 </div>
               ) : (
                 <div className="relative group overflow-hidden rounded-[1.5rem]">
                    <img src={generatedData.image} alt="Biomecânica" className="w-full h-auto shadow-inner" />
                    <div className="absolute bottom-0 left-0 w-full flex justify-between items-center px-10 py-4 bg-gradient-to-t from-black/60 to-transparent">
                      <span className="text-white font-black text-xl tracking-tighter drop-shadow-lg uppercase">START</span>
                      <span className="text-white font-black text-xl tracking-tighter drop-shadow-lg uppercase">FINISH</span>
                    </div>
                 </div>
               )}
            </div>
            {!isGenerating && (
              <div className="px-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <span className="text-sm font-black text-blue-600 uppercase tracking-[0.2em]">{environment} • {selectedExercise?.group || ""}</span>
                  <h2 className="text-4xl font-black text-slate-900 uppercase leading-none mt-2">{generatedData.nomeAdaptado}</h2>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { const link = document.createElement('a'); link.href = generatedData.image; link.download = 'PrescreveAI.png'; link.click(); }} className="bg-white text-slate-700 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all border border-slate-200 shadow-sm"><Download size={20} className="text-blue-500" /> Salvar</button>
                  <button onClick={handleGenerateInsight} disabled={isGeneratingInsight} className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
                    {isGeneratingInsight ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />} Mentoria ✨
                  </button>
                </div>
              </div>
            )}

            {/* INSIGHTS DE IA */}
            {performanceInsight && !isGenerating && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in">
                <div className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                  <BrainCircuit size={80} className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-3 opacity-80">Dica de Elite ✨</h4>
                  <p className="text-sm font-bold leading-relaxed">{performanceInsight.mentoria}</p>
                </div>
                <div className="bg-amber-500 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                  <ShieldAlert size={80} className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-3 opacity-80">Risco Biomecânico ✨</h4>
                  <p className="text-sm font-bold leading-relaxed">{performanceInsight.erros}</p>
                </div>
                <div className="bg-emerald-500 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                  <Target size={80} className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-3 opacity-80">Intensidade (RPE) ✨</h4>
                  <p className="text-sm font-bold leading-relaxed">{performanceInsight.intensidade}</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl p-8 h-fit relative overflow-hidden">
               <div className="flex items-center gap-4 mb-8 pb-5 border-b border-slate-100 relative z-10">
                  <div className="bg-blue-50 p-3 rounded-2xl"><FileText size={28} className="text-blue-500" /></div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Laudo Clínico</h2>
               </div>
               {isGenerating ? (
                 <div className="space-y-6">
                    {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse"/>)}
                 </div>
               ) : (
                 <div className="space-y-6 text-sm font-medium text-slate-700 leading-relaxed relative z-10">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm"><p className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 uppercase tracking-widest text-xs mb-2">AGONISTAS</p><p>{generatedData.agonistas}</p></div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm"><p className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 uppercase tracking-widest text-xs mb-2">SINERGISTAS</p><p>{generatedData.sinergistas}</p></div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm"><p className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 uppercase tracking-widest text-xs mb-2">CINESIOLOGIA</p><p>{generatedData.cinesiologia}</p></div>
                    <div className="p-5 border border-blue-100 bg-blue-50/30 rounded-2xl italic font-bold text-slate-600">"{generatedData.citacao}"</div>
                 </div>
               )}
            </div>
            {!isGenerating && generatedData.guiaPassos && (
              <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl p-8 h-fit">
                 <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                    <div className="bg-emerald-50 p-3 rounded-2xl"><ClipboardList size={28} className="text-emerald-500" /></div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Guia de Execução</h2>
                 </div>
                 <div className="space-y-4">
                    {generatedData.guiaPassos.map((passo: string, idx: number) => (
                      <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all group">
                        <span className="text-2xl font-black text-emerald-300 group-hover:text-emerald-500 leading-none">{idx+1}</span>
                        <p className="text-sm font-bold text-slate-600 leading-snug">{passo.replace(/^\d+ [-.]? /, '')}</p>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        </section>
      )}

      {error && (
        <div className="max-w-4xl w-full mb-8 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-bounce shadow-md">
          <AlertCircle size={24} /> <p className="text-sm font-black uppercase tracking-wider">{error}</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid white; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-from-bottom-8 { from { transform: translateY(2rem); } to { transform: translateY(0); } }
        .animate-in { animation: fade-in 0.5s ease-out forwards, slide-in-from-bottom-8 0.5s ease-out forwards; }
      `}} />
    </div>
  );
}
