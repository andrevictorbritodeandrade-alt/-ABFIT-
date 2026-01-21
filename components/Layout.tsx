
import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, RefreshCw, Bell, Dumbbell, Wifi, WifiOff, Mail, Phone, Loader2, MapPin, MessageCircle } from 'lucide-react';
import { AppNotification } from '../types';

export function HeaderTitle({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length <= 1) return <span className="tracking-tighter">{text}</span>;
  
  return (
    <span className="tracking-tighter">
      {words[0]} <span className="text-red-600">{words.slice(1).join(' ')}</span>
    </span>
  );
}

export function Logo({ size = "text-6xl", subSize = "text-[10px]" }: { size?: string, subSize?: string }) {
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

export function Card({ children, className = "", onClick }: { children?: React.ReactNode, className?: string, key?: any, onClick?: any }) {
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

export function EliteFooter() {
  return (
    <footer className="mt-20 pb-20 text-center animate-in fade-in duration-1000 px-6">
      <div className="max-w-[250px] mx-auto h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent mb-8"></div>
      
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
            ABFIT Elite v2.5.0
          </p>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            Sistema de Alta Performance • Empresa Registrada
          </p>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 p-5 rounded-[2rem] space-y-2">
          <p className="text-[10px] font-black uppercase tracking-tight text-white italic">
            Desenvolvido por André Brito
          </p>
          <p className="text-[9px] font-bold uppercase text-zinc-400 leading-relaxed tracking-tight">
            Prof. de Ed. Física • <span className="text-red-500">CREF 039443 G/RJ</span><br/>
            Especialista em Desportos de Campo e de Quadra (UFRJ)<br/>
            Mestre em Ciências do Exercício e do Esporte (UERJ)
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 pt-2">
          <a href="mailto:britodeandrade@gmail.com" className="flex items-center gap-2 text-[9px] font-black text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.2em]">
            <Mail size={10} className="text-red-600" /> britodeandrade@gmail.com
          </a>
          <a 
            href="https://wa.me/5521994527694" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 text-[9px] font-black text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
          >
            <MessageCircle size={10} className="text-red-600" /> +55 21 99452-7694
          </a>
        </div>
      </div>
    </footer>
  );
}

export function GlobalSyncIndicator({ isSyncing = false }: { isSyncing?: boolean }) {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 pointer-events-none">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-xl transition-all duration-300 shadow-lg ${
        !online ? 'bg-red-950/40 border-red-500/30' : 
        isSyncing ? 'bg-orange-950/60 border-orange-500/50 shadow-orange-500/40 scale-105' : 
        'bg-green-950/40 border-green-500/50 shadow-green-500/20'
      }`}>
        <div className="relative">
          <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
            !online ? 'bg-red-500' : 
            isSyncing ? 'bg-orange-500 animate-pulse' : 
            'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.9)]'
          }`}></div>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-white">
          {!online ? 'OFFLINE' : isSyncing ? 'SYNC' : 'ATIVO'}
        </span>
        {isSyncing ? (
          <RefreshCw size={11} className="text-orange-500 animate-spin" />
        ) : online ? (
          <Wifi size={11} className="text-green-400" />
        ) : (
          <WifiOff size={11} className="text-red-500" />
        )}
      </div>
    </div>
  );
}

export function NotificationBadge({ notifications = [], onClick }: { notifications?: AppNotification[], onClick?: () => void }) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <button onClick={onClick} className="relative p-2 bg-zinc-900 rounded-full border border-white/10 hover:bg-zinc-800 transition-colors shadow-xl group">
      <Bell size={16} className={unreadCount > 0 ? "text-red-500 swing-animation" : "text-zinc-500 group-hover:text-white"} />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[8px] font-black text-white border-2 border-black animate-bounce shadow-lg shadow-red-600/50">
          {unreadCount}
        </div>
      )}
      <style>{`
        @keyframes swing { 0%,100% { transform: rotate(0deg); } 20% { transform: rotate(15deg); } 40% { transform: rotate(-10deg); } 60% { transform: rotate(5deg); } 80% { transform: rotate(-5deg); } }
        .swing-animation { animation: swing 2s infinite ease-in-out; transform-origin: top center; }
      `}</style>
    </button>
  );
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const getLocationAndWeather = () => {
      if (!navigator.geolocation) {
        setError(true);
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,precipitation_probability&timezone=auto`
            );
            
            if (!response.ok) throw new Error('Weather API failed');
            
            const data = await response.json();
            setWeather({
              temp: Math.round(data.current.temperature_2m),
              feels: Math.round(data.current.apparent_temperature),
              rain: data.current.precipitation_probability
            });
            setLoading(false);
          } catch (e) {
            setError(true);
            setLoading(false);
          }
        },
        () => {
          setError(true);
          setLoading(false);
        }
      );
    };

    getLocationAndWeather();
    const interval = setInterval(getLocationAndWeather, 3600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2 flex items-center gap-2 animate-pulse shadow-lg">
      <Loader2 size={12} className="animate-spin text-zinc-600" />
      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.1em]">Buscando...</span>
    </div>
  );

  if (error) return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-lg">
      <MapPin size={12} className="text-zinc-700" />
      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.1em]">Local</span>
    </div>
  );

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 shadow-lg">
      <div className="flex items-center gap-2">
        <Sun className="text-amber-500" size={14} />
        <div>
          <p className="text-[10px] font-black leading-none text-white">{weather.temp}°</p>
          <p className="text-[7px] text-zinc-500 uppercase font-bold tracking-[0.1em] mt-0.5">Clima</p>
        </div>
      </div>
      <div className="h-4 w-px bg-white/10"></div>
      <div>
        <p className="text-[10px] font-black leading-none text-white">{weather.feels}°</p>
        <p className="text-[7px] text-zinc-500 uppercase font-bold tracking-[0.1em] mt-0.5">Sensa.</p>
      </div>
      <div className="h-4 w-px bg-white/10"></div>
      <div className="flex items-center gap-1.5">
        <CloudRain size={12} className={weather.rain > 30 ? "text-blue-400" : "text-zinc-500"} />
        <div>
          <p className="text-[10px] font-black leading-none text-white">{weather.rain}%</p>
          <p className="text-[7px] text-zinc-500 uppercase font-bold tracking-[0.1em] mt-0.5">Chuva</p>
        </div>
      </div>
    </div>
  );
}
