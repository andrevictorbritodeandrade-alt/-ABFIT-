
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, CalendarDays, Flame, Info, Plus, 
  Trash2, X, Brain, ChevronDown, Play, Zap, BarChart3,
  ArrowLeft, Menu, Gauge, TrendingUp, CheckCircle2, ChevronRight, ChevronLeft,
  Timer, Calculator, Edit3, Circle, Camera, Upload, Loader2, Sparkles
} from 'lucide-react';
import { 
  db, handleFirestoreError, OperationType,
  collection, doc, onSnapshot, addDoc, deleteDoc, updateDoc, getDocs 
} from '../services/firebase';
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY || "");
import { Student, WorkoutHistoryEntry } from '../types';
import { HeaderTitle, Card, AppFooter, BackgroundCarousel, RUNNING_IMAGES } from './Layout';

// --- CONFIGURATION ---
const RUN_COLLECTION = 'runtrack-elite-v4';

// --- TYPES FROM ABFIT RUN ---
interface WorkoutModel {
  id: string;
  studentId: string;
  type: string; 
  dayOfWeek: string;
  warmupTime?: string;
  cooldownTime?: string;
  distance?: string; 
  totalTime?: string;
  pace?: string;
  sets?: string;
  reps?: string;
  stimulusTime?: string;
  recoveryTime?: string;
  speed?: string; 
  description?: string;
  createdAt?: string;
}

// --- HELPER FUNCTIONS FOR TIME CALCULATION ---

const parseToMinutes = (val: string | undefined, speedStr: string | undefined): number => {
    if (!val) return 0;
    // Safety check: ensure val is a string
    const v = String(val).toLowerCase().replace(',', '.').trim();
    const speed = parseFloat((speedStr || '10').replace(',', '.')) || 10;

    // 1. Explicit Time (contains ' or min)
    if (v.includes("'") || v.includes("min")) {
        return parseFloat(v) || 0;
    }

    // 2. Explicit Distance (km or m)
    if (v.includes("km")) {
        const distKm = parseFloat(v);
        return (distKm / speed) * 60;
    }
    if (v.includes("m") && !v.includes("min")) {
        const distM = parseFloat(v);
        return (distM / 1000 / speed) * 60;
    }

    // 3. Numeric Heuristic
    const num = parseFloat(v);
    if (isNaN(num)) return 0;

    // Assume Minutes if < 60, otherwise treat as meters/seconds logic (simplified)
    if (num >= 60) {
        return (num / 1000 / speed) * 60;
    }

    return num;
};

const estimateWorkoutDuration = (w: WorkoutModel): number => {
    if (!w) return 0;
    let total = 0;
    
    // Warmup & Cooldown
    total += parseToMinutes(w.warmupTime, w.speed);
    total += parseToMinutes(w.cooldownTime, w.speed);

    // Main Set
    const sets = parseFloat(w.sets || '1') || 1;
    const reps = parseFloat(w.reps || '1') || 1;
    
    const stimMin = parseToMinutes(w.stimulusTime, w.speed);
    const recMin = parseToMinutes(w.recoveryTime, w.speed);

    total += sets * reps * (stimMin + recMin);

    return Math.ceil(total || 0);
};

const formatDuration = (totalMin: number) => {
    if (isNaN(totalMin) || totalMin <= 0) return '0min';
    const h = Math.floor(totalMin / 60);
    const m = Math.floor(totalMin % 60);
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
}

// --- UI COMPONENTS ---

