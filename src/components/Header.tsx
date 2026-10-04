import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  GitPullRequest, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Activity, 
  GitBranch, 
  Wrench,
  Menu,
  Cpu
} from 'lucide-react';
import { Finding } from '../types/egc';
import { SidebarDrawer } from './SidebarDrawer';
import { CiRunnerMonitor } from './CiRunnerMonitor';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const owner = localStorage.getItem('egc_gh_owner') || 'mrcoantonioconceicao';
  const repo = localStorage.getItem('egc_gh_repo') || 'egc';
  const token = sessionStorage.getItem('egc_gh_token') || undefined;

  const total = findings.length;
  const concluidos = findings.filter(f => f.status === 'concluido').length;
  const ciVerde = findings.filter(f => f.status === 'ci_verde').length;
  const emAndamento = findings.filter(f => f.status === 'em_andamento').length;
  const pendentes = findings.filter(f => f.status === 'pendente').length;
  const resolvidos = concluidos + ciVerde;
  const percentResolvido = total > 0 ? Math.round((resolvidos / total) * 100) : 0;

  const tabs = [
    { id: 'matrix', label: 'Matriz dos 108 Achados', icon: Layers, badge: `${resolvidos}/${total}` },
    { id: 'autonomous', label: 'Orquestrador Autônomo', icon: Cpu, badge: 'AUTO' },
    { id: 'ast', label: 'Análise AST & Diffs', icon: Activity },
    { id: 'pr', label: 'Gerador de PR Atômica', icon: GitPullRequest },
    { id: 'build', label: 'Build & Vercel Fixes', icon: Wrench },
    { id: 'gate', label: 'Portão Local & CI Gate', icon: ShieldCheck },
    { id: 'decisions', label: 'Decisões D1-D32', icon: AlertTriangle, badge: '32' },
    { id: 'diary', label: 'Diário de Bordo', icon: CheckCircle2 },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-zinc-950 border-b border-zinc-800/80 sticky top-0 z-40 backdrop-blur-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Main Meta */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-base sm:text-lg shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
              EGC
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight font-mono">
                  Enterprise GraphRAG Context (EGC)
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                  Fase 13 &rarr; 0 (Bottom-Up)
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 hidden sm:block">
                Plano Cirúrgico dos 108 Achados - Decisões D1 a D32 - Um arquivo por PR em dívidas pesadas (C44)
              </p>
            </div>
          </div>

          {/* Desktop User Badge, CI-Runner Monitor & Gate */}
          <div className="hidden lg:flex items-center gap-2.5 text-xs">
            {/* Componente de Monitoramento 'CI-Runner Monitor' com Traffic Light Indicator */}
            <CiRunnerMonitor owner={owner} repo={repo} token={token} />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Autor:</span>
              <strong className="text-zinc-100 font-mono">Marco Antônio Conceição</strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Portão: VERDE</span>
            </div>
          </div>

          {/* Mobile Menu & CI-Runner Monitor */}
          <div className="flex lg:hidden items-center gap-2">
            <CiRunnerMonitor owner={owner} repo={repo} token={token} />

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition flex items-center gap-1.5 text-xs font-mono"
              aria-label="Abrir menu de navegação lateral"
            >
              <Menu className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-semibold">Menu</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Bar on Desktop/Tablet */}
        <div className="hidden sm:grid grid-cols-5 gap-2 mt-2.5 pt-2.5 border-t border-zinc-800/60 font-mono text-[11px]">
          <div className="bg-zinc-900/60 border border-zinc-800/60 px-2.5 py-1 rounded flex items-center justify-between">
            <span className="text-zinc-400">Total Auditado:</span>
            <span className="font-bold text-zinc-200">{total}</span>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-900/40 px-2.5 py-1 rounded flex items-center justify-between">
            <span className="text-emerald-400/80">CI Verde / Validado:</span>
            <span className="font-bold text-emerald-400">{ciVerde}</span>
          </div>
          <div className="bg-cyan-950/20 border border-cyan-900/40 px-2.5 py-1 rounded flex items-center justify-between">
            <span className="text-cyan-400/80">Concluído:</span>
            <span className="font-bold text-cyan-400">{concluidos}</span>
          </div>
          <div className="bg-amber-950/20 border border-amber-900/40 px-2.5 py-1 rounded flex items-center justify-between">
            <span className="text-amber-400/80">Em Andamento:</span>
            <span className="font-bold text-amber-400">{emAndamento}</span>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800/60 px-2.5 py-1 rounded flex items-center justify-between">
            <span className="text-zinc-500">Pendentes:</span>
            <span className="font-bold text-zinc-400">{pendentes}</span>
          </div>
        </div>
      </div>

      {/* Desktop Horizontal Navigation Bar */}
      <div className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-800/40">
        <nav className="flex space-x-1 py-1.5 overflow-x-auto scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
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

      {/* Mobile Navigation Drawer (Sidebar Drawer) */}
      <SidebarDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Navegação do Centro de Comando"
        subtitle="Módulos de Execução e Engenharia Cirúrgica"
        position="left"
        widthClass="max-w-xs"
      >
        <div className="space-y-4 font-mono text-xs">
          {/* Author Badge */}
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Autor Exclusivo:</span>
            <p className="font-bold text-zinc-100 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              Marco Antônio Conceição
            </p>
            <span className="text-[10px] text-emerald-400 font-semibold block">
              Portão Local: 100% VERDE
            </span>
          </div>

          {/* Module Links */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold px-1">
              Módulos do Sistema:
            </span>
            <div className="space-y-1 pt-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded text-xs font-semibold transition ${
                      isActive
                        ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                        : 'text-zinc-300 hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 font-mono">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics in Mobile Drawer */}
          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold px-1">
              Métricas Rápidas:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">Total:</span>
                <span className="font-bold text-zinc-200">{total} achados</span>
              </div>
              <div className="bg-emerald-950/30 p-2 rounded border border-emerald-900/60">
                <span className="text-emerald-400/80 block text-[10px]">CI Verde:</span>
                <span className="font-bold text-emerald-400">{ciVerde}</span>
              </div>
            </div>
          </div>
        </div>
      </SidebarDrawer>
    </header>
  );
};
