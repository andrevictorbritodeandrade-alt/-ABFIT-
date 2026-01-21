
export interface Exercise {
  id?: string;
  name: string;
  description?: string;
  benefits?: string;
  thumb?: string | null;
  sets?: string;
  reps?: string;
  rest?: string;
  load?: string;
}

export interface Workout {
  id: string;
  title: string;
  exercises: Exercise[];
  startDate?: string;
  endDate?: string;
  frequencyWeekly?: number;
  projectedSessions?: number; // Total de sessões previstas para o ciclo
}

export interface RunningStats {
  distance?: number;
  avgPace?: string;
  avgHR?: number;
  maxHR?: number;
  cadence?: number; // SPM
  vo2max?: number;
  elevation?: number;
  calories?: number;
  strideLength?: number; // cm
  verticalOscillation?: number; // cm
  groundContactTime?: number; // ms
  asymmetry?: string; // %
}

export interface WorkoutHistoryEntry {
  id: string;
  workoutId?: string;
  name: string;
  duration: string;
  date: string;
  timestamp: number;
  photoUrl?: string;
  runningStats?: RunningStats;
  type: 'STRENGTH' | 'RUNNING';
}

export interface PeriodizationPlan {
  id: string;
  titulo: string;
  startDate: string;
  modelo_teorico?: string;
  objetivo_longo_prazo?: string;
  microciclos: any[];
  notas_phd?: string;
  type: 'STRENGTH' | 'RUNNING';
}

export interface PhysicalAssessment {
  id: string;
  data: string;
  peso: string | number;
  altura: string | number;
  bio_percentual_gordura?: string | number;
  [key: string]: any;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'RENEWAL' | 'SYSTEM' | 'WORKOUT';
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionLog {
  id: string;
  name: string;
  date: string;
  macros: MacroNutrients;
}

// Added MealPlan interface to fix import error in NutritionView.tsx
export interface MealPlan {
  id: string;
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
}

export interface NutritionProfile {
  goal: string;
  restrictions: string;
  dailyTargets: MacroNutrients;
  logs: NutritionLog[];
  mealPlans: MealPlan[];
}

export interface AnalyticsData {
  sessionsCompleted: number;
  streakDays: number;
  exercises: Record<string, { completed: number; skipped: number }>;
  lastSessionDate?: string;
}

export interface Student {
  id: string;
  nome: string;
  email: string;
  photoUrl?: string;
  sexo?: 'Masculino' | 'Feminino';
  workouts?: Workout[];
  workoutHistory?: WorkoutHistoryEntry[];
  physicalAssessments?: PhysicalAssessment[];
  periodization?: PeriodizationPlan;
  analytics?: AnalyticsData;
  nutrition?: NutritionProfile;
  notifications?: AppNotification[];
  age?: string | number;
  weight?: string | number;
  height?: string | number;
  goal?: string;
  anamneseComplete?: boolean;
}