
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, LogOut, ChevronRight, Edit3, Plus, 
  Trash2, Loader2, Brain, Activity, Target, TrendingUp, 
  BookOpen, Zap, AlertCircle, Dumbbell,
  Image as ImageIcon, Save, Book, Ruler, Scale, Footprints,
  Users, Info, Sparkles, LayoutGrid, Calendar, Clock, Play, FileText, Folder,
  ChevronDown, Lightbulb, Bell, CalendarClock, Search, Check, Layers, Video, X
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
    "Desenvolvimento em pé fechado pronado com HBM",
    "Desenvolvimento em pé fechado supinado com HBC",
    "Desenvolvimento em pé fechado supinado com HBM",
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
    "Remada aberta com HBC decúbito ventral no banco 45°",
    "Remada aberta alternada com HBC decúbito ventral no banco 45°",
    "Remada aberta declinada no smith",
    "Remada aberta na máquina",
    "Remada baixa barra reta pegada supinada",
    "Remada baixa com barra reta",
    "Remada baixa com triângulo",
    "Remada cavalo com HBL",
    "Remada curvada aberta com cross",
    "Remada curvada aberta com cross unilateral",
    "Remada curvada aberta com HBC",
    "Remada curvada aberta com HBM",
    "Remada curvada supinada com cross",
    "Remada curvada supinada com cross unilateral",
    "Remada curvada supinada com HBC",
    "Remada curvada supinada com HBM",
    "Remada fechada alternada com HBC decubito ventral no banco 45°",
    "Remada fechada com HBC decúbito ventral no banco 45°",
    "Remada fechada na máquina",
    "Remada no banco em 3 apoios pegada aberta com HBC unilateral",
    "Remada no banco em 3 apoios pegada neutra com HBC unilateral",
    "Remada no banco em 3 apoios pegada neutra no cross unilateral",
    "Remada no banco em 3 apoios pegada supinada com HBC unilateral",
    "Remada no banco em 3 apoios pegada supinada no cross unilateral",
    "Remada supinada com barra reta no cross polia média"
  ],
  "Biceps": [
    "Bíceps banco 45º com HBC pegada neutra simultâneo",
    "Bíceps banco 45º com HBC pegada neutra unilateral",
    "Bíceps banco 45º com HBC pegada pronada simultâneo",
    "Bíceps banco 45º com HBC pegada pronada unilateral",
    "Bíceps banco 45º com HBC pegada supinada simultâneo",
    "Bíceps banco 45º com HBC pegada supinada unilateral",
    "Bíceps banco 75º com HBC pegada neutra simultâneo",
    "Bíceps banco 75º com HBC pegada neutra unilateral",
    "Bíceps banco 75º com HBC pegada pronada simultâneo",
    "Bíceps banco 75º com HBC pegada pronada unilateral",
    "Bíceps banco 75º com HBC pegada supinada simultâneo",
    "Bíceps banco 75º com HBC pegada supinada unilateral",
    "Bíceps concentrado com HBC unilateral",
    "Bíceps em pé com HBC pegada neutra alternado",
    "Bíceps em pé com HBC pegada neutra simultâneo",
    "Bíceps em pé com HBC pegada neutra unilateral",
    "Bíceps em pé com HBC pegada pronada alternado",
    "Bíceps em pé com HBC pegada pronada simultâneo",
    "Bíceps em pé com HBC pegada pronada unilateral",
    "Bíceps em pé com HBC pegada supinada alternado",
    "Bíceps em pé com HBC pegada supinada simultâneo",
    "Bíceps em pé com HBC pegada supinada unilateral",
    "Bíceps em pé com HBM pegada pronada",
    "Bíceps em pé com HBM pegada supinada",
    "Bíceps no banco scott com HBC simultâneo",
    "Bíceps no banco scott com HBC unilateral",
    "Bíceps no banco scott com HBM pronado",
    "Bíceps no banco scott com HBM supinado",
    "Bíceps no banco scott com HBW simultâneo",
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
    "Agachamento em passada com HBC",
    "Agachamento em passada com HBL",
    "Agachamento em passada com HBM",
    "Agachamento em passada com step a frente com HBC",
    "Agachamento em passada com step a frente com HBL",
    "Agachamento em passada com step a frente com HBM",
    "Agachamento em passada com step a frente",
    "Agachamento em passada com step atrás com HBC",
    "Agachamento em passada com step atrás com HBL",
    "Agachamento em passada com step atrás com HBM",
    "Agachamento em passada com step atrás",
    "Agachamento em passada no smith",
    "Agachamento em passada com step a frente no smith",
    "Agachamento em passada com step atrás no Smith",
    "Agachamento livre com HBC",
    "Agachamento livre com HBL barra sobre ombros",
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
    "Levantar e sentar do banco reto com HBM",
    "Levantar e sentar no banco reto com HBC",
    "Levantar e sentar no banco reto"
  ],
  "Glúteos e Posteriores": [
    "Abdução de quadril decúbito lateral no solo caneleira",
    "Abdução de quadril em pé com caneleira",
    "Agachamento sumô com HBC",
    "Agachamento sumô com HBM",
    "Cadeira flexora alternado",
    "Cadeira flexora unilateral",
    "Cadeira flexora",
    "Elevação de quadril no banco reto com HBM",
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
    "Levantamento terra com HBC",
    "Levantamento terra com HBL",
    "Levantamento terra com HBM",
    "Levantamento terra no cross",
    "Levantamento terra romeno com HBM",
    "Mesa flexora alternado",
    "Mesa flexora unilateral",
    "Mesa flexora",
    "Stiff com HBC simultâneo",
    "Stiff com HBC unilateral",
    "Stiff com HBM simultâneo",
    "Stiff “bom dia” com HBM",
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

const EXECUTION_METHODS = ["Simples", "Conjugada", "Drop Set", "Pirâmide", "Rest-Pause", "SST"];

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

export function WorkoutEditorView({ student, workoutToEdit, onBack, onSave }: { student: Student, workoutToEdit: Workout | null, onBack: () => void, onSave: (id: string, data: any) => void }) {
  const [title, setTitle] = useState(workoutToEdit?.title || '');
  const [exercises, setExercises] = useState<Exercise[]>(workoutToEdit?.exercises || []);
  const [projectedSessions, setProjectedSessions] = useState(workoutToEdit?.projectedSessions?.toString() || '12');
  
  // PrescreveAI Specific State
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [isGeneratingCue, setIsGeneratingCue] = useState(false);
  const [technicalCue, setTechnicalCue] = useState("");
  const [bioInsight, setBioInsight] = useState("");
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  const detailSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (student) {
      generateBioInsight(student).then(setBioInsight);
    }
  }, [student]);

  const handleSelectExerciseWithDelay = async (exName: string) => {
    setSelectedExercise({ name: exName });
    setTechnicalCue("");
    setImageLoading(true);

    if (detailSectionRef.current) {
      detailSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // 0.5s snap delay for AI engine simulation
    setTimeout(async () => {
      const result = await analyzeExerciseAndGenerateImage(exName, student);
      if (result) {
        setSelectedExercise(result);
      }
      setImageLoading(false);
    }, 500);
  };

  const addExerciseToWorkout = (ex: any) => {
    const newEx: Exercise = {
      id: Date.now().toString(),
      name: ex.name,
      description: ex.description,
      thumb: ex.imageUrl,
      benefits: ex.benefits,
      sets: '3',
      reps: '10-12',
      rest: '60s',
      executionType: 'Simples'
    };
    setExercises([...exercises, newEx]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
  };

  const handleSave = async () => {
    const workout: Workout = { 
      id: workoutToEdit?.id || Date.now().toString(), 
      title, 
      exercises,
      projectedSessions: parseInt(projectedSessions),
      startDate: workoutToEdit?.startDate || new Date().toISOString()
    };
    const updatedWorkouts = workoutToEdit 
      ? (student.workouts || []).map(w => w.id === workout.id ? workout : w)
      : [...(student.workouts || []), workout];
    await onSave(student.id, { workouts: updatedWorkouts });
    onBack();
  };

  return (
    <div className="p-6 text-white bg-black h-screen overflow-y-auto custom-scrollbar text-left">
      <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-50 -mx-6 px-6 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter"><HeaderTitle text="PrescreveAI Elite" /></h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-40">
        {/* Left: Configuration and Inventory */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-zinc-900/50 border-white/5">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 block italic">Título do Ciclo</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-black text-white italic outline-none focus:border-red-600" placeholder="EX: TREINO A" />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 block italic">Volume Total</label>
                <input type="number" value={projectedSessions} onChange={e => setProjectedSessions(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-black text-red-600 italic outline-none focus:border-red-600" />
              </div>
            </div>
          </Card>

          {bioInsight && (
            <div className="bg-red-600/5 border border-red-600/20 rounded-[2rem] p-6 animate-in slide-in-from-left-4">
              <div className="flex items-center gap-2 mb-4">
                 <Sparkles className="w-4 h-4 text-red-600" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Bio-Insight PhD ✨</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed italic">{bioInsight}</p>
            </div>
          )}

          <div className="bg-zinc-900/40 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-md">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-2 italic">
              <Target className="w-4 h-4 text-red-600" /> Inventário Prescrito
            </h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-zinc-600 mb-3 block uppercase tracking-widest italic">Grupo Muscular</label>
                <select className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-red-600 outline-none appearance-none cursor-pointer" value={selectedMuscle} onChange={(e) => setSelectedMuscle(e.target.value)}>
                  <option value="">Selecione...</option>
                  {Object.keys(EXERCISE_DATABASE).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {selectedMuscle && (
                <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {EXERCISE_DATABASE[selectedMuscle].map((exName, i) => (
                    <button key={i} onClick={() => handleSelectExerciseWithDelay(exName)} className={`text-left px-5 py-4 rounded-2xl text-[10px] transition-all border flex items-center justify-between group ${selectedExercise?.name === exName ? 'bg-red-600 border-red-600 text-white font-black' : 'bg-black border-white/5 text-zinc-500 hover:bg-zinc-900'}`}>
                      <span className="truncate">{exName}</span>
                      <Play className={`w-3 h-3 ${selectedExercise?.name === exName ? 'fill-white' : 'fill-red-600'}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: AI Detail & Plan Summary */}
        <div className="lg:col-span-8 space-y-8">
          <div ref={detailSectionRef}>
            {selectedExercise ? (
              <div className="bg-zinc-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden border-b border-white/5">
                  {imageLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-20">
                      <Loader2 className="w-12 h-12 animate-spin text-red-600" />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 mt-4 italic">Analysing Biomechanics...</span>
                    </div>
                  ) : selectedExercise.imageUrl && (
                    <div className="w-full h-full relative video-motion-engine">
                      <img src={selectedExercise.imageUrl} alt="Execução" className="w-full h-full object-cover" />
                      <div className="absolute top-8 left-8 flex items-center gap-3">
                        <div className="bg-red-600 h-2 w-2 rounded-full animate-pulse shadow-lg"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">LIVE BIOMECHANIC FEED</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-10">
                  <div className="flex justify-between items-start mb-10">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none max-w-lg">{selectedExercise.name}</h2>
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        setIsGeneratingCue(true);
                        const cue = await generateTechnicalCue(selectedExercise.name, student);
                        setTechnicalCue(cue);
                        setIsGeneratingCue(false);
                      }} className="bg-amber-500 p-4 rounded-2xl hover:scale-105 transition-all shadow-lg">
                        {isGeneratingCue ? <Loader2 size={24} className="animate-spin text-black" /> : <Lightbulb size={24} className="text-black" />}
                      </button>
                      <button onClick={() => addExerciseToWorkout(selectedExercise)} className="bg-red-600 p-4 rounded-2xl hover:scale-105 transition-all shadow-lg text-white">
                        <Plus size={24} />
                      </button>
                    </div>
                  </div>

                  {technicalCue && (
                    <div className="mb-10 p-6 bg-white/5 border border-amber-500/30 rounded-3xl animate-in zoom-in-95">
                      <div className="flex items-center gap-2 mb-3 text-amber-500">
                         <Zap size={14} className="fill-amber-500" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Dica PhD ✨</span>
                      </div>
                      <p className="text-sm text-zinc-200 italic font-medium">"{technicalCue}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 flex items-center gap-2 italic">Técnica Aplicada</h4>
                      <p className="text-zinc-400 text-sm leading-relaxed border-l-2 border-red-600/20 pl-6 italic">{selectedExercise.description || "Iniciando processamento biomecânico..."}</p>
                    </div>
                    <div className="bg-black/50 p-8 rounded-[2rem] border border-white/5 shadow-inner">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 italic">Impacto Fisiológico</h4>
                      <p className="text-zinc-300 text-[11px] leading-relaxed italic">{selectedExercise.benefits}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[500px] flex flex-col items-center justify-center text-zinc-800 border-2 border-dashed border-white/5 rounded-[3rem] bg-zinc-950/20">
                <Video className="w-16 h-16 opacity-10 mb-6" />
                <p className="font-black uppercase tracking-[0.4em] text-[10px] text-red-600 text-center px-12 italic">Selecione um exercício para ver a biomecânica 8K analisada por IA</p>
              </div>
            )}
          </div>

          {/* Current Plan List */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black uppercase text-zinc-400 tracking-[0.2em] italic flex items-center gap-2 pl-2">
              <Dumbbell size={16} className="text-red-600" /> Planilha de Execução ({exercises.length})
            </h3>
            <div className="space-y-4">
              {exercises.map((ex, i) => (
                <Card key={ex.id} className="p-6 bg-zinc-900 border-zinc-800 relative">
                  <button onClick={() => removeExercise(ex.id!)} className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                  <div className="flex gap-6 mb-6">
                    <div className="w-20 h-20 bg-black rounded-2xl overflow-hidden shrink-0 border border-white/5 shadow-inner">
                      {ex.thumb ? <img src={ex.thumb} className="w-full h-full object-cover" /> : <Activity className="m-auto mt-6 text-zinc-800" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">{ex.name}</h4>
                      <div className="mt-4">
                         <label className="text-[8px] font-black text-zinc-500 uppercase italic mb-1 block">Método</label>
                         <select value={ex.executionType} onChange={e => updateExercise(ex.id!, 'executionType', e.target.value)} className="w-full bg-black border border-white/10 p-2 rounded-xl text-[10px] font-black text-red-600 uppercase italic outline-none">
                            {EXECUTION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                         </select>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[8px] font-black text-zinc-500 uppercase block mb-1">Séries</label>
                      <input type="text" value={ex.sets} onChange={e => updateExercise(ex.id!, 'sets', e.target.value)} className="w-full bg-black border border-white/5 p-3 rounded-xl text-xs font-black text-white text-center" />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-zinc-500 uppercase block mb-1">Reps</label>
                      <input type="text" value={ex.reps} onChange={e => updateExercise(ex.id!, 'reps', e.target.value)} className="w-full bg-black border border-white/5 p-3 rounded-xl text-xs font-black text-white text-center" />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-zinc-500 uppercase block mb-1">Pausa</label>
                      <input type="text" value={ex.rest} onChange={e => updateExercise(ex.id!, 'rest', e.target.value)} className="w-full bg-black border border-white/5 p-3 rounded-xl text-xs font-black text-white text-center" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <button onClick={handleSave} className="w-full py-7 bg-red-600 hover:bg-red-700 rounded-[2.5rem] font-black uppercase tracking-widest text-sm italic flex items-center justify-center gap-4 shadow-2xl shadow-red-900/40 active:scale-95 transition-all mt-10">
            <Save size={24}/> Finalizar Prescrição Elite
          </button>
        </div>
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
        <h2 className="text-xl font-black italic uppercase tracking-tighter"><HeaderTitle text="Avaliação Bio" /></h2>
      </header>
      
      <Card className="p-8 bg-zinc-900/80 border-l-4 border-l-emerald-600 space-y-8 shadow-2xl">
        <div className="flex items-center gap-4">
           <Scale className="text-emerald-500" size={32} />
           <div>
             <h3 className="text-xl font-black italic uppercase text-white">Medidas Elite</h3>
             <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Protocolo Antropométrico</p>
           </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Peso (kg)</label>
            <input type="number" value={peso} onChange={e => setPeso(e.target.value)} className="w-full p-5 bg-black border border-white/10 rounded-[1.5rem] font-black text-white outline-none focus:border-emerald-500 transition-all text-center text-lg" placeholder="00.0" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Altura (cm)</label>
            <input type="number" value={altura} onChange={e => setAltura(e.target.value)} className="w-full p-5 bg-black border border-white/10 rounded-[1.5rem] font-black text-white outline-none focus:border-emerald-500 transition-all text-center text-lg" placeholder="000" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">% Gordura</label>
            <input type="number" value={gordura} onChange={e => setGordura(e.target.value)} className="w-full p-5 bg-black border border-white/10 rounded-[1.5rem] font-black text-white outline-none focus:border-emerald-500 transition-all text-center text-lg" placeholder="0.0" />
          </div>
          <button onClick={handleSave} className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 rounded-[2.5rem] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 active:scale-95 transition-all">
            <Save size={18}/> Registrar Avaliação
          </button>
        </div>
      </Card>
      <EliteFooter />
    </div>
  );
}

export function PeriodizationView({ student, onBack, onProceedToWorkout }: { student: Student, onBack: () => void, onProceedToWorkout: () => void }) {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
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
    try {
      const plan = await generatePeriodizationPlan(formData);
      if (plan) {
        setResult(plan);
        setStep('result');
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id);
        await setDoc(docRef, { periodization: { ...plan, startDate: new Date().toISOString() } }, { merge: true });
      } else {
        throw new Error("IA error");
      }
    } catch (e) {
      alert("Erro na geração. Tente novamente.");
      setStep('form');
    }
  };

  return (
    <div className="p-6 h-screen overflow-y-auto pb-48 text-white bg-black text-left custom-scrollbar">
      <header className="flex items-center gap-4 mb-10">
         <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full"><ArrowLeft size={20}/></button>
         <h2 className="text-xl font-black italic uppercase tracking-tighter">
          <HeaderTitle text="Ciência PhD" />
         </h2>
      </header>

      {step === 'form' && (
        <Card className="p-8 bg-zinc-900 border-l-4 border-l-red-600">
           <div className="flex items-center gap-4 mb-8">
              <Brain className="text-red-600" size={32} />
              <div><h3 className="text-2xl font-black italic uppercase tracking-tight">Anamnese</h3><p className="text-[10px] text-zinc-500 font-bold uppercase">Planejamento Científico</p></div>
           </div>
           <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nível Biológico</label>
                <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} className="w-full p-4 bg-black border border-white/10 rounded-2xl text-sm font-bold outline-none focus:border-red-600">
                   <option value="iniciante">Adaptação Neural</option>
                   <option value="intermediario">Retomada / Intermediário</option>
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
                <Brain size={16}/> Gerar Planilha PhD
              </button>
           </div>
        </Card>
      )}

      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in duration-300 text-center">
           <Loader2 className="w-24 h-24 animate-spin text-red-600" />
           <p className="text-xl font-black uppercase tracking-widest italic text-white">Processando Dados...</p>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl">
              <p className="text-[9px] font-black uppercase text-red-600 mb-2 tracking-[0.2em]">{result.modelo_teorico || "PLANEJAMENTO PhD"}</p>
              <h1 className="text-2xl font-black italic uppercase text-white mb-2 leading-none">{result.titulo}</h1>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed italic opacity-80">{result.objetivo_longo_prazo}</p>
           </div>
           <button onClick={onProceedToWorkout} className="w-full py-6 bg-red-600 rounded-[2.5rem] font-black uppercase text-[11px] text-white shadow-2xl hover:bg-red-700 transition-all">MONTAR EXERCÍCIOS</button>
        </div>
      )}
      <EliteFooter />
    </div>
  );
}
