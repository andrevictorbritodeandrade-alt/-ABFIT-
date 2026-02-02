
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, LogOut, ChevronRight, Edit3, Plus, 
  Trash2, Loader2, Brain, Activity, Target, TrendingUp, 
  BookOpen, Zap, AlertCircle, Dumbbell,
  Image as ImageIcon, Save, Book, Ruler, Scale, Footprints,
  Users, Info, Sparkles, LayoutGrid, Calendar, Clock, Play, FileText, Folder,
  ChevronDown, Lightbulb, Bell, CalendarClock, Search, Check, Layers, Video, X, Eye, EyeOff,
  BarChart3, ZapIcon, Settings2, Link as LinkIcon, Send, Menu, Layout, AlertTriangle, Scan, Upload, Copy
} from 'lucide-react';
import { Card, EliteFooter, Logo, HeaderTitle, NotificationBadge, WeatherWidget } from './Layout';
import { Student, Exercise, PhysicalAssessment, Workout, AppNotification } from '../types';
import { analyzeExerciseAndGenerateImage, extractWorkoutFromImage, generateBioInsight } from '../services/gemini';
import { RunTrackCoachView } from './RunTrack';

export { RunTrackCoachView as RunTrackManager } from './RunTrack';

// BANCO DE DADOS DE EXERCÍCIOS (COMPLETO)
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
    "Supino alternado sentado aberto na máquina",
    "Supino alternado sentado fechado na máquina",
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
    "Tríceps em pé francês com HBC simultâneo",
    "Tríceps em pé francês com HBC unilateral",
    "Tríceps francês no cross simultâneo",
    "Tríceps francês no cross unilateral",
    "Tríceps mergulho no banco reto",
    "Tríceps no cross with barra reta",
    "Tríceps no cross with barra reta inverso",
    "Tríceps no cross with barra V",
    "Tríceps no cross with barra W",
    "Tríceps no cross with corda",
    "Tríceps no cross inverso unilateral",
    "Tríceps superman no cross segurando nos cabos",
    "Tríceps supinado with HBM banco reto",
    "Tríceps supinado no smith banco reto",
    "Tríceps supinado pegada neutra with HBC",
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
    "Puxada aberta with barra reta no cross polia alta",
    "Puxada aberta with barra romana pulley alto",
    "Puxada aberta no pulley alto",
    "Puxada com triângulo no pulley alto",
    "Puxada supinada with barra reta no cross polia alta",
    "Puxada supinada no pulley alto",
    "Remada aberta with barra reta no cross polia média",
    "Remada aberta with HBC decúbito ventral no banco 45°",
    "Remada aberta alternada with HBC decúbito ventral no banco 45°",
    "Remada aberta declinada no smith",
    "Remada aberta na máquina",
    "Remada baixa barra reta pegada supinada",
    "Remada baixa with barra reta",
    "Remada baixa com triângulo",
    "Remada cavalo with HBL",
    "Remada curvada aberta no cross",
    "Remada curvada aberta no cross unilateral",
    "Remada curvada aberta with HBC",
    "Remada curvada aberta with HBM",
    "Remada curvada supinada no cross",
    "Remada curvada supinada no cross unilateral",
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
    "Remada supinada with barra reta no cross polia média"
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
    "Bíceps superman no cross simultâneo",
    "Bíceps superman no cross unilateral"
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
    "Agachamento em passada with HBC",
    "Agachamento em passada with HBL",
    "Agachamento em passada with HBM",
    "Agachamento em passada with step a frente with HBC",
    "Agachamento em passada with step a frente with HBL",
    "Agachamento em passada with step a frente with HBM",
    "Agachamento em passada com step a frente",
    "Agachamento em passada with step atrás with HBC",
    "Agachamento em passada with step atrás with HBL",
    "Agachamento em passada with step atrás with HBM",
    "Agachamento em passada com step atrás",
    "Agachamento em passada no smith",
    "Agachamento em passada com step a frente no smith",
    "Agachamento em passada com step atrás no Smith",
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
    "Levantar e sentar no banco reto with HBC",
    "Levantar e sentar no banco reto"
  ],
  "Glúteos e Posteriores": [
    "Abdução de quadril decúbito lateral no solo caneleira",
    "Abdução de quadril em pé com caneleira",
    "Agachamento sumô with HBC",
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
    "Flexão de joelho em 3 apoios com caneleira",
    "Flexão de joelho em pé com caneleira",
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
    "Flexão plantar com Halteres.",
    "Flexão plantar em pé na Máquina",
    "Flexão plantar em pé Unilateral",
    "Flexão plantar no Leg press inclinado",
    "Flexão plantar no leg press horizontal"
  ]
};

