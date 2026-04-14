import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, ChevronRight, Volume2, VolumeX, X, User, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    onFinish: (totalTime: number) => void;
}

type Accent = 'salvador' | 'rio';
type Gender = 'male' | 'female';

export function LiveRunSession({ segments, workoutTitle, onClose, onFinish }: LiveRunSessionProps) {
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [segmentTimeLeft, setSegmentTimeLeft] = useState(segments[0]?.duration || 0);
    const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [accent, setAccent] = useState<Accent>('rio');
    const [gender, setGender] = useState<Gender>('female');
    const [countdownValue, setCountdownValue] = useState<number | string | null>(null);
    const [showSettings, setShowSettings] = useState(true);
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const speechQueueRef = useRef<string[]>([]);
    const isSpeakingRef = useRef(false);

    const currentSegment = segments[currentSegmentIndex];
    const isFinished = currentSegmentIndex >= segments.length;

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

        // Adjust parameters for "natural" feel based on accent
        // User requested 1.25x speed
        utterance.rate = 1.25;

        if (accent === 'salvador') {
            utterance.pitch = gender === 'female' ? 1.2 : 0.9;
        } else {
            utterance.pitch = gender === 'female' ? 1.0 : 1.1;
        }

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
        if (isRunning && !isFinished && !countdownValue) {
            timerRef.current = setInterval(() => {
                setTotalTimeElapsed(prev => prev + 1);
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
    }, [isRunning, currentSegmentIndex, isFinished, soundEnabled, countdownValue]);

    const handleNextSegment = () => {
        const nextIndex = currentSegmentIndex + 1;
        if (nextIndex < segments.length) {
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
            onFinish(totalTimeElapsed);
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
            <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-8 text-left">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter mb-2">Configurar Voz</h2>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Escolha seu sotaque preferido</p>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setAccent('salvador')}
                                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${accent === 'salvador' ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}
                            >
                                <span className="text-2xl">🌴</span>
                                <span className="font-black uppercase tracking-widest text-xs text-white">Salvador</span>
                            </button>
                            <button 
                                onClick={() => setAccent('rio')}
                                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${accent === 'rio' ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}
                            >
                                <span className="text-2xl">⛰️</span>
                                <span className="font-black uppercase tracking-widest text-xs text-white">Rio de Janeiro</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setGender('female')}
                                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${gender === 'female' ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}
                            >
                                <User size={24} className={gender === 'female' ? 'text-red-600' : 'text-zinc-500'} />
                                <span className="font-black uppercase tracking-widest text-xs text-white">Mulher</span>
                            </button>
                            <button 
                                onClick={() => setGender('male')}
                                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${gender === 'male' ? 'border-red-600 bg-red-600/10' : 'border-zinc-800 bg-zinc-900'}`}
                            >
                                <Users size={24} className={gender === 'male' ? 'text-red-600' : 'text-zinc-500'} />
                                <span className="font-black uppercase tracking-widest text-xs text-white">Homem</span>
                            </button>
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

    const progress = currentSegment.duration > 0 
        ? ((currentSegment.duration - segmentTimeLeft) / currentSegment.duration) * 100 
        : 0;

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

            <header className="p-8 flex justify-between items-center border-b border-white/10 bg-black/50 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-red-600 italic">{workoutTitle}</h2>
                    <p className="text-lg text-zinc-400 font-bold">Tempo Total: {formatTime(totalTimeElapsed)}</p>
                </div>
                <div className="flex gap-6">
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-4 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors">
                        {soundEnabled ? <Volume2 size={32} /> : <VolumeX size={32} />}
                    </button>
                    <button onClick={onClose} className="p-4 bg-zinc-900 rounded-full text-zinc-400 hover:text-red-500 transition-colors">
                        <X size={32} />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                {/* Circular Progress */}
                <div className="relative w-[28rem] h-[28rem] flex items-center justify-center mb-12">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="224" cy="224" r="210" className="stroke-zinc-900" strokeWidth="16" fill="none" />
                        <circle 
                            cx="224" cy="224" r="210" 
                            className={`${getSegmentStroke(currentSegment.type)} transition-all duration-1000 ease-linear`} 
                            strokeWidth="16" fill="none" 
                            strokeDasharray={2 * Math.PI * 210}
                            strokeDashoffset={2 * Math.PI * 210 * (1 - progress / 100)}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="text-center z-10 flex flex-col items-center justify-center">
                        <p className={`text-[10rem] font-black tracking-tighter tabular-nums leading-none ${getSegmentColor(currentSegment.type)}`}>
                            {formatTime(segmentTimeLeft)}
                        </p>
                        <p className="text-3xl font-black uppercase tracking-widest text-white mt-4 italic">{currentSegment.title}</p>
                        {currentSegment.speed && (
                            <div className="mt-4 px-6 py-2 bg-white/10 rounded-full border border-white/10">
                                <p className="text-2xl font-black uppercase text-red-500 tracking-tighter">{currentSegment.speed} km/h</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Next Segment Preview */}
                {segments[currentSegmentIndex + 1] && (
                    <div className="bg-zinc-900/80 px-10 py-5 rounded-3xl border border-white/10 flex items-center gap-6 shadow-2xl">
                        <span className="text-sm uppercase font-black tracking-widest text-zinc-500">A seguir:</span>
                        <span className="text-2xl font-black italic text-zinc-200 uppercase tracking-tight">
                            {segments[currentSegmentIndex + 1].title} 
                            <span className="text-zinc-500 ml-3">({formatTime(segments[currentSegmentIndex + 1].duration)})</span>
                        </span>
                    </div>
                )}
            </div>

            <div className="p-12 pb-20 flex justify-center items-center gap-12 bg-gradient-to-t from-black to-transparent">
                <button 
                    onClick={togglePlayPause}
                    className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(220,38,38,0.5)] hover:scale-110 transition-transform active:scale-95"
                >
                    {isRunning ? <Pause size={56} className="fill-white" /> : <Play size={56} className="fill-white ml-2" />}
                </button>
                
                <button 
                    onClick={handleNextSegment}
                    className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10 hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 shadow-xl"
                    title="Pular Etapa"
                >
                    <ChevronRight size={48} className="text-zinc-400" />
                </button>
            </div>
        </div>
    );
}

