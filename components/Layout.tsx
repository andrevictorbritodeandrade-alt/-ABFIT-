
import React, { useState, useEffect } from 'react';
import { 
  CloudRain, Sun, RefreshCw, Bell, Dumbbell, Wifi, WifiOff, 
  Mail, Phone, Loader2, MapPin, MessageCircle, Menu, X, 
  LayoutGrid, Bot, Settings2, User, Layout, Brain, Ruler, 
  Footprints, BarChart3, Info 
} from 'lucide-react';
import { AppNotification } from '../types';

export function HeaderTitle({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  
  if (words.length === 1) {
    const word = words[0];
    if (word.length <= 2) return <span className="text-red-600 uppercase italic tracking-tighter">{word}</span>;
    const splitIndex = word.length > 3 ? word.length - 3 : word.length - 2;
    return (
      <span className="tracking-tighter uppercase italic">
        {word.substring(0, splitIndex)}
        <span className="text-red-600">{word.substring(splitIndex)}</span>
      </span>
    );
  }
  
  const lastWord = words.pop();
  return (
    <span className="tracking-tighter uppercase italic">
      {words.join(' ')} <span className="text-red-600">{lastWord}</span>
    </span>
  );
}

export function Logo({ size = "text-6xl", subSize = "text-[10px]", collapsed = false }: { size?: string, subSize?: string, collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="p-2 bg-zinc-900 rounded-xl border border-white/5 shadow-2xl">
        <Dumbbell className="text-red-600 w-5 h-5" />
      </div>
    );
  }
  return (
    <div className="text-center group select-none flex flex-col items-center justify-center">
      <div className="p-2 bg-zinc-900 rounded-[1.2rem] border border-white/5 shadow-2xl group-hover:scale-110 transition-transform duration-500 mb-3">
        <Dumbbell className="text-red-600 w-5 h-5 drop-shadow-[0_0_10px_rgba(220,38,38,0.4)]" />
      </div>
      <h1 className={`${size} font-black italic mb-0 transform -skew-x-12 tracking-tighter drop-shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all text-white uppercase leading-[0.9]`}>
        AB<span className="text-red-600">FIT</span>
      </h1>
      <p className={`${subSize} text-zinc-400 tracking-[0.25em] uppercase font-bold leading-none mt-4 opacity-80`}>Assessoria em Treinamentos Físicos</p>
    </div>
  );
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

export function SideNav({ 
  isOpen, 
  onClose, 
  activeView, 
  onNavigate,
  isProfessor = false
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  activeView: string, 
  onNavigate: (view: string) => void,
  isProfessor?: boolean
}) {
  // Mapeamento de cores idêntico ao Dashboard em App.tsx
  const studentItems: NavItem[] = [
    { id: 'DASHBOARD', label: 'Home Dashboard', icon: LayoutGrid, color: 'zinc' },
    { id: 'FEED', label: 'Feed Performance', icon: Layout, color: 'red' },
    { id: 'WORKOUTS', label: 'Planilhas Ativas', icon: Dumbbell, color: 'orange' },
    { id: 'STUDENT_PERIODIZATION', label: 'Periodização PhD', icon: Brain, color: 'indigo' },
    { id: 'STUDENT_ASSESSMENT', label: 'Avaliação Física', icon: Ruler, color: 'emerald' },
    { id: 'RUNTRACK_STUDENT', label: 'RunTrack Elite', icon: Footprints, color: 'rose' },
    { id: 'ANALYTICS', label: 'Análise de Dados', icon: BarChart3, color: 'blue' },
    { id: 'COACH_AI', label: 'Elite Coach AI', icon: Bot, color: 'red' },
    { id: 'ABOUT_ABFIT', label: 'Sobre a ABFIT', icon: Info, color: 'zinc' },
    { id: 'SETTINGS', label: 'Configurações', icon: Settings2, color: 'zinc' },
  ];

  const professorItems: NavItem[] = [
    { id: 'PROFESSOR_DASH', label: 'Gestão de Alunos', icon: LayoutGrid, color: 'zinc' },
    { id: 'COACH_AI', label: 'Assistente IA', icon: Bot, color: 'red' },
    { id: 'SETTINGS', label: 'Configurações', icon: Settings2, color: 'zinc' },
  ];

  const items = isProfessor ? professorItems : studentItems;

  const getColorClasses = (color: string, isActive: boolean) => {
    if (!isActive) return 'text-zinc-500 hover:text-white hover:bg-white/5';
    
    switch(color) {
      case 'red': return 'bg-red-600/10 text-white';
      case 'orange': return 'bg-orange-600/10 text-white';
      case 'indigo': return 'bg-indigo-600/10 text-white';
      case 'emerald': return 'bg-emerald-600/10 text-white';
      case 'rose': return 'bg-rose-600/10 text-white';
      case 'blue': return 'bg-blue-600/10 text-white';
      default: return 'bg-zinc-800 text-white';
    }
  };

  const getIconColor = (color: string, isActive: boolean) => {
    if (!isActive) return 'group-hover:text-white transition-colors';
    
    switch(color) {
      case 'red': return 'text-red-600';
      case 'orange': return 'text-orange-600';
      case 'indigo': return 'text-indigo-600';
      case 'emerald': return 'text-emerald-600';
      case 'rose': return 'text-rose-600';
      case 'blue': return 'text-blue-600';
      default: return 'text-white';
    }
  };

  const getIndicatorColor = (color: string) => {
    switch(color) {
      case 'red': return 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)]';
      case 'orange': return 'bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.8)]';
      case 'indigo': return 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.8)]';
      case 'emerald': return 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.8)]';
      case 'rose': return 'bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.8)]';
      case 'blue': return 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)]';
      default: return 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]';
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-[80] bg-black/80 backdrop-blur-md transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside 
        className={`fixed top-0 left-0 z-[90] h-screen bg-zinc-950 border-r border-white/5 transition-transform duration-500 transform lg:translate-x-0 w-[280px] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-10">
            <Logo size="text-2xl" subSize="text-[8px]" />
            <button onClick={onClose} className="lg:hidden p-2 text-zinc-500 hover:text-white bg-zinc-900 rounded-full border border-white/5">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
            {items.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group relative overflow-hidden ${getColorClasses(item.color, isActive)}`}
                >
                  {isActive && <div className={`absolute left-0 top-0 bottom-0 w-1 ${getIndicatorColor(item.color)}`} />}
                  <item.icon size={18} className={getIconColor(item.color, isActive)} />
                  <span className="text-[10px] font-black uppercase italic tracking-widest">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
             <div className="flex items-center gap-4 px-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden shadow-inner">
                   <User className="text-zinc-700" size={18} />
                </div>
                <div className="flex flex-col">
                   <span className="text-[9px] font-black uppercase text-white italic leading-none mb-1">Elite Member</span>
                   <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest leading-none">Status: Ativo</span>
                </div>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function Card({ children, className = "", onClick }: { children?: React.ReactNode, className?: string, onClick?: any, key?: React.Key }) {
  return <div onClick={onClick} className={`bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-xl overflow-hidden transition-all ${className}`}>{children}</div>;
}