// BANCO DE DADOS DE IMAGENS (GIFS) PARA MAPEAMENTO AUTOMÁTICO
const GIF_DATABASE: Record<string, string> = {
  "leg press": "https://i.pinimg.com/originals/9e/1f/2a/9e1f2a36b0432924467c6999205307b2.gif",
  "leg press horizontal": "https://i.pinimg.com/originals/9e/1f/2a/9e1f2a36b0432924467c6999205307b2.gif",
  "leg press 45": "https://i.pinimg.com/originals/9e/1f/2a/9e1f2a36b0432924467c6999205307b2.gif", 
  "levantar e sentar": "https://i.pinimg.com/originals/18/31/39/183139366e60970220677270387439da.gif",
  "agachamento": "https://i.pinimg.com/originals/3f/78/3f/3f783f237373024766023277732623a6.gif",
  "agachamento livre": "https://i.pinimg.com/originals/3f/78/3f/3f783f237373024766023277732623a6.gif",
  "agachamento smith": "https://i.pinimg.com/originals/3f/78/3f/3f783f237373024766023277732623a6.gif",
  "abdominal supra": "https://i.pinimg.com/originals/c9/26/50/c92650050893347c6920330424647306.gif",
  "abdominal": "https://i.pinimg.com/originals/c9/26/50/c92650050893347c6920330424647306.gif",
  "prancha": "https://i.pinimg.com/originals/7e/63/01/7e63013d396d74704047c870296700c2.gif",
  "prancha ventral": "https://i.pinimg.com/originals/7e/63/01/7e63013d396d74704047c870296700c2.gif",
  "crucifixo": "https://i.pinimg.com/originals/52/63/a2/5263a236402377a00f40d64996924263.gif",
  "crucifixo aberto": "https://i.pinimg.com/originals/52/63/a2/5263a236402377a00f40d64996924263.gif",
  "supino": "https://i.pinimg.com/originals/52/63/a2/5263a236402377a00f40d64996924263.gif",
  "supino reto": "https://i.pinimg.com/originals/52/63/a2/5263a236402377a00f40d64996924263.gif",
  "puxada": "https://i.pinimg.com/originals/f3/06/18/f30618012675713df8302f354f923b71.gif",
  "puxada alta": "https://i.pinimg.com/originals/f3/06/18/f30618012675713df8302f354f923b71.gif",
  "remada": "https://i.pinimg.com/originals/f3/06/18/f30618012675713df8302f354f923b71.gif",
  "rosca direta": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
  "biceps": "https://i.pinimg.com/originals/24/f8/4a/24f84a86162391694f5be74005b61e21.gif",
  "triceps": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  "polia": "https://i.pinimg.com/originals/8c/54/10/8c54101476c243c9417855b5b91b5c46.gif",
  "stiff": "https://i.pinimg.com/originals/60/0a/85/600a8523c0356191942730628e469d72.gif",
  "mesa flexora": "https://i.pinimg.com/originals/34/00/28/340028e35900508e063806f97653241e.gif",
  "cadeira extensora": "https://i.pinimg.com/originals/94/a5/d8/94a5d85203387c97561337dce95e4e20.gif",
  "panturrilha": "https://i.pinimg.com/originals/b5/02/b7/b502b70f05562d98064402636a04e57e.gif"
};

