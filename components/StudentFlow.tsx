
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Dumbbell, Activity, Play,
  Loader2, Clock, Target, Award, ShieldCheck, Brain,
  Camera, CheckCircle2, X, Trash2, FastForward, Check,
  Trophy, AlertCircle, Info, ChevronDown, ChevronUp,
  Zap, Scan, Shield, Maximize2, Calendar, RefreshCw
} from 'lucide-react';
import { Card, EliteFooter, HeaderTitle } from './Layout';
import { Student, WorkoutHistoryEntry, Workout, AnalyticsData, Exercise } from '../types';

/**
 * Modal Cinematográfico PrescreveAI
 */
function PrescreveAIDetailModal({ ex, onClose }: { ex: Exercise, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex flex-col p-6 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto custom-scrollbar text-left">
      <header className="flex justify-between items-center mb-8 sticky top-0 z-50 py-2">
        <div className="flex flex-col">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] italic leading-none mb-2">PrescreveAI Elite</p>
          <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-none">{ex.name}</h2>
        </div>
        <button onClick={onClose} className="p-3 bg-zinc-900 rounded-full border border-white/10 text-zinc-500 hover:text-white transition-all shadow-2xl">
          <X size={24} />
        </button>
      </header>

      <div className="max-w-2xl mx-auto w-full space-y-8 pb-20">
        <div className="relative aspect-video w-full bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-3xl group">
          {ex.thumb ? (
            <img src={ex.thumb} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[10s] ease-linear" alt={ex.name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
               <Brain size={48} className="text-zinc-600 animate-pulse" />
            </div>
          )}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-600/30 animate-[scan_3s_infinite]"></div>
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-600/30">
               <Scan size={14} className="text-red-600 animate-pulse" />
               <span className="text-[8px] font-black text-white uppercase tracking-widest">Análise Ativa</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-zinc-900/50 border-white/5 space-y-4">
             <div className="flex items-center gap-3">
                <Zap className="text-red-600" size={18} />
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest italic">Execução Técnica</h4>
             </div>
             <p className="text-xs text-zinc-300 font-medium leading-relaxed italic border-l-2 border-red-600 pl-4">
               {ex.description || "Foco no controle da fase excêntrica e estabilidade escapular conforme protocolo PhD."}
             </p>
          </Card>
          <Card className="p-6 bg-zinc-900/50 border-white/5 space-y-4">
             <div className="flex items-center gap-3">
                <ShieldCheck className="text-emerald-500" size={18} />
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest italic">Hipertrofia Alvo</h4>
             </div>
             <div className="flex flex-wrap gap-2">
                {(ex.benefits || "Tensão Mecânica,Estresse Metabólico,Performance").split(',').map((b, i) => (
                  <span key={i} className="text-[9px] font-black uppercase tracking-widest bg-black px-3 py-1.5 rounded-full text-zinc-500 border border-white/5 italic">{b.trim()}</span>
                ))}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({ ex, idx, progress, onToggleFinish, onMarkSet, onUpdateLoad, onUpdateUnit, onShowDetail }: { 
  ex: Exercise, 
  idx: number, 
  progress: { completedSets: number[], isFinished: boolean },
  onToggleFinish: (id: string) => void,
  onMarkSet: (id: string, idx: number, rest: string) => void,
  onUpdateLoad: (id: string, val: string) => void,
  onUpdateUnit: (id: string, unit: 'Kg' | 'Placas') => void,
  onShowDetail: (ex: Exercise) => void,
  key?: React.Key
}) {
  const totalSets = parseInt(ex.sets || '3') || 3;
  const totalReps = ex.reps || '15';

  return (
    <div className={`relative bg-zinc-900/30 border ${progress.isFinished ? 'border-emerald-600/40' : 'border-white/5'} rounded-[2.5rem] overflow-hidden transition-all mb-4 p-6 shadow-2xl`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 cursor-pointer group" onClick={() => onShowDetail(ex)}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-red-600 italic uppercase tracking-widest leading-none">{idx + 1}º Exercício</span>
            <Maximize2 size={10} className="text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h4 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-none group-hover:text-red-600 transition-colors">
            {ex.name}
          </h4>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2 italic">{ex.method || 'Protocolo PhD Padrão'}</p>
        </div>
        <button 
          onClick={() => onToggleFinish(ex.id || '')}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${progress.isFinished ? 'bg-emerald-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-600 hover:text-white border border-white/5'}`}
        >
          <Check size={28} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 bg-black/40 border border-white/5 rounded-3xl p-4 flex flex-col items-center">
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: totalSets }).map((_, sIdx) => (
              <button 
                key={sIdx}
                onClick={() => onMarkSet(ex.id || '', sIdx, ex.rest || '60')}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black italic text-xs transition-all border ${progress.completedSets.includes(sIdx) ? 'bg-red-600 border-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-zinc-900 border-white/10 text-zinc-600'}`}
              >
                {sIdx + 1}
              </button>
            ))}
          </div>
          <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mt-3 italic">Registro de Séries</p>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-3xl p-4 flex flex-col items-center">
          <span className="text-5xl font-black text-white italic leading-none tracking-tighter">{totalReps}</span>
          <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mt-2 italic">Reps Alvo</p>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-3xl p-4 flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <input 
              type="number" 
              defaultValue={ex.load || ''}
              placeholder="--"
              onBlur={(e) => onUpdateLoad(ex.id!, e.target.value)}
              className="bg-transparent border-none p-0 text-5xl font-black text-center text-white outline-none focus:ring-0 w-20 italic tracking-tighter"
            />
            <select 
              defaultValue={ex.loadUnit || 'Kg'}
              onChange={(e) => onUpdateUnit(ex.id!, e.target.value as 'Kg' | 'Placas')}
              className="bg-transparent border-none text-[10px] font-black text-red-600 outline-none appearance-none uppercase italic"
            >
              <option value="Kg">Kg</option>
              <option value="Placas">Plcs</option>
            </select>
          </div>
          <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mt-2 italic">Carga Atual</p>
        </div>
      </div>
    </div>
  );
}

