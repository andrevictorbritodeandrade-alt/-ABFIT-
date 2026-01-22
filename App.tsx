
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
    const unsubAuth = onAuthStateChanged(auth, (u) => { 
        if (u) { setUser(u); setLoading(false); }
    });
    return () => unsubAuth();
  }, []);

  // O "SEGREDO": Listener Reativo (Túnel de Dados)
  useEffect(() => {
    if (!user) return;
    
    let unsub: () => void;

    // Se estiver no Dashboard do Professor ou em telas de gestão
    if (view !== 'LOGIN' && view.startsWith('PROFESSOR') || view === 'STUDENT_MGMT' || view === 'WORKOUT_EDITOR' || view === 'COACH_ASSESSMENT' || view === 'PERIODIZATION') {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'students'));
      unsub = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
        // Lógica de Sincronização: Laranja se tem escritas pendentes
        setIsSyncing(snapshot.metadata.hasPendingWrites);
        const updatedStudents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        setStudents(updatedStudents);
        
        if (selectedStudent) {
          const current = updatedStudents.find(s => s.id === selectedStudent.id);
          if (current) setSelectedStudent(current);
        }
      });
    } 
    // Se for um Aluno Logado (Túnel Instantâneo)
    else if (selectedStudent && view !== 'LOGIN') {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudent.id);
      unsub = onSnapshot(docRef, { includeMetadataChanges: true }, (docSnap) => {
        setIsSyncing(docSnap.metadata.hasPendingWrites);
        if (docSnap.exists()) {
          setSelectedStudent({ id: docSnap.id, ...docSnap.data() } as Student);
        }
      });
    }

    return () => { if (unsub) unsub(); };
  }, [user, view, selectedStudent?.id]);

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
    try { 
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', sid);
      await setDoc(docRef, { ...data, lastUpdateTimestamp: Date.now() }, { merge: true });
    } catch (e: any) { 
      console.error("Erro ao salvar dados:", e.message); 
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudent) return;
    
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
        else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        setSelectedStudent({ ...selectedStudent, photoUrl: compressedBase64 });
        await handleSaveData(selectedStudent.id, { photoUrl: compressedBase64 });
        setUploadingPhoto(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const isFeatureVisible = (featureId: string) => {
    if (!selectedStudent) return true;
    return !(selectedStudent.disabledFeatures || []).includes(featureId);
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <BackgroundWrapper>
      <GlobalSyncIndicator isSyncing={isSyncing} />
      {view === 'LOGIN' && <LoginScreen onLogin={handleLogin} error={loginError} />}
      {view === 'DASHBOARD' && selectedStudent && (
        <div className="p-6 text-white text-center pt-10 h-screen overflow-y-auto custom-scrollbar flex flex-col items-center">
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-1000">
             <div className="text-right">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">Atleta Elite</p>
                <p className="text-xs font-black text-white italic uppercase tracking-tighter">{selectedStudent.nome}</p>
             </div>
          </div>
          <div className="mb-10 w-full flex justify-center animate-in fade-in slide-in-from-top-4 duration-700">
            <Logo size="text-8xl" subSize="text-[10px]" />
          </div>
          <div className="relative mb-8 animate-in zoom-in duration-1000">
             <div className="relative group/photo cursor-pointer" onClick={() => fileInputRef.current?.click()}>
               <div className="w-28 h-28 rounded-[2.5rem] bg-zinc-900 border-2 border-red-600 overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.3)] relative">
                  {selectedStudent?.photoUrl ? ( <img src={selectedStudent.photoUrl} className="w-full h-full object-cover" alt="Perfil"/> ) : ( <div className="w-full h-full flex items-center justify-center bg-zinc-800"><UserIcon size={40} className="text-zinc-600" /></div> )}
                  {uploadingPhoto && ( <div className="absolute inset-0 bg-black/60 flex items-center justify-center"> <Loader2 size={24} className="animate-spin text-red-600" /> </div> )}
               </div>
               <div className="absolute -bottom-1 -right-1 bg-red-600 p-2.5 rounded-full border-2 border-black shadow-lg shadow-red-600/40"> <Camera size={14} className="text-white" /> </div>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
             </div>
             <div className="absolute -top-3 -right-4"> <NotificationBadge notifications={studentNotifications} onClick={() => setShowNotifications(!showNotifications)} /> </div>
          </div>
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-2 duration-1000"> <WeatherWidget /> </div>
          {showNotifications && (
            <div className="w-full mb-8 animate-in slide-in-from-top-4 duration-300">
              <Card className="p-6 bg-red-600/5 border-red-600/20">
                <div className="flex items-center gap-2 mb-4 text-red-600"> <Bell size={16} /> <h4 className="text-[10px] font-black uppercase tracking-widest">Avisos Importantes</h4> </div>
                {studentNotifications.length === 0 ? ( <p className="text-[10px] text-zinc-500 font-bold uppercase italic text-center">Sem notificações no momento.</p> ) : (
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
          <div className="w-full space-y-5 pb-20 text-left flex flex-col">
            {isFeatureVisible('FEED') && (
              <Card className="p-6 bg-red-600/10 border-red-600/20 group cursor-pointer active:scale-95 transition-all shadow-xl" onClick={() => setView('FEED')}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-red-600 rounded-2xl shadow-lg shadow-red-600/40"> <Layout className="text-white" size={22} /> </div>
                      <div className="flex flex-col">
                        <h3 className="text-xs font-black uppercase text-white italic tracking-widest leading-none">Feed de Performance</h3>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1.5">Veja seus registros e selfie de elite</p>
                      </div>
                    </div>
                    <ChevronRight className="text-red-600 group-hover:translate-x-1 transition-transform" size={18} />
                 </div>
              </Card>
            )}
            {isFeatureVisible('WORKOUTS') && (
              <Card className="p-6 bg-orange-600/10 border-orange-600/20 group cursor-pointer active:scale-95 transition-all shadow-xl" onClick={() => setView('WORKOUTS')}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-orange-600 rounded-2xl shadow-lg shadow-orange-600/40"> <Dumbbell className="text-white" size={22} /> </div>
                      <div className="flex flex-col">
                        <h3 className="text-xs font-black uppercase text-white italic tracking-widest leading-none">Meus Treinos</h3>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1.5">Sessões de Força & Hipertrofia</p>
                      </div>
                    </div>
                    <ChevronRight className="text-orange-600 group-hover:translate-x-1 transition-transform" size={18} />
                 </div>
              </Card>
            )}
            {isFeatureVisible('STUDENT_PERIODIZATION') && (
              <Card className="p-6 bg-indigo-600/10 border-indigo-600/20 group cursor-pointer active:scale-95 transition-all shadow-xl" onClick={() => setView('STUDENT_PERIODIZATION')}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/40"> <Brain className="text-white" size={22} /> </div>
                      <div className="flex flex-col">
                        <h3 className="text-xs font-black uppercase text-white italic tracking-widest leading-none">Periodização PhD</h3>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1.5">Macrociclo & Planejamento Científico</p>
                      </div>
                    </div>
                    <ChevronRight className="text-indigo-600 group-hover:translate-x-1 transition-transform" size={18} />
                 </div>
              </Card>
            )}
            {isFeatureVisible('STUDENT_ASSESSMENT') && (
              <Card className="p-6 bg-emerald-600/10 border-emerald-600/20 group cursor-pointer active:scale-95 transition-all shadow-xl" onClick={() => setView('STUDENT_ASSESSMENT')}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-600/40"> <Ruler className="text-white" size={22} /> </div>
                      <div className="flex flex-col">
                        <h3 className="text-xs font-black uppercase text-white italic tracking-widest leading-none">Avaliação Física</h3>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1.5">Composição Corporal & Medidas Bio</p>
                      </div>
                    </div>
                    <ChevronRight className="text-emerald-600 group-hover:translate-x-1 transition-transform" size={18} />
                 </div>
              </Card>
            )}
            {isFeatureVisible('RUNTRACK_STUDENT') && (
              <Card className="p-6 bg-rose-600/10 border-rose-600/20 group cursor-pointer active:scale-95 transition-all shadow-xl" onClick={() => setView('RUNTRACK_STUDENT')}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-rose-600 rounded-2xl shadow-lg shadow-rose-600/40"> <Footprints className="text-white" size={22} /> </div>
                      <div className="flex flex-col">
                        <h3 className="text-xs font-black uppercase text-white italic tracking-widest leading-none">RunTrack Elite</h3>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1.5">Monitoramento de Corrida & Cardio</p>
                      </div>
                    </div>
                    <ChevronRight className="text-rose-600 group-hover:translate-x-1 transition-transform" size={18} />
                 </div>
              </Card>
            )}
            {isFeatureVisible('ANALYTICS') && (
              <Card className="p-6 bg-amber-600/10 border-amber-600/20 group cursor-pointer active:scale-95 transition-all shadow-xl" onClick={() => setView('ANALYTICS')}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-amber-600 rounded-2xl shadow-lg shadow-amber-600/40"> <BarChart3 className="text-white" size={22} /> </div>
                      <div className="flex flex-col">
                        <h3 className="text-xs font-black uppercase text-white italic tracking-widest leading-none">Análise de Dados</h3>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1.5">Performance & Estatísticas PBE</p>
                      </div>
                    </div>
                    <ChevronRight className="text-amber-600 group-hover:translate-x-1 transition-transform" size={18} />
                 </div>
              </Card>
            )}
            {isFeatureVisible('ABOUT_ABFIT') && (
              <Card className="p-6 bg-zinc-600/10 border-zinc-600/20 group cursor-pointer active:scale-95 transition-all shadow-xl" onClick={() => setView('ABOUT_ABFIT')}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-zinc-600 rounded-2xl shadow-lg shadow-zinc-600/40"> <Info className="text-white" size={22} /> </div>
                      <div className="flex flex-col">
                        <h3 className="text-xs font-black uppercase text-white italic tracking-widest leading-none">Sobre a ABFIT Elite</h3>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1.5">Metodologia PhD & Institucional</p>
                      </div>
                    </div>
                    <ChevronRight className="text-zinc-600 group-hover:translate-x-1 transition-transform" size={18} />
                 </div>
              </Card>
            )}
            <button 
              onClick={() => { setUser(null); setView('LOGIN'); }} 
              className="w-full mt-10 py-6 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex items-center justify-center gap-3 text-zinc-600 hover:text-red-600 hover:border-red-600/30 transition-all active:scale-95 shadow-xl group"
            >
              <LogOut size={18} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Finalizar Sessão Elite</span>
            </button>
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
      {view === 'STUDENT_MGMT' && selectedStudent && <StudentManagement student={selectedStudent} onBack={() => setView('PROFESSOR_DASH')} onNavigate={setView} onEditWorkout={setSelectedWorkout} onSave={handleSaveData} />}
      {view === 'PERIODIZATION' && selectedStudent && <PeriodizationView student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onProceedToWorkout={() => { setSelectedWorkout(null); setView('WORKOUT_EDITOR'); }} />}
      {view === 'COACH_ASSESSMENT' && selectedStudent && <CoachAssessmentView student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onSave={handleSaveData} />}
      {view === 'WORKOUT_EDITOR' && selectedStudent && <WorkoutEditorView student={selectedStudent} workoutToEdit={selectedWorkout} onBack={() => setView('STUDENT_MGMT')} onSave={handleSaveData} />}
      {view === 'RUNTRACK_ELITE' && selectedStudent && <RunTrackManager student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} />}
    </BackgroundWrapper>
  );
}
