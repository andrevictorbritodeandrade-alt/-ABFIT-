
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User as UserIcon, Loader2, Dumbbell, 
  Camera, Brain, Ruler, Footprints,
  Info, LogOut, Layout, Bell,
  BarChart3, ChevronRight, Activity, Settings2, Bot, ArrowLeft, Menu
} from 'lucide-react';
import { Logo, BackgroundWrapper, EliteFooter, WeatherWidget, GlobalSyncIndicator, Card, NotificationBadge, SideNav, HeaderTitle } from './components/Layout';
import { ProfessorDashboard, StudentManagement, WorkoutEditorView, CoachAssessmentView, PeriodizationView, RunTrackManager } from './components/CoachFlow';
import { WorkoutSessionView, StudentAssessmentView, StudentPeriodizationView, AboutView } from './components/StudentFlow';
import { RunTrackStudentView } from './components/RunTrack';
import { WorkoutFeed } from './components/WorkoutFeed';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import AICoach from './components/AICoach';
import { collection, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, db, appId } from './services/firebase';
import { Student, Workout, AppNotification, WorkoutHistoryEntry } from './types';

function SettingsView({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-6 pb-48 animate-in fade-in duration-500 text-white overflow-y-auto h-screen custom-scrollbar text-left bg-black">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full shadow-lg text-white hover:bg-red-600 transition-colors">
          <Menu size={20}/>
        </button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
          <HeaderTitle text="Configurações Elite" />
        </h2>
      </header>
      <div className="max-w-2xl mx-auto space-y-6">
         <Card className="p-8 bg-zinc-900/50 border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-red-600 rounded-2xl shadow-lg">
                  <UserIcon className="text-white" size={24} />
               </div>
               <div>
                  <h4 className="text-sm font-black uppercase italic text-white">Perfil do Atleta</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Edite seus dados pessoais</p>
               </div>
            </div>
            <ChevronRight className="text-zinc-700" size={20} />
         </Card>
         <Card className="p-8 bg-zinc-900/50 border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
                  <Bell className="text-white" size={24} />
               </div>
               <div>
                  <h4 className="text-sm font-black uppercase italic text-white">Notificações</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Alertas de treino e renovação</p>
               </div>
            </div>
            <div className="w-12 h-6 bg-emerald-600 rounded-full relative">
               <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
         </Card>
      </div>
      <EliteFooter />
    </div>
  );
}

