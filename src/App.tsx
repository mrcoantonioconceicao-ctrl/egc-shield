import React, { useState, useEffect } from 'react';
import { Finding, FindingStatus, DiaryEntry, PhaseNumber } from './types/egc';
import { INITIAL_FINDINGS, INITIAL_DIARY } from './data/initialData';
import { Header } from './components/Header';
import { PermanentGitHubBar } from './components/PermanentGitHubBar';
import { PhaseDrawer } from './components/PhaseDrawer';
import { PhaseMatrix } from './components/PhaseMatrix';
import { AstDiffAnalyzer } from './components/AstDiffAnalyzer';
import { PrGenerator } from './components/PrGenerator';
import { LocalGateChecklist } from './components/LocalGateChecklist';
import { DecisionsReference } from './components/DecisionsReference';
import { EngineeringDiary } from './components/EngineeringDiary';
import { BuildConflictSolver } from './components/BuildConflictSolver';
import { GitHubAuthAlert } from './components/GitHubAuthAlert';
import { AutonomousOrchestrator } from './components/AutonomousOrchestrator';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('matrix');
  const [phaseFilter, setPhaseFilter] = useState<PhaseNumber | 'all'>(13);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [astBufferOverride, setAstBufferOverride] = useState<string | null>(null);

  // State to control Phase Drawer (Sidebar Drawer)
  const [isPhaseDrawerOpen, setIsPhaseDrawerOpen] = useState(false);

  // Real findings state with localStorage persistence - NO FAKE DATA
  const [findings, setFindings] = useState<Finding[]>(() => {
    try {
      const saved = localStorage.getItem('egc_findings_real_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_FINDINGS;
  });

  // Real diary state with localStorage persistence - starts clean
  const [diary, setDiary] = useState<DiaryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('egc_diary_real_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_DIARY;
  });

  useEffect(() => {
    try {
      localStorage.setItem('egc_findings_real_v2', JSON.stringify(findings));
    } catch {
      // ignore
    }
  }, [findings]);

  useEffect(() => {
    try {
      localStorage.setItem('egc_diary_real_v2', JSON.stringify(diary));
    } catch {
      // ignore
    }
  }, [diary]);

  const handleUpdateStatus = (id: string, newStatus: FindingStatus) => {
    setFindings(prev => prev.map(f => {
      if (f.id === id) {
        return {
          ...f,
          status: newStatus,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return f;
    }));
  };

  const handleSelectForPr = (finding: Finding) => {
    setSelectedFinding(finding);
    setActiveTab('pr');
  };

  const handleInspectAst = (finding: Finding) => {
    setSelectedFinding(finding);
    setActiveTab('ast');
  };

  const handleImportFindings = (imported: Finding[]) => {
    setFindings(imported);
  };

  const handleAddSingleFinding = (finding: Finding) => {
    setFindings(prev => [finding, ...prev]);
  };

  const handleClearAllFindings = () => {
    setFindings([]);
  };

  const handleFileLoadedFromGitHub = (filePath: string, content: string, findingCode?: string) => {
    const matched = findings.find(f => f.targetFile === filePath || f.code === findingCode);
    if (matched) {
      setSelectedFinding(matched);
    } else {
      setSelectedFinding({
        id: findingCode || 'ACH-LIVE',
        code: findingCode || 'AUDIT-LIVE',
        title: `Inspeção de ${filePath.split('/').pop()}`,
        description: `Arquivo extraído diretamente do GitHub: ${filePath}`,
        phase: 13,
        phaseName: 'Fase 13',
        targetFile: filePath,
        severity: 'alto',
        status: 'em_andamento',
        module: filePath.split('/')[1] || 'Core',
        isHeavyDebt: filePath.includes('pipelineCore') || (findingCode === 'C44'),
        decisionRef: filePath.includes('pipelineCore') ? 'D4' : 'D1',
        updatedAt: new Date().toISOString().split('T')[0],
      });
    }
    setAstBufferOverride(content);
    setActiveTab('ast');
  };

  const handleAddDiaryEntry = (entryData: Omit<DiaryEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]} BRT`;
    const newEntry: DiaryEntry = {
      ...entryData,
      id: `entry-${Date.now()}`,
      timestamp: formattedDate,
    };
    setDiary(prev => [newEntry, ...prev]);
  };

  const handleMarkFindingAsGreen = (findingId: string) => {
    handleUpdateStatus(findingId, 'ci_verde');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Header com Navegação e Telemetria */}
      <Header
        findings={findings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentPhaseFilter={phaseFilter}
        setCurrentPhaseFilter={(p) => setPhaseFilter(p as PhaseNumber | 'all')}
      />

      {/* Interceptor e Alerta Global de Autenticação GitHub (Bad credentials) */}
      <GitHubAuthAlert />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* 1. BLOCO DO TOKEN GITHUB: PERMANENTEMENTE FIXO E VISÍVEL NO TOPO (DIRETRIZ 1 E 2) */}
        <PermanentGitHubBar
          findings={findings}
          onOpenPhaseDrawer={() => setIsPhaseDrawerOpen(true)}
          currentPhase={phaseFilter}
          onScanComplete={(updatedFindings, logMessage) => {
            setFindings(updatedFindings);
            handleAddDiaryEntry({
              phase: 13,
              targetFile: 'Repositório EGC (Tree Global)',
              findingId: 'VARREDURA-GLOBAL',
              actionTaken: 'Varredura global automatizada disparada via token clássico do GitHub.',
              astAnalysisSummary: logMessage,
              ciGateProof: 'EXIT_CODE 0 - Árvore de arquivos mapeada e achados sincronizados da Fase 13 até a Fase 0.',
              prLinkOrRef: 'Scan Automático do Repositório',
            });
          }}
          onSelectFindingForWork={(finding, content) => {
            setSelectedFinding(finding);
            setAstBufferOverride(content);
            setActiveTab('ast');
          }}
        />

        {/* 2. GAVETA LATERAL DE NAVEGAÇÃO DE FASES 13 A 0 (DIRETRIZ 2) */}
        <PhaseDrawer
          isOpen={isPhaseDrawerOpen}
          onClose={() => setIsPhaseDrawerOpen(false)}
          selectedPhase={phaseFilter}
          onSelectPhase={(phase) => setPhaseFilter(phase)}
          findings={findings}
        />

        {/* 3. ÁREA DE TRABALHO CIRÚRGICA BASEADA NA ABA ATIVA */}
        {activeTab === 'matrix' && (
          <PhaseMatrix
            findings={findings}
            onUpdateStatus={handleUpdateStatus}
            onSelectForPr={handleSelectForPr}
            onInspectAst={handleInspectAst}
            onImportFindings={handleImportFindings}
            onAddSingleFinding={handleAddSingleFinding}
            onClearAll={handleClearAllFindings}
          />
        )}

        {activeTab === 'autonomous' && (
          <AutonomousOrchestrator
            onSendToDiary={handleAddDiaryEntry}
            onSelectFindingForWork={(code) => {
              const matched = findings.find(f => f.code === code);
              if (matched) {
                setSelectedFinding(matched);
                setActiveTab('pr');
              }
            }}
          />
        )}

        {activeTab === 'ast' && (
          <AstDiffAnalyzer
            selectedFinding={selectedFinding}
            initialBuffer={astBufferOverride || undefined}
            onSendToDiary={handleAddDiaryEntry}
            onSendToPr={(code, finding) => {
              if (finding) setSelectedFinding(finding);
              setActiveTab('pr');
            }}
          />
        )}

        {activeTab === 'pr' && (
          <PrGenerator
            findings={findings}
            selectedFinding={selectedFinding}
            onSendToDiary={handleAddDiaryEntry}
            onMarkFindingAsGreen={handleMarkFindingAsGreen}
          />
        )}

        {activeTab === 'build' && (
          <BuildConflictSolver
            onSendToDiary={handleAddDiaryEntry}
            onSendToPr={(code) => {
              setActiveTab('pr');
            }}
          />
        )}

        {activeTab === 'gate' && (
          <LocalGateChecklist />
        )}

        {activeTab === 'decisions' && (
          <DecisionsReference />
        )}

        {activeTab === 'diary' && (
          <EngineeringDiary
            diary={diary}
            onAddEntry={handleAddDiaryEntry}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800/80 py-4 font-mono text-[11px] text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>EGC - Enterprise GraphRAG Context</span>
            <span>•</span>
            <span>Autor Exclusivo: Marco Antônio Conceição</span>
          </div>
          <div>
            <span>Token Clássico Fixo no Topo • Fases em Gaveta Lateral • Bottom-Up (Fase 13 &rarr; Fase 0)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
