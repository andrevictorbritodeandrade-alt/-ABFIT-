
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, CalendarDays, Flame, Info, Plus, 
  Trash2, X, Brain, ChevronDown, Play, Zap, BarChart3,
  ArrowLeft, Menu, Gauge
} from 'lucide-react';
import { 
  collection, doc, onSnapshot, addDoc, deleteDoc 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Student } from '../types';
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

const WorkoutCard: React.FC<{ workout: WorkoutModel, onDelete?: () => void }> = ({ workout, onDelete }) => {
    
    // Helper para formatar o display string "5' AQ"
    const formatTime = (val?: string) => {
        if (!val || val === '0') return null;
        // Se for só numero, adiciona '. Se tiver letras (ex: 400m), mantem.
        const isNumber = /^\d+$/.test(val);
        return isNumber ? `${val}'` : val;
    };

    const warm = formatTime(workout.warmupTime) ? `${formatTime(workout.warmupTime)} AQ` : null;
    
    const sets = Number(workout.sets) || 1;
    const reps = Number(workout.reps) || 1;
    const totalBlocks = sets * reps;
    
    const stimRaw = workout.stimulusTime;
    const stimTime = formatTime(stimRaw);
    
    // Mostra blocos se > 1 E se tiver estimulo definido
    const showBlocks = totalBlocks > 1 && !!stimTime;
    
    const stim = stimTime ? `${stimTime} CO` : '';
    const speed = workout.speed ? `${workout.speed}km/h` : '';
    
    const recRaw = workout.recoveryTime;
    const recTime = formatTime(recRaw);
    const rec = recTime ? `${recTime} CA` : null;
    
    const cool = formatTime(workout.cooldownTime) ? `${formatTime(workout.cooldownTime)} REC` : null;

    return (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl relative group hover:border-red-600/30 transition-all">
            {onDelete && (
                <button onClick={onDelete} className="absolute top-6 right-6 text-zinc-500 hover:text-red-500 p-2 rounded-xl transition-all">
                    <Trash2 size={18} />
                </button>
            )}
            
            <div className="flex flex-col mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1 flex items-center gap-2">
                    <CalendarDays size={10} /> {workout.dayOfWeek}
                </span>
                <h4 className="text-2xl font-black italic uppercase text-white leading-none tracking-tighter">
                    {workout.type}
                </h4>
            </div>

            {/* SINGLE BLOCK LAYOUT */}
            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 mb-6 flex items-center justify-center min-h-[100px]">
                <p className="text-lg md:text-xl font-black italic uppercase text-white leading-relaxed tracking-wide text-center">
                    {warm && (
                        <>
                            <span className="text-white">{warm}</span>
                            <span className="text-red-600 mx-2">+</span>
                        </>
                    )}
                    
                    {showBlocks && (
                        <span className="text-white">{totalBlocks} BLOCOS DE </span>
                    )}
                    
                    <span className="text-white">{stim}</span>
                    {speed && <span className="text-zinc-400 ml-2 text-[0.9em]">{speed}</span>}
                    
                    {rec && (
                        <>
                            <span className="text-red-600 mx-2">:</span>
                            <span className="text-zinc-300">{rec}</span>
                        </>
                    )}
                    
                    {cool && (
                        <>
                            <span className="text-red-600 mx-2">+</span>
                            <span className="text-white">{cool}</span>
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

function WorkoutBuilder({ studentId, onClose }: { studentId: string, onClose: () => void }) {
    const [type, setType] = useState('Longão');
    const [day, setDay] = useState('Segunda');
    const [loading, setLoading] = useState(false);

    // Consolidated Form State for ALL types
    const [form, setForm] = useState({
        warmup: '10',
        cooldown: '5',
        sets: '1',
        reps: '1',
        stimulus: '0',
        recovery: '0',
        speed: '', // New Speed field
        description: ''
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
                type, // Saves the friendly name directly (e.g. "Intervalado")
                dayOfWeek: day,
                warmupTime: form.warmup,
                cooldownTime: form.cooldown,
                sets: form.sets,
                reps: form.reps,
                stimulusTime: form.stimulus,
                recoveryTime: form.recovery,
                speed: form.speed,
                description: form.description,
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'artifacts', RUN_COLLECTION, 'workouts'), payload);
            onClose();
        } catch (e) { console.error(e); } finally { setLoading(false); }
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
                <h4 className="text-xl font-black italic uppercase mb-8 text-red-600">Nova Sessão</h4>
                
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

                <Button onClick={handleSave} loading={loading} className="w-full">Criar Treino</Button>
            </div>
        </div>
    );
}

// --- COACH VIEW ---

export function RunTrackCoachView({ student, onBack }: { student: Student, onBack: () => void }) {
    const [workouts, setWorkouts] = useState<WorkoutModel[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    
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

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 text-left h-screen overflow-y-auto custom-scrollbar bg-black">
            <header className="flex items-center gap-4 mb-10 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-50 -mx-6 px-6 border-b border-white/5">
                <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"><ArrowLeft size={20}/></button>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
                  <HeaderTitle text={`ABFIT RUN ${student.nome}`} />
                </h2>
            </header>

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
                    onClose={() => setIsCreating(false)} 
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
                {workouts.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                        <p className="font-bold text-zinc-600 uppercase text-xs tracking-widest">SEM TREINOS PRESCRITOS</p>
                    </div>
                ) : (
                   workouts.sort((a,b) => getDayIndex(a.dayOfWeek) - getDayIndex(b.dayOfWeek)).map(w => (
                       <WorkoutCard key={w.id} workout={w} onDelete={() => deleteWorkout(w.id)} />
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
    // Matching logic for day of week (partial match to handle 'Feira' etc)
    const todayWorkout = workouts.find(w => w.dayOfWeek.toLowerCase().includes(todayName.toLowerCase().split('-')[0]));

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

            <div className="max-w-md mx-auto space-y-10 pb-24">
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
                                        {todayWorkout.distance ? `${todayWorkout.distance}km` : `${todayWorkout.totalTime}'`}
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
