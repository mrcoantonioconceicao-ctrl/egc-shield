import React, { useState, useEffect } from 'react';
import { Finding, FindingStatus, DiaryEntry } from './types/egc';
import { INITIAL_FINDINGS, INITIAL_DIARY } from './data/initialData';
import { Header } from './components/Header';
import { PhaseMatrix } from './components/PhaseMatrix';
import { GitHubScanner } from './components/GitHubScanner';
import { AstDiffAnalyzer } from './components/AstDiffAnalyzer';
import { PrGenerator } from './components/PrGenerator';
import { LocalGateChecklist } from './components/LocalGateChecklist';
import { DecisionsReference } from './components/DecisionsReference';
import { EngineeringDiary } from './components/EngineeringDiary';
import { BuildConflictSolver } from './components/BuildConflictSolver';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('matrix');
  const [phaseFilter, setPhaseFilter] = useState<number | 'all'>('all');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [astBufferOverride, setAstBufferOverride] = useState<string | null>(null);

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

  const handleLoadFileToAst = (filePath: string, content: string, findingCode?: string) => {
    // Check if finding matches
    const matched = findings.find(f => f.targetFile === filePath || f.code === findingCode);
    if (matched) {
      setSelectedFinding(matched);
    } else {
      setSelectedFinding({
        id: findingCode || 'ACH-LIVE',
        code: findingCode || 'AUDIT-LIVE',
        title: `Inspeção de ${filePath.split('/').pop()}`,
        description: `Arquivo extraído via GitHub PAT: ${filePath}`,
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
      <Header
        findings={findings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentPhaseFilter={phaseFilter}
        setCurrentPhaseFilter={setPhaseFilter}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        {activeTab === 'github' && (
          <GitHubScanner
            onLoadFileToAst={handleLoadFileToAst}
            findings={findings}
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

      <footer className="bg-zinc-950 border-t border-zinc-800/80 py-4 font-mono text-[11px] text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>EGC - Enterprise GraphRAG Context</span>
            <span>•</span>
            <span>Autor Exclusivo: Marco Antônio Conceição</span>
          </div>
          <div>
            <span>Conexão GitHub PAT • Análise Real de AST • Bottom-Up (Fase 13 &rarr; Fase 0)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
