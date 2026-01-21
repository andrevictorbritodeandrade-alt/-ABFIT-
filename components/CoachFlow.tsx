
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, LogOut, ChevronRight, Edit3, Plus, 
  Trash2, Loader2, Brain, Activity, Target, TrendingUp, 
  BookOpen, Zap, AlertCircle, Dumbbell,
  Image as ImageIcon, Save, Book, Ruler, Scale, Footprints,
  Users, Info, Sparkles, LayoutGrid, Calendar, Clock, Play, FileText, Folder,
  ChevronDown, Lightbulb, Bell, CalendarClock, Search, Check, Layers
} from 'lucide-react';
import { Card, EliteFooter, Logo, HeaderTitle, NotificationBadge, WeatherWidget } from './Layout';
import { Student, Exercise, PhysicalAssessment, Workout, AppNotification } from '../types';
import { analyzeExerciseAndGenerateImage, generatePeriodizationPlan, generateTechnicalCue } from '../services/gemini';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { RunTrackCoachView } from './RunTrack';

export { RunTrackCoachView as RunTrackManager } from './RunTrack';

const EXERCISE_LIBRARY: Record<string, string[]> = {
  "Peitorais": ["Supino Reto (HBL)", "Supino Inclinado (HBC)", "Crucifixo Reto", "Crossover Polia Alta", "Peck Deck", "Flexão de Braços", "Supino Declinado", "Pull Over"],
  "Dorsais": ["Puxada Aberta Pulley", "Remada Curvada (HBL)", "Remada Unilateral (HBC)", "Remada Baixa Triângulo", "Pulldown Corda", "Barra Fixa", "Levantamento Terra"],
  "Membros Inferiores": ["Agachamento Livre", "Leg Press 45", "Extensora", "Flexora Deitada", "Stiff (HBL)", "Afundo/Passada", "Elevação Pélvica", "Cadeira Abdutora", "Cadeira Adutora", "Panturrilha em Pé"],
  "Deltoides": ["Desenvolvimento (HBC)", "Elevação Lateral", "Elevação Frontal", "Crucifixo Inverso", "Remada Alta", "Encolhimento"],
  "Bíceps": ["Rosca Direta (HBL)", "Rosca Alternada (HBC)", "Rosca Martelo", "Rosca Concentrada", "Rosca Scott"],
  "Tríceps": ["Tríceps Pulley", "Tríceps Corda", "Tríceps Testa (HBL)", "Tríceps Francês", "Mergulho Paralelas"],
  "Core": ["Abdominal Supra", "Plancha Isométrica", "Abdominal Infra", "Oblíquos", "Roda Abdominal"]
};

const EXECUTION_METHODS = ["Simples", "Conjugada", "Drop Set", "Pirâmide", "Rest-Pause", "SST"];

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
          <button onClick={onLogout} className="p-3 bg-zinc-900 border border-white/5 rounded-full text-zinc-500 hover:text-red-600 transition-colors">
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
           {renewalNotifications.length > 0 && (
             <span className="text-[10px] font-black text-red-600 animate-pulse uppercase bg-red-600/10 px-3 py-1 rounded-full border border-red-600/20">
               {renewalNotifications.length} Alertas
             </span>
           )}
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

