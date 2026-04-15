import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, ChevronRight, Volume2, VolumeX, X, User, Users, Map as MapIcon, BarChart2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Polyline, useMap, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

export function LiveRunSession({ segments, workoutTitle, onClose, onFinish, studentWeight, studentHeight }: LiveRunSessionProps) {
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
    const [isAutoPaused, setIsAutoPaused] = useState(false);
    const [lastPosition, setLastPosition] = useState<GeolocationPosition | null>(null);
    const [path, setPath] = useState<[number, number][]>([]);
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const speechQueueRef = useRef<string[]>([]);
    const isSpeakingRef = useRef(false);
    const watchIdRef = useRef<number | null>(null);

    const currentSegment = segments[currentSegmentIndex];
    const isFinished = currentSegmentIndex >= segments.length;

    const isWatch = React.useMemo(() => {
        if (typeof window === 'undefined') return false;
        const ua = navigator.userAgent.toLowerCase();
        const isWearOS = ua.includes('wear os') || ua.includes('wearos');
        const isWatchUA = ua.includes('watch') || ua.includes('samsung');
        const isSmallScreen = window.innerWidth < 500 && window.innerHeight < 500;
        return (isWearOS || isWatchUA) && isSmallScreen;
    }, []);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
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
        // Simple formula: Calories = Weight (kg) * Distance (km) * 1.036
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
                            
                            // Only count if distance is significant (filter jitter)
                            if (d > 0.002) {
                                setDistance(prev => {
                                    const newDist = prev + d;
                                    updateCalories(newDist);
                                    
                                    // Update Steps
                                    const strideLength = (height / 100) * 0.414;
                                    setSteps(Math.round((newDist * 1000) / strideLength));
                                    
                                    return newDist;
                                });
                                setIsAutoPaused(false);
                                setPath(prev => [...prev, [latitude, longitude]]);
                            } else if (position.coords.speed !== null && position.coords.speed < 0.5) {
                                // Speed is in m/s. 0.5 m/s is ~1.8 km/h
                                setIsAutoPaused(true);
                            }

                            // Update Elevation
                            if (position.coords.altitude !== null && lastPosition.coords.altitude !== null) {
                                const diff = position.coords.altitude - lastPosition.coords.altitude;
                                if (diff > 0.5) {
                                    setElevationGain(prev => prev + diff);
                                }
                            }
                        } else {
                            setPath([[latitude, longitude]]);
                        }
                        
                        setLastPosition(position);
                        
                        // Update Pace & Speed
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
        } else {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        }

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [mode, isRunning, isFinished, lastPosition]);

    const getSegmentColor = (type: string) => {
        if (type === 'stimulus' || type === 'continuous') return 'text-red-600';
        return 'text-emerald-500';
    };

    const getSegmentStroke = (type: string) => {
        if (type === 'stimulus' || type === 'continuous') return 'stroke-red-600';
        return 'stroke-emerald-500';
    };

    const speak = (text: string, interrupt = false) => {
        if (!soundEnabled) return;
        if (!('speechSynthesis' in window)) return;

        if (interrupt) {
            window.speechSynthesis.cancel();
            speechQueueRef.current = [];
            isSpeakingRef.current = false;
        }

        // Avoid repeating the same phrase if it's already in queue or being spoken
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
        
        // Try to find a voice that matches gender
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => {
            const name = v.name.toLowerCase();
            if (gender === 'female') return name.includes('maria') || name.includes('luciana') || name.includes('female');
            return name.includes('daniel') || name.includes('male');
        });

        if (preferredVoice) utterance.voice = preferredVoice;

        // Adjust parameters for "natural" feel
        // User requested 1.25x speed
        utterance.rate = 1.25;
        utterance.pitch = gender === 'female' ? 1.1 : 1.0;

        utterance.onend = () => {
            isSpeakingRef.current = false;
            processSpeechQueue();
        };

        utterance.onerror = () => {
            isSpeakingRef.current = false;
            processSpeechQueue();
        };

        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        // Load voices
        window.speechSynthesis.getVoices();
    }, []);

    useEffect(() => {
        if (isRunning && !isFinished && !countdownValue && !isAutoPaused) {
            timerRef.current = setInterval(() => {
                setTotalTimeElapsed(prev => {
                    const next = prev + 1;
                    // Update Avg Speed
                    if (next > 0 && distance > 0) {
                        setAvgSpeed((distance / (next / 3600)));
                    }
                    return next;
                });
                setSegmentTimeLeft(prev => {
                    const newTime = prev - 1;
                    
                    if (newTime === 5) {
                        speak("Cinco. Quatro. Três. Dois. Um.");
                    }
                    
                    if (newTime <= 0) {
                        handleNextSegment();
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, currentSegmentIndex, isFinished, soundEnabled, countdownValue, isAutoPaused]);

    const handleNextSegment = (forceFinish = false) => {
        const nextIndex = currentSegmentIndex + 1;
        if (nextIndex < segments.length && !forceFinish) {
            const nextSegment = segments[nextIndex];
            
            // Show countdown for transitions to stimulus or from warmup
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
        } else {
            speak("Treino concluído! Parabéns!");
            setIsRunning(false);
            onFinish(totalTimeElapsed, {
                distance: distance.toFixed(2),
                calories: calories,
                avgPace: pace,
                duration: formatTime(totalTimeElapsed),
                path: path
            });
        }
    };

    const announceSegment = (segment: WorkoutSegment) => {
        if (segment.type === 'stimulus' || segment.type === 'continuous') {
            speak("Vamos correr!", true);
        } else if (segment.type === 'recovery') {
            speak("Recuperação", true);
        } else if (segment.type === 'cooldown') {
            speak("Desaquecimento", true);
        }
    };

    const startCountdown = (callback: () => void) => {
        setIsRunning(false);
        let count = 3;
        setCountdownValue(count);
        speak("Três", true);

        const interval = setInterval(() => {
            count--;
            if (count === 2) {
                setCountdownValue(count);
                speak("Dois");
            } else if (count === 1) {
                setCountdownValue(count);
                speak("Um");
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
        startCountdown(() => {
            announceSegment(segments[0]);
        });
    };

    const togglePlayPause = () => {
        setIsRunning(!isRunning);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (showSettings) {
        return (
            <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-8 text-left overflow-y-auto">
                <div className="w-full max-w-md space-y-8 py-12">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter mb-2">Configurar Treino</h2>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Personalize sua experiência</p>
                    </div>

                    <div className="space-y-8">
                        {/* Voice Selection */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Voz do Feedback</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setGender('female')}
                                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${gender === 'female' ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}
                                >
                                    <User size={24} className={gender === 'female' ? 'text-red-600' : 'text-zinc-500'} />
                                    <span className="font-black uppercase tracking-widest text-[10px] text-white">Feminina</span>
                                </button>
                                <button 
                                    onClick={() => setGender('male')}
                                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${gender === 'male' ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}
                                >
                                    <Users size={24} className={gender === 'male' ? 'text-red-600' : 'text-zinc-500'} />
                                    <span className="font-black uppercase tracking-widest text-[10px] text-white">Masculina</span>
                                </button>
                            </div>
                        </div>

                        {/* Mode Selection */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Ambiente</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setMode('indoor')}
                                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${mode === 'indoor' ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === 'indoor' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                                        <Play size={16} />
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-[10px] text-white">Esteira (Indoor)</span>
                                </button>
                                <button 
                                    onClick={() => setMode('outdoor')}
                                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${mode === 'outdoor' ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === 'outdoor' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                                        <Users size={16} />
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-[10px] text-white">Rua (GPS)</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={startWorkout}
                        className="w-full py-6 bg-red-600 text-white rounded-3xl font-black italic uppercase tracking-widest text-xl shadow-xl shadow-red-600/20 active:scale-95 transition-all"
                    >
                        Começar Treino
                    </button>
                </div>
            </div>
        );
    }

    if (isWatch) {
        return (
            <div className="fixed inset-0 z-[200] bg-black text-white flex flex-col items-center justify-center p-2 rounded-full border-2 border-red-600 overflow-hidden animate-in fade-in duration-300">
                {isFinished ? (
                    <div className="text-center">
                        <h2 className="text-lg font-black italic text-emerald-500 uppercase">Fim!</h2>
                        <p className="text-xs font-bold">{distance.toFixed(2)} km</p>
                        <button onClick={onClose} className="mt-2 px-4 py-1 bg-red-600 rounded-full text-[10px] font-black uppercase">OK</button>
                    </div>
                ) : showSettings ? (
                    <div className="text-center space-y-2">
                        <p className="text-[10px] font-black uppercase text-red-600">Configurar</p>
                        <div className="flex justify-center gap-2">
                            <button onClick={() => setMode('indoor')} className={`p-2 rounded-full ${mode === 'indoor' ? 'bg-red-600' : 'bg-zinc-900'}`}><Users size={12}/></button>
                            <button onClick={() => setMode('outdoor')} className={`p-2 rounded-full ${mode === 'outdoor' ? 'bg-red-600' : 'bg-zinc-900'}`}><MapIcon size={12}/></button>
                        </div>
                        <button onClick={startWorkout} className="w-full py-2 bg-red-600 rounded-full text-[10px] font-black uppercase">Start</button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full relative">
                        <div className="text-center mb-1">
                            <p className="text-[10px] font-black text-zinc-500 uppercase">{currentSegment.title}</p>
                            <p className="text-4xl font-black italic text-[#e2ff00] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                                {mode === 'outdoor' ? distance.toFixed(2) : formatTime(segmentTimeLeft)}
                            </p>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase">{mode === 'outdoor' ? 'KM' : 'Tempo'}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="text-center">
                                <p className="text-[8px] text-zinc-500 font-black">PACE</p>
                                <p className="text-xs font-black italic">{pace}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] text-zinc-500 font-black">TIME</p>
                                <p className="text-xs font-black italic">{formatTime(totalTimeElapsed)}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={togglePlayPause} className="p-2 bg-red-600 rounded-full shadow-lg">
                                {isRunning ? <Pause size={14} fill="white"/> : <Play size={14} fill="white"/>}
                            </button>
                            <button onClick={() => handleNextSegment()} className="p-2 bg-zinc-900 rounded-full border border-white/10">
                                <ChevronRight size={14}/>
                            </button>
                            <button 
                                onClick={() => handleNextSegment(true)} 
                                className="p-2 bg-emerald-600 rounded-full border border-white/10"
                                title="Finalizar"
                            >
                                <Check size={14}/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="fixed inset-0 z-[200] bg-zinc-950 text-white flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                <h2 className="text-6xl font-black italic uppercase mb-4 text-emerald-500 tracking-tighter">Treino Concluído!</h2>
                <p className="text-2xl text-zinc-400 mb-12 font-bold">Tempo total: {formatTime(totalTimeElapsed)}</p>
                <button onClick={onClose} className="px-12 py-6 bg-red-600 rounded-full font-black uppercase tracking-widest text-2xl shadow-2xl shadow-red-600/40">
                    Fechar
                </button>
            </div>
        );
    }

    if (!currentSegment) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950 text-white flex flex-col animate-in slide-in-from-bottom-full duration-300 overflow-hidden">
            <AnimatePresence>
                {countdownValue && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 2 }}
                        className="fixed inset-0 z-[400] bg-black/90 flex items-center justify-center pointer-events-none"
                    >
                        <span className="text-[20rem] font-black italic text-red-600 tracking-tighter drop-shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                            {countdownValue}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="p-6 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-md z-50">
                <div className="flex flex-col">
                    <h2 className="text-lg font-black uppercase tracking-tighter text-red-600 italic leading-none mb-1">{workoutTitle}</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Tempo: {formatTime(totalTimeElapsed)}</span>
                        {mode === 'outdoor' && (
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{distance.toFixed(2)} km</span>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    {mode === 'outdoor' && (
                        <button 
                            onClick={() => setViewMode(viewMode === 'stats' ? 'map' : 'stats')}
                            className="p-3 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors border border-white/5"
                        >
                            {viewMode === 'stats' ? <MapIcon size={20} /> : <BarChart2 size={20} />}
                        </button>
                    )}
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-3 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors border border-white/5">
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <button onClick={onClose} className="p-3 bg-zinc-900 rounded-full text-zinc-400 hover:text-red-500 transition-colors border border-white/5">
                        <X size={20} />
                    </button>
                </div>
            </header>

            <div className="flex-1 relative flex flex-col">
                {/* Map View */}
                {mode === 'outdoor' && viewMode === 'map' && lastPosition && (
                    <div className="absolute inset-0 z-0">
                        <MapContainer 
                            center={[lastPosition.coords.latitude, lastPosition.coords.longitude]} 
                            zoom={16} 
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            <Polyline positions={path} color="#dc2626" weight={5} opacity={0.8} />
                            <Circle 
                                center={[lastPosition.coords.latitude, lastPosition.coords.longitude]} 
                                radius={10} 
                                pathOptions={{ fillColor: '#dc2626', fillOpacity: 1, color: 'white', weight: 2 }} 
                            />
                            <MapUpdater center={[lastPosition.coords.latitude, lastPosition.coords.longitude]} />
                        </MapContainer>
                        
                        {/* Overlay Stats on Map */}
                        <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-4 z-[1000]">
                            <div className="bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                                <span className="text-[8px] font-black uppercase text-zinc-500 block mb-1 tracking-widest">Ritmo</span>
                                <span className="text-xl font-black text-white italic">{pace}</span>
                            </div>
                            <div className="bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                                <span className="text-[8px] font-black uppercase text-zinc-500 block mb-1 tracking-widest">Distância</span>
                                <span className="text-xl font-black text-white italic">{distance.toFixed(2)}</span>
                            </div>
                            <div className="bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                                <span className="text-[8px] font-black uppercase text-zinc-500 block mb-1 tracking-widest">Calorias</span>
                                <span className="text-xl font-black text-white italic">{calories}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats View */}
                <div className={`flex-1 flex flex-col items-center justify-center p-4 md:p-8 transition-opacity duration-300 ${viewMode === 'map' ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'} overflow-y-auto custom-scrollbar`}>
                    <div className="text-center flex flex-col items-center justify-center mb-8 md:mb-16">
                        <p className="text-[8rem] md:text-[14rem] lg:text-[18rem] font-black tracking-tighter tabular-nums leading-none text-[#e2ff00] drop-shadow-[10px_10px_0px_rgba(255,255,255,1)]">
                            {mode === 'outdoor' ? distance.toFixed(2) : formatTime(segmentTimeLeft)}
                        </p>
                        <p className="text-xl md:text-3xl font-black uppercase tracking-widest text-white mt-2 italic drop-shadow-[2px_2px_0px_rgba(255,255,255,1)]">
                            {mode === 'outdoor' ? 'Quilômetros' : currentSegment.title}
                        </p>
                    </div>

                    {/* Stats Grid - Expanded for new metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-4xl mb-8 border-t border-white/5 pt-8">
                        <div className="text-center">
                            <span className="text-2xl md:text-4xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">{pace}</span>
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 block mt-1">Ritmo Médio</span>
                        </div>
                        <div className="text-center">
                            <span className="text-2xl md:text-4xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">{formatTime(totalTimeElapsed)}</span>
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 block mt-1">Tempo</span>
                        </div>
                        <div className="text-center">
                            <span className="text-2xl md:text-4xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">{avgSpeed.toFixed(1)}</span>
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 block mt-1">Vel. Média (km/h)</span>
                        </div>
                        <div className="text-center">
                            <span className="text-2xl md:text-4xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">{currentSpeed.toFixed(1)}</span>
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 block mt-1">Vel. Atual (km/h)</span>
                        </div>
                        <div className="text-center">
                            <span className="text-2xl md:text-4xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">{calories}</span>
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 block mt-1">Calorias</span>
                        </div>
                        <div className="text-center">
                            <span className="text-2xl md:text-4xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">{elevationGain.toFixed(0)}m</span>
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 block mt-1">Altimetria</span>
                        </div>
                        <div className="text-center col-span-2 md:col-span-1">
                            <span className="text-2xl md:text-4xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">{steps.toLocaleString()}</span>
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 block mt-1">Passos (Est.)</span>
                        </div>
                    </div>

                    {/* Next Segment Preview */}
                    {segments[currentSegmentIndex + 1] && (
                        <div className="bg-zinc-900 px-10 py-5 rounded-3xl border border-white/5 flex items-center gap-6 shadow-xl">
                            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">A seguir:</span>
                            <span className="text-2xl font-black italic text-white uppercase tracking-tight">
                                {segments[currentSegmentIndex + 1].title} 
                                <span className="text-zinc-500 ml-3 text-lg">({formatTime(segments[currentSegmentIndex + 1].duration)})</span>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="p-8 md:p-12 pb-16 md:pb-20 flex justify-center items-center gap-8 md:gap-12 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent z-50">
                <div className="relative">
                    {isAutoPaused && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-600 rounded-full flex items-center gap-2 animate-bounce shadow-lg shadow-red-600/40">
                            <Pause size={14} className="text-white" />
                            <span className="text-[10px] font-black uppercase text-white whitespace-nowrap">Auto-Pausa</span>
                        </div>
                    )}
                    <button 
                        onClick={togglePlayPause}
                        className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95 z-10 relative"
                    >
                        {isRunning ? <Pause size={56} className="fill-black" /> : <Play size={56} className="fill-black ml-2" />}
                    </button>
                </div>
                
                <button 
                    onClick={() => handleNextSegment()}
                    className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10 hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 shadow-lg"
                    title="Pular Etapa"
                >
                    <ChevronRight size={48} className="text-white" />
                </button>
            </div>
        </div>
    );
}

