
import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, ChevronDown, Clock, 
  HeartPulse, Target, Plus, Save, Trash2,
  ArrowLeft, Zap, BrainCircuit, 
  Lock, RefreshCw, Sparkles, Repeat, AlertCircle, User,
  Camera, CheckCircle2, X, Heart, Play
} from 'lucide-react';
import { 
  collection, doc, setDoc, 
  onSnapshot, addDoc, deleteDoc, query, where 
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { Student, RunningStats, WorkoutHistoryEntry } from '../types';
import { HeaderTitle } from './Layout';

const Card = ({ children, className = "", onClick }: any) => (
  <div onClick={onClick} className={`bg-zinc-900 rounded-[2.5rem] shadow-xl border border-zinc-800 p-6 md:p-8 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", loading = false, disabled = false }: any) => {
  const variants: any = {
    primary: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20",
    ai: "bg-zinc-800 border border-red-600/50 hover:bg-zinc-700 text-white shadow-lg shadow-red-500/10",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5",
    outline: "border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white",
  };
  return (
    <button 
      disabled={disabled || loading}
      onClick={onClick} 
      className={`px-6 py-3.5 rounded-2xl font-bold uppercase tracking-tight transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-xs md:text-sm ${variants[variant]} ${className}`}
    >
      {loading ? <RefreshCw className="animate-spin" size={16} /> : children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder, className = "" }: any) => (
  <div className={`flex flex-col gap-1.5 w-full ${className}`}>
    {label && <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 ml-1">{label}</label>}
    <input 
      type={type} 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder} 
      className="px-4 py-3 md:px-5 md:py-4 rounded-2xl bg-black border border-white/10 focus:border-red-600 transition-all font-bold text-white outline-none w-full placeholder:text-zinc-700 text-xs md:text-sm" 
    />
  </div>
);

const Select = ({ label, value, onChange, options, className = "" }: any) => (
  <div className={`flex flex-col gap-1.5 w-full relative ${className}`}>
    {label && <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 ml-1">{label}</label>}
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full px-4 py-3 md:px-5 md:py-4 rounded-2xl bg-black border border-white/10 focus:border-red-600 transition-all font-bold appearance-none cursor-pointer pr-10 text-white outline-none text-xs md:text-sm"
      >
        {options.map((o: any) => <option key={o.value} value={o.value} className="bg-zinc-900 text-white">{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle }: any) => (
  <div className="mb-8 px-2 text-left">
    <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white leading-none">{title}</h3>
    {subtitle && <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-2 flex items-center gap-3 italic tracking-widest">{subtitle}</p>}
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

  // Galaxy Watch 7 Stats State
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
      duration: stats.avgPace ? `${(Number(stats.distance || 0) * 6).toFixed(0)} min` : "00:00", // Estimativa se vazio
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
             className="w-full aspect-video bg-zinc-900 rounded-[2.5rem] border-2 border-dashed border-red-600/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative"
           >
              {selfieUrl ? <img src={selfieUrl} className="w-full h-full object-cover" /> : <><Camera size={32} className="text-red-600 mb-2"/><p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Adicionar Selfie do Treino</p></>}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="user" onChange={capturePhoto} />
           </div>

           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Input label="Distância (KM)" type="number" value={stats.distance} onChange={(v:any) => setStats({...stats, distance: v})} />
              <Input label="Pace Médio" value={stats.avgPace} onChange={(v:any) => setStats({...stats, avgPace: v})} placeholder="05:30" />
              <Input label="Frec. Card. Méd." type="number" value={stats.avgHR} onChange={(v:any) => setStats({...stats, avgHR: v})} />
              <Input label="Cadência (SPM)" type="number" value={stats.cadence} onChange={(v:any) => setStats({...stats, cadence: v})} />
              <Input label="Calorias" type="number" value={stats.calories} onChange={(v:any) => setStats({...stats, calories: v})} />
              <Input label="VO2 Max" type="number" value={stats.vo2max} onChange={(v:any) => setStats({...stats, vo2max: v})} />
           </div>

           <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-red-600 tracking-widest flex items-center gap-2 italic"><Zap size={14}/> Métricas Biomecânicas (Advanced)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Oscilação Vertical (cm)" type="number" value={stats.verticalOscillation} onChange={(v:any) => setStats({...stats, verticalOscillation: v})} />
                <Input label="Tempo Contato Solo (ms)" type="number" value={stats.groundContactTime} onChange={(v:any) => setStats({...stats, groundContactTime: v})} />
                <Input label="Comprimento Passada (cm)" type="number" value={stats.strideLength} onChange={(v:any) => setStats({...stats, strideLength: v})} />
                <Input label="Ganho Elevação (m)" type="number" value={stats.elevation} onChange={(v:any) => setStats({...stats, elevation: v})} />
              </div>
           </div>

           <Button onClick={finalizeRun} loading={isFinishing} className="w-full py-6 rounded-[2.5rem] text-sm md:text-lg italic font-black">REGISTRAR NO FEED</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 text-left h-screen overflow-y-auto custom-scrollbar bg-black">
      <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">
            <HeaderTitle text="RunTrack Elite" />
          </h2>
      </div>

      <div className="max-w-3xl mx-auto space-y-8 pb-32">
        <SectionHeader title="Treinamentos Prescritos" subtitle="Planilha cíclica personalizada por seu treinador PhD." />
        
        {modelWorkouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed border-zinc-800 rounded-[3rem] text-center bg-zinc-950/20">
            <Activity size={48} className="text-zinc-800 mb-6 animate-pulse" />
            <p className="text-zinc-600 italic text-sm font-black uppercase tracking-widest">Aguardando prescrição do seu treinador...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
             {modelWorkouts.sort((a,b) => getDayIndex(a.dayOfWeek) - getDayIndex(b.dayOfWeek)).map(m => (
               <Card key={m.id} className="p-6 md:p-10 border-zinc-800 shadow-xl rounded-[3rem] bg-zinc-900 relative overflow-hidden group hover:border-red-600/30 transition-all">
                  <div className={`absolute right-4 top-4 p-3 rounded-2xl ${getWorkoutColor(m.type)} text-white opacity-20 group-hover:opacity-100 transition-opacity`}><Activity size={20}/></div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">{m.dayOfWeek}</span>
                  </div>
                  <h4 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white leading-none">{m.type}</h4>
                  <div className="mt-6 bg-black p-5 md:p-6 rounded-2xl border border-white/5 italic font-bold text-[10px] md:text-xs text-zinc-400 leading-relaxed shadow-inner">
                     "{m.warmupTime} min aquecimento. {m.sets} bloco(s) de {m.reps}x {m.stimulusTime}{isNaN(parseInt(m.stimulusTime)) ? '' : ' min'} de corrida por {m.recoveryTime}s de repouso. Finalização de {m.cooldownTime} min."
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center justify-between mt-8 pt-8 border-t border-zinc-800 gap-6">
                     <div className="flex gap-10">
                        <div className="flex flex-col gap-1"><p className="text-[8px] font-black uppercase opacity-40 italic text-zinc-500">Tempo Est.:</p><p className="text-lg md:text-xl font-black italic tracking-tighter text-white">{m.totalTime} min</p></div>
                        <div className="flex flex-col gap-1 text-right"><p className="text-[8px] font-black uppercase opacity-40 italic text-red-500">Pace Alvo:</p><p className="text-lg md:text-xl font-black italic text-red-500 tracking-tighter">{m.pace}</p></div>
                     </div>
                     <button 
                        onClick={() => handleFinishRequest(m)}
                        className="w-full md:w-auto px-10 py-4 bg-white text-black rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-white/5"
                     >
                        <Play size={16} fill="currentColor" /> INICIAR SESSÃO
                     </button>
                  </div>
               </Card>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function RunTrackAnamnese({ student, onSave, onBack }: { student: Student, onSave: (data: any) => void, onBack: () => void }) {
  // Added basic placeholder for Anamnese
  return <div className="p-10 text-center text-white font-bold uppercase italic">Formulário de Anamnese em breve...</div>; 
}

export function RunTrackCoachView({ student, onBack }: { student: Student, onBack: () => void }) {
  // Added basic placeholder for Coach View
  return <div className="p-10 text-center text-white font-bold uppercase italic">Visão do Professor em breve...</div>;
}
