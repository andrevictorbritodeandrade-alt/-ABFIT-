import React, { useState } from 'react';
import { Card } from './Layout';
import { ArrowLeft, Monitor, RefreshCw, X, ChevronRight, Activity, Bone, Droplets, Target, Weight, HeartPulse } from 'lucide-react';
import { PhysicalAssessment } from '../types';

export function BioimpedanceView({ assessment, allAssessments = [], onBack }: { assessment: PhysicalAssessment, allAssessments?: PhysicalAssessment[], onBack: () => void }) {
  const [tab, setTab] = useState<'METRICAS' | 'ANALISE' | 'COMPARATIVO'>('METRICAS');

  const getColorClass = (color: string) => {
    switch (color) {
      case 'red': return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'yellow': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      case 'green': return 'text-green-500 border-green-500/30 bg-green-500/10';
      case 'blue': return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
      case 'orange': return 'text-orange-500 border-orange-500/30 bg-orange-500/10';
      default: return 'text-zinc-400 border-zinc-700 bg-zinc-800';
    }
  };

  const sortedAssessments = [...allAssessments].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const currentIndex = sortedAssessments.findIndex(a => a.id === assessment.id);
  const previousAssessment = currentIndex >= 0 && currentIndex + 1 < sortedAssessments.length ? sortedAssessments[currentIndex + 1] : null;

  const renderComparativeRow = (label: string, field: string, alternativeField: string, unit: string) => {
    let currValRaw = assessment[field]?.value ?? assessment[field] ?? assessment[alternativeField]?.value ?? assessment[alternativeField];
    let prevValRaw = previousAssessment ? (previousAssessment[field]?.value ?? previousAssessment[field] ?? previousAssessment[alternativeField]?.value ?? previousAssessment[alternativeField]) : null;
    
    const currVal = parseFloat(currValRaw) || 0;
    const prevVal = parseFloat(prevValRaw) || 0;
    
    if (!previousAssessment || prevValRaw == null || isNaN(prevVal)) {
      return (
        <div className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
           <div>
             <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">{label}</span><br />
             <span className="text-zinc-600 text-xs font-bold italic">Sem dados</span>
           </div>
           <span className="text-zinc-600">---</span>
        </div>
      );
    }

    const diff = currVal - prevVal;
    const isPositive = diff > 0;
    const percentDiff = prevVal > 0 ? (diff / prevVal) * 100 : 0;
    
    let colorClass = 'text-zinc-400';
    if (field === 'peso' || field === 'gordura' || field === 'gorduraVisceral' || field === 'obesidade' || alternativeField === 'bio_percentual_gordura') {
        colorClass = isPositive ? 'text-red-500' : 'text-emerald-500';
    } else {
        colorClass = isPositive ? 'text-emerald-500' : 'text-red-500';
    }
    
    return (
        <div className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
           <div>
             <span className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">{label}</span><br />
             <span className="text-white flex items-baseline gap-1 font-black italic tracking-tighter text-sm">
                 {currVal.toFixed(1)} <span className="text-[9px] tracking-widest text-zinc-500 lowercase">{unit}</span>
             </span>
           </div>
           <div className={`text-right ${colorClass}`}>
             <div className="flex items-center justify-end gap-1">
               <span className="font-black italic text-[13px] tracking-tighter">{isPositive ? '+' : ''}{diff.toFixed(2)} {unit}</span>
               {isPositive ? <Activity size={12} className="mb-0.5" /> : <Activity size={12} className="mb-0.5 rotate-180" />}
             </div>
             <span className="text-[8px] font-black uppercase tracking-widest opacity-80 block mt-0.5">{isPositive ? '+' : ''}{percentDiff.toFixed(1)}% vs anterior</span>
           </div>
        </div>
    );
  };

  const getMetricIcon = (key: string) => {
    if (key.includes('Agua') || key.includes('agua') || key.includes('Água') || key.includes('água')) return <Droplets size={16} className="text-blue-400" />;
    if (key.includes('Ossos') || key.includes('ossos')) return <Bone size={16} className="text-zinc-400" />;
    if (key.includes('Metabolismo') || key.includes('Proteina') || key.includes('lbm') || key.includes('Idade')) return <Activity size={16} className="text-green-400" />;
    if (key.includes('Gordura') || key.includes('gordura') || key.includes('Obesidade')) return <HeartPulse size={16} className="text-red-400" />;
    return <Weight size={16} className="text-zinc-400" />;
  };

  const renderMetric = (label: string, data: any, unit: string) => {
    if (!data) return null;
    const value = typeof data === 'object' ? data.value : data;
    const status = typeof data === 'object' ? data.status : null;
    const color = typeof data === 'object' ? data.color : 'default';

    return (
      <div className="flex justify-between items-center py-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-900/50 transition-colors px-2 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0">
            {getMetricIcon(label)}
          </div>
          <span className="text-xs font-black text-zinc-300 italic uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-lg font-black text-white italic tracking-tighter shrink-0">{value}<span className="text-[10px] text-zinc-500 ml-0.5">{unit}</span></span>
          {status && (
            <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest border ${getColorClass(color)}`}>
              {status}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md z-40 border-b border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 bg-zinc-900 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg active:scale-95">
              <X size={18} className="text-white" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-lg font-black italic uppercase tracking-tighter leading-none">AVALIAÇÃO FISICA</h2>
              <span className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em]">Bioimpedância</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-zinc-500">
             <Monitor size={18} className="hover:text-white cursor-pointer transition-colors" />
             <RefreshCw size={18} className="hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-900 rounded-3xl p-1 border border-zinc-800">
          <button 
            onClick={() => setTab('METRICAS')}
            className={`flex-1 py-3 px-4 rounded-full text-xs font-black uppercase tracking-widest transition-all ${tab === 'METRICAS' ? 'bg-blue-600 shadow-lg shadow-blue-500/20 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            Métricas
          </button>
          <button 
            onClick={() => setTab('ANALISE')}
            className={`flex-1 py-3 px-4 rounded-full text-xs font-black uppercase tracking-widest transition-all ${tab === 'ANALISE' ? 'bg-blue-600 shadow-lg shadow-blue-500/20 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            Análise
          </button>
          <button 
            onClick={() => setTab('COMPARATIVO')}
            className={`flex-1 py-3 px-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${tab === 'COMPARATIVO' ? 'bg-blue-600 shadow-lg shadow-blue-500/20 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            Comparativo
          </button>
        </div>
      </div>

      <div className="p-6 pb-24">
        {tab === 'METRICAS' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Métricas corporais</h3>
              <span className="bg-red-500/10 text-red-500 border border-red-500/30 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest mr-2">Obeso</span>
            </div>

            <div className="flex flex-col items-center justify-center py-6 bg-zinc-900/40 rounded-[2rem] border border-zinc-800">
               <h1 className="text-6xl font-black italic tracking-tighter text-white drop-shadow-lg">{assessment.peso}</h1>
               <span className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-1">Kilogramas</span>
               <span className="text-[10px] text-zinc-600 font-bold mt-2">{new Date(assessment.data).toLocaleDateString('pt-BR')}</span>
            </div>

            <Card className="p-4 bg-zinc-900/60 border-zinc-800 rounded-3xl shadow-xl flex flex-col pt-2">
               {renderMetric('Peso', assessment.peso, 'Kg')}
               {renderMetric('IMC', assessment.imc, '')}
               {renderMetric('Gordura (%)', assessment.gordura, '%')}
               {renderMetric('Peso da gordura', assessment.pesoGordura, 'Kg')}
               {renderMetric('Percentual da massa muscular esquelética (%)', assessment.percentualMassaMuscularEsqueletica, '%')}
               {renderMetric('Peso da massa muscular esquelética', assessment.pesoMassaMuscularEsqueletica, 'Kg')}
               {renderMetric('Registro de massa muscular (%)', assessment.registroMassaMuscular, '%')}
               {renderMetric('Peso da massa muscular', assessment.pesoMassaMuscular, 'Kg')}
               {renderMetric('Água (%)', assessment.aguaPercentual, '%')}
               {renderMetric('Peso da água', assessment.pesoAgua, 'Kg')}
               {renderMetric('Gordura visceral', assessment.gorduraVisceral, '')}
               {renderMetric('Ossos', assessment.ossos, 'Kg')}
               {renderMetric('Metabolismo', assessment.metabolismo, '')}
               {renderMetric('Proteína (%)', assessment.proteina, '%')}
               {renderMetric('Obesidade (%)', assessment.obesidade, '%')}
               {renderMetric('Idade metabólica', assessment.idadeMetabolica, '')}
               {renderMetric('LBM', assessment.lbm, 'Kg')}
               {renderMetric('Idade real', assessment.idadeReal, '')}
               {renderMetric('Altura', assessment.altura, 'cm')}
            </Card>

            {/* Antropometria Section */}
            {(assessment.torax || assessment.dobraAbdominal) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <h3 className="text-xl font-black italic uppercase tracking-tighter mt-10">Perímetros e Dobras</h3>
                <Card className="p-4 bg-zinc-900/60 border-zinc-800 rounded-3xl shadow-xl flex flex-col pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <div className="space-y-0 text-left">
                       <h4 className="text-[10px] font-black uppercase text-red-600 tracking-[0.3em] mt-4 mb-2 px-2">Perímetros (cm)</h4>
                       {renderMetric('Tórax', assessment.torax, 'cm')}
                       {renderMetric('Cintura', assessment.cintura, 'cm')}
                       {renderMetric('Abdômen', assessment.abdomen, 'cm')}
                       {renderMetric('Quadril', assessment.quadril, 'cm')}
                       {renderMetric('Coxa Pr. D/E', `${assessment.coxaProximalDireita}/${assessment.coxaProximalEsquerda}`, 'cm')}
                       {renderMetric('Coxa Di. D/E', `${assessment.coxaDistalDireita}/${assessment.coxaDistalEsquerda}`, 'cm')}
                       {renderMetric('Panturrilha D/E', `${assessment.panturrilhaDireita}/${assessment.panturrilhaEsquerda}`, 'cm')}
                       {renderMetric('Braço D/E', `${assessment.bracoDireito}/${assessment.bracoEsquerdo}`, 'cm')}
                       {renderMetric('Antebraço D/E', `${assessment.antebracoDireito}/${assessment.antebracoEsquerdo}`, 'cm')}
                    </div>
                    <div className="space-y-0 text-left">
                       <h4 className="text-[10px] font-black uppercase text-red-600 tracking-[0.3em] mt-4 mb-2 px-2">Dobras Cutâneas (mm)</h4>
                       {renderMetric('Subescapular', assessment.dobraSubescapular, 'mm')}
                       {renderMetric('Abdominal', assessment.dobraAbdominal, 'mm')}
                       {renderMetric('Coxa', assessment.dobraCoxa, 'mm')}
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {tab === 'ANALISE' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <section>
              <h3 className="text-lg font-black italic uppercase tracking-tighter mb-4 text-white">Análise da Composição Corporal</h3>
              <Card className="p-5 bg-zinc-900/60 border-zinc-800 rounded-3xl space-y-5">
                {[
                  { label: 'Água', value: assessment.analiseComposicao?.agua, color: 'blue' },
                  { label: 'Gordura', value: assessment.analiseComposicao?.gordura, color: 'red' },
                  { label: 'Proteína', value: assessment.analiseComposicao?.proteina, color: 'green' },
                  { label: 'Ossos', value: assessment.analiseComposicao?.ossos, color: 'green' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black italic uppercase tracking-widest px-1">
                      <span className="text-zinc-400">{item.label}</span>
                      <span className={`text-${item.color}-500`}>{item.value}</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                      <div className={`h-full bg-${item.color}-500 rounded-full`} style={{ width: item.value === 'Baixo' ? '30%' : item.value === 'Obeso' ? '90%' : '60%' }} />
                    </div>
                  </div>
                ))}
              </Card>
            </section>

            <section>
              <h3 className="text-lg font-black italic uppercase tracking-tighter mb-4 text-white mt-10">Análise do Tipo de Corpo</h3>
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-3xl space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {['Atleta', 'Obeso Muscular', 'Obesidade', 'Muscular', 'Saudável', 'Acima do Peso', 'Magro', 'Magro Esq.', 'Oculta'].map(type => (
                    <div key={type} className={`p-4 rounded-2xl flex items-center justify-center text-[9px] font-black uppercase text-center border transition-all leading-tight tracking-widest ${assessment.analiseTipoCorpo?.tipo === type ? 'border-red-500/50 bg-red-500/10 text-red-500 shadow-lg shadow-red-500/20' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}>
                      {type}
                    </div>
                  ))}
                </div>
                {assessment.analiseTipoCorpo?.descricao && (
                   <div className="mt-4 p-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-[11px] font-bold text-zinc-400 leading-relaxed italic border-l-4 border-l-red-500 tracking-wide text-center">
                     {assessment.analiseTipoCorpo.descricao}
                   </div>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-black italic uppercase tracking-tighter mb-4 text-white mt-10">Dicas de Controle de Peso</h3>
              <Card className="p-5 bg-zinc-900/60 border-zinc-800 rounded-3xl space-y-6">
                <div>
                  <div className="flex justify-between items-center text-[10px] font-black italic uppercase tracking-widest mb-3 px-1">
                    <span className="text-zinc-500">Peso (Kg)</span>
                    <span className="flex items-center gap-1 text-blue-500">
                      {assessment.dicasControlePeso?.pesoDiff > 0 ? '+' : ''}{assessment.dicasControlePeso?.pesoDiff}
                    </span>
                  </div>
                  <div className="relative pt-2 pb-6 px-1">
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '70%' }} />
                    </div>
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/60 select-none">Peso ideal {assessment.dicasControlePeso?.pesoIdeal}kg</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-6 border-t border-zinc-800/50">
                  <div className="flex justify-between items-center p-4 bg-zinc-950 border border-zinc-800/50 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest italic text-zinc-400">Massa muscular</span>
                    <span className="font-black text-blue-500 text-sm italic">+{assessment.dicasControlePeso?.massaMuscularDiff}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-zinc-950 border border-zinc-800/50 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest italic text-zinc-400">Gordura</span>
                    <span className="font-black text-blue-500 text-sm italic">{assessment.dicasControlePeso?.gorduraDiff}</span>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        )}

        {tab === 'COMPARATIVO' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
             {previousAssessment ? (
               <div className="space-y-6">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-500 tracking-widest bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                    <Activity size={14} />
                    <span>Comparativo: {new Date(previousAssessment.data).toLocaleDateString('pt-BR')} &rarr; {new Date(assessment.data).toLocaleDateString('pt-BR')}</span>
                 </div>
                 
                 <Card className="p-4 bg-zinc-900/60 border-zinc-800 rounded-3xl shadow-xl flex flex-col pt-2">
                    {renderComparativeRow('Peso', 'peso', 'peso', 'Kg')}
                    {renderComparativeRow('Gordura Corporal', 'gordura', 'bio_percentual_gordura', '%')}
                    {renderComparativeRow('Massa Muscular', 'pesoMassaMuscular', 'pesoMassaMuscular', 'Kg')}
                    {renderComparativeRow('Água', 'aguaPercentual', 'aguaPercentual', '%')}
                    {renderComparativeRow('Gordura Visceral', 'gorduraVisceral', 'gorduraVisceral', '')}
                    {renderComparativeRow('Metabolismo', 'metabolismo', 'metabolismo', 'kcal')}
                 </Card>

                 {assessment.veredictoMestre && (
                   <Card className="p-5 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-600/20 border-0">
                     <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-90">Veredito do Mestre</h4>
                     <p className="text-sm font-medium leading-relaxed">{assessment.veredictoMestre}</p>
                   </Card>
                 )}
               </div>
             ) : (
               <div className="text-center py-12 px-6 border-2 border-dashed border-zinc-800 rounded-[3rem]">
                 <p className="text-[13px] font-black italic uppercase tracking-widest text-zinc-600">Sem Avaliação Anterior</p>
                 <p className="text-xs text-zinc-500 mt-2">Esta é a primeira avaliação bioimpedanciométrica registrada.</p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
