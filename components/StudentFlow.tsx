
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Dumbbell, Activity, Play,
  Loader2, Clock, Target, Award, ShieldCheck, Brain,
  Camera, CheckCircle2, X
} from 'lucide-react';
import { Card, EliteFooter, HeaderTitle } from './Layout';
import { Student, WorkoutHistoryEntry, Workout, AnalyticsData } from '../types';

export function AboutView({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-black animate-in fade-in duration-500">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg">
          <ArrowLeft size={20}/>
        </button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter">
          <HeaderTitle text="Sobre a ABFIT" />
        </h2>
      </header>

      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="relative rounded-[3rem] overflow-hidden bg-zinc-900 border border-zinc-800 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Award size={120} className="text-red-600" />
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-4 block">A Elite do Treinamento</span>
            <h1 className="text-4xl font-black italic uppercase text-white mb-6 leading-none tracking-tighter">Ciência e Performance</h1>
            <p className="text-sm text-zinc-400 font-medium leading-relaxed italic border-l-2 border-red-600 pl-4">
              "Transformamos dados biomecânicos em resultados estéticos e de performance através de uma metodologia baseada em evidências."
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-zinc-900/50 border-zinc-800">
            <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center border border-red-600/20 mb-4">
              <Target className="text-red-600" size={20} />
            </div>
            <h3 className="font-black uppercase text-xs italic mb-2">Nossa Missão</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed tracking-tight">
              Prover assessoria esportiva de elite, democratizando o treinamento PhD para atletas amadores e profissionais.
            </p>
          </Card>
          <Card className="p-6 bg-zinc-900/50 border-zinc-800">
            <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center border border-emerald-600/20 mb-4">
              <ShieldCheck className="text-emerald-500" size={20} />
            </div>
            <h3 className="font-black uppercase text-xs italic mb-2 text-emerald-500">Padrão Ouro</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed tracking-tight italic">
              Protocolos validados, os quais tive a oportunidade de ser apresentado e conhecê-los profundamente na Escola de Educação Física da UFRJ e no Instituto de Educação Física da UERJ, garantindo a aplicação de ciência de ponta com segurança e eficiência máxima.
            </p>
          </Card>
        </div>

        <button onClick={onBack} className="w-full py-5 border border-white/10 rounded-full text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-zinc-900 transition-all shadow-xl">Voltar ao Dashboard</button>
      </div>
      <EliteFooter />
    </div>
  );
}

