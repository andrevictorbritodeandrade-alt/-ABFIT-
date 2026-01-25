
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, LogOut, ChevronRight, Edit3, Plus, 
  Trash2, Loader2, Brain, Activity, Target, TrendingUp, 
  BookOpen, Zap, AlertCircle, Dumbbell,
  Image as ImageIcon, Save, Book, Ruler, Scale, Footprints,
  Users, Info, Sparkles, LayoutGrid, Calendar, Clock, Play, FileText, Folder,
  ChevronDown, Lightbulb, Bell, CalendarClock, Search, Check, Layers, Video, X, Eye, EyeOff,
  BarChart3, ZapIcon, Settings2, Link as LinkIcon, Send
} from 'lucide-react';
import { Card, EliteFooter, Logo, HeaderTitle, NotificationBadge, WeatherWidget } from './Layout';
import { Student, Exercise, PhysicalAssessment, Workout, AppNotification } from '../types';
import { analyzeExerciseAndGenerateImage } from '../services/gemini';
import { RunTrackCoachView } from './RunTrack';

export { RunTrackCoachView as RunTrackManager } from './RunTrack';

const EXERCISE_DATABASE: Record<string, string[]> = {
  "Peito": ["Supino Reto com HBL", "Crucifixo aberto", "Voador peitoral", "Supino Inclinado", "Flexão de Braços"],
  "Ombro": ["Desenvolvimento aberto", "Abdução de ombros", "Elevação frontal", "Remada alta"],
  "Triceps": ["Tríceps no cross", "Tríceps testa", "Tríceps corda", "Mergulho"],
  "Costas": ["Puxada aberta", "Remada baixa", "Puxada supinada", "Remada curvada"],
  "Biceps": ["Bíceps em pé", "Bíceps scott", "Bíceps concentrado", "Rosca martelo"],
  "Pernas": ["Agachamento livre", "Leg press", "Cadeira extensora", "Mesa flexora", "Stiff"],
  "Core": ["Abdominal supra", "Prancha ventral", "Elevação de pernas"]
};

const MUSCLE_GROUPS = Object.keys(EXERCISE_DATABASE);

const DASHBOARD_FEATURES = [
  { id: 'FEED', label: 'Feed de Performance', icon: LayoutGrid },
  { id: 'WORKOUTS', label: 'Meus Treinos', icon: Dumbbell },
  { id: 'STUDENT_PERIODIZATION', label: 'Periodização PhD', icon: Brain },
  { id: 'STUDENT_ASSESSMENT', label: 'Avaliação Física', icon: Ruler },
  { id: 'RUNTRACK_STUDENT', label: 'RunTrack Elite', icon: Footprints },
  { id: 'ANALYTICS', label: 'Análise de Dados', icon: BarChart3 },
  { id: 'ABOUT_ABFIT', label: 'Sobre a ABFIT Elite', icon: Info },
];

export function ProfessorDashboard({ students, onLogout, onSelect }: { students: Student[], onLogout: () => void, onSelect: (s: Student) => void }) {
  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar text-left">
      <header className="flex justify-between items-center mb-10">
        <Logo size="text-4xl" />
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
            const totalSessions = s.workoutHistory?.length || 0;
            return (
              <button 
                key={s.id} 
                onClick={() => onSelect(s)} 
                className={`w-full bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 hover:border-red-600/50 transition-all text-left shadow-xl flex items-center justify-between group`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/5">
                    {s.photoUrl ? (
                      <img src={s.photoUrl} className="w-full h-full object-cover" alt={s.nome} />
                    ) : (
                      <Activity className="text-zinc-600" size={24} />
                    )}
                  </div>
                  <div>
                    <p className="font-black uppercase italic text-lg text-white leading-none tracking-tight">{s.nome}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                       <p className="text-[10px] text-zinc-500 uppercase font-bold opacity-60">{s.email}</p>
                       <div className="h-1 w-1 bg-zinc-700 rounded-full"></div>
                       <p className="text-[10px] text-red-600 font-black uppercase italic">{totalSessions} Sessões</p>
                    </div>
                  </div>
                </div>
                <ChevronRight className="transition-all text-zinc-700 group-hover:text-red-600 group-hover:translate-x-1" />
              </button>
            );
          })}
        </div>
      </div>
      <EliteFooter />
    </div>
  );
}

