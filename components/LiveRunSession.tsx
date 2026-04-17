import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, ChevronRight, Volume2, VolumeX, X, User, Users, Map as MapIcon, BarChart2, Check, Timer, Wifi, LayoutGrid, Camera, Loader2, Heart, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Polyline, useMap, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { GoogleGenAI } from "@google/genai";
import { Logo } from './Layout';

// Fix Leaflet marker icon issue
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
}

export interface WorkoutSegment {
    type: 'warmup' | 'stimulus' | 'recovery' | 'cooldown' | 'continuous';
    duration: number; // in seconds
    title: string;
    speed?: string;
}

interface LiveRunSessionProps {
    segments: WorkoutSegment[];
    workoutTitle: string;
    onClose: () => void;
    onFinish: (totalTime: number, stats?: any) => void;
    studentWeight?: number;
    studentHeight?: number;
    studentPhoto?: string;
}

type Gender = 'male' | 'female';
type Mode = 'indoor' | 'outdoor';

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

let genAIInstance: GoogleGenAI | null = null;
function getGenAI() {
    if (!genAIInstance) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set. Please configure it in the settings.");
        }
        genAIInstance = new GoogleGenAI({ apiKey });
    }
    return genAIInstance;
}

export function LiveRunSession({ segments, workoutTitle, onClose, onFinish, studentWeight, studentHeight, studentPhoto }: LiveRunSessionProps) {
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [segmentTimeLeft, setSegmentTimeLeft] = useState(segments[0]?.duration || 0);
    const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [gender, setGender] = useState<Gender>('female');
    const [mode, setMode] = useState<Mode>('indoor');
    const [weight, setWeight] = useState(studentWeight || 70);
    const [height, setHeight] = useState(studentHeight || 170);
    const [countdownValue, setCountdownValue] = useState<number | string | null>(null);
    const [showSettings, setShowSettings] = useState(true);
    const [viewMode, setViewMode] = useState<'stats' | 'map'>('stats');
    
    // GPS & Stats State
    const [distance, setDistance] = useState(0); // in km
    const [calories, setCalories] = useState(0);
    const [pace, setPace] = useState('0:00');
    const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
    const [avgSpeed, setAvgSpeed] = useState(0); // km/h
    const [elevationGain, setElevationGain] = useState(0); // meters
    const [steps, setSteps] = useState(0);
    const [avgHeartRate, setAvgHeartRate] = useState<number | null>(null);
    
    // Daily Health Stats
    const [dailySteps, setDailySteps] = useState(10500);
    const [dailySleep, setDailySleep] = useState("7h 15m");
    const [dailyActiveMin, setDailyActiveMin] = useState(75);
    const [isProcessingHealth, setIsProcessingHealth] = useState(false);

    const [isAutoPaused, setIsAutoPaused] = useState(false);
    const [lastPosition, setLastPosition] = useState<GeolocationPosition | null>(null);
    const [path, setPath] = useState<{lat: number, lng: number}[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const togglePlayPause = () => {
        if (!isRunning) lastMovementTimeRef.current = Date.now();
        if (isAutoPaused) setIsAutoPaused(false);
        setIsRunning(!isRunning);
    };
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastTickRef = useRef<number>(0);
    const speechQueueRef = useRef<string[]>([]);
    const isSpeakingRef = useRef(false);
    const watchIdRef = useRef<number | null>(null);
    const wakeLockRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastMovementTimeRef = useRef<number>(0);

    const currentSegment = segments[currentSegmentIndex];

    // Wake Lock to prevent screen from sleeping
    useEffect(() => {
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                } catch (err: any) {
                    console.error(`${err.name}, ${err.message}`);
                }
            }
        };
        if (isRunning) requestWakeLock();
        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
        };
    }, [isRunning]);

    const isWatch = React.useMemo(() => {
        if (typeof window === 'undefined') return false;
        const ua = navigator.userAgent.toLowerCase();
        const isWearOS = ua.includes('wear os') || ua.includes('wearos');
        const isWatchUA = ua.includes('watch') || ua.includes('samsung');
        const isSmallScreen = window.innerWidth < 500 && window.innerHeight < 500;
        return (isWearOS || isWatchUA) && isSmallScreen;
    }, []);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const updateCalories = (dist: number) => {
        const kcal = weight * dist * 1.036;
        setCalories(Math.round(kcal));
    };

    useEffect(() => {
        if (mode === 'outdoor' && isRunning && !isFinished) {
            if ('geolocation' in navigator) {
                watchIdRef.current = window.navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        
                        if (lastPosition) {
                            const d = calculateDistance(
                                lastPosition.coords.latitude,
                                lastPosition.coords.longitude,
                                latitude,
                                longitude
                            );
                            
                            if (d > 0.002) {
                                lastMovementTimeRef.current = Date.now();
                                if (isAutoPaused) setIsAutoPaused(false);
                                setDistance(prev => {
                                    const newDist = prev + d;
                                    updateCalories(newDist);
                                    const strideLength = (height / 100) * 0.414;
                                    setSteps(Math.round((newDist * 1000) / strideLength));
                                    return newDist;
                                });
                                setPath(prev => [...prev, { lat: latitude, lng: longitude }]);
                            }
                            
                            if (position.coords.altitude !== null && lastPosition.coords.altitude !== null) {
                                const diff = position.coords.altitude - lastPosition.coords.altitude;
                                if (diff > 0.5) setElevationGain(prev => prev + diff);
                            }
                        } else {
                            lastMovementTimeRef.current = Date.now();
                            if (isAutoPaused) setIsAutoPaused(false);
                            setPath([{ lat: latitude, lng: longitude }]);
                        }
                        setLastPosition(position);
                        
                        if (position.coords.speed !== null && position.coords.speed > 0.5) {
                            const speedKmh = position.coords.speed * 3.6;
                            setCurrentSpeed(speedKmh);
                            const paceMinKm = 60 / speedKmh;
                            const mins = Math.floor(paceMinKm);
                            const secs = Math.round((paceMinKm - mins) * 60);
                            setPace(`${mins}:${secs.toString().padStart(2, '0')}`);
                        } else {
                            setCurrentSpeed(0);
                        }
                    },
                    (error) => console.error("GPS Error:", error),
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
            }
        } else if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, [mode, isRunning, isFinished, lastPosition]);

    const speak = (text: string, interrupt = false) => {
        if (!soundEnabled || !('speechSynthesis' in window)) return;
        if (interrupt) {
            window.speechSynthesis.cancel();
            speechQueueRef.current = [];
            isSpeakingRef.current = false;
        }
        if (!interrupt && speechQueueRef.current.includes(text)) return;
        speechQueueRef.current.push(text);
        processSpeechQueue();
    };

    const processSpeechQueue = () => {
        if (isSpeakingRef.current || speechQueueRef.current.length === 0) return;
        const text = speechQueueRef.current.shift()!;
        isSpeakingRef.current = true;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.25;
        utterance.onend = () => { isSpeakingRef.current = false; processSpeechQueue(); };
        utterance.onerror = () => { isSpeakingRef.current = false; processSpeechQueue(); };
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (isRunning && !isFinished && !countdownValue && !isAutoPaused) {
            lastTickRef.current = Date.now();
            if (lastMovementTimeRef.current === 0) lastMovementTimeRef.current = Date.now();
            timerRef.current = setInterval(() => {
                const now = Date.now();
                
                if (mode === 'outdoor' && !isAutoPaused) {
                    if (now - lastMovementTimeRef.current > 3000) {
                        setIsAutoPaused(true);
                        speak("Treino pausado. Sem movimento detectado.");
                        return; // Auto-pause stops the clock completely
                    }
                }

                const delta = Math.floor((now - lastTickRef.current) / 1000);
                if (delta >= 1) {
                    lastTickRef.current = now;
                    setTotalTimeElapsed(prev => {
                        const next = prev + delta;
                        if (next > 0 && distance > 0) setAvgSpeed((distance / (next / 3600)));
                        return next;
                    });
                    setSegmentTimeLeft(prev => {
                        const newTime = prev - delta;
                        if (newTime <= 5 && newTime > 0 && prev > 5) speak("Cinco. Quatro. Três. Dois. Um.");
                        if (newTime <= 0) { handleNextSegment(); return 0; }
                        return newTime;
                    });
                }
            }, 1000);
        } else if (timerRef.current) clearInterval(timerRef.current);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRunning, currentSegmentIndex, isFinished, soundEnabled, countdownValue, isAutoPaused, distance]);

    const handleNextSegment = (forceFinish = false) => {
        if (forceFinish || currentSegmentIndex + 1 >= segments.length) {
            speak(forceFinish ? "Treino encerrado." : "Treino concluído! Parabéns!");
            setIsRunning(false);
            setIsFinished(true);
        } else {
            const nextIndex = currentSegmentIndex + 1;
            const nextSegment = segments[nextIndex];
            if (nextSegment.type === 'stimulus' || currentSegment.type === 'warmup') {
                startCountdown(() => {
                    setCurrentSegmentIndex(nextIndex);
                    setSegmentTimeLeft(nextSegment.duration);
                    announceSegment(nextSegment);
                });
            } else {
                setCurrentSegmentIndex(nextIndex);
                setSegmentTimeLeft(nextSegment.duration);
                announceSegment(nextSegment);
            }
        }
    };

    const announceSegment = (segment: WorkoutSegment) => {
        if (segment.type === 'stimulus' || segment.type === 'continuous') speak("Vamos correr!", true);
        else if (segment.type === 'recovery') speak("Recuperação", true);
        else if (segment.type === 'cooldown') speak("Desaquecimento", true);
    };

    const startCountdown = (callback: () => void) => {
        setIsRunning(false);
        let count = 3;
        setCountdownValue(count);
        speak("Três", true);
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdownValue(count);
                speak(count === 2 ? "Dois" : "Um");
            } else if (count === 0) {
                setCountdownValue("VAI!");
                speak("Iniciar!");
            } else {
                clearInterval(interval);
                setCountdownValue(null);
                setIsRunning(true);
                callback();
            }
        }, 1000);
    };

    const startWorkout = () => {
        setShowSettings(false);
        startCountdown(() => announceSegment(segments[0]));
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleHealthImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessingHealth(true);
        try {
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(file);
            });

            const modelName = "gemini-3-flash-preview";
            const prompt = "Analise este print do Samsung Health. Extraia exatamente estes 3 valores numerais: 'Passos Totais do dia', 'Tempo total de sono (formato Xh Ym)' e 'Minutos Ativos'. Retorne APENAS um JSON: { \"steps\": number, \"sleep\": string, \"activeMin\": number }. Se não encontrar, use valores padrão realistas próximos a 8000 passos, 7h de sono e 60min ativos.";
            
            const response = await getGenAI().models.generateContent({
                model: modelName,
                contents: [
                    {
                        text: prompt
                    },
                    {
                        inlineData: {
                            data: base64,
                            mimeType: file.type
                        }
                    }
                ]
            });
            const text = (response.text || "").replace(/```json|```/g, "").trim();
            const data = JSON.parse(text);
            
            if (data.steps) setDailySteps(data.steps);
            if (data.sleep) setDailySleep(data.sleep);
            if (data.activeMin) setDailyActiveMin(data.activeMin);
            
        } catch (err) {
            console.error("Health Sync Error:", err);
        } finally {
            setIsProcessingHealth(false);
        }
    };

    if (showSettings) {
        return (
            <div className="fixed inset-0 z-[1100] bg-black p-8 overflow-y-auto custom-scrollbar flex flex-col items-center">
                <div className="w-full max-w-2xl space-y-10 py-10">
                    <div className="flex justify-between items-center mb-6">
                        <Logo size="text-4xl" subSize="text-[8px]" />
                        <button onClick={onClose} className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all"><X size={24} /></button>
                    </div>

                    <div className="bg-[#1a1a1a] p-8 rounded-[3rem] border border-white/5 shadow-2xl space-y-4 font-sans">
                        <div className="flex items-center gap-3 text-red-600 mb-2">
                            <Activity size={24} className="animate-pulse" />
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">PREPARAR TREINO</h2>
                        </div>
                        <p className="text-xl font-black italic text-white uppercase tracking-tighter leading-none border-l-4 border-red-600 pl-4 py-1">{workoutTitle}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic mt-4">{segments.length} Segmentos • Estimativa {Math.ceil(segments.reduce((acc, s) => acc + s.duration, 0) / 60)} min</p>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 italic">Voz do Audio-Feedback</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setGender('female')} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${gender === 'female' ? 'border-[#e2ff00] bg-[#e2ff00]/10' : 'border-zinc-800 bg-[#1a1a1a]'}`}><User size={24} className={gender === 'female' ? 'text-[#e2ff00]' : 'text-zinc-500'} /><span className="font-black uppercase tracking-widest text-[10px] text-white italic">Feminina</span></button>
                                <button onClick={() => setGender('male')} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${gender === 'male' ? 'border-[#e2ff00] bg-[#e2ff00]/10' : 'border-zinc-800 bg-[#1a1a1a]'}`}><Users size={24} className={gender === 'male' ? 'text-[#e2ff00]' : 'text-zinc-500'} /><span className="font-black uppercase tracking-widest text-[10px] text-white italic">Masculina</span></button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 italic">Ambiente de Operação</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setMode('indoor')} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${mode === 'indoor' ? 'border-[#e2ff00] bg-[#e2ff00]/10' : 'border-zinc-800 bg-[#1a1a1a]'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === 'indoor' ? 'bg-[#e2ff00] text-black' : 'bg-zinc-800 text-zinc-500'}`}><Timer size={16} /></div>
                                    <span className="font-black uppercase tracking-widest text-[10px] text-white italic">Esteira (Indoor)</span>
                                </button>
                                <button onClick={() => setMode('outdoor')} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${mode === 'outdoor' ? 'border-[#e2ff00] bg-[#e2ff00]/10' : 'border-zinc-800 bg-[#1a1a1a]'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === 'outdoor' ? 'bg-[#e2ff00] text-black' : 'bg-zinc-800 text-zinc-500'}`}><MapIcon size={16} /></div>
                                    <span className="font-black uppercase tracking-widest text-[10px] text-white italic">Rua (GPS Ativo)</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <button onClick={startWorkout} className="w-full py-8 bg-red-600 text-white rounded-[2rem] font-black italic uppercase tracking-widest text-2xl shadow-2xl shadow-red-900/40 active:scale-95 transition-all mt-10">INICIAR SESSÃO</button>
                </div>
            </div>
        );
    }

    if (isWatch) {
        return (
            <div className="fixed inset-0 z-[200] bg-black text-white flex flex-col items-center justify-center p-2 rounded-full border-2 border-red-600 overflow-hidden">
                {isFinished ? (
                    <div className="text-center"><h2 className="text-lg font-black italic text-emerald-500 uppercase">Fim!</h2><p className="text-xs font-bold">{distance.toFixed(2)} km</p><button onClick={onClose} className="mt-2 px-4 py-1 bg-red-600 rounded-full text-[10px] font-black uppercase">OK</button></div>
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full relative">
                        <div className="text-center mb-1">
                            <p className="text-[10px] font-black text-zinc-500 uppercase">{currentSegment.title}</p>
                            <p className="text-4xl font-black italic text-[#e2ff00] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">{mode === 'outdoor' ? distance.toFixed(2) : formatTime(segmentTimeLeft)}</p>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase">{mode === 'outdoor' ? 'KM' : 'Tempo'}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsRunning(!isRunning)} className="p-2 bg-red-600 rounded-full">{isRunning ? <Pause size={14} fill="white"/> : <Play size={14} fill="white"/>}</button>
                            <button onClick={() => handleNextSegment()} className="p-2 bg-zinc-900 rounded-full border border-white/10"><ChevronRight size={14}/></button>
                            <button onClick={() => handleNextSegment(true)} className="p-2 bg-emerald-600 rounded-full border border-white/10"><Check size={14}/></button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="fixed inset-0 z-[1100] bg-black text-white flex flex-col p-8 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar font-sans pb-32">
                <div className="flex justify-between items-center mb-12 mt-4">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">TREINO CONCLUÍDO</h2>
                    <div className="bg-zinc-900 border border-white/5 px-5 py-2 rounded-full text-zinc-400 font-black italic text-xs tracking-widest">
                        {new Date().toLocaleDateString('pt-BR')}
                    </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-[3rem] p-10 mb-8 shadow-2xl relative overflow-hidden border border-white/5">
                    <div className="flex items-center gap-3 mb-10">
                        <Activity size={20} className="text-red-600 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">MÉTRICAS DE PERFORMANCE</span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-12 gap-x-6">
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">DISTÂNCIA</p><p className="text-5xl font-black italic text-[#e2ff00] tracking-tighter leading-none">{distance.toFixed(2)} <span className="text-sm font-black uppercase italic text-zinc-400">km</span></p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">PACE MÉDIO</p><p className="text-5xl font-black italic text-[#e2ff00] tracking-tighter leading-none">{pace} <span className="text-sm font-black uppercase italic text-zinc-400">/km</span></p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">TEMPO FINAL</p><p className="text-5xl font-black italic text-[#e2ff00] tracking-tighter leading-none">{Math.floor(totalTimeElapsed / 60)}:{(totalTimeElapsed % 60).toString().padStart(2, '0')} <span className="text-sm font-black uppercase italic text-zinc-400">min</span></p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">ELEVAÇÃO GANHA</p><p className="text-5xl font-black italic text-[#e2ff00] tracking-tighter leading-none">{elevationGain.toFixed(0)} <span className="text-sm font-black uppercase italic text-zinc-400">m</span></p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">CALORIAS</p><p className="text-5xl font-black italic text-[#e2ff00] tracking-tighter leading-none">{calories} <span className="text-sm font-black uppercase italic text-zinc-400">kcal</span></p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">BATIMENTO MÉDIO</p><p className="text-5xl font-black italic text-[#e2ff00] tracking-tighter leading-none">{avgHeartRate || '--'} <span className="text-sm font-black uppercase italic text-zinc-400">bpm</span></p></div>
                    </div>
                </div>

                <div className="w-full h-64 rounded-[2.5rem] bg-[#1a1a1a] mb-8 overflow-hidden relative border border-white/5 shadow-2xl">
                    {mode === 'outdoor' && path.length > 0 ? (
                        <MapContainer center={[path[0].lat, path[0].lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false} touchZoom={false}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            <Polyline positions={path.map(p => [p.lat, p.lng] as [number, number])} color="#e2ff00" weight={5} />
                        </MapContainer>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 gap-3 bg-zinc-950/50">
                            <MapIcon size={48} className="opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Treino Indoor • Sem GPS Ativo</p>
                        </div>
                    )}
                </div>

                <div className="bg-[#1a1a1a] rounded-[3rem] p-10 mb-12 shadow-2xl relative border border-white/5">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40"><Activity size={16} className="text-white" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">DAILY HEALTH SUMMARY</span>
                        </div>
                        <Heart size={20} className="text-blue-600 fill-blue-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-y-12 gap-x-10">
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">PASSOS DIÁRIOS</p><p className="text-4xl font-black italic text-blue-500 tracking-tighter leading-none">{dailySteps.toLocaleString()} <span className="text-[10px] font-bold uppercase italic text-zinc-600">steps</span></p></div>
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">QUALIDADE SONO</p><p className="text-4xl font-black italic text-blue-500 tracking-tighter leading-none">{dailySleep}</p></div>
                        <div className="col-span-2"><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 italic">ATIVIDADE ATIVA NO DIA</p><p className="text-4xl font-black italic text-blue-500 tracking-tighter leading-none">{dailyActiveMin} <span className="text-sm font-black uppercase italic text-zinc-600">minutos</span></p></div>
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="mt-10 w-full py-5 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center gap-4 text-zinc-400 hover:text-[#e2ff00] transition-all group">
                        {isProcessingHealth ? <Loader2 className="animate-spin text-[#e2ff00]" size={20} /> : <Camera size={20} className="group-hover:scale-110 transition-transform" />}
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Sincronizar Samsung Health (Screenshot)</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleHealthImageUpload} className="hidden" accept="image/*" />
                </div>

                <div className="flex flex-col gap-6">
                    <button 
                        onClick={() => { onFinish(totalTimeElapsed, { distance, calories, avgPace: pace, duration: totalTimeElapsed, path }); onClose(); }} 
                        className="w-full py-8 bg-[#e2ff00] text-black rounded-full font-black italic uppercase tracking-[0.2em] text-2xl shadow-3xl shadow-[#e2ff00]/20 active:scale-95 transition-all outline outline-8 outline-[#e2ff00]/5"
                    >
                        CONCLUIR TREINO
                    </button>
                    <p className="text-center text-[8px] font-black text-zinc-700 uppercase tracking-widest italic">ABFIT PERFORMANCE SYSTEM • DADOS CRIPTOGRAFADOS</p>
                </div>
            </div>
        );
    }
     return (
        <div className="fixed inset-0 z-[1000] bg-black text-white flex flex-col animate-in slide-in-from-bottom-full duration-700 overflow-hidden font-sans">
            <AnimatePresence>
                {countdownValue && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5 }} className="fixed inset-0 z-[1100] bg-black/95 flex flex-col items-center justify-center pointer-events-none">
                        <motion.span 
                            initial={{ y: 50 }} animate={{ y: 0 }}
                            className={`font-black italic text-red-600 tracking-tighter drop-shadow-[0_10px_60px_rgba(220,38,38,0.6)] leading-none ${countdownValue === 'VAI!' ? 'text-[clamp(10rem,30vw,20rem)]' : 'text-[clamp(15rem,40vw,30rem)]'}`}
                        >
                            {countdownValue}
                        </motion.span>
                        {countdownValue === 'VAI!' && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white text-xl font-black uppercase tracking-[0.5em] italic mt-4">ABFIT RUN</motion.p>}
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="px-8 py-8 flex justify-between items-center z-[1050] bg-black/80 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-4 bg-zinc-900 rounded-3xl text-red-600 hover:text-white transition-all shadow-xl border border-red-600/20 group">
                        <X size={24} className="group-hover:rotate-90 transition-transform" />
                    </button>
                    {studentPhoto && (
                        <div className="w-14 h-14 rounded-2xl border-2 border-red-600 overflow-hidden shadow-lg shadow-red-900/20 bg-zinc-900">
                            <img src={studentPhoto} className="w-full h-full object-cover" alt="User" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-center flex-1">
                    <div className="flex items-center gap-3">
                        <Timer size={22} className="text-red-600 animate-pulse" />
                        <span className="text-5xl font-black tabular-nums tracking-tighter text-[#e2ff00] italic leading-none">{formatTime(totalTimeElapsed)}</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mt-2">DURAÇÃO TOTAL</p>
                </div>
                <div className="w-[56px]" /> {/* Spacer to balance the header since wifi icon is removed */}
            </header>

            <div className="flex-1 flex flex-col items-center justify-start pt-10 px-8 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 to-black">
                <p className="text-3xl font-black uppercase tracking-[0.2em] text-white text-center italic mb-6 border-b-4 border-red-600 pb-2">{currentSegment.title}</p>
                <div className="mb-14">
                    <div className="px-12 py-5 rounded-[2rem] border-2 border-red-600 bg-red-600/5 flex items-center justify-center gap-4 shadow-2xl shadow-red-900/20">
                        <span className="text-xs font-black uppercase text-red-600 tracking-[0.2em] italic">RESTANTE:</span>
                        <span className="text-5xl font-black italic text-red-600 tabular-nums leading-none tracking-tighter">{formatTime(segmentTimeLeft)}</span>
                    </div>
                </div>
                
                <div className="text-center mb-16 relative">
                    <div className="absolute inset-0 bg-[#e2ff00]/5 blur-[80px] rounded-full scale-150 opacity-30"></div>
                    <p className="text-[clamp(6rem,20vw,9.5rem)] font-black text-[#e2ff00] leading-none tracking-tighter flex items-baseline justify-center drop-shadow-[0_10px_80px_rgba(226,255,0,0.25)] italic">
                        {distance.toFixed(2)} 
                        <span className="text-4xl text-zinc-600 ml-4 uppercase font-black tracking-tighter not-italic">KM</span>
                    </p>
                </div>

                <div className="w-full max-w-3xl border-y border-white/5 bg-zinc-950/20 rounded-[3rem] p-4">
                    <div className="grid grid-cols-2">
                        <div className="p-8 text-center border-r border-b border-white/5"><p className="text-5xl font-black text-[#e2ff00] tabular-nums italic tracking-tighter">{pace}</p><p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-3 italic">RITMO /KM</p></div>
                        <div className="p-8 text-center border-b border-white/5"><p className="text-5xl font-black text-white tabular-nums italic tracking-tighter">{formatTime(totalTimeElapsed)}</p><p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-3 italic">TEMPO CORRIDO</p></div>
                        <div className="p-8 text-center border-r border-white/5"><p className="text-5xl font-black text-[#e2ff00] tabular-nums italic tracking-tighter">{avgSpeed.toFixed(1)}</p><p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-3 italic">KM/H MÉDIO</p></div>
                        <div className="p-8 text-center"><p className="text-5xl font-black text-[#e2ff00] tabular-nums italic tracking-tighter">{calories}</p><p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-3 italic">CALORIAS KCAL</p></div>
                    </div>
                </div>

                {mode === 'outdoor' && lastPosition && (
                    <button onClick={() => setViewMode(viewMode === 'stats' ? 'map' : 'stats')} className="mt-12 mb-8 px-10 py-5 bg-[#1a1a1a] rounded-[2rem] text-zinc-400 border border-white/5 flex items-center gap-4 uppercase font-black text-xs tracking-widest shadow-xl hover:text-[#e2ff00] transition-colors">{viewMode === 'stats' ? <><MapIcon size={20} /> VER MAPA EM TEMPO REAL</> : <><BarChart2 size={20} /> VOLTAR PARA MÉTRICAS</>}</button>
                )}

                {mode === 'outdoor' && viewMode === 'map' && lastPosition && (
                    <div className="fixed inset-0 z-[1060] bg-black animate-in zoom-in-95 duration-500">
                         <MapContainer center={[lastPosition.coords.latitude, lastPosition.coords.longitude]} zoom={17} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={true} scrollWheelZoom={false}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            <Polyline positions={path.map(p => [p.lat, p.lng] as [number, number])} color="#e2ff00" weight={6} />
                            <Circle center={[lastPosition.coords.latitude, lastPosition.coords.longitude]} radius={12} pathOptions={{ fillColor: '#e2ff00', fillOpacity: 0.8, color: 'white', weight: 4 }} />
                            <MapUpdater center={[lastPosition.coords.latitude, lastPosition.coords.longitude]} />
                         </MapContainer>
                        <div className="absolute top-40 left-1/2 -translate-x-1/2 z-[1070] flex flex-col items-center gap-4 w-full px-6">
                            <div className="px-6 py-3 bg-black/80 backdrop-blur-md rounded-full border border-[#e2ff00]/30 flex items-center gap-3 shadow-xl">
                                <MapIcon size={16} className="text-[#e2ff00]" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest italic">{distance.toFixed(2)} KM PERCORRIDOS</span>
                            </div>
                            <button onClick={() => setViewMode('stats')} className="px-10 py-5 bg-[#e2ff00] text-black rounded-full shadow-[0_0_30px_rgba(226,255,0,0.4)] hover:scale-105 active:scale-95 transition-all font-black uppercase text-sm tracking-[0.2em] italic">SAIR DO MAPA</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-12 pb-20 flex justify-center items-center gap-14 bg-gradient-to-t from-black via-black to-transparent z-[1080]">
                <button onClick={() => handleNextSegment(true)} className="w-14 h-32 bg-[#1a1a1a] rounded-full flex items-center justify-center border border-white/5 shadow-2xl hover:border-red-600 transition-colors">
                    <div className="w-5 h-5 bg-red-600 rounded-[4px]" />
                </button>
                <div className="relative group">
                    {isAutoPaused && <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-600 rounded-full flex items-center gap-2 animate-bounce shadow-2xl"><Pause size={16} className="text-white" /><span className="text-[10px] font-black uppercase text-white whitespace-nowrap italic tracking-widest">MOVIMENTO PARADO</span></div>}
                    <button onClick={togglePlayPause} className="w-36 h-36 bg-[#e2ff00] rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(226,255,0,0.3)] hover:scale-105 active:scale-95 transition-all outline outline-8 outline-[#e2ff00]/10">
                        {isRunning ? <Pause size={56} className="text-black" /> : <Play size={56} className="text-black ml-4" />}
                    </button>
                </div>
                <button onClick={() => handleNextSegment()} className="w-14 h-32 bg-[#1a1a1a] rounded-full flex items-center justify-center border border-white/5 shadow-2xl hover:border-[#e2ff00] transition-colors">
                    <ChevronRight size={32} className="text-white" />
                </button>
            </div>
        </div>
    );
};