export function BackgroundWrapper({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden font-sans text-left">
      <div className="fixed inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-20 grayscale scale-110 blur-sm pointer-events-none"></div>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none"></div>
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

export function GlobalSyncIndicator({ isSyncing }: { isSyncing: boolean }) {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  return (
    <div className="fixed bottom-10 right-6 z-[100] animate-in fade-in slide-in-from-right-4 duration-1000">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full border shadow-2xl backdrop-blur-md transition-all duration-500 ${isSyncing ? 'bg-orange-600/10 border-orange-600/30' : 'bg-emerald-600/10 border-emerald-600/30'}`}>
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}></div>
          {isSyncing && <div className="absolute inset-0 w-2 h-2 rounded-full bg-orange-500 animate-ping opacity-75"></div>}
          {!online && <WifiOff size={10} className="absolute -top-3 -right-3 text-red-600" />}
        </div>
      </div>
    </div>
  );
}

export function NotificationBadge({ notifications, onClick }: { notifications: AppNotification[], onClick?: () => void }) {
  const unreadCount = notifications.filter(n => !n.read).length;
  if (unreadCount === 0) return null;

  return (
    <button onClick={onClick} className="relative p-2 bg-zinc-900 border border-white/5 rounded-full text-zinc-400 hover:text-red-600 transition-colors">
      <Bell size={20} />
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-[10px] font-black text-white flex items-center justify-center border-2 border-black animate-bounce">
        {unreadCount}
      </span>
    </button>
  );
}

export function WeatherWidget() {
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading' });

  useEffect(() => {
    const timer = setTimeout(() => {
      setWeather({ temp: '28°', condition: 'Ensolarado' });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-zinc-900/40 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-sm">
      <Sun className="text-orange-500" size={16} />
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-white italic">{weather.temp}</span>
        <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">{weather.condition}</span>
      </div>
    </div>
  );
}

export function EliteFooter() {
  return (
    <footer className="w-full py-12 mt-auto text-center border-t border-white/5">
      <div className="flex justify-center gap-6 mb-8">
        <button className="p-3 bg-zinc-900 rounded-2xl text-zinc-600 hover:text-red-600 transition-all border border-white/5">
          <Mail size={18} />
        </button>
        <button className="p-3 bg-zinc-900 rounded-2xl text-zinc-600 hover:text-emerald-600 transition-all border border-white/5">
          <MessageCircle size={18} />
        </button>
        <button className="p-3 bg-zinc-900 rounded-2xl text-zinc-600 hover:text-blue-600 transition-all border border-white/5">
          <Phone size={18} />
        </button>
      </div>
      <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.5em] mb-2">ABFIT Elite Performance v2.0</p>
      <p className="text-[7px] font-bold text-zinc-800 uppercase tracking-widest">© 2025 PhD André Brito. All Rights Reserved.</p>
    </footer>
  );
}
