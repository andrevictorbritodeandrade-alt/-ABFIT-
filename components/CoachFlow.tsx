
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, LogOut, ChevronRight, Edit3, Plus, 
  Trash2, Loader2, Brain, Activity, Target, TrendingUp, 
  BookOpen, Zap, AlertCircle, Dumbbell,
  Image as ImageIcon, Save, Book, Ruler, Scale, Footprints,
  Users, Info, Sparkles, LayoutGrid, Calendar, Clock, Play, FileText, Folder,
  ChevronDown, Lightbulb, Bell, CalendarClock, Search, Check, Layers, Video, X, Eye, EyeOff,
  BarChart3, ZapIcon, Settings2, Link as LinkIcon
} from 'lucide-react';
import { Card, EliteFooter, Logo, HeaderTitle, NotificationBadge, WeatherWidget } from './Layout';
import { Student, Exercise, PhysicalAssessment, Workout, AppNotification } from '../types';
import { analyzeExerciseAndGenerateImage, generatePeriodizationPlan, generateTechnicalCue, generateBioInsight } from '../services/gemini';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { RunTrackCoachView } from './RunTrack';

export { RunTrackCoachView as RunTrackManager } from './RunTrack';

const EXERCISE_DATABASE: Record<string, string[]> = {
  "Peito": ["Crucifixo aberto", "Supino Reto", "Supino Inclinado", "Voador"],
  "Triceps": ["Tríceps Corda", "Tríceps Testa", "Mergulho"],
  "Costas": ["Puxada Alta", "Remada Baixa", "Remada Curvada"],
  "Biceps": ["Rosca Direta", "Rosca Martelo", "Rosca Scott"],
  "Pernas": ["Agachamento", "Leg Press", "Cadeira Extensora", "Mesa Flexora"]
};

const MUSCLE_GROUPS = Object.keys(EXERCISE_DATABASE);

const DASHBOARD_FEATURES = [
  { id: 'FEED', label: 'FEED DE PERFORMANCE', icon: LayoutGrid },
  { id: 'WORKOUTS', label: 'MEUS TREINOS', icon: Dumbbell },
  { id: 'STUDENT_PERIODIZATION', label: 'PERIODIZAÇÃO PHD', icon: Brain },
  { id: 'STUDENT_ASSESSMENT', label: 'AVALIAÇÃO FÍSICA', icon: Ruler },
  { id: 'RUNTRACK_STUDENT', label: 'RUNTRACK ELITE', icon: Footprints },
  { id: 'ANALYTICS', label: 'ANÁLISE DE DADOS', icon: BarChart3 },
  { id: 'ABOUT_ABFIT', label: 'SOBRE A ABFIT ELITE', icon: Info },
];

