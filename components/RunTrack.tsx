
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, CalendarDays, Flame, Info, Plus, 
  Trash2, X, Brain, ChevronDown, Play, Zap, BarChart3,
  ArrowLeft, Menu, Gauge, TrendingUp, CheckCircle2, ChevronRight, ChevronLeft,
  Timer, Calculator, Edit3
} from 'lucide-react';
import { 
  collection, doc, onSnapshot, addDoc, deleteDoc, updateDoc 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Student, WorkoutHistoryEntry } from '../types';
import { HeaderTitle, Card, EliteFooter } from './Layout';

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

const WorkoutCard: React.FC<{ workout: WorkoutModel, onDelete?: () => void, onEdit?: () => void, isCompleted?: boolean, compact?: boolean }> = ({ workout, onDelete, onEdit, isCompleted, compact }) => {
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
            <div className={`p-4 rounded-xl border transition-all ${isCompleted ? 'bg-emerald-950/30 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : 'text-zinc-500'}`}>
                        {adjusted.type}
                    </span>
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
        <div className={`bg-zinc-900 border p-6 rounded-3xl relative group transition-all ${badge ? 'border-red-600/40 shadow-[0_0_20px_rgba(220,38,38,0.1)]' : 'border-zinc-800 hover:border-red-600/30'}`}>
            <div className="absolute top-6 right-6 flex items-center gap-2">
                {onEdit && (
                    <button onClick={onEdit} className="text-zinc-500 hover:text-white p-2 rounded-xl transition-all bg-zinc-800 hover:bg-zinc-700">
                        <Edit3 size={16} />
                    </button>
                )}
                {onDelete && (
                    <button onClick={onDelete} className="text-zinc-500 hover:text-red-500 p-2 rounded-xl transition-all hover:bg-zinc-800">
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
            
            <div className="flex flex-col mb-6">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1 flex items-center gap-2">
                        <CalendarDays size={10} /> {adjusted.dayOfWeek}
                    </span>
                    {badge ? (
                        <span className="bg-red-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1 animate-pulse">
                            <TrendingUp size={10} /> {badge}
                        </span>
                    ) : (
                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-1 bg-black/40 px-2 py-1 rounded mr-16">
                            <Timer size={10} /> {formatDuration(totalDuration)}
                        </span>
                    )}
                </div>
                <h4 className="text-2xl font-black italic uppercase text-white leading-none tracking-tighter">
                    {adjusted.type}
                </h4>
            </div>

            {/* SINGLE BLOCK LAYOUT - UNIFIED TEXT */}
            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 mb-6 flex items-center justify-center text-center">
                <p className="text-lg md:text-xl font-black italic uppercase text-white leading-relaxed tracking-wide">
                    {/* AQUECIMENTO */}
                    {warmPart && (
                        <>
                            <span>{warmPart}</span>
                            <span className="text-red-600 mx-2">+</span>
                        </>
                    )}
                    
                    {/* BLOCOS E ESTIMULO */}
                    {showBlocks && (
                        <span>{totalBlocks} BLOCOS DE </span>
                    )}
                    
                    <span>{stimPart}</span>
                    {speedPart && <span className="text-zinc-400 ml-2 text-[0.9em]">{speedPart}</span>}
                    
                    {/* RECUPERAÇÃO ENTRE TIROS */}
                    {recPart && (
                        <>
                            <span className="text-red-600 mx-2">:</span>
                            <span className="text-zinc-300">{recPart}</span>
                        </>
                    )}
                    
                    {/* DESAQUECIMENTO */}
                    {coolPart && (
                        <>
                            <span className="text-red-600 mx-2">+</span>
                            <span>{coolPart}</span>
                        </>
                    )}
                </p>
            </div>

            {workout.description && (
                <div className="p-4 rounded-xl border-l-2 border-red-600 bg-red-600/5">
                    <p className="text-xs text-zinc-300 font-medium leading-relaxed italic">"{workout.description}"</p>
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
            const saveOperation = initialData && initialData.id
                ? updateDoc(doc(db, 'artifacts', RUN_COLLECTION, 'workouts', initialData.id), payload)
                : addDoc(collection(db, 'artifacts', RUN_COLLECTION, 'workouts'), { ...payload, createdAt: new Date().toISOString() });

            const timeout = new Promise((resolve) => setTimeout(resolve, 3000));

            await Promise.race([saveOperation, timeout]);
            
            // Forces modal close to allow new creation
            onClose();
        } catch (e) { 
            console.error(e); 
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

const RunCalendar = ({ workouts, history, onCheckIn }: { workouts: WorkoutModel[], history: WorkoutHistoryEntry[], onCheckIn: (date: string, workout: WorkoutModel) => void }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
    
    const dayNameMap: Record<string, number> = {
        'domingo': 0, 'segunda': 1, 'terça': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5, 'sábado': 6
    };

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getWorkoutForDate = (day: number) => {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        
        return workouts.find(w => {
            const wDayIndex = dayNameMap[w.dayOfWeek.toLowerCase().split('-')[0]];
            return wDayIndex === dayOfWeek;
        });
    };

    const isCompleted = (day: number, workoutId: string) => {
        const dateStr = new Date(year, month, day).toLocaleDateString('pt-BR');
        return history.some(h => h.date === dateStr && h.workoutId === workoutId && h.type === 'RUNNING');
    };

    const handleDayClick = (day: number, workout: WorkoutModel) => {
        const dateStr = new Date(year, month, day).toLocaleDateString('pt-BR');
        onCheckIn(dateStr, workout);
    };

    const isToday = (day: number) => {
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 mb-8 shadow-xl">
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
                    const todayHighlight = isToday(day) ? "bg-zinc-800" : "bg-transparent";
                    
                    return (
                        <div key={day} className="aspect-square relative">
                            {workout ? (
                                <button 
                                    onClick={() => handleDayClick(day, workout)}
                                    className={`w-full h-full rounded-xl flex flex-col items-center justify-center border-2 transition-all active:scale-95
                                        ${completed 
                                            ? 'bg-emerald-950/30 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                            : `border-zinc-800 hover:border-red-600/50 ${todayHighlight}`
                                        }
                                    `}
                                >
                                    <span className={`text-[10px] font-black ${completed ? 'text-emerald-500' : 'text-white'}`}>{day}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full mt-1 ${completed ? 'bg-emerald-500' : 'bg-red-600'}`}></div>
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
            </div>
        </div>
    );
};

// --- COACH VIEW ---

export function RunTrackCoachView({ student, onBack }: { student: Student, onBack: () => void }) {
    const [workouts, setWorkouts] = useState<WorkoutModel[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingWorkout, setEditingWorkout] = useState<WorkoutModel | null>(null);
    
    useEffect(() => {
        const q = collection(db, 'artifacts', RUN_COLLECTION, 'workouts');
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()} as WorkoutModel));
            setWorkouts(data.filter(w => w.studentId === student.id));
        });
        return () => unsub();
    }, [student.id]);

    const deleteWorkout = async (id: string) => {
        if(confirm("Deletar este treino?")) {
            await deleteDoc(doc(db, 'artifacts', RUN_COLLECTION, 'workouts', id));
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
                   workouts.sort((a,b) => getDayIndex(a.dayOfWeek) - getDayIndex(b.dayOfWeek)).map(w => (
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

export function RunTrackStudentView({ student, onBack, onSave, onToggleMenu }: { student: Student, onBack: () => void, onSave: (id: string, data: any) => void, onToggleMenu?: () => void }) {
    const [workouts, setWorkouts] = useState<WorkoutModel[]>([]);

    useEffect(() => {
        if (!student.id) return;
        const q = collection(db, 'artifacts', RUN_COLLECTION, 'workouts');
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()} as WorkoutModel));
            setWorkouts(data.filter(w => w.studentId === student.id));
        });
        return () => unsub();
    }, [student.id]);

    const sortedWorkouts = workouts.sort((a,b) => getDayIndex(a.dayOfWeek) - getDayIndex(b.dayOfWeek));
    const daysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const todayName = daysMap[new Date().getDay()];
    const todayWorkout = workouts.find(w => w.dayOfWeek.toLowerCase().includes(todayName.toLowerCase().split('-')[0]));

    const weeklyVolume = useMemo(() => {
        return workouts.reduce((acc, w) => acc + estimateWorkoutDuration(calculateAdjustedWorkout(w).adjusted), 0);
    }, [workouts]);

    const handleCheckIn = (dateStr: string, workout: WorkoutModel) => {
        // Toggle logic: If exists, remove. If not, add.
        const currentHistory = student.workoutHistory || [];
        const existingIndex = currentHistory.findIndex(h => h.date === dateStr && h.workoutId === workout.id && h.type === 'RUNNING');

        let updatedHistory;
        if (existingIndex > -1) {
            // Remove check-in (Undo)
            updatedHistory = currentHistory.filter((_, idx) => idx !== existingIndex);
        } else {
            // Add check-in
            const newEntry: WorkoutHistoryEntry = {
                id: Date.now().toString(),
                workoutId: workout.id,
                name: workout.type, // e.g. "Longão"
                date: dateStr,
                timestamp: Date.now(),
                duration: workout.totalTime || '00:00', // Default or actual
                type: 'RUNNING'
            };
            updatedHistory = [newEntry, ...currentHistory];
        }

        onSave(student.id, { workoutHistory: updatedHistory });
    };

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 text-left h-screen overflow-y-auto custom-scrollbar bg-black">
            <div className="flex items-center gap-4 mb-4">
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
                />

                {/* HERO CARD (TODAY) */}
                {todayWorkout ? (
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-zinc-800 group shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 p-8">
                            <div className="flex justify-between items-start mb-12">
                                <span className="bg-red-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Treino de Hoje</span>
                                <Play className="text-white fill-white" size={24} />
                            </div>
                            
                            <h3 className="text-5xl font-black italic uppercase mb-2 leading-[0.85] tracking-tighter text-white">{todayWorkout.type}</h3>
                            <p className="text-zinc-400 font-medium text-sm line-clamp-2 mb-8">{todayWorkout.description || 'Foco na técnica.'}</p>
                            
                            <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4 pl-2">
                        <BarChart3 size={20} className="text-red-600"/>
                        <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Semana</h3>
                    </div>
                    {sortedWorkouts.map(w => (
                        <WorkoutCard key={w.id} workout={w} />
                    ))}
                </div>

                <WorkoutLegend />
            </div>
            <EliteFooter />
        </div>
    )
}

// Helper
function getDayIndex(day: string): number {
    const days = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
    const d = day.toLowerCase().split('-')[0];
    const idx = days.findIndex(x => x === d);
    return idx === -1 ? 99 : idx;
}
