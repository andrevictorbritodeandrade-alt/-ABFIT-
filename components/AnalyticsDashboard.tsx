
import React, { useMemo } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle2, Activity, BarChart3, Calendar, Menu } from 'lucide-react';
import { Card, EliteFooter, HeaderTitle } from './Layout';
import { Student } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

interface AnalyticsProps {
  student: Student;
  onBack: () => void;
}

export function AnalyticsDashboard({ student, onBack }: AnalyticsProps) {
  // Garantia de dados iniciais para evitar crash
  const history = useMemo(() => student.workoutHistory || [], [student.workoutHistory]);
  const analytics = useMemo(() => student.analytics || { exercises: {}, sessionsCompleted: 0, streakDays: 0 }, [student.analytics]);

  // 1. Preparação dos dados de Exercícios (Gráfico de Barras)
  const exerciseData = useMemo(() => {
    const entries = Object.entries(analytics.exercises || {});
    if (entries.length === 0) return [];

    return entries.map(([name, stats]: [string, any]) => ({
      name: name.length > 12 ? name.substring(0, 10) + '..' : name,
      fullName: name,
      completed: stats.completed || 0,
      skipped: stats.skipped || 0,
    }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 6);
  }, [analytics.exercises]);

  // 2. Preparação da Frequência (Gráfico de Linha)
  const frequencyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('pt-BR'); // Formato "DD/MM/YYYY"
    });

    return last7Days.map(dateStr => {
      const count = history.filter(h => h.date === dateStr).length;
      return {
        date: dateStr.split('/')[0] + '/' + dateStr.split('/')[1], // Apenas "DD/MM" para o eixo X
        count: count
      };
    });
  }, [history]);

  // Componente de Estado Vazio
  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-10 opacity-20">
      <Activity size={40} className="mb-2" />
      <p className="text-[10px] font-black uppercase tracking-widest">{message}</p>
    </div>
  );

  return (
    <div className="p-6 pb-48 animate-in fade-in duration-500 text-white overflow-y-auto h-screen custom-scrollbar text-left bg-black">
      <header className="flex items-center gap-4 mb-10">
        <button 
          onClick={onBack} 
          className="p-2 bg-zinc-900 rounded-full shadow-lg text-white hover:bg-red-600 transition-colors"
        >
          <Menu size={20}/>
        </button>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
          <HeaderTitle text="Performance Analytics" />
        </h2>
      </header>

      {/* CARDS DE RESUMO RÁPIDO */}
      <div className="grid grid-cols-2 gap-4 mb-8">
         <Card className="p-5 bg-zinc-900/50 border-zinc-800 text-center">
            <h3 className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-2 italic">Total de Sessões</h3>
            <p className="text-4xl font-black text-white italic tracking-tighter">{history.length}</p>
         </Card>
         <Card className="p-5 bg-zinc-900/50 border-red-900/20 text-center">
            <h3 className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-2 italic">Streak (Dias)</h3>
            <div className="flex items-center justify-center gap-2">
               <p className="text-4xl font-black text-red-600 italic tracking-tighter">{analytics.streakDays || 0}</p>
               <TrendingUp size={16} className="text-red-600 animate-pulse"/>
            </div>
         </Card>
      </div>

      <div className="space-y-10">
         {/* GRÁFICO DE FREQUÊNCIA */}
         <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase text-zinc-400 tracking-widest pl-2 flex items-center gap-3 italic">
              <Calendar size={14} className="text-red-600"/> Consistência Semanal
            </h3>
            <div className="h-56 w-full bg-zinc-900/30 rounded-[2.5rem] border border-white/5 p-6 shadow-inner">
               {history.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={frequencyData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                       <XAxis 
                        dataKey="date" 
                        stroke="#444" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                        fontFamily="monospace"
                       />
                       <Tooltip 
                          contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}
                          itemStyle={{ color: '#dc2626' }}
                       />
                       <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#dc2626" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: '#dc2626', strokeWidth: 2, stroke: '#000' }} 
                        activeDot={{ r: 6, fill: '#fff' }} 
                       />
                    </LineChart>
                 </ResponsiveContainer>
               ) : <EmptyState message="Sem dados de frequência" />}
            </div>
         </div>

         {/* GRÁFICO DE EXERCÍCIOS */}
         <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase text-zinc-400 tracking-widest pl-2 flex items-center gap-3 italic">
              <BarChart3 size={14} className="text-red-600"/> Engajamento por Exercício
            </h3>
            <div className="h-64 w-full bg-zinc-900/30 rounded-[2.5rem] border border-white/5 p-6 shadow-inner">
               {exerciseData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={exerciseData}>
                       <XAxis type="number" hide />
                       <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#666" 
                        fontSize={9} 
                        width={70} 
                        tickLine={false} 
                        axisLine={false}
                        fontFamily="monospace"
                       />
                       <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}
                       />
                       <Bar dataKey="completed" fill="#dc2626" radius={[0, 4, 4, 0]} barSize={10} />
                    </BarChart>
                 </ResponsiveContainer>
               ) : <EmptyState message="Aguardando registros de treino" />}
            </div>
         </div>

         {/* ALERTAS DE SKIPS */}
         <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase text-zinc-400 tracking-widest pl-2 flex items-center gap-3 italic">
              <AlertTriangle size={14} className="text-amber-500"/> Fatores de Evasão
            </h3>
            <div className="bg-zinc-900/50 rounded-[2rem] p-6 border border-white/5">
               {exerciseData.filter(e => e.skipped > 0).length > 0 ? (
                 <div className="space-y-4">
                   {exerciseData.filter(e => e.skipped > 0).map((ex, i) => (
                     <div key={i} className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-black uppercase truncate max-w-[120px]">{ex.fullName}</span>
                        <div className="flex items-center gap-3">
                           <div className="w-20 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-500" 
                                style={{ width: `${Math.min((ex.skipped / ((ex.completed + ex.skipped) || 1)) * 100, 100)}%` }}
                              ></div>
                           </div>
                           <span className="text-[9px] font-black text-amber-500 uppercase">{ex.skipped} Skips</span>
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="flex items-center justify-center gap-3 py-4 opacity-40">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <p className="text-[9px] font-black uppercase tracking-widest">Aderência de 100% detectada</p>
                 </div>
               )}
            </div>
         </div>
      </div>
      <EliteFooter />
    </div>
  );
}
