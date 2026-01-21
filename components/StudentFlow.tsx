
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Dumbbell, Activity, Play,
  Loader2, Clock, Target, Award, ShieldCheck, Brain,
  Camera, CheckCircle2, X
} from 'lucide-react';
import { Card, EliteFooter, HeaderTitle } from './Layout';
import { Student, WorkoutHistoryEntry, Workout, AnalyticsData } from '../types';

export function WorkoutSessionView({ user, onBack, onSave }: { user: Student, onBack: () => void, onSave: (id: string, data: any) => void }) {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const savedId = localStorage.getItem(`active_workout_id_${user.id}`);
    const savedStart = localStorage.getItem(`workout_start_${user.id}`);
    
    if (savedId && user.workouts) {
      const workout = user.workouts.find(w => w.id === savedId);
      if (workout) {
        setActiveWorkout(workout);
        if (savedStart) {
          setSessionStartTime(parseInt(savedStart));
        }
      }
    } else if (user.workouts && user.workouts.length > 0) {
      const first = user.workouts[0];
      setActiveWorkout(first);
      const now = Date.now();
      setSessionStartTime(now);
      localStorage.setItem(`active_workout_id_${user.id}`, first.id);
      localStorage.setItem(`workout_start_${user.id}`, now.toString());
    }
  }, [user.id, user.workouts]);

  useEffect(() => {
    if (sessionStartTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [sessionStartTime]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const finalize = async () => {
    if (!activeWorkout) return;
    setIsFinishing(true);
    const entry: WorkoutHistoryEntry = {
      id: Date.now().toString(),
      name: activeWorkout.title,
      duration: formatTime(elapsedTime),
      date: new Date().toLocaleDateString('pt-BR'),
      timestamp: Date.now(),
      type: 'STRENGTH'
    };
    const history = [entry, ...(user.workoutHistory || [])];
    await onSave(user.id, { workoutHistory: history });
    localStorage.removeItem(`active_workout_id_${user.id}`);
    localStorage.removeItem(`workout_start_${user.id}`);
    setIsFinishing(false);
    onBack();
  };

  // Nenhuma tela de "Launch" ou Carregamento aqui para garantir rapidez total.
  // Se os dados não estiverem prontos, renderiza um esqueleto mínimo.
  if (!activeWorkout || !activeWorkout.exercises) {
    return (
      <div className="h-screen bg-black flex flex-col p-6 animate-in fade-in">
        <header className="flex items-center gap-4 mb-10"><button onClick={onBack} className="p-2 bg-zinc-900 rounded-full"><ArrowLeft size={20}/></button></header>
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
          <Dumbbell size={48} className="mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Seu treino está sendo preparado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-48 text-white h-screen overflow-y-auto custom-scrollbar bg-black animate-in fade-in">
      <header className="flex items-center justify-between mb-8 sticky top-0 bg-black/90 py-4 z-40 border-b border-white/5">
        <div>
          <h2 className="text-xl font-black italic uppercase text-white">{activeWorkout.title}</h2>
          <p className="text-[10px] font-black text-red-600 tabular-nums">{formatTime(elapsedTime)}</p>
        </div>
        <button onClick={finalize} disabled={isFinishing} className="bg-red-600 px-6 py-2 rounded-full font-black text-[10px] uppercase">
          {isFinishing ? <Loader2 className="animate-spin" size={14} /> : 'Finalizar'}
        </button>
      </header>

      <div className="space-y-6">
        {activeWorkout.exercises.map((ex, idx) => (
          <Card key={idx} className="p-6 bg-zinc-900 border-zinc-800">
            <div className="flex gap-4 mb-4">
              <div className="w-16 h-16 bg-black rounded-xl overflow-hidden shrink-0">
                {ex.thumb ? <img src={ex.thumb} className="w-full h-full object-cover" /> : <Activity className="m-auto mt-5 text-zinc-800" />}
              </div>
              <div>
                <h4 className="font-black uppercase text-xs italic">{ex.name}</h4>
                <p className="text-[10px] text-zinc-500 mt-1 font-bold">{ex.sets} séries x {ex.reps} reps</p>
              </div>
            </div>
            <input 
              type="text" 
              placeholder="CARGA ATUAL..." 
              defaultValue={ex.load || ''}
              className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-xs font-black outline-none focus:border-red-600 italic" 
            />
          </Card>
        ))}
      </div>
    </div>
  );
}

export function StudentPeriodizationView({ student, onBack }: { student: Student, onBack: () => void }) {
  if (!student.periodization) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <Brain className="text-zinc-800 mb-4" size={48} />
        <h2 className="text-sm font-black uppercase text-white">Sem Periodização</h2>
        <button onClick={onBack} className="mt-8 px-6 py-2 bg-zinc-900 rounded-full text-[10px] font-black uppercase">Voltar</button>
      </div>
    );
  }
  return (
    <div className="p-6 pb-48 h-screen overflow-y-auto custom-scrollbar bg-black text-white">
      <header className="flex items-center gap-4 mb-10"><button onClick={onBack} className="p-2 bg-zinc-900 rounded-full"><ArrowLeft size={20}/></button><h2 className="text-xl font-black italic uppercase tracking-tighter">Periodização PhD</h2></header>
      <div className="p-8 bg-zinc-900 rounded-[2.5rem] border border-zinc-800"><h1 className="text-2xl font-black italic uppercase mb-2">{student.periodization.titulo}</h1><p className="text-xs text-zinc-500 italic uppercase font-bold">{student.periodization.modelo_teorico}</p></div>
    </div>
  );
}

export function StudentAssessmentView({ student, onBack }: { student: Student, onBack: () => void }) {
  return (
    <div className="p-6 pb-48 h-screen overflow-y-auto custom-scrollbar bg-black text-white">
      <header className="flex items-center gap-4 mb-10"><button onClick={onBack} className="p-2 bg-zinc-900 rounded-full"><ArrowLeft size={20}/></button><h2 className="text-xl font-black italic uppercase tracking-tighter">Avaliação Física</h2></header>
      <div className="space-y-4">
        {student.physicalAssessments?.map(pa => (
          <Card key={pa.id} className="p-6 bg-zinc-900 border-zinc-800">
            <div className="flex justify-between items-center"><p className="text-sm font-black italic uppercase text-white">{new Date(pa.data).toLocaleDateString()}</p><span className="text-red-600 font-black text-lg">{pa.peso}kg</span></div>
          </Card>
        )) || <p className="text-center text-zinc-600 italic mt-20">Nenhuma avaliação.</p>}
      </div>
    </div>
  );
}

export function AboutView({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-6 pb-48 h-screen overflow-y-auto custom-scrollbar bg-black text-white">
      <header className="flex items-center gap-4 mb-10"><button onClick={onBack} className="p-2 bg-zinc-900 rounded-full"><ArrowLeft size={20}/></button><h2 className="text-xl font-black italic uppercase tracking-tighter">Sobre a ABFIT</h2></header>
      <div className="p-8 bg-zinc-900 rounded-[3rem] border border-red-600/20 shadow-2xl"><h1 className="text-3xl font-black italic uppercase mb-4 text-white">Metodologia PhD</h1><p className="text-sm text-zinc-400 font-medium leading-relaxed italic">Ciência e performance aplicadas ao seu resultado.</p></div>
    </div>
  );
}
