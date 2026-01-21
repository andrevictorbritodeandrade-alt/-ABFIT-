
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, LogOut, ChevronRight, Edit3, Plus, 
  Trash2, Loader2, Brain, Activity, Target, TrendingUp, 
  BookOpen, Zap, AlertCircle, Dumbbell,
  Image as ImageIcon, Save, Book, Ruler, Scale, Footprints,
  Users, Info, Sparkles, LayoutGrid, Calendar, Clock, Play, FileText, Folder,
  ChevronDown, Lightbulb, Bell, CalendarClock, Search, Check, Layers, Video, X, Eye, EyeOff,
  BarChart3, ZapIcon, Settings2, Link as LinkIcon
} from 'lucide-react';
import { Card, EliteFooter, Logo, HeaderTitle, NotificationBadge, WeatherWidget } from './Layout';
import { Student, Exercise, PhysicalAssessment, Workout, AppNotification } from '../types';
import { analyzeExerciseAndGenerateImage, generatePeriodizationPlan, generateTechnicalCue, generateBioInsight } from '../services/gemini';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { RunTrackCoachView } from './RunTrack';

export { RunTrackCoachView as RunTrackManager } from './RunTrack';

const EXERCISE_DATABASE: Record<string, string[]> = {
  "Peito": [
    "Crucifixo aberto alternado com HBC no banco declinado",
    "Crucifixo aberto alternado com HBC no banco inclinado",
    "Crucifixo aberto alternado com HBC no banco reto",
    "Crucifixo aberto com HBC no banco declinado",
    "Crucifixo aberto com HBC no banco inclinado",
    "Crucifixo aberto com HBC no banco reto",
    "Crucifixo aberto na máquina",
    "Crucifixo alternado na máquina",
    "Crucifixo em pé no cross polia alta",
    "Crucifixo em pé no cross polia média",
    "Crucifixo unilateral na máquina",
    "Extensão de cotovelos no solo (Flexão de Braços)",
    "PullUp na polia baixa pegada supinada",
    "Supino aberto banco declinado no smith",
    "Supino aberto banco inclinado no smith",
    "Supino aberto no banco reto no smith",
    "Supino alternado banco 45° fechado no crossover",
    "Supino alternado banco 45° no crossover",
    "Supino alternado banco 75° aberto no crossover",
    "Supino alternado banco 75° fechado no crossover",
    "Supino alternado banco reto aberto no crossover",
    "Supino alternado banco reto fechado no crossover",
    "Supino alternado deitado aberto na máquina",
    "Supino alternado deitado fechado na máquina",
    "Supino alternado inclinado aberto na máquina",
    "Supino alternado inclinado fechado na máquina",
    "Supino sentado aberto na máquina",
    "Supino sentado fechado na máquina",
    "Supino banco 45º aberto no crossover",
    "Supino banco 45º fechado no crossover",
    "Supino banco 75º aberto no crossover",
    "Supino banco 75º fechado no crossover",
    "Supino banco reto aberto no crossover",
    "Supino banco reto fechado no crossover",
    "Supino declinado alternado com HBC",
    "Supino declinado com HBC",
    "Supino declinado com HBL",
    "Supino deitado aberto na máquina",
    "Supino deitado fechado na máquina",
    "Supino inclinado aberto na máquina",
    "Supino inclinado alternado com HBC",
    "Supino inclinado com HBC",
    "Supino inclinado com HBL",
    "Supino inclinado fechado na máquina",
    "Supino Reto com HBL",
    "Supino reto alternado com HBC",
    "Supino reto com HBC",
    "Supino sentado aberto na máquina",
    "Supino sentado fechado na máquina",
    "Supino unilateral deitado aberto na máquina",
    "Supino unilateral deitado fechado na máquina",
    "Supino unilateral inclinado aberto na máquina",
    "Supino unilateral inclinado fechado na máquina",
    "Supino unilateral sentado aberto na máquina",
    "Supino unilateral sentado fechado na máquina",
    "Voador peitoral"
  ],
  "Ombro": [
    "Abdução de ombros banco 75º com HBC pegada neutra",
    "Abdução de ombros banco 75º com HBC pegada pronada",
    "Abdução de ombros em pé com HBC pegada neutra",
    "Abdução de ombros em pé com HBC pegada pronada",
    "Abdução de ombros unilateral em decúbito lateral no banco 45º HBC",
    "Abdução de ombros unilateral em decúbito lateral no banco 45º no cross",
    "Abdução de ombros unilateral no cross",
    "Desenvolvimento aberto banco 75º no smith",
    "Desenvolvimento aberto na máquina",
    "Desenvolvimento banco 75º aberto com HBC",
    "Desenvolvimento banco 75º aberto com HBM",
    "Desenvolvimento banco 75º arnold com HBC",
    "Desenvolvimento banco 75º fechado pronado com HBC",
    "Desenvolvimento banco 75º fechado pronado com HBM",
    "Desenvolvimento banco 75º fechado supinado com HBC",
    "Desenvolvimento banco 75º fechado supinado com HBM",
    "Desenvolvimento em pé aberto com HBC",
    "Desenvolvimento em pé aberto com HBM",
    "Desenvolvimento em pé arnold com HBC",
    "Desenvolvimento em pé fechado pronado com HBC",
    "Desenvolvimento em pé fechado pronado with HBM",
    "Desenvolvimento em pé fechado supinado com HBC",
    "Desenvolvimento em pé fechado supinado with HBM",
    "Desenvolvimento fechado pronado banco 75º no smith",
    "Desenvolvimento fechado supinado banco 75º no smith",
    "Encolhimento de ombros com HBC",
    "Encolhimento de ombros with HBM",
    "Encolhimento de ombros no cross",
    "Flexão de ombro with HBM pegada pronada",
    "Flexão de ombro simultâneo com HBC pegada neutra",
    "Flexão de ombro simultâneo com HBC pegada pronada",
    "Flexão de ombro unilateral com HBC pegada neutra",
    "Flexão de ombro unilateral com HBC pegada pronada",
    "Flexão de ombro unilateral no cross",
    "Remada alta banco 45º cross",
    "Remada alta com HBM no banco 45º",
    "Remada alta com Kettlebell",
    "Remada alta em decúbito dorsal cross",
    "Remada alta em pé com HBC",
    "Remada alta em pé com HBL",
    "Remada alta em pé com HBM",
    "Remada alta em pé no cross"
  ],
  "Triceps": [
    "Extensão de cotovelos fechados no solo (Flexão de braços)",
    "Tríceps banco 75º francês com HBC simultâneo",
    "Tríceps banco 75º francês com HBC unilateral",
    "Tríceps coice curvado com HBC simultâneo",
    "Tríceps coice curvado com HBC unilateral",
    "Tríceps coice curvado no cross",
    "Tríceps em pé francês with HBC simultâneo",
    "Tríceps em pé francês with HBC unilateral",
    "Tríceps francês no cross simultâneo",
    "Tríceps francês no cross unilateral",
    "Tríceps mergulho no banco reto",
    "Tríceps no cross com barra reta",
    "Tríceps no cross com barra reta inverso",
    "Tríceps no cross com barra V",
    "Tríceps no cross com barra W",
    "Tríceps no cross com corda",
    "Tríceps no cross inverso unilateral",
    "Tríceps superman no cross segurando nos cabos",
    "Tríceps supinado com HBM banco reto",
    "Tríceps supinado no smith banco reto",
    "Tríceps supinado pegada neutra com HBC",
    "Tríceps testa HBM banco reto",
    "Tríceps testa simultâneo HBC banco reto",
    "Tríceps testa simultâneo no cross",
    "Tríceps testa unilateral HBC banco reto",
    "Tríceps testa unilateral no cross"
  ],
  "Costas e Cintura Escapular": [
    "Crucifixo inverso na máquina",
    "Crucifixo inverso simultâneo no cross polia média",
    "Crucifixo inverso unilateral no cross polia média",
    "Extensão de ombros no cross barra reta",
    "Pullover no banco reto with HBC",
    "Puxada aberta com barra reta no cross polia alta",
    "Puxada aberta com barra romana pulley alto",
    "Puxada aberta no pulley alto",
    "Puxada com triângulo no pulley alto",
    "Puxada supinada com barra reta no cross polia alta",
    "Puxada supinada no pulley alto",
    "Remada aberta com barra reta no cross polia média",
    "Remada aberta with HBC decúbito ventral no banco 45°",
    "Remada aberta alternada with HBC decúbito ventral no banco 45°",
    "Remada aberta declinada no smith",
    "Remada aberta na máquina",
    "Remada baixa barra reta pegada supinada",
    "Remada baixa com barra reta",
    "Remada baixa com triângulo",
    "Remada cavalo com HBL",
    "Remada curvada aberta com cross",
    "Remada curvada aberta with cross unilateral",
    "Remada curvada aberta with HBC",
    "Remada curvada aberta with HBM",
    "Remada curvada supinada with cross",
    "Remada curvada supinada with cross unilateral",
    "Remada curvada supinada with HBC",
    "Remada curvada supinada with HBM",
    "Remada fechada alternada with HBC decubito ventral no banco 45°",
    "Remada fechada with HBC decúbito ventral no banco 45°",
    "Remada fechada na máquina",
    "Remada no banco em 3 apoios pegada aberta with HBC unilateral",
    "Remada no banco em 3 apoios pegada neutra with HBC unilateral",
    "Remada no banco em 3 apoios pegada neutra no cross unilateral",
    "Remada no banco em 3 apoios pegada supinada with HBC unilateral",
    "Remada no banco em 3 apoios pegada supinada no cross unilateral",
    "Remada supinada com barra reta no cross polia média"
  ],
  "Biceps": [
    "Bíceps banco 45º with HBC pegada neutra simultâneo",
    "Bíceps banco 45º with HBC pegada neutra unilateral",
    "Bíceps banco 45º with HBC pegada pronada simultâneo",
    "Bíceps banco 45º with HBC pegada pronada unilateral",
    "Bíceps banco 45º with HBC pegada supinada simultâneo",
    "Bíceps banco 45º with HBC pegada supinada unilateral",
    "Bíceps banco 75º with HBC pegada neutra simultâneo",
    "Bíceps banco 75º with HBC pegada neutra unilateral",
    "Bíceps banco 75º with HBC pegada pronada simultâneo",
    "Bíceps banco 75º with HBC pegada pronada unilateral",
    "Bíceps banco 75º with HBC pegada supinada simultâneo",
    "Bíceps banco 75º with HBC pegada supinada unilateral",
    "Bíceps concentrado with HBC unilateral",
    "Bíceps em pé with HBC pegada neutra alternado",
    "Bíceps em pé with HBC pegada neutra simultâneo",
    "Bíceps em pé with HBC pegada neutra unilateral",
    "Bíceps em pé with HBC pegada pronada alternado",
    "Bíceps em pé with HBC pegada pronada simultâneo",
    "Bíceps em pé with HBC pegada pronada unilateral",
    "Bíceps em pé with HBC pegada supinada alternado",
    "Bíceps em pé with HBC pegada supinada simultâneo",
    "Bíceps em pé with HBC pegada supinada unilateral",
    "Bíceps em pé with HBM pegada pronada",
    "Bíceps em pé with HBM pegada supinada",
    "Bíceps no banco scott with HBC simultâneo",
    "Bíceps no banco scott with HBC unilateral",
    "Bíceps no banco scott with HBM pronado",
    "Bíceps no banco scott with HBM supinado",
    "Bíceps no banco scott with HBW simultâneo",
    "Bíceps no cross barra reta",
    "Bíceps no cross polia baixa unilateral",
    "Bíceps no cross superman simultâneo",
    "Bíceps no cross superman unilateral"
  ],
  "Core e Abdomen": [
    "Abdominal diagonal na bola",
    "Abdominal diagonal no bosu",
    "Abdominal diagonal no solo",
    "Abdominal infra no solo puxando as pernas",
    "Abdominal infra pernas estendidas",
    "Abdominal supra na bola",
    "Abdominal supra no bosu",
    "Abdominal supra no solo",
    "Abdominal vela no solo",
    "Prancha lateral na bola em isometria",
    "Prancha lateral no bosu em isometria",
    "Prancha lateral no solo em isometria",
    "Prancha ventral na bola em isometria",
    "Prancha ventral no bosu em isometria",
    "Prancha ventral no solo em isometria"
  ],
  "Paravertebrais": [
    "Elevação de quadril em isometria no solo",
    "Mata-borrão isométrico no solo (super-man)",
    "Perdigueiro em isometria no solo"
  ],
  "Quadríceps e Adutores": [
    "Adução de quadril em decúbito dorsal",
    "Adução de quadril em decúbito lateral no solo",
    "Adução de quadril em pé no cross",
    "Agachamento búlgaro",
    "Agachamento em passada com HBC",
    "Agachamento em passada with HBL",
    "Agachamento em passada with HBM",
    "Agachamento em passada with step a frente com HBC",
    "Agachamento em passada with step a frente with HBL",
    "Agachamento em passada with step a frente with HBM",
    "Agachamento em passada with step a frente",
    "Agachamento em passada with step atrás with HBC",
    "Agachamento em passada with step atrás with HBL",
    "Agachamento em passada with step atrás with HBM",
    "Agachamento em passada with step atrás",
    "Agachamento no smith",
    "Agachamento em passada no smith",
    "Agachamento em passada with step a frente no smith",
    "Agachamento em passada with step atrás no Smith",
    "Agachamento livre with HBC",
    "Agachamento livre with HBL barra sobre ombros",
    "Agachamento livre with HBL",
    "Agachamento livre with HBM barra sobre ombros",
    "Agachamento livre",
    "Agachamento no hack machine",
    "Agachamento no sissy",
    "Agachamento no Smith barra sobre os ombros",
    "Agachamento no smith",
    "Cadeira adutora",
    "Cadeira extensora alternado",
    "Cadeira extensora unilateral",
    "Cadeira extensora",
    "Flexão de quadril e joelho em decúbito dorsal no solo com caneleira",
    "Flexão de quadril e joelho em pé com caneleira",
    "Flexão de quadril e joelho em pé no cross",
    "Flexão de quadril em decúbito dorsal no solo com caneleira",
    "Flexão de quadril em pé com caneleira",
    "Flexão de quadril em pé no cross",
    "Leg press horizontal unilateral",
    "Leg press horizontal",
    "Leg press inclinado unilateral",
    "Leg press inclinado",
    "Levantar e sentar do banco reto with HBM",
    "Levantar e sentar no banco reto com HBC",
    "Levantar e sentar no banco reto"
  ],
  "Glúteos e Posteriores": [
    "Abdução de quadril decúbito lateral no solo caneleira",
    "Abdução de quadril em pé com caneleira",
    "Agachamento sumô com HBC",
    "Agachamento sumô with HBM",
    "Cadeira flexora alternado",
    "Cadeira flexora unilateral",
    "Cadeira flexora",
    "Elevação de quadril no banco reto with HBM",
    "Elevação de Quadril no solo com anilha",
    "Extensão de quadril e joelho em pé caneleira",
    "Extensão de quadril e joelho em pé no cross",
    "Extensão de quadril e joelho no cross",
    "Extensão de quadril e joelho no solo caneleira",
    "Extensão de quadril em pé caneleira",
    "Extensão de quadril em pé no cross",
    "Extensão de quadril no cross",
    "Extensão de quadril no solo caneleira",
    "Flexão de joelho em 3 apoios with caneleira",
    "Flexão de joelho em pé with caneleira",
    "Flexão de joelho em pé no cross",
    "Levantamento terra with HBC",
    "Levantamento terra with HBL",
    "Levantamento terra with HBM",
    "Levantamento terra no cross",
    "Levantamento terra romeno with HBM",
    "Mesa flexora alternado",
    "Mesa flexora unilateral",
    "Mesa flexora",
    "Stiff with HBC simultâneo",
    "Stiff with HBC unilateral",
    "Stiff with HBM simultâneo",
    "Stiff “bom dia” with HBM",
    "Subida no step"
  ],
  "Panturrilha": [
    "Cadeira solear",
    "Flexão plantar with Halteres.",
    "Flexão plantar em pé na Máquina",
    "Flexão plantar em pé Unilateral",
    "Flexão plantar no Leg press inclinado",
    "Flexão plantar no leg press horizontal"
  ]
};

