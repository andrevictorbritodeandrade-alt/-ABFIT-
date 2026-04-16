
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User as UserIcon, Loader2, Dumbbell, 
  Camera, Brain, Ruler, Footprints,
  Info, LogOut, Layout, Bell,
  BarChart3, ChevronRight, Activity, Settings2, Bot, ArrowLeft, Menu, MapPin,
  AlertTriangle, Sparkles
} from 'lucide-react';
import { Logo, BackgroundWrapper, AppFooter, WeatherWidget, GlobalSyncIndicator, Card, NotificationBadge, SideNav, HeaderTitle } from './components/Layout';
import { ProfessorDashboard, StudentManagement, WorkoutEditorView, CoachAssessmentView, PeriodizationView, RunTrackManager, StudentWorkoutHistoryView } from './components/CoachFlow';
import { WorkoutSessionView, StudentAssessmentView, StudentPeriodizationView, AboutView } from './components/StudentFlow';
import { RunTrackStudentView } from './components/RunTrack';
import { WorkoutFeed } from './components/WorkoutFeed';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import AICoach from './components/AICoach';
import { CorreRJView } from './components/CorreRJ';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, db, appId, handleFirestoreError, OperationType, collection, query, onSnapshot, doc, setDoc } from './services/firebase';
import { Student, Workout, AppNotification, WorkoutHistoryEntry } from './types';
import { useTheme } from './components/ThemeContext';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      try {
        const parsedError = JSON.parse(this.state.error.message);
        if (parsedError.error) {
          errorMessage = `Erro no Firestore (${parsedError.operationType}): ${parsedError.error}`;
        }
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
          <AlertTriangle className="text-red-600 mb-4" size={48} />
          <h2 className="text-xl font-black uppercase italic mb-2">Ops! Algo deu errado</h2>
          <p className="text-sm font-bold uppercase tracking-widest mb-6 opacity-70 max-w-md">
            {errorMessage}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black uppercase italic tracking-tighter hover:bg-red-700 transition-all shadow-lg"
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function SettingsView({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-6 pb-48 animate-in fade-in duration-500 text-foreground overflow-y-auto h-screen custom-scrollbar text-left bg-background transition-colors">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-secondary rounded-full shadow-lg text-foreground hover:bg-red-600 transition-colors">
          <ArrowLeft size={20}/>
        </button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground">
          <HeaderTitle text="Configurações ABFIT" />
        </h2>
      </header>
      <div className="max-w-2xl mx-auto space-y-6">
         <Card className="p-5 bg-card border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-2.5 bg-red-600 rounded-xl shadow-lg">
                  <UserIcon className="text-white" size={20} />
               </div>
               <div>
                  <h4 className="text-[13px] font-black uppercase italic text-foreground">Perfil do Atleta</h4>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Edite seus dados pessoais</p>
               </div>
            </div>
            <ChevronRight className="text-muted-foreground" size={18} />
         </Card>

         <Card className="p-5 bg-card border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg">
                  <Bell className="text-white" size={20} />
               </div>
               <div>
                  <h4 className="text-[13px] font-black uppercase italic text-foreground">Notificações</h4>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Alertas de treino e renovação</p>
               </div>
            </div>
            <div className="w-10 h-5 bg-emerald-600 rounded-full relative">
               <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
            </div>
         </Card>
      </div>
      <AppFooter />
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
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 text-center font-sans text-foreground transition-colors overflow-hidden">
      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center">
        <div className="animate-in fade-in zoom-in duration-700 text-center mb-12">
          <Logo size="text-[5.5rem] xs:text-[7rem] sm:text-[9rem]" subSize="text-[9px] sm:text-xs" />
        </div>
        
        <div className="w-full space-y-4 animate-in slide-in-from-bottom-10 duration-1000 relative">
          <div className="text-left">
            <div className="relative" ref={dropdownRef}>
              <input type="text" name="login-email-no-autofill" id="login-email-no-autofill" placeholder="E-MAIL OU 'PROFESSOR'" className="w-full bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] text-white outline-none focus:border-red-600 transition-all text-center font-black tracking-tight uppercase placeholder:text-zinc-500 shadow-2xl" value={input} autoComplete="new-password" onChange={e => setInput(e.target.value)} onClick={() => setShowDropdown(true)} onFocus={() => setShowDropdown(true)} />
              {showDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-4 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 max-h-80 overflow-y-auto custom-scrollbar">
                  <div className="p-3 border-b border-white/5 bg-zinc-800/50 text-center sticky top-0 z-10"><p className="text-[11px] font-black text-zinc-500 uppercase text-center tracking-[0.2em]">Selecione um perfil</p></div>
                  {registeredOptions.map((opt, idx) => (
                    <button key={`opt-${idx}`} onClick={() => { setInput(opt.value); setShowDropdown(false); }} className="w-full p-4 hover:bg-red-600/10 text-left flex items-center justify-between border-b border-white/5 transition-colors group">
                      <div className="text-left"><p className="text-white text-base font-black uppercase tracking-tight text-left">{opt.name}</p><p className="text-[12px] text-zinc-500 lowercase text-left">{opt.value}</p></div>
                      <span className={`text-[11px] font-black px-2 py-1 rounded-full ${opt.type === 'COACH' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{opt.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {error && <p className="text-red-500 text-[13px] font-black uppercase py-2 tracking-widest text-center">{error}</p>}
          <button onClick={() => onLogin(input)} className="w-full bg-red-600 py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-white active:scale-95 transition-all shadow-2xl shadow-red-900/40 hover:bg-red-700 text-lg">ENTRAR NO ECOSSISTEMA</button>
        </div>
      </div>
      
      <div className="absolute bottom-6 left-0 right-0 z-10">
        <AppFooter />
      </div>
    </div>
  );
}

import { PrescreveAI } from './components/PrescreveAI';

export default function App() {
  const [view, setView] = useState('LOGIN');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [dbError, setDbError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [runningWorkouts, setRunningWorkouts] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  // Fetch running workouts
  useEffect(() => {
    const q = query(collection(db, `artifacts/runtrack-elite-v4/workouts`));
    const unsub = onSnapshot(q, (snapshot) => {
      const workouts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRunningWorkouts(workouts);
    });
    return () => unsub();
  }, []);

  const resetApp = () => {
    localStorage.removeItem('elite_session_v2');
    localStorage.removeItem('theme');
    delete (window as any)._tempStudentId;
    delete (window as any)._tempWorkoutId;
    window.location.reload();
  };

  useEffect(() => {
    console.log("App Initialization Debug:", {
      appId,
      dbInstance: db ? "Initialized" : "Missing",
      view,
      isCoach,
      selectedStudentId: selectedStudent?.id
    });
  }, [view, isCoach, selectedStudent]);

  useEffect(() => {
    if (syncStatus === 'synced' || syncStatus === 'offline') {
      const timer = setTimeout(() => setSyncStatus('synced'), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);
  const [loginError, setLoginError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // SESSION RESTORE STATE
  const [restoredSession, setRestoredSession] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSidebar = () => setIsSidebarOpen(true);

  // --- 1. CONFIGURAÇÃO DE PERSISTÊNCIA E LOGIN AUTOMÁTICO ---
  useEffect(() => {
    const restoreSession = async () => {
        const savedSession = localStorage.getItem('elite_session_v2');
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                if (parsed.isCoach !== undefined) {
                    setIsCoach(parsed.isCoach);
                    // Restaurar a view se existir
                    if (parsed.view) setView(parsed.view); 
                    
                    // O aluno será selecionado quando os dados do Firestore carregarem
                    if (parsed.selectedStudentId) {
                        // Armazenamos temporariamente para usar no efeito de carga de dados
                        (window as any)._tempStudentId = parsed.selectedStudentId;
                    }
                    if (parsed.selectedWorkoutId) {
                        (window as any)._tempWorkoutId = parsed.selectedWorkoutId;
                    }
                    setRestoredSession(true);
                }
            } catch (e) {
                console.error("Erro ao restaurar sessão", e);
                localStorage.removeItem('elite_session_v2');
            }
        }
    };
    restoreSession();
  }, []);

  // --- 2. SALVAMENTO AUTOMÁTICO DE ESTADO (VIEW E SELEÇÃO) ---
  useEffect(() => {
    if (view === 'LOGIN') {
        localStorage.removeItem('elite_session_v2');
    } else {
        const sessionData = {
            isCoach,
            view,
            selectedStudentId: selectedStudent?.id,
            selectedWorkoutId: selectedWorkout?.id
        };
        localStorage.setItem('elite_session_v2', JSON.stringify(sessionData));
    }
  }, [view, isCoach, selectedStudent, selectedWorkout]);

  // Verificação de PWA (Instalação) - Desativado a pedido do usuário
  useEffect(() => {
    // const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    // if (!isStandalone) {
    //   // Desativado a pedido do usuário
    //   // const timer = setTimeout(() => {
    //   //   setShowInstallPrompt(true);
    //   // }, 2000);
    //   // return () => clearTimeout(timer);
    // }
  }, []);

  useEffect(() => {
    const initAuth = async () => { 
      console.log("Iniciando autenticação anônima...");
      try { 
        await signInAnonymously(auth); 
        console.log("Autenticação anônima concluída.");
      } catch (err: any) { 
        console.error("Erro na autenticação:", err);
        
        let errorMessage = "";
        if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
          errorMessage = "O login anônimo está desativado no Console do Firebase. Por favor, ative-o em Authentication > Sign-in method > Anonymous.";
          console.warn(errorMessage);
          // We log it but don't set dbError to avoid blocking the whole app
        } else if (err.code === 'auth/configuration-not-found') {
          errorMessage = "Configuração do Firebase não encontrada ou incompleta.";
          console.warn(errorMessage);
        } else {
          console.warn("Auth warning:", err.message);
        }
        
        // Even if auth fails, we try to proceed since some rules are 'if true'
        setAuthReady(true);
        setLoading(false);
      } 
    };
    initAuth();
    
    // Safety timeout to prevent stuck loading screen
    const timeout = setTimeout(() => {
      console.warn("Auth timeout reached.");
      setAuthReady(true);
      setLoading(false);
    }, 8000);

    const unsubAuth = onAuthStateChanged(auth, (u) => { 
      console.log("Estado de autenticação alterado:", u ? "Usuário logado" : "Nenhum usuário");
      if (u) { 
        setUser(u); 
        setAuthReady(true);
        setLoading(false); 
        clearTimeout(timeout);
      } else {
        setUser(null);
        setAuthReady(true);
        setLoading(false);
        clearTimeout(timeout);
      }
    });
    return () => {
      unsubAuth();
      clearTimeout(timeout);
    };
  }, []);

  // Removed strict auth redirect to allow offline/unauthenticated access to default data
  // useEffect(() => {
  //   if (!loading && !user && view !== 'LOGIN') {
  //     setView('LOGIN');
  //     localStorage.removeItem('elite_session_v2');
  //     delete (window as any)._tempStudentId;
  //   }
  // }, [loading, user, view]);

  // Definição Centralizada dos Alunos Padrão
  const defaultStudentsData = useMemo<Student[]>(() => [
        { 
          id: 'fixed-liliane', 
          nome: 'Liliane Torres', 
          email: 'lilicatorres@gmail.com', 
          photoUrl: 'https://image.pollinations.ai/prompt/Disney%20style%203d%20animation%20illustration%20of%20a%20smiling%20Brazilian%20woman%20named%20Liliane%20Torres%2C%20long%20brown%20hair%2C%20wearing%20a%20yellow%20Flamengo%20soccer%20jersey%2C%20standing%20in%20a%20packed%20stadium?width=400&height=400&nologo=true',
          age: 35,
          weight: 81,
          height: 165,
          goal: 'health',
          medicalHistory: '⚠️ Dores no joelho',
          medications: 'Nenhuma',
          physicalAssessments: [], 
          workoutHistory: [], 
          analytics: {
            sessionsCompleted: 0,
            streakDays: 0,
            exercises: {},
            lastSessionDate: ''
          },
          sexo: 'Feminino', 
          periodization: {
            id: 'per-liliane-01',
            titulo: 'Relatório Científico',
            startDate: '2026-02-23T00:00:00.000Z',
            type: 'STRENGTH',
            phaseTitle: 'Emagrecimento e Controle TDAH',
            generalStrategy: "Periodização focada em déficit calórico e preservação de massa magra. Usa variação constante de estímulos (circuitos, superséries, EMOM) para engajar o TDAH. Exercícios de baixo impacto protegem o joelho, fortalecendo quadril e core para otimizar a biomecânica e maximizar a perda de gordura.",
            clinicalSafety: [
              "Cuidados com o Joelho: Priorizar exercícios em cadeia cinética fechada (Leg Press, Agachamento, Elevação Pélvica). Evitar cadeira extensora com carga alta e atividades de alto impacto (saltos, corrida em esteira). Utilizar elíptico, remo ou bike para cardio.",
              "Manejo do TDAH: Utilizar métodos dinâmicos (EMOM, AMRAP, PHA) para evitar o tédio. Manter as sessões densas (45-50 minutos) com transições rápidas e metas claras de repetições/tempo para gamificar o treino e aumentar a adesão.",
              "Monitoramento de Emagrecimento: Como a meta é agressiva (15 kg em 6 meses), o déficit calórico será alto. Monitorar sinais de fadiga excessiva e ajustar a intensidade caso haja piora nas dores articulares ou episódios de desatenção severa."
            ],
            bioInsight: {
              context: "Liliane Torres é uma aluna com possível TDAH.",
              tips: ["Estrutura e Previsibilidade...", "Âncoras de Foco Visual...", "Reforço Imediato..."]
            },
            targetVolume: {
              "Quadríceps e Adutores": 6,
              "Glúteos e Posteriores": 6,
              "Peito": 2,
              "Costas e Cintura Escapular": 3,
              "Ombro": 3,
              "Biceps": 1,
              "Triceps": 1,
              "Core e Abdomen": 8
            },
            microciclos: [
              {
                range: "Semana 1-2",
                focus: "ADAPTAÇÃO ANATÔMICA E ENGAJAMENTO",
                method: "Circuito Full Body",
                intensity: "Baixa (50-60% 1RM)",
                volume: "Médio (60% V.Max)",
                reps: "15-20 reps",
                weeklyVolume: "MMII: 12, MMSS: 10, Core: 8",
                notes: "Foco em estabilização do joelho e transições rápidas entre exercícios para manter o foco (TDAH)."
              },
              {
                range: "Semana 3-4",
                focus: "RESISTÊNCIA MUSCULAR LOCALIZADA",
                method: "Agonista-Antagonista (Superséries)",
                intensity: "Média (60-65% 1RM)",
                volume: "Alto (75% V.Max)",
                reps: "12-15 reps",
                weeklyVolume: "MMII: 14, MMSS: 12, Core: 10",
                notes: "Utilizar exercícios em cadeia cinética fechada para os membros inferiores visando proteção patelofemoral."
              },
              {
                range: "Semana 5-6",
                focus: "HIPERTROFIA FUNCIONAL",
                method: "Tri-sets Dinâmicos",
                intensity: "Média-Alta (65-75% 1RM)",
                volume: "Alto (85% V.Max)",
                reps: "10-12 reps",
                weeklyVolume: "MMII: 16, MMSS: 14, Core: 10",
                notes: "Manter alta densidade de treino (descansos curtos) para prender a atenção e elevar o gasto calórico."
              },
              {
                range: "Semana 7-8",
                focus: "CHOQUE METABÓLICO",
                method: "PHA (Peripheral Heart Action)",
                intensity: "Alta (70-80% 1RM)",
                volume: "Muito Alto (100% V.Max)",
                reps: "8-12 reps",
                weeklyVolume: "MMII: 18, MMSS: 16, Core: 12",
                notes: "Alternar exercícios de MMSS e MMII para manter a frequência cardíaca alta sem sobrecarregar os joelhos."
              },
              {
                range: "Semana 9-10",
                focus: "RECUPERAÇÃO ATIVA E FORÇA BASE",
                method: "Treino Tradicional + LISS",
                intensity: "Alta (80-85% 1RM)",
                volume: "Baixo (50% V.Max)",
                reps: "6-8 reps",
                weeklyVolume: "MMII: 10, MMSS: 10, Core: 6",
                notes: "Reduzir volume para recuperar articulações. Dar foco no fortalecimento de glúteos para estabilizar os joelhos."
              },
              {
                range: "Semana 11-12",
                focus: "POTÊNCIA E CONDICIONAMENTO",
                method: "Complexos com Halteres/Kettlebell",
                intensity: "Média-Alta (70-75% 1RM)",
                volume: "Médio-Alto (75% V.Max)",
                reps: "8-10 reps",
                weeklyVolume: "MMII: 14, MMSS: 12, Core: 10",
                notes: "Evitar saltos (pliometria). Focar na velocidade da fase concêntrica para recrutar fibras de contração rápida."
              },
              {
                range: "Semana 13-14",
                focus: "DENSIDADE MÁXIMA",
                method: "EMOM (Every Minute on the Minute)",
                intensity: "Alta (75-80% 1RM)",
                volume: "Alto (85% V.Max)",
                reps: "10-12 reps",
                weeklyVolume: "MMII: 16, MMSS: 14, Core: 12",
                notes: "O relógio dita o ritmo. Excelente estímulo gamificado para manter a motivação e foco do TDAH."
              },
              {
                range: "Semana 15-16",
                focus: "POLIMENTO E PICO METABÓLICO",
                method: "Circuitos AMRAP",
                intensity: "Média (65-75% 1RM)",
                volume: "Alto (90% V.Max)",
                reps: "12-15 reps",
                weeklyVolume: "MMII: 16, MMSS: 14, Core: 12",
                notes: "Reta final para completar as 100 sessões. Foco em manter o movimento constante com exercícios de baixo impacto."
              }
            ]
          },
          workouts: [
            {
              id: 'treino-a-liliane',
              title: 'TREINO A - Musculação',
              status: 'published',
              exercises: [
                { id: 'l-a-1', name: 'LEG PRESS horizontal', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-a-2', name: 'LEG PRESS horizontal unilateral', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-a-3', name: 'sentar e levantar do banco reto com HBC', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-a-4', name: 'cadeira extensora', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-a-5', name: 'crucifixo aberto com HBC no banco reto', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-a-6', name: 'abdução de ombros em pé com HBC', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-a-7', name: 'triceps em pé no CROSS com barra reta', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-a-8', name: 'abdominal supra no solo', sets: '3', reps: '15', rest: '45s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-b-liliane',
              title: 'TREINO B - Musculação',
              status: 'published',
              exercises: [
                { id: 'l-b-1', name: 'elevação do quadril no solo com sobrecarga', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-b-2', name: 'extensão de quadril em pé com caneleira', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-b-3', name: 'abdução de quadril em pé com caneleira', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-b-4', name: 'cadeira FLEXORA', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-b-5', name: 'remada fechada SUPINADA com barra reta em pé no CROSS na polia média', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-b-6', name: 'extensão de ombros em pé no CROSS barra reta polia alta', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-b-7', name: 'bíceps em pé no CROSS com barra reta', sets: '3', reps: '12', rest: '60s', executionType: 'Simples' },
                { id: 'l-b-8', name: 'flexão plantar em pé no solo livre', sets: '3', reps: '15', rest: '45s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-intervalado-confortavel',
              title: 'INTERVALADO (Confortável) - Seg/Sex',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'ex-aq-1', name: 'Aquecimento: Caminhada', sets: '1', reps: '10 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b1-1', name: 'Bloco 1: Corrida Leve / Caminhada', sets: '4', reps: '1:30 min / 1:30 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve permitir conversa fácil.' },
                { id: 'ex-tr-1', name: 'Transição: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b2-1', name: 'Bloco 2: Corrida Leve / Caminhada', sets: '4', reps: '1:30 min / 2:00 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve permitir conversa fácil.' },
                { id: 'ex-dq-1', name: 'Desaquecimento: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-intervalado-desconfortavel',
              title: 'INTERVALADO (Desconfortável) - Qua',
              projectedSessions: 10,
              frequencyWeekly: 1,
              status: 'published',
              exercises: [
                { id: 'ex-aq-2', name: 'Aquecimento: Caminhada', sets: '1', reps: '10 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b1-2', name: 'Bloco 1: Corrida Moderada/Forte / Caminhada', sets: '4', reps: '1:30 min / 1:30 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve ser desafiador, dificultando a fala durante o tiro.' },
                { id: 'ex-tr-2', name: 'Transição: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b2-2', name: 'Bloco 2: Corrida Moderada/Forte / Caminhada', sets: '4', reps: '1:30 min / 2:00 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve ser desafiador, dificultando a fala durante o tiro.' },
                { id: 'ex-dq-2', name: 'Desaquecimento: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-rodagem',
              title: 'RODAGEM - Ter/Qui',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'ex-rod-1', name: 'Caminhada Contínua a 5,5 km/h', sets: '1', reps: '50 min', rest: '0s', executionType: 'Simples' }
              ]
            }
          ]
        },
        { 
          id: 'fixed-andre', 
          nome: 'André Brito', 
          email: 'andrevictorbritodeandrade@gmail.com', 
          photoUrl: 'https://image.pollinations.ai/prompt/Disney%20style%203d%20animation%20of%20a%20black%20man%20named%20André%20Brito%2C%20full%20beard%2C%20round%20glasses%2C%20wearing%20a%20safari%20hat%20and%20leopard%20print%20shirt%2C%20standing%20in%20a%20colorful%20colonial%20street?width=400&height=400&nologo=true',
          age: 36,
          weight: 103,
          height: 180,
          goal: 'health',
          medicalHistory: '⚠️ Patela esquerda já saiu do lugar 4 vezes em um intervalo de 14 meses.',
          medications: 'BUP, Venvanse, Vitaminas bariátricas, Topiramato, Sertralina',
          physicalAssessments: [], 
          workoutHistory: [
            {
              id: 'hist-andre-run-01',
              workoutId: 'andre-workout-0',
              name: 'Intervalado',
              athleteName: 'André Brito',
              duration: '32 min',
              date: '22/03/2026',
              timestamp: 1742601600000,
              type: 'RUNNING',
              runningStats: {
                distance: 4.5,
                duration: '32 min',
                avgPace: "7'06\"",
                avgHR: 142,
                calories: 380
              }
            },
            {
              id: 'hist-andre-04',
              workoutId: 'treino-b-andre',
              name: 'TREINO B',
              athleteName: 'André Brito',
              duration: '50 min',
              date: '12/03/2026',
              timestamp: 1741795200000,
              type: 'STRENGTH'
            },
            {
              id: 'hist-andre-03',
              workoutId: 'treino-b-andre',
              name: 'TREINO B',
              athleteName: 'André Brito',
              duration: '55 min',
              date: '10/03/2026',
              timestamp: 1741622400000,
              type: 'STRENGTH'
            },
            {
              id: 'hist-andre-02',
              workoutId: 'treino-a-andre',
              name: 'TREINO A',
              athleteName: 'André Brito',
              duration: '58 min',
              date: '11/03/2026',
              timestamp: 1741708800000,
              type: 'STRENGTH'
            },
            {
              id: 'hist-andre-01',
              workoutId: 'treino-a-andre',
              name: 'TREINO A',
              athleteName: 'André Brito',
              duration: '60 min',
              date: '09/03/2026',
              timestamp: 1741536000000,
              type: 'STRENGTH'
            }
          ], 
          analytics: {
            sessionsCompleted: 4,
            streakDays: 2,
            exercises: {
              'Remada aberta na máquina': { completed: 1, skipped: 0 },
              'Puxada aberta com barra romana pulley alto': { completed: 1, skipped: 0 },
              'Voador dorsal': { completed: 1, skipped: 0 },
              'Bíceps neutro com HBC banco 75 graus': { completed: 1, skipped: 0 },
              'Bíceps em pé com HBM pegada supinada': { completed: 1, skipped: 0 },
              'Agachamento sumô com HBC': { completed: 1, skipped: 0 },
              'Subida no step': { completed: 1, skipped: 0 },
              'Extensão de quadril e joelho em pé no cross': { completed: 1, skipped: 0 },
              'Mata-borrão isométrico no solo (super-man)': { completed: 1, skipped: 0 }
            } as Record<string, { completed: number; skipped: number }>,
            lastSessionDate: '12/03/2026'
          },
          sexo: 'Masculino', 
          periodization: {
            id: 'per-andre-01',
            titulo: 'Periodização Científica',
            startDate: '2026-03-09T16:00:06',
            type: 'STRENGTH',
            phaseTitle: 'Mesociclo de Recomposição Corporal, Mitigação de Sarcopenia Pós-Bariátrica e Estabilização Patelofemoral - 12 Semanas',
            generalStrategy: "O perfil do aluno Andre apresenta alta complexidade fisiologica devido ao status pos-cirurgia bariatrica, demandando foco absoluto na mitigacao da sarcopenia (retencao de massa magra) e estimulo a sintese proteica para suportar o deficit calorico continuo rumo aos 87kg. A instabilidade patelar cronica (4 luxacoes) exige prescricao biomecanica restritiva, priorizando o fortalecimento do Vasto Medial Obliquo (VMO) e gluteo medio em cadeia cinetica fechada para realinhamento patelofemoral. O espectro autista (TEA) combinado ao TDAH sugere a necessidade de previsibilidade macroestrutural ambiental para conforto cognitivo, aliada a microvariacoes nos estimulos (gamificacao de carga e metodo) para engajamento dopaminergico continuo.",
            clinicalSafety: [
              "Biomecanica Patelar: Substituir Cadeira Extensora tradicional com arco completo de movimento por variacoes em cadeia cinetica fechada (Leg Press com pes altos, Box Squat, Step-ups controlados) para reduzir forcas de cisalhamento. Fortalecimento de abdutores e rotadores externos do quadril e fundamental para evitar o valgo dinamico.",
              "Fisiologia Pos-Bariatrica: Risco elevado de perda de densidade ossea, malabsorcao e sarcopenia. A hidratacao intra-treino deve ocorrer em pequenos goles constantes (100ml a cada 15 min) para evitar distensao gastrica ou dumping. Garantir com a equipe de nutricao aporte proteico peri-treino adequado.",
              "Neurodivergencia (TEA e TDAH): Manter a ordem geral dos exercicios estritamente identica para evitar ansiedade antecipatoria (TEA), mas estipular quebra de micro-recordes (PRs de carga, repeticao ou qualidade de movimento) para garantir o pico de dopamina necessario ao foco (TDAH). Considerar o uso de fones com cancelamento de ruido para isolamento sensorial no ambiente de academia.",
              "Recuperacao e Sono: O aluno necessita de higiene do sono rigorosa, pois o deficit calorico somado ao choque neuromuscular exigira otimizacao do GH e testosterona liberados predominantemente nas fases de sono profundo, cruciais para a manutencao da massa magra pos-bariatrica."
            ],
            bioInsight: {
              context: "Referências Científicas: Schoenfeld, B. J. (2010). The mechanisms of muscle hypertrophy and their application to resistance training. Journal of Strength and Conditioning Research, 24(10), 2857-2872. | Escamilla, R. F., et al. (2009). Patellofemoral joint kinematics and kinetics during common lower extremity exercises. Sports Medicine, 39(1), 15-37. | Mechanick, J. I., et al. (2020). Clinical Practice Guidelines for the Perioperative Nutrition, Metabolic, and Nonsurgical Support of Patients Undergoing Bariatric Procedures. Surgery for Obesity and Related Diseases, 16(2), 175-247. | Ratey, J. J. (2008). Spark: The Revolutionary New Science of Exercise and the Brain. Little, Brown Spark. (Mecanismos neurobiologicos do exercicio no TDAH e TEA).",
              tips: []
            },
            targetVolume: {
              "Peito": 11,
              "Costas e Cintura Escapular": 11,
              "Ombro": 11,
              "Biceps": 11,
              "Triceps": 11,
              "Quadríceps e Adutores": 11,
              "Glúteos e Posteriores": 11,
              "Core e Abdomen": 11
            },
            microciclos: [
              {
                id: 'm1',
                semanas: '1-3',
                titulo: 'ADAPTAÇÃO ANATÔMICA, ESTABILIDADE ARTICULAR E CONTROLE MOTOR',
                metodo: 'Tempo Training (Cadência 4010)',
                intensidade: '60-65% 1RM | RIR 3-4 | PSE 6',
                volume: '10-12 series/musculo/semana | 12-15 repeticoes',
                descricao: 'Obs: Foco na fase excentrica para adaptacao tendinea. Evitar flexao de joelho alem de 90 graus. Nos exercicios de extensao de joelho, utilizar apenas isometria nos 15 graus finais (terminal knee extension) para ativação específica de VMO sem cisalhamento excessivo. Ambiente de treino deve ser previsivel.'
              },
              {
                id: 'm2',
                semanas: '4-6',
                titulo: 'HIPERTROFIA MIOFIBRILAR E DENSIDADE DE TREINO',
                metodo: 'Superseries Agonista-Antagonista',
                intensidade: '70-75% 1RM | RIR 2 | PSE 7-8',
                volume: '12-14 series/musculo/semana | 8-12 repeticoes',
                descricao: 'Obs: Progressao de carga linear. Uso de superseries para otimizar a sessao de 60 min, mantendo a frequencia cardiaca elevada (potencializando oxidacao lipidica). Fornecer feedbacks claros e objetivos (TEA). Monitorar fadiga abrupta e sinais de hipoglicemia reativa comum em pacientes bariatricos.'
              },
              {
                id: 'm3',
                semanas: '7-9',
                titulo: 'FORÇA SUBMÁXIMA E RESISTÊNCIA METABÓLICA',
                metodo: 'Cluster Sets (Superiores) e Circuito Fechado (Inferiores)',
                intensidade: '80-85% 1RM | RIR 1-2 | PSE 8-9',
                volume: '14-16 series/musculo/semana | 4-6 repeticoes (Cluster) e 15-20 (Circuito)',
                descricao: 'Obs: Uso de Agachamento em Caixa (Box Squat) para garantir bloqueio biomecanico de amplitude e confianca na estabilidade patelar. O metodo Cluster Set permite o uso de cargas mais altas mantendo alta qualidade de execucao, fracionando a serie para modular o deficit de atencao (TDAH) atraves de pequenas metas sequenciais.'
              },
              {
                id: 'm4',
                semanas: '10-12',
                titulo: 'CHOQUE METABÓLICO E MAXIMIZADO DE EPOC',
                metodo: 'Rest-Pause',
                intensidade: '75-80% 1RM | RIR 0-1 | PSE 9-10',
                volume: '16-18 series/semana (Sem. 10-11) e 10 series (Sem. 12)',
                descricao: 'Obs: Elevacao do estresse metabolico para maximizar o Consumo Excessivo de Oxigenio Pos-Exercicio (EPOC). Semana 12 servira como Tapering (reducao de 40% do volume) para dissipar fadiga acumulada e consolidar a recomposicao corporal. Atencao redobrada a tecnica sob fadiga para protecao patelofemoral.'
              }
            ]
          },
          faseAjusteA: 1,
          faseAjusteB: 0,
          totalGlobalA: 6,
          totalGlobalB: 5,
          workouts: [
            {
              id: 'treino-intervalado-confortavel',
              title: 'INTERVALADO (Confortável) - Seg/Sex',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'ex-aq-1', name: 'Aquecimento: Caminhada', sets: '1', reps: '10 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b1-1', name: 'Bloco 1: Corrida Leve / Caminhada', sets: '4', reps: '1:30 min / 1:30 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve permitir conversa fácil.' },
                { id: 'ex-tr-1', name: 'Transição: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b2-1', name: 'Bloco 2: Corrida Leve / Caminhada', sets: '4', reps: '1:30 min / 2:00 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve permitir conversa fácil.' },
                { id: 'ex-dq-1', name: 'Desaquecimento: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-intervalado-desconfortavel',
              title: 'INTERVALADO (Desconfortável) - Qua',
              projectedSessions: 10,
              frequencyWeekly: 1,
              status: 'published',
              exercises: [
                { id: 'ex-aq-2', name: 'Aquecimento: Caminhada', sets: '1', reps: '10 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b1-2', name: 'Bloco 1: Corrida Moderada/Forte / Caminhada', sets: '4', reps: '1:30 min / 1:30 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve ser desafiador, dificultando a fala durante o tiro.' },
                { id: 'ex-tr-2', name: 'Transição: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b2-2', name: 'Bloco 2: Corrida Moderada/Forte / Caminhada', sets: '4', reps: '1:30 min / 2:00 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve ser desafiador, dificultando a fala durante o tiro.' },
                { id: 'ex-dq-2', name: 'Desaquecimento: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-rodagem',
              title: 'RODAGEM - Ter/Qui',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'ex-rod-1', name: 'Caminhada Contínua a 5,5 km/h', sets: '1', reps: '50 min', rest: '0s', executionType: 'Simples' }
              ]
            }
          ]
        }, 
        { 
          id: 'fixed-marcelly', 
          nome: 'Marcelly Bispo', 
          email: 'marcellybispo92@gmail.com', 
          photoUrl: 'https://image.pollinations.ai/prompt/Disney%20style%203d%20animation%20of%20a%20black%20woman%20named%20Marcelly%20Bispo%2C%20voluminous%20curly%20afro%20hair%2C%20wearing%20a%20yellow%20leopard%20print%20one-shoulder%20top%20and%20skirt%2C%20standing%20in%20a%20colorful%20Brazilian%20colonial%20street?width=400&height=400&nologo=true',
          age: 34,
          weight: 60,
          height: 167,
          goal: 'health',
          medicalHistory: '⚠️ Nada',
          medications: 'Nada',
          physicalAssessments: [], 
          workoutHistory: [
            {
              id: 'hist-marcelly-03',
              workoutId: 'w-marcelly-02',
              name: 'Treino B',
              athleteName: 'Marcelly Bispo',
              duration: '50 min',
              date: '10/03/2026',
              timestamp: 1741622400000,
              type: 'STRENGTH'
            },
            {
              id: 'hist-marcelly-02',
              workoutId: 'w-marcelly-01',
              name: 'Treino A',
              athleteName: 'Marcelly Bispo',
              duration: '52 min',
              date: '11/03/2026',
              timestamp: 1741708800000,
              type: 'STRENGTH'
            },
            {
              id: 'hist-marcelly-01',
              workoutId: 'w-marcelly-01',
              name: 'Treino A',
              athleteName: 'Marcelly Bispo',
              duration: '60 min',
              date: '09/03/2026',
              timestamp: 1741536000000,
              type: 'STRENGTH'
            }
          ], 
          analytics: {
            sessionsCompleted: 3,
            streakDays: 1,
            exercises: {},
            lastSessionDate: '11/03/2026'
          },
          sexo: 'Feminino',
          periodization: {
            id: 'per-marcelly-01',
            titulo: 'Periodização Científica',
            startDate: '2026-03-03T21:59:08',
            type: 'STRENGTH',
            phaseTitle: 'Macrociclo de Hipertrofia Progressiva e Choque Tensional - 12 Semanas',
            generalStrategy: "A periodização de Marcelly foca no ganho de 2kg de massa muscular limpa (hipertrofia) otimizando uma janela de 60 minutos diários, 5 vezes por semana. A fisiologia da hipertrofia exige tensão mecânica, estresse metabólico e dano muscular. O plano utiliza uma Periodização Ondulatória para garantir estímulos constantes. Considerando o quadro suspeito de TDAH, o treinamento foi estruturado com alta densidade, métodos avançados dinâmicos e pausas ativas ou curtas para manter altos níveis de dopamina e noradrenalina, otimizando o engajamento cognitivo e o foco durante as sessões.",
            clinicalSafety: [
              "Nutrição e Composição Corporal: Para atingir a meta de +2kg de massa magra, é indispensável dieta hipercalórica leve (+200 a 300kcal/dia) com ingestão proteica entre 1.8g/kg e 2.2g/kg.",
              "Manejo do TDAH (Suspeito): Evitar pausas longas e passivas. Substituir por descansos ativos (alongamentos leves, mobilidade) ou métodos de alta densidade para manter a estimulação dopaminérgica contínua. Fones de ouvido com música estimulante são altamente recomendados.",
              "Recuperação e Modulação do Estresse: Atenção rigorosa à higiene do sono (mínimo de 7-8h). O sono de qualidade é crucial para a liberação noturna de GH, testosterona e reparo do dano muscular.",
              "Biomecânica: Focar em amplitude completa de movimento (ADM) e controle da cadência (ex: 3 segundos na fase excêntrica) para maximizar o tempo sob tensão sem sobrecarregar as articulações com cargas excessivas."
            ],
            bioInsight: {
              context: "Embasamento Científico: Schoenfeld, B. J. (2010). The mechanisms of muscle hypertrophy and their application to resistance training. Journal of Strength and Conditioning Research, 24(10), 2857-2872. | American College of Sports Medicine (ACSM) (2009). Progression Models in Resistance Training for Healthy Adults. Medicine & Science in Sports & Exercise, 41(3), 687-708. | Ratey, J. J. (2008). Spark: The Revolutionary New Science of Exercise and the Brain. Little, Brown Spark.",
              tips: [
                "Semanas 1-4: Adaptação Anatômica e Hipertrofia Base. Intensidade: 70-75% 1RM (RIR 2-3). Volume: 12-14 séries semanais por grupamento, 8-12 repetições. Método: Pirâmide crescente e drop-sets eventuais.",
                "Semanas 5-8: Tensão Mecânica e Hipertrofia Miofibrilar. Intensidade: 80-85% 1RM (RIR 1-2). Volume: 14-16 séries semanais por grupamento, 6-8 repetições. Método: Rest-Pause (Pausa-Descanso).",
                "Semanas 9-11: Estresse Metabólico e Overreaching Funcional. Intensidade: 65-75% 1RM (RIR 0 - Falha Momentânea). Volume: 18-20 séries semanais por grupamento, 12-15 repetições. Método: Bi-sets agonista-antagonista e cluster sets.",
                "Semana 12: Supercompensação e Dissipação de Fadiga (Deload). Intensidade: 50-60% 1RM (RIR 3-4). Volume: 8-10 séries semanais por grupamento, 10-12 repetições. Método: Séries tradicionais com foco em conexão mente-músculo."
              ]
            },
            targetVolume: {
              "Peito": 13,
              "Costas e Cintura Escapular": 13,
              "Ombro": 13,
              "Biceps": 13,
              "Triceps": 13,
              "Quadríceps e Adutores": 13,
              "Glúteos e Posteriores": 13,
              "Core e Abdomen": 13
            },
            microciclos: [
              {
                id: 'm1',
                semanas: '1-4',
                titulo: 'ADAPTAÇÃO ANATÔMICA E HIPERTROFIA BASE',
                intensidade: '70-75% 1RM (RIR 2-3)',
                volume: '12-14 SÉRIES SEMANAIS POR GRUPAMENTO, 8-12 REPETIÇÕES',
                metodo: 'PIRÂMIDE CRESCENTE E DROP-SETS EVENTUAIS',
                descricao: 'Sessões estruturadas para focar em grupos específicos dentro de 60 minutos. Ritmo dinâmico para evitar dispersão atencional.'
              },
              {
                id: 'm2',
                semanas: '5-8',
                titulo: 'TENSÃO MECÂNICA E HIPERTROFIA MIOFIBRILAR',
                intensidade: '80-85% 1RM (RIR 1-2)',
                volume: '14-16 SÉRIES SEMANAIS POR GRUPAMENTO, 6-8 REPETIÇÕES',
                metodo: 'REST-PAUSE (PAUSA-DESCANSO)',
                descricao: 'Excelente para traços de TDAH, pois o tempo de descanso é curtíssimo (10-15s), mantendo o sistema nervoso central em alerta e encurtando o tempo da sessão.'
              },
              {
                id: 'm3',
                semanas: '9-11',
                titulo: 'ESTRESSE METABÓLICO E OVERREACHING FUNCIONAL',
                intensidade: '65-75% 1RM (RIR 0 - FALHA MOMENTÂNEA)',
                volume: '18-20 SÉRIES SEMANAIS POR GRUPAMENTO, 12-15 REPETIÇÕES',
                metodo: 'BI-SETS AGONISTA-ANTAGONISTA E CLUSTER SETS',
                descricao: 'Aumenta drasticamente o fluxo sanguíneo (pump) e economiza tempo. Transições rápidas sustentam o foco mental de indivíduos neurodivergentes.'
              },
              {
                id: 'm4',
                semanas: '12',
                titulo: 'SUPERCOMPENSAÇÃO E DISSIPAÇÃO DE FADIGA (DELOAD)',
                intensidade: '50-60% 1RM (RIR 3-4)',
                volume: '8-10 SÉRIES SEMANAIS POR GRUPAMENTO, 10-12 REPETIÇÕES',
                metodo: 'SÉRIES TRADICIONAIS COM FOCO EM CONEXÃO MENTE-MÚSCULO',
                descricao: 'Redução do estresse sistêmico para permitir a regeneração tecidual e consolidação dos ganhos hipertróficos projetados (2kg).'
              }
            ]
          },
          faseAjusteA: 1,
          faseAjusteB: 0,
          totalGlobalA: 6,
          totalGlobalB: 5,
          workouts: [
            {
              id: 'treino-intervalado-confortavel',
              title: 'INTERVALADO (Confortável) - Seg/Sex',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'ex-aq-1', name: 'Aquecimento: Caminhada', sets: '1', reps: '10 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b1-1', name: 'Bloco 1: Corrida Leve / Caminhada', sets: '4', reps: '1:30 min / 1:30 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve permitir conversa fácil.' },
                { id: 'ex-tr-1', name: 'Transição: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b2-1', name: 'Bloco 2: Corrida Leve / Caminhada', sets: '4', reps: '1:30 min / 2:00 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve permitir conversa fácil.' },
                { id: 'ex-dq-1', name: 'Desaquecimento: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-intervalado-desconfortavel',
              title: 'INTERVALADO (Desconfortável) - Qua',
              projectedSessions: 10,
              frequencyWeekly: 1,
              status: 'published',
              exercises: [
                { id: 'ex-aq-2', name: 'Aquecimento: Caminhada', sets: '1', reps: '10 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b1-2', name: 'Bloco 1: Corrida Moderada/Forte / Caminhada', sets: '4', reps: '1:30 min / 1:30 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve ser desafiador, dificultando a fala durante o tiro.' },
                { id: 'ex-tr-2', name: 'Transição: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b2-2', name: 'Bloco 2: Corrida Moderada/Forte / Caminhada', sets: '4', reps: '1:30 min / 2:00 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve ser desafiador, dificultando a fala durante o tiro.' },
                { id: 'ex-dq-2', name: 'Desaquecimento: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-rodagem',
              title: 'RODAGEM - Ter/Qui',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'ex-rod-1', name: 'Caminhada Contínua a 5,5 km/h', sets: '1', reps: '50 min', rest: '0s', executionType: 'Simples' }
              ]
            }
          ]
        }
    ], []);

  useEffect(() => {
    let unsub: () => void;
    
    // Se a autenticação ainda não estiver pronta, esperamos.
    // Mas se estiver pronta, prosseguimos mesmo sem usuário (user === null)
    // pois as regras do Firestore para 'students' são públicas (allow read, write: if true)
    if (!authReady && view !== 'LOGIN') {
      return;
    }

    // Safety timeout for student loading
    const studentLoadTimeout = setTimeout(() => {
      if (view !== 'LOGIN' && !selectedStudent && view !== 'PROFESSOR_DASH' && view !== 'COACH_AI' && view !== 'SETTINGS' && view !== 'FEED' && view !== 'CORRE_RJ') {
          console.warn("Student loading timed out, redirecting...");
          if (isCoach) {
              setView('PROFESSOR_DASH');
          } else {
              setView('LOGIN');
              localStorage.removeItem('elite_session_v2');
              delete (window as any)._tempStudentId;
          }
      }
    }, 8000);

    if (view !== 'LOGIN' && isCoach) {
      console.log('Tentando buscar dados de alunos (Coach)...');
      const path = `artifacts/${appId}/public/data/students`;
      const q = collection(db, path);
      
      // Timeout para carregamento de dados
      const dataTimeout = setTimeout(() => {
        if (students.length === 0) {
          console.warn("Timeout ao buscar dados de alunos (Coach).");
          setDbError("Erro ao conectar ao banco. Verifique as Regras de Segurança.");
          setLoading(false);
        }
      }, 5000);

      try {
        unsub = onSnapshot(q, (snapshot) => {
          clearTimeout(dataTimeout);
          setDbError(null);
          if (snapshot.metadata.hasPendingWrites) {
            setSyncStatus('syncing');
          } else {
            setSyncStatus(prev => prev === 'syncing' ? 'synced' : prev);
          }
          const updatedStudents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
          console.log("Updated Students:", updatedStudents);
          setStudents(updatedStudents);
          // Atualiza o aluno selecionado em tempo real se ele estiver aberto
          if (selectedStudent) {
            const current = updatedStudents.find(s => s.id === selectedStudent.id);
            if (current) setSelectedStudent(current);
          }
          // Restauração de aluno selecionado após refresh
          if ((window as any)._tempStudentId && !selectedStudent) {
              const saved = updatedStudents.find(s => s.id === (window as any)._tempStudentId);
              if (saved) {
                  setSelectedStudent(saved);
                  // Limpa flag
                  delete (window as any)._tempStudentId;
              }
          }
        }, (error) => {
          if (error.code === 'permission-denied') {
            console.warn("Permissão negada ao buscar estudantes. Verifique se o usuário está logado e tem permissão.");
            setDbError("Acesso restrito. Por favor, faça login novamente.");
          } else {
            handleFirestoreError(error, OperationType.GET, path);
          }
        });
      } catch (e) {
        console.error("Erro ao iniciar listener de estudantes:", e);
      }
    } else if (view !== 'LOGIN' && !isCoach) {
      // Se tivermos um ID temporário restaurado ou um estudante já selecionado
      const targetId = selectedStudent?.id || (window as any)._tempStudentId;
      if (!targetId) {
          setView('LOGIN');
          localStorage.removeItem('elite_session_v2');
          return;
      }

      console.log(`Tentando buscar dados do aluno ${targetId}...`);
      const path = `artifacts/${appId}/public/data/students/${targetId}`;
      const docRef = doc(db, path);

      // Timeout para carregamento de dados do aluno
      const dataTimeout = setTimeout(() => {
        if (!studentForView) {
          console.warn("Timeout ao buscar dados do aluno.");
          setDbError("Erro ao conectar ao banco. Verifique as Regras de Segurança.");
          setLoading(false);
        }
      }, 5000);

      try {
        unsub = onSnapshot(docRef, async (docSnap) => {
          clearTimeout(dataTimeout);
          if (docSnap.metadata.hasPendingWrites) {
            setSyncStatus('syncing');
          } else {
            setSyncStatus(prev => prev === 'syncing' ? 'synced' : prev);
          }
          if (docSnap.exists()) {
              const rawData = { id: docSnap.id, ...docSnap.data() } as Student;
              
              // --- MERGE COM DADOS PADRÃO (FIX PARA ALUNO) ---
              const defaultProfile = defaultStudentsData.find(d => d.id === rawData.id || (d.email && rawData.email && d.email.toLowerCase() === rawData.email.toLowerCase()));
              
              if (defaultProfile) {
                  if (!rawData.nome) rawData.nome = defaultProfile.nome;
                  if (!rawData.email) rawData.email = defaultProfile.email;
                  if (!rawData.periodization && defaultProfile.periodization) {
                      rawData.periodization = defaultProfile.periodization;
                  } else if (rawData.periodization && defaultProfile.periodization) {
                      rawData.periodization!.targetVolume = defaultProfile.periodization.targetVolume;
                  }

                  // Se o aluno não tiver treinos, adiciona os padrões
                  if (!rawData.workouts || rawData.workouts.length === 0) {
                      rawData.workouts = defaultProfile.workouts;
                  }
                  
                  // Se o aluno não tiver histórico, adiciona o padrão (apenas se for um aluno fixo que nunca treinou)
                  if (!rawData.workoutHistory || rawData.workoutHistory.length === 0) {
                      rawData.workoutHistory = defaultProfile.workoutHistory;
                  }

                  // Se o aluno não tiver analytics, adiciona o padrão
                  if (!rawData.analytics) {
                      rawData.analytics = defaultProfile.analytics;
                  }
              }
              
              // --- ONE-TIME FIX FOR ANDRE'S WORKOUT HISTORY ---
              if (rawData.id === 'fixed-andre') {
                  const history = rawData.workoutHistory || [];
                  const treinoA = history.filter(h => h.name === 'TREINO A').length;
                  const treinoB = history.filter(h => h.name === 'TREINO B').length;
                  let updated = false;
                  if (treinoA < 4) {
                      for (let i = treinoA; i < 4; i++) {
                          history.push({
                              id: `fixed-andre-a-${i}-${Date.now()}`,
                              workoutId: 'treino-a-andre',
                              name: 'TREINO A',
                              athleteName: 'André Brito',
                              duration: '60 min',
                              date: `2${i}/03/2026`,
                              timestamp: 1741536000000 + i * 86400000,
                              type: 'STRENGTH'
                          });
                      }
                      updated = true;
                  }
                  if (treinoB < 4) {
                      for (let i = treinoB; i < 4; i++) {
                          history.push({
                              id: `fixed-andre-b-${i}-${Date.now()}`,
                              workoutId: 'treino-b-andre',
                              name: 'TREINO B',
                              athleteName: 'André Brito',
                              duration: '60 min',
                              date: `2${i}/03/2026`,
                              timestamp: 1741536000000 + i * 86400000,
                              type: 'STRENGTH'
                          });
                      }
                      updated = true;
                  }
                  if (updated) {
                      rawData.workoutHistory = history;
                      const docRef = doc(db, path);
                      try {
                          await setDoc(docRef, { workoutHistory: history }, { merge: true });
                      } catch (e) {
                          handleFirestoreError(e, OperationType.WRITE, path);
                      }
                  }
              }
              
              setSelectedStudent(rawData);
              
              // Restaurar Treino em Andamento se necessário
              if ((window as any)._tempWorkoutId && rawData.workouts) {
                 const w = rawData.workouts.find(w => w.id === (window as any)._tempWorkoutId);
                 if (w) setSelectedWorkout(w); // Isso fará a UI renderizar o componente correto se a view for WORKOUTS
                 delete (window as any)._tempWorkoutId;
              }
          } else {
              // Se não existe no banco, verifica se é um aluno padrão
              const defaultProfile = defaultStudentsData.find(d => d.id === targetId);
              if (defaultProfile) {
                  setSelectedStudent(defaultProfile);
              } else {
                  // Se não for padrão e não estiver no banco, volta pro login
                  setView('LOGIN');
                  localStorage.removeItem('elite_session_v2');
              }
          }
        }, (error) => {
          if (error.code === 'permission-denied') {
            console.warn("Permissão negada ao buscar dados do aluno. Verifique se o usuário está logado.");
            setDbError("Acesso restrito. Por favor, faça login novamente.");
          } else {
            handleFirestoreError(error, OperationType.GET, path);
          }
        });
      } catch (e) {
        console.error("Erro ao iniciar listener do aluno:", e);
      }
    }
    return () => { 
      if (unsub) unsub(); 
      clearTimeout(studentLoadTimeout);
    };
  }, [authReady, view, selectedStudent?.id, isCoach, defaultStudentsData]);

  const allStudentsForCoach = useMemo(() => {
    // 1. Começamos com os alunos vindos do Firestore (students)
    const merged = [...students];

    // 2. Para cada aluno padrão, verificamos se ele já existe nos dados do Firestore
    defaultStudentsData.forEach(def => {
        const existingIndex = merged.findIndex(s => s.id === def.id || (s.email && s.email.toLowerCase() === def.email.toLowerCase()));
        
        if (existingIndex === -1) {
            // Se não existe no banco, adiciona o padrão completo
            merged.push(def);
        } else {
            // Se já existe, PRESERVAMOS os dados do banco.
            const existing = merged[existingIndex];
            
            if (!existing.nome) merged[existingIndex].nome = def.nome;
            if (!existing.email) merged[existingIndex].email = def.email;
            if (!existing.photoUrl && def.photoUrl) merged[existingIndex].photoUrl = def.photoUrl;
            
            if (!existing.periodization && def.periodization) {
                merged[existingIndex].periodization = def.periodization;
            } else if (existing.periodization && def.periodization && merged[existingIndex].periodization) {
                merged[existingIndex].periodization!.targetVolume = def.periodization.targetVolume;
            }

            // Se o aluno não tiver treinos, adiciona os padrões
            if (!existing.workouts || existing.workouts.length === 0) {
                merged[existingIndex].workouts = def.workouts;
            }
            
            // Se o aluno não tiver histórico, adiciona o padrão (apenas se for um aluno fixo que nunca treinou)
            if (!existing.workoutHistory || existing.workoutHistory.length === 0) {
                merged[existingIndex].workoutHistory = def.workoutHistory;
            }

            // Se o aluno não tiver analytics, adiciona o padrão
            if (!existing.analytics) {
                merged[existingIndex].analytics = def.analytics;
            }
        }
    });

    // Ordenação alfabética
    return merged.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }, [students, defaultStudentsData]);

  const studentForView = useMemo(() => {
    if (!selectedStudent) return null;
    if (isCoach) return selectedStudent;
    // O aluno vê o que está selecionado (que vem do banco ou do merge)
    return selectedStudent;
  }, [selectedStudent, view, isCoach]);

  // --- 3. CONTROLE DE VOLTAR (HARDWARE BACK BUTTON) ---
  const handleBackNavigation = () => {
      // Se for professor
      if (isCoach) {
          if (view === 'WORKOUT_EDITOR' || view === 'PERIODIZATION' || view === 'COACH_ASSESSMENT' || view === 'RUNTRACK_MANAGER' || view === 'ANALYTICS_COACH' || view === 'WORKOUT_HISTORY') {
              setView('STUDENT_MGMT');
          } else if (view === 'STUDENT_MGMT') {
              setView('PROFESSOR_DASH');
              setSelectedStudent(null);
          } else if (view === 'PROFESSOR_DASH') {
              // Já está na home do professor
          } else {
              setView('PROFESSOR_DASH'); // Fallback seguro
          }
      } 
      // Se for aluno
      else {
          // Se estiver em qualquer sub-menu, volta pro Dashboard
          if (view !== 'DASHBOARD' && view !== 'LOGIN') {
              setView('DASHBOARD');
          } else if (view === 'DASHBOARD' && isSidebarOpen) {
              setIsSidebarOpen(false);
          }
      }
  };

  useEffect(() => {
    // Adiciona um estado ao histórico sempre que a visualização muda (se não for login)
    if (view !== 'LOGIN') {
        window.history.pushState({ view }, '');
    }

    const onPopState = (event: PopStateEvent) => {
        // Intercepta o evento "Voltar" do navegador/Android
        event.preventDefault();
        
        if (view === 'LOGIN') return;

        // Lógica inteligente de voltar
        if (isCoach) {
            if (view === 'PROFESSOR_DASH') {
                // Se estiver na raiz, permite (ou segura, dependendo da UX desejada. Aqui seguramos para nao sair sem querer)
                // window.history.back(); // Descomente para permitir sair
            } else {
                handleBackNavigation();
            }
        } else {
            if (view === 'DASHBOARD') {
                // Raiz do aluno
            } else {
                handleBackNavigation();
            }
        }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [view, isCoach, isSidebarOpen]);


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
    if (!studentForView) return [];
    const notifications: AppNotification[] = [];
    const history = studentForView.workoutHistory || [];
    studentForView.workouts?.forEach(w => {
      const completed = history.filter(h => h.workoutId === w.id || h.name === w.title).length;
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
  }, [studentForView]);

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
    setSyncStatus('syncing');
    const path = `artifacts/${appId}/public/data/students/${sid}`;
    try { 
      const docRef = doc(db, path);
      await setDoc(docRef, { ...data, lastUpdateTimestamp: Date.now() }, { merge: true });
      // O syncStatus voltará a 'synced' automaticamente via onSnapshot quando a escrita confirmar
    } catch (e: any) { 
      setSyncStatus('offline');
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleAddPost = async (post: WorkoutHistoryEntry) => {
    if (!studentForView) return;
    const currentHistory = studentForView.workoutHistory || [];
    const updatedHistory = [post, ...currentHistory];
    await handleSaveData(studentForView.id, { workoutHistory: updatedHistory });
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

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
      <Loader2 className="animate-spin text-red-600 mb-6" size={48} />
      <p className="text-xs font-black uppercase tracking-[0.3em] mb-8">Iniciando ABFIT...</p>
      <button 
        onClick={resetApp}
        className="px-6 py-2 border border-white/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
      >
        Resetar Aplicativo
      </button>
    </div>
  );

  const showSidebar = view !== 'LOGIN';
  
  // DEFINIÇÃO DOS BOTÕES DO DASHBOARD DO ALUNO
  // Filtramos aqui com base em studentForView.disabledFeatures
  const allDashboardItems = [
    { id: 'WORKOUTS', label: 'Planilhas Ativas', icon: Dumbbell, color: 'orange' },
    { id: 'RUNTRACK_STUDENT', label: 'ABFIT RUN', icon: Footprints, color: 'rose' },
    { id: 'STUDENT_PERIODIZATION', label: 'Periodização Mestre', icon: Brain, color: 'indigo' },
    { id: 'STUDENT_ASSESSMENT', label: 'Avaliação Física', icon: Ruler, color: 'emerald' },
    { id: 'CORRE_RJ', label: 'Corre RJ 2026', icon: MapPin, color: 'yellow' },
    { id: 'FEED', label: 'Feed Performance', icon: Layout, color: 'red' },
    { id: 'ANALYTICS', label: 'Análise de Dados', icon: BarChart3, color: 'blue' },
    { id: 'ABOUT_ABFIT', label: 'Sobre a ABFIT', icon: Info, color: 'zinc' }
  ];

  const visibleDashboardItems = allDashboardItems.filter(item => {
    // Se o aluno não tiver a lista de disabledFeatures, mostra tudo.
    // Se tiver, esconde se o ID estiver na lista.
    return !studentForView?.disabledFeatures?.includes(item.id);
  });

  return (
    <ErrorBoundary>
      <BackgroundWrapper>
        <GlobalSyncIndicator status={syncStatus} />
        
        {showSidebar && (
          <SideNav 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            activeView={view} 
            onNavigate={setView}
            isProfessor={isCoach}
            userPhoto={studentForView?.photoUrl}
          />
        )}

        <main className="transition-all duration-500">
          {view === 'LOGIN' && <LoginScreen onLogin={handleLogin} error={loginError} students={allStudentsForCoach} />}
          
          {view !== 'LOGIN' && !isCoach && !studentForView && (
            <div className="h-screen flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
              {dbError ? (
                <>
                  <AlertTriangle className="text-red-600 mb-4" size={48} />
                  <h3 className="text-lg font-black uppercase italic text-foreground mb-2">Erro de Conexão</h3>
                  <p className="text-xs font-bold uppercase tracking-widest mb-6 max-w-xs">
                    {dbError.includes('Database \'(default)\' not found') 
                      ? "O banco de dados Firestore não foi encontrado. Por favor, crie-o no Console do Firebase."
                      : dbError}
                  </p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black uppercase italic tracking-tighter hover:bg-red-700 transition-all shadow-lg"
                    >
                      Tentar Novamente
                    </button>
                    <button 
                      onClick={resetApp}
                      className="px-8 py-3 border border-border rounded-2xl font-black uppercase italic tracking-tighter hover:bg-muted transition-all"
                    >
                      Voltar ao Login
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
                  <p className="text-xs font-black uppercase tracking-widest mb-8">Carregando perfil...</p>
                  <button 
                    onClick={resetApp}
                    className="px-6 py-2 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
                  >
                    Resetar Aplicativo
                  </button>
                </>
              )}
            </div>
          )}

          {view !== 'LOGIN' && isCoach && !studentForView && view !== 'PROFESSOR_DASH' && view !== 'COACH_AI' && view !== 'SETTINGS' && (
            <div className="h-screen flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
              {dbError ? (
                <>
                  <AlertTriangle className="text-red-600 mb-4" size={48} />
                  <h3 className="text-lg font-black uppercase italic text-foreground mb-2">Erro de Conexão</h3>
                  <p className="text-xs font-bold uppercase tracking-widest mb-6 max-w-xs">
                    {dbError.includes('Database \'(default)\' not found') 
                      ? "O banco de dados Firestore não foi encontrado. Por favor, crie-o no Console do Firebase."
                      : "Não foi possível carregar os dados do servidor."}
                  </p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black uppercase italic tracking-tighter hover:bg-red-700 transition-all shadow-lg"
                  >
                    Tentar Novamente
                  </button>
                </>
              ) : (
                <>
                  <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
                  <p className="text-xs font-black uppercase tracking-widest mb-8">Carregando dados...</p>
                  <button 
                    onClick={resetApp}
                    className="px-6 py-2 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
                  >
                    Resetar Aplicativo
                  </button>
                </>
              )}
            </div>
          )}

        {view === 'DASHBOARD' && studentForView && (
          <div className="p-6 text-white text-center pt-6 h-screen overflow-y-auto custom-scrollbar flex flex-col items-center">
            <header className="w-full flex justify-between items-center mb-4">
              <button onClick={toggleSidebar} className="p-3 bg-zinc-900 rounded-2xl text-zinc-500 hover:text-white transition-colors shadow-lg">
                <Menu size={20}/>
              </button>
              <WeatherWidget />
            </header>
            
            <Logo size="text-6xl" subSize="text-[9px] sm:text-xs" />
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
            <p className="text-xl font-black text-white italic uppercase tracking-[0.3em] mt-2">{studentForView.nome}</p>
            
            <div className="w-full mt-6 space-y-4 pb-20 flex flex-col max-w-xl mx-auto">
              {visibleDashboardItems.map(item => {
                const isPeriodization = item.id === 'STUDENT_PERIODIZATION';
                const isWorkouts = item.id === 'WORKOUTS';
                
                let progress = 0;
                if (isPeriodization && studentForView?.periodization?.startDate) {
                  progress = Math.min(100, Math.round(((Date.now() - new Date(studentForView.periodization.startDate).getTime()) / (12 * 7 * 24 * 60 * 60 * 1000)) * 100));
                } else if (isWorkouts && studentForView?.workouts?.length) {
                  const history = studentForView.workoutHistory || [];
                  const totalProgress = studentForView.workouts.reduce((acc, w) => {
                    const completed = history.filter(h => h.workoutId === w.id || h.name === w.title).length;
                    const total = w.projectedSessions || 20;
                    return acc + (completed / total);
                  }, 0);
                  progress = Math.min(100, Math.round((totalProgress / studentForView.workouts.length) * 100));
                }

                return (
                  <div 
                    key={item.id} 
                    className={`p-4 bg-zinc-950/80 border border-${item.color}-600/30 group cursor-pointer active:scale-95 transition-all shadow-lg shadow-${item.color}-600/10 flex flex-row items-center gap-4 rounded-[2rem] backdrop-blur-sm`} 
                    onClick={() => setView(item.id)}
                  >
                    <div className={`w-14 h-14 bg-${item.color}-600 rounded-2xl flex items-center justify-center shadow-lg shadow-${item.color}-600/40 shrink-0`}> 
                      <item.icon className="text-white" size={28} /> 
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-sm font-black uppercase text-white italic tracking-[0.1em]">{item.label}</h3>
                      {(isPeriodization || isWorkouts) && progress > 0 && (
                        <div className="mt-2 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full bg-${item.color}-600`} style={{ width: `${progress}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <button onClick={() => { setUser(null); setView('LOGIN'); }} className="w-full mt-4 py-4 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-row items-center justify-center gap-4 text-zinc-600 hover:text-red-600 transition-all active:scale-95 shadow-xl group">
                <LogOut size={20} /> <span className="text-[11px] font-black uppercase tracking-[0.3em]">Finalizar Sessão</span>
              </button>
            </div>
            <AppFooter />
          </div>
        )}
        {view === 'FEED' && <WorkoutFeed history={globalFeedHistory} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onToggleMenu={toggleSidebar} isProfessor={isCoach} onAddPost={!isCoach ? handleAddPost : undefined} />}
        {view === 'WORKOUTS' && studentForView && <WorkoutSessionView user={studentForView} onBack={handleBackNavigation} onSave={handleSaveData} />}
        {view === 'COACH_AI' && <AICoach onBack={isCoach ? handleBackNavigation : undefined} />}
        {view === 'SETTINGS' && <SettingsView onBack={isCoach ? () => setView('PROFESSOR_DASH') : toggleSidebar} />}
        {view === 'STUDENT_PERIODIZATION' && studentForView && <StudentPeriodizationView student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onToggleMenu={toggleSidebar} />}
        {view === 'STUDENT_ASSESSMENT' && studentForView && <StudentAssessmentView student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onToggleMenu={toggleSidebar} />}
        {view === 'RUNTRACK_STUDENT' && studentForView && <RunTrackStudentView student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onSave={handleSaveData} onToggleMenu={toggleSidebar} />}
        {view === 'CORRE_RJ' && <CorreRJView onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} />}
        {view === 'ANALYTICS' && studentForView && <AnalyticsDashboard student={studentForView} onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} onToggleMenu={toggleSidebar} />}
        {view === 'ABOUT_ABFIT' && <AboutView onBack={handleBackNavigation} />}
        
        {view === 'PROFESSOR_DASH' && <ProfessorDashboard students={allStudentsForCoach} onLogout={() => setView('LOGIN')} onSelect={(s) => { setSelectedStudent(s); setView('STUDENT_MGMT'); }} onToggleMenu={toggleSidebar} onNavigate={setView} />}
        {view === 'STUDENT_MGMT' && selectedStudent && <StudentManagement student={selectedStudent} runningWorkouts={runningWorkouts.filter(w => w.studentId === selectedStudent.id)} onBack={() => setView('PROFESSOR_DASH')} onNavigate={setView} onEditWorkout={setSelectedWorkout} onSave={handleSaveData} />}
        {view === 'WORKOUT_EDITOR' && selectedStudent && <WorkoutEditorView student={selectedStudent} workoutToEdit={selectedWorkout} onBack={() => setView('STUDENT_MGMT')} onSave={handleSaveData} />}
        {view === 'COACH_ASSESSMENT' && selectedStudent && <CoachAssessmentView student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onSave={handleSaveData} />}
        {view === 'PERIODIZATION' && selectedStudent && <PeriodizationView student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onProceedToWorkout={() => setView('WORKOUT_EDITOR')} onSave={handleSaveData} />}
        {view === 'RUNTRACK_MANAGER' && selectedStudent && <RunTrackManager student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} />}
        {view === 'ANALYTICS_COACH' && selectedStudent && <AnalyticsDashboard student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} onToggleMenu={undefined} />}
        {view === 'WORKOUT_HISTORY' && selectedStudent && <StudentWorkoutHistoryView student={selectedStudent} onBack={() => setView('STUDENT_MGMT')} />}
        {view === 'PRESCREVE_AI' && <PrescreveAI onBack={() => setView(isCoach ? 'PROFESSOR_DASH' : 'DASHBOARD')} />}
      </main>
    </BackgroundWrapper>
  </ErrorBoundary>
  );
}
