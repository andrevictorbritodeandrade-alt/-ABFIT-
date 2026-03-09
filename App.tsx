
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  User as UserIcon, Loader2, Dumbbell, 
  Camera, Brain, Ruler, Footprints,
  Info, LogOut, Layout, Bell,
  BarChart3, ChevronRight, Activity, Settings2, Bot, ArrowLeft, Menu, MapPin,
  Sun, Moon, AlertTriangle
} from 'lucide-react';
import { Logo, BackgroundWrapper, EliteFooter, WeatherWidget, GlobalSyncIndicator, Card, NotificationBadge, SideNav, HeaderTitle } from './components/Layout';
import { ProfessorDashboard, StudentManagement, WorkoutEditorView, CoachAssessmentView, PeriodizationView, RunTrackManager } from './components/CoachFlow';
import { WorkoutSessionView, StudentAssessmentView, StudentPeriodizationView, AboutView } from './components/StudentFlow';
import { RunTrackStudentView } from './components/RunTrack';
import { WorkoutFeed } from './components/WorkoutFeed';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import AICoach from './components/AICoach';
import { CorreRJView } from './components/CorreRJ';
import { collection, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, db, appId } from './services/firebase';
import { Student, Workout, AppNotification, WorkoutHistoryEntry } from './types';
import { useTheme } from './components/ThemeContext';