export function StudentPeriodizationView({ student, onBack }: { student: Student, onBack: () => void }) {
  const plan = student.periodization;
  if (!plan) {
    return (
      <div className="p-6 text-white h-screen flex flex-col items-center justify-center text-center">
        <Brain size={64} className="text-zinc-800 mb-6" />
        <h2 className="text-xl font-black uppercase italic">Sem Periodização</h2>
        <p className="text-zinc-500 text-[10px] font-bold uppercase mt-2">Seu treinador ainda não liberou seu macrociclo PhD.</p>
        <button onClick={onBack} className="mt-8 px-8 py-3 bg-zinc-900 rounded-full text-[10px] font-black uppercase shadow-lg">Voltar</button>
      </div>
    );
  }

  const getWeekRange = (weekNum: number) => {
    const start = new Date(plan.startDate || new Date());
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + (weekNum - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${fmt(weekStart)} a ${fmt(weekEnd)}`;
  };

  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-black animate-in fade-in">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg">
          <ArrowLeft size={20}/>
        </button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter">
          <HeaderTitle text="Periodização PhD" />
        </h2>
      </header>
      <div className="space-y-6">
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <p className="text-[10px] font-black uppercase text-red-600 mb-4 tracking-[0.15em] leading-relaxed italic">{plan.modelo_teorico || "PLANEJAMENTO CIENTÍFICO"}</p>
          <h1 className="text-3xl font-black italic uppercase text-white mb-4 tracking-tighter leading-none">{plan.titulo}</h1>
          <p className="text-xs text-zinc-400 font-medium italic opacity-80">{plan.objetivo_longo_prazo}</p>
        </div>
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-2 italic">Cronograma Semanal</h3>
          {plan.microciclos.map((m: any, i: number) => (
            <Card key={i} className="p-6 bg-zinc-900 border-zinc-800 flex items-center justify-between group hover:border-red-600/30 transition-all">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-black text-white uppercase tracking-tighter">SEMANA {m.semana}</span>
                  <span className="text-[10px] font-bold text-zinc-500 italic">({getWeekRange(m.semana)})</span>
                </div>
                <h4 className="text-lg font-black italic uppercase text-red-600 leading-none">{m.tipo}</h4>
                <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1 opacity-70">{m.foco}</p>
              </div>
              <div className="text-right border-l border-white/5 pl-4">
                <span className="text-[8px] font-black text-zinc-500 uppercase block tracking-widest">RPE</span>
                <span className="text-sm font-black text-white italic">{m.pse_alvo}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <EliteFooter />
    </div>
  );
}

export function WorkoutSessionView({ user, onBack, onSave }: { user: Student, onBack: () => void, onSave: (id: string, data: any) => void }) {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showPhotoStep, setShowPhotoStep] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedStart = localStorage.getItem(`workout_start_${user.id}`);
    const savedId = localStorage.getItem(`active_workout_id_${user.id}`);
    if (savedStart && savedId) {
      const start = parseInt(savedStart);
      setSessionStartTime(start);
      setElapsedTime(Math.floor((Date.now() - start) / 1000));
      const workout = user.workouts?.find(w => w.id === savedId);
      if (workout) setActiveWorkout(workout);
    }
  }, [user.id, user.workouts]);

  useEffect(() => {
    if (sessionStartTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionStartTime]);

  const startSession = (workout: Workout) => {
    const now = Date.now();
    setSessionStartTime(now);
    setActiveWorkout(workout);
    localStorage.setItem(`workout_start_${user.id}`, now.toString());
    localStorage.setItem(`active_workout_id_${user.id}`, workout.id);
  };

  const handleUpdateLoad = (workoutId: string, exId: string, value: string) => {
    const updatedWorkouts = (user.workouts || []).map(w => {
      if (w.id === workoutId) {
        return { ...w, exercises: w.exercises.map(ex => ex.id === exId ? { ...ex, load: value } : ex) };
      }
      return w;
    });
    onSave(user.id, { workouts: updatedWorkouts });
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFinishRequest = () => {
    setShowPhotoStep(true);
  };

  const capturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelfieUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const finishSession = async () => {
    if (!activeWorkout) return;
    setIsFinishing(true);
    
    const entry: WorkoutHistoryEntry = {
      id: Date.now().toString(),
      workoutId: activeWorkout.id,
      name: activeWorkout.title,
      duration: formatTime(elapsedTime),
      date: new Date().toLocaleDateString('pt-BR'),
      timestamp: Date.now(),
      photoUrl: selfieUrl || undefined,
      type: 'STRENGTH'
    };
    
    const currentAnalytics: AnalyticsData = user.analytics || { exercises: {}, sessionsCompleted: 0, streakDays: 0 };
    const updatedExercises = { ...currentAnalytics.exercises };
    activeWorkout.exercises.forEach(ex => {
      if (!updatedExercises[ex.name]) updatedExercises[ex.name] = { completed: 0, skipped: 0 };
      updatedExercises[ex.name].completed += 1;
    });

    const newAnalytics: AnalyticsData = {
      ...currentAnalytics,
      sessionsCompleted: (currentAnalytics.sessionsCompleted || 0) + 1,
      streakDays: (currentAnalytics.streakDays || 0) + 1,
      exercises: updatedExercises,
      lastSessionDate: entry.date
    };

    const updatedHistory = [entry, ...(user.workoutHistory || [])];
    await onSave(user.id, { workoutHistory: updatedHistory, analytics: newAnalytics });
    
    localStorage.removeItem(`workout_start_${user.id}`);
    localStorage.removeItem(`active_workout_id_${user.id}`);
    setSessionStartTime(null);
    setActiveWorkout(null);
    setIsFinishing(false);
    setShowPhotoStep(false);
    onBack();
  };

  if (showPhotoStep) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col p-6 text-white animate-in zoom-in duration-300">
        <header className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black italic uppercase tracking-tighter">Resumo da Missão</h3>
          <button onClick={() => setShowPhotoStep(false)} className="p-2 bg-zinc-900 rounded-full shadow-lg"><X size={20}/></button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-sm aspect-square bg-zinc-900 rounded-[3rem] border-2 border-dashed border-red-600/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group shadow-2xl"
          >
            {selfieUrl ? (
              <img src={selfieUrl} className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera size={48} className="text-red-600 mb-4 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Registrar Selfie de Elite</p>
              </>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="user" onChange={capturePhoto} />
          </div>

          <div className="text-center">
            <h4 className="text-2xl font-black italic uppercase text-white tracking-tighter">{activeWorkout?.title}</h4>
            <div className="flex gap-4 justify-center mt-4">
              <div className="flex flex-col"><span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Tempo</span><span className="text-lg font-black text-red-600 italic tabular-nums">{formatTime(elapsedTime)}</span></div>
              <div className="flex flex-col"><span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Status</span><span className="text-lg font-black text-emerald-500 italic">VENCIDO</span></div>
            </div>
          </div>
        </div>

        <button 
          onClick={finishSession} 
          disabled={isFinishing}
          className="w-full py-6 bg-red-600 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-red-600/30 hover:bg-red-700 transition-all flex items-center justify-center gap-3 mb-8"
        >
          {isFinishing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 /> SALVAR NO FEED</>}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-black animate-in fade-in duration-500">
      <header className="flex items-center justify-between mb-8 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex flex-col">
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
            <HeaderTitle text={activeWorkout.title} />
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Clock size={12} className="text-red-600 animate-pulse" />
            <span className="text-[10px] font-black text-zinc-400 tabular-nums">{formatTime(elapsedTime)}</span>
          </div>
        </div>
        <button onClick={handleFinishRequest} className="bg-red-600 px-6 py-2.5 rounded-full font-black text-[10px] uppercase shadow-xl hover:bg-red-700 active:scale-95 transition-all">
          Finalizar
        </button>
      </header>

      <div className="space-y-6">
        {activeWorkout.exercises.map((ex, idx) => (
          <Card key={idx} className="p-6 bg-zinc-900 border-zinc-800">
            <div className="flex gap-4 mb-4">
              <div className="w-20 h-20 bg-black rounded-2xl overflow-hidden shrink-0 border border-white/5 shadow-inner">
                {ex.thumb ? <img src={ex.thumb} className="w-full h-full object-cover" /> : <Activity className="m-auto mt-6 text-zinc-800" />}
              </div>
              <div className="flex-1">
                <h4 className="font-black uppercase text-xs italic text-white tracking-tight">{ex.name}</h4>
                <div className="flex gap-3 mt-3">
                  <div className="bg-black/60 px-2 py-1.5 rounded-lg border border-white/5 flex flex-col items-center min-w-[40px]">
                    <span className="text-[7px] font-black text-zinc-500 uppercase">Séries</span>
                    <span className="text-[10px] font-black text-white">{ex.sets}</span>
                  </div>
                  <div className="bg-black/60 px-2 py-1.5 rounded-lg border border-white/5 flex flex-col items-center min-w-[40px]">
                    <span className="text-[7px] font-black text-zinc-500 uppercase">Reps</span>
                    <span className="text-[10px] font-black text-white">{ex.reps}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative group">
              <label className="text-[8px] font-black text-zinc-500 uppercase ml-1 mb-1 block tracking-widest">Carga / Observação Atual</label>
              <input 
                type="text" 
                defaultValue={ex.load || ''}
                placeholder="DIGITE A CARGA..."
                onBlur={(e) => handleUpdateLoad(activeWorkout.id, ex.id!, e.target.value)}
                className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-xs font-black text-white outline-none focus:border-red-600 transition-all placeholder:text-zinc-800 italic"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function StudentAssessmentView({ student, onBack }: { student: Student, onBack: () => void }) {
  return (
    <div className="p-6 pb-48 text-white overflow-y-auto h-screen text-left custom-scrollbar bg-black animate-in fade-in">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
          <HeaderTitle text="Avaliação Física" />
        </h2>
      </header>
      <div className="space-y-6">
        {student.physicalAssessments && student.physicalAssessments.length > 0 ? (
          student.physicalAssessments.map(pa => (
            <Card key={pa.id} className="p-6 bg-zinc-900 border-zinc-800 transition-all">
               <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-black italic uppercase text-white tracking-tighter">{new Date(pa.data).toLocaleDateString('pt-BR')}</h4>
                  <div className="bg-red-600 px-3 py-1 rounded-full text-[8px] font-black uppercase text-white tracking-widest shadow-lg shadow-red-900/20">Validada</div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-black rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">Peso</p>
                    <p className="text-xl font-black text-red-600 italic">{pa.peso}kg</p>
                  </div>
                  <div className="p-3 bg-black rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">Gordura</p>
                    <p className="text-xl font-black text-red-600 italic">{pa.bio_percentual_gordura}%</p>
                  </div>
               </div>
            </Card>
          ))
        ) : (
          <p className="text-center text-zinc-500 italic py-12 border-2 border-dashed border-zinc-800 rounded-3xl uppercase font-black text-[10px] tracking-widest">Nenhuma avaliação registrada</p>
        )}
      </div>
    </div>
  );
}
