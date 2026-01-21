
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, LogOut, ChevronRight, Edit3, Plus, 
  Trash2, Loader2, Brain, Activity, Target, TrendingUp, 
  BookOpen, Zap, AlertCircle, Dumbbell,
  Image as ImageIcon, Save, Book, Ruler, Scale, Footprints,
  Users, Info, Sparkles, LayoutGrid, Calendar, Clock, Play, FileText, Folder,
  ChevronDown, Lightbulb, Bell, CalendarClock
} from 'lucide-react';
import { Card, EliteFooter, Logo, HeaderTitle, NotificationBadge, WeatherWidget } from './Layout';
import { Student, Exercise, PhysicalAssessment, Workout, AppNotification } from '../types';
import { analyzeExerciseAndGenerateImage, generatePeriodizationPlan, generateTechnicalCue } from '../services/gemini';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { RunTrackCoachView } from './RunTrack';

export { RunTrackCoachView as RunTrackManager } from './RunTrack';

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

  const addExercise = () => {
    setExercises([...exercises, { id: Date.now().toString(), name: '', sets: '3', reps: '10-12', load: '' }]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleAISync = async (index: number) => {
    const exName = exercises[index].name;
    if (!exName) return;
    
    setLoadingMap(prev => ({ ...prev, [index]: true }));
    try {
      const res = await analyzeExerciseAndGenerateImage(exName);
      if (res) {
        const newExs = [...exercises];
        newExs[index] = { ...newExs[index], description: res.description, thumb: res.imageUrl };
        setExercises(newExs);
      }
    } finally {
      setLoadingMap(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleSave = async () => {
    const startDate = workoutToEdit?.startDate || new Date().toISOString();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (parseInt(projectedSessions) / 3) * 7);

    const workout: Workout = { 
      id: workoutToEdit?.id || Date.now().toString(), 
      title, 
      exercises,
      projectedSessions: parseInt(projectedSessions),
      startDate,
      endDate: endDate.toISOString()
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
        <h2 className="text-xl font-black italic uppercase tracking-tighter"><HeaderTitle text={workoutToEdit ? "Editar Ciclo" : "Novo Ciclo Elite"} /></h2>
      </header>

      <div className="space-y-8 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Identificação (Treino A, B...)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-5 bg-zinc-900 border border-white/5 rounded-[1.5rem] font-black text-white italic text-lg outline-none focus:border-red-600 transition-all shadow-xl" placeholder="EX: TREINO A" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Total de Sessões Projetadas</label>
            <div className="relative">
              <input type="number" value={projectedSessions} onChange={e => setProjectedSessions(e.target.value)} className="w-full p-5 bg-zinc-900 border border-white/5 rounded-[1.5rem] font-black text-red-600 italic text-lg outline-none focus:border-red-600 transition-all shadow-xl" placeholder="12" />
              <CalendarClock size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-700" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[11px] font-black uppercase text-zinc-400 tracking-[0.2em] italic flex items-center gap-2"><Dumbbell size={14} className="text-red-600" /> Montagem Biomecânica</h3>
            <button onClick={addExercise} className="p-3 bg-red-600/10 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-lg flex items-center gap-2 text-[10px] font-black uppercase"><Plus size={16}/> Inserir</button>
          </div>

          <div className="space-y-4">
            {exercises.map((ex, i) => (
              <Card key={i} className="p-6 bg-zinc-900/50 border-zinc-800 space-y-4 relative group shadow-2xl">
                <button onClick={() => removeExercise(i)} className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-black rounded-2xl overflow-hidden shrink-0 border border-white/5 shadow-inner flex items-center justify-center">
                    {ex.thumb ? <img src={ex.thumb} className="w-full h-full object-cover" alt="Ex"/> : <ImageIcon size={24} className="text-zinc-800" />}
                  </div>
                  <div className="flex-1 space-y-3">
                    <input type="text" value={ex.name} onChange={e => {
                      const newExs = [...exercises];
                      newExs[i].name = e.target.value;
                      setExercises(newExs);
                    }} className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs font-black text-white outline-none focus:border-red-600 transition-all uppercase italic" placeholder="NOME DO EXERCÍCIO" />
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[7px] font-black text-zinc-600 uppercase ml-1">Séries</label>
                        <input type="text" value={ex.sets} onChange={e => {
                          const newExs = [...exercises];
                          newExs[i].sets = e.target.value;
                          setExercises(newExs);
                        }} className="w-full bg-black border border-white/5 p-2.5 rounded-lg text-[10px] text-center font-black" placeholder="3" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[7px] font-black text-zinc-600 uppercase ml-1">Reps</label>
                        <input type="text" value={ex.reps} onChange={e => {
                          const newExs = [...exercises];
                          newExs[i].reps = e.target.value;
                          setExercises(newExs);
                        }} className="w-full bg-black border border-white/5 p-2.5 rounded-lg text-[10px] text-center font-black" placeholder="12" />
                      </div>
                      <div className="pt-4 flex items-end">
                        <button 
                          onClick={() => handleAISync(i)} 
                          className="w-full h-[38px] bg-red-600/10 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-inner group/btn"
                        >
                          {loadingMap[i] ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="group-hover/btn:scale-110 transition-transform" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="w-full py-6 bg-red-600 hover:bg-red-700 rounded-[2.5rem] font-black uppercase text-sm italic flex items-center justify-center gap-3 shadow-2xl shadow-red-900/30 active:scale-95 transition-all">
          <Save size={20}/> Salvar Ciclo e Notificar Aluno
        </button>
      </div>
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