function SettingsView({ onBack }: { onBack: () => void }) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="p-6 pb-48 animate-in fade-in duration-500 text-foreground overflow-y-auto h-screen custom-scrollbar text-left bg-background transition-colors">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-secondary rounded-full shadow-lg text-foreground hover:bg-red-600 transition-colors">
          <ArrowLeft size={20}/>
        </button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground">
          <HeaderTitle text="Configurações Elite" />
        </h2>
      </header>
      <div className="max-w-2xl mx-auto space-y-6">
         <Card className="p-8 bg-card border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-red-600 rounded-2xl shadow-lg">
                  <UserIcon className="text-white" size={24} />
               </div>
               <div>
                  <h4 className="text-sm font-black uppercase italic text-foreground">Perfil do Atleta</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Edite seus dados pessoais</p>
               </div>
            </div>
            <ChevronRight className="text-muted-foreground" size={20} />
         </Card>
         
         <Card className="p-8 bg-card border-border flex items-center justify-between cursor-pointer" onClick={toggleTheme}>
            <div className="flex items-center gap-4">
               <div className="p-3 bg-zinc-800 dark:bg-zinc-700 rounded-2xl shadow-lg transition-colors">
                  {theme === 'dark' ? <Moon className="text-white" size={24} /> : <Sun className="text-white" size={24} />}
               </div>
               <div>
                  <h4 className="text-sm font-black uppercase italic text-foreground">Aparência</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Alternar para tema {theme === 'dark' ? 'claro' : 'escuro'}</p>
               </div>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-zinc-700' : 'bg-emerald-500'}`}>
               <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-1' : 'right-1'}`} />
            </div>
         </Card>

         <Card className="p-8 bg-card border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
                  <Bell className="text-white" size={24} />
               </div>
               <div>
                  <h4 className="text-sm font-black uppercase italic text-foreground">Notificações</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Alertas de treino e renovação</p>
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
  const { theme, toggleTheme } = useTheme();
  
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
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center font-sans bg-background text-foreground transition-colors">
      <div className="absolute top-6 right-6">
        <button onClick={toggleTheme} className="p-3 bg-secondary rounded-full shadow-lg text-foreground hover:bg-red-600 hover:text-white transition-colors">
          {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
      <div className="animate-in fade-in zoom-in duration-700 text-center"><Logo size="text-4xl" /></div>
      <div className="w-full max-sm mt-8 space-y-4 animate-in slide-in-from-bottom-10 duration-1000 relative">
        <div className="text-left">
          <div className="relative" ref={dropdownRef}>
            <input type="text" placeholder="E-MAIL OU 'PROFESSOR'" className="w-full bg-input border border-border p-5 rounded-[2.5rem] text-foreground outline-none focus:border-red-600 transition-all text-center font-black tracking-tight uppercase placeholder:text-muted-foreground" value={input} autoComplete="off" onChange={e => setInput(e.target.value)} onClick={() => setShowDropdown(true)} onFocus={() => setShowDropdown(true)} />
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-80 overflow-y-auto custom-scrollbar">
                <div className="p-3 border-b border-border bg-secondary/40 text-center sticky top-0 z-10"><p className="text-[8px] font-black text-muted-foreground uppercase text-center tracking-[0.2em]">Selecione um perfil</p></div>
                {registeredOptions.map((opt, idx) => (
                  <button key={`opt-${idx}`} onClick={() => { setInput(opt.value); setShowDropdown(false); }} className="w-full p-4 hover:bg-red-600/10 text-left flex items-center justify-between border-b border-border transition-colors group">
                    <div className="text-left"><p className="text-foreground text-xs font-black uppercase tracking-tight text-left">{opt.name}</p><p className="text-[9px] text-muted-foreground lowercase text-left">{opt.value}</p></div>
                    <span className={`text-[8px] font-black px-2 py-1 rounded-full ${opt.type === 'COACH' ? 'bg-red-600 text-white' : 'bg-secondary text-muted-foreground'}`}>{opt.type}</span>
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
  const [authError, setAuthError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
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
      try { 
        await signInAnonymously(auth); 
      } catch (err: any) { 
        console.error("Auth error:", err);
        setAuthError(err.message);
        setLoading(false); 
      } 
    };
    initAuth();
    
    // Safety timeout to prevent stuck loading screen
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubAuth = onAuthStateChanged(auth, (u) => { 
      if (u) { 
        setUser(u); 
        setLoading(false); 
        clearTimeout(timeout);
      } 
    });
    return () => {
      unsubAuth();
      clearTimeout(timeout);
    };
  }, []);

  // Definição Centralizada dos Alunos Padrão
  const defaultStudentsData = useMemo<Student[]>(() => [
        { 
          id: 'fixed-liliane', 
          nome: 'Liliane Torres', 
          email: 'lilicatorres@gmail.com', 
          physicalAssessments: [], 
          workoutHistory: [], 
          sexo: 'Feminino', 
          age: 35,
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
              title: 'TREINO A',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'ex1-liliane', name: 'Leg press horizontal', sets: '3', reps: '15', rest: '30s', executionType: 'Simples' },
                { id: 'ex2-liliane', name: 'Levantar e sentar no banco reto', sets: '3', reps: '15', rest: '30s', executionType: 'Simples' },
                { id: 'ex3-liliane', name: 'Agachamento livre', sets: '3', reps: '15', rest: '30s', executionType: 'Simples' },
                { id: 'ex4-liliane', name: 'Abdominal supra no solo', sets: '3', reps: '15', rest: '30s', executionType: 'Simples' },
                { id: 'ex5-liliane', name: 'Prancha ventral no solo em isometria', sets: '3', reps: '15', rest: '30s', executionType: 'Simples' },
                { id: 'ex6-liliane', name: 'Crucifixo aberto com HBC no banco reto', sets: '3', reps: '15', rest: '30s', executionType: 'Simples' },
                { id: 'ex7-liliane', name: 'Crucifixo aberto com HBC no banco inclinado', sets: '3', reps: '15', rest: '30s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-b-liliane',
              title: 'TREINO B',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'ex8-liliane', name: 'Extensão de quadril em pé caneleira', sets: '3', reps: '15', rest: '30s', executionType: 'Simples' },
                { id: 'ex9-liliane', name: 'Flexão de joelho em pé com caneleira', sets: '3', reps: '15', rest: '30s', executionType: 'Simples' },
                { id: 'ex10-liliane', name: 'Abdução de quadril em pé com caneleira', sets: '3', reps: '15', rest: '30s', executionType: 'Simples' },
                { id: 'ex11-liliane', name: 'Subida no step', sets: '3', reps: '15', rest: '30s', executionType: 'Simples' },
                { id: 'ex12-liliane', name: 'Mata-borrão isométrico no solo (super-man)', sets: '3', reps: '15', rest: '30s', executionType: 'Simples' },
                { id: 'ex13-liliane', name: 'Prancha lateral no solo em isometria', sets: '3', reps: '15', rest: '30s', executionType: 'Simples' },
                { id: 'ex14-liliane', name: 'Crucifixo inverso na máquina', sets: '3', reps: '15', rest: '30s', executionType: 'Simples' }
              ]
            }
          ]
        },
        { 
          id: 'fixed-andre', 
          nome: 'André Brito', 
          email: 'britodeandrade@gmail.com', 
          physicalAssessments: [], 
          workoutHistory: [], 
          sexo: 'Masculino', 
          periodization: {
            id: 'per-andre-01',
            titulo: 'Relatório Científico',
            startDate: new Date().toISOString(),
            microciclos: [],
            type: 'STRENGTH',
            phaseTitle: 'Emagrecimento - Foco Metabólico e Cognitivo',
            generalStrategy: "\"Periodização Não Linear Flexível (UNDP) com ênfase no débito energético...\"",
            clinicalSafety: [
              "Gestão Sensorial (TEA)...",
              "Engajamento e Foco (TDAH)..."
            ],
            bioInsight: {
              context: "**Condição Neurológica:** Transtorno do Espectro Autista (TEA) e TDAH...",
              tips: ["**Segurança (Pós-Bariátrica):** Priorize técnica...", "**Foco (TDAH):** Blocos curtos...", "**Previsibilidade (TEA):** Rotina constante..."]
            }
          },
          workouts: []
        }, 
        { 
          id: 'fixed-marcelly', 
          nome: 'Marcelly Bispo', 
          email: 'marcellybispo92@gmail.com', 
          physicalAssessments: [], 
          workoutHistory: [], 
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
          workouts: [
            {
              id: 'w-marcelly-01',
              title: 'Treino A',
              status: 'published',
              exercises: [
                { id: 'ex-a1', name: 'AG. LIVRE COM HBC', sets: '3', reps: '12', rest: '60s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' },
                { id: 'ex-a2', name: 'AG. SISSY', sets: '3', reps: '15', rest: '45s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' },
                { id: 'ex-a3', name: 'LEG PRESS ART.', sets: '3', reps: '12', rest: '60s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' },
                { id: 'ex-a4', name: 'ABDOMINAL DIAGONAL NO SOLO', sets: '3', reps: '20', rest: '30s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' },
                { id: 'ex-a5', name: 'PRANCHA LATERAL NO SOLO J. EST. ISO.', sets: '3', reps: '30s', rest: '30s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' },
                { id: 'ex-a6', name: 'SUPINO AB. BC. 30º HBC', sets: '3', reps: '12', rest: '60s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' },
                { id: 'ex-a7', name: 'DES. AB. BC 75º HBC', sets: '3', reps: '10', rest: '60s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' },
                { id: 'ex-a8', name: 'TRÍCEPS FRANCÊS SIMUL. BC. 75º HBC', sets: '3', reps: '12', rest: '60s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' }
              ]
            },
            {
              id: 'w-marcelly-02',
              title: 'Treino B',
              status: 'published',
              exercises: [
                { id: 'ex-b1', name: 'EXT. QUAD. E JOELHO EM PÉ', sets: '3', reps: '12', rest: '60s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' },
                { id: 'ex-b2', name: 'FLEX. JOELHO EM PÉ CAN. APOIO STEP', sets: '3', reps: '12', rest: '60s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' },
                { id: 'ex-b3', name: 'ELEVAÇÃO QUAD. SOLO', sets: '3', reps: '15', rest: '45s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' },
                { id: 'ex-b4', name: 'EXTENSÃO MÁX. TRONCO NO APARELHO DIN.', sets: '3', reps: '12', rest: '60s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' },
                { id: 'ex-b5', name: 'MATA-BORRÃO DIN. EM D.V. NO SOLO', sets: '3', reps: '15', rest: '45s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' },
                { id: 'ex-b6', name: 'REMADA AB. MÁQ. ART.', sets: '3', reps: '12', rest: '60s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' },
                { id: 'ex-b7', name: 'PUXADA AB. PL. ALTO B. RETA', sets: '3', reps: '12', rest: '60s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' },
                { id: 'ex-b8', name: 'BÍCEPS BC 75º HBC PG. NT.', sets: '3', reps: '12', rest: '60s', load: '', loadUnit: 'Kg', method: '', executionType: 'Simples', description: '' }
              ]
            }
          ]
        }
    ], []);

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
        console.error("Firestore error:", error);
        setView('LOGIN');
        localStorage.removeItem('elite_session_v2');
      });
    } else if (view !== 'LOGIN' && !isCoach) {
      // Se tivermos um ID temporário restaurado ou um estudante já selecionado
      const targetId = selectedStudent?.id || (window as any)._tempStudentId;
      if (!targetId) {
          setView('LOGIN');
          localStorage.removeItem('elite_session_v2');
          return;
      }

      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', targetId);
      unsub = onSnapshot(docRef, (docSnap) => {
        setIsSyncing(docSnap.metadata.hasPendingWrites);
        if (docSnap.exists()) {
            const rawData = { id: docSnap.id, ...docSnap.data() } as Student;
            
            // --- MERGE COM DADOS PADRÃO (FIX PARA ALUNO) ---
            const defaultProfile = defaultStudentsData.find(d => d.id === rawData.id || (d.email && rawData.email && d.email.toLowerCase() === rawData.email.toLowerCase()));
            
            if (defaultProfile) {
                if (!rawData.nome) rawData.nome = defaultProfile.nome;
                if (!rawData.email) rawData.email = defaultProfile.email;
                if (!rawData.periodization && defaultProfile.periodization) {
                    rawData.periodization = defaultProfile.periodization;
                }
                // Forçar atualização de treinos e periodização se for o aluno Marcelly
                if (rawData.id === 'fixed-marcelly' || (rawData.email && rawData.email.toLowerCase() === 'marcellybispo92@gmail.com')) {
                    const hasOldWorkouts = rawData.workouts?.some(w => w.exercises.length !== 8);
                    if (!rawData.workouts || rawData.workouts.length === 0 || hasOldWorkouts) {
                        rawData.workouts = defaultProfile.workouts;
                    }
                    // Forçar atualização da periodização para a nova "Periodização Científica"
                    if (!rawData.periodization || rawData.periodization.titulo !== 'Periodização Científica') {
                        rawData.periodization = defaultProfile.periodization;
                    }
                }

                // Forçar atualização de treinos e periodização se for a aluna Liliane
                if (rawData.id === 'fixed-liliane' || (rawData.email && rawData.email.toLowerCase() === 'lilicatorres@gmail.com')) {
                    rawData.workouts = defaultProfile.workouts;
                    rawData.periodization = defaultProfile.periodization;
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
          console.error("Firestore error:", error);
          setView('LOGIN');
          localStorage.removeItem('elite_session_v2');
      });
    }
    return () => { if (unsub) unsub(); };
  }, [user, view, selectedStudent?.id, isCoach, defaultStudentsData]);

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
            
            if (!existing.periodization && def.periodization) {
                merged[existingIndex].periodization = def.periodization;
            }

            // Forçar atualização de treinos e periodização se for o aluno Marcelly
            if (existing.id === 'fixed-marcelly' || (existing.email && existing.email.toLowerCase() === 'marcellybispo92@gmail.com')) {
                const hasOldWorkouts = existing.workouts?.some(w => w.exercises.length !== 8);
                if (!existing.workouts || existing.workouts.length === 0 || hasOldWorkouts) {
                    merged[existingIndex].workouts = def.workouts;
                }
                if (!existing.periodization || existing.periodization.titulo !== 'Periodização Científica') {
                    merged[existingIndex].periodization = def.periodization;
                }
            }

            // Forçar atualização de treinos e periodização se for a aluna Liliane
            if (existing.id === 'fixed-liliane' || (existing.email && existing.email.toLowerCase() === 'lilicatorres@gmail.com')) {
                merged[existingIndex].workouts = def.workouts;
                merged[existingIndex].periodization = def.periodization;
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
          if (view === 'WORKOUT_EDITOR' || view === 'PERIODIZATION' || view === 'COACH_ASSESSMENT' || view === 'RUNTRACK_MANAGER' || view === 'ANALYTICS_COACH') {
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
  
  // DEFINIÇÃO DOS BOTÕES DO DASHBOARD DO ALUNO
  // Filtramos aqui com base em studentForView.disabledFeatures
  const allDashboardItems = [
    { id: 'WORKOUTS', label: 'Planilhas Ativas', icon: Dumbbell, color: 'orange' },
    { id: 'RUNTRACK_STUDENT', label: 'ABFIT RUN', icon: Footprints, color: 'rose' },
    { id: 'STUDENT_PERIODIZATION', label: 'Periodização PhD', icon: Brain, color: 'indigo' },
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
    <BackgroundWrapper>
      <GlobalSyncIndicator isSyncing={isSyncing} />
      
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
        
        {authError && view !== 'LOGIN' && (
          <div className="h-screen flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
            <AlertTriangle className="text-red-600 mb-4" size={48} />
            <p className="text-xs font-black uppercase tracking-widest mb-2">Erro de Autenticação</p>
            <p className="text-[10px]">{authError}</p>
            <button onClick={() => setView('LOGIN')} className="mt-6 px-6 py-3 bg-red-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest">Voltar ao Login</button>
          </div>
        )}

        {!authError && view !== 'LOGIN' && !isCoach && !studentForView && (
          <div className="h-screen flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
            <p className="text-xs font-black uppercase tracking-widest">Carregando perfil...</p>
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
            
            <Logo size="text-5xl" subSize="text-[10px]" />
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
        {view === 'CORRE_RJ' && <CorreRJView onBack={isCoach ? handleBackNavigation : () => setView('DASHBOARD')} />}
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