export function ProfessorDashboard({ students, onLogout, onSelect }: { students: Student[], onLogout: () => void, onSelect: (s: Student) => void }) {
  const renewalNotifications = useMemo(() => {
    return students.filter(s => {
      const history = s.workoutHistory || [];
      return s.workouts?.some(w => {
        if (!w.projectedSessions) return false;
        const completed = history.filter(h => h.workoutId === w.id).length;
        return (w.projectedSessions - completed) <= 2;
      });
    }).map(s => ({
      id: s.id,
      title: 'Renovação Necessária',
      message: `O atleta ${s.nome} está com treino prestes a vencer.`,
      date: new Date().toLocaleDateString(),
      read: false,
      type: 'RENEWAL' as const
    }));
  }, [students]);

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar">
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <Logo size="text-4xl" />
          <div className="h-8 w-px bg-white/10 mx-2"></div>
          <NotificationBadge notifications={renewalNotifications} />
        </div>
        <div className="flex items-center gap-4">
          <WeatherWidget />
          <button onClick={onLogout} className="p-3 bg-zinc-900 border border-white/5 rounded-full text-zinc-500 hover:text-red-600 transition-colors shadow-lg">
            <LogOut size={20} />
          </button>
        </div>
      </header>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-xl shadow-lg shadow-red-600/20">
                 <Users className="text-white" size={24} />
              </div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter">
                <HeaderTitle text="Gestão de Atletas" />
              </h2>
           </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {students.map(s => {
            const needsRenewal = renewalNotifications.some(n => n.id === s.id);
            return (
              <button 
                key={s.id} 
                onClick={() => onSelect(s)} 
                className={`w-full bg-zinc-900 p-6 rounded-[2.5rem] border transition-all text-left shadow-xl flex items-center justify-between group ${needsRenewal ? 'border-red-600 bg-red-600/5' : 'border-zinc-800 hover:border-red-600/50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/5 shadow-inner">
                    {s.photoUrl ? (
                      <img src={s.photoUrl} className="w-full h-full object-cover" alt={s.nome} />
                    ) : (
                      <Activity className="text-zinc-600" size={24} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black uppercase italic text-lg text-white leading-none tracking-tight">{s.nome}</p>
                      {needsRenewal && <AlertCircle size={14} className="text-red-600 animate-bounce" />}
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mt-1.5 opacity-60">{s.email}</p>
                  </div>
                </div>
                <ChevronRight className={`transition-all ${needsRenewal ? 'text-red-600 translate-x-1' : 'text-zinc-700 group-hover:text-red-600 group-hover:translate-x-1'}`} />
              </button>
            );
          })}
        </div>
      </div>
      <EliteFooter />
    </div>
  );
}

export function StudentManagement({ student, onBack, onNavigate, onEditWorkout, onSave }: { student: Student, onBack: () => void, onNavigate: (v: string) => void, onEditWorkout: (w: Workout) => void, onSave: (sid: string, data: any) => void }) {
  const toggleFeatureVisibility = async (featureId: string) => {
    const currentDisabled = student.disabledFeatures || [];
    let newDisabled;
    if (currentDisabled.includes(featureId)) {
      newDisabled = currentDisabled.filter(id => id !== featureId);
    } else {
      newDisabled = [...currentDisabled, featureId];
    }
    await onSave(student.id, { disabledFeatures: newDisabled });
  };

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter">
          <HeaderTitle text={student.nome} />
        </h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-8 cursor-pointer border-l-4 border-l-indigo-600 group hover:bg-zinc-800/50 transition-all" onClick={() => onNavigate('PERIODIZATION')}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xl font-black italic uppercase text-white group-hover:text-indigo-500 transition-colors">Periodização PhD</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Macro & Microciclos PBE</p>
            </div>
            <Brain className="text-indigo-600 group-hover:scale-110 transition-transform" size={32} />
          </div>
        </Card>

        <Card className="p-8 cursor-pointer border-l-4 border-l-red-600 group hover:bg-zinc-800/50 transition-all" onClick={() => onNavigate('WORKOUT_EDITOR')}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xl font-black italic uppercase text-white group-hover:text-red-600 transition-colors">PrescreveAI Elite</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">IA & Biomecânica PhD</p>
            </div>
            <Video className="text-red-600 group-hover:scale-110 transition-transform" size={32} />
          </div>
        </Card>
      </div>

      <div className="mt-12 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <Eye className="text-red-600" size={16} />
          <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] italic">Visibilidade do Dashboard</h3>
        </div>
        <Card className="bg-zinc-900/50 border-zinc-800 p-6">
          <div className="grid grid-cols-1 gap-3">
            {DASHBOARD_FEATURES.map((feature) => {
              const isDisabled = (student.disabledFeatures || []).includes(feature.id);
              return (
                <div 
                  key={feature.id} 
                  onClick={() => toggleFeatureVisibility(feature.id)}
                  className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 cursor-pointer hover:bg-zinc-800/80 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <feature.icon size={16} className={isDisabled ? "text-zinc-700" : "text-red-600"} />
                    <span className={`text-xs font-black italic ${isDisabled ? 'text-zinc-600' : 'text-white'}`}>
                      {feature.label}
                    </span>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isDisabled ? 'bg-zinc-800' : 'bg-red-600'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isDisabled ? 'left-1' : 'left-7'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <EliteFooter />
    </div>
  );
}

export function PeriodizationView({ student, onBack, onProceedToWorkout }: { student: Student, onBack: () => void, onProceedToWorkout: () => void }) {
  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Periodização</h2>
      </header>
      <div className="flex flex-col items-center justify-center py-20">
        <Brain className="text-zinc-800 mb-6" size={64} />
        <p className="text-zinc-500 font-black uppercase text-xs italic">Seção em desenvolvimento técnico.</p>
        <button onClick={onProceedToWorkout} className="mt-10 px-8 py-4 bg-indigo-600 rounded-full font-black uppercase tracking-widest text-[10px]">Ir para Treinos</button>
      </div>
    </div>
  );
}

export function CoachAssessmentView({ student, onBack, onSave }: { student: Student, onBack: () => void, onSave: (sid: string, data: any) => void }) {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState(student.height?.toString() || '');
  const [fat, setFat] = useState('');

  const handleSave = async () => {
    const assessment = { id: Date.now().toString(), data: new Date().toISOString(), peso: weight, altura: height, bio_percentual_gordura: fat };
    const assessments = [assessment, ...(student.physicalAssessments || [])];
    await onSave(student.id, { physicalAssessments: assessments, weight, height });
    onBack();
  };

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Nova Avaliação</h2>
      </header>
      <div className="space-y-6">
        <Card className="p-6 bg-zinc-900 border-zinc-800 space-y-4">
          <input type="number" placeholder="PESO (KG)" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-black p-4 rounded-xl border border-zinc-800 outline-none focus:border-red-600 font-black italic" />
          <input type="number" placeholder="ALTURA (CM)" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-black p-4 rounded-xl border border-zinc-800 outline-none focus:border-red-600 font-black italic" />
          <input type="number" placeholder="% GORDURA" value={fat} onChange={e => setFat(e.target.value)} className="w-full bg-black p-4 rounded-xl border border-zinc-800 outline-none focus:border-red-600 font-black italic" />
          <button onClick={handleSave} className="w-full py-5 bg-emerald-600 rounded-xl font-black uppercase tracking-widest">Salvar Avaliação</button>
        </Card>
      </div>
    </div>
  );
}

export function WorkoutEditorView({ student, workoutToEdit, onBack, onSave }: { student: Student, workoutToEdit: Workout | null, onBack: () => void, onSave: (id: string, data: any) => void }) {
  const [title, setTitle] = useState(workoutToEdit?.title || 'Novo Treino');
  const [exercises, setExercises] = useState<Exercise[]>(workoutToEdit?.exercises || []);

  const addExercise = (name: string) => {
    setExercises([...exercises, { id: Date.now().toString(), name, sets: '3', reps: '12', rest: '60s' }]);
  };

  const saveWorkout = async () => {
    const newWorkout: Workout = { id: workoutToEdit?.id || Date.now().toString(), title, exercises };
    const workouts = workoutToEdit 
      ? student.workouts?.map(w => w.id === workoutToEdit.id ? newWorkout : w)
      : [...(student.workouts || []), newWorkout];
    await onSave(student.id, { workouts });
    onBack();
  };

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Editor de Treino</h2>
      </header>
      <div className="space-y-6">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-zinc-900 p-5 rounded-2xl border border-zinc-800 font-black italic text-lg outline-none focus:border-red-600" />
        <div className="grid grid-cols-2 gap-2">
          {MUSCLE_GROUPS.map(g => (
            <button key={g} onClick={() => addExercise(EXERCISE_DATABASE[g][0])} className="p-4 bg-zinc-800 rounded-xl font-black text-[10px] uppercase border border-white/5 hover:border-red-600 transition-all">Add {g}</button>
          ))}
        </div>
        <div className="space-y-4">
          {exercises.map((ex, idx) => (
            <Card key={idx} className="p-4 bg-zinc-900 border-zinc-800 flex justify-between items-center">
              <div>
                <p className="font-black italic uppercase text-xs">{ex.name}</p>
                <p className="text-[10px] text-zinc-500">{ex.sets}x{ex.reps}</p>
              </div>
              <button onClick={() => setExercises(exercises.filter((_, i) => i !== idx))} className="p-2 text-zinc-600 hover:text-red-600"><Trash2 size={16}/></button>
            </Card>
          ))}
        </div>
        <button onClick={saveWorkout} className="w-full py-5 bg-red-600 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-600/20">Salvar Treino Elite</button>
      </div>
    </div>
  );
}