const MUSCLE_GROUPS = Object.keys(EXERCISE_DATABASE);

// Categorized Training Methods for Dropdown
const TRAINING_METHODS = {
  "Métodos de Organização de Carga (Pirâmides)": [
    "Série Estável",
    "Pirâmide Crescente",
    "Pirâmide Decrescente",
    "Ondulatório"
  ],
  "Métodos de Densidade (Agrupamento)": [
    "Bi-Set",
    "Tri-Set",
    "Giant Set",
    "Super-Set Antagonista",
    "Agonista-Antagonista",
    "Circuito"
  ],
  "Métodos de Extensão (Pós-Falha)": [
    "Drop-Set",
    "Strip-Set",
    "Rest-Pause",
    "Myo-Reps",
    "Cluster Sets",
    "Repetições Forçadas",
    "Repetições Parciais",
    "Roubo Consciente"
  ],
  "Métodos de Tensão e Tempo": [
    "Excêntrico (Negativo)",
    "Isometria",
    "Ponto Zero",
    "Método 21",
    "Super Slow",
    "TUT (Time Under Tension)"
  ],
  "Métodos de Ordem": [
    "Pré-Exaustão",
    "Pós-Exaustão"
  ],
  "Sistemas Famosos": [
    "GVT",
    "FST-7",
    "Heavy Duty",
    "SST",
    "MTI"
  ]
};