export function WorkoutSessionView({ user, onBack, onSave }: { user: Student, onBack: () => void, onSave: (id: string, data: any) => void }) {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showPhotoStep, setShowPhotoStep] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [exerciseDetail, setExerciseDetail] = useState<Exercise | null>(null);
  const [restCountdown, setRestCountdown] = useState<number | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, { completedSets: number[], isFinished: boolean }>>({});

  const timerRef = useRef<any>(null);
  const restTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const workoutStats = useMemo(() => {
    if (!activeWorkout) return null;
    const history = user.workoutHistory || [];
    const completed = history.filter(h => h.workoutId === activeWorkout.id).length;
    const total = activeWorkout.projectedSessions || 20;
    const startDateDisplay = user.protocolStartDate ? new Date(user.protocolStartDate).toLocaleDateString('pt-BR') : 'Aguardando 1º Treino';
    return { completed, total, startDate: startDateDisplay, rawStartDate: user.protocolStartDate };
  }, [activeWorkout, user.workoutHistory, user.protocolStartDate]);

  useEffect(() => {
    const savedStart = localStorage.getItem(`workout_start_${user.id}`);
    const savedId = localStorage.getItem(`active_workout_id_${user.id}`);
    if (savedStart && savedId) {
      const start = parseInt(savedStart);
      setSessionStartTime(start);
      setElapsedTime(Math.floor((Date.now() - start) / 1000));
      const workout = user.workouts?.find(w => w.id === savedId);
      if (workout) {
        setActiveWorkout(workout);
        const initialProgress: Record<string, { completedSets: number[], isFinished: boolean }> = {};
        workout.exercises.forEach(ex => {
          initialProgress[ex.id || ''] = { completedSets: [], isFinished: false };
        });
        setExerciseProgress(initialProgress);
      }
    }
  }, [user.id, user.workouts]);

  useEffect(() => {
    if (sessionStartTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionStartTime]);

  useEffect(() => {
    if (isResting && restCountdown !== null && restCountdown > 0) {
      restTimerRef.current = setInterval(() => {
        setRestCountdown(prev => (prev !== null ? prev - 1 : 0));
      }, 1000);
    } else if (restCountdown === 0) {
      setIsResting(false);
      setRestCountdown(null);
    }
    return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
  }, [isResting, restCountdown]);

  const startSession = (workout: Workout) => {
    const now = Date.now();
    setSessionStartTime(now);
    setActiveWorkout(workout);
    localStorage.setItem(`workout_start_${user.id}`, now.toString());
    localStorage.setItem(`active_workout_id_${user.id}`, workout.id);
    const initialProgress: Record<string, { completedSets: number[], isFinished: boolean }> = {};
    workout.exercises.forEach(ex => {
      initialProgress[ex.id || ''] = { completedSets: [], isFinished: false };
    });
    setExerciseProgress(initialProgress);
  };

  const cancelSession = () => {
    if (confirm("Deseja realmente sair? O progresso desta sessão será perdido.")) {
      localStorage.removeItem(`workout_start_${user.id}`);
      localStorage.removeItem(`active_workout_id_${user.id}`);
      setSessionStartTime(null);
      setActiveWorkout(null);
      onBack(); 
    }
  };

  const capturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfieUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const finishSession = async () => {
    if (!activeWorkout) return;
    setIsFinishing(true);
    const now = new Date();
    const entry: WorkoutHistoryEntry = {
      id: Date.now().toString(),
      workoutId: activeWorkout.id,
      name: activeWorkout.title,
      duration: formatTime(elapsedTime),
      date: now.toLocaleDateString('pt-BR'),
      timestamp: Date.now(),
      photoUrl: selfieUrl || undefined,
      type: 'STRENGTH'
    };
    const updatedProtocolDate = user.protocolStartDate || now.toISOString();
    const updatedHistory = [entry, ...(user.workoutHistory || [])];
    await onSave(user.id, { workoutHistory: updatedHistory, protocolStartDate: updatedProtocolDate });
    localStorage.removeItem(`workout_start_${user.id}`);
    localStorage.removeItem(`active_workout_id_${user.id}`);
    setSessionStartTime(null);
    setActiveWorkout(null);
    setIsFinishing(false);
    setShowPhotoStep(false);
    onBack();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isResting) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
        <p className="text-red-600 font-black uppercase tracking-[0.4em] mb-4 italic">Recuperação Biomecânica</p>
        <div className="text-[14rem] font-black italic tracking-tighter leading-none text-white animate-pulse">{restCountdown}</div>
        <button onClick={() => setRestCountdown(0)} className="mt-16 flex items-center gap-2 bg-zinc-900 px-12 py-6 rounded-[2.5rem] border border-white/5 font-black uppercase tracking-widest text-xs hover:bg-red-600 shadow-2xl transition-all">Pular Descanso</button>
      </div>
    );
  }

  if (showCompletionModal) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
        <Card className="w-full max-w-sm bg-zinc-900 border-red-600/30 p-10 text-center shadow-3xl animate-in zoom-in-95">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-600/30">
            <Trophy className="text-white" size={48} />
          </div>
          <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter leading-none mb-2">Protocolo Vencido!</h3>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-10">Sua performance foi gravada com sucesso.</p>
          <div className="bg-black/60 p-6 rounded-3xl mb-10 border border-white/5 shadow-inner">
             <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 italic">Tempo Total</p>
             <p className="text-5xl font-black text-white italic tracking-tighter leading-none">{formatTime(elapsedTime)}</p>
          </div>
          <button onClick={() => { setShowCompletionModal(false); setShowPhotoStep(true); }} className="w-full py-5 bg-red-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-red-700 transition-all">Gravar Selfie Elite</button>
        </Card>
      </div>
    );
  }

  if (showPhotoStep) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col p-6 text-white animate-in zoom-in duration-300 text-left">
        <header className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black italic uppercase tracking-tighter">Resumo da Missão</h3>
          <button onClick={() => setShowPhotoStep(false)} className="p-2 bg-zinc-900 rounded-full shadow-lg"><X size={20}/></button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-sm aspect-square bg-zinc-900 rounded-[3rem] border-2 border-dashed border-red-600/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group shadow-2xl"
          >
            {selfieUrl ? <img src={selfieUrl} className="w-full h-full object-cover" /> : <><Camera size={48} className="text-red-600 mb-4 group-hover:scale-110 transition-transform" /><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Registrar Selfie de Elite</p></>}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="user" onChange={capturePhoto} />
          </div>
          <div className="text-center">
            <h4 className="text-4xl font-black italic uppercase text-white tracking-tighter">{activeWorkout?.title}</h4>
            <div className="flex gap-4 justify-center mt-4">
              <div className="flex flex-col"><span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Tempo</span><span className="text-lg font-black text-red-600 italic tabular-nums">{formatTime(elapsedTime)}</span></div>
            </div>
          </div>
        </div>
        <button onClick={finishSession} disabled={isFinishing} className="w-full py-6 bg-red-600 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-red-600/30 hover:bg-red-700 transition-all flex items-center justify-center gap-3 mb-8">
          {isFinishing ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> SALVANDO...</span> : <><CheckCircle2 /> SALVAR NO FEED</>}
        </button>
      </div>
    );
  }

  if (!activeWorkout) {
    return (
      <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-black animate-in fade-in">
        <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/90 backdrop-blur-md py-4 z-40 -mx-6 px-6 border-b border-white/5">
          <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full shadow-lg text-white hover:bg-red-600 transition-colors shadow-xl">
            <ArrowLeft size={20}/>
          </button>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            <HeaderTitle text="Planilhas de Treino" />
          </h2>
        </header>
        <div className="space-y-4">
          {user.workouts?.map(w => (
            <Card key={w.id} className="p-8 bg-zinc-900/50 border-white/5 flex justify-between items-center group cursor-pointer hover:border-red-600/20 shadow-2xl rounded-[3rem]" onClick={() => startSession(w)}>
              <div>
                <h4 className="text-3xl font-black italic uppercase text-white tracking-tighter group-hover:text-red-600 transition-colors">{w.title}</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">{w.exercises.length} Exercícios Prescritos</p>
              </div>
              <div className="p-4 bg-zinc-800 rounded-2xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                <Play size={24} fill="currentColor" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-black animate-in fade-in duration-500">
      {/* COCKPIT HEADER - Limpo e com fonte de impacto */}
      <header className="flex items-center justify-between mb-8 sticky top-0 bg-black/90 backdrop-blur-md z-40 py-6 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-4">
           <button onClick={cancelSession} className="p-3 bg-zinc-800 rounded-2xl text-zinc-500 hover:text-white transition-colors shadow-lg">
              <ArrowLeft size={20}/>
           </button>
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-red-600 uppercase tracking-[0.3em] italic leading-none mb-1">Status Ativo</span>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">{activeWorkout.title}</h2>
           </div>
        </div>
        <div className="flex flex-col items-end">
           <div className="flex items-center gap-2 mb-2">
             <Clock size={20} className="text-red-600 animate-pulse" />
             <span className="text-4xl font-black text-white italic tracking-tighter tabular-nums leading-none">{formatTime(elapsedTime)}</span>
           </div>
           <button onClick={() => setShowCompletionModal(true)} className="bg-red-600 px-6 py-2 rounded-full font-black text-[9px] uppercase shadow-lg shadow-red-900/30 text-white tracking-widest active:scale-95 transition-all">FINALIZAR</button>
        </div>
      </header>

      {/* DASHBOARD DE PROTOCOLO INTEGRADO - Tipografia Padronizada */}
      {workoutStats && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-700">
           <Card className="bg-zinc-900/40 border-white/5 p-6 flex items-center justify-between backdrop-blur-xl rounded-[2.5rem] shadow-3xl">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-600/20">
                    <Calendar size={20} className="text-red-600" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic mb-1 leading-none">Início Protocolo</span>
                    <span className={`text-4xl font-black italic tracking-tighter leading-none ${!workoutStats.rawStartDate ? 'text-zinc-700' : 'text-white'}`}>
                      {workoutStats.startDate.split('/')[0]}<span className="text-red-600 text-lg">/</span>{workoutStats.startDate.split('/')[1]}
                    </span>
                 </div>
              </div>
              <div className="flex gap-10">
                 <div className="text-center">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic mb-1 block">Execuções</span>
                    <div className="flex items-baseline gap-1">
                       <span className="text-4xl font-black text-white italic tracking-tighter leading-none">{workoutStats.completed}</span>
                       <span className="text-[10px] font-black text-zinc-700 italic">/ {workoutStats.total}</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic mb-1 block">Renovação</span>
                    <div className="flex items-center gap-2 justify-end">
                       <RefreshCw size={12} className={workoutStats.completed >= workoutStats.total - 2 ? "text-amber-500 animate-spin" : "text-zinc-700"} />
                       <span className={`text-xl font-black italic uppercase leading-none ${workoutStats.completed >= workoutStats.total - 2 ? "text-amber-500" : "text-zinc-400"}`}>
                          {workoutStats.completed >= workoutStats.total ? "EXCEDIDA" : "OK"}
                       </span>
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      )}

      {/* LISTA DE EXERCÍCIOS */}
      <div className="space-y-4">
        {activeWorkout.exercises.map((ex, idx) => {
          const progress = exerciseProgress[ex.id || ''] || { completedSets: [], isFinished: false };
          return (
            <ExerciseCard 
              key={ex.id || idx} 
              ex={ex} 
              idx={idx} 
              progress={progress} 
              onToggleFinish={(id) => setExerciseProgress(p => ({ ...p, [id]: { ...p[id], isFinished: !p[id].isFinished } }))}
              onMarkSet={(id, sIdx, rest) => {
                 setExerciseProgress(p => ({ ...p, [id]: { ...p[id], completedSets: [...p[id].completedSets, sIdx] } }));
                 setRestCountdown(parseInt(rest) || 60);
                 setIsResting(true);
              }}
              onUpdateLoad={(id, val) => onSave(user.id, { workouts: user.workouts?.map(w => w.id === activeWorkout.id ? { ...w, exercises: w.exercises.map(e => e.id === id ? { ...e, load: val } : e) } : w) })}
              onUpdateUnit={(id, unit) => onSave(user.id, { workouts: user.workouts?.map(w => w.id === activeWorkout.id ? { ...w, exercises: w.exercises.map(e => e.id === id ? { ...e, loadUnit: unit } : e) } : w) })}
              onShowDetail={setExerciseDetail}
            />
          );
        })}
      </div>

      {exerciseDetail && <PrescreveAIDetailModal ex={exerciseDetail} onClose={() => setExerciseDetail(null)} />}
      <EliteFooter />
    </div>
  );
}

export function StudentAssessmentView({ student, onBack }: { student: Student, onBack: () => void }) {
  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-black animate-in fade-in">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg shadow-xl"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
          <HeaderTitle text="Avaliação PhD" />
        </h2>
      </header>
      <div className="space-y-6">
        {student.physicalAssessments && student.physicalAssessments.length > 0 ? (
          student.physicalAssessments.map(pa => (
            <Card key={pa.id} className="p-8 bg-zinc-900 border-zinc-800 rounded-[2.5rem] shadow-3xl">
               <div className="flex justify-between items-start mb-6">
                  <h4 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none">
                    <HeaderTitle text={new Date(pa.data).toLocaleDateString('pt-BR')} />
                  </h4>
                  <div className="bg-red-600 px-4 py-1.5 rounded-full text-[8px] font-black uppercase text-white tracking-widest shadow-lg">Validada</div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-black/60 rounded-3xl border border-white/5">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic mb-2">Massa Corporal</p>
                    <p className="text-4xl font-black text-red-600 italic tracking-tighter leading-none">{pa.peso}KG</p>
                  </div>
                  <div className="p-5 bg-black/60 rounded-3xl border border-white/5">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic mb-2">Gordura Bio</p>
                    <p className="text-4xl font-black text-red-600 italic tracking-tighter leading-none">{pa.bio_percentual_gordura}%</p>
                  </div>
               </div>
            </Card>
          ))
        ) : (
          <p className="text-center text-zinc-700 italic py-12 border-2 border-dashed border-zinc-900 rounded-[3rem] uppercase font-black text-[10px] tracking-widest">Aguardando Avaliação Presencial</p>
        )}
      </div>
    </div>
  );
}

export function StudentPeriodizationView({ student, onBack }: { student: Student, onBack: () => void }) {
  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-black animate-in fade-in">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg shadow-xl"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
          <HeaderTitle text="Periodização PhD" />
        </h2>
      </header>
      <div className="flex flex-col items-center justify-center py-20">
        <Brain className="text-zinc-800 mb-6" size={64} />
        <p className="text-zinc-500 font-black uppercase text-xs italic text-center">Acesso aos seus ciclos de treinamento<br/>estrategicamente planejados por IA.</p>
        <Card className="mt-10 p-6 bg-zinc-900/50 border-white/5 w-full max-w-sm">
           <p className="text-[10px] font-black uppercase text-red-600 tracking-widest mb-2 italic">Ciclo Atual</p>
           <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter leading-none">Fase de Acumulação</h3>
           <p className="text-xs text-zinc-500 mt-2 italic">Consulte seu treinador para detalhes dos microciclos.</p>
        </Card>
      </div>
    </div>
  );
}

