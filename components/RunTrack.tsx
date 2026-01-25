
import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, ChevronDown, Clock, 
  HeartPulse, Target, Plus, Save, Trash2,
  ArrowLeft, Zap, BrainCircuit, 
  Lock, RefreshCw, Sparkles, Repeat, AlertCircle, User,
  Camera, CheckCircle2, X, Heart, Play, Brain, Footprints,
  ClipboardList, Beaker, TrendingUp, Menu
} from 'lucide-react';
import { 
  collection, doc, setDoc, 
  onSnapshot, addDoc, deleteDoc, query, where 
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { Student, RunningStats, WorkoutHistoryEntry } from '../types';
import { HeaderTitle, Card, EliteFooter } from './Layout';
import { generateRunningPlan } from '../services/gemini';

const Button = ({ children, onClick, variant = "primary", className = "", loading = false, disabled = false }: any) => {
  const variants: any = {
    primary: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20",
    ai: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5",
    outline: "border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white",
  };
  return (
    <button 
      disabled={disabled || loading}
      onClick={onClick} 
      className={`px-6 py-3.5 rounded-2xl font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-xs ${variants[variant]} ${className}`}
    >
      {loading ? <RefreshCw className="animate-spin" size={16} /> : children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder, className = "" }: any) => (
  <div className={`flex flex-col gap-1.5 w-full ${className}`}>
    {label && <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1 italic">{label}</label>}
    <input 
      type={type} 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder} 
      className="px-5 py-4 rounded-2xl bg-black border border-white/10 focus:border-red-600 transition-all font-bold text-white outline-none w-full placeholder:text-zinc-800 text-sm italic" 
    />
  </div>
);

const Select = ({ label, value, onChange, options, className = "" }: any) => (
  <div className={`flex flex-col gap-1.5 w-full relative ${className}`}>
    {label && <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1 italic">{label}</label>}
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full px-5 py-4 rounded-2xl bg-black border border-white/10 focus:border-red-600 transition-all font-bold appearance-none cursor-pointer pr-10 text-white outline-none text-sm italic"
      >
        {options.map((o: any) => <option key={o.value} value={o.value} className="bg-zinc-900 text-white">{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
    </div>
  </div>
);

function getDayIndex(day: string) {
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  return days.indexOf(day);
}

function getWorkoutColor(type: string) {
  switch (type) {
    case 'tiro': return 'bg-rose-600';
    case 'ritmo': return 'bg-orange-600';
    case 'longao': return 'bg-red-800';
    case 'fartlek': return 'bg-purple-600';
    default: return 'bg-zinc-700';
  }
}

export function RunTrackStudentView({ student, onBack, onSave }: { student: Student, onBack: () => void, onSave: (id: string, data: any) => void }) {
  const [modelWorkouts, setModelWorkouts] = useState<any[]>([]);
  const [showFinishForm, setShowFinishForm] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<RunningStats>({
    distance: undefined,
    avgPace: "",
    avgHR: undefined,
    maxHR: undefined,
    cadence: undefined,
    vo2max: undefined,
    elevation: undefined,
    calories: undefined,
    strideLength: undefined,
    verticalOscillation: undefined,
    groundContactTime: undefined
  });

  useEffect(() => {
    const qModels = query(collection(db, 'artifacts', appId, 'public', 'data', 'modelWorkouts'), where('studentId', '==', student.id));
    const unsubModels = onSnapshot(qModels, (snap) => setModelWorkouts(snap.docs.map(d => ({id: d.id, ...d.data()}))), (e) => console.error("Error fetching models"));
    return () => unsubModels();
  }, [student.id]);

  const handleFinishRequest = (workout: any) => {
    setSelectedWorkout(workout);
    setShowFinishForm(true);
  };

  const capturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelfieUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const finalizeRun = async () => {
    setIsFinishing(true);
    const entry: WorkoutHistoryEntry = {
      id: Date.now().toString(),
      workoutId: selectedWorkout?.id,
      name: `Corrida: ${selectedWorkout?.type || 'Avulsa'}`,
      duration: stats.avgPace ? `${(Number(stats.distance || 0) * 6).toFixed(0)} min` : "00:00",
      date: new Date().toLocaleDateString('pt-BR'),
      timestamp: Date.now(),
      photoUrl: selfieUrl || undefined,
      type: 'RUNNING',
      runningStats: stats
    };

    const updatedHistory = [entry, ...(student.workoutHistory || [])];
    await onSave(student.id, { workoutHistory: updatedHistory });
    
    setIsFinishing(false);
    setShowFinishForm(false);
    onBack();
  };

  if (showFinishForm) {
    return (
      <div className="fixed inset-0 z-50 bg-black overflow-y-auto p-6 text-white animate-in slide-in-from-bottom-10 duration-500 custom-scrollbar text-left">
        <header className="flex justify-between items-center mb-8 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-50 -mx-6 px-6 border-b border-white/5">
           <h3 className="text-xl font-black italic uppercase tracking-tighter">Dados Watch 7</h3>
           <button onClick={() => setShowFinishForm(false)} className="p-2 bg-zinc-900 rounded-full"><X size={20}/></button>
        </header>

        <div className="max-w-2xl mx-auto space-y-8 pb-32">
           <div 
             onClick={() => fileInputRef.current?.click()}
             className="w-full aspect-video bg-zinc-900 rounded-[2.5rem] border-2 border-dashed border-red-600/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative shadow-2xl"
           >
              {selfieUrl ? <img src={selfieUrl} className="w-full h-full object-cover" /> : <><Camera size={32} className="text-red-600 mb-2"/><p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Adicionar Selfie do Treino</p></>}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="user" onChange={capturePhoto} />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <Input label="Distância (KM)" type="number" value={stats.distance} onChange={(v:any) => setStats({...stats, distance: v})} />
              <Input label="Pace Médio" value={stats.avgPace} onChange={(v:any) => setStats({...stats, avgPace: v})} placeholder="05:30" />
              <Input label="Frec. Card. Méd." type="number" value={stats.avgHR} onChange={(v:any) => setStats({...stats, avgHR: v})} />
              <Input label="VO2 Max" type="number" value={stats.vo2max} onChange={(v:any) => setStats({...stats, vo2max: v})} />
           </div>

           <Button onClick={finalizeRun} loading={isFinishing} className="w-full py-6 rounded-[2.5rem] text-sm md:text-lg italic font-black">REGISTRAR NO FEED</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 text-left h-screen overflow-y-auto custom-scrollbar bg-black">
      <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg">
            <Menu size={20}/>
          </button>
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">
            <HeaderTitle text="RunTrack Elite" />
          </h2>
      </div>

      <div className="max-w-3xl mx-auto space-y-8 pb-32">
        {modelWorkouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 border-2 border-dashed border-zinc-800 rounded-[3.5rem] text-center bg-zinc-950/20 shadow-inner">
            <Footprints size={48} className="text-zinc-800 mb-6 animate-pulse" />
            <p className="text-zinc-600 italic text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed">Aguardando prescrição PhD do seu treinador...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
             {modelWorkouts.sort((a,b) => getDayIndex(a.dayOfWeek) - getDayIndex(b.dayOfWeek)).map(m => (
               <Card key={m.id} className="p-8 md:p-10 border-zinc-800 shadow-3xl rounded-[3rem] bg-zinc-900/50 relative overflow-hidden group hover:border-red-600/30 transition-all backdrop-blur-sm">
                  <div className={`absolute right-4 top-4 p-4 rounded-3xl ${getWorkoutColor(m.type)} text-white opacity-10 group-hover:opacity-100 transition-all duration-500 shadow-2xl`}><Activity size={24}/></div>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 italic">{m.dayOfWeek}</span>
                  </div>
                  <h4 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none mb-6">{m.type}</h4>
                  <div className="bg-black/60 p-6 md:p-8 rounded-[2rem] border border-white/5 italic font-medium text-xs text-zinc-400 leading-relaxed shadow-inner mb-8">
                     "{m.warmupTime} min aquecimento. {m.sets} bloco(s) de {m.reps}x {m.stimulusTime}{isNaN(parseInt(m.stimulusTime)) ? '' : ' min'} de corrida por {m.recoveryTime}s de repouso. Finalização de {m.cooldownTime} min."
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-zinc-800/50 gap-6">
                     <div className="flex gap-12">
                        <div className="flex flex-col gap-1.5"><p className="text-[8px] font-black uppercase opacity-40 italic text-zinc-500 tracking-widest">Tempo Est.</p><p className="text-xl font-black italic tracking-tighter text-white">{m.totalTime} MIN</p></div>
                        <div className="flex flex-col gap-1.5 text-right"><p className="text-[8px] font-black uppercase opacity-40 italic text-red-500 tracking-widest">Pace Alvo</p><p className="text-xl font-black italic text-red-600 tracking-tighter">{m.pace}</p></div>
                     </div>
                     <button 
                        onClick={() => handleFinishRequest(m)}
                        className="w-full md:w-auto px-12 py-5 bg-white text-black rounded-[1.5rem] font-black uppercase italic text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl hover:bg-red-600 hover:text-white"
                     >
                        <Play size={16} fill="currentColor" /> INICIAR SESSÃO
                     </button>
                  </div>
               </Card>
             ))}
          </div>
        )}
      </div>
      <EliteFooter />
    </div>
  );
}

export function RunTrackCoachView({ student, onBack }: { student: Student, onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'ANAMNESE' | 'PLAN'>('ANAMNESE');
  const [modelWorkouts, setModelWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [anamneseData, setAnamneseData] = useState((student as any).runAnamnese || {
    name: student.nome,
    experience: 'iniciante',
    goal: 'saude',
    daysPerWeek: '3',
    injuries: '',
    currentPace: '',
    vo2max: '',
    heartRateRest: '',
    preferredTerrain: 'asfalto'
  });

  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'modelWorkouts'), where('studentId', '==', student.id));
    const unsub = onSnapshot(q, (snap) => setModelWorkouts(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => unsub();
  }, [student.id]);

  const handleSaveAnamnese = async () => {
    setLoading(true);
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id);
    await setDoc(docRef, { runAnamnese: anamneseData }, { merge: true });
    setLoading(false);
    setActiveTab('PLAN');
  };

  const handleGenerateAI = async () => {
    if (!anamneseData) { alert("Preencha a anamnese primeiro!"); return; }
    setLoading(true);
    try {
      const plan = await generateRunningPlan(anamneseData);
      if (plan && plan.workouts) {
        for (const mw of modelWorkouts) {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'modelWorkouts', mw.id));
        }
        for (const w of plan.workouts) {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'modelWorkouts'), {
            ...w,
            studentId: student.id,
            timestamp: Date.now()
          });
        }
      }
    } catch (e) {
      alert("Erro ao gerar planilha por IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 text-left h-screen overflow-y-auto custom-scrollbar bg-black">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-50 -mx-6 px-6 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
          <HeaderTitle text={`RunTrack ${student.nome}`} />
        </h2>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* TABS SISTEMA */}
        <div className="flex bg-zinc-900/50 p-1.5 rounded-[2rem] border border-white/5 mb-10 shadow-2xl">
          <button 
            onClick={() => setActiveTab('ANAMNESE')}
            className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 italic ${activeTab === 'ANAMNESE' ? 'bg-red-600 text-white shadow-xl' : 'text-zinc-500 hover:text-white'}`}
          >
            <ClipboardList size={14} /> Anamnese Biomecânica
          </button>
          <button 
            onClick={() => setActiveTab('PLAN')}
            className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 italic ${activeTab === 'PLAN' ? 'bg-red-600 text-white shadow-xl' : 'text-zinc-500 hover:text-white'}`}
          >
            <Brain size={14} /> Prescrição IA
          </button>
        </div>

        {activeTab === 'ANAMNESE' && (
          <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
            <Card className="bg-zinc-900/50 border-zinc-800 p-8 space-y-10 shadow-3xl">
              <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                <div className="p-4 bg-red-600/10 rounded-3xl border border-red-600/20">
                  <Beaker className="text-red-600" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase italic text-white tracking-tighter leading-none">Perfil Fisiológico</h3>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2 italic">Coleta de Variáveis para IA</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Select 
                  label="Nível Técnico" 
                  value={anamneseData.experience} 
                  onChange={(v:any) => setAnamneseData({...anamneseData, experience: v})}
                  options={[
                    { label: 'Iniciante (Adaptação)', value: 'iniciante' },
                    { label: 'Intermediário (Regular)', value: 'intermediario' },
                    { label: 'Avançado (Performance)', value: 'avancado' },
                  ]}
                />
                <Select 
                  label="Macro-Objetivo" 
                  value={anamneseData.goal} 
                  onChange={(v:any) => setAnamneseData({...anamneseData, goal: v})}
                  options={[
                    { label: 'Saúde e Longevidade', value: 'saude' },
                    { label: 'Redução de Gordura', value: 'emagrecimento' },
                    { label: 'Performance 5km', value: '5k' },
                    { label: 'Performance 10km', value: '10k' },
                    { label: 'Performance 21km', value: '21k' },
                  ]}
                />
                <Input label="VO2 Max Est. (Watch/Garmin)" value={anamneseData.vo2max} onChange={(v:any) => setAnamneseData({...anamneseData, vo2max: v})} placeholder="Ex: 45" />
                <Input label="Frec. Cardíaca Repouso" value={anamneseData.heartRateRest} onChange={(v:any) => setAnamneseData({...anamneseData, heartRateRest: v})} placeholder="Ex: 55 bpm" />
                <Input label="Pace Médio (Z2/Z3)" value={anamneseData.currentPace} onChange={(v:any) => setAnamneseData({...anamneseData, currentPace: v})} placeholder="Ex: 06:30" />
                <Input label="Dias/Semana" type="number" value={anamneseData.daysPerWeek} onChange={(v:any) => setAnamneseData({...anamneseData, daysPerWeek: v})} />
                <div className="md:col-span-2">
                  <Input label="Restrições Biomecânicas (Dores/Lesões)" value={anamneseData.injuries} onChange={(v:any) => setAnamneseData({...anamneseData, injuries: v})} placeholder="Ex: Fascite plantar, dor no menisco..." />
                </div>
              </div>

              <Button onClick={handleSaveAnamnese} loading={loading} className="w-full py-6 rounded-[2rem] text-sm italic font-black">
                <Save size={18}/> Salvar Perfil Técnico
              </Button>
            </Card>
          </div>
        )}

        {activeTab === 'PLAN' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4 bg-zinc-900/40 p-8 rounded-[2.5rem] border border-white/5 shadow-xl backdrop-blur-sm">
               <div>
                 <h3 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">Motor de Prescrição IA</h3>
                 <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-2 italic">Gere treinos baseados no perfil PhD</p>
               </div>
               <Button variant="ai" onClick={handleGenerateAI} loading={loading} className="w-full md:w-auto px-10 py-5 rounded-[1.5rem]">
                 <Sparkles size={16}/> Processar Planilha IA
               </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {modelWorkouts.length === 0 ? (
                <div className="p-20 text-center border-2 border-dashed border-zinc-800 rounded-[3.5rem] bg-zinc-950/20">
                   <Activity size={32} className="mx-auto text-zinc-800 mb-6 opacity-30" />
                   <p className="text-zinc-600 font-black italic uppercase text-[10px] tracking-[0.4em]">Nenhum treino prescrito no momento.</p>
                </div>
              ) : (
                modelWorkouts.sort((a,b) => getDayIndex(a.dayOfWeek) - getDayIndex(b.dayOfWeek)).map(m => (
                  <Card key={m.id} className="p-8 border-zinc-800 group hover:border-red-600/30 transition-all flex flex-col md:flex-row justify-between items-center gap-8 bg-zinc-900/80 shadow-2xl">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] font-black uppercase text-red-600 bg-red-600/10 px-3 py-1 rounded-full italic">{m.dayOfWeek}</span>
                        <span className="text-[11px] font-black uppercase text-zinc-500 italic tracking-widest">{m.type}</span>
                      </div>
                      <h4 className="text-2xl font-black italic uppercase text-white tracking-tighter">{m.pace} MIN/KM ALVO</h4>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase mt-2 leading-relaxed italic opacity-80">
                        {m.sets} sets x {m.reps} reps x {m.stimulusTime} stim. ({m.recoveryTime}s Rec.)
                      </p>
                    </div>
                    <button 
                      onClick={async () => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'modelWorkouts', m.id))}
                      className="p-5 bg-zinc-950 text-zinc-700 hover:text-red-600 rounded-[1.5rem] transition-all border border-white/5 shadow-inner"
                    >
                      <Trash2 size={20} />
                    </button>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <EliteFooter />
    </div>
  );
}
