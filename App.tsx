
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
import { InstallPrompt } from './components/InstallPrompt'; 
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
  const [isCoach, setIsCoach] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSidebar = () => setIsSidebarOpen(true);

  // Verificação de PWA (Instalação)
  useEffect(() => {
    // Verifica se já está rodando como app (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    // Se NÃO estiver instalado, mostra o prompt após 2 segundos
    if (!isStandalone) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (err: any) { setLoading(false); } };
    initAuth();
    const unsubAuth = onAuthStateChanged(auth, (u) => { if (u) { setUser(u); setLoading(false); } });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    let unsub: () => void;
    if (view !== 'LOGIN' && isCoach) {
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'students');
      unsub = onSnapshot(q, (snapshot) => {
        setIsSyncing(snapshot.metadata.hasPendingWrites);
        const updatedStudents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        setStudents(updatedStudents);
        // Atualiza o aluno selecionado em tempo real se ele estiver aberto
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
  }, [user, view, selectedStudent?.id, isCoach]);

  const allStudentsForCoach = useMemo(() => {
    // Definição dos dados padrão/hardcoded com os treinos CORRIGIDOS (7 Exercícios cada)
    const defaultStudents: Student[] = [
        { 
          id: 'fixed-liliane', 
          nome: 'Liliane Torres', 
          email: 'lilicatorres@gmail.com', 
          sexo: 'Feminino', 
          age: 35,
          physicalAssessments: [], 
          workoutHistory: [], 
          periodization: {
            id: 'per-liliane-01',
            titulo: 'Relatório Científico',
            startDate: new Date().toISOString(),
            microciclos: [],
            type: 'STRENGTH',
            phaseTitle: 'Fase de Adaptação Metabólica',
            generalStrategy: 'Periodização estruturada em fases metabólicas com foco em resistência de força.',
            clinicalSafety: ['Monitoramento de carga.', 'Atenção à postura lombar.'],
            bioInsight: {
              context: 'Liliane Torres apresenta ótima resposta a volume moderado.',
              tips: ['Estrutura Rígida', 'Linguagem Direta']
            }
          },
          workouts: [
            {
                id: 'treino-a-liliane',
                title: 'Treino A - Inferiores',
                status: 'published',
                projectedSessions: 12,
                exercises: [
                    { id: 'ex1', name: 'Agachamento Livre', sets: '4', reps: '12', rest: '60', thumb: 'https://i.pinimg.com/originals/3f/78/3f/3f783f237373024766023277732623a6.gif' },
                    { id: 'ex2', name: 'Leg Press 45', sets: '3', reps: '15', rest: '60', thumb: 'https://i.pinimg.com/originals/9e/1f/2a/9e1f2a36b0432924467c6999205307b2.gif' },
                    { id: 'ex3', name: 'Cadeira Extensora', sets: '3', reps: '15-20', rest: '45', thumb: 'https://i.pinimg.com/originals/94/a5/d8/94a5d85203387c97561337dce95e4e20.gif' },
                    { id: 'ex4', name: 'Stiff com Halteres', sets: '3', reps: '12', rest: '60', thumb: 'https://i.pinimg.com/originals/60/0a/85/600a8523c0356191942730628e469d72.gif' },
                    { id: 'ex5', name: 'Mesa Flexora', sets: '3', reps: '15', rest: '45', thumb: 'https://i.pinimg.com/originals/34/00/28/340028e35900508e063806f97653241e.gif' },
                    { id: 'ex6', name: 'Elevação Pélvica', sets: '3', reps: '12', rest: '60', thumb: 'https://i.pinimg.com/originals/60/0a/85/600a8523c0356191942730628e469d72.gif' },
                    { id: 'ex7', name: 'Panturrilha Sentado', sets: '3', reps: '20', rest: '30', thumb: 'https://i.pinimg.com/originals/b5/02/b7/b502b70f05562d98064402636a04e57e.gif' }
                ]
            },
            {
                id: 'treino-b-liliane',
                title: 'Treino B - Superiores',
                status: 'published',
                projectedSessions: 12,
                exercises: [
                    { id: 'ex1b', name: 'Puxada Alta', sets: '3', reps: '12', rest: '60', thumb: 'https://i.pinimg.com/originals/f3/06/18/f30618012675713df8302f354f923b71.gif' },
                    { id: 'ex2b', name: 'Remada Baixa', sets: '3', reps: '12', rest: '60', thumb: 'https://i.pinimg.com/originals/f3/06/18/f30618012675713df8302f354f923b71.gif' },
                    { id: 'ex3b', name: 'Supino Reto HBC', sets: '3', reps: '12', rest: '60', thumb: 'https://i.pinimg.com/originals/52/63/a2/5263a236402377a00f40d64996924263.gif' },
                    { id: 'ex4b', name: 'Desenvolvimento HBC', sets: '3', reps: '12', rest: '60', thumb: null },
                    { id: 'ex5b', name: 'Elevação Lateral', sets: '3', reps: '15', rest: '45', thumb: null },
                    { id: 'ex6b', name: 'Tríceps Corda', sets: '3', reps: '15', rest: '45', thumb: 'https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif' },
                    { id: 'ex7b', name: 'Abdominal Supra', sets: '3', reps: '20', rest: '30', thumb: 'https://i.pinimg.com/originals/c9/26/50/c92650050893347c6920330424647306.gif' }
                ]
            }
          ]
        },
        { id: 'fixed-andre', nome: 'André Brito', email: 'britodeandrade@gmail.com', physicalAssessments: [], workoutHistory: [], sexo: 'Masculino', workouts: [] }, 
        { id: 'fixed-marcelly', nome: 'Marcelly Bispo', email: 'marcellybispo92@gmail.com', physicalAssessments: [], workoutHistory: [], workouts: [], sexo: 'Feminino' }
    ];

    // LÓGICA DE MESCLAGEM CORRIGIDA: Prioridade total ao Firestore
    // 1. Começamos com os alunos vindos do Firestore (students)
    const merged = [...students];

    // 2. Para cada aluno padrão, verificamos se ele já existe nos dados do Firestore
    defaultStudents.forEach(def => {
        const existingIndex = merged.findIndex(s => s.id === def.id || (s.email && s.email.toLowerCase() === def.email.toLowerCase()));
        
        if (existingIndex === -1) {
            // Se não existe no banco, adiciona o padrão completo
            merged.push(def);
        } else {
            // Se já existe, PRESERVAMOS os dados do banco.
            // Apenas preenchemos campos que estejam COMPLETAMENTE faltando (undefined/null) no banco.
            // NÃO sobrescrevemos arrays vazios do banco com arrays do padrão.
            const existing = merged[existingIndex];
            
            if (!existing.nome) merged[existingIndex].nome = def.nome;
            if (!existing.email) merged[existingIndex].email = def.email;
            
            // Só aplica periodização padrão se o objeto periodization não existir
            if (!existing.periodization && def.periodization) {
                merged[existingIndex].periodization = def.periodization;
            }
            // Importante: Se o banco estiver vazio de treinos, restauramos o padrão
            if ((!existing.workouts || existing.workouts.length === 0) && def.workouts && def.workouts.length > 0) {
                merged[existingIndex].workouts = def.workouts;
            }
        }
    });

    // Ordenação alfabética
    return merged.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }, [students]);

  const studentForView = useMemo(() => {
    if (!selectedStudent) return null;
    if (isCoach) return selectedStudent;
    // O aluno vê o que está selecionado (que vem do banco ou do merge)
    return selectedStudent;
  }, [selectedStudent, view, isCoach]);

  // Feed de Performance Global para o Professor
  const globalFeedHistory = useMemo(() => {
    if (!isCoach) return studentForView?.workoutHistory || [];
    
    // Mescla todos os históricos de todos os alunos e injeta o nome do atleta
    const allHistory: WorkoutHistoryEntry[] = students.flatMap(s => 
      (s.workoutHistory || []).map(h => ({
        ...h,
        athleteName: s.nome // Injeta o nome do aluno para o professor saber quem treinou
      }))
    );
    
    return allHistory.sort((a, b) => b.timestamp - a.timestamp);
  }, [isCoach, students, studentForView]);

  const studentNotifications = useMemo(() => {
    if (!selectedStudent) return [];
    const notifications: AppNotification[] = [];
    const history = selectedStudent.workoutHistory || [];
    selectedStudent.workouts?.forEach(w => {
      const completed = history.filter(h => h.workoutId === w.id).length;
      const target = w.projectedSessions || 12;
      const remaining = target - completed;
      if (remaining <= 2 && remaining >= 0) {
        notifications.push({ 
          id: `renew-${w.id}`, 
          title: 'Renovação e Avaliação', 
          message: `Faltam ${remaining} sessões. Agende sua nova avaliação física para troca de série.`, 
          date: new Date().toLocaleDateString('pt-BR'), 
          read: false, 
          type: 'RENEWAL' 
        });
      }
    });
    return notifications;
  }, [selectedStudent]);

  const handleLogin = (val: string) => {
    setLoginError('');
    if (!val) return;
    const cleanVal = val.trim().toLowerCase();
    
    if (cleanVal === "professor") { 
        setIsCoach(true);
        setView('PROFESSOR_DASH'); 
        return; 
    }
    
    const student = allStudentsForCoach.find(s => (s.email || "").trim().toLowerCase() === cleanVal);
    if (student) { 
        setIsCoach(false);
        setSelectedStudent(student); 
        setView('DASHBOARD'); 
    } else { 
        setLoginError('ATLETA NÃO ENCONTRADO NO BANCO'); 
    }
  };

  const handleSaveData = async (sid: string, data: any) => {
    // Dispara o indicador de sync
    setIsSyncing(true);
    try { 
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', sid);
      await setDoc(docRef, { ...data, lastUpdateTimestamp: Date.now() }, { merge: true });
      // O isSyncing voltará a false automaticamente via onSnapshot quando a escrita confirmar
    } catch (e: any) { 
      console.error("Erro ao salvar:", e.message); 
      setIsSyncing(false); // Força false em erro
    }
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
  
  const handleBackNavigation = () => {
      if (isCoach) {
          if (selectedStudent) {
            setView('STUDENT_MGMT');
          } else {
            setView('PROFESSOR_DASH');
          }
      } else {
          toggleSidebar();
      }
  };

  // DEFINIÇÃO DOS BOTÕES DO DASHBOARD DO ALUNO
  // Filtramos aqui com base em studentForView.disabledFeatures
  const allDashboardItems = [
    { id: 'FEED', label: 'Feed Performance', icon: Layout, color: 'red' },
    { id: 'WORKOUTS', label: 'Planilhas Ativas', icon: Dumbbell, color: 'orange' },
    { id: 'STUDENT_PERIODIZATION', label: 'Periodização PhD', icon: Brain, color: 'indigo' },
    { id: 'STUDENT_ASSESSMENT', label: 'Avaliação Física', icon: Ruler, color: 'emerald' },
    { id: 'RUNTRACK_STUDENT', label: 'RunTrack Elite', icon: Footprints, color: 'rose' },
    { id: 'ANALYTICS', label: 'Análise de Dados', icon: BarChart3, color: 'blue' },
    { id: 'ABOUT_ABFIT', label: 'Sobre a ABFIT', icon: Info, color: 'zinc' }
  ];

  const visibleDashboardItems = allDashboardItems.filter(item => {
    // Se o aluno não tiver a lista de disabledFeatures, mostra tudo.
    // Se tiver, esconde se o ID estiver na lista.
    return !studentForView?.disabledFeatures?.includes(item.id);
  });

  return (
    <BackgroundWrapper>
      <GlobalSyncIndicator isSyncing={isSyncing} />
      
      {showInstallPrompt && <InstallPrompt onClose={() => setShowInstallPrompt(false)} />}
      
      {showSidebar && (
        <SideNav 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          activeView={view} 
          onNavigate={setView}
          isProfessor={isCoach}
        />
      )}

      <main className="transition-all duration-500">
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
              {visibleDashboardItems.map(item => (
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
        {view === 'FEED' && <WorkoutFeed history={globalFeedHistory} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onToggleMenu={toggleSidebar} isProfessor={isCoach} />}
        {view === 'WORKOUTS' && studentForView && <WorkoutSessionView user={studentForView} onBack={handleBackNavigation} onSave={handleSaveData} />}
        {view === 'COACH_AI' && <AICoach onBack={isCoach ? handleBackNavigation : undefined} />}
        {view === 'SETTINGS' && <SettingsView onBack={isCoach ? () => setView('PROFESSOR_DASH') : toggleSidebar} />}
        {view === 'STUDENT_PERIODIZATION' && studentForView && <StudentPeriodizationView student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onToggleMenu={toggleSidebar} />}
        {view === 'STUDENT_ASSESSMENT' && studentForView && <StudentAssessmentView student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onToggleMenu={toggleSidebar} />}
        {view === 'RUNTRACK_STUDENT' && studentForView && <RunTrackStudentView student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onSave={handleSaveData} onToggleMenu={toggleSidebar} />}
        {view === 'ANALYTICS' && studentForView && <AnalyticsDashboard student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onToggleMenu={toggleSidebar} />}
        {view === 'ABOUT_ABFIT' && <AboutView onBack={handleBackNavigation} />}
        
        {view === 'PROFESSOR_DASH' && <ProfessorDashboard students={allStudentsForCoach} onLogout={() => setView('LOGIN')} onSelect={(s) => { setSelectedStudent(s); setView('STUDENT_MGMT'); }} onToggleMenu={toggleSidebar} onNavigate={setView} />}
        {view === 'STUDENT_MGMT' && selectedStudent && <StudentManagement student={selectedStudent} onBack={() => setView('PROFESSOR_DASH')} onNavigate={setView} onEditWorkout={setSelectedWorkout} onSave={handleSaveData} />}
        {view === 'WORKOUT_EDITOR' && selectedStudent && <WorkoutEditorView student={selectedStudent} workoutToEdit={selectedWorkout} onBack={() => setView('STUDENT_MGMT')} onSave={handleSaveData} />}
        {view === 'COACH_ASSESSMENT' && selectedStudent && <CoachAssessmentView student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onSave={handleSaveData} />}
        {view === 'PERIODIZATION' && selectedStudent && <PeriodizationView student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onProceedToWorkout={() => setView('WORKOUT_EDITOR')} onSave={handleSaveData} />}
        {view === 'RUNTRACK_MANAGER' && selectedStudent && <RunTrackManager student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} />}
        {view === 'ANALYTICS_COACH' && selectedStudent && <AnalyticsDashboard student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onToggleMenu={undefined} />}
      </main>
    </BackgroundWrapper>
  );
}
