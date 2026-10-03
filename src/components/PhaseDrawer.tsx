import React from 'react';
import { SidebarDrawer } from './SidebarDrawer';
import { PHASES_CONFIG } from '../data/initialData';
import { Finding, PhaseNumber } from '../types/egc';
import { Layers, CheckCircle2, ChevronRight, AlertOctagon } from 'lucide-react';

interface PhaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPhase: PhaseNumber | 'all';
  onSelectPhase: (phase: PhaseNumber | 'all') => void;
  findings: Finding[];
}

export const PhaseDrawer: React.FC<PhaseDrawerProps> = ({
  isOpen,
  onClose,
  selectedPhase,
  onSelectPhase,
  findings,
}) => {
  return (
    <SidebarDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Navegador de Fases EGC (13 a 0)"
      subtitle="Execução bottom-up cirúrgica com 100% da tela principal livre"
      position="right"
      widthClass="max-w-md"
    >
      <div className="space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
          <span>Selecione a fase para filtrar o trabalho:</span>
          <button
            onClick={() => {
              onSelectPhase('all');
              onClose();
            }}
            className={`px-2 py-0.5 rounded border text-[10px] font-bold transition ${
              selectedPhase === 'all'
                ? 'bg-emerald-600 text-zinc-950 border-emerald-500'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-zinc-100'
            }`}
          >
            Todas as Fases
          </button>
        </div>

        <div className="space-y-2">
          {PHASES_CONFIG.map((p) => {
            const phaseFindings = findings.filter((f) => f.phase === p.number);
            const count = phaseFindings.length;
            const completed = phaseFindings.filter((f) => f.status === 'ci_verde' || f.status === 'concluido').length;
            const hasHeavy = phaseFindings.some((f) => f.isHeavyDebt);
            const isSelected = selectedPhase === p.number;

            return (
              <div
                key={p.number}
                onClick={() => {
                  onSelectPhase(p.number);
                  onClose();
                }}
                className={`p-3 rounded-lg border cursor-pointer transition flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-zinc-800/90 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-100 text-xs">
                    {p.title}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {count > 0 && completed === count && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className="text-[10px] text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                      {count} {count === 1 ? 'achado' : 'achados'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 leading-normal">
                  {p.scope}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                      {p.criticality}
                    </span>
                    {hasHeavy && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-950/70 text-rose-300 border border-rose-800 font-bold flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3 text-rose-400" />
                        C44 (1 arq/PR)
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-bold">
                    <span>Selecionar</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SidebarDrawer>
  );
};
