
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User as UserIcon, Loader2, Dumbbell, 
  Camera, Brain, Ruler, Footprints, TrendingUp,
  Info, History as HistoryIcon, LogOut, Layout, Bell, AlertCircle
} from 'lucide-react';
import { Logo, BackgroundWrapper, EliteFooter, WeatherWidget, GlobalSyncIndicator, Card, NotificationBadge } from './components/Layout';
import { ProfessorDashboard, StudentManagement, WorkoutEditorView, CoachAssessmentView, PeriodizationView, RunTrackManager } from './components/CoachFlow';
import { WorkoutSessionView, StudentAssessmentView, StudentPeriodizationView, AboutView } from './components/StudentFlow';
import { RunTrackStudentView } from './components/RunTrack';
import { WorkoutFeed } from './components/WorkoutFeed';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { InstallPrompt } from './components/InstallPrompt';
import { collection, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, db, appId } from './services/firebase';
import { Student, Workout, AppNotification } from './types';

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
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { 
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center font-sans">
      <div className="animate-in fade-in zoom-in duration-700 text-center"><Logo /></div>

      <div className="w-full max-sm mt-8 space-y-4 animate-in slide-in-from-bottom-10 duration-1000 relative">
        <div className="space-y-1 text-left">
          <label className="text-[10px] font-black text-zinc-500 ml-4 uppercase tracking-widest text-white">Identificação</label>
          <div className="relative" ref={dropdownRef}>
            <input type="text" placeholder="E-MAIL OU 'PROFESSOR'" className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-[2.5rem] text-white outline-none focus:border-red-600 transition-all text-center font-black tracking-tight uppercase placeholder:text-zinc-700" value={input} autoComplete="off" onChange={e => setInput(e.target.value)} onClick={() => setShowDropdown(true)} onFocus={() => setShowDropdown(true)} />
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3 border-b border-zinc-800 bg-black/40 text-center"><p className="text-[8px] font-black text-zinc-500 uppercase text-center tracking-[0.2em]">Selecione um perfil</p></div>
                {registeredOptions.map((opt, idx) => (
                  <button key={`opt-${idx}`} onClick={() => { setInput(opt.value); setShowDropdown(false); }} className="w-full p-4 hover:bg-red-600/10 text-left flex items-center justify-between border-b border-zinc-800/50 transition-colors group">
                    <div className="text-left"><p className="text-white text-xs font-black uppercase tracking-tight text-left">{opt.name}</p><p className="text-[9px] text-zinc-500 lowercase text-left">{opt.value}</p></div>
                    <span className={`text-[8px] font-black px-2 py-1 rounded-full ${opt.type === 'COACH' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{opt.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {error && <p className="text-red-500 text-[10px] font-black uppercase py-2 tracking-widest text-center">{error}</p>}
        <button onClick={() => onLogin(input)} className="w-full bg-red-600 py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-white active:scale-95 transition-all shadow-xl shadow-red-900/20 hover:bg-red-700">ENTRAR</button>
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initAuth = async () => { 
        try { await signInAnonymously(auth); } catch (err: any) { setLoading(false); } 
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => { 
        if (u) { setUser(u); setLoading(false); }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    try {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'students'));
        const unsub = onSnapshot(q, (snapshot) => { 
            const updatedStudents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
            setStudents(updatedStudents); 
            if (selectedStudent) {
              const current = updatedStudents.find(s => s.id === selectedStudent.id);
              if (current) setSelectedStudent(current);
            }
        });
        return () => unsub();
    } catch (e) { console.error(e); }
  }, [user, selectedStudent?.id]);

  // Lógica de Notificações Baseada em Performance
  const studentNotifications = useMemo(() => {
    if (!selectedStudent) return [];
    const notifications: AppNotification[] = [];
    const history = selectedStudent.workoutHistory || [];
    
    selectedStudent.workouts?.forEach(w => {
      if (w.projectedSessions) {
        const completed = history.filter(h => h.workoutId === w.id).length;
        const remaining = w.projectedSessions - completed;
        
        if (remaining <= 2 && remaining >= 0) {
          notifications.push({
            id: `renew-${w.id}`,
            title: 'Renovação Necessária',
            message: `Atenção: Faltam apenas ${remaining} treinos para o fim da sua planilha "${w.title}"! Entre em contato com o André Brito para atualizar seu plano.`,
            date: new Date().toLocaleDateString('pt-BR'),
            read: false,
            type: 'RENEWAL'
          });
        }
      }
    });

    return notifications;
  }, [selectedStudent]);

  const allStudentsForCoach = useMemo(() => {
    const defaultStudents: Student[] = [
        { id: 'fixed-liliane', nome: 'Liliane Torres', email: 'lilicatorres@gmail.com', physicalAssessments: [], workoutHistory: [], sexo: 'Feminino', workouts: [], age: 35 },
        { id: 'fixed-andre', nome: 'André Brito', email: 'britodeandrade@gmail.com', physicalAssessments: [], workoutHistory: [], sexo: 'Masculino', workouts: [] }, 
        { id: 'fixed-marcelly', nome: 'Marcelly Bispo', email: 'marcellybispo92@gmail.com', physicalAssessments: [], workoutHistory: [], workouts: [], sexo: 'Feminino' }
    ];
    const merged = [...students];
    defaultStudents.forEach(def => { 
        if (!merged.find(s => s.id === def.id || (s.email && s.email === def.email))) merged.push(def); 
    });
    return merged;
  }, [students]);

  const handleLogin = (val: string) => {
    setLoginError('');
    if (!val) return;
    const cleanVal = val.trim().toLowerCase();
    if (cleanVal === "professor") { setView('PROFESSOR_DASH'); return; }
    const student = allStudentsForCoach.find(s => (s.email || "").trim().toLowerCase() === cleanVal);
    if (student) { setSelectedStudent(student); setView('DASHBOARD'); } 
    else { setLoginError('IDENTIFICAÇÃO NÃO RECONHECIDA'); }
  };

  const handleSaveData = async (sid: string, data: any) => {
    setIsSyncing(true);
    try { 
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', sid);
      await setDoc(docRef, { ...data, lastUpdateTimestamp: Date.now() }, { merge: true });
    } catch (e: any) { 
      console.error("Erro ao salvar dados:", e.message); 
    } finally {
      setTimeout(() => setIsSyncing(false), 300);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudent) return;
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      await handleSaveData(selectedStudent.id, { photoUrl: base64String });
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <BackgroundWrapper>
      <GlobalSyncIndicator isSyncing={isSyncing} />
      <InstallPrompt />
      {view === 'LOGIN' && <LoginScreen onLogin={handleLogin} error={loginError} />}
      
      {view === 'DASHBOARD' && selectedStudent && (
        <div className="p-6 text-white text-center pt-10 h-screen overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start mb-8 text-white">
             <div className="flex gap-4">
               <div className="relative group/photo cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-900 border-2 border-red-600 overflow-hidden shadow-2xl relative">
                    {selectedStudent?.photoUrl ? (
                      <img src={selectedStudent.photoUrl} className="w-full h-full object-cover" alt="Perfil"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800"><UserIcon className="text-zinc-600" /></div>
                    )}
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 size={16} className="animate-spin text-red-600" />
                      </div>
                    )}
                 </div>
                 <div className="absolute -bottom-1 -right-1 bg-red-600 p-1.5 rounded-full border-2 border-black shadow-lg">
                    <Camera size={10} className="text-white" />
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
               </div>
               
               <NotificationBadge notifications={studentNotifications} onClick={() => setShowNotifications(!showNotifications)} />
             </div>

             <div className="flex items-center gap-4">
                <WeatherWidget />
                <button onClick={() => { setUser(null); setView('LOGIN'); }} className="p-3 bg-zinc-900 border border-white/5 rounded-full text-zinc-500 hover:text-red-600 transition-colors">
                  <LogOut size={16} />
                </button>
             </div>
          </div>

          {showNotifications && (
            <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
              <Card className="p-6 bg-red-600/5 border-red-600/20">
                <div className="flex items-center gap-2 mb-4 text-red-600">
                  <Bell size={16} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Avisos Importantes</h4>
                </div>
                {studentNotifications.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 font-bold uppercase italic">Sem notificações no momento.</p>
                ) : (
                  <div className="space-y-4">
                    {studentNotifications.map(n => (
                      <div key={n.id} className="text-left bg-black/40 p-4 rounded-2xl border border-white/5">
                        <p className="text-xs font-black text-white italic mb-1 uppercase tracking-tight">{n.title}</p>
                        <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          <div className="mb-10 text-center"><Logo size="text-6xl" subSize="text-[9px]" /></div>
          
          <div className="mt-12 space-y-4 pb-20 text-left flex flex-col">
            <Card className="p-6 bg-red-600/10 border-red-600/20 group cursor-pointer" onClick={() => setView('FEED')}>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-600 rounded-xl shadow-lg shadow-red-600/40">
                      <Layout className="text-white" size={20} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-xs font-black uppercase text-white italic tracking-widest">Feed de Performance</h3>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase">Veja seus registros e selfie de elite</p>
                    </div>
                  </div>
                  <TrendingUp className="text-red-600 group-hover:scale-125 transition-transform" />
               </div>
            </Card>

            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => setView('STUDENT_PERIODIZATION')} className="w-full bg-zinc-900 p-7 rounded-[3rem] border border-zinc-800 flex items-center justify-between group hover:border-indigo-600/30 transition-all shadow-xl active:scale-95">
                  <div className="flex flex-col items-start"><span className="font-black italic uppercase text-lg group-hover:text-indigo-500 transition-colors">Periodização PhD</span><p className="text-[8px] text-zinc-500 font-bold uppercase">Macrociclo & Planejamento</p></div>
                  <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-600 transition-colors"><Brain className="text-indigo-500 group-hover:text-white" /></div>
              </button>
              <button onClick={() => setView('WORKOUTS')} className="w-full bg-zinc-900 p-7 rounded-[3rem] border border-zinc-800 flex items-center justify-between group hover:border-red-600/30 transition-all shadow-xl active:scale-95">
                  <div className="flex flex-col items-start"><span className="font-black italic uppercase text-lg group-hover:text-red-600 transition-colors">Meus Treinos</span><p className="text-[8px] text-zinc-500 font-bold uppercase">Sessões de Força & Hipertrofia</p></div>
                  <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-500/20 group-hover:bg-red-600 transition-colors"><Dumbbell className="text-red-600 group-hover:text-white" /></div>
              </button>
              <button onClick={() => setView('STUDENT_ASSESSMENT')} className="w-full bg-zinc-900 p-7 rounded-[3rem] border border-zinc-800 flex items-center justify-between group hover:border-emerald-600/30 transition-all shadow-xl active:scale-95">
                  <div className="flex flex-col items-start"><span className="font-black italic uppercase text-lg group-hover:text-emerald-500 transition-colors">Avaliação Física</span><p className="text-[8px] text-zinc-500 font-bold uppercase">Composição Corporal & Medidas</p></div>
                  <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-600 transition-colors"><Ruler className="text-emerald-500 group-hover:text-white" /></div>
              </button>
              <button onClick={() => setView('RUNTRACK_STUDENT')} className="w-full bg-zinc-900 p-7 rounded-[3rem] border border-zinc-800 flex items-center justify-between group hover:border-orange-600/30 transition-all shadow-xl active:scale-95">
                  <div className="flex flex-col items-start"><span className="font-black italic uppercase text-lg group-hover:text-orange-500 transition-colors">RunTrack Elite</span><p className="text-[8px] text-zinc-500 font-bold uppercase">Monitoramento de Corrida & Cardio</p></div>
                  <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-600 transition-colors"><Footprints className="text-orange-500 group-hover:text-white" /></div>
              </button>
            </div>
          </div>
          <EliteFooter />
        </div>
      )}

      {view === 'FEED' && selectedStudent && <WorkoutFeed history={selectedStudent.workoutHistory || []} onBack={() => setView('DASHBOARD')} />}
      {view === 'STUDENT_PERIODIZATION' && selectedStudent && <StudentPeriodizationView student={selectedStudent} onBack={() => setView('DASHBOARD')} />}
      {view === 'WORKOUTS' && selectedStudent && <WorkoutSessionView user={selectedStudent} onBack={() => setView('DASHBOARD')} onSave={handleSaveData} />}
      {view === 'STUDENT_ASSESSMENT' && selectedStudent && <StudentAssessmentView student={selectedStudent} onBack={() => setView('DASHBOARD')} />}
      {view === 'RUNTRACK_STUDENT' && selectedStudent && <RunTrackStudentView student={selectedStudent} onBack={() => setView('DASHBOARD')} onSave={handleSaveData} />}
      {view === 'ANALYTICS' && selectedStudent && <AnalyticsDashboard student={selectedStudent} onBack={() => setView('DASHBOARD')} />}
      {view === 'ABOUT_ABFIT' && <AboutView onBack={() => setView('DASHBOARD')} />}
      
      {view === 'PROFESSOR_DASH' && <ProfessorDashboard students={allStudentsForCoach} onLogout={() => setView('LOGIN')} onSelect={(s) => { setSelectedStudent(s); setView('STUDENT_MGMT'); }} />}
      {view === 'STUDENT_MGMT' && selectedStudent && <StudentManagement student={selectedStudent} onBack={() => setView('PROFESSOR_DASH')} onNavigate={setView} onEditWorkout={setSelectedWorkout} />}
      {view === 'PERIODIZATION' && selectedStudent && <PeriodizationView student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onProceedToWorkout={() => { setSelectedWorkout(null); setView('WORKOUT_EDITOR'); }} />}
      {view === 'COACH_ASSESSMENT' && selectedStudent && <CoachAssessmentView student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onSave={handleSaveData} />}
      {view === 'WORKOUT_EDITOR' && selectedStudent && <WorkoutEditorView student={selectedStudent} workoutToEdit={selectedWorkout} onBack={() => setView('STUDENT_MGMT')} onSave={handleSaveData} />}
      {view === 'RUNTRACK_ELITE' && selectedStudent && <RunTrackManager student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} />}
    </BackgroundWrapper>
  );
}