export function StudentManagement({ student, onBack, onNavigate, onEditWorkout, onSave }: { student: Student, onBack: () => void, onNavigate: (v: string) => void, onEditWorkout: (w: Workout | null) => void, onSave: (sid: string, data: any) => void }) {
  const [publishing, setPublishing] = useState(false);

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

  const publishAllWorkouts = async () => {
    setPublishing(true);
    const updatedWorkouts = (student.workouts || []).map(w => ({ ...w, status: 'published' as const }));
    await onSave(student.id, { workouts: updatedWorkouts });
    setPublishing(false);
  };

  const hasDrafts = student.workouts?.some(w => w.status === 'draft' || !w.status);

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar text-left">
      <header className="flex items-center justify-between mb-10 sticky top-0 bg-black/90 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            <HeaderTitle text={student.nome} />
          </h2>
        </div>
        {hasDrafts && (
           <button 
            onClick={publishAllWorkouts} 
            disabled={publishing}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 rounded-full font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all"
           >
             {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 
             Publicar
           </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card className="p-8 cursor-pointer border-l-4 border-l-indigo-600 group hover:bg-zinc-800/50 transition-all" onClick={() => onNavigate('PERIODIZATION')}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xl font-black italic uppercase text-white group-hover:text-indigo-500 transition-colors">Periodização PhD</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Macro & Microciclos PBE</p>
            </div>
            <Brain className="text-indigo-600 group-hover:scale-110 transition-transform" size={32} />
          </div>
        </Card>

        <Card className="p-8 cursor-pointer border-l-4 border-l-red-600 group hover:bg-zinc-800/50 transition-all" onClick={() => { onEditWorkout(null); onNavigate('WORKOUT_EDITOR'); }}>
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
                  className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <feature.icon size={16} className={isDisabled ? "text-zinc-700" : "text-red-600"} />
                    <span className={`text-xs font-black uppercase italic ${isDisabled ? 'text-zinc-600' : 'text-white'}`}>
                      {feature.label}
                    </span>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isDisabled ? 'bg-zinc-800' : 'bg-red-600 shadow-lg shadow-red-600/20'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isDisabled ? 'left-1' : 'left-7'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-12 space-y-4">
         <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] italic pl-2">Planilhas Atuais</h3>
         <div className="space-y-3">
            {(student.workouts || []).map(w => (
              <div key={w.id} className="p-6 rounded-[2rem] border border-white/5 bg-zinc-900/50 flex justify-between items-center group transition-all shadow-lg">
                 <div className="flex items-center gap-4">
                    <span className="font-black uppercase italic text-lg text-white leading-none">{w.title}</span>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase italic ${w.status === 'published' ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-600/20' : 'bg-orange-600/10 text-orange-500 border border-orange-600/20 animate-pulse'}`}>
                      {w.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                 </div>
                 <button onClick={() => { onEditWorkout(w); onNavigate('WORKOUT_EDITOR'); }} className="p-3 rounded-xl bg-zinc-800 text-zinc-500 hover:text-white hover:bg-red-600 transition-all">
                    <Edit3 size={18}/>
                 </button>
              </div>
            ))}
         </div>
      </div>
      <EliteFooter />
    </div>
  );
}

export function WorkoutEditorView({ student, workoutToEdit, onBack, onSave }: { student: Student, workoutToEdit: Workout | null, onBack: () => void, onSave: (sid: string, data: any) => void }) {
  const [title, setTitle] = useState(workoutToEdit?.title || '');
  const [exercises, setExercises] = useState<Exercise[]>(workoutToEdit?.exercises || []);
  const [saveState, setSaveState] = useState<'idle' | 'loading' | 'saved'>('idle');
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [exerciseImage, setExerciseImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  
  const handleSelectExercise = async (name: string) => {
    setSelectedExercise({ name });
    setImageLoading(true);
    const result = await analyzeExerciseAndGenerateImage(name, student);
    if (result) {
      setExerciseImage(result.imageUrl);
      setSelectedExercise((prev: any) => ({ ...prev, ...result }));
    }
    setImageLoading(false);
  };

  const handleAddExercise = () => {
    if (!selectedExercise) return;
    const newEx: Exercise = { 
      id: Date.now().toString(), 
      name: selectedExercise.name, 
      sets: '3', 
      reps: '10', 
      rest: '60s', 
      method: 'Série Estável', 
      thumb: exerciseImage 
    };
    setExercises([...exercises, newEx]);
    setSelectedExercise(null);
    setExerciseImage(null);
  };

  const handleSaveWorkout = async () => {
    setSaveState('loading');
    const newWorkout: Workout = {
      id: workoutToEdit?.id || Date.now().toString(),
      title: title || 'Novo Treino',
      exercises,
      status: 'draft'
    };
    const currentWorkouts = student.workouts || [];
    let updatedWorkouts = workoutToEdit ? currentWorkouts.map(w => w.id === workoutToEdit.id ? newWorkout : w) : [...currentWorkouts, newWorkout];
    try {
      await onSave(student.id, { workouts: updatedWorkouts });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (e) {
      setSaveState('idle');
    }
  };

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar text-left">
      <header className="flex items-center justify-between mb-10 sticky top-0 bg-black/90 backdrop-blur-md z-50 py-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            <HeaderTitle text="Editor PrescreveAI" />
          </h2>
        </div>
        <button 
          onClick={handleSaveWorkout} 
          disabled={saveState === 'loading'}
          className={`px-8 py-3 rounded-full font-black text-[10px] uppercase shadow-xl transition-all flex items-center gap-2 ${saveState === 'loading' ? 'bg-orange-600 animate-pulse' : saveState === 'saved' ? 'bg-emerald-600' : 'bg-red-600'}`}
        >
          {saveState === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
          {saveState === 'loading' ? 'Salvando...' : saveState === 'saved' ? 'Salvo!' : 'Salvar'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-32 mt-6">
        <div className="space-y-6">
          <Card className="p-6 bg-zinc-900/50">
             <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="TÍTULO DO TREINO (Ex: TREINO A)" className="w-full bg-black border border-zinc-800 p-5 rounded-2xl text-white font-black italic text-lg outline-none focus:border-red-600" />
          </Card>
          
          <div className="space-y-3">
             <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-2">Selecione os Exercícios</h3>
             <div className="grid grid-cols-2 gap-2">
                {MUSCLE_GROUPS.map(g => (
                  <button key={g} onClick={() => setSelectedMuscle(g)} className={`p-4 rounded-xl text-[10px] font-black uppercase border transition-all ${selectedMuscle === g ? 'bg-red-600 border-red-600' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'}`}>{g}</button>
                ))}
             </div>
             {selectedMuscle && (
               <div className="grid grid-cols-1 gap-2 mt-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                  {EXERCISE_DATABASE[selectedMuscle].map(ex => (
                    <button key={ex} onClick={() => handleSelectExercise(ex)} className="w-full p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-[10px] font-bold uppercase text-left transition-all">{ex}</button>
                  ))}
               </div>
             )}
          </div>

          {selectedExercise && (
             <Card className="p-6 bg-zinc-900 border-red-600/30 animate-in zoom-in-95">
                <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-4 relative">
                   {imageLoading ? <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-red-600" /></div> : exerciseImage && <img src={exerciseImage} className="w-full h-full object-cover" />}
                </div>
                <h4 className="text-lg font-black italic uppercase text-white mb-4">{selectedExercise.name}</h4>
                <button onClick={handleAddExercise} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase italic text-xs hover:bg-red-600 hover:text-white transition-all">Adicionar ao Treino</button>
             </Card>
          )}
        </div>

        <div className="space-y-4">
           <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-2">Sequência de Execução ({exercises.length})</h3>
           {exercises.map((ex, i) => (
             <div key={i} className="flex items-center gap-4 bg-zinc-900 p-4 rounded-2xl border border-white/5">
                <div className="w-12 h-12 bg-black rounded-xl overflow-hidden shrink-0">
                   {ex.thumb && <img src={ex.thumb} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                   <p className="text-xs font-black uppercase italic text-white leading-tight">{ex.name}</p>
                   <p className="text-[10px] text-zinc-500 font-bold">{ex.sets}x{ex.reps} • {ex.method}</p>
                </div>
                <button onClick={() => setExercises(exercises.filter((_, idx) => idx !== i))} className="text-zinc-700 hover:text-red-600"><Trash2 size={16}/></button>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}

export function PeriodizationView({ student, onBack, onProceedToWorkout }: { student: Student, onBack: () => void, onProceedToWorkout: () => void }) {
  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar text-left">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/90 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
          <HeaderTitle text="Periodização PhD" />
        </h2>
      </header>
      <div className="flex flex-col items-center justify-center py-20 mt-10">
        <Brain className="text-zinc-800 mb-6" size={64} />
        <p className="text-zinc-500 font-black uppercase text-xs italic text-center leading-relaxed">Configuração técnica de macrociclo<br/>em desenvolvimento biomecânico.</p>
        <button onClick={onProceedToWorkout} className="mt-10 px-8 py-4 bg-indigo-600 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all">Configurar Planilhas</button>
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
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar text-left">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/90 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
          <HeaderTitle text="Nova Avaliação" />
        </h2>
      </header>
      <div className="space-y-6 mt-6">
        <Card className="p-6 bg-zinc-900 border-zinc-800 space-y-4">
          <input type="number" placeholder="PESO (KG)" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-black p-4 rounded-xl border border-zinc-800 outline-none focus:border-red-600 font-black italic" />
          <input type="number" placeholder="ALTURA (CM)" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-black p-4 rounded-xl border border-zinc-800 outline-none focus:border-red-600 font-black italic" />
          <input type="number" placeholder="% GORDURA" value={fat} onChange={e => setFat(e.target.value)} className="w-full bg-black p-4 rounded-xl border border-zinc-800 outline-none focus:border-red-600 font-black italic" />
          <button onClick={handleSave} className="w-full py-5 bg-emerald-600 rounded-xl font-black uppercase tracking-widest shadow-lg">Salvar Avaliação</button>
        </Card>
      </div>
    </div>
  );
}