function LoginScreen({ onLogin, error, students }: { onLogin: (val: string) => void, error: string, students: Student[] }) {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const registeredOptions = useMemo(() => {
    const coachOption = { name: "PROFESSOR", value: "PROFESSOR", type: "COACH" };
    const studentOptions = [...students]
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
      .map(s => ({
        name: s.nome,
        value: s.email,
        type: "ALUNO"
      }));
    
    return [coachOption, ...studentOptions];
  }, [students]);
  
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
          <label className="text-[10px] font-black text-zinc-500 ml-4 uppercase tracking-widest text-white">Identificação Elite</label>
          <div className="relative" ref={dropdownRef}>
            <input type="text" placeholder="E-MAIL OU 'PROFESSOR'" className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-[2.5rem] text-white outline-none focus:border-red-600 transition-all text-center font-black tracking-tight uppercase placeholder:text-zinc-700" value={input} autoComplete="off" onChange={e => setInput(e.target.value)} onClick={() => setShowDropdown(true)} onFocus={() => setShowDropdown(true)} />
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-80 overflow-y-auto custom-scrollbar">
                <div className="p-3 border-b border-zinc-800 bg-black/40 text-center sticky top-0 z-10"><p className="text-[8px] font-black text-zinc-500 uppercase text-center tracking-[0.2em]">Selecione um perfil</p></div>
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
        <button onClick={() => onLogin(input)} className="w-full bg-red-600 py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-white active:scale-95 transition-all shadow-xl shadow-red-900/20 hover:bg-red-700">ENTRAR NO ECOSSISTEMA</button>
      </div>
      <EliteFooter />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('LOGIN');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProfessor = view.includes('PROFESSOR') || view === 'STUDENT_MGMT' || view === 'WORKOUT_EDITOR' || (view === 'COACH_AI' && !selectedStudent);

  const toggleSidebar = () => setIsSidebarOpen(true);

  useEffect(() => {
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (err: any) { setLoading(false); } };
    initAuth();
    const unsubAuth = onAuthStateChanged(auth, (u) => { if (u) { setUser(u); setLoading(false); } });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    let unsub: () => void;
    if (view !== 'LOGIN' && isProfessor) {
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'students');
      unsub = onSnapshot(q, (snapshot) => {
        setIsSyncing(snapshot.metadata.hasPendingWrites);
        const updatedStudents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        setStudents(updatedStudents);
        if (selectedStudent) {
          const current = updatedStudents.find(s => s.id === selectedStudent.id);
          if (current) setSelectedStudent(current);
        }
      });
    } else if (selectedStudent && view !== 'LOGIN') {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudent.id);
      unsub = onSnapshot(docRef, (docSnap) => {
        setIsSyncing(docSnap.metadata.hasPendingWrites);
        if (docSnap.exists()) setSelectedStudent({ id: docSnap.id, ...docSnap.data() } as Student);
      });
    }
    return () => { if (unsub) unsub(); };
  }, [user, view, selectedStudent?.id]);

  const allStudentsForCoach = useMemo(() => {
    const defaultStudents: Student[] = [
        { 
          id: 'fixed-liliane', 
          nome: 'Liliane Torres', 
          email: 'lilicatorres@gmail.com', 
          physicalAssessments: [], 
          workoutHistory: [], 
          sexo: 'Feminino', 
          age: 35,
          workouts: [
            {
              id: 'treino-a-liliane',
              title: 'TREINO - A',
              status: 'published',
              projectedSessions: 20,
              exercises: [
                { id: '1', name: 'LEG PRESS HORIZONTAL', sets: '3', reps: '15', method: 'SÉRIE ESTÁVEL', rest: '60s' },
                { id: '2', name: 'LEVANTAR E SENTAR NO BANCO', sets: '3', reps: '15', method: 'SÉRIE ESTÁVEL', rest: '60s' },
                { id: '3', name: 'CADEIRA EXTENSORA', sets: '3', reps: '15', method: 'SÉRIE ESTÁVEL', rest: '60s' },
                { id: '4', name: 'SUPINO RETO COM HBL', sets: '3', reps: '15', method: 'SÉRIE ESTÁVEL', rest: '60s' },
                { id: '5', name: 'REMADA ALTA EM PÉ NO CROSS', sets: '3', reps: '15', method: 'SÉRIE ESTÁVEL', rest: '60s' },
                { id: '6', name: 'TRÍCEPS NO CROSS COM BARRA', sets: '3', reps: '15', method: 'SÉRIE ESTÁVEL', rest: '60s' },
                { id: '7', name: 'ABDOMINAL SUPRA NO SOLO', sets: '3', reps: '15', method: 'SÉRIE ESTÁVEL', rest: '60s' },
                { id: '8', name: 'PRANCHA VENTRAL NO SOLO', sets: '3', reps: '15S', method: 'SÉRIE ESTÁVEL', rest: '60s' }
              ]
            },
            {
              id: 'treino-b-liliane',
              title: 'TREINO - B',
              status: 'published',
              projectedSessions: 20,
              exercises: [
                { id: 'b1', name: 'PUXADA ABERTA NO PULLEY', sets: '3', reps: '15', method: 'SÉRIE ESTÁVEL', rest: '60s' },
                { id: 'b2', name: 'REMADA BAIXA TRIÂNGULO', sets: '3', reps: '15', method: 'SÉRIE ESTÁVEL', rest: '60s' },
                { id: 'b3', name: 'BÍCEPS COM HALTERES', sets: '3', reps: '12', method: 'SÉRIE ESTÁVEL', rest: '60s' },
                { id: 'b4', name: 'ELEVAÇÃO LATERAL', sets: '3', reps: '12', method: 'SÉRIE ESTÁVEL', rest: '60s' },
                { id: 'b5', name: 'STIFF COM BARRA', sets: '3', reps: '15', method: 'SÉRIE ESTÁVEL', rest: '60s' },
                { id: 'b6', name: 'MESA FLEXORA', sets: '3', reps: '15', method: 'SÉRIE ESTÁVEL', rest: '60s' },
                { id: 'b7', name: 'PANTURRILHA EM PÉ', sets: '3', reps: '20', method: 'SÉRIE ESTÁVEL', rest: '60s' }
              ]
            }
          ]
        },
        { id: 'fixed-andre', nome: 'André Brito', email: 'britodeandrade@gmail.com', physicalAssessments: [], workoutHistory: [], sexo: 'Masculino', workouts: [
          { id: 'a-andre', title: 'TREINO - A', status: 'published', projectedSessions: 20, exercises: [{id:'1', name:'SUPINO', sets:'4', reps:'10'}] },
          { id: 'b-andre', title: 'TREINO - B', status: 'published', projectedSessions: 20, exercises: [{id:'2', name:'REMADA', sets:'4', reps:'10'}] }
        ]}, 
        { id: 'fixed-marcelly', nome: 'Marcelly Bispo', email: 'marcellybispo92@gmail.com', physicalAssessments: [], workoutHistory: [], workouts: [
          { id: 'a-marcelly', title: 'TREINO - A', status: 'published', projectedSessions: 20, exercises: [{id:'1', name:'AGACHAMENTO', sets:'3', reps:'15'}] },
          { id: 'b-marcelly', title: 'TREINO - B', status: 'published', projectedSessions: 20, exercises: [{id:'2', name:'AFUNDO', sets:'3', reps:'15'}] }
        ], sexo: 'Feminino' }
    ];
    const merged = students.map(s => ({ ...s }));
    defaultStudents.forEach(def => { 
        const existingIndex = merged.findIndex(s => s.id === def.id || (s.email && s.email.toLowerCase() === def.email.toLowerCase()));
        if (existingIndex === -1) merged.push({ ...def }); 
        else {
          if (!merged[existingIndex].workouts || merged[existingIndex].workouts.length === 0) merged[existingIndex].workouts = def.workouts;
          if (!merged[existingIndex].nome) merged[existingIndex].nome = def.nome;
          if (!merged[existingIndex].email) merged[existingIndex].email = def.email;
        }
    });
    return merged;
  }, [students]);

  const studentForView = useMemo(() => {
    if (!selectedStudent) return null;
    if (isProfessor) return selectedStudent;
    return { ...selectedStudent, workouts: (selectedStudent.workouts || []).filter(w => w.status === 'published') };
  }, [selectedStudent, view, isProfessor]);

  // Feed de Performance Global para o Professor
  const globalFeedHistory = useMemo(() => {
    if (!isProfessor) return studentForView?.workoutHistory || [];
    
    // Mescla todos os históricos de todos os alunos e injeta o nome do atleta
    const allHistory: WorkoutHistoryEntry[] = students.flatMap(s => 
      (s.workoutHistory || []).map(h => ({
        ...h,
        athleteName: s.nome // Injeta o nome do aluno para o professor saber quem treinou
      }))
    );
    
    return allHistory.sort((a, b) => b.timestamp - a.timestamp);
  }, [isProfessor, students, studentForView]);

  const studentNotifications = useMemo(() => {
    if (!selectedStudent) return [];
    const notifications: AppNotification[] = [];
    const history = selectedStudent.workoutHistory || [];
    selectedStudent.workouts?.forEach(w => {
      const completed = history.filter(h => h.workoutId === w.id).length;
      const remaining = (w.projectedSessions || 20) - completed;
      if (remaining <= 2 && remaining >= 0) {
        notifications.push({ id: `renew-${w.id}`, title: 'Renovação PhD', message: `Faltam ${remaining} sessões para o fim da sua planilha.`, date: new Date().toLocaleDateString('pt-BR'), read: false, type: 'RENEWAL' });
      }
    });
    return notifications;
  }, [selectedStudent]);

  const handleLogin = (val: string) => {
    setLoginError('');
    if (!val) return;
    const cleanVal = val.trim().toLowerCase();
    if (cleanVal === "professor") { setView('PROFESSOR_DASH'); return; }
    const student = allStudentsForCoach.find(s => (s.email || "").trim().toLowerCase() === cleanVal);
    if (student) { setSelectedStudent(student); setView('DASHBOARD'); } 
    else { setLoginError('ATLETA NÃO ENCONTRADO NO BANCO'); }
  };

  const handleSaveData = async (sid: string, data: any) => {
    try { 
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', sid);
      await setDoc(docRef, { ...data, lastUpdateTimestamp: Date.now() }, { merge: true });
    } catch (e: any) { console.error("Erro ao salvar:", e.message); }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedStudent) {
      setUploadingPhoto(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400;
          let width = img.width; let height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
          await handleSaveData(selectedStudent.id, { photoUrl: compressedBase64 });
          setUploadingPhoto(false);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin text-red-600" /></div>;

  const showSidebar = view !== 'LOGIN';

  return (
    <BackgroundWrapper>
      <GlobalSyncIndicator isSyncing={isSyncing} />
      
      {showSidebar && (
        <SideNav 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          activeView={view} 
          onNavigate={setView}
          isProfessor={isProfessor}
        />
      )}

      <main className={`transition-all duration-500 ${showSidebar ? 'lg:pl-[280px]' : ''}`}>
        {view === 'LOGIN' && <LoginScreen onLogin={handleLogin} error={loginError} students={allStudentsForCoach} />}
        {view === 'DASHBOARD' && studentForView && (
          <div className="p-6 text-white text-center pt-6 h-screen overflow-y-auto custom-scrollbar flex flex-col items-center">
            <header className="w-full flex justify-between items-center mb-4">
              <button onClick={toggleSidebar} className="p-3 bg-zinc-900 rounded-2xl text-zinc-500 hover:text-white transition-colors shadow-lg">
                <Menu size={20}/>
              </button>
              <WeatherWidget />
            </header>
            
            <Logo size="text-8xl" subSize="text-[10px]" />
            <div className="relative mt-8 mb-8">
               <div className="relative group/photo cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <div className="w-28 h-28 rounded-[2.5rem] bg-zinc-900 border-2 border-red-600 overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.3)] relative">
                    {studentForView.photoUrl ? ( <img src={studentForView.photoUrl} className="w-full h-full object-cover" alt="Perfil"/> ) : ( <div className="w-full h-full flex items-center justify-center bg-zinc-800"><UserIcon size={40} className="text-zinc-600" /></div> )}
                    {uploadingPhoto && ( <div className="absolute inset-0 bg-black/60 flex items-center justify-center"> <Loader2 size={24} className="animate-spin text-red-600" /> </div> )}
                 </div>
                 <div className="absolute -bottom-1 -right-1 bg-red-600 p-2.5 rounded-full border-2 border-black shadow-lg shadow-red-600/40"> <Camera size={14} className="text-white" /> </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
               </div>
               <div className="absolute -top-3 -right-4"> <NotificationBadge notifications={studentNotifications} /> </div>
            </div>
            <p className="text-xs font-black text-white italic uppercase tracking-widest">{studentForView.nome}</p>
            
            <div className="w-full mt-10 space-y-4 pb-20 text-left flex flex-col max-w-xl mx-auto">
              {[
                { id: 'FEED', label: 'Feed Performance', icon: Layout, color: 'red' },
                { id: 'WORKOUTS', label: 'Planilhas Ativas', icon: Dumbbell, color: 'orange' },
                { id: 'STUDENT_PERIODIZATION', label: 'Periodização PhD', icon: Brain, color: 'indigo' },
                { id: 'STUDENT_ASSESSMENT', label: 'Avaliação Física', icon: Ruler, color: 'emerald' },
                { id: 'RUNTRACK_STUDENT', label: 'RunTrack Elite', icon: Footprints, color: 'rose' },
                { id: 'ANALYTICS', label: 'Análise de Dados', icon: BarChart3, color: 'blue' },
                { id: 'ABOUT_ABFIT', label: 'Sobre a ABFIT', icon: Info, color: 'zinc' }
              ].map(item => (
                <Card key={item.id} className={`p-6 bg-${item.color}-600/10 border-${item.color}-600/20 group cursor-pointer active:scale-95 transition-all shadow-xl`} onClick={() => setView(item.id)}>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 bg-${item.color}-600 rounded-2xl shadow-lg`}> <item.icon className="text-white" size={22} /> </div>
                        <h3 className="text-xs font-black uppercase text-white italic tracking-widest">{item.label}</h3>
                      </div>
                      <ChevronRight className={`text-${item.color}-600 group-hover:translate-x-1 transition-transform`} size={18} />
                   </div>
                </Card>
              ))}
              <button onClick={() => { setUser(null); setView('LOGIN'); }} className="w-full mt-10 py-6 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex items-center justify-center gap-3 text-zinc-600 hover:text-red-600 transition-all active:scale-95 shadow-xl group">
                <LogOut size={18} /> <span className="text-[10px] font-black uppercase tracking-[0.4em]">Finalizar Sessão</span>
              </button>
            </div>
            <EliteFooter />
          </div>
        )}
        {view === 'FEED' && <WorkoutFeed history={globalFeedHistory} onBack={toggleSidebar} isProfessor={isProfessor} />}
        {view === 'WORKOUTS' && studentForView && <WorkoutSessionView user={studentForView} onBack={toggleSidebar} onSave={handleSaveData} />}
        {view === 'COACH_AI' && <AICoach />}
        {view === 'SETTINGS' && <SettingsView onBack={isProfessor ? () => setView('PROFESSOR_DASH') : toggleSidebar} />}
        {view === 'STUDENT_PERIODIZATION' && studentForView && <StudentPeriodizationView student={studentForView} onBack={toggleSidebar} />}
        {view === 'STUDENT_ASSESSMENT' && studentForView && <StudentAssessmentView student={studentForView} onBack={toggleSidebar} />}
        {view === 'RUNTRACK_STUDENT' && studentForView && <RunTrackStudentView student={studentForView} onBack={toggleSidebar} onSave={handleSaveData} />}
        {view === 'ANALYTICS' && studentForView && <AnalyticsDashboard student={studentForView} onBack={toggleSidebar} />}
        {view === 'ABOUT_ABFIT' && <AboutView onBack={toggleSidebar} />}
        {view === 'PROFESSOR_DASH' && <ProfessorDashboard students={allStudentsForCoach} onLogout={() => setView('LOGIN')} onSelect={(s) => { setSelectedStudent(s); setView('STUDENT_MGMT'); }} onToggleMenu={toggleSidebar} onNavigate={setView} />}
        {view === 'STUDENT_MGMT' && selectedStudent && <StudentManagement student={selectedStudent} onBack={() => setView('PROFESSOR_DASH')} onNavigate={setView} onEditWorkout={setSelectedWorkout} onSave={handleSaveData} />}
        {view === 'WORKOUT_EDITOR' && selectedStudent && <WorkoutEditorView student={selectedStudent} workoutToEdit={selectedWorkout} onBack={() => setView('STUDENT_MGMT')} onSave={handleSaveData} />}
        {view === 'COACH_ASSESSMENT' && selectedStudent && <CoachAssessmentView student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onSave={handleSaveData} />}
        {view === 'PERIODIZATION' && selectedStudent && <PeriodizationView student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onProceedToWorkout={() => setView('WORKOUT_EDITOR')} />}
      </main>
    </BackgroundWrapper>
  );
}
