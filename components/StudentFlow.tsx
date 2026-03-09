
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Dumbbell, Activity, Play,
  Loader2, Clock, Target, Award, ShieldCheck, Brain,
  Camera, CheckCircle2, X, Trash2, FastForward, Check,
  Trophy, AlertCircle, Info, ChevronDown, ChevronUp,
  Zap, Scan, Shield, Maximize2, Calendar, RefreshCw, Menu, Sparkles, AlertTriangle, LayoutGrid
} from 'lucide-react';
import { Card, EliteFooter, HeaderTitle } from './Layout';
import { Student, WorkoutHistoryEntry, Workout, AnalyticsData, Exercise } from '../types';

// --- BANCO DE DADOS VISUAL (FALLBACK) ---
const GIF_DATABASE: Record<string, string> = {
  // PERNAS / GLÚTEOS
  "leg press": "https://i.pinimg.com/originals/9e/1f/2a/9e1f2a36b0432924467c6999205307b2.gif",
  "levantar e sentar": "https://i.pinimg.com/originals/18/31/39/183139366e60970220677270387439da.gif",
  "agachamento": "https://i.pinimg.com/originals/3f/78/3f/3f783f237373024766023277732623a6.gif",
  "stiff": "https://i.pinimg.com/originals/60/0a/85/600a8523c0356191942730628e469d72.gif",
  "mesa flexora": "https://i.pinimg.com/originals/34/00/28/340028e35900508e063806f97653241e.gif",
  "cadeira extensora": "https://i.pinimg.com/originals/94/a5/d8/94a5d85203387c97561337dce95e4e20.gif",
  "panturrilha": "https://i.pinimg.com/originals/b5/02/b7/b502b70f05562d98064402636a04e57e.gif",
  "extensão de quadril": "https://i.pinimg.com/originals/3e/23/e5/3e23e53625c2d32fb0d2ebf5d37df902.gif",
  "gluteo": "https://i.pinimg.com/originals/3e/23/e5/3e23e53625c2d32fb0d2ebf5d37df902.gif",
  "flexão de joelho": "https://i.pinimg.com/originals/c5/b4/1b/c5b41b94239c1b3595462539a2632200.gif",
  "abdução": "https://i.pinimg.com/originals/3e/23/e5/3e23e53625c2d32fb0d2ebf5d37df902.gif",
  "elevação pélvica": "https://i.pinimg.com/originals/60/0a/85/600a8523c0356191942730628e469d72.gif", 
  "elevação de quadril": "https://i.pinimg.com/originals/60/0a/85/600a8523c0356191942730628e469d72.gif",

  // SUPERIORES / COSTAS / PEITO
  "supino": "https://i.pinimg.com/originals/52/63/a2/5263a236402377a00f40d64996924263.gif",
  "crucifixo": "https://i.pinimg.com/originals/52/63/a2/5263a236402377a00f40d64996924263.gif",
  "crucifixo inverso": "https://i.pinimg.com/originals/3c/69/34/3c6934c933fa76964a22b07d6776b772.gif",
  "puxada": "https://i.pinimg.com/originals/f3/06/18/f30618012675713df8302f354f923b71.gif",
  "remada": "https://i.pinimg.com/originals/f3/06/18/f30618012675713df8302f354f923b71.gif",
  "desenvolvimento": "https://i.pinimg.com/originals/e7/17/74/e71774e363b9bc298d022b7a9f7374b0.gif",
  "elevação lateral": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  "extensão de ombros": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  
  // BRAÇOS
  "rosca": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
  "bíceps": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
  "biceps": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
  "tríceps": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  "triceps": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  "corda": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  "testa": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",

  // ABDOMEN / CORE
  "abdominal": "https://i.pinimg.com/originals/c9/26/50/c92650050893347c6920330424647306.gif",
  "prancha": "https://i.pinimg.com/originals/7e/63/01/7e63013d396d74704047c870296700c2.gif",
  "mata-borrão": "https://i.pinimg.com/originals/81/20/83/81208392a5499292376991f24d7790b9.gif",
  "super-man": "https://i.pinimg.com/originals/81/20/83/81208392a5499292376991f24d7790b9.gif",
  "superman": "https://i.pinimg.com/originals/81/20/83/81208392a5499292376991f24d7790b9.gif",
  "lombar": "https://i.pinimg.com/originals/81/20/83/81208392a5499292376991f24d7790b9.gif"
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop";

// Componente de Imagem Inteligente com Fallback
function ExerciseImage({ ex, className }: { ex: Exercise, className?: string }) {
  const [src, setSrc] = useState<string>("");
  const [attempt, setAttempt] = useState(0); // 0: ex.thumb, 1: DB match, 2: Default

  const findInDb = (name: string) => {
    const nameLower = name.toLowerCase();
    const match = Object.keys(GIF_DATABASE).find(key => nameLower.includes(key));
    return match ? GIF_DATABASE[match] : null;
  };

  useEffect(() => {
    // Reset state when exercise changes
    setAttempt(0);
    if (ex.thumb && ex.thumb.length > 10) {
      setSrc(ex.thumb);
    } else {
      // Try DB immediately if no thumb
      const dbMatch = findInDb(ex.name);
      if (dbMatch) {
        setSrc(dbMatch);
        setAttempt(1);
      } else {
        setSrc(DEFAULT_IMAGE);
        setAttempt(2);
      }
    }
  }, [ex]);

  const handleError = () => {
    // Se falhar na tentativa 0 (thumb do banco/prescreveAI)
    if (attempt === 0) {
        const dbMatch = findInDb(ex.name);
        // Só muda se o DB match for diferente do atual (pra evitar loop se thumb == dbMatch)
        if (dbMatch && dbMatch !== src) {
            setSrc(dbMatch);
            setAttempt(1);
        } else {
            setSrc(DEFAULT_IMAGE);
            setAttempt(2);
        }
    } 
    // Se falhar na tentativa 1 (DB), vai pro default
    else if (attempt === 1) {
        setSrc(DEFAULT_IMAGE);
        setAttempt(2);
    }
    // Se falhar na tentativa 2 (Default), não faz nada (mantém imagem quebrada ou tenta reload)
  };

  return (
    <img 
      src={src || DEFAULT_IMAGE} 
      alt={ex.name} 
      className={className} 
      onError={handleError}
      referrerPolicy="no-referrer"
    />
  );
}

/**
 * Estilos de Animação para o "Loop" da Figura
 */
const animationStyles = `
  @keyframes biomechanicalVideo {
    0% { transform: scale(1); filter: brightness(1) contrast(1); }
    50% { transform: scale(1.02); filter: brightness(1.1) contrast(1.1); }
    100% { transform: scale(1); filter: brightness(1) contrast(1); }
  }
  .video-motion-engine { 
    animation: biomechanicalVideo 4s cubic-bezier(0.4, 0, 0.2, 1) infinite; 
  }
`;

/**
 * Modal Cinematográfico PrescreveAI
 */
export function PrescreveAIDetailModal({ ex, onClose }: { ex: Exercise, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[150] bg-background/95 backdrop-blur-2xl flex flex-col p-6 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto custom-scrollbar text-left">
      <style>{animationStyles}</style>
      <header className="flex justify-between items-center mb-8 sticky top-0 z-50 py-2">
        <div className="flex flex-col">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] italic leading-none mb-2">PrescreveAI Elite</p>
          <h2 className="text-2xl font-black italic uppercase text-foreground tracking-tighter leading-none max-w-[80%]">{ex.name}</h2>
        </div>
        <button onClick={onClose} className="p-3 bg-card rounded-full border border-border text-muted-foreground hover:text-foreground transition-all shadow-2xl">
          <X size={24} />
        </button>
      </header>

      <div className="max-w-2xl mx-auto w-full space-y-8 pb-20">
        <div className="relative aspect-video w-full bg-card rounded-[2.5rem] overflow-hidden border border-border shadow-3xl group">
          <ExerciseImage 
            ex={ex}
            className="w-full h-full object-cover video-motion-engine"
          />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-600/30 animate-[scan_3s_infinite]"></div>
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-600/30">
               <Scan size={14} className="text-red-600 animate-pulse" />
               <span className="text-[8px] font-black text-foreground uppercase tracking-widest">Análise Ativa</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-card/50 border-border space-y-4">
             <div className="flex items-center gap-3">
                <Zap className="text-red-600" size={18} />
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">Execução Técnica</h4>
             </div>
             <p className="text-xs text-muted-foreground font-medium leading-relaxed italic border-l-2 border-red-600 pl-4">
               {ex.description || "Mantenha a estabilidade do core e controle a fase excêntrica do movimento. Respire de forma contínua durante a execução."}
             </p>
          </Card>
          <Card className="p-6 bg-card/50 border-border space-y-4">
             <div className="flex items-center gap-3">
                <ShieldCheck className="text-emerald-500" size={18} />
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">Hipertrofia Alvo</h4>
             </div>
             <div className="flex flex-wrap gap-2">
                {(ex.benefits || "Tensão Mecânica,Estresse Metabólico,Performance").split(',').map((b: string, i: number) => (
                  <span key={i} className="text-[9px] font-black uppercase tracking-widest bg-background px-3 py-1.5 rounded-full text-muted-foreground border border-border italic">{b.trim()}</span>
                ))}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({ ex, idx, progress, onToggleFinish, onMarkSet, onUpdateLoad, onUpdateUnit, onShowDetail, currentReps }: { 
  ex: Exercise, 
  idx: number, 
  progress: { completedSets: number[], isFinished: boolean },
  onToggleFinish: (id: string) => void,
  onMarkSet: (id: string, idx: number, rest: string) => void,
  onUpdateLoad: (id: string, val: string) => void,
  onUpdateUnit: (id: string, unit: 'Kg' | 'Placas') => void,
  onShowDetail: (ex: Exercise) => void,
  currentReps?: string | null,
  key?: React.Key
}) {
  const totalSets = parseInt(ex.sets || '3') || 3;
  const totalReps = currentReps || ex.reps || '15';
  const allSetsCompleted = progress.completedSets.length >= totalSets;

  return (
    <div className={`relative bg-card/30 border rounded-[2.5rem] overflow-hidden transition-all duration-500 ease-out mb-4 p-6 shadow-2xl group/card 
      ${allSetsCompleted 
        ? 'border-emerald-500 border-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] bg-emerald-950/20' 
        : 'border-border hover:border-red-600/30 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(220,38,38,0.15)]'
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 cursor-pointer group flex items-start gap-4" onClick={() => onShowDetail(ex)}>
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border shrink-0 bg-background relative shadow-lg">
             <ExerciseImage 
               ex={ex}
               className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
             />
             <div className="absolute inset-0 bg-red-600/10 mix-blend-overlay"></div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-black italic uppercase tracking-widest leading-none ${allSetsCompleted ? 'text-emerald-500' : 'text-red-600'}`}>{idx + 1}º Exercício</span>
              <Maximize2 size={10} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h4 className={`text-xl font-black italic uppercase tracking-tighter leading-none transition-colors ${allSetsCompleted ? 'text-emerald-500' : 'text-foreground group-hover:text-red-600'}`}>
              {ex.name}
            </h4>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 italic">{ex.method || 'Protocolo PhD Padrão'}</p>
          </div>
        </div>
        {allSetsCompleted && (
           <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-600 text-white shadow-lg animate-in zoom-in spin-in-90 duration-300">
             <Check size={20} />
           </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 bg-background/40 border border-border rounded-3xl p-4 flex flex-col items-center shadow-inner">
          <div className="flex flex-wrap justify-center gap-3">
            {Array.from({ length: totalSets }).map((_, sIdx) => (
              <button 
                key={sIdx}
                onClick={() => onMarkSet(ex.id || '', sIdx, ex.rest || '60')}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-black italic text-sm transition-all border-2 
                  ${progress.completedSets.includes(sIdx) 
                    ? 'bg-red-600 border-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] scale-110' 
                    : 'bg-card border-border text-muted-foreground hover:border-red-600/50 hover:text-foreground'
                  }`}
              >
                {sIdx + 1}
              </button>
            ))}
          </div>
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-3 italic">
            {allSetsCompleted ? <span className="text-emerald-500">SÉRIE CONCLUÍDA</span> : "Registro de Séries"}
          </p>
        </div>

        <div className="bg-background/40 border border-border rounded-3xl p-4 flex flex-col items-center justify-center shadow-inner">
          <span className="text-2xl font-black text-foreground italic leading-none tracking-tighter">{totalReps}</span>
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-2 italic">Reps Alvo</p>
        </div>

        <div className="bg-background/40 border border-border rounded-3xl p-4 flex flex-col items-center justify-center shadow-inner">
          <div className="flex items-baseline gap-1">
            <input 
              type="number" 
              defaultValue={ex.load || ''}
              placeholder="--"
              onBlur={(e) => onUpdateLoad(ex.id!, e.target.value)}
              className="bg-transparent border-none p-0 text-2xl font-black text-center text-foreground outline-none focus:ring-0 w-16 italic tracking-tighter placeholder:text-muted-foreground"
            />
            <span className="text-[10px] font-black text-red-600 uppercase italic">KG</span>
          </div>
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-2 italic">Carga Atual</p>
        </div>
      </div>
    </div>
  );
}

// Helper para calcular reps dinâmicas
function getCurrentRepsForStudent(student: Student): string | null {
  if (!student.periodization || !student.periodization.microciclos) return null;
  
  const startDate = student.protocolStartDate || student.periodization.startDate;
  if (!startDate) return null;
  
  const start = new Date(startDate).getTime();
  const now = Date.now();
  const diffWeeks = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000)) + 1;
  
  const currentMicro = student.periodization.microciclos.find((m: any) => {
    const range = m.range || m.semanas;
    if (!range) return false;
    const numbers = range.match(/\d+/g);
    if (!numbers) return false;
    const startWeek = parseInt(numbers[0]);
    const endWeek = numbers.length > 1 ? parseInt(numbers[1]) : startWeek;
    return diffWeeks >= startWeek && diffWeeks <= endWeek;
  });
  
  if (!currentMicro) return null;
  if (currentMicro.reps) return currentMicro.reps;
  
  const volume = currentMicro.volume || currentMicro.volume_semanal || "";
  const repsMatch = volume.match(/(\d+-\d+|\d+)\s*REPETIÇÕES/i) || volume.match(/(\d+-\d+|\d+)\s*reps/i);
  return repsMatch ? repsMatch[1] : null;
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

  const currentReps = useMemo(() => getCurrentRepsForStudent(user), [user]);

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

  const allExercisesCompleted = useMemo(() => {
    if (!activeWorkout) return false;
    return activeWorkout.exercises.every(ex => {
        const prog = exerciseProgress[ex.id || ''];
        const totalSets = parseInt(ex.sets || '3') || 3;
        return prog && prog.completedSets.length >= totalSets;
    });
  }, [activeWorkout, exerciseProgress]);

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
    setActiveWorkout(null);
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
      <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center p-6 text-foreground animate-in fade-in duration-300">
        <p className="text-red-600 font-black uppercase tracking-[0.4em] mb-4 italic">Recuperação Biomecânica</p>
        <div className="text-[6rem] font-black italic tracking-tighter leading-none text-foreground animate-pulse tabular-nums">{restCountdown}</div>
        <button onClick={() => setRestCountdown(0)} className="mt-16 flex items-center gap-2 bg-card px-12 py-6 rounded-[2.5rem] border border-border font-black uppercase tracking-widest text-xs hover:bg-red-600 shadow-2xl transition-all">Pular Descanso</button>
      </div>
    );
  }

  if (showCompletionModal) {
    return (
      <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
        <Card className="w-full max-w-sm bg-card border-red-600/30 p-10 text-center shadow-3xl animate-in zoom-in-95">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-600/30">
            <Trophy className="text-white" size={48} />
          </div>
          <h3 className="text-xl font-black italic uppercase text-foreground tracking-tighter leading-none mb-2">Protocolo Vencido!</h3>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-10">Sua performance foi gravada com sucesso.</p>
          <div className="bg-background/60 p-6 rounded-3xl mb-10 border border-border shadow-inner">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 italic">Tempo Total</p>
             <p className="text-2xl font-black text-foreground italic tracking-tighter leading-none">{formatTime(elapsedTime)}</p>
          </div>
          <button onClick={() => { setShowCompletionModal(false); setShowPhotoStep(true); }} className="w-full py-5 bg-red-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-red-700 transition-all">Gravar Selfie Elite</button>
        </Card>
      </div>
    );
  }

  if (showPhotoStep) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col p-6 text-foreground animate-in zoom-in duration-300 text-left">
        <header className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black italic uppercase tracking-tighter">Resumo da Missão</h3>
          <button onClick={() => setShowPhotoStep(false)} className="p-2 bg-card rounded-full shadow-lg"><X size={20}/></button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-sm aspect-square bg-card rounded-[3rem] border-2 border-dashed border-red-600/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group shadow-2xl"
          >
            {selfieUrl ? <img src={selfieUrl} className="w-full h-full object-cover" /> : <><Camera size={48} className="text-red-600 mb-4 group-hover:scale-110 transition-transform" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registrar Selfie de Elite</p></>}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="user" onChange={capturePhoto} />
          </div>
          <div className="text-center">
            <h4 className="text-2xl font-black italic uppercase text-foreground tracking-tighter">{activeWorkout?.title}</h4>
            <div className="flex gap-4 justify-center mt-4">
              <div className="flex flex-col"><span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Tempo</span><span className="text-lg font-black text-red-600 italic tabular-nums">{formatTime(elapsedTime)}</span></div>
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
      <div className="p-6 pb-48 text-foreground overflow-y-auto h-screen text-left custom-scrollbar bg-background animate-in fade-in">
        <header className="flex items-center gap-4 mb-10 sticky top-0 bg-background/90 backdrop-blur-md py-4 z-40 -mx-6 px-6 border-b border-border">
          <button onClick={onBack} className="p-2 bg-card rounded-full shadow-lg text-foreground hover:bg-red-600 transition-colors shadow-xl">
            <ArrowLeft size={20}/>
          </button>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            <HeaderTitle text="Planilhas de Treino" />
          </h2>
        </header>
        <div className="space-y-4">
          {(user.workouts || []).length > 0 ? (
            user.workouts!.map(w => (
              <Card key={w.id} className="p-8 bg-card/50 border-border flex justify-between items-center group cursor-pointer hover:border-red-600/20 shadow-2xl rounded-[3rem]" onClick={() => startSession(w)}>
                <div>
                  <h4 className="text-xl font-black italic uppercase text-foreground tracking-tighter group-hover:text-red-600 transition-colors">{w.title}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">{w.exercises.length} Exercícios Prescritos</p>
                </div>
                <div className="p-4 bg-muted rounded-2xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                  <Play size={24} fill="currentColor" />
                </div>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-[3rem]">
               <Dumbbell size={48} className="text-muted-foreground mb-6" />
               <p className="text-muted-foreground font-black uppercase text-xs italic tracking-widest">Nenhum treino publicado pelo professor.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-48 text-foreground overflow-y-auto h-screen text-left custom-scrollbar bg-background animate-in fade-in duration-500">
      <header className="flex items-center justify-between mb-8 sticky top-0 bg-background/90 backdrop-blur-md z-40 py-6 -mx-6 px-6 border-b border-border">
        <div className="flex items-center gap-3">
           <button onClick={onBack} className="p-3 bg-card rounded-2xl text-muted-foreground hover:text-foreground transition-colors shadow-lg">
              <LayoutGrid size={20}/>
           </button>
           <button onClick={cancelSession} className="p-3 bg-muted rounded-2xl text-muted-foreground hover:text-foreground transition-colors shadow-lg">
              <ArrowLeft size={20}/>
           </button>
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-red-600 uppercase tracking-[0.3em] italic leading-none mb-1">Status Ativo</span>
              <h2 className="text-lg font-black italic uppercase tracking-tighter text-foreground leading-none">{activeWorkout.title}</h2>
           </div>
        </div>
        <div className="flex flex-col items-end">
           <div className="flex items-center gap-2 mb-2">
             <Clock size={20} className="text-red-600 animate-pulse" />
             <span className="text-xl font-black text-foreground italic tracking-tighter tabular-nums leading-none">{formatTime(elapsedTime)}</span>
           </div>
           {allExercisesCompleted ? (
             <button onClick={() => setShowCompletionModal(true)} className="bg-emerald-600 px-6 py-2 rounded-full font-black text-[9px] uppercase shadow-lg shadow-emerald-900/30 text-white tracking-widest animate-pulse hover:bg-emerald-700 transition-all">
                SALVAR TREINO
             </button>
           ) : (
             <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">EM ANDAMENTO</span>
           )}
        </div>
      </header>

      {workoutStats && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-700">
           <Card className="bg-card/40 border-border p-4 flex items-center justify-between backdrop-blur-xl rounded-[2.5rem] shadow-3xl">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-600/20 shrink-0">
                    <Calendar size={18} className="text-red-600" />
                 </div>
                 <div className="flex flex-col min-w-0">
                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest italic mb-1 leading-none">Início Protocolo</span>
                    <span className={`font-black italic tracking-tighter leading-none truncate ${!workoutStats.rawStartDate ? 'text-muted-foreground text-[10px]' : 'text-foreground text-lg'}`}>
                      {!workoutStats.rawStartDate ? workoutStats.startDate : (
                        <>{(workoutStats.startDate || "").split('/')[0]}<span className="text-red-600 text-sm">/</span>{(workoutStats.startDate || "").split('/')[1]}</>
                      )}
                    </span>
                 </div>
              </div>
              <div className="flex gap-4 sm:gap-8 shrink-0">
                 <div className="text-center">
                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest italic mb-1 block">Execuções</span>
                    <div className="flex items-baseline gap-0.5">
                       <span className="text-lg font-black text-foreground italic tracking-tighter leading-none">{workoutStats.completed}</span>
                       <span className="text-[8px] font-black text-muted-foreground italic">/{workoutStats.total}</span>
                    </div>
                 </div>
                 <div className="text-right hidden xs:block">
                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest italic mb-1 block">Renovação</span>
                    <div className="flex items-center gap-1 justify-end">
                       <RefreshCw size={10} className={workoutStats.completed >= workoutStats.total - 2 ? "text-amber-500 animate-spin" : "text-muted-foreground"} />
                       <span className={`text-xs font-black italic uppercase leading-none ${workoutStats.completed >= workoutStats.total - 2 ? "text-amber-500" : "text-muted-foreground"}`}>
                          {workoutStats.completed >= workoutStats.total ? "EXCEDIDA" : "OK"}
                       </span>
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      )}

      <div className="space-y-4">
        {activeWorkout.exercises.map((ex, idx) => {
          const progress = exerciseProgress[ex.id || ''] || { completedSets: [], isFinished: false };
          return (
            <ExerciseCard 
              key={ex.id || idx} 
              ex={ex} 
              idx={idx} 
              progress={progress} 
              currentReps={currentReps}
              onToggleFinish={(id) => setExerciseProgress(p => ({ ...p, [id]: { ...p[id], isFinished: !p[id].isFinished } }))}
              onMarkSet={(id, sIdx, rest) => {
                 setExerciseProgress(p => {
                   const prev = p[id] || { completedSets: [], isFinished: false };
                   const newSets = prev.completedSets.includes(sIdx) 
                     ? prev.completedSets.filter(s => s !== sIdx)
                     : [...prev.completedSets, sIdx];
                   return { ...p, [id]: { ...prev, completedSets: newSets } };
                 });
                 // Inicia timer apenas se o set não estava marcado (está marcando agora)
                 if (!progress.completedSets.includes(sIdx)) {
                    setRestCountdown(parseInt(rest) || 60);
                    setIsResting(true);
                 }
              }}
              onUpdateLoad={(id, val) => onSave(user.id, { workouts: user.workouts?.map(w => w.id === activeWorkout.id ? { ...w, exercises: w.exercises.map(e => e.id === id ? { ...e, load: val } : e) } : w) })}
              onUpdateUnit={(id, unit) => onSave(user.id, { workouts: user.workouts?.map(w => w.id === activeWorkout.id ? { ...w, exercises: w.exercises.map(e => e.id === id ? { ...e, loadUnit: unit } : e) } : w) })}
              onShowDetail={setExerciseDetail}
            />
          );
        })}
      </div>

      {allExercisesCompleted && (
         <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent z-50">
            <button 
               onClick={() => setShowCompletionModal(true)}
               className="w-full py-6 bg-emerald-600 rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-pulse hover:scale-[1.02] transition-transform text-white"
            >
               VOCÊ TERMINOU DE TREINAR?
            </button>
         </div>
      )}

      {exerciseDetail && <PrescreveAIDetailModal ex={exerciseDetail} onClose={() => setExerciseDetail(null)} />}
      <EliteFooter />
    </div>
  );
}

export function StudentAssessmentView({ student, onBack, onToggleMenu }: { student: Student, onBack: () => void, onToggleMenu?: () => void }) {
  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-black animate-in fade-in">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
           {onToggleMenu && (
             <button onClick={onToggleMenu} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors shadow-lg">
               <Menu size={20}/>
             </button>
           )}
           <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg shadow-xl">
             <ArrowLeft size={20}/>
           </button>
        </div>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
          <HeaderTitle text="Avaliação PhD" />
        </h2>
      </header>
      <div className="space-y-6">
        {student.physicalAssessments && student.physicalAssessments.length > 0 ? (
          student.physicalAssessments.map(pa => (
            <Card key={pa.id} className="p-8 bg-zinc-900 border-zinc-800 rounded-[2.5rem] shadow-3xl">
               <div className="flex justify-between items-start mb-6">
                  <h4 className="text-lg font-black italic uppercase text-white tracking-tighter leading-none">
                    <HeaderTitle text={new Date(pa.data).toLocaleDateString('pt-BR')} />
                  </h4>
                  <div className="bg-red-600 px-4 py-1.5 rounded-full text-[8px] font-black uppercase text-white tracking-widest shadow-lg">Validada</div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-black/60 rounded-3xl border border-white/5">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic mb-2">Massa Corporal</p>
                    <p className="text-2xl font-black text-red-600 italic tracking-tighter leading-none">{pa.peso}KG</p>
                  </div>
                  <div className="p-5 bg-black/60 rounded-3xl border border-white/5">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic mb-2">Gordura Bio</p>
                    <p className="text-2xl font-black text-red-600 italic tracking-tighter leading-none">{pa.bio_percentual_gordura}%</p>
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

export function StudentPeriodizationView({ student, onBack, onToggleMenu }: { student: Student, onBack: () => void, onToggleMenu?: () => void }) {
  const plan = student.periodization;

  if (!plan || !plan.generalStrategy) {
    return (
      <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-black animate-in fade-in">
        <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
             {onToggleMenu && (
               <button onClick={onToggleMenu} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors shadow-lg">
                 <Menu size={20}/>
               </button>
             )}
             <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg shadow-xl">
               <ArrowLeft size={20}/>
             </button>
          </div>
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
            <HeaderTitle text="Periodização" />
          </h2>
        </header>
        <div className="flex flex-col items-center justify-center py-20">
          <Brain className="text-zinc-800 mb-6" size={64} />
          <p className="text-zinc-500 font-black uppercase text-xs italic text-center">Aguardando configuração de macrociclo<br/>pelo seu treinador PhD.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-black animate-in fade-in">
      <header className="flex items-center gap-4 mb-8 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
           {onToggleMenu && (
             <button onClick={onToggleMenu} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors shadow-lg">
               <Menu size={20}/>
             </button>
           )}
           <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg shadow-xl">
             <ArrowLeft size={20}/>
           </button>
        </div>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
          <HeaderTitle text="Periodização" />
        </h2>
      </header>

      <div className="space-y-6">
        {plan.bioInsight && (
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-rose-950/40 to-black border border-rose-600/20 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-20"><Sparkles className="text-rose-500" size={64}/></div>
             <div className="flex items-center gap-3 mb-6 relative z-10">
                <Sparkles className="text-rose-500" size={20} />
                <h3 className="text-lg font-black uppercase italic text-rose-500 tracking-widest">Bio-Insight</h3>
             </div>
             
             <p className="text-zinc-300 text-xs italic leading-relaxed mb-8 relative z-10 font-medium">
               {plan.bioInsight.context}
             </p>

             <div className="space-y-4 relative z-10">
               {plan.bioInsight.tips.map((tip, idx) => (
                 <div key={idx} className="flex gap-4">
                    <span className="text-rose-500 font-black italic text-lg">{idx + 1}.</span>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      {(tip || "").split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part)}
                    </p>
                 </div>
               ))}
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="p-8 bg-zinc-900/50 border-white/5 h-full">
              <h3 className="text-[10px] font-black uppercase text-red-600 tracking-widest mb-4 italic">Estratégia Geral</h3>
              <p className="text-white text-sm italic font-medium leading-relaxed mb-6">
                "{plan.generalStrategy}"
              </p>
              {plan.phaseTitle && (
                <div className="pt-6 border-t border-white/5">
                   <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Fase Atual</p>
                   <p className="text-xs text-white font-bold uppercase">{plan.phaseTitle}</p>
                </div>
              )}
           </Card>

           <Card className="p-8 bg-red-950/10 border-red-900/20 h-full">
              <h3 className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-6 italic">Segurança Clínica</h3>
              <div className="space-y-5">
                 {(plan.clinicalSafety || []).map((item, idx) => (
                   <div key={idx} className="flex gap-3">
                      <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">{item}</p>
                   </div>
                 ))}
              </div>
           </Card>
        </div>

        {plan.microciclos && plan.microciclos.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-black uppercase tracking-tighter text-white mb-6">Cronograma de Microciclos</h3>
            <div className="space-y-6">
              {plan.microciclos.map((micro: any, idx: number) => (
                <Card key={idx} className="p-6 bg-zinc-900/40 border-white/5">
                  <div className="mb-6">
                    <h4 className="text-red-500 font-black text-lg mb-1">Semanas {micro.range || micro.semanas}</h4>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{micro.focus || micro.titulo}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                    <div>
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Método</p>
                      <p className="text-sm text-white font-bold">{micro.method || micro.metodo}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Intensidade</p>
                      <p className="text-sm text-white font-bold">{(micro.intensity || micro.intensidade || "").split(' ')[0]}</p>
                      <p className="text-[10px] text-red-500 font-bold">{(micro.intensity || micro.intensidade || "").split(' ').slice(1).join(' ')}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Volume</p>
                      <p className="text-sm text-white font-bold">{(micro.volume || micro.volume_semanal || "").split(' ')[0]}</p>
                      <p className="text-[10px] text-red-500 font-bold">{(micro.volume || micro.volume_semanal || "").split(' ').slice(1).join(' ')}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Repetições</p>
                      <p className="text-sm text-white font-bold">{micro.reps || (micro.volume || micro.volume_semanal || "").split(',')[1]?.trim() || "N/A"}</p>
                    </div>
                  </div>

                  <div className="bg-black/50 p-4 rounded-xl border border-white/5 mb-4">
                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-2">Volume Semanal (Séries)</p>
                    <p className="text-xs text-zinc-300 font-mono">{micro.weeklyVolume || (micro.volume || micro.volume_semanal || "").split(',')[0] || "N/A"}</p>
                  </div>

                  {(micro.notes || micro.descricao) && (
                    <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-zinc-400 italic">Obs: {micro.notes || micro.descricao}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AboutView({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-black animate-in fade-in">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg shadow-xl">
          <ArrowLeft size={20}/>
        </button>
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