export function StudentManagement({ student, onBack, onNavigate, onEditWorkout }: { student: Student, onBack: () => void, onNavigate: (v: string) => void, onEditWorkout: (w: Workout) => void }) {
  const needsRenewal = useMemo(() => {
    const history = student.workoutHistory || [];
    return student.workouts?.some(w => w.projectedSessions && (w.projectedSessions - history.filter(h => h.workoutId === w.id).length) <= 2);
  }, [student]);

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter">
          <HeaderTitle text={student.nome} />
        </h2>
      </header>

      {needsRenewal && (
        <div className="mb-6 animate-in slide-in-from-top-2">
          <div className="bg-red-600/10 border border-red-600/30 p-4 rounded-3xl flex items-center gap-4">
            <div className="p-2 bg-red-600 rounded-xl"><AlertCircle className="text-white" size={20} /></div>
            <div>
              <p className="text-xs font-black text-white uppercase italic">Ciclo em Expiração</p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase">Este atleta precisa de uma nova prescrição nos próximos 2 treinos.</p>
            </div>
          </div>
        </div>
      )}

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
              <h4 className="text-xl font-black italic uppercase text-white group-hover:text-red-600 transition-colors">Montar Treinos</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Prescrição de Força Elite</p>
            </div>
            <Dumbbell className="text-red-600 group-hover:scale-110 transition-transform" size={32} />
          </div>
        </Card>

        <Card className="p-8 cursor-pointer border-l-4 border-l-emerald-600 group hover:bg-zinc-800/50 transition-all" onClick={() => onNavigate('COACH_ASSESSMENT')}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xl font-black italic uppercase text-white group-hover:text-emerald-500 transition-colors">Avaliação Física</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Composição & Biometria</p>
            </div>
            <Ruler className="text-emerald-600 group-hover:scale-110 transition-transform" size={32} />
          </div>
        </Card>

        <Card className="p-8 cursor-pointer border-l-4 border-l-orange-600 group hover:bg-zinc-800/50 transition-all" onClick={() => onNavigate('RUNTRACK_ELITE')}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xl font-black italic uppercase text-white group-hover:text-orange-500 transition-colors">RunTrack Elite</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Prescrição de Corrida PhD</p>
            </div>
            <Footprints className="text-orange-600 group-hover:scale-110 transition-transform" size={32} />
          </div>
        </Card>
      </div>

      <div className="mt-12 space-y-4">
         <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] italic">Planilhas Prescritas</h3>
            <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest">{student.workouts?.length || 0} Ativas</span>
         </div>
         <div className="space-y-3">
            {student.workouts?.map(w => {
              const completedCount = (student.workoutHistory || []).filter(h => h.workoutId === w.id).length;
              const isEnding = w.projectedSessions && (w.projectedSessions - completedCount) <= 2;
              return (
                <div key={w.id} className={`p-6 rounded-[2rem] border flex justify-between items-center group transition-all shadow-lg ${isEnding ? 'bg-red-600/10 border-red-600/30' : 'bg-zinc-900/50 border-white/5 hover:border-red-600/30'}`}>
                   <div>
                      <span className="font-black uppercase italic text-lg text-white leading-none">{w.title}</span>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-[9px] text-zinc-500 font-bold uppercase">{w.exercises.length} Exercícios</p>
                        {w.projectedSessions && (
                          <p className={`text-[9px] font-black uppercase ${isEnding ? 'text-red-500' : 'text-zinc-500'}`}>
                            {completedCount}/{w.projectedSessions} SESSÕES
                          </p>
                        )}
                      </div>
                   </div>
                   <button onClick={() => { onEditWorkout(w); onNavigate('WORKOUT_EDITOR'); }} className={`p-3 rounded-xl transition-all shadow-inner ${isEnding ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-white hover:bg-red-600'}`}>
                      <Edit3 size={18}/>
                   </button>
                </div>
              );
            })}
            {(!student.workouts || student.workouts.length === 0) && (
              <div className="p-10 text-center border-2 border-dashed border-zinc-800 rounded-[2.5rem] bg-zinc-950/20">
                <p className="text-zinc-600 italic text-[10px] uppercase font-black tracking-widest">Nenhuma planilha vinculada.</p>
              </div>
            )}
         </div>
      </div>
      <EliteFooter />
    </div>
  );
}

