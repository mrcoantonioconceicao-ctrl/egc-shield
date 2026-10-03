import React from 'react';
import { ShieldCheck, User, GitPullRequest, CheckCircle2, AlertTriangle, Layers, Activity, GitBranch } from 'lucide-react';
import { Finding } from '../types/egc';

interface HeaderProps {
  findings: Finding[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentPhaseFilter: number | 'all';
  setCurrentPhaseFilter: (p: number | 'all') => void;
}

export const Header: React.FC<HeaderProps> = ({
  findings,
  activeTab,
  setActiveTab,
}) => {
  const total = findings.length;
  const concluidos = findings.filter(f => f.status === 'concluido').length;
  const ciVerde = findings.filter(f => f.status === 'ci_verde').length;
  const emAndamento = findings.filter(f => f.status === 'em_andamento').length;
  const pendentes = findings.filter(f => f.status === 'pendente').length;
  const resolvidos = concluidos + ciVerde;
  const percentResolvido = total > 0 ? Math.round((resolvidos / total) * 100) : 0;

  const tabs = [
    { id: 'matrix', label: 'Matriz dos 108 Achados', icon: Layers, badge: `${resolvidos}/${total}` },
    { id: 'github', label: 'GitHub Scanner (PAT)', icon: GitBranch },
    { id: 'ast', label: 'Análise AST & Diffs', icon: Activity },
    { id: 'pr', label: 'Gerador de PR Atômica', icon: GitPullRequest },
    { id: 'gate', label: 'Portão Local & CI Gate', icon: ShieldCheck },
    { id: 'decisions', label: 'Decisões D1-D32', icon: AlertTriangle, badge: '32' },
    { id: 'diary', label: 'Diário de Bordo', icon: CheckCircle2 },
  ];

  return (
    <header className="bg-zinc-950 border-b border-zinc-800/80 sticky top-0 z-40 backdrop-blur-md">
      {/* Top Banner: Repositório & Regras da Casa */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              EGC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-zinc-100 tracking-tight font-mono">
                  Enterprise GraphRAG Context (EGC)
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                  Fase 13 &rarr; Fase 0 (Bottom-Up)
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Plano Cirúrgico dos 108 Achados - Decisões D1 a D32 - Um arquivo por PR em dívidas pesadas (C44)
              </p>
            </div>
          </div>

          {/* User Badge & CI Gate status */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Autor Exclusivo:</span>
              <strong className="text-zinc-100 font-mono">Marco Antônio Conceição</strong>
              <span className="text-[10px] text-zinc-500 font-mono">(Zero coautoria IA)</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Portão Local: VERDE</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
              <span>Progresso Real:</span>
              <span className="text-emerald-400 font-bold">{percentResolvido}%</span>
              <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${percentResolvido}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Counter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-zinc-800/60 font-mono text-xs">
          <div className="bg-zinc-900/60 border border-zinc-800/60 px-3 py-1.5 rounded flex items-center justify-between">
            <span className="text-zinc-400">Total Auditado:</span>
            <span className="font-bold text-zinc-200">{total}</span>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-900/40 px-3 py-1.5 rounded flex items-center justify-between">
            <span className="text-emerald-400/80">CI Verde / Validado:</span>
            <span className="font-bold text-emerald-400">{ciVerde}</span>
          </div>
          <div className="bg-cyan-950/20 border border-cyan-900/40 px-3 py-1.5 rounded flex items-center justify-between">
            <span className="text-cyan-400/80">Concluído:</span>
            <span className="font-bold text-cyan-400">{concluidos}</span>
          </div>
          <div className="bg-amber-950/20 border border-amber-900/40 px-3 py-1.5 rounded flex items-center justify-between">
            <span className="text-amber-400/80">Em Andamento:</span>
            <span className="font-bold text-amber-400">{emAndamento}</span>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800/60 px-3 py-1.5 rounded flex items-center justify-between">
            <span className="text-zinc-500">Pendentes:</span>
            <span className="font-bold text-zinc-400">{pendentes}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