const Button = ({ children, onClick, variant = "primary", className = "", loading = false }: any) => {
  const variants: any = {
    primary: "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/20",
    secondary: "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700",
    ghost: "bg-transparent text-zinc-400 hover:text-white"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={loading}
      className={`px-6 py-4 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = "text", className = "", placeholder = "" }: any) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{label}</label>}
    <input 
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`px-5 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-red-600 outline-none font-bold text-white w-full transition-all ${className}`} 
    />
  </div>
);

const TextArea = ({ label, value, onChange, placeholder }: any) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{label}</label>}
    <textarea 
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
      className="px-5 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-red-600 outline-none font-bold text-white w-full transition-all resize-none" 
    />
  </div>
);

const Select = ({ label, value, onChange, options }: any) => (
  <div className="flex flex-col gap-2 w-full relative">
    {label && <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{label}</label>}
    <div className="relative">
      <select 
        value={value} onChange={(e) => onChange(e.target.value)} 
        className="w-full px-5 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-red-600 outline-none font-bold appearance-none cursor-pointer text-white pr-10"
      >
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500" size={18} />
    </div>
  </div>
);

const WorkoutLegend = () => (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 mt-8">
        <h5 className="font-black italic uppercase text-zinc-500 text-[10px] tracking-widest mb-4 flex items-center gap-2">
            <Info size={14} className="text-red-600"/> Legenda
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {short: 'AQ', long: 'Aquecimento'}, {short: 'CO', long: 'Corrida'},
              {short: 'CA', long: 'Caminhada'}, {short: 'REC', long: 'Recuperação'},
              {short: ':', long: 'Alternância'}
            ].map(item => (
              <div key={item.short} className="flex flex-col border-l-2 border-zinc-800 pl-3">
                  <span className="font-black text-red-600 text-sm">{item.short}</span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">{item.long}</span>
              </div>
            ))}
        </div>
    </div>
);

// --- LOGIC FOR PROGRESSION ---
const calculateAdjustedWorkout = (workout: WorkoutModel) => {
    if (!workout) return { adjusted: {} as WorkoutModel, badge: null };
    if (!workout.createdAt) return { adjusted: workout, badge: null };

    const created = new Date(workout.createdAt);
    const now = new Date();
    // Safety check for invalid dates
    if (isNaN(created.getTime())) return { adjusted: workout, badge: null };

    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let factor = 1.0;
    let badge = null;

    if (diffDays > 30) {
        factor = 1.10; // +10% after 30 days
        badge = "NÍVEL 3 (+10%)";
    } else if (diffDays > 15) {
        factor = 1.05; // +5% after 15 days
        badge = "NÍVEL 2 (+5%)";
    } else {
        return { adjusted: workout, badge: null };
    }

    const adjusted = { ...workout };

    // Apply progression to Speed
    if (adjusted.speed) {
        const speedNum = parseFloat(adjusted.speed.replace(',', '.'));
        if (!isNaN(speedNum)) {
            adjusted.speed = (speedNum * factor).toFixed(1).replace('.', ',');
        }
    }

    // Apply progression to Stimulus Time
    if (adjusted.stimulusTime) {
        const stimNum = parseFloat(adjusted.stimulusTime);
        if (!isNaN(stimNum)) {
             if (stimNum < 10) {
                 adjusted.stimulusTime = (stimNum * factor).toFixed(1).replace('.0', '');
             } else {
                 adjusted.stimulusTime = Math.ceil(stimNum * factor).toString();
             }
        }
    }

    return { adjusted, badge };
};

const WorkoutCard: React.FC<{ workout: WorkoutModel, onDelete?: () => void, onEdit?: () => void, isCompleted?: boolean, compact?: boolean, isToday?: boolean, stats?: any }> = ({ workout, onDelete, onEdit, isCompleted, compact, isToday, stats }) => {
    const { adjusted, badge } = useMemo(() => calculateAdjustedWorkout(workout), [workout]);
    const totalDuration = useMemo(() => estimateWorkoutDuration(adjusted), [adjusted]);

    if (!adjusted || !adjusted.type) return null;

    const formatTime = (val?: string) => {
        if (!val || val === '0') return null;
        const isNumber = /^\d+([.,]\d+)?$/.test(val);
        return isNumber ? `${val}'` : val;
    };

    const warmPart = formatTime(adjusted.warmupTime) ? `${formatTime(adjusted.warmupTime)} AQ` : null;
    
    const sets = Number(adjusted.sets) || 1;
    const reps = Number(adjusted.reps) || 1;
    const totalBlocks = sets * reps;
    
    const stimTime = formatTime(adjusted.stimulusTime);
    const showBlocks = totalBlocks > 1 && !!stimTime;
    
    const stimPart = stimTime ? `${stimTime} CO` : '';
    const speedPart = adjusted.speed ? `${adjusted.speed}km/h` : '';
    
    const recTime = formatTime(adjusted.recoveryTime);
    const recPart = recTime && recTime !== "0'" ? `${recTime} CA` : null;
    
    const coolPart = formatTime(adjusted.cooldownTime) ? `${formatTime(adjusted.cooldownTime)} REC` : null;

    if (compact) {
        return (
            <div className={`p-4 rounded-xl border transition-all ${isToday ? 'border-red-600 ring-1 ring-red-600/20' : ''} ${isCompleted ? 'bg-emerald-950/30 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : 'text-zinc-500'}`}>
                            {adjusted.type}
                        </span>
                        {isToday && <span className="text-[6px] font-black bg-red-600 text-white px-1 rounded">HOJE</span>}
                    </div>
                    {isCompleted && <CheckCircle2 size={12} className="text-emerald-500" />}
                </div>
                <p className="text-xs font-black italic uppercase text-white leading-tight">
                    {showBlocks && `${totalBlocks}x `}{stimPart} {speedPart && `@ ${speedPart}`}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[8px] text-zinc-500 font-bold uppercase">
                    <Timer size={8} /> Est. {formatDuration(totalDuration)}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-zinc-900 border p-8 rounded-[3rem] relative group transition-all ${isToday ? 'border-red-600 ring-4 ring-red-600/20' : badge ? 'border-red-600/40 shadow-[0_0_30px_rgba(220,38,38,0.15)]' : 'border-zinc-800 hover:border-red-600/30'} ${isCompleted ? 'opacity-60' : ''}`}>
            {isToday && (
                <div className="absolute -top-4 left-8 bg-red-600 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-xl z-10 animate-bounce">
                    TREINO DE HOJE
                </div>
            )}
            <div className="absolute top-8 right-8 flex items-center gap-3">
                {onEdit && (
                    <button onClick={onEdit} className="text-zinc-500 hover:text-white p-3 rounded-2xl transition-all bg-zinc-800 hover:bg-zinc-700">
                        <Edit3 size={20} />
                    </button>
                )}
                {onDelete && (
                    <button onClick={onDelete} className="text-zinc-500 hover:text-red-500 p-3 rounded-2xl transition-all hover:bg-zinc-800">
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
            
            <div className="flex flex-col mb-8">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-red-600 mb-2 flex items-center gap-2">
                        <CalendarDays size={14} /> {adjusted.dayOfWeek}
                    </span>
                    {badge ? (
                        <span className="bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-2 animate-pulse">
                            <TrendingUp size={12} /> {badge}
                        </span>
                    ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg mr-20">
                            <Timer size={12} /> {formatDuration(totalDuration)}
                        </span>
                    )}
                </div>
                <h4 className="text-4xl font-black italic uppercase text-white leading-none tracking-tighter">
                    {adjusted.type}
                </h4>
            </div>

            {/* SINGLE BLOCK LAYOUT - UNIFIED TEXT */}
            <div className="bg-black/40 p-8 rounded-3xl border border-white/5 mb-8 flex items-center justify-center text-center">
                <p className="text-2xl md:text-3xl font-black italic uppercase text-white leading-relaxed tracking-wide">
                    {/* AQUECIMENTO */}
                    {warmPart && (
                        <>
                            <span className="text-emerald-500">{warmPart}</span>
                            <span className="text-red-600 mx-3">+</span>
                        </>
                    )}
                    
                    {/* BLOCOS E ESTIMULO */}
                    {showBlocks && (
                        <span>{totalBlocks} BLOCOS DE </span>
                    )}
                    
                    <span className="text-red-600">{stimPart}</span>
                    {speedPart && <span className="text-zinc-400 ml-3 text-[0.9em]">{speedPart}</span>}
                    
                    {/* RECUPERAÇÃO ENTRE TIROS */}
                    {recPart && (
                        <>
                            <span className="text-red-600 mx-3">:</span>
                            <span className="text-emerald-500">{recPart}</span>
                        </>
                    )}
                    
                    {/* DESAQUECIMENTO */}
                    {coolPart && (
                        <>
                            <span className="text-red-600 mx-3">+</span>
                            <span className="text-emerald-500">{coolPart}</span>
                        </>
                    )}
                </p>
            </div>

            {workout.description && (
                <div className="p-4 rounded-xl border-l-2 border-red-600 bg-red-600/5 mb-6">
                    <p className="text-xs text-zinc-300 font-medium leading-relaxed italic">"{workout.description}"</p>
                </div>
            )}

            {stats && !stats.empty && (
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                        <Activity size={12} /> Dados do Galaxy Watch
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.distance && (
                            <div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">Distância</div>
                                <div className="text-sm font-black text-white">{stats.distance} km</div>
                            </div>
                        )}
                        {stats.duration && (
                            <div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">Duração</div>
                                <div className="text-sm font-black text-white">{stats.duration}</div>
                            </div>
                        )}
                        {stats.avgPace && (
                            <div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">Pace Médio</div>
                                <div className="text-sm font-black text-white">{stats.avgPace}</div>
                            </div>
                        )}
                        {stats.avgHR && (
                            <div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">BPM Médio</div>
                                <div className="text-sm font-black text-white">{stats.avgHR} bpm</div>
                            </div>
                        )}
                        {stats.calories && (
                            <div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">Calorias</div>
                                <div className="text-sm font-black text-white">{stats.calories} kcal</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function WorkoutBuilder({ studentId, onClose, initialData }: { studentId: string, onClose: () => void, initialData?: WorkoutModel }) {
    const [type, setType] = useState(initialData?.type || 'Longão');
    const [day, setDay] = useState(initialData?.dayOfWeek || 'Segunda');
    const [loading, setLoading] = useState(false);

    // Consolidated Form State for ALL types
    const [form, setForm] = useState({
        warmup: initialData?.warmupTime || '10',
        cooldown: initialData?.cooldownTime || '5',
        sets: initialData?.sets || '1',
        reps: initialData?.reps || '1',
        stimulus: initialData?.stimulusTime || '0',
        recovery: initialData?.recoveryTime || '0',
        speed: initialData?.speed || '', 
        description: initialData?.description || ''
    });

    const recommendation = useMemo(() => {
        let advice = { title: "Geral", volume: "Moderado", intensity: "Zona 2", notes: [] as string[] };
        if (type === 'Longão') {
            advice.title = "Longo";
            advice.intensity = "65-75% FCmáx";
            advice.volume = "20-30% Vol. Semanal";
        } else if (type === 'Intervalado') {
            advice.title = "Intervalado";
            advice.intensity = "90-95% FCmáx";
            advice.volume = "Alta Intensidade";
        }
        return advice;
    }, [type]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload: any = {
                studentId,
                type,
                dayOfWeek: day,
                warmupTime: form.warmup,
                cooldownTime: form.cooldown,
                sets: form.sets,
                reps: form.reps,
                stimulusTime: form.stimulus,
                recoveryTime: form.recovery,
                speed: form.speed,
                description: form.description,
            };

            // Wrap operation in a Promise.race to prevent infinite loading state in case of connection lag
            const path = initialData && initialData.id 
                ? `artifacts/${RUN_COLLECTION}/workouts/${initialData.id}`
                : `artifacts/${RUN_COLLECTION}/workouts`;

            const saveOperation = initialData && initialData.id
                ? updateDoc(doc(db, path), payload)
                : addDoc(collection(db, path), { ...payload, createdAt: new Date().toISOString() });

            const timeout = new Promise((resolve) => setTimeout(resolve, 3000));

            await Promise.race([saveOperation, timeout]);
            
            // Forces modal close to allow new creation
            onClose();
        } catch (e) { 
            const path = initialData && initialData.id 
                ? `artifacts/${RUN_COLLECTION}/workouts/${initialData.id}`
                : `artifacts/${RUN_COLLECTION}/workouts`;
            handleFirestoreError(e, initialData && initialData.id ? OperationType.WRITE : OperationType.WRITE, path);
            // Even on error, we might want to close or at least stop loading
            setLoading(false);
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="w-full">
                <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl h-full shadow-lg">
                    <div className="flex items-center gap-2 mb-4 text-red-500">
                        <Brain size={18} /> <span className="text-xs font-black uppercase tracking-widest">Insight IA</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-2xl font-black italic uppercase text-white">{recommendation.title}</h3>
                        <div className="flex gap-4">
                             <div>
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Intensidade</span>
                                <p className="text-white font-bold">{recommendation.intensity}</p>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Volume</span>
                                <p className="text-white font-bold">{recommendation.volume}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X /></button>
                <h4 className="text-xl font-black italic uppercase mb-8 text-red-600">{initialData ? 'Editar Treino' : 'Nova Sessão'}</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Select label="Dia" value={day} onChange={setDay} options={[
                        {value: 'Segunda', label: 'Segunda'}, {value: 'Terça', label: 'Terça'}, {value: 'Quarta', label: 'Quarta'},
                        {value: 'Quinta', label: 'Quinta'}, {value: 'Sexta', label: 'Sexta'}, {value: 'Sábado', label: 'Sábado'}, {value: 'Domingo', label: 'Domingo'}
                    ]} />
                    <Select label="Tipo" value={type} onChange={setType} options={[
                        {value: 'Longão', label: 'Longão'}, {value: 'Intervalado', label: 'Intervalado'}, {value: 'Fartlek', label: 'Fartlek'},
                        {value: 'Ritmo', label: 'Ritmo / Tempo'}, {value: 'Subida', label: 'Subida'}, {value: 'Regenerativo', label: 'Regenerativo'}
                    ]} />
                </div>

                {/* STANDARD LAYOUT FOR ALL TYPES */}
                <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Aquecimento" type="number" value={form.warmup} onChange={(v: string) => setForm({...form, warmup: v})} />
                        <Input label="Desaquecimento" type="number" value={form.cooldown} onChange={(v: string) => setForm({...form, cooldown: v})} />
                        <Input label="Séries" type="number" value={form.sets} onChange={(v: string) => setForm({...form, sets: v})} />
                    </div>
                    
                    <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 grid grid-cols-3 gap-4">
                        <Input label="Reps" type="number" value={form.reps} onChange={(v: string) => setForm({...form, reps: v})} />
                        <Input label="Estímulo" value={form.stimulus} onChange={(v: string) => setForm({...form, stimulus: v})} />
                        <Input label="Recuperação" value={form.recovery} onChange={(v: string) => setForm({...form, recovery: v})} />
                    </div>

                    <div className="grid grid-cols-1">
                        <Input label="Velocidade (km/h)" value={form.speed} onChange={(v: string) => setForm({...form, speed: v})} placeholder="Ex: 12.5" />
                    </div>
                    
                    <TextArea label="Instruções" value={form.description} onChange={(v: string) => setForm({...form, description: v})} placeholder="Ex: Manter postura, final forte..." />
                </div>

                <Button onClick={handleSave} loading={loading} className="w-full">{initialData ? 'Atualizar Treino' : 'Criar Treino'}</Button>
            </div>
        </div>
    );
}

// --- CALENDAR COMPONENTS ---

const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
};

const RunCalendar = ({ workouts, history, onCheckIn, studentId }: { workouts: WorkoutModel[], history: WorkoutHistoryEntry[], onCheckIn: (date: string, workout: WorkoutModel, stats?: any) => void, studentId?: string }) => {
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [statsForm, setStatsForm] = useState({
        distance: '',
        duration: '',
        avgPace: '',
        avgHR: '',
        calories: ''
    });
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
    
    const normalizeDay = (d: any) => {
        if (!d) return "";
        return String(d).toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .split('-')[0]
            .trim();
    };

    const dayNameMap: Record<string, number> = {
        'domingo': 0, 'segunda': 1, 'terca': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5, 'sabado': 6
    };

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getWorkoutForDate = (day: number) => {
        const date = new Date(year, month, day);
        const dayOfWeekIndex = date.getDay(); // 0 is Sunday
        const daysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayName = daysMap[dayOfWeekIndex];
        
        return workouts.find(w => {
            if (!w.dayOfWeek) return false;
            const d = normalizeDay(String(w.dayOfWeek));
            return d === normalizeDay(dayName);
        });
    };

    const isCompleted = (day: number, workoutId: string) => {
        const dateStr = new Date(year, month, day).toLocaleDateString('pt-BR');
        return history.some(h => h.date === dateStr && h.workoutId === workoutId && h.type === 'RUNNING');
    };

    const getHistoryEntry = (day: number, workoutId: string) => {
        const dateStr = new Date(year, month, day).toLocaleDateString('pt-BR');
        return history.find(h => h.date === dateStr && h.workoutId === workoutId && h.type === 'RUNNING');
    };

    const handleDayClick = (day: number, workout: WorkoutModel) => {
        setSelectedDay(day === selectedDay ? null : day);
    };

    const handleToggleComplete = (day: number, workout: WorkoutModel) => {
        const dateStr = new Date(year, month, day).toLocaleDateString('pt-BR');
        if (isCompleted(day, workout.id)) {
            // If already completed, clicking again will undo it (no stats needed)
            onCheckIn(dateStr, workout);
        } else {
            // Show modal to collect stats
            setStatsForm({
                distance: '',
                duration: '',
                avgPace: '',
                avgHR: '',
                calories: ''
            });
            setShowStatsModal(true);
        }
    };

    const submitStats = () => {
        if (!selectedDay || !selectedWorkout) return;
        const dateStr = new Date(year, month, selectedDay).toLocaleDateString('pt-BR');
        
        const rawStats = {
            distance: parseFloat(statsForm.distance) || undefined,
            duration: statsForm.duration || undefined,
            avgPace: statsForm.avgPace || undefined,
            avgHR: parseInt(statsForm.avgHR) || undefined,
            calories: parseInt(statsForm.calories) || undefined
        };

        // Clean undefined values for Firestore
        const cleanStats = Object.fromEntries(Object.entries(rawStats).filter(([_, v]) => v !== undefined));
        
        // If object is empty, pass undefined so it doesn't store an empty object
        const finalStats = Object.keys(cleanStats).length > 0 ? cleanStats : { empty: true };

        onCheckIn(dateStr, selectedWorkout, finalStats);
        setShowStatsModal(false);
    };

    const isToday = (day: number) => {
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const selectedWorkout = selectedDay ? getWorkoutForDate(selectedDay) : null;

    return (
        <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"><ChevronLeft size={20}/></button>
                    <h3 className="text-sm font-black uppercase text-white tracking-widest">{monthNames[month]} {year}</h3>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"><ChevronRight size={20}/></button>
                </div>
                
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {weekDays.map((d, i) => (
                        <div key={i} className="text-center text-[10px] font-bold text-zinc-600 uppercase">{d}</div>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                    {blanks.map(b => <div key={`blank-${b}`} className="aspect-square"></div>)}
                    {days.map(day => {
                        const workout = getWorkoutForDate(day);
                        const completed = workout ? isCompleted(day, workout.id) : false;
                        const dateObj = new Date(year, month, day);
                        const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const isMissed = workout && !completed && isPast;
                        const todayHighlight = isToday(day) ? "bg-zinc-800" : "bg-transparent";
                        const isSelected = selectedDay === day;
                        
                        return (
                            <div key={day} className="aspect-square relative">
                                {workout ? (
                                    <button 
                                        onClick={() => handleDayClick(day, workout)}
                                        className={`w-full h-full rounded-xl flex flex-col items-center justify-center border-2 transition-all active:scale-95 relative overflow-hidden
                                            ${completed 
                                                ? 'bg-emerald-950/30 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                                : isMissed
                                                    ? 'bg-red-950/30 border-red-900/50'
                                                    : isSelected
                                                        ? 'border-red-600 bg-red-600/10'
                                                        : `border-zinc-800 hover:border-red-600/50 ${todayHighlight}`
                                            }
                                        `}
                                    >
                                        <span className={`text-[10px] font-black z-10 ${completed ? 'text-emerald-500' : isMissed ? 'text-red-500' : 'text-white'}`}>{day}</span>
                                        <span className="text-[6px] font-black uppercase tracking-tighter opacity-40 absolute bottom-1">
                                            {workout.type.substring(0, 3)}
                                        </span>
                                        <div className={`w-1 h-1 rounded-full absolute top-1 right-1 ${completed ? 'bg-emerald-500' : isMissed ? 'bg-red-900' : 'bg-red-600'}`}></div>
                                    </button>
                                ) : (
                                    <div className={`w-full h-full rounded-xl flex flex-col items-center justify-center border border-transparent text-zinc-700 ${todayHighlight}`}>
                                        <span className="text-[10px] font-medium">{day}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                <div className="flex items-center gap-4 mt-6 justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-600"></div>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase">Treino</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase">Concluído</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-900"></div>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase">Falta</span>
                    </div>
                </div>
            </div>

            {/* SELECTED DAY DETAILS */}
            {selectedDay && selectedWorkout && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest">
                            Treino de {selectedDay} de {monthNames[month]}
                        </h4>
                        <button 
                            onClick={() => handleToggleComplete(selectedDay, selectedWorkout)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-2
                                ${isCompleted(selectedDay, selectedWorkout.id)
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }
                            `}
                        >
                            {isCompleted(selectedDay, selectedWorkout.id) ? <CheckCircle2 size={14}/> : <Circle size={14}/>}
                            {isCompleted(selectedDay, selectedWorkout.id) ? 'Concluído' : 'Marcar Concluído'}
                        </button>
                    </div>
                    <WorkoutCard 
                        workout={selectedWorkout} 
                        isCompleted={isCompleted(selectedDay, selectedWorkout.id)} 
                        stats={getHistoryEntry(selectedDay, selectedWorkout.id)?.runningStats}
                    />
                </div>
            )}

            {/* STATS MODAL */}
            {showStatsModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setShowStatsModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={20}/></button>
                        <h3 className="text-lg font-black italic uppercase text-white tracking-tighter mb-6">Dados do Treino</h3>
                        <p className="text-xs text-zinc-400 mb-6">Insira os dados do seu Galaxy Watch 7 (opcional)</p>
                        
                        <div className="space-y-4 mb-8">
                            <Input label="Distância (km)" type="number" value={statsForm.distance} onChange={(v: string) => setStatsForm({...statsForm, distance: v})} placeholder="Ex: 5.2" />
                            <Input label="Duração Total" value={statsForm.duration} onChange={(v: string) => setStatsForm({...statsForm, duration: v})} placeholder="Ex: 45 min" />
                            <Input label="Pace Médio" value={statsForm.avgPace} onChange={(v: string) => setStatsForm({...statsForm, avgPace: v})} placeholder="Ex: 6'30&quot;" />
                            <Input label="BPM Médio" type="number" value={statsForm.avgHR} onChange={(v: string) => setStatsForm({...statsForm, avgHR: v})} placeholder="Ex: 145" />
                            <Input label="Calorias" type="number" value={statsForm.calories} onChange={(v: string) => setStatsForm({...statsForm, calories: v})} placeholder="Ex: 450" />
                        </div>
                        
                        <div className="flex gap-4">
                            <Button variant="secondary" className="flex-1" onClick={() => setShowStatsModal(false)}>Cancelar</Button>
                            <Button className="flex-1" onClick={submitStats}>Salvar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- COACH VIEW ---

export function RunTrackCoachView({ student, onBack }: { student: Student, onBack: () => void }) {
    const [workouts, setWorkouts] = useState<WorkoutModel[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingWorkout, setEditingWorkout] = useState<WorkoutModel | null>(null);
    
    useEffect(() => {
        if (!student.id) return;
        const hasSeeded = localStorage.getItem(`seeded_${student.id}_run_v7`);
        if (!hasSeeded) {
            const checkAndSeed = async () => {
                try {
                    await new Promise(r => setTimeout(r, 2000));
                    
                    // Query firestore directly to avoid closure stale state
                    const path = `artifacts/${RUN_COLLECTION}/workouts`;
                    const q = collection(db, path);
                    const snap = await getDocs(q);
                    const currentWorkouts = snap.docs
                        .map(d => ({id: d.id, ...d.data()} as WorkoutModel))
                        .filter(w => w.studentId === student.id);

                    if (['fixed-andre', 'fixed-liliane', 'fixed-marcelly'].includes(student.id)) {
                        for (const w of currentWorkouts) {
                            const docPath = `artifacts/${RUN_COLLECTION}/workouts/${w.id}`;
                            await deleteDoc(doc(db, docPath));
                        }
                        await seedWorkouts(student.id);
                    }
                    localStorage.setItem(`seeded_${student.id}_run_v7`, 'true');
                } catch (err) {
                    const path = `artifacts/${RUN_COLLECTION}/workouts`;
                    handleFirestoreError(err, OperationType.GET, path);
                    localStorage.setItem(`seeded_${student.id}_run_v7`, 'true');
                }
            };
            checkAndSeed();
        }
    }, [student.id]);

    useEffect(() => {
        const path = `artifacts/${RUN_COLLECTION}/workouts`;
        const q = collection(db, path);
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()} as WorkoutModel));
            setWorkouts(data.filter(w => w.studentId === student.id));
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, path);
        });
        return () => unsub();
    }, [student.id]);

    const deleteWorkout = async (id: string) => {
        const path = `artifacts/${RUN_COLLECTION}/workouts/${id}`;
        try {
            await deleteDoc(doc(db, path));
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, path);
        }
    };

    const handleEdit = (workout: WorkoutModel) => {
        setEditingWorkout(workout);
        setIsCreating(true); // Re-use the builder logic
    };

    const handleCloseBuilder = () => {
        setIsCreating(false);
        setEditingWorkout(null);
    };

    const weeklyVolume = useMemo(() => {
        return workouts.reduce((acc, w) => acc + estimateWorkoutDuration(calculateAdjustedWorkout(w).adjusted), 0);
    }, [workouts]);

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 text-left h-screen overflow-y-auto custom-scrollbar bg-black">
            <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-50 -mx-6 px-6 border-b border-white/5">
                <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
                  <HeaderTitle text={`ABFIT RUN ${student.nome}`} />
                </h2>
            </header>

            {/* WEEKLY VOLUME SUMMARY */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex items-center justify-between shadow-lg">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <BarChart3 size={12} className="text-red-600" /> Volume Semanal
                    </span>
                    <span className="text-3xl font-black italic text-white tracking-tighter leading-none">
                        {formatDuration(weeklyVolume)}
                    </span>
                </div>
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                    <TrendingUp size={24} className="text-zinc-500" />
                </div>
            </div>

            <div className="flex justify-between items-center p-2">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
                    <Flame className="text-red-600" /> Planilhas
                </h3>
                {!isCreating && (
                    <Button onClick={() => setIsCreating(true)} variant="secondary">
                       <Plus size={16} /> Adicionar
                    </Button>
                )}
            </div>

            {isCreating && (
                <WorkoutBuilder 
                    studentId={student.id}
                    onClose={handleCloseBuilder}
                    initialData={editingWorkout || undefined} 
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
                {workouts.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                        <p className="font-bold text-zinc-600 uppercase text-xs tracking-widest">SEM TREINOS PRESCRITOS</p>
                    </div>
                ) : (
                   [...workouts].sort((a,b) => getDayIndex(a.dayOfWeek) - getDayIndex(b.dayOfWeek)).map(w => (
                       <WorkoutCard 
                           key={w.id} 
                           workout={w} 
                           onDelete={() => deleteWorkout(w.id)} 
                           onEdit={() => handleEdit(w)}
                       />
                   )) 
                )}
            </div>
            
            <WorkoutLegend />
        </div>
    )
}

