
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User as UserIcon, Loader2, Dumbbell, 
  Camera, Brain, Ruler, Footprints,
  Info, LogOut, Layout, Bell,
  BarChart3, ChevronRight, Activity
} from 'lucide-react';
import { Logo, BackgroundWrapper, EliteFooter, WeatherWidget, GlobalSyncIndicator, Card, NotificationBadge } from './components/Layout';
import { ProfessorDashboard, StudentManagement, WorkoutEditorView, CoachAssessmentView, PeriodizationView, RunTrackManager } from './components/CoachFlow';
import { WorkoutSessionView, StudentAssessmentView, StudentPeriodizationView, AboutView } from './components/StudentFlow';
import { RunTrackStudentView } from './components/RunTrack';
import { WorkoutFeed } from './components/WorkoutFeed';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { collection, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, db, appId } from './services/firebase';
import { Student, Workout, AppNotification } from './types';

const DEFAULT_STUDENTS: Student[] = [
  { id: 'fixed-liliane', nome: 'Liliane Torres', email: 'lilicatorres@gmail.com', physicalAssessments: [], workoutHistory: [], sexo: 'Feminino', workouts: [], age: 35 },
  { id: 'fixed-andre', nome: 'André Brito', email: 'britodeandrade@gmail.com', physicalAssessments: [], workoutHistory: [], sexo: 'Masculino', workouts: [] }, 
  { id: 'fixed-marcelly', nome: 'Marcelly Bispo', email: 'marcellybispo92@gmail.com', physicalAssessments: [], workoutHistory: [], workouts: [], sexo: 'Feminino' }
];