// Methods that imply grouping multiple exercises
const GROUPING_METHODS = [
  "Bi-Set",
  "Tri-Set",
  "Giant Set",
  "Super-Set Antagonista",
  "Agonista-Antagonista",
  "Circuito"
];

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

const DASHBOARD_FEATURES = [
  { id: 'FEED', label: 'Feed de Performance', icon: LayoutGrid },
  { id: 'WORKOUTS', label: 'Meus Treinos', icon: Dumbbell },
  { id: 'STUDENT_PERIODIZATION', label: 'Periodização PhD', icon: Brain },
  { id: 'STUDENT_ASSESSMENT', label: 'Avaliação Física', icon: Ruler },
  { id: 'RUNTRACK_STUDENT', label: 'RunTrack Elite', icon: Footprints },
  { id: 'ANALYTICS', label: 'Análise de Dados', icon: BarChart3 },
  { id: 'ABOUT_ABFIT', label: 'Sobre a ABFIT Elite', icon: Info },
];

export function StudentManagement({ student, onBack, onNavigate, onEditWorkout, onSave }: { student: Student, onBack: () => void, onNavigate: (v: string) => void, onEditWorkout: (w: Workout) => void, onSave: (sid: string, data: any) => void }) {
  // Use local state to manage toggles for instant feedback and prevent "sync freeze"
  const [localDisabledFeatures, setLocalDisabledFeatures] = useState<string[]>(student.disabledFeatures || []);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    setLocalDisabledFeatures(student.disabledFeatures || []);
  }, [student.disabledFeatures]);

  const toggleFeatureVisibility = (featureId: string) => {
    setLocalDisabledFeatures(prev => {
      if (prev.includes(featureId)) {
        return prev.filter(id => id !== featureId);
      } else {
        return [...prev, featureId];
      }
    });
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    await onSave(student.id, { disabledFeatures: localDisabledFeatures });
    setIsSavingSettings(false);
  };

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter">
          <HeaderTitle text={student.nome} />
        </h2>
      </header>

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
              <h4 className="text-xl font-black italic uppercase text-white group-hover:text-red-600 transition-colors">PrescreveAI Elite</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">IA & Biomecânica PhD</p>
            </div>
            <Video className="text-red-600 group-hover:scale-110 transition-transform" size={32} />
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
        <div className="flex items-center gap-3 px-2">
          <Eye className="text-red-600" size={16} />
          <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] italic">Visibilidade do Dashboard</h3>
        </div>
        <Card className="bg-zinc-900/50 border-zinc-800 p-6">
          <p className="text-[9px] text-zinc-500 uppercase font-bold mb-6 italic leading-relaxed">
            Selecione o que o aluno pode visualizar no menu inicial do aplicativo.
          </p>
          <div className="grid grid-cols-1 gap-3 mb-6">
            {DASHBOARD_FEATURES.map((feature) => {
              const isDisabled = localDisabledFeatures.includes(feature.id);
              return (
                <div key={feature.id} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <feature.icon size={16} className={isDisabled ? "text-zinc-700" : "text-red-600"} />
                    <span className={`text-xs font-black uppercase italic ${isDisabled ? 'text-zinc-600' : 'text-white'}`}>
                      {feature.label}
                    </span>
                  </div>
                  <button 
                    onClick={() => toggleFeatureVisibility(feature.id)}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isDisabled ? 'bg-zinc-800' : 'bg-red-600 shadow-lg shadow-red-600/20'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isDisabled ? 'left-1' : 'left-7'}`} />
                  </button>
                </div>
              );
            })}
          </div>
          <button 
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="w-full py-4 bg-red-600 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"
          >
            {isSavingSettings ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} SALVAR PREFERÊNCIAS DE VISUALIZAÇÃO
          </button>
        </Card>
      </div>

      <div className="mt-12 space-y-4">
         <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] italic">Planilhas Ativas</h3>
         </div>
         <div className="space-y-3">
            {student.workouts?.map(w => (
              <div key={w.id} className="p-6 rounded-[2rem] border border-white/5 bg-zinc-900/50 flex justify-between items-center group transition-all shadow-lg">
                 <div>
                    <span className="font-black uppercase italic text-lg text-white leading-none">{w.title}</span>
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

export function PeriodizationView({ student, onBack, onProceedToWorkout }: { student: Student, onBack: () => void, onProceedToWorkout: () => void }) {
  const [loading, setLoading] = useState(false);
  const handleGenerate = async () => {
    setLoading(true);
    const plan = await generatePeriodizationPlan({ name: student.nome, goal: student.goal || 'Performance', daysPerWeek: '4' });
    if (plan) {
      // Logic to save plan would typically go here via student persistence
    }
    setLoading(false);
  };

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter">Periodização PhD</h2>
      </header>
      <div className="space-y-6">
        <Card className="p-8 bg-zinc-900 border-zinc-800 text-center">
          <Brain className="text-indigo-600 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-black uppercase italic mb-4">Gerar Planejamento via IA</h3>
          <p className="text-xs text-zinc-500 mb-8 uppercase font-bold">Crie um mesociclo científico baseado no perfil do atleta.</p>
          <button onClick={handleGenerate} disabled={loading} className="w-full py-4 bg-indigo-600 rounded-2xl font-black uppercase flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} Processar Macro/Microciclo
          </button>
        </Card>
        <button onClick={onProceedToWorkout} className="w-full py-4 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-white transition-all">Ir para Montagem de Treinos</button>
      </div>
    </div>
  );
}

export function CoachAssessmentView({ student, onBack, onSave }: { student: Student, onBack: () => void, onSave: (sid: string, data: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState(student.height?.toString() || '');
  const [fat, setFat] = useState('');

  const handleAdd = async () => {
    setLoading(true);
    const newAssessment: PhysicalAssessment = {
      id: Date.now().toString(),
      data: new Date().toISOString(),
      peso: weight,
      altura: height,
      bio_percentual_gordura: fat
    };
    const current = student.physicalAssessments || [];
    await onSave(student.id, { physicalAssessments: [newAssessment, ...current] });
    setLoading(false);
    onBack();
  };

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter">Nova Avaliação</h2>
      </header>

      <div className="space-y-8">
        <Card className="p-8 bg-zinc-900 border-zinc-800 space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Peso Atual (KG)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-black p-5 rounded-3xl border border-zinc-800 text-white font-black text-2xl outline-none focus:border-red-600" placeholder="00.0" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Altura (CM)</label>
              <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-black p-5 rounded-3xl border border-zinc-800 text-white font-black text-2xl outline-none focus:border-red-600" placeholder="000" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 tracking-widest">% de Gordura (Bioimpedância)</label>
              <input type="number" value={fat} onChange={e => setFat(e.target.value)} className="w-full bg-black p-5 rounded-3xl border border-zinc-800 text-white font-black text-2xl outline-none focus:border-red-600" placeholder="00.0" />
           </div>
           <button onClick={handleAdd} disabled={loading || !weight || !height} className="w-full py-6 bg-emerald-600 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-900/20">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'REGISTRAR AVALIAÇÃO'}
           </button>
        </Card>
      </div>
    </div>
  );
}

export function WorkoutEditorView({ student, workoutToEdit, onBack, onSave }: { student: Student, workoutToEdit: Workout | null, onBack: () => void, onSave: (sid: string, data: any) => void }) {
  const [title, setTitle] = useState(workoutToEdit?.title || '');
  const [exercises, setExercises] = useState<Exercise[]>(workoutToEdit?.exercises || []);
  const [loading, setLoading] = useState(false);
  
  // PrescreveAI States
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [exerciseImage, setExerciseImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [technicalCue, setTechnicalCue] = useState("");
  const [isGeneratingCue, setIsGeneratingCue] = useState(false);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  
  // Exercise Config State
  const [config, setConfig] = useState({ sets: '3', reps: '10', rest: '60s', method: 'Série Estável', load: '' });

  const detailSectionRef = useRef<HTMLDivElement>(null);

  const handleSelectExerciseWithDelay = (exerciseName: string) => {
    setSelectedExercise({ name: exerciseName });
    setExerciseImage(null);
    setTechnicalCue("");
    setConfig({ sets: '3', reps: '10', rest: '60s', method: 'Série Estável', load: '' }); // Reset config on new selection
    
    if (detailSectionRef.current) {
        detailSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    setTimeout(() => {
      processExerciseData(exerciseName);
    }, 500);
  };

  const processExerciseData = async (exerciseName: string) => {
    setImageLoading(true);
    try {
      const result = await analyzeExerciseAndGenerateImage(exerciseName, student);
      if (result) {
        setExerciseImage(result.imageUrl);
        setSelectedExercise({
          name: exerciseName,
          description: result.description,
          benefits: result.benefits
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImageLoading(false);
    }
  };

  const generateCue = async () => {
    if (!selectedExercise) return;
    setIsGeneratingCue(true);
    const cue = await generateTechnicalCue(selectedExercise.name, student);
    setTechnicalCue(cue);
    setIsGeneratingCue(false);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleAddSelectedToWorkout = () => {
    if (!selectedExercise) return;

    // Logic for Auto-Grouping (Bi-sets, Tri-sets, etc)
    const isGroupingMethod = GROUPING_METHODS.includes(config.method);
    let groupId = undefined;

    if (isGroupingMethod) {
       const lastExercise = exercises[exercises.length - 1];
       // Se o exercício anterior tem o mesmo método de agrupamento, vincula a ele
       if (lastExercise && lastExercise.method === config.method) {
         groupId = lastExercise.groupId || Date.now().toString(); // Usa o existente ou cria um novo se faltar
         
         // Garante que o anterior tenha ID se não tiver (caso seja o primeiro do grupo)
         if (!lastExercise.groupId) {
            const updatedExercises = [...exercises];
            updatedExercises[updatedExercises.length - 1].groupId = groupId;
            setExercises(updatedExercises);
         }
       } else {
         // Inicia um novo grupo
         groupId = Date.now().toString();
       }
    }

    const newEx: Exercise = { 
      id: Date.now().toString(), 
      name: selectedExercise.name, 
      sets: config.sets, 
      reps: config.reps, 
      rest: config.rest,
      method: config.method,
      load: config.load,
      thumb: exerciseImage,
      groupId: groupId,
      description: selectedExercise.description,
      benefits: selectedExercise.benefits
    };

    // Se atualizamos o exercício anterior (para setar ID), usamos o estado atualizado, senão o atual
    setExercises(prev => {
        const list = [...prev];
        if (groupId && list.length > 0 && list[list.length - 1].method === config.method && !list[list.length - 1].groupId) {
            list[list.length - 1].groupId = groupId;
        }
        return [...list, newEx];
    });

    setSelectedExercise(null);
    setExerciseImage(null);
    setTechnicalCue("");
  };

  const handleSave = async () => {
    setLoading(true);
    const newWorkout: Workout = {
      id: workoutToEdit?.id || Date.now().toString(),
      title,
      exercises
    };
    const currentWorkouts = student.workouts || [];
    let updatedWorkouts;
    if (workoutToEdit) {
      updatedWorkouts = currentWorkouts.map(w => w.id === workoutToEdit.id ? newWorkout : w);
    } else {
      updatedWorkouts = [...currentWorkouts, newWorkout];
    }
    await onSave(student.id, { workouts: updatedWorkouts });
    setLoading(false);
    onBack();
  };

  // Filtrar treinos salvos para exibir apenas os outros
  const otherWorkouts = (student.workouts || []).filter(w => w.id !== workoutToEdit?.id);

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar flex flex-col">
      <header className="flex items-center justify-between mb-8 sticky top-0 bg-black/95 backdrop-blur-xl py-4 z-50 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-1.5 rounded-lg rotate-3 shadow-lg"><Video size={16} className="text-white" /></div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Prescreve<span className="text-red-600">AI</span></h2>
          </div>
        </div>
        <button onClick={handleSave} disabled={loading} className="bg-red-600 px-6 py-2.5 rounded-full font-black text-[10px] uppercase shadow-2xl flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Salvar Planilha
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 pb-48">
        
        {/* LADO ESQUERDO: INVENTÁRIO & PLANILHA ATUAL */}
        <aside className="lg:col-span-4 space-y-6">
          
          <div className="bg-zinc-900/40 p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
             <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Planilha em Edição</h3>
                <span className="bg-zinc-800 px-3 py-1 rounded-full text-[8px] font-black text-white">{exercises.length} EXs</span>
             </div>
             <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full bg-black border border-white/5 p-4 rounded-2xl text-xs font-black italic uppercase text-white mb-4 focus:border-red-600 outline-none" 
                placeholder="NOME DA PLANILHA..."
             />
             <div className="space-y-3">
                {exercises.map((ex, i) => {
                  const isGrouped = !!ex.groupId;
                  const prevEx = exercises[i-1];
                  const nextEx = exercises[i+1];
                  
                  // Visual logic for brackets
                  const isGroupStart = isGrouped && (!prevEx || prevEx.groupId !== ex.groupId);
                  const isGroupEnd = isGrouped && (!nextEx || nextEx.groupId !== ex.groupId);
                  const isGroupMiddle = isGrouped && !isGroupStart && !isGroupEnd;

                  return (
                    <div key={i} className="relative pl-6">
                      {/* Visual Bracket Connector */}
                      {isGrouped && (
                        <div className={`absolute left-0 w-3 border-red-600/50
                            ${isGroupStart ? 'top-1/2 bottom-0 border-l-2 border-t-2 rounded-tl-xl h-[calc(50%+8px)]' : ''}
                            ${isGroupEnd ? 'top-0 bottom-1/2 border-l-2 border-b-2 rounded-bl-xl h-[calc(50%+8px)]' : ''}
                            ${isGroupMiddle ? 'top-0 bottom-0 border-l-2 h-full' : ''}
                        `}>
                            {/* Optional: Add method badge on the connector */}
                            {isGroupStart && (
                                <div className="absolute -top-3 -left-1 bg-zinc-800 text-[6px] font-black uppercase text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 whitespace-nowrap z-10">
                                    {ex.method}
                                </div>
                            )}
                        </div>
                      )}

                      <div className={`flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 group relative ${isGrouped ? 'border-l-0 rounded-l-md ml-1' : ''}`}>
                         {isGrouped && isGroupMiddle && <div className="absolute -left-[26px] top-1/2 w-3 h-0.5 bg-zinc-500"></div>}
                         
                         <div className="flex items-center gap-3 mr-3">
                            <span className="text-[10px] font-black text-zinc-600 w-4">{i + 1}º</span>
                            <button onClick={() => setPreviewExercise(ex)} className="w-10 h-10 bg-zinc-800 rounded-lg overflow-hidden border border-white/10 hover:border-red-600 transition-all shadow-lg shrink-0">
                                {ex.thumb ? <img src={ex.thumb} className="w-full h-full object-cover" /> : <Activity size={16} className="text-zinc-600 m-auto"/>}
                            </button>
                         </div>

                         <div className="flex-1 mr-2">
                           <div className="flex items-center gap-2 mb-1">
                               {isGrouped && <LinkIcon size={10} className="text-red-600" />}
                               <span className="text-[10px] font-black italic uppercase truncate max-w-[150px] block">{ex.name}</span>
                           </div>
                           <div className="flex gap-2 items-center">
                              <input 
                                value={ex.sets} 
                                onChange={(e) => updateExercise(i, 'sets', e.target.value)}
                                className="w-6 bg-transparent border-b border-zinc-700 text-[9px] text-white text-center focus:border-red-600 outline-none p-0"
                                placeholder="S"
                              />
                              <span className="text-[9px] text-zinc-600">x</span>
                              <input 
                                value={ex.reps} 
                                onChange={(e) => updateExercise(i, 'reps', e.target.value)}
                                className="w-8 bg-transparent border-b border-zinc-700 text-[9px] text-white text-center focus:border-red-600 outline-none p-0"
                                placeholder="R"
                              />
                              <span className="text-[9px] text-zinc-600">•</span>
                              <input 
                                value={ex.load || ''} 
                                onChange={(e) => updateExercise(i, 'load', e.target.value)}
                                className="w-10 bg-transparent border-b border-zinc-700 text-[9px] text-white text-center focus:border-red-600 outline-none p-0 italic"
                                placeholder="kg"
                              />
                           </div>
                           <div className="mt-1">
                             <span className="text-[8px] text-zinc-500 uppercase font-bold">{ex.method}</span>
                           </div>
                         </div>
                         <button onClick={() => setExercises(exercises.filter((_, idx) => idx !== i))} className="text-zinc-700 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  );
                })}
                {exercises.length === 0 && <p className="text-[9px] text-zinc-600 font-bold uppercase text-center py-4 italic">Nenhum exercício adicionado</p>}
             </div>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-md">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-2 italic">
              <Target className="w-4 h-4 text-red-600" /> Inventário Prescrito
            </h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Grupo Muscular</label>
                <select 
                  className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-sm font-black italic uppercase focus:border-red-600 outline-none appearance-none cursor-pointer" 
                  value={selectedMuscle} 
                  onChange={(e) => setSelectedMuscle(e.target.value)}
                >
                  <option value="">Selecione o grupo...</option>
                  {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {selectedMuscle && (
                <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {EXERCISE_DATABASE[selectedMuscle].map((exName, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleSelectExerciseWithDelay(exName)} 
                      className={`text-left px-5 py-4 rounded-2xl text-[11px] transition-all border flex items-center justify-between group ${selectedExercise?.name === exName ? 'bg-red-600 border-red-600 text-white font-black' : 'bg-black border-white/5 text-zinc-400 hover:border-red-600/30'}`}
                    >
                      <span className="truncate italic font-black uppercase">{exName}</span>
                      <Play className={`w-3 h-3 ${selectedExercise?.name === exName ? 'fill-white' : 'fill-red-600'}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {otherWorkouts.length > 0 && (
            <div className="bg-zinc-900/20 p-6 rounded-[2.5rem] border border-white/5 border-dashed">
                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4 italic text-center">Treinos Salvos</h3>
                <div className="space-y-2">
                    {otherWorkouts.map(w => (
                        <div key={w.id} className="p-3 bg-black/60 rounded-xl border border-white/5 text-center">
                            <span className="text-[10px] font-black uppercase italic text-zinc-400">{w.title}</span>
                        </div>
                    ))}
                </div>
            </div>
          )}

        </aside>

        {/* LADO DIREITO: FEED BIOMECÂNICO & ANÁLISE */}
        <section className="lg:col-span-8 space-y-6">
          {!selectedExercise ? (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-zinc-800 border-2 border-dashed border-white/5 rounded-[3rem] bg-zinc-950/20">
              <Video className="w-16 h-16 opacity-10 mb-6" />
              <p className="font-black uppercase tracking-[0.4em] text-[10px] text-red-600 text-center px-8 italic">Selecione um exercício para ver a biomecânica 8K analisada por IA</p>
            </div>
          ) : (
            <div ref={detailSectionRef} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="bg-zinc-900/60 rounded-[3.5rem] overflow-hidden border border-white/10 shadow-3xl backdrop-blur-3xl">
                
                <div className="p-10 md:p-14">
                  <div className="flex justify-between items-start mb-8">
                    <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-[0.9] max-w-xl">{selectedExercise.name}</h2>
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={generateCue}
                        disabled={isGeneratingCue || !selectedExercise.description}
                        className="bg-red-600 p-5 rounded-3xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-red-900/40 border border-white/10"
                      >
                        {isGeneratingCue ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Lightbulb className="w-6 h-6 text-white" />}
                      </button>
                    </div>
                  </div>

                  {/* PAINEL DE CONFIGURAÇÃO DE SÉRIES E MÉTODO - MOVED TO TOP */}
                  <div className="mb-8 bg-zinc-950/80 p-6 rounded-[2rem] border border-white/10 shadow-2xl">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 flex items-center gap-2 italic">
                      <Settings2 size={14} className="text-red-600" /> Prescrição Técnica
                    </h4>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1 whitespace-nowrap">Séries</label>
                           <input 
                             type="text" 
                             value={config.sets} 
                             onChange={e => setConfig({...config, sets: e.target.value})} 
                             className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-center font-black text-white focus:border-red-600 outline-none transition-colors"
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1 whitespace-nowrap">Reps</label>
                           <input 
                             type="text" 
                             value={config.reps} 
                             onChange={e => setConfig({...config, reps: e.target.value})} 
                             className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-center font-black text-white focus:border-red-600 outline-none transition-colors"
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1 whitespace-nowrap">Carga</label>
                           <input 
                             type="text" 
                             value={config.load} 
                             onChange={e => setConfig({...config, load: e.target.value})} 
                             className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-center font-black text-white focus:border-red-600 outline-none transition-colors"
                             placeholder="-"
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1 whitespace-nowrap">Descanso</label>
                           <input 
                             type="text" 
                             value={config.rest} 
                             onChange={e => setConfig({...config, rest: e.target.value})} 
                             className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-center font-black text-white focus:border-red-600 outline-none transition-colors"
                           />
                        </div>
                    </div>
                    <div className="flex gap-3 items-end">
                        <div className="flex-1 space-y-1">
                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Método de Treino</label>
                            <div className="relative">
                              <select 
                                value={config.method} 
                                onChange={e => setConfig({...config, method: e.target.value})} 
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white font-black italic uppercase focus:border-red-600 outline-none appearance-none cursor-pointer pr-10 text-xs h-[46px]"
                              >
                                {Object.entries(TRAINING_METHODS).map(([category, methods]) => (
                                  <optgroup key={category} label={category} className="bg-zinc-900 text-zinc-400 font-bold not-italic">
                                    {methods.map(m => (
                                      <option key={m} value={m} className="bg-black text-white font-medium">{m}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <button 
                           onClick={handleAddSelectedToWorkout}
                           className="w-[46px] h-[46px] bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-red-700 active:scale-95 transition-all shrink-0"
                           title="Adicionar Exercício"
                        >
                           <Plus size={24} strokeWidth={3} />
                        </button>
                    </div>
                  </div>

                  {/* LIVE BIOMECHANIC FEED WINDOW */}
                  <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden border border-white/5 rounded-[2rem] mb-8 shadow-2xl">
                    {imageLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-20">
                        <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-6" />
                        <div className="space-y-1 text-center">
                          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 italic block">ANALYSING ASYMMETRY...</span>
                          <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">(0.5S SNAP DELAY)</span>
                        </div>
                      </div>
                    ) : exerciseImage ? (
                      <div className="w-full h-full relative video-motion-engine">
                        <img src={exerciseImage} alt="Execução" className="w-full h-full object-cover" />
                        <div className="absolute top-8 left-8 flex items-center gap-3">
                          <div className="bg-red-600 h-2 w-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,1)]"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">LIVE BIOMECHANIC FEED</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                         <Loader2 className="animate-spin text-red-600" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">Estabelecendo Conexão PhD...</span>
                      </div>
                    )}
                  </div>

                  {technicalCue && (
                    <div className="mb-12 p-8 bg-red-600/5 border border-red-600/30 rounded-[2.5rem] animate-in zoom-in-95 shadow-2xl">
                      <div className="flex items-center gap-2 mb-4 text-red-600">
                         <Zap className="w-4 h-4 fill-red-600" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em]">Dica IA PhD ✨</span>
                      </div>
                      <p className="text-lg text-zinc-200 italic leading-relaxed font-medium">"{technicalCue}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 flex items-center gap-2 italic"><ZapIcon className="w-4 h-4 fill-red-600" /> Técnica Aplicada</h4>
                      <p className="text-zinc-400 text-xl leading-relaxed border-l-2 border-red-600/20 pl-8 font-medium italic">{selectedExercise.description || "Iniciando processamento biomecânico..."}</p>
                    </div>
                    <div className="bg-black/40 p-10 rounded-[3rem] border border-white/5 shadow-inner">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8 italic">Impacto Fisiológico</h4>
                      <div className="text-zinc-300 text-sm italic font-medium leading-relaxed space-y-4 whitespace-pre-wrap">
                        {selectedExercise.benefits}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {previewExercise && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-red-600/30 w-full max-w-2xl rounded-[3rem] p-8 relative shadow-2xl overflow-y-auto max-h-full custom-scrollbar">
                <button onClick={() => setPreviewExercise(null)} className="absolute top-6 right-6 p-3 bg-black rounded-full text-white border border-white/10 hover:bg-red-600 transition-colors z-10"><X size={20}/></button>
                <h2 className="text-2xl font-black italic uppercase text-white mb-6 pr-12 leading-tight">{previewExercise.name}</h2>
                <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 mb-6 relative shadow-2xl">
                    {previewExercise.thumb && <img src={previewExercise.thumb} className="w-full h-full object-cover" />}
                    <div className="absolute bottom-4 left-4 bg-red-600/90 backdrop-blur px-3 py-1 rounded-full text-[8px] font-black uppercase text-white shadow-lg">Replay Loop</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 mb-2 flex items-center gap-2"><ZapIcon size={12}/> Técnica</h4>
                        <p className="text-xs text-zinc-400 italic leading-relaxed font-medium">{previewExercise.description || "Sem descrição técnica registrada."}</p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 flex items-center gap-2"><Activity size={12}/> Fisiologia</h4>
                        <p className="text-xs text-zinc-400 italic leading-relaxed font-medium">{previewExercise.benefits || "Sem dados fisiológicos."}</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

function PlusSquareIcon({size}: {size: number}) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>;
}