// --- STUDENT VIEW ---

import { LiveRunSession, WorkoutSegment } from './LiveRunSession';

function parseWorkoutSegments(workout: WorkoutModel): WorkoutSegment[] {
    const segments: WorkoutSegment[] = [];
    
    // Warmup
    const warmupMins = parseToMinutes(workout.warmupTime, workout.speed);
    if (warmupMins > 0) {
        segments.push({
            type: 'warmup',
            duration: Math.round(warmupMins * 60),
            title: 'Aquecimento'
        });
    }

    // Main Block
    const sets = parseInt(workout.sets || '1') || 1;
    const reps = parseInt(workout.reps || '1') || 1;
    const totalIntervals = sets * reps;

    if (totalIntervals > 1 && workout.stimulusTime) {
        // Interval training
        const stimulusMins = parseToMinutes(workout.stimulusTime, workout.speed);
        const recoveryMins = parseToMinutes(workout.recoveryTime, workout.speed);
        
        for (let i = 0; i < totalIntervals; i++) {
            if (stimulusMins > 0) {
                segments.push({
                    type: 'stimulus',
                    duration: Math.round(stimulusMins * 60),
                    title: `Tiro ${i + 1}/${totalIntervals}`,
                    speed: workout.speed
                });
            }
            if (recoveryMins > 0 && i < totalIntervals - 1) { 
                segments.push({
                    type: 'recovery',
                    duration: Math.round(recoveryMins * 60),
                    title: `Recuperação ${i + 1}/${totalIntervals}`
                });
            }
        }
    } else {
        // Continuous
        const mainMins = parseToMinutes(workout.totalTime, workout.speed) || parseToMinutes(workout.distance, workout.speed);
        if (mainMins > 0) {
            segments.push({
                type: 'continuous',
                duration: Math.round(mainMins * 60),
                title: 'Corrida Principal',
                speed: workout.speed
            });
        }
    }

    // Cooldown
    const cooldownMins = parseToMinutes(workout.cooldownTime, workout.speed);
    if (cooldownMins > 0) {
        segments.push({
            type: 'cooldown',
            duration: Math.round(cooldownMins * 60),
            title: 'Desaquecimento'
        });
    }

    // Fallback if no segments could be parsed (e.g. just distance without pace)
    if (segments.length === 0) {
        segments.push({
            type: 'continuous',
            duration: 0, // 0 means indefinite
            title: 'Corrida Livre'
        });
    }

    return segments;
}

