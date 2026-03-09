import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  Target, Loader2, Play, FileText, Sparkles, UserPlus, Activity, 
  ClipboardList, Download, Dumbbell, Trash2, CheckCircle2, X, 
  Settings, List, ChevronRight, LogOut, RefreshCw, Printer, Library, Zap,
  Calendar, Clock, Search, Plus, BookOpen, AlertTriangle, Users, Video
} from 'lucide-react';

// --- CONTEXTO ISOLADO (CONSTANTES E TIPOS) ---
const SERIES_OPTIONS = ["A", "B", "C", "D", "E"];
const MUSCLE_GROUPS = ["Peito", "Ombro", "Tríceps", "Costas e Cintura Escapular", "Bíceps", "Core e Abdômen", "Paravertebrais", "Quadríceps e Adutores", "Glúteos e Posteriores", "Panturrilha"];
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const IMAGE_MODEL = "gemini-2.5-flash-image";

// Base de Exercícios (Completa conforme Step 5)
const EXERCISE_DATABASE: any = {
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
    "Puxada na polia baixa com apoio dorsal",
    "Supino aberto no banco declinado sem smith",
    "Supino aberto no banco inclinado sem smith",
    "Supino aberto no banco reto no smith",
    "Supino alternado banco 45° fechado no crossover",
    "Supino alternado banco 45° sem crossover",
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
  "Tríceps": [
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
    "Tríceps sem cruzar com a barra em V",
    "Tríceps sem cruzamento com barra W",
    "Tríceps no cross with corda",
    "Tríceps no cross inverso unilateral",
    "Tríceps superman no cross segurando nos cabos",
    "Tríceps supinado with HBM banco reto",
    "Tríceps supinado sem supino",
    "Tríceps supinado pegada neutra with HBC",
    "Tríceps testa HBM banco reto",
    "Tríceps testa simultâneo HBC banco reto",
    "Tríceps testa simultâneo no cross",
    "Tríceps testa unilateral - Desafio HBC no banco",
    "Tríceps testa unilateral sem cruzamento"
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
    "Remada no banco em 3 apoios pegada aberta com HBC unilateral",
    "Remada no banco em 3 apoios pegada neutra with HBC unilateral",
    "Remada no banco em 3 apoios pegada neutra no cross unilateral",
    "Remada no banco em 3 apoios pegada supinada with HBC unilateral",
    "Remada no banco em 3 apoios pegada supinada no cross unilateral",
    "Remada supinada with barra reta no cross polia média"
  ],
  "Bíceps": [
    "Bíceps banco 45º with HBC pegada neutra simultâneo",
    "Bíceps banco 45º with HBC pegada neutra unilateral",
    "Bíceps banco 45º with HBC pegada pronada simultâneo",
    "Bíceps banco 45º com HBC pegada pronada unilateral",
    "Bíceps banco 45º com HBC pegada supinada simultâneo",
    "Bíceps banco 45º with HBC pegada supinada unilateral",
    "Bíceps banco 75º with HBC pegada neutra simultâneo",
    "Bíceps banco 75º with HBC pegada neutra unilateral",
    "Bíceps banco 75º with HBC pegada pronada simultâneo",
    "Bíceps banco 75º com HBC pegada pronada unilateral",
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
    "Rosca bíceps, não rosca cruzada com barra",
    "Bíceps e polia cruzada unilateralmente",
    "Bíceps superman no cross simultâneo",
    "Bíceps do Superman, sem cruzamento unilateral"
  ],
  "Core e Abdômen": [
    "Abdominal diagonal na bola",
    "Abdominal diagonal no bosu",
    "Abdominal diagonal sem solo",
    "Abdominal infra no solo puxando as pernas",
    "Abdominal infra pernas estendidas",
    "Abdominal supra na bola",
    "Abdominais acima do bosu",
    "Não apenas músculos supra-abdominais",
    "Exercício de vela abdominal não apenas",
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
    "Leg press unilateral inclinado",
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
    "Extensão de quadril no solo caneleira",
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
    "Stiff com HBC unilateral",
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

// --- TIPOS ---
interface StudentProfile {
  name: string;
  age: string;
  height: string;
  weight: string;
  objectives: string;
  neurodivergence: string;
  medicalHistory: string;
  bariatric: boolean;
  medications: string;
  exercisePreference: string;
  otherActivities: string;
  trainingSchedule: string;
  sessionDuration: string;
  goalTimeline: string;
  startDate: string;
  weeklyFrequency: string;
  plannedSessions: string;
}

interface Microcycle {
  range: string;
  focus: string;
  method: string;
  intensity: string;
  volume: string;
  notes: string;
}

interface PeriodizationData {
  summary: string;
  macrocycle: string;
  microcycles: Microcycle[];
  clinicalNotes: string[];
  references: string[];
}

interface PrescribedExercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  technique: string;
  observation: string;
  image?: string;
}

interface StudentData {
  profile: StudentProfile;
  workouts: {
    [key: string]: PrescribedExercise[];
  };
  periodization?: PeriodizationData | null;
}

interface AppDatabase {
  students: { [key: string]: StudentData };
  globalSettings: {
    sets: string;
    reps: string;
    rest: string;
    technique: string;
    observation: string;
  };
}

const INITIAL_DB: AppDatabase = {
  students: {},
  globalSettings: {
    sets: "3",
    reps: "10-12",
    rest: "60s",
    technique: "Normal",
    observation: ""
  }
};

// --- COMPONENTE PRINCIPAL ENCAPSULADO ---
interface PrescreveAIProps {
  studentName: string;
  onClose: () => void;
}

export const PrescreveAIModule: React.FC<PrescreveAIProps> = ({ studentName, onClose }) => {
  const [db, setDb] = useState<AppDatabase>(INITIAL_DB);
  const [activeSeries, setActiveSeries] = useState("A");
  const [activeTab, setActiveTab] = useState<'periodization' | 'workouts'>('workouts');
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const [exerciseOptions, setExerciseOptions] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [showAnamnesis, setShowAnamnesis] = useState(false);
  const [isConsulting, setIsConsulting] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [exerciseConfig, setExerciseConfig] = useState(INITIAL_DB.globalSettings);
  const [showReport, setShowReport] = useState(false);
  const [exerciseImage, setExerciseImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [isPlaying] = useState(true);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'DUMMY_KEY' });

  // Lógica de Inicialização Automática para o Aluno vindo do abfit
  useEffect(() => {
    const savedData = localStorage.getItem('prescreveai-data-v2');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setDb(prev => ({
          ...prev,
          ...parsed,
          students: { ...prev.students, ...parsed.students }
        }));
      } catch (e) {
        console.error("Falha ao carregar os dados", e);
      }
    }
  }, []);

  useEffect(() => {
    if (studentName && db) {
      if (!db.students[studentName]) {
        // Criar um novo aluno com valores padrão se não existir
        setDb(prev => ({
          ...prev,
          students: {
            ...prev.students,
            [studentName]: {
              profile: {
                name: studentName,
                age: "", height: "", weight: "", objectives: "", neurodivergence: "", medicalHistory: "", bariatric: false, medications: "", exercisePreference: "Gosta", otherActivities: "", trainingSchedule: "", sessionDuration: "", goalTimeline: "",
                startDate: new Date().toISOString().split('T')[0], weeklyFrequency: "3", plannedSessions: "12"
              },
              workouts: { "A": [], "B": [], "C": [], "D": [], "E": [] },
              periodization: null
            }
          }
        }));
      }
    }
  }, [studentName, db.students]); // Dependência em db.students para evitar loop infinito se db mudar

  // Salvar sempre que o banco de dados for alterado
  useEffect(() => {
    try {
      localStorage.setItem('prescreveai-data-v2', JSON.stringify(db));
    } catch (e) {
      console.error("Falha ao salvar dados", e);
    }
  }, [db]);

  useEffect(() => {
    if (selectedMuscle) {
      setExerciseOptions(EXERCISE_DATABASE[selectedMuscle] || []);
    } else {
      setExerciseOptions([]);
    }
  }, [selectedMuscle]);

  const updateStudentProfile = (name: string, updates: Partial<StudentProfile>) => {
    setDb(prev => ({
      ...prev,
      students: {
        ...prev.students,
        [name]: {
          ...prev.students[name],
          profile: { ...prev.students[name].profile, ...updates }
        }
      }
    }));
  };

  const addExerciseToSeries = (studentName: string, series: string, exercise: PrescribedExercise) => {
    setDb(prev => {
      const student = prev.students[studentName];
      const currentWorkout = student.workouts[series] || [];
      return {
        ...prev,
        students: {
          ...prev.students,
          [studentName]: {
            ...student,
            workouts: {
              ...student.workouts,
              [series]: [...currentWorkout, exercise]
            }
          }
        }
      };
    });
  };

  const updateExerciseInSeries = (studentName: string, series: string, updatedEx: PrescribedExercise) => {
    setDb(prev => {
      const student = prev.students[studentName];
      return {
        ...prev,
        students: {
          ...prev.students,
          [studentName]: {
            ...student,
            workouts: {
              ...student.workouts,
              [series]: student.workouts[series].map(ex => ex.id === updatedEx.id ? updatedEx : ex)
            }
          }
        }
      };
    });
  };

  const removeExerciseFromSeries = (studentName: string, series: string, exId: string) => {
    setDb(prev => {
      const student = prev.students[studentName];
      return {
        ...prev,
        students: {
          ...prev.students,
          [studentName]: {
            ...student,
            workouts: {
              ...student.workouts,
              [series]: student.workouts[series].filter(ex => ex.id !== exId)
            }
          }
        }
      };
    });
  };

  const updatePeriodization = (studentName: string, data: PeriodizationData) => {
    setDb(prev => ({
      ...prev,
      students: {
        ...prev.students,
        [studentName]: {
          ...prev.students[studentName],
          periodization: data
        }
      }
    }));
  };

  const handleOpenConfigAdd = () => {
    setExerciseConfig({ ...db.globalSettings });
    setEditingExerciseId(null);
    setShowConfigModal(true);
  };

  const handleOpenConfigEdit = (exercise: PrescribedExercise) => {
    setExerciseConfig({
      sets: exercise.sets,
      reps: exercise.reps,
      rest: exercise.rest,
      technique: exercise.technique,
      observation: exercise.observation
    });
    setEditingExerciseId(exercise.id);
    setShowConfigModal(true);
  };

  const handleConfirmAddOrUpdate = () => {
    if (editingExerciseId) {
      const exerciseToUpdate = db.students[studentName].workouts[activeSeries].find(ex => ex.id === editingExerciseId);
      if (exerciseToUpdate) {
        updateExerciseInSeries(studentName, activeSeries, {
            ...exerciseToUpdate,
            sets: exerciseConfig.sets,
            reps: exerciseConfig.reps,
            rest: exerciseConfig.rest,
            technique: exerciseConfig.technique,
            observation: exerciseConfig.observation
        });
      }
    } else {
      if (!selectedExercise) return;
      const newExercise: PrescribedExercise = {
        id: Date.now().toString(),
        name: selectedExercise.name,
        sets: exerciseConfig.sets,
        reps: exerciseConfig.reps,
        rest: exerciseConfig.rest,
        technique: exerciseConfig.technique,
        observation: exerciseConfig.observation,
        image: exerciseImage || undefined
      };
      addExerciseToSeries(studentName, activeSeries, newExercise);
    }
    setShowConfigModal(false);
    setEditingExerciseId(null);
  };

  const generatePeriodization = async () => {
    setIsConsulting(true);
    setShowAnamnesis(false);
    const profile = db.students[studentName]?.profile;
    
    const prompt = `
      Crie uma periodização INCISIVA e CIENTÍFICA para ${profile.name}.
      Objetivo: ${profile.objectives}.
      Perfil: ${profile.neurodivergence ? profile.neurodivergence : "Padrão"}.
      
      Estrutura Obrigatória:
      1. Microciclos explícitos (por exemplo, "Semana 1-2", "Semana 3-4").
      2. Para cada microciclo defina: Foco, Método de Treino (ex: GVT, FST-7, Drop-set), Intensidade (%RM ou PSE) e Volume.
      3. Cite referências científicas reais (ACSM, NSCA, estudos) que embasam a escolha.
      
      Responda APENAS com JSON.
    `;
    
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              macrocycle: { type: Type.STRING },
              microcycles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    range: { type: Type.STRING },
                    focus: { type: Type.STRING },
                    method: { type: Type.STRING },
                    intensity: { type: Type.STRING },
                    volume: { type: Type.STRING },
                    notes: { type: Type.STRING }
                  }
                }
              },
              clinicalNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
              references: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "microcycles", "clinicalNotes", "references"]
          }
        }
      });
      
      const jsonText = response.text;
      if (jsonText) {
        const data = JSON.parse(jsonText);
        updatePeriodization(studentName, data);
        setShowReport(true);
      }
    } catch (err) { 
      console.error("Erro no plano.", err); 
    } finally { 
      setIsConsulting(false); 
    }
  };

  const handleSelectExerciseWithDelay = (exerciseName: string) => {
    setSelectedExercise({ name: exerciseName });
    setExerciseImage(null);
    // Logic for image generation removed for brevity/performance in this module, can be added back if needed
  };

  return (
    <div id="prescreveai-container" className="fixed inset-0 z-[9999] bg-black text-white overflow-y-auto font-sans">
      {/* Botão de Fechar e Voltar para o abfit */}
      <div className="absolute top-4 right-4 z-[10000]">
        <button 
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 p-3 rounded-full shadow-2xl transition-transform active:scale-90"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-10 border-b border-white/10 pb-6">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Prescreve<span className="text-red-500">AI</span>
          </h1>
          <p className="text-neutral-400">Prescrevendo para: <span className="text-white font-bold">{studentName}</span></p>
        </header>

        {/* --- NAVEGAÇÃO INTERNA --- */}
        <div className="flex bg-neutral-900/50 p-1 rounded-2xl border border-white/5 mb-8">
           <button 
             onClick={() => setActiveTab('workouts')}
             className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'workouts' ? 'bg-red-500 text-black' : 'text-neutral-500'}`}
           >
             Montar Treino
           </button>
           <button 
             onClick={() => setActiveTab('periodization')}
             className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'periodization' ? 'bg-red-500 text-black' : 'text-neutral-500'}`}
           >
             Periodização
           </button>
        </div>

        {/* --- CONTEÚDO DINÂMICO --- */}
        {activeTab === 'workouts' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
             {/* MENU DE GRUPOS MUSCULARES */}
             <div className="lg:col-span-4 space-y-4">
                <div className="bg-neutral-900/40 p-6 rounded-[2.5rem] border border-white/5">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-6">Grupos Musculares</h3>
                   <div className="space-y-2">
                     {MUSCLE_GROUPS.map(m => (
                       <button key={m} onClick={() => setSelectedMuscle(m)} className={`w-full text-left px-5 py-3 rounded-xl transition-colors ${selectedMuscle === m ? 'bg-red-500 text-black font-bold' : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400'}`}>
                         {m}
                       </button>
                     ))}
                   </div>
                </div>
             </div>

             {/* LISTA DE EXERCÍCIOS */}
             <div className="lg:col-span-8">
                {selectedMuscle ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {exerciseOptions.map((exName, i) => (
                            <button key={i} onClick={() => { setSelectedExercise({ name: exName }); handleOpenConfigAdd(); }} className="text-left px-5 py-4 rounded-2xl bg-neutral-950 border border-white/5 hover:border-red-500/50 hover:bg-neutral-900 transition-all group flex items-center justify-between">
                                <span className="text-sm font-bold text-neutral-300 group-hover:text-white">{exName}</span>
                                <Plus className="w-4 h-4 text-neutral-500 group-hover:text-red-500" />
                            </button>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem]">
                    <Dumbbell className="w-12 h-12 opacity-20 mb-4" />
                    <span className="text-xs uppercase opacity-50 font-black">Selecione um grupo</span>
                  </div>
                )}
             </div>
          </div>
        ) : (
          <div className="text-center py-20 animate-in slide-in-from-bottom-4">
             <Sparkles className="w-16 h-16 mx-auto mb-4 text-red-500 opacity-20" />
             <h2 className="text-2xl font-bold uppercase italic">Módulo de Periodização</h2>
             <button onClick={() => setShowAnamnesis(true)} className="mt-6 bg-white text-black px-8 py-3 rounded-xl font-black uppercase text-xs hover:bg-red-500 transition-colors">Iniciar Anamnese</button>
          </div>
        )}
        
        {/* BARRA DE AÇÃO FLUTUANTE (SÉRIES) */}
        {activeTab === 'workouts' && (
            <div className="fixed bottom-6 left-6 right-6 z-40 flex justify-center pointer-events-none">
                <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 p-2 pl-6 rounded-full shadow-2xl flex items-center gap-4 pointer-events-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-widest text-white mr-2">Série Ativa:</span>
                        {SERIES_OPTIONS.map(series => (
                            <button
                                key={series}
                                onClick={() => setActiveSeries(series)}
                                className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${activeSeries === series ? 'bg-red-500 text-black scale-110' : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'}`}
                            >
                                {series}
                            </button>
                        ))}
                    </div>
                    <div className="h-8 w-px bg-white/10 mx-2"></div>
                    <span className="text-xs text-neutral-500 font-bold">{db.students[studentName]?.workouts[activeSeries]?.length || 0} exercícios</span>
                </div>
            </div>
        )}
      </div>

      {/* MODAL CONFIGURAÇÃO EXERCÍCIO */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[10001] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 shadow-3xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{editingExerciseId ? 'Editar Exercício' : `Adicionar à Série ${activeSeries}`}</h3>
                <button onClick={() => setShowConfigModal(false)} className="text-neutral-500 hover:text-white"><X className="w-6 h-6"/></button>
             </div>
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-neutral-400">Séries</label>
                      <input className="w-full bg-neutral-950 border border-white/20 rounded-xl p-3 text-white text-center font-bold outline-none focus:border-red-500" value={exerciseConfig.sets} onChange={(e) => setExerciseConfig({...exerciseConfig, sets: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-neutral-400">Repetições</label>
                      <input className="w-full bg-neutral-950 border border-white/20 rounded-xl p-3 text-white text-center font-bold outline-none focus:border-red-500" value={exerciseConfig.reps} onChange={(e) => setExerciseConfig({...exerciseConfig, reps: e.target.value})} />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-neutral-400">Intervalo</label>
                      <input className="w-full bg-neutral-950 border border-white/20 rounded-xl p-3 text-white text-center font-bold outline-none focus:border-red-500" value={exerciseConfig.rest} onChange={(e) => setExerciseConfig({...exerciseConfig, rest: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-neutral-400">Técnica/Método</label>
                      <input className="w-full bg-neutral-950 border border-white/20 rounded-xl p-3 text-white text-center font-bold outline-none focus:border-red-500" value={exerciseConfig.technique} onChange={(e) => setExerciseConfig({...exerciseConfig, technique: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black uppercase text-neutral-400">Observações (Opcional)</label>
                   <textarea className="w-full bg-neutral-950 border border-white/20 rounded-xl p-3 text-white text-base outline-none focus:border-red-500 resize-none h-20 placeholder:text-neutral-500" placeholder="Ex: Cadência 3030..." value={exerciseConfig.observation} onChange={(e) => setExerciseConfig({...exerciseConfig, observation: e.target.value})} />
                </div>
                <button onClick={handleConfirmAddOrUpdate} className="w-full py-4 bg-red-500 hover:bg-white hover:text-black text-black font-black uppercase tracking-widest rounded-xl transition-all mt-4 flex items-center justify-center gap-2">
                   <CheckCircle2 className="w-5 h-5" /> {editingExerciseId ? 'Salvar Alterações' : 'Confirmar e Adicionar'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL ANAMNESE */}
      {showAnamnesis && (
        <div className="fixed inset-0 z-[10001] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[3.5rem] overflow-hidden flex flex-col shadow-3xl animate-in zoom-in-95">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-neutral-950">
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Anamnese & Plano</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{studentName}</p>
              </div>
              <button onClick={() => setShowAnamnesis(false)} className="text-neutral-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">Salvar e Sair</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 md:grid-cols-2 gap-10 custom-scrollbar">
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Dados Antropométricos</h3>
                <div className="grid grid-cols-3 gap-3">
                   <input placeholder="Idade" className="bg-neutral-950 border border-white/20 rounded-2xl p-5 text-base outline-none focus:border-red-500 text-white placeholder:text-neutral-500" 
                     value={db.students[studentName]?.profile.age} 
                     onChange={e => updateStudentProfile(studentName, { age: e.target.value })} 
                   />
                   <input placeholder="cm" className="bg-neutral-950 border border-white/20 rounded-2xl p-5 text-base outline-none focus:border-red-500 text-white placeholder:text-neutral-500" 
                     value={db.students[studentName]?.profile.height} 
                     onChange={e => updateStudentProfile(studentName, { height: e.target.value })} 
                   />
                   <input placeholder="kg" className="bg-neutral-950 border border-white/20 rounded-2xl p-5 text-base outline-none focus:border-red-500 text-white placeholder:text-neutral-500" 
                     value={db.students[studentName]?.profile.weight} 
                     onChange={e => updateStudentProfile(studentName, { weight: e.target.value })} 
                   />
                </div>
                <textarea placeholder="Objetivos do aluno (Ex: Hipertrofia, emagrecimento, correção postural)..." className="w-full bg-neutral-950 border border-white/20 rounded-2xl p-5 text-base h-28 outline-none focus:border-red-500 text-white resize-none placeholder:text-neutral-500" 
                  value={db.students[studentName]?.profile.objectives} 
                  onChange={e => updateStudentProfile(studentName, { objectives: e.target.value })} 
                />
              </div>
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Saúde e Neuro</h3>
                <input placeholder="Neurodivergência (TEA/TDAH/Nenhuma)?" className="w-full bg-neutral-950 border border-white/20 rounded-2xl p-5 text-base outline-none focus:border-red-500 text-white placeholder:text-neutral-500" 
                  value={db.students[studentName]?.profile.neurodivergence} 
                  onChange={e => updateStudentProfile(studentName, { neurodivergence: e.target.value })} 
                />
                <input placeholder="Histórico Médico / Lesões?" className="w-full bg-neutral-950 border border-white/20 rounded-2xl p-5 text-base outline-none focus:border-red-500 text-white placeholder:text-neutral-500" 
                  value={db.students[studentName]?.profile.medicalHistory} 
                  onChange={e => updateStudentProfile(studentName, { medicalHistory: e.target.value })} 
                />
                <div className="flex items-center justify-between bg-neutral-950 p-5 rounded-2xl border border-white/20">
                  <span className="text-xs text-neutral-400 font-black uppercase">Fez Bariátrica?</span>
                  <button className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${db.students[studentName]?.profile.bariatric ? 'bg-red-500 text-black shadow-lg shadow-red-500/20' : 'bg-white/5 text-neutral-700'}`} onClick={() => updateStudentProfile(studentName, { bariatric: !db.students[studentName]?.profile.bariatric })}>{db.students[studentName]?.profile.bariatric ? 'SIM' : 'NÃO'}</button>
                </div>
              </div>
            </div>
            <div className="p-10 border-t border-white/5 bg-neutral-950">
              <button onClick={generatePeriodization} disabled={isConsulting} className="w-full py-6 bg-red-500 text-black font-black uppercase tracking-[0.2em] rounded-[1.5rem] hover:bg-white transition-all shadow-2xl text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                {isConsulting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Gerar Periodização Científica ✨'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RELATÓRIO */}
      {showReport && db.students[studentName]?.periodization && (
        <div className="fixed inset-0 z-[10002] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 overflow-y-auto">
          <div className="printable-area bg-white text-black w-full max-w-5xl min-h-[90vh] rounded-none md:rounded-[3.5rem] overflow-hidden flex flex-col shadow-3xl animate-in zoom-in-95 relative">
            
            {/* Cabeçalho / Ações (Oculto na Impressão) */}
            <div className="no-print p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
               <div className="flex items-center gap-2 text-red-600">
                  <Printer className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase">Modo de Impressão</span>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => window.print()} className="bg-red-600 text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors">Exportar PDF</button>
                 <button onClick={() => setShowReport(false)} className="bg-gray-200 text-black px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-300 transition-colors">Fechar</button>
               </div>
            </div>

            <div className="p-12 space-y-8">
               {/* Cabeçalho do relatório */}
               <div className="border-b-2 border-red-500 pb-6 flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-black mb-2">Prescreve<span className="text-red-600">AI</span></h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em]">Relatório de Alta Performance</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-900">{db.students[studentName]?.profile.name}</h2>
                    <p className="text-sm text-gray-500">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
               </div>

               {/* Conteúdo de Periodização */}
               <div className="space-y-6">
                 <div className="bg-black text-white p-6 rounded-2xl">
                    <h3 className="text-xs font-black text-red-500 uppercase mb-3 tracking-widest">Macroestratégia</h3>
                    <p className="text-lg italic leading-relaxed">"{db.students[studentName]?.periodization?.summary}"</p>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tighter border-b border-gray-200 pb-2">Cronograma de Microciclos</h3>
                    {db.students[studentName]?.periodization?.microcycles?.map((micro, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                         <div className="col-span-3 border-r border-gray-200">
                            <span className="text-red-600 font-black text-xl block">{micro.range}</span>
                            <span className="text-[10px] font-bold uppercase text-gray-400">{micro.focus}</span>
                         </div>
                         <div className="col-span-9 grid grid-cols-3 gap-4">
                            <div>
                               <span className="block text-[10px] font-bold text-gray-400 uppercase">Método</span>
                               <span className="font-bold text-sm">{micro.method}</span>
                            </div>
                            <div>
                               <span className="block text-[10px] font-bold text-gray-400 uppercase">Intensidade</span>
                               <span className="font-bold text-sm">{micro.intensity}</span>
                            </div>
                            <div>
                               <span className="block text-[10px] font-bold text-gray-400 uppercase">Volume</span>
                               <span className="font-bold text-sm">{micro.volume}</span>
                            </div>
                            <div className="col-span-3 text-xs text-gray-600 italic bg-white p-2 rounded border border-gray-100 mt-1">
                               Obs: {micro.notes}
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               </div>
               
               {/* Referências e Segurança */}
               <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-200">
                  <div>
                     <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2">Referências Científicas</h4>
                     <ul className="list-disc list-inside space-y-1">
                        {db.students[studentName]?.periodization?.references?.map((ref, i) => (
                           <li key={i} className="text-[10px] text-gray-600">{ref}</li>
                        ))}
                     </ul>
                  </div>
                  <div>
                     <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2">Notas Clínicas</h4>
                     <div className="flex flex-wrap gap-2">
                        {db.students[studentName]?.periodization?.clinicalNotes?.map((note, i) => (
                           <span key={i} className="bg-red-50 text-red-800 px-2 py-1 rounded text-[10px] font-bold border border-red-100">{note}</span>
                        ))}
                     </div>
                  </div>
               </div>

            </div>
          </div>
        </div>
      )}

      {/* --- ESTILOS PROTEGIDOS (CSS SCOPE) --- */}
      <style>{`
        #prescreveai-container {
          all: unset;
          display: block;
          position: fixed;
          inset: 0;
          background: #000;
          color: #fff;
          z-index: 9999;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        #prescreveai-container button { cursor: pointer; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #18181b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #dc2626; border-radius: 10px; }

        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            color: black !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
