export type PhaseNumber = 13 | 12 | 11 | 10 | 9 | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0;

export type FindingStatus = 'pendente' | 'em_andamento' | 'em_revisao' | 'ci_verde' | 'concluido';

export type FindingSeverity = 'critico' | 'alto' | 'medio' | 'baixo';

export interface Finding {
  id: string; // e.g. "C44", "ACH-001", "ACH-108"
  code: string;
  title: string;
  description: string;
  phase: PhaseNumber;
  phaseName: string;
  targetFile: string;
  testFile?: string; // GraphRAG Context: Arquivo de teste correspondente na árvore
  isHeavyDebt?: boolean; // e.g. C44 - single file per PR rule
  decisionRef?: string; // e.g. "D12", "D1"
  severity: FindingSeverity;
  status: FindingStatus;
  module: string;
  astImpact?: string;
  prNumber?: string;
  notes?: string;
  updatedAt: string;
}

export interface DecisionRecord {
  id: string; // "D1" to "D32"
  title: string;
  summary: string;
  impactArea: string;
  ruleEnforcement: string;
  status: 'ativa' | 'em_revisao' | 'concluida';
}

export interface DiaryEntry {
  id: string;
  timestamp: string;
  phase: PhaseNumber;
  targetFile: string;
  findingId: string;
  actionTaken: string;
  astAnalysisSummary: string;
  ciGateProof: string;
  prLinkOrRef: string;
}

export interface AstCheckResult {
  hasEmDash: boolean;
  emDashCount: number;
  hasCoauthorship: boolean;
  hasTests: boolean;
  isSingleFile: boolean;
  fileCount: number;
  complexityWarning: boolean;
  ruleViolations: string[];
  cleanCodeScore: number;
  cleanArchitectureCompliance: boolean;
}