function LoginScreen({ onLogin, error }: { onLogin: (val: string) => void, error: string }) {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const registeredOptions = [
    { name: "PROFESSOR", value: "PROFESSOR", type: "COACH" }, 
    { name: "Liliane Torres", value: "lilicatorres@gmail.com", type: "ALUNO" },
    { name: "André Brito", value: "britodeandrade@gmail.com", type: "ALUNO" }, 
    { name: "Marcelly Bispo", value: "marcellybispo92@gmail.com", type: "ALUNO" }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center font-sans">
      <div className="animate-in fade-in zoom-in duration-700 text-center"><Logo /></div>
      <div className="w-full max-sm mt-8 space-y-4 animate-in slide-in-from-bottom-10 duration-1000 relative">
        <div className="space-y-1 text-left">
          <label className="text-[10px] font-black text-zinc-500 ml-4 uppercase tracking-widest text-white">Identificação</label>
          <div className="relative" ref={dropdownRef}>
            <input 
              type="text" 
              placeholder="E-MAIL OU 'PROFESSOR'" 
              className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-[2.5rem] text-white outline-none focus:border-red-600 transition-all text-center font-black tracking-tight uppercase placeholder:text-zinc-700" 
              value={input} 
              autoComplete="off" 
              onChange={e => setInput(e.target.value)} 
              onClick={() => setShowDropdown(true)} 
            />
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden">
                {registeredOptions.map((opt, idx) => (
                  <button key={idx} onClick={() => { setInput(opt.value); setShowDropdown(false); }} className="w-full p-4 hover:bg-red-600/10 text-left flex items-center justify-between border-b border-zinc-800/50">
                    <div className="text-left"><p className="text-white text-xs font-black uppercase tracking-tight">{opt.name}</p><p className="text-[9px] text-zinc-500 lowercase">{opt.value}</p></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {error && <p className="text-red-500 text-[10px] font-black uppercase py-2 tracking-widest text-center">{error}</p>}
        <button onClick={() => onLogin(input)} className="w-full bg-red-600 py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-white active:scale-95 transition-all shadow-xl hover:bg-red-700">ENTRAR</button>
      </div>
      <EliteFooter />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('LOGIN');
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    signInAnonymously(auth).finally(() => setLoading(false));
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  // SINCRONIZAÇÃO EM TEMPO REAL: NUVEM -> PERFIL DO ALUNO
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'students'));
    return onSnapshot(q, snapshot => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      setStudents(fetched);
      
      // Se houver um aluno logado, atualiza os dados dele imediatamente se houver mudanças na nuvem
      if (selectedStudent) {
        const updated = fetched.find(s => s.id === selectedStudent.id || s.email.toLowerCase() === selectedStudent.email.toLowerCase());
        if (updated) {
          setSelectedStudent(prev => {
            // Só atualiza se for realmente diferente para evitar loops
            if (JSON.stringify(prev) !== JSON.stringify(updated)) {
              return updated;
            }
            return prev;
          });
        }
      }
    });
  }, [user, selectedStudent?.id, selectedStudent?.email]);

  const allStudentsForCoach = useMemo(() => {
    const merged = [...DEFAULT_STUDENTS];
    students.forEach(fs => {
      if (!fs.email) return;
      const idx = merged.findIndex(m => m.email.toLowerCase() === fs.email.toLowerCase());
      if (idx >= 0) merged[idx] = { ...merged[idx], ...fs };
      else merged.push(fs);
    });
    return merged;
  }, [students]);

  const handleLogin = (val: string) => {
    const clean = val.trim().toLowerCase();
    if (!clean) return;
    
    if (clean === "professor") { 
      setView('PROFESSOR_DASH'); 
      setLoginError('');
      return; 
    }
    
    // Busca na lista de alunos (incluindo os fixos)
    const s = allStudentsForCoach.find(x => 
      x.email.toLowerCase() === clean || 
      x.nome.toLowerCase() === clean
    );

    if (s) { 
      setSelectedStudent(s); 
      setView('DASHBOARD'); 
      setLoginError(''); 
    } else { 
      setLoginError('IDENTIFICAÇÃO NÃO RECONHECIDA'); 
    }
  };

  const handleSaveData = async (sid: string, data: any) => {
    setIsSyncing(true);
    // 1. ATUALIZAÇÃO LOCAL IMEDIATA (OTIMISTA)
    if (selectedStudent?.id === sid) {
      setSelectedStudent(prev => prev ? { ...prev, ...data } : null);
    }
    
    try {
      // 2. ENVIO PARA O FIREBASE (COACH -> NUVEM)
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', sid), { ...data, lastUpdate: Date.now() }, { merge: true });
    } catch (e) {
      console.error("Erro ao salvar:", e);
    } finally {
      setIsSyncing(false); // Libera o spinner de sync
    }
  };

  const isFeatureVisible = (fid: string) => !(selectedStudent?.disabledFeatures || []).includes(fid);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <BackgroundWrapper>
      <GlobalSyncIndicator isSyncing={isSyncing} />
      {view === 'LOGIN' && <LoginScreen onLogin={handleLogin} error={loginError} />}
      {view === 'DASHBOARD' && selectedStudent && (
        <div className="p-6 text-white text-center pt-10 h-screen overflow-y-auto custom-scrollbar flex flex-col items-center">
          <div className="fixed top-6 right-6 z-50 text-right">
             <p className="text-[8px] font-black text-zinc-500 uppercase italic">Atleta Elite</p>
             <p className="text-xs font-black text-white italic uppercase">{selectedStudent.nome}</p>
          </div>
          <div className="mb-10 w-full flex justify-center"><Logo size="text-8xl" /></div>
          <div className="mb-12"><WeatherWidget /></div>
          <div className="w-full space-y-5 pb-20 text-left flex flex-col">
            {isFeatureVisible('FEED') && <Card className="p-6 bg-red-600/10 border-red-600/20 flex justify-between items-center" onClick={() => setView('FEED')}><div><h3 className="text-xs font-black uppercase italic">Feed de Performance</h3><p className="text-[8px] text-zinc-500 font-bold uppercase">Registros e selfie de elite</p></div><ChevronRight size={18}/></Card>}
            {isFeatureVisible('WORKOUTS') && <Card className="p-6 bg-orange-600/10 border-orange-600/20 flex justify-between items-center" onClick={() => setView('WORKOUTS')}><div><h3 className="text-xs font-black uppercase italic">Meus Treinos</h3><p className="text-[8px] text-zinc-500 font-bold uppercase">Sessões de Força & Hipertrofia</p></div><ChevronRight size={18}/></Card>}
            {isFeatureVisible('STUDENT_PERIODIZATION') && <Card className="p-6 bg-indigo-600/10 border-indigo-600/20 flex justify-between items-center" onClick={() => setView('STUDENT_PERIODIZATION')}><div><h3 className="text-xs font-black uppercase italic">Periodização PhD</h3><p className="text-[8px] text-zinc-500 font-bold uppercase">Planejamento Científico</p></div><ChevronRight size={18}/></Card>}
            {isFeatureVisible('STUDENT_ASSESSMENT') && <Card className="p-6 bg-emerald-600/10 border-emerald-600/20 flex justify-between items-center" onClick={() => setView('STUDENT_ASSESSMENT')}><div><h3 className="text-xs font-black uppercase italic">Avaliação Física</h3><p className="text-[8px] text-zinc-500 font-bold uppercase">Composição Corporal</p></div><ChevronRight size={18}/></Card>}
            <button onClick={() => setView('LOGIN')} className="w-full mt-10 py-6 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex items-center justify-center gap-3 text-zinc-600"><LogOut size={18}/><span className="text-[10px] font-black uppercase">Sair</span></button>
          </div>
          <EliteFooter />
        </div>
      )}
      {view === 'FEED' && <WorkoutFeed history={selectedStudent?.workoutHistory || []} onBack={() => setView('DASHBOARD')} />}
      {view === 'WORKOUTS' && <WorkoutSessionView user={selectedStudent!} onBack={() => setView('DASHBOARD')} onSave={handleSaveData} />}
      {view === 'STUDENT_PERIODIZATION' && <StudentPeriodizationView student={selectedStudent!} onBack={() => setView('DASHBOARD')} />}
      {view === 'STUDENT_ASSESSMENT' && <StudentAssessmentView student={selectedStudent!} onBack={() => setView('DASHBOARD')} />}
      {view === 'PROFESSOR_DASH' && <ProfessorDashboard students={allStudentsForCoach} onLogout={() => setView('LOGIN')} onSelect={(s) => { setSelectedStudent(s); setView('STUDENT_MGMT'); }} />}
      {view === 'STUDENT_MGMT' && <StudentManagement student={selectedStudent!} onBack={() => setView('PROFESSOR_DASH')} onNavigate={setView} onEditWorkout={setSelectedWorkout} onSave={handleSaveData} />}
      {view === 'WORKOUT_EDITOR' && <WorkoutEditorView student={selectedStudent!} workoutToEdit={selectedWorkout} onBack={() => setView('STUDENT_MGMT')} onSave={handleSaveData} />}
      {view === 'COACH_ASSESSMENT' && <CoachAssessmentView student={selectedStudent!} onBack={() => setView('STUDENT_MGMT')} onSave={handleSaveData} />}
      {view === 'RUNTRACK_ELITE' && <RunTrackManager student={selectedStudent!} onBack={() => setView('STUDENT_MGMT')} />}
    </BackgroundWrapper>
  );
}