export function WorkoutEditorView({ student, workoutToEdit, onBack, onSave }: { student: Student, workoutToEdit: Workout | null, onBack: () => void, onSave: (id: string, data: any) => void }) {
  const [title, setTitle] = useState(workoutToEdit?.title || '');
  const [exercises, setExercises] = useState<Exercise[]>(workoutToEdit?.exercises || []);
  const [projectedSessions, setProjectedSessions] = useState(workoutToEdit?.projectedSessions?.toString() || '12');
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  
  // Library State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);

  const addExerciseFromLibrary = async (name: string) => {
    const newEx: Exercise = { 
      id: Date.now().toString(), 
      name, 
      sets: '3', 
      reps: '10-12', 
      rest: '60s',
      executionType: 'Simples' 
    };
    const newIdx = exercises.length;
    setExercises([...exercises, newEx]);
    setIsLibraryOpen(false);
    
    // Auto-sync AI image for the selected exercise
    setLoadingMap(prev => ({ ...prev, [newIdx]: true }));
    try {
      const res = await analyzeExerciseAndGenerateImage(name);
      if (res) {
        setExercises(current => current.map((ex, i) => i === newIdx ? { ...ex, description: res.description, thumb: res.imageUrl } : ex));
      }
    } finally {
      setLoadingMap(prev => ({ ...prev, [newIdx]: false }));
    }
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    setExercises(exercises.map((ex, i) => i === index ? { ...ex, [field]: value } : ex));
  };

  const handleSave = async () => {
    const workout: Workout = { 
      id: workoutToEdit?.id || Date.now().toString(), 
      title, 
      exercises,
      projectedSessions: parseInt(projectedSessions),
      startDate: workoutToEdit?.startDate || new Date().toISOString()
    };

    const updatedWorkouts = workoutToEdit 
      ? (student.workouts || []).map(w => w.id === workout.id ? workout : w)
      : [...(student.workouts || []), workout];
    
    await onSave(student.id, { workouts: updatedWorkouts });
    onBack();
  };

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-40 -mx-6 px-6 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter"><HeaderTitle text={workoutToEdit ? "Editar Ciclo" : "PrescreveAI Elite"} /></h2>
      </header>

      {isLibraryOpen ? (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-black uppercase text-red-600 italic tracking-tighter">Biblioteca PrescreveAI</h3>
              <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Selecione para prescrever</p>
            </div>
            <button onClick={() => setIsLibraryOpen(false)} className="text-zinc-500 p-2 bg-zinc-900 rounded-full"><ArrowLeft size={20}/></button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(EXERCISE_LIBRARY).map(group => (
              <button 
                key={group} 
                onClick={() => setSelectedMuscleGroup(selectedMuscleGroup === group ? null : group)}
                className={`p-5 rounded-[1.5rem] border font-black uppercase text-[10px] text-center transition-all flex flex-col items-center gap-2 shadow-lg ${selectedMuscleGroup === group ? 'bg-red-600 border-red-600 text-white' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:border-red-600/30'}`}
              >
                <Layers size={18} />
                {group}
              </button>
            ))}
          </div>

          {selectedMuscleGroup && (
            <div className="space-y-3 mt-8 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-2 ml-2">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Exercícios para {selectedMuscleGroup}</h4>
              </div>
              {EXERCISE_LIBRARY[selectedMuscleGroup].map(ex => (
                <button 
                  key={ex} 
                  onClick={() => addExerciseFromLibrary(ex)}
                  className="w-full p-5 bg-zinc-900/50 border border-white/5 rounded-[2rem] text-left flex justify-between items-center group hover:border-red-600 hover:bg-red-600/5 transition-all shadow-xl"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-black uppercase italic text-white group-hover:text-red-500">{ex}</span>
                    <span className="text-[8px] font-black text-zinc-600 uppercase mt-0.5">Biomecânica Prescritiva</span>
                  </div>
                  <Plus size={18} className="text-red-600 group-hover:scale-125 transition-transform" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 pb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Identificação do Treino</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-5 bg-zinc-900 border border-white/5 rounded-[1.5rem] font-black text-white italic text-lg outline-none focus:border-red-600 transition-all shadow-xl" placeholder="EX: TREINO A" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Volume do Ciclo (Sessões)</label>
              <input type="number" value={projectedSessions} onChange={e => setProjectedSessions(e.target.value)} className="w-full p-5 bg-zinc-900 border border-white/5 rounded-[1.5rem] font-black text-red-600 italic text-lg outline-none focus:border-red-600 transition-all shadow-xl" placeholder="12" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-[11px] font-black uppercase text-zinc-400 tracking-[0.2em] italic flex items-center gap-2"><Dumbbell size={14} className="text-red-600" /> Montagem da Planilha</h3>
              <button onClick={() => setIsLibraryOpen(true)} className="p-3.5 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><Plus size={18}/> Buscar Exercício</button>
            </div>

            <div className="space-y-6">
              {exercises.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-zinc-800 rounded-[3rem] bg-zinc-950/20 flex flex-col items-center gap-4">
                  <Book size={32} className="text-zinc-800" />
                  <p className="text-zinc-600 italic text-[10px] uppercase font-black tracking-widest leading-relaxed">Nenhum exercício selecionado.<br/>Use o botão acima para abrir a biblioteca.</p>
                </div>
              ) : (
                exercises.map((ex, i) => (
                  <Card key={i} className="p-6 bg-zinc-900/50 border-zinc-800 space-y-6 relative group shadow-2xl overflow-visible">
                    <button onClick={() => removeExercise(i)} className="absolute top-4 right-4 p-2.5 bg-black/40 text-zinc-600 hover:text-red-600 rounded-full transition-colors border border-white/5"><Trash2 size={16}/></button>
                    
                    <div className="flex gap-5">
                      <div className="w-28 h-28 bg-black rounded-[2rem] overflow-hidden shrink-0 border border-white/5 shadow-inner flex items-center justify-center relative group/img">
                        {ex.thumb ? <img src={ex.thumb} className="w-full h-full object-cover" alt="Ex"/> : <ImageIcon size={32} className="text-zinc-800" />}
                        {loadingMap[i] && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 size={18} className="animate-spin text-red-600" /></div>}
                        <div className="absolute inset-0 bg-red-600/0 group-hover/img:bg-red-600/10 transition-colors pointer-events-none"></div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col">
                          <h4 className="text-sm font-black text-white uppercase italic tracking-tighter leading-none">{ex.name}</h4>
                          <span className="text-[8px] font-black text-zinc-600 uppercase mt-1">PrescreveAI Elite • PhD</span>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 flex items-center gap-1"><Zap size={10} className="text-red-600"/> Metodologia de Execução</label>
                          <select 
                            value={ex.executionType} 
                            onChange={e => updateExercise(i, 'executionType', e.target.value)}
                            className="w-full bg-black border border-white/10 p-4 rounded-xl text-[10px] font-black text-red-500 uppercase italic outline-none focus:border-red-600 transition-all shadow-inner"
                          >
                            {EXECUTION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-600 uppercase ml-1">Séries</label>
                        <input type="text" value={ex.sets} onChange={e => updateExercise(i, 'sets', e.target.value)} className="w-full bg-black border border-white/5 p-4 rounded-xl text-xs text-center font-black text-white" placeholder="3" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-600 uppercase ml-1">Reps</label>
                        <input type="text" value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} className="w-full bg-black border border-white/5 p-4 rounded-xl text-xs text-center font-black text-white" placeholder="12" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-600 uppercase ml-1">Descanso</label>
                        <input type="text" value={ex.rest} onChange={e => updateExercise(i, 'rest', e.target.value)} className="w-full bg-black border border-white/5 p-4 rounded-xl text-xs text-center font-black text-white" placeholder="60s" />
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <button onClick={handleSave} className="w-full py-7 bg-red-600 hover:bg-red-700 rounded-[2.5rem] font-black uppercase text-sm italic flex items-center justify-center gap-4 shadow-2xl shadow-red-900/40 active:scale-95 transition-all mt-10">
            <Save size={24}/> Liberar Planilha PrescreveAI
          </button>
        </div>
      )}
      <EliteFooter />
    </div>
  );
}

export function CoachAssessmentView({ student, onBack, onSave }: { student: Student, onBack: () => void, onSave: (id: string, data: any) => void }) {
  const [peso, setPeso] = useState(student.weight?.toString() || '');
  const [gordura, setGordura] = useState('');
  const [altura, setAltura] = useState(student.height?.toString() || '');

  const handleSave = async () => {
    const assessment: PhysicalAssessment = { 
      id: Date.now().toString(), 
      data: new Date().toISOString(), 
      peso: parseFloat(peso), 
      altura: parseFloat(altura),
      bio_percentual_gordura: parseFloat(gordura) 
    };
    const updated = [...(student.physicalAssessments || []), assessment];
    await onSave(student.id, { physicalAssessments: updated, weight: peso, height: altura });
    onBack();
  };

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter"><HeaderTitle text="Nova Avaliação" /></h2>
      </header>
      
      <Card className="p-8 bg-zinc-900/80 border-l-4 border-l-emerald-600 space-y-8 shadow-2xl">
        <div className="flex items-center gap-4">
           <Scale className="text-emerald-500" size={32} />
           <div>
             <h3 className="text-xl font-black italic uppercase text-white">Protocolo Bio</h3>
             <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Dados Antropométricos</p>
           </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Peso Corporal (kg)</label>
            <input type="number" value={peso} onChange={e => setPeso(e.target.value)} className="w-full p-5 bg-black border border-white/10 rounded-[1.5rem] font-black text-white outline-none focus:border-emerald-500 transition-all text-center text-lg" placeholder="00.0" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Altura (cm)</label>
            <input type="number" value={altura} onChange={e => setAltura(e.target.value)} className="w-full p-5 bg-black border border-white/10 rounded-[1.5rem] font-black text-white outline-none focus:border-emerald-500 transition-all text-center text-lg" placeholder="000" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">% Gordura Estimado</label>
            <input type="number" value={gordura} onChange={e => setGordura(e.target.value)} className="w-full p-5 bg-black border border-white/10 rounded-[1.5rem] font-black text-white outline-none focus:border-emerald-500 transition-all text-center text-lg" placeholder="0.0" />
          </div>
          <button onClick={handleSave} className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 rounded-[2.5rem] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 active:scale-95 transition-all">
            <Save size={18}/> Salvar Avaliação PhD
          </button>
        </div>
      </Card>
      <EliteFooter />
    </div>
  );
}

export function PeriodizationView({ student, onBack, onProceedToWorkout }: { student: Student, onBack: () => void, onProceedToWorkout: () => void }) {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: student.nome,
    level: 'intermediario',
    goal: 'Hipertrofia',
    phase: 'base',
    model: 'ondulatorio',
    daysPerWeek: '4',
    concurrent: true
  });
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setStep('loading');
    setError(null);
    try {
      const plan = await generatePeriodizationPlan(formData);
      if (plan) {
        setResult(plan);
        setStep('result');
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id);
        await setDoc(docRef, { periodization: { ...plan, startDate: new Date().toISOString() } }, { merge: true });
      } else {
        throw new Error("IA returned null");
      }
    } catch (e) {
      setError("Falha na geração científica. Tente novamente.");
      setStep('form');
    }
  };

  return (
    <div className="p-6 h-screen overflow-y-auto pb-48 text-white bg-black text-left custom-scrollbar">
      <header className="flex items-center gap-4 mb-10">
         <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full"><ArrowLeft size={20}/></button>
         <h2 className="text-xl font-black italic uppercase tracking-tighter">
          <HeaderTitle text="Ciência Força" />
         </h2>
      </header>

      {step === 'form' && (
        <Card className="p-8 bg-zinc-900 border-l-4 border-l-red-600">
           <div className="flex items-center gap-4 mb-8">
              <Brain className="text-red-600" size={32} />
              <div><h3 className="text-2xl font-black italic uppercase tracking-tight">Anamnese Avançada</h3><p className="text-[10px] text-zinc-500 font-bold uppercase">Protocolo PBE • Elite Performance</p></div>
           </div>
           <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nível Biológico</label>
                <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} className="w-full p-4 bg-black border border-white/10 rounded-2xl text-sm font-bold outline-none focus:border-red-600">
                   <option value="iniciante">Adaptação Neural</option>
                   <option value="intermediario">Retomada (Sem ritmo)</option>
                   <option value="avancado">Atleta de Performance</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Dias/Semana</label>
                    <input type="number" value={formData.daysPerWeek} onChange={e => setFormData({...formData, daysPerWeek: e.target.value})} className="w-full p-4 bg-black border border-white/10 rounded-2xl font-bold" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Objetivo</label>
                    <select value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} className="w-full p-4 bg-black border border-white/10 rounded-2xl font-bold">
                       <option value="Hipertrofia">Hipertrofia</option>
                       <option value="Emagrecimento">Emagrecimento</option>
                       <option value="Força Pura">Força Pura</option>
                    </select>
                 </div>
              </div>
              <button onClick={handleGenerate} className="w-full mt-6 bg-red-600 hover:bg-red-700 py-6 rounded-[2.5rem] font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl">
                <Brain size={16}/> Gerar Planilha de Carga
              </button>
           </div>
        </Card>
      )}

      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in duration-300 text-center">
           <div className="relative">
             <div className="w-24 h-24 border-4 border-red-600/20 rounded-full animate-ping absolute inset-0"></div>
             <Loader2 className="w-24 h-24 animate-spin text-red-600 relative z-10" />
           </div>
           <div className="space-y-2">
             <p className="text-xl font-black uppercase tracking-widest italic text-white">Analisando Biomecânica</p>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 animate-pulse">Integrando Metodologia PhD...</p>
           </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl">
              <p className="text-[9px] font-black uppercase text-red-600 mb-2 tracking-[0.2em]">{result.modelo_teorico}</p>
              <h1 className="text-2xl font-black italic uppercase text-white mb-2 leading-none">{result.titulo}</h1>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed italic opacity-80">{result.objetivo_longo_prazo}</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {result.microciclos?.map((m: any, i: number) => (
                <Card key={i} className="p-6 bg-zinc-900 border-zinc-800">
                   <h4 className="text-[11px] font-black text-white uppercase mb-4 leading-tight">SEMANA {m.semana}:<br/><span className="text-red-600">{m.tipo}</span></h4>
                   <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                      <div className="flex justify-between items-center"><span className="text-[9px] text-zinc-500 font-bold uppercase">RPE:</span><span className="text-[10px] font-black text-white">{m.pse_alvo}</span></div>
                      <div className="flex justify-between items-center"><span className="text-[10px] font-black text-white">{m.faixa_repeticoes}</span></div>
                   </div>
                </Card>
              ))}
           </div>
           <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] relative overflow-hidden">
              <h3 className="text-amber-500 font-black uppercase text-xs mb-4 flex items-center gap-3">
                 <BookOpen size={16} /> NOTAS PHD
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium italic opacity-80">{result.notas_phd}</p>
           </div>
           <button onClick={onProceedToWorkout} className="w-full py-6 bg-red-600 rounded-[2.5rem] font-black uppercase text-[11px] text-white shadow-2xl shadow-red-600/30 hover:bg-red-700 transition-all active:scale-95">MONTAR EXERCÍCIOS</button>
        </div>
      )}
      <EliteFooter />
    </div>
  );
}
