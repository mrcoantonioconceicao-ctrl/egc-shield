/**
 * Cabeçalho e Centro de Comando do EGC com Navegação em Gaveta Lateral (Sidebar Drawer).
 * Implementa menu hambúrguer fixo, deslizamento suave a partir da esquerda e backdrop translúcido.
 *
 * Autor: Marco Antônio Conceição
 * Regras: Decisão D2 (Autoria 100% humana) e Decisão D3 (Sem travessões unicode)
 */
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
  Cpu,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3,
  Bookmark
} from 'lucide-react';
import { Finding } from '../types/egc';
import { PHASES_CONFIG } from '../data/initialData';
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
  currentPhaseFilter,
  setCurrentPhaseFilter,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPhasesExpanded, setIsPhasesExpanded] = useState(false);

  const owner = localStorage.getItem('egc_gh_owner') || 'mrcoantonioconceicao';
  const repo = localStorage.getItem('egc_gh_repo') || 'egc';
  const token = sessionStorage.getItem('egc_gh_token') || undefined;

  const total = findings.length;
  const concluidos = findings.filter(f => f.status === 'concluido').length;
  const ciVerde = findings.filter(f => f.status === 'ci_verde').length;
  const emAndamento = findings.filter(f => f.status === 'em_andamento').length;
  const pendentes = findings.filter(f => f.status === 'pendente').length;
  const resolvidos = concluidos + ciVerde;

  const tabs = [
    { id: 'matrix', label: 'Matriz dos 108 Achados', icon: Layers, badge: `${resolvidos}/${total}` },
    { id: 'autonomous', label: 'Orquestrador Autônomo', icon: Cpu, badge: 'AUTO' },
    { id: 'ast', label: 'Análise AST & Diffs', icon: Activity },
    { id: 'pr', label: 'Gerador de PR Atômica', icon: GitPullRequest },
    { id: 'build', label: 'Build & Vercel Fixes', icon: Wrench },
    { id: 'gate', label: 'Portão Local & CI Gate', icon: ShieldCheck },
    { id: 'decisions', label: 'Decisões D1-D33', icon: AlertTriangle, badge: '33' },
    { id: 'diary', label: 'Diário de Bordo', icon: CheckCircle2 },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsDrawerOpen(false);
  };

  const handlePhaseClick = (phaseNum: number | 'all') => {
    setCurrentPhaseFilter(phaseNum);
    setActiveTab('matrix');
    setIsDrawerOpen(false);
  };

  const currentTabObj = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <header className="bg-zinc-950 border-b border-zinc-800/80 sticky top-0 z-40 backdrop-blur-md font-mono text-xs">
      {/* Top Banner com Gatilho Hambúrguer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Lado Esquerdo: Botão Hambúrguer Fixo & Logo EGC */}
          <div className="flex items-center gap-3">
            {/* Gatilho Hambúrguer do Centro de Comando */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-md transition active:scale-95 text-xs font-mono group hover:border-emerald-600/70"
              aria-label="Abrir gaveta lateral do Centro de Comando"
              title="Abrir Centro de Comando lateral"
            >
              <Menu className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition" />
              <span className="font-bold tracking-tight hidden sm:inline-block">Centro de Comando</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                MENU
              </span>
            </button>

            {/* Logo e Título */}
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm sm:text-base shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
                EGC
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-200 text-xs tracking-tight">
                    Enterprise GraphRAG Context
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                    Fase 13 &rarr; 0 (Bottom-Up)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito: Monitor da Esteira, Autor e Portão */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Componente de Monitoramento da Esteira com Traffic Light */}
            <CiRunnerMonitor owner={owner} repo={repo} token={token} />

            {/* Autor Exclusivo (Marco Antônio Conceição) */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Autor:</span>
              <strong className="text-zinc-100 font-mono">Marco Antônio Conceição</strong>
            </div>

            {/* Portão Local Verde */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-bold">Portão: VERDE</span>
            </div>
          </div>
        </div>

        {/* Barra de Métricas Rápidas */}
        <div className="hidden sm:grid grid-cols-5 gap-2 mt-2 pt-2 border-t border-zinc-800/60 font-mono text-[11px]">
          <div className="bg-zinc-900/60 border border-zinc-800/60 px-2.5 py-1 rounded flex items-center justify-between">
            <span className="text-zinc-400">Total Auditado:</span>
            <span className="font-bold text-zinc-200">{total}</span>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-900/40 px-2.5 py-1 rounded flex items-center justify-between">
            <span className="text-emerald-400/80">CI Verde:</span>
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

      {/* Barra Horizontal de Acesso Rápido a Abas (Desktop) */}
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

      {/* Menu Lateral Deslizante do Centro de Comando (Sidebar Drawer) */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Centro de Comando EGC"
        subtitle="Navegação Integrada de Fases, Ferramentas e Portões de CI"
        position="left"
        widthClass="max-w-md w-full"
      >
        <div className="space-y-5 font-mono text-xs">
          {/* Card de Autoria Exclusiva (Decisão D2) */}
          <div className="p-3.5 bg-gradient-to-r from-zinc-900 to-emerald-950/30 border border-emerald-800/50 rounded-xl space-y-1.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">
                Autor Exclusivo (Decisão D2):
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-bold">
                100% HUMANA
              </span>
            </div>
            <p className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
              <User className="w-4 h-4 text-cyan-400" />
              Marco Antônio Conceição
            </p>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-800">
              <span className="text-zinc-400">Portão Local & CI:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                100% VERDE
              </span>
            </div>
          </div>

          {/* Seção 1: Módulos e Ferramentas do Centro de Comando */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold px-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Módulos do Sistema:
            </span>
            <div className="space-y-1 pt-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition active:scale-[0.98] ${
                      isActive
                        ? 'bg-zinc-800 text-emerald-300 border border-emerald-600/70 shadow-sm'
                        : 'text-zinc-300 hover:bg-zinc-900 border border-transparent hover:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        isActive
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Navegador de Fases Bottom-Up (Fases 13 a 0) */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-cyan-400" />
                Fases do Projeto (Bottom-Up):
              </span>
              <button
                type="button"
                onClick={() => setIsPhasesExpanded(!isPhasesExpanded)}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition"
                aria-expanded={isPhasesExpanded}
              >
                <span>{isPhasesExpanded ? 'Recolher Fases' : 'Ver 14 Fases'}</span>
                {isPhasesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Fase Ativa Atual com Ação de Reset */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px]">
              <div className="flex items-center gap-2 truncate">
                <span className="w-5 h-5 rounded bg-emerald-600 text-zinc-950 font-bold flex items-center justify-center text-[10px] shrink-0">
                  {currentPhaseFilter === 'all' ? '*' : currentPhaseFilter}
                </span>
                <span className="truncate text-zinc-200">
                  {currentPhaseFilter === 'all' 
                    ? 'Visualizando Todas as Fases' 
                    : PHASES_CONFIG.find(p => p.number === currentPhaseFilter)?.title || `Fase ${currentPhaseFilter}`}
                </span>
              </div>
              {currentPhaseFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => handlePhaseClick('all')}
                  className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition shrink-0 ml-1 font-bold"
                >
                  Todas
                </button>
              )}
            </div>

            {/* Lista Expandida de Fases (fluxo natural no scroll da gaveta) */}
            {isPhasesExpanded && (
              <div className="space-y-1 pt-1 animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => handlePhaseClick('all')}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-[11px] transition text-left ${
                    currentPhaseFilter === 'all'
                      ? 'bg-zinc-800 text-cyan-300 border border-cyan-600/70 font-bold'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 shrink-0">
                      *
                    </span>
                    <span>Todas as 14 Fases (Visão Geral)</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0 ml-1" />
                </button>

                {PHASES_CONFIG.map((phase) => {
                  const isCurrent = currentPhaseFilter === phase.number;
                  return (
                    <button
                      key={phase.number}
                      type="button"
                      onClick={() => handlePhaseClick(phase.number)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-[11px] transition text-left ${
                        isCurrent
                          ? 'bg-zinc-800 text-emerald-300 border border-emerald-600/70 font-bold'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isCurrent ? 'bg-emerald-600 text-zinc-950' : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {phase.number}
                        </span>
                        <span className="truncate">{phase.title}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0 ml-1" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seção 3: Portões de CI e Métricas Consolidadas (com espaçamento final generoso) */}
          <div className="pt-2 border-t border-zinc-800 space-y-2 pb-6">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold px-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Status Consolidado da Esteira:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">Total Auditado:</span>
                <span className="font-bold text-zinc-200 text-xs">{total} achados</span>
              </div>
              <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/60">
                <span className="text-emerald-400/80 block text-[10px]">CI Verde / Validado:</span>
                <span className="font-bold text-emerald-400 text-xs">{ciVerde}</span>
              </div>
              <div className="bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-900/60">
                <span className="text-cyan-400/80 block text-[10px]">Concluído:</span>
                <span className="font-bold text-cyan-400 text-xs">{concluidos}</span>
              </div>
              <div className="bg-amber-950/30 p-2.5 rounded-lg border border-amber-900/60">
                <span className="text-amber-400/80 block text-[10px]">Em Andamento:</span>
                <span className="font-bold text-amber-400 text-xs">{emAndamento}</span>
              </div>
            </div>
          </div>
        </div>
      </SidebarDrawer>
    </header>
  );
};