export function ProfessorDashboard({ students, onLogout, onSelect, onToggleMenu, onNavigate }: { 
  students: Student[], 
  onLogout: () => void, 
  onSelect: (s: Student) => void, 
  onToggleMenu: () => void, 
  onNavigate: (view: string) => void
}) {
  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar text-left flex flex-col items-center">
      <header className="w-full flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onToggleMenu} className="p-3 bg-zinc-900 rounded-2xl text-zinc-500 hover:text-white transition-colors shadow-lg">
            <Menu size={20}/>
          </button>
          <WeatherWidget />
        </div>
        <button onClick={onLogout} className="p-3 bg-zinc-900 rounded-full text-zinc-500 hover:text-red-600 transition-colors shadow-lg">
          <LogOut size={20} />
        </button>
      </header>
      
      <Logo size="text-5xl" subSize="text-[8px]" />

      <div className="w-full max-w-xl mt-8 space-y-4 pb-20">
        <div className="grid grid-cols-1 mb-2">
          <Card className="p-4 bg-zinc-900/50 border-white/5 cursor-pointer active:scale-95 transition-all" onClick={() => onNavigate('FEED')}>
            <div className="p-2 bg-zinc-800 w-fit rounded-xl mb-3">
              <Layout className="text-zinc-400" size={18} />
            </div>
            <h3 className="text-[10px] font-black uppercase italic text-white tracking-widest">Feed Global</h3>
            <p className="text-[7px] text-zinc-500 font-bold uppercase mt-1">Timeline de Atletas</p>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 px-2 mb-2">
            <Users className="text-red-600" size={14} />
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] italic">Gestão de Atletas ({students.length})</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-2.5">
            {students.map(s => (
              <button 
                key={s.id} 
                onClick={() => onSelect(s)} 
                className="w-full bg-zinc-900/50 p-4 rounded-[1.8rem] border border-white/5 hover:border-red-600/40 transition-all text-left shadow-lg flex items-center justify-between group active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/5 shadow-inner">
                    {s.photoUrl ? (
                      <img src={s.photoUrl} className="w-full h-full object-cover" alt={s.nome} />
                    ) : (
                      <Activity className="text-zinc-700" size={18} />
                    )}
                  </div>
                  <div>
                    <p className="font-black uppercase italic text-sm text-white leading-none tracking-tight">{s.nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <p className="text-[8px] text-zinc-500 uppercase font-bold truncate max-w-[120px]">{s.email}</p>
                    </div>
                  </div>
                </div>
                <ChevronRight className="transition-all text-zinc-700 group-hover:text-red-600 group-hover:translate-x-1" size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <EliteFooter />
    </div>
  );
}

const FEATURE_LIST = [
  { id: 'FEED', label: 'Feed Performance', icon: LayoutGrid },
  { id: 'WORKOUTS', label: 'Planilhas Ativas', icon: Dumbbell },
  { id: 'STUDENT_PERIODIZATION', label: 'Periodização PhD', icon: Brain },
  { id: 'STUDENT_ASSESSMENT', label: 'Avaliação Física', icon: Ruler },
  { id: 'RUNTRACK_STUDENT', label: 'RunTrack Elite', icon: Footprints },
  { id: 'ANALYTICS', label: 'Análise de Dados', icon: BarChart3 },
  { id: 'ABOUT_ABFIT', label: 'Sobre a ABFIT', icon: Info },
];

export function StudentManagement({ student, onBack, onNavigate, onEditWorkout, onSave }: { student: Student, onBack: () => void, onNavigate: (v: string) => void, onEditWorkout: (w: Workout | null) => void, onSave: (sid: string, data: any) => void }) {
  const [publishing, setPublishing] = useState(false);
  const workoutsRef = useRef<HTMLDivElement>(null);

  const toggleFeatureVisibility = async (featureId: string) => {
    const currentDisabled = student.disabledFeatures || [];
    let newDisabled;
    if (currentDisabled.includes(featureId)) {
      newDisabled = currentDisabled.filter(id => id !== featureId);
    } else {
      newDisabled = [...currentDisabled, featureId];
    }
    await onSave(student.id, { disabledFeatures: newDisabled });
  };

  const publishAllWorkouts = async () => {
    setPublishing(true);
    const updatedWorkouts = (student.workouts || []).map(w => ({ ...w, status: 'published' as const }));
    await onSave(student.id, { workouts: updatedWorkouts });
    setPublishing(false);
  };

  const hasDrafts = student.workouts?.some(w => w.status === 'draft' || !w.status);

  const scrollToWorkouts = () => {
    workoutsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar text-left">
      <header className="flex items-center justify-between mb-8 sticky top-0 bg-black/90 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            <HeaderTitle text={student.nome} />
          </h2>
        </div>
        {hasDrafts && (
           <button 
            onClick={publishAllWorkouts} 
            disabled={publishing}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 rounded-full font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all"
           >
             {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 
             Publicar
           </button>
        )}
      </header>

      <div className="space-y-3 mb-10">
        <button onClick={scrollToWorkouts} className="w-full p-4 rounded-[2rem] bg-orange-950/20 border border-orange-600/20 flex items-center justify-between group active:scale-95 transition-all shadow-lg hover:border-orange-600/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
                 <Dumbbell size={20} className="text-white" />
              </div>
              <span className="font-black italic uppercase text-white tracking-wider text-sm">Planilhas Ativas</span>
           </div>
           <ChevronRight className="text-orange-600 group-hover:translate-x-1 transition-transform" />
        </button>

        <button onClick={() => onNavigate('PERIODIZATION')} className="w-full p-4 rounded-[2rem] bg-indigo-950/20 border border-indigo-600/20 flex items-center justify-between group active:scale-95 transition-all shadow-lg hover:border-indigo-600/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                 <Brain size={20} className="text-white" />
              </div>
              <span className="font-black italic uppercase text-white tracking-wider text-sm">Periodização PhD</span>
           </div>
           <ChevronRight className="text-indigo-600 group-hover:translate-x-1 transition-transform" />
        </button>

        <button onClick={() => onNavigate('COACH_ASSESSMENT')} className="w-full p-4 rounded-[2rem] bg-emerald-950/20 border border-emerald-600/20 flex items-center justify-between group active:scale-95 transition-all shadow-lg hover:border-emerald-600/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                 <Ruler size={20} className="text-white" />
              </div>
              <span className="font-black italic uppercase text-white tracking-wider text-sm">Avaliação Física</span>
           </div>
           <ChevronRight className="text-emerald-600 group-hover:translate-x-1 transition-transform" />
        </button>

        <button onClick={() => onNavigate('RUNTRACK_MANAGER')} className="w-full p-4 rounded-[2rem] bg-rose-950/20 border border-rose-600/20 flex items-center justify-between group active:scale-95 transition-all shadow-lg hover:border-rose-600/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/20">
                 <Footprints size={20} className="text-white" />
              </div>
              <span className="font-black italic uppercase text-white tracking-wider text-sm">RunTrack Elite</span>
           </div>
           <ChevronRight className="text-rose-600 group-hover:translate-x-1 transition-transform" />
        </button>

        <button onClick={() => onNavigate('ANALYTICS_COACH')} className="w-full p-4 rounded-[2rem] bg-blue-950/20 border border-blue-600/20 flex items-center justify-between group active:scale-95 transition-all shadow-lg hover:border-blue-600/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                 <BarChart3 size={20} className="text-white" />
              </div>
              <span className="font-black italic uppercase text-white tracking-wider text-sm">Análise de Dados</span>
           </div>
           <ChevronRight className="text-blue-600 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="mt-8 space-y-4" ref={workoutsRef}>
         <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] italic">Gerenciar Planilhas</h3>
            <span className="text-[8px] font-black uppercase text-zinc-700 bg-zinc-900 px-2 py-1 rounded-md">{student.workouts?.length || 0} Ativas</span>
         </div>
         <div className="space-y-3">
            {(student.workouts || []).map(w => (
              <div key={w.id} className="p-6 rounded-[2rem] border border-white/5 bg-zinc-900/50 flex justify-between items-center group transition-all shadow-lg hover:border-orange-600/30">
                 <div className="flex items-center gap-4">
                    <span className="font-black uppercase italic text-lg text-white leading-none">{w.title}</span>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase italic ${w.status === 'published' ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-600/20' : 'bg-orange-600/10 text-orange-500 border border-orange-600/20'}`}>
                      {w.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                 </div>
                 <button onClick={() => { onEditWorkout(w); onNavigate('WORKOUT_EDITOR'); }} className="p-3 rounded-xl bg-zinc-800 text-zinc-500 hover:text-white hover:bg-red-600 transition-all">
                    <Edit3 size={18}/>
                 </button>
              </div>
            ))}
            {(!student.workouts || student.workouts.length === 0) && (
              <div className="text-center py-6 border-2 border-dashed border-zinc-900 rounded-[2rem] space-y-3">
                 <p className="text-zinc-700 text-[10px] font-black uppercase">Nenhuma planilha ativa</p>
                 <button onClick={() => { onEditWorkout(null); onNavigate('WORKOUT_EDITOR'); }} className="px-6 py-2 bg-red-600 rounded-full text-[10px] font-black uppercase text-white shadow-lg">Criar Novo Treino</button>
              </div>
            )}
            
            <button onClick={() => { onEditWorkout(null); onNavigate('WORKOUT_EDITOR'); }} className="w-full py-4 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-[2rem] text-zinc-500 hover:text-white hover:border-red-600/50 transition-all flex items-center justify-center gap-2 group">
              <Plus size={16} className="group-hover:text-red-600 transition-colors"/>
              <span className="text-[10px] font-black uppercase tracking-widest">Novo Treino</span>
            </button>
         </div>
      </div>

      <div className="mt-12 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <Eye size={16} className="text-red-600" />
          <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] italic">Visibilidade do Dashboard</h3>
        </div>
        <Card className="bg-zinc-900/50 border-zinc-800 p-6">
          <div className="grid grid-cols-1 gap-3">
            {FEATURE_LIST.map((feature) => {
              const isDisabled = (student.disabledFeatures || []).includes(feature.id);
              return (
                <div 
                  key={feature.id} 
                  onClick={() => toggleFeatureVisibility(feature.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all group active:scale-[0.98] ${isDisabled ? 'bg-zinc-950 border-zinc-800' : 'bg-black/60 border-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <feature.icon size={16} className={isDisabled ? "text-zinc-700" : "text-red-600"} />
                    <span className={`text-xs font-black uppercase italic ${isDisabled ? 'text-zinc-600 line-through' : 'text-white'}`}>
                      {feature.label}
                    </span>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner ${isDisabled ? 'bg-zinc-800' : 'bg-red-600'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${isDisabled ? 'left-1' : 'left-7'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <EliteFooter />
    </div>
  );
}

export function WorkoutEditorView({ student, workoutToEdit, onBack, onSave }: { student: Student, workoutToEdit: Workout | null, onBack: () => void, onSave: (sid: string, data: any) => void }) {
  const [title, setTitle] = useState(workoutToEdit?.title || '');
  const [projectedSessions, setProjectedSessions] = useState<number>(workoutToEdit?.projectedSessions || 12);
  const [exercises, setExercises] = useState<Exercise[]>(workoutToEdit?.exercises || []);
  const [saveState, setSaveState] = useState<'idle' | 'loading' | 'saved'>('idle');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [defaultSets, setDefaultSets] = useState(workoutToEdit?.defaultSets || '');
  const [defaultReps, setDefaultReps] = useState(workoutToEdit?.defaultReps || '');
  const [defaultRest, setDefaultRest] = useState(workoutToEdit?.defaultRest || '');
  
  // Estado para adição manual
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualMuscleGroup, setManualMuscleGroup] = useState("");
  const [manualExerciseName, setManualExerciseName] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleApplyDefaults = () => {
    if (!defaultSets && !defaultReps && !defaultRest) return;
    const updatedExercises = exercises.map(ex => ({
      ...ex,
      sets: defaultSets || ex.sets,
      reps: defaultReps || ex.reps,
      rest: defaultRest || ex.rest
    }));
    setExercises(updatedExercises);
  };

  const handleAddManualExercise = () => {
    if (!manualExerciseName) return;
    
    // Busca GIF
    const matchKey = Object.keys(GIF_DATABASE).find(key => 
      manualExerciseName.toLowerCase().includes(key.toLowerCase())
    );

    const newEx: Exercise = {
        id: Date.now().toString() + Math.random(),
        name: manualExerciseName,
        sets: defaultSets || '3',
        reps: defaultReps || '12',
        rest: defaultRest || '60',
        thumb: matchKey ? GIF_DATABASE[matchKey] : undefined
    };

    setExercises([...exercises, newEx]);
    setManualExerciseName("");
    setManualMuscleGroup("");
    setShowManualInput(false);
  };

  const handleSaveWorkout = async () => {
    setSaveState('loading');
    const finalSessions = Number(projectedSessions);
    const safeSessions = isNaN(finalSessions) || finalSessions < 1 ? 12 : finalSessions;

    const newWorkout: Workout = {
      id: workoutToEdit?.id || Date.now().toString(),
      title: title || 'Novo Treino',
      exercises: exercises,
      projectedSessions: safeSessions,
      status: 'draft',
      defaultSets: defaultSets,
      defaultReps: defaultReps,
      defaultRest: defaultRest
    };

    const currentWorkouts = student.workouts || [];
    let updatedWorkouts;
    if (workoutToEdit) {
      updatedWorkouts = currentWorkouts.map(w => w.id === workoutToEdit.id ? newWorkout : w);
    } else {
      updatedWorkouts = [...currentWorkouts, newWorkout];
    }

    try {
      const savePromise = onSave(student.id, { workouts: updatedWorkouts });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Save Timeout')), 10000));
      await Promise.race([savePromise, timeoutPromise]);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (e) {
      console.error("Save error:", e);
      setSaveState('idle');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsAnalyzing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const extractedExercises = await extractWorkoutFromImage(base64);
          const enrichedExercises = extractedExercises.map(ex => {
            const matchKey = Object.keys(GIF_DATABASE).find(key => 
              ex.name.toLowerCase().includes(key.toLowerCase())
            );
            return {
              ...ex,
              id: Date.now().toString() + Math.random(),
              thumb: matchKey ? GIF_DATABASE[matchKey] : undefined,
              sets: ex.sets || defaultSets || '3',
              reps: ex.reps || defaultReps || '12',
              rest: ex.rest || defaultRest || '60'
            };
          });
          setExercises(prev => [...prev, ...enrichedExercises]);
        } catch (error) {
          console.error(error);
          alert("Erro ao analisar imagem. Tente novamente.");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateExerciseRest = (idx: number, val: string) => {
    const updated = [...exercises];
    updated[idx] = { ...updated[idx], rest: val };
    setExercises(updated);
  };

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar text-left">
      <header className="flex items-center justify-between mb-10 sticky top-0 bg-black/90 backdrop-blur-md z-50 py-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            <HeaderTitle text="Editor de Treino" />
          </h2>
        </div>
        <button 
          onClick={handleSaveWorkout} 
          disabled={saveState === 'loading'}
          className={`px-8 py-3 rounded-full font-black text-[10px] uppercase shadow-xl transition-all flex items-center gap-2 ${saveState === 'loading' ? 'bg-orange-600 animate-pulse' : saveState === 'saved' ? 'bg-emerald-600' : 'bg-red-600'}`}
        >
          {saveState === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
          {saveState === 'loading' ? 'Salvando...' : saveState === 'saved' ? 'Salvo!' : 'Salvar'}
        </button>
      </header>

      <div className="space-y-6 pb-32">
        <Card className="p-6 bg-zinc-900/50 space-y-4">
           <div>
             <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-1 block">Nome da Planilha</label>
             <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="TÍTULO DO TREINO" className="w-full bg-black border border-zinc-800 p-5 rounded-2xl text-white font-black italic text-lg outline-none focus:border-red-600" />
           </div>
           
           <div>
             <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-1 block">Validade (Sessões)</label>
             <input type="number" value={projectedSessions} onChange={e => setProjectedSessions(parseInt(e.target.value) || 0)} placeholder="Ex: 12" className="w-full bg-black border border-zinc-800 p-5 rounded-2xl text-white font-black italic text-lg outline-none focus:border-red-600" />
             <p className="text-[8px] text-zinc-600 mt-2 uppercase tracking-wide">O contador inicia automaticamente após o primeiro treino concluído.</p>
           </div>

           <div className="pt-4 border-t border-white/5">
             <div className="flex justify-between items-center mb-2">
               <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] block">Padronização de Carga</label>
               <button onClick={handleApplyDefaults} className="flex items-center gap-1 text-[8px] font-black uppercase text-red-500 hover:text-white transition-colors bg-red-600/10 px-2 py-1 rounded-md">
                  <Copy size={10} /> Aplicar Padrão a Todos
               </button>
             </div>
             <div className="grid grid-cols-3 gap-3">
               <div>
                 <input type="text" value={defaultSets} onChange={e => setDefaultSets(e.target.value)} placeholder="SÉRIES" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white font-black italic text-sm outline-none focus:border-red-600 text-center" />
                 <p className="text-[7px] text-zinc-600 uppercase text-center mt-1 font-bold">Séries</p>
               </div>
               <div>
                 <input type="text" value={defaultReps} onChange={e => setDefaultReps(e.target.value)} placeholder="REPS" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white font-black italic text-sm outline-none focus:border-red-600 text-center" />
                 <p className="text-[7px] text-zinc-600 uppercase text-center mt-1 font-bold">Repetições</p>
               </div>
               <div>
                 <input type="text" value={defaultRest} onChange={e => setDefaultRest(e.target.value)} placeholder="SEG" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white font-black italic text-sm outline-none focus:border-red-600 text-center" />
                 <p className="text-[7px] text-zinc-600 uppercase text-center mt-1 font-bold">Descanso (s)</p>
               </div>
             </div>
           </div>
        </Card>

        <div className="space-y-4">
           <div className="flex items-center justify-between pl-2">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Exercícios ({exercises.length})</h3>
              
              <div className="flex items-center gap-2">
                  <button 
                     onClick={() => setShowManualInput(!showManualInput)}
                     className="flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700 hover:border-red-600/50 transition-colors"
                  >
                     <Edit3 size={12} className="text-zinc-400" />
                     <span className="text-[8px] font-black uppercase text-zinc-400">Manual</span>
                  </button>

                  <div 
                     onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                     className="flex items-center gap-2 cursor-pointer group p-1 opacity-70 hover:opacity-100 transition-all bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700 hover:border-red-600/50"
                  >
                      {isAnalyzing ? (
                         <div className="flex items-center gap-1">
                            <Loader2 size={12} className="text-orange-500 animate-spin" />
                            <span className="text-[8px] font-black uppercase text-orange-500">Lendo...</span>
                         </div>
                      ) : (
                         <div className="flex items-center gap-1">
                            <Scan size={12} className="text-zinc-400" />
                            <span className="text-[8px] font-black uppercase text-zinc-400">Importar Print</span>
                         </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
              </div>
           </div>

           {/* AREA DE INSERÇÃO MANUAL */}
           {showManualInput && (
             <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl animate-in slide-in-from-top-2 space-y-3">
                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Adicionar da Base de Dados</p>
                <select 
                  className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-xs text-white outline-none"
                  value={manualMuscleGroup}
                  onChange={(e) => setManualMuscleGroup(e.target.value)}
                >
                   <option value="">Selecione Grupo Muscular</option>
                   {Object.keys(EXERCISE_DATABASE).map(group => (
                      <option key={group} value={group}>{group}</option>
                   ))}
                </select>
                
                {manualMuscleGroup && (
                   <select 
                     className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-xs text-white outline-none"
                     value={manualExerciseName}
                     onChange={(e) => setManualExerciseName(e.target.value)}
                   >
                      <option value="">Selecione Exercício</option>
                      {EXERCISE_DATABASE[manualMuscleGroup].map((ex, i) => (
                         <option key={i} value={ex}>{ex}</option>
                      ))}
                   </select>
                )}

                <button 
                  onClick={handleAddManualExercise}
                  disabled={!manualExerciseName}
                  className="w-full py-3 bg-red-600 rounded-xl text-[10px] font-black uppercase text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                   Adicionar à Lista
                </button>
             </div>
           )}

           {exercises.map((ex, i) => (
             <div key={i} className="flex flex-col gap-2 bg-zinc-900 p-4 rounded-2xl border border-white/5 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-xl overflow-hidden shrink-0 border border-white/10">
                     {ex.thumb ? (
                       <img src={ex.thumb} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                         <Dumbbell size={16} className="text-zinc-600"/>
                       </div>
                     )}
                  </div>
                  <div className="flex-1">
                     <p className="text-xs font-black uppercase italic text-white leading-tight">{ex.name}</p>
                     <p className="text-[10px] text-zinc-500 font-bold">{ex.sets}x{ex.reps} • {ex.method || 'Série Estável'}</p>
                  </div>
                  <button onClick={() => setExercises(exercises.filter((_, idx) => idx !== i))} className="text-zinc-700 hover:text-red-600"><Trash2 size={16}/></button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                   <label className="text-[8px] font-black uppercase text-zinc-600">Descanso:</label>
                   <input type="text" value={ex.rest} onChange={(e) => updateExerciseRest(i, e.target.value)} className="bg-black border border-zinc-800 rounded px-2 py-1 text-[10px] text-white w-16 text-center outline-none focus:border-red-600" />
                </div>
             </div>
           ))}
           <button onClick={() => onBack()} className="w-full py-6 border-2 border-dashed border-zinc-900 rounded-[2rem] text-zinc-700 text-[10px] font-black uppercase hover:border-red-600/30 hover:text-red-600 transition-all">
             Voltar
           </button>
        </div>
      </div>
    </div>
  );
}

export function CoachAssessmentView({ student, onBack, onSave }: { student: Student, onBack: () => void, onSave: (id: string, data: any) => void }) {
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!weight || !bodyFat) return;
    setSaving(true);
    const newAssessment = {
      id: Date.now().toString(),
      data: new Date().toISOString(),
      peso: weight,
      altura: height || (student.height as string) || '',
      bio_percentual_gordura: bodyFat
    };
    const updatedAssessments = [newAssessment, ...(student.physicalAssessments || [])];
    await onSave(student.id, { 
      physicalAssessments: updatedAssessments,
      weight: weight,
      height: height || student.height
    });
    setSaving(false);
    onBack();
  };

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar text-left">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/90 backdrop-blur-md z-50 py-4 -mx-6 px-6 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter">
          <HeaderTitle text="Nova Avaliação" />
        </h2>
      </header>

      <Card className="p-8 bg-zinc-900/50 border-white/5 space-y-6">
        <div>
          <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 block">Peso Corporal (kg)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0.0" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white font-black italic text-lg outline-none focus:border-red-600" />
        </div>
        <div>
           <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 block">Altura (cm)</label>
           <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder={String(student.height || '')} className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white font-black italic text-lg outline-none focus:border-red-600" />
        </div>
        <div>
           <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 block">Gordura Corporal (%)</label>
           <input type="number" value={bodyFat} onChange={e => setBodyFat(e.target.value)} placeholder="0.0" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white font-black italic text-lg outline-none focus:border-red-600" />
        </div>
        <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-red-600 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2">
          {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Salvar Avaliação
        </button>
      </Card>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] pl-2">Histórico Recente</h3>
        {(student.physicalAssessments || []).map(a => (
           <div key={a.id} className="flex justify-between items-center p-4 bg-zinc-900 rounded-2xl border border-white/5">
              <div>
                 <p className="text-xs font-black text-white">{new Date(a.data).toLocaleDateString('pt-BR')}</p>
                 <p className="text-[10px] text-zinc-500 mt-1">{a.peso}kg • {a.bio_percentual_gordura}% Gordura</p>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
}

export function PeriodizationView({ student, onBack, onProceedToWorkout, onSave }: { student: Student, onBack: () => void, onProceedToWorkout: () => void, onSave: (id: string, data: any) => void }) {
   const p = student.periodization || {} as any;
   const [phaseTitle, setPhaseTitle] = useState(p.phaseTitle || '');
   const [generalStrategy, setGeneralStrategy] = useState(p.generalStrategy || '');
   const [safetyNotes, setSafetyNotes] = useState(p.clinicalSafety ? p.clinicalSafety.join('\n') : '');
   const [bioContext, setBioContext] = useState(p.bioInsight?.context || '');
   const [bioTips, setBioTips] = useState(p.bioInsight?.tips ? p.bioInsight.tips.join('\n') : '');
   const [generating, setGenerating] = useState(false);
   
   const handleAI = async () => {
      setGenerating(true);
      const insight = await generateBioInsight({ name: student.nome, phase: phaseTitle });
      if (insight) setBioContext(insight);
      setGenerating(false);
   };

   const handleSave = () => {
      const newPeriodization = {
         ...p,
         id: p.id || Date.now().toString(),
         startDate: p.startDate || new Date().toISOString(),
         phaseTitle,
         generalStrategy,
         clinicalSafety: safetyNotes.split('\n').filter((s: string) => s.trim()),
         bioInsight: {
            context: bioContext,
            tips: bioTips.split('\n').filter((s: string) => s.trim())
         },
         type: 'STRENGTH'
      };
      onSave(student.id, { periodization: newPeriodization });
      onBack();
   };

   return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar text-left">
      <header className="flex items-center justify-between mb-10 sticky top-0 bg-black/90 backdrop-blur-md z-50 py-4 -mx-6 px-6 border-b border-white/5">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
           <h2 className="text-xl font-black italic uppercase tracking-tighter">
             <HeaderTitle text="Periodização PhD" />
           </h2>
        </div>
        <button onClick={onProceedToWorkout} className="text-[10px] font-black uppercase text-zinc-500 hover:text-white flex items-center gap-1">
           Ir para Treinos <ChevronRight size={12} />
        </button>
      </header>
      
      <div className="space-y-6 pb-20">
         <Card className="p-6 bg-zinc-900/50 border-white/5 space-y-4">
            <div>
               <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 block">Fase Atual</label>
               <input type="text" value={phaseTitle} onChange={e => setPhaseTitle(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white font-bold text-sm outline-none focus:border-red-600" placeholder="Ex: Hipertrofia Metabólica" />
            </div>
            <div>
               <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 block">Estratégia Geral</label>
               <textarea rows={4} value={generalStrategy} onChange={e => setGeneralStrategy(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white text-sm outline-none focus:border-red-600 resize-none" placeholder="Descreva a estratégia macro..." />
            </div>
         </Card>

         <Card className="p-6 bg-red-950/10 border-red-900/20 space-y-4">
             <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Segurança Clínica</h3>
             </div>
             <textarea rows={3} value={safetyNotes} onChange={e => setSafetyNotes(e.target.value)} className="w-full bg-black/50 border border-red-900/30 p-4 rounded-2xl text-zinc-300 text-sm outline-none focus:border-red-600 resize-none" placeholder="Uma nota por linha..." />
         </Card>

         <Card className="p-6 bg-gradient-to-br from-indigo-950/20 to-black border-indigo-900/20 space-y-4">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-indigo-500">
                   <Brain size={16} />
                   <h3 className="text-[10px] font-black uppercase tracking-widest">Bio-Insight (IA)</h3>
                </div>
                <button onClick={handleAI} disabled={generating} className="bg-indigo-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase text-white hover:bg-indigo-700 transition-colors flex items-center gap-1">
                   {generating ? <Loader2 className="animate-spin" size={10} /> : <Sparkles size={10} />} Gerar
                </button>
             </div>
             <textarea rows={3} value={bioContext} onChange={e => setBioContext(e.target.value)} className="w-full bg-black/50 border border-indigo-900/30 p-4 rounded-2xl text-zinc-300 text-sm outline-none focus:border-indigo-600 resize-none" placeholder="Contexto científico..." />
             <textarea rows={3} value={bioTips} onChange={e => setBioTips(e.target.value)} className="w-full bg-black/50 border border-indigo-900/30 p-4 rounded-2xl text-zinc-300 text-sm outline-none focus:border-indigo-600 resize-none" placeholder="Dicas práticas (uma por linha)..." />
         </Card>

         <button onClick={handleSave} className="w-full py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-zinc-200 transition-all">
            Salvar Periodização
         </button>
      </div>
    </div>
   );
}