export function AboutView({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-black animate-in fade-in">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg shadow-xl"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
          <HeaderTitle text="Sobre a ABFIT" />
        </h2>
      </header>
      <div className="space-y-12">
        <div className="text-center">
          <h3 className="text-5xl font-black italic uppercase text-red-600 tracking-tighter leading-none">Elite Performance</h3>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] mt-2 italic">PhD André Brito</p>
        </div>
        <div className="space-y-6">
          <Card className="p-8 bg-zinc-900/40 border-white/5">
            <h4 className="text-sm font-black uppercase italic text-white mb-4">Nossa Missão</h4>
            <p className="text-xs text-zinc-400 leading-relaxed italic">
              Proporcionar treinamento de alto nível fundamentado em Ciência do Exercício e Biomecânica, 
              utilizando tecnologia de ponta para otimizar resultados e garantir a segurança do atleta.
            </p>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900 rounded-3xl border border-white/5 text-center">
               <Award className="text-red-600 mx-auto mb-2" size={24} />
               <p className="text-[10px] font-black uppercase text-white leading-none">Certificação PhD</p>
            </div>
            <div className="p-4 bg-zinc-900 rounded-3xl border border-white/5 text-center">
               <Shield className="text-red-600 mx-auto mb-2" size={24} />
               <p className="text-[10px] font-black uppercase text-white leading-none">Segurança PBE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