export function RunTrackStudentView({ student, onBack, onSave, onToggleMenu }: { student: Student, onBack: () => void, onSave: (id: string, data: any) => void, onToggleMenu?: () => void }) {
    const [workouts, setWorkouts] = useState<WorkoutModel[]>([]);
    const [loggingWorkout, setLoggingWorkout] = useState<WorkoutModel | null>(null);
    const [liveWorkout, setLiveWorkout] = useState<WorkoutModel | null>(null);

    useEffect(() => {
        if (!student.id) return;
        const hasSeeded = localStorage.getItem(`seeded_${student.id}_run_v7`);
        if (!hasSeeded) {
            const checkAndSeed = async () => {
                try {
                    await new Promise(r => setTimeout(r, 2000));
                    
                    const path = `artifacts/${RUN_COLLECTION}/workouts`;
                    const q = collection(db, path);
                    const snap = await getDocs(q);
                    const currentWorkouts = snap.docs
                        .map(d => ({id: d.id, ...d.data()} as WorkoutModel))
                        .filter(w => w.studentId === student.id);

                    if (['fixed-andre', 'fixed-liliane', 'fixed-marcelly'].includes(student.id)) {
                        for (const w of currentWorkouts) {
                            const docPath = `artifacts/${RUN_COLLECTION}/workouts/${w.id}`;
                            await deleteDoc(doc(db, docPath));
                        }
                        await seedWorkouts(student.id);
                    }
                    localStorage.setItem(`seeded_${student.id}_run_v7`, 'true');
                } catch (err) {
                    const path = `artifacts/${RUN_COLLECTION}/workouts`;
                    handleFirestoreError(err, OperationType.GET, path);
                    localStorage.setItem(`seeded_${student.id}_run_v7`, 'true');
                }
            };
            checkAndSeed();
        }
    }, [student.id]);

    useEffect(() => {
        if (!student.id) return;
        const path = `artifacts/${RUN_COLLECTION}/workouts`;
        const q = collection(db, path);
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()} as WorkoutModel));
            setWorkouts(data.filter(w => w.studentId === student.id));
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, path);
        });
        return () => unsub();
    }, [student.id]);

    const daysMap = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const todayName = daysMap[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

    const uniqueWorkoutsByDay = useMemo(() => {
        const map = new Map<string, WorkoutModel>();
        workouts.forEach(w => {
            const day = normalizeDay(w.dayOfWeek);
            if (!map.has(day)) {
                map.set(day, w);
            }
        });

        return daysMap.map(dayName => {
            const normalized = normalizeDay(dayName);
            const workout = map.get(normalized);
            if (workout) return workout;
            
            // Return a "Day Off" placeholder
            return {
                id: `day-off-${normalized}`,
                studentId: student.id,
                type: 'DAY OFF',
                dayOfWeek: dayName,
                description: 'Recuperação total. Hidrate-se e descanse.',
                isDayOff: true
            } as any;
        });
    }, [workouts, student.id]);

    const todayWorkout = workouts.find(w => {
        if (!w.dayOfWeek) return false;
        const d = normalizeDay(String(w.dayOfWeek));
        return d.includes(normalizeDay(todayName));
    });

    const weeklyVolume = useMemo(() => {
        return workouts.reduce((acc, w) => acc + estimateWorkoutDuration(calculateAdjustedWorkout(w).adjusted), 0);
    }, [workouts]);

    const handleCheckIn = (dateStr: string, workout: WorkoutModel, stats?: any) => {
        // Toggle logic: If exists, remove. If not, add.
        const currentHistory = student.workoutHistory || [];
        const existingIndex = currentHistory.findIndex(h => h.date === dateStr && h.workoutId === workout.id && h.type === 'RUNNING');

        let updatedHistory;
        let isAdding = false;
        
        if (existingIndex > -1 && !stats) {
            // Remove check-in (Undo) - only if no stats provided (simple toggle)
            updatedHistory = currentHistory.filter((_, idx) => idx !== existingIndex);
        } else {
            // Add or Update check-in
            isAdding = existingIndex === -1;
            const newEntry: WorkoutHistoryEntry = {
                id: existingIndex > -1 ? currentHistory[existingIndex].id : Date.now().toString(),
                workoutId: workout.id,
                name: workout.type, // e.g. "Longão"
                date: dateStr,
                timestamp: Date.now(),
                duration: stats?.duration || workout.totalTime || formatDuration(estimateWorkoutDuration(calculateAdjustedWorkout(workout).adjusted)),
                type: 'RUNNING',
                runningStats: stats
            };

            if (existingIndex > -1) {
                updatedHistory = currentHistory.map((h, idx) => idx === existingIndex ? newEntry : h);
            } else {
                updatedHistory = [newEntry, ...currentHistory];
            }
        }

        const currentAnalytics = student.analytics || { sessionsCompleted: 0, streakDays: 0, exercises: {} };
        let updatedAnalytics = { ...currentAnalytics };

        if (isAdding) {
            const now = new Date();
            let newStreak = currentAnalytics.streakDays;
            const lastDateStr = currentAnalytics.lastSessionDate;
            const todayStr = now.toLocaleDateString('pt-BR');
            
            if (lastDateStr) {
                const [lastDay, lastMonth, lastYear] = lastDateStr.split('/');
                const lastDate = new Date(parseInt(lastYear), parseInt(lastMonth) - 1, parseInt(lastDay));
                const diffTime = Math.abs(now.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    newStreak += 1;
                } else if (diffDays > 1) {
                    newStreak = 1;
                }
            } else {
                newStreak = 1;
            }

            updatedAnalytics = {
                ...currentAnalytics,
                sessionsCompleted: currentAnalytics.sessionsCompleted + 1,
                streakDays: newStreak,
                lastSessionDate: todayStr
            };
        } else if (existingIndex > -1 && !stats) {
            // If removing, we could decrement sessionsCompleted, but streak is hard to recalculate.
            // For simplicity, just decrement sessionsCompleted.
            updatedAnalytics = {
                ...currentAnalytics,
                sessionsCompleted: Math.max(0, currentAnalytics.sessionsCompleted - 1)
            };
        }

        onSave(student.id, { workoutHistory: updatedHistory, analytics: updatedAnalytics });
        setLoggingWorkout(null);
    };

    return (
        <div className="animate-in fade-in duration-500 text-left h-screen overflow-hidden bg-transparent flex flex-col relative">
            {/* STICKY HEADER */}
            <header className="p-6 pb-4 border-b border-white/5 bg-black/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                       {onToggleMenu && (
                         <button onClick={onToggleMenu} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors shadow-lg">
                           <Menu size={20}/>
                         </button>
                       )}
                       <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg">
                         <ArrowLeft size={20}/>
                       </button>
                    </div>
                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">
                      <HeaderTitle text="ABFIT RUN" />
                    </h2>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                {/* WEEKLY VOLUME SUMMARY */}
            <div className="bg-gradient-to-r from-zinc-900 to-black border border-white/5 rounded-3xl p-6 flex items-center justify-between shadow-xl mb-4">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Calculator size={12} className="text-red-600" /> Volume Semanal
                    </span>
                    <span className="text-3xl font-black italic text-white tracking-tighter leading-none">
                        {formatDuration(weeklyVolume)}
                    </span>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-600/10 border border-red-600/30 flex items-center justify-center">
                    <TrendingUp size={24} className="text-red-600" />
                </div>
            </div>

            <div className="max-w-md mx-auto space-y-10 pb-24">
                {/* CALENDAR */}
                <RunCalendar 
                    workouts={workouts} 
                    history={student.workoutHistory || []} 
                    onCheckIn={handleCheckIn} 
                    studentId={student.id}
                />

                {/* HERO CARD (TODAY) */}
                {todayWorkout ? (
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-zinc-800 group shadow-2xl transition-all">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 p-8">
                                <div className="flex justify-between items-start mb-12">
                                    <span className="bg-red-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Treino de Hoje</span>
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer hover:text-red-400 transition-colors"
                                        onClick={() => setLoggingWorkout(todayWorkout)}
                                    >
                                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Registro Manual</span>
                                    </div>
                                </div>
                                
                                <h3 className="text-3xl font-black italic uppercase mb-2 leading-[0.85] tracking-tighter text-white">{todayWorkout.type}</h3>
                                <p className="text-zinc-400 font-medium text-sm line-clamp-2 mb-8">{todayWorkout.description || 'Foco na técnica.'}</p>
                                
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                                        <span className="text-[9px] uppercase text-zinc-400 font-black tracking-wider block mb-1">Volume</span>
                                        <span className="text-2xl font-black tracking-tight text-white">
                                            {todayWorkout.distance 
                                                ? `${todayWorkout.distance}km` 
                                                : (todayWorkout.totalTime 
                                                    ? `${todayWorkout.totalTime}'` 
                                                    : formatDuration(estimateWorkoutDuration(calculateAdjustedWorkout(todayWorkout).adjusted))
                                                  )
                                            }
                                        </span>
                                    </div>
                                    <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                                        <span className="text-[9px] uppercase text-zinc-400 font-black tracking-wider block mb-1">Intensidade</span>
                                        <span className="text-2xl font-black tracking-tight text-red-500">
                                            {todayWorkout.speed ? `${todayWorkout.speed} km/h` : 'Livre'}
                                        </span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setLiveWorkout(todayWorkout)}
                                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black italic uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/20"
                                >
                                    <Play size={20} className="fill-white" />
                                    Iniciar Treino
                                </button>
                            </div>
                        </div>
                ) : (
                     <div className="bg-zinc-900 rounded-[2.5rem] p-10 text-center border border-zinc-800 flex flex-col items-center justify-center h-80 relative overflow-hidden shadow-inner">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent" />
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-500 border border-white/5">
                                <Zap size={24} />
                            </div>
                            <p className="text-white font-black text-2xl italic uppercase tracking-tighter">Descanso</p>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Recuperar & Hidratar</p>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4 pl-2">
                        <BarChart3 size={24} className="text-red-600"/>
                        <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Sua Planilha</h3>
                    </div>
                    {uniqueWorkoutsByDay.map(w => {
                        const isTodayWorkout = normalizeDay(w.dayOfWeek).includes(normalizeDay(todayName));
                        return (
                            <div key={w.id} onClick={() => !w.isDayOff && setLoggingWorkout(w)} className={w.isDayOff ? 'opacity-50 grayscale' : 'cursor-pointer'}>
                                <WorkoutCard 
                                    workout={w} 
                                    isToday={isTodayWorkout}
                                    isCompleted={student.workoutHistory?.some(h => h.workoutId === w.id && h.date === new Date().toLocaleDateString('pt-BR'))}
                                />
                            </div>
                        );
                    })}
                </div>

                <WorkoutLegend />
            </div>
            <AppFooter />

            {loggingWorkout && (
                <LogWorkoutModal 
                    workout={loggingWorkout} 
                    onClose={() => setLoggingWorkout(null)} 
                    onSave={(stats) => handleCheckIn(new Date().toLocaleDateString('pt-BR'), loggingWorkout, stats)}
                />
            )}

            {liveWorkout && (
                <LiveRunSession
                    segments={parseWorkoutSegments(liveWorkout)}
                    workoutTitle={`${liveWorkout.type} - ${liveWorkout.dayOfWeek}`}
                    onClose={() => setLiveWorkout(null)}
                    onFinish={(totalTime) => {
                        setLiveWorkout(null);
                        // Pre-fill log modal with total time
                        setLoggingWorkout(liveWorkout);
                    }}
                />
            )}
        </div>
    </div>
    )
}

const LogWorkoutModal = ({ workout, onClose, onSave }: { workout: WorkoutModel, onClose: () => void, onSave: (stats: any) => void }) => {
    const [stats, setStats] = useState({
        distance: '',
        avgPace: '',
        avgHR: '',
        calories: '',
        duration: ''
    });
    const [isExtracting, setIsExtracting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsExtracting(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                
                const prompt = "Analise esta foto de uma esteira ou print de app de corrida e extraia os seguintes dados em formato JSON: distance (km), duration (minutos), avgPace (ritmo médio), avgHR (batimentos cardíacos), calories (kcal). Se não encontrar algum dado, deixe em branco. Retorne APENAS o JSON.";
                
                const response = await genAI.models.generateContent({
                    model: "gemini-3-flash-preview",
                    contents: {
                        parts: [
                            { text: prompt },
                            { inlineData: { data: base64, mimeType: file.type } }
                        ]
                    }
                });
                
                const text = response.text || "";
                const jsonMatch = text.match(/\{.*\}/s);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[0]);
                    setStats({
                        distance: data.distance || '',
                        duration: data.duration || '',
                        avgPace: data.avgPace || '',
                        avgHR: data.avgHR || '',
                        calories: data.calories || ''
                    });
                }
                setIsExtracting(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Erro ao extrair dados:", error);
            setIsExtracting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
                <header className="p-8 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                    <div>
                        <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Registrar Treino</h3>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{workout.type} - {workout.dayOfWeek}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </header>

                <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    {/* PHOTO UPLOAD SECTION */}
                    <div className="space-y-4">
                        <label className="text-xs font-black uppercase text-zinc-500 tracking-widest ml-2">Extrair dados da foto</label>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isExtracting}
                            className="w-full py-8 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-red-600/50 hover:bg-red-600/5 transition-all group"
                        >
                            {isExtracting ? (
                                <>
                                    <Loader2 size={32} className="text-red-600 animate-spin" />
                                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Analisando Imagem...</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                                        <Camera size={24} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300">Tire uma foto ou envie um print</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase text-zinc-500 tracking-widest ml-2">Distância (km)</label>
                            <input 
                                type="text" 
                                placeholder="Ex: 5.2"
                                value={stats.distance}
                                onChange={e => setStats({...stats, distance: e.target.value})}
                                className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-xl text-white font-black focus:border-red-600 transition-colors outline-none"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase text-zinc-500 tracking-widest ml-2">Duração (min)</label>
                            <input 
                                type="text" 
                                placeholder="Ex: 30"
                                value={stats.duration}
                                onChange={e => setStats({...stats, duration: e.target.value})}
                                className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-xl text-white font-black focus:border-red-600 transition-colors outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase text-zinc-500 tracking-widest ml-2">Ritmo Médio (Pace)</label>
                            <input 
                                type="text" 
                                placeholder="Ex: 5:45"
                                value={stats.avgPace}
                                onChange={e => setStats({...stats, avgPace: e.target.value})}
                                className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-xl text-white font-black focus:border-red-600 transition-colors outline-none"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase text-zinc-500 tracking-widest ml-2">FC Média (bpm)</label>
                            <input 
                                type="text" 
                                placeholder="Ex: 145"
                                value={stats.avgHR}
                                onChange={e => setStats({...stats, avgHR: e.target.value})}
                                className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-xl text-white font-black focus:border-red-600 transition-colors outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase text-zinc-500 tracking-widest ml-2">Calorias (kcal)</label>
                        <input 
                            type="text" 
                            placeholder="Ex: 450"
                            value={stats.calories}
                            onChange={e => setStats({...stats, calories: e.target.value})}
                            className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-xl text-white font-black focus:border-red-600 transition-colors outline-none"
                        />
                    </div>

                    <div className="p-6 bg-red-600/5 border border-red-600/20 rounded-3xl flex items-start gap-4">
                        <Sparkles size={20} className="text-red-600 shrink-0 mt-1" />
                        <p className="text-xs text-zinc-400 font-medium leading-relaxed italic">
                            "Dica: Bater uma foto do painel da esteira preenche os dados automaticamente para você."
                        </p>
                    </div>
                </div>

                <footer className="p-8 border-t border-white/5 bg-zinc-900/50">
                    <button 
                        onClick={() => onSave(stats)}
                        className="w-full py-6 bg-red-600 text-white rounded-3xl font-black uppercase tracking-widest text-lg shadow-xl shadow-red-600/20 active:scale-95 transition-all"
                    >
                        Salvar Treino
                    </button>
                </footer>
            </div>
        </div>
    );
};

// --- HELPERS ---

const normalizeDay = (d: any) => {
    if (!d) return "";
    return String(d).toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split('-')[0]
        .trim();
};

const getDayIndex = (day: string): number => {
    if (!day) return 99;
    const days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
    const d = normalizeDay(day);
    const idx = days.findIndex(x => x === d);
    return idx === -1 ? 99 : idx;
};

const seedWorkouts = async (studentId: string) => {
    const payloadMap: Record<string, any[]> = {
        'fixed-andre': [
            { studentId: 'fixed-andre', type: 'Regenerativo', dayOfWeek: 'Segunda', warmupTime: '10', sets: '10', reps: '1', stimulusTime: '1', speed: '9', recoveryTime: '2', cooldownTime: '10', description: '' },
            { studentId: 'fixed-andre', type: 'Longão', dayOfWeek: 'Terça', warmupTime: '10', sets: '1', reps: '1', stimulusTime: '30', speed: '6', recoveryTime: '0', cooldownTime: '10', description: 'Caminhada contínua forte' },
            { studentId: 'fixed-andre', type: 'Ritmo / Tempo', dayOfWeek: 'Quarta', warmupTime: '10', sets: '6', reps: '1', stimulusTime: '3', speed: '8', recoveryTime: '3', cooldownTime: '10', description: '' },
            { studentId: 'fixed-andre', type: 'Longão', dayOfWeek: 'Quinta', warmupTime: '10', sets: '1', reps: '1', stimulusTime: '30', speed: '6', recoveryTime: '0', cooldownTime: '10', description: 'Caminhada contínua forte' },
            { studentId: 'fixed-andre', type: 'Intervalado', dayOfWeek: 'Sexta', warmupTime: '10', sets: '8', reps: '1', stimulusTime: '2', speed: '8', recoveryTime: '1', cooldownTime: '10', description: '' }
        ],
        'fixed-liliane': [
            { studentId: 'fixed-liliane', type: 'Intervalado', dayOfWeek: 'Segunda', warmupTime: '10', sets: '5', reps: '1', stimulusTime: '1', speed: '7', recoveryTime: '2', cooldownTime: '5', description: '' },
            { studentId: 'fixed-liliane', type: 'Longão', dayOfWeek: 'Terça', warmupTime: '5', sets: '1', reps: '1', stimulusTime: '20', speed: '5,5', recoveryTime: '0', cooldownTime: '5', description: 'Caminhada contínua forte' },
            { studentId: 'fixed-liliane', type: 'Intervalado', dayOfWeek: 'Quarta', warmupTime: '10', sets: '5', reps: '1', stimulusTime: '1', speed: '7', recoveryTime: '2', cooldownTime: '5', description: '' },
            { studentId: 'fixed-liliane', type: 'Longão', dayOfWeek: 'Quinta', warmupTime: '5', sets: '1', reps: '1', stimulusTime: '20', speed: '5,5', recoveryTime: '0', cooldownTime: '5', description: 'Caminhada contínua forte' },
            { studentId: 'fixed-liliane', type: 'Intervalado', dayOfWeek: 'Sexta', warmupTime: '10', sets: '5', reps: '1', stimulusTime: '1', speed: '7', recoveryTime: '2', cooldownTime: '5', description: '' }
        ],
        'fixed-marcelly': [
            { studentId: 'fixed-marcelly', type: 'Intervalado', dayOfWeek: 'Segunda', warmupTime: '10', sets: '5', reps: '1', stimulusTime: '1', speed: '8', recoveryTime: '2', cooldownTime: '5', description: '' },
            { studentId: 'fixed-marcelly', type: 'Longão', dayOfWeek: 'Terça', warmupTime: '5', sets: '1', reps: '1', stimulusTime: '20', speed: '6', recoveryTime: '0', cooldownTime: '5', description: 'Caminhada contínua forte' },
            { studentId: 'fixed-marcelly', type: 'Intervalado', dayOfWeek: 'Quarta', warmupTime: '10', sets: '5', reps: '1', stimulusTime: '1', speed: '8', recoveryTime: '2', cooldownTime: '5', description: '' },
            { studentId: 'fixed-marcelly', type: 'Longão', dayOfWeek: 'Quinta', warmupTime: '5', sets: '1', reps: '1', stimulusTime: '20', speed: '6', recoveryTime: '0', cooldownTime: '5', description: 'Caminhada contínua forte' },
            { studentId: 'fixed-marcelly', type: 'Intervalado', dayOfWeek: 'Sexta', warmupTime: '10', sets: '5', reps: '1', stimulusTime: '1', speed: '8', recoveryTime: '2', cooldownTime: '5', description: '' }
        ]
    };

    const payload = payloadMap[studentId];
    if (!payload) return;

    const path = `artifacts/${RUN_COLLECTION}/workouts`;
    // Use Promise.all to ensure all are added before finishing
    await Promise.all(payload.map(async (w) => {
        try {
            await addDoc(collection(db, path), { 
                ...w, 
                createdAt: new Date().toISOString() 
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
        }
    }));
    
    localStorage.setItem(`seeded_${studentId}_run_v7`, 'true');
};
