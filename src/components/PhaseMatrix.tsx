import React, { useState, useMemo } from 'react';
import { Finding, FindingStatus, PhaseNumber } from '../types/egc';
import { PHASES_CONFIG } from '../data/initialData';
import { 
  Filter, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  Flame, 
  FileCode, 
  GitPullRequest, 
  ShieldAlert, 
  ChevronDown, 
  ChevronRight,
  Upload,
  Plus,
  Trash2
} from 'lucide-react';

interface PhaseMatrixProps {
  findings: Finding[];
  onUpdateStatus: (id: string, newStatus: FindingStatus) => void;
  onSelectForPr: (finding: Finding) => void;
  onInspectAst: (finding: Finding) => void;
  onImportFindings: (imported: Finding[]) => void;
  onAddSingleFinding: (finding: Finding) => void;
  onClearAll: () => void;
}

export const PhaseMatrix: React.FC<PhaseMatrixProps> = ({
  findings,
  onUpdateStatus,
  onSelectForPr,
  onInspectAst,
  onImportFindings,
  onAddSingleFinding,
  onClearAll,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<PhaseNumber | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [heavyDebtOnly, setHeavyDebtOnly] = useState<boolean>(false);
  const [showImporter, setShowImporter] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);

  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({
    13: true,
    12: true,
    11: true,
    10: true,
    9: true,
    8: true,
    7: true,
    6: true,
    5: true,
    4: true,
    3: true,
    2: true,
    1: true,
    0: true,
  });

  const togglePhaseExpand = (phaseNum: number) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseNum]: !prev[phaseNum],
    }));
  };

  const expandAll = () => {
    const allExp: Record<number, boolean> = {};
    PHASES_CONFIG.forEach(p => { allExp[p.number] = true; });
    setExpandedPhases(allExp);
  };

  const collapseAll = () => {
    const allCol: Record<number, boolean> = {};
    PHASES_CONFIG.forEach(p => { allCol[p.number] = false; });
    setExpandedPhases(allCol);
  };

  const handleProcessImport = () => {
    setImportError(null);
    if (!importText.trim()) return;

    try {
      // 1. Try parsing JSON format
      if (importText.trim().startsWith('[') || importText.trim().startsWith('{')) {
        const parsed = JSON.parse(importText);
        const list: any[] = Array.isArray(parsed) ? parsed : [parsed];
        const validList: Finding[] = list.map((item: any, idx: number) => ({
          id: item.id || `ACH-${String(idx + 1).padStart(3, '0')}`,
          code: item.code || item.id || `ACH-${idx + 1}`,
          title: item.title || 'Achado Real sem título',
          description: item.description || '',
          phase: (typeof item.phase === 'number' ? item.phase : 13) as PhaseNumber,
          phaseName: item.phaseName || `Fase ${item.phase || 13}`,
          targetFile: item.targetFile || item.file || 'src/module.ts',
          isHeavyDebt: Boolean(item.isHeavyDebt || item.code === 'C44'),
          decisionRef: item.decisionRef || 'D1',
          severity: item.severity || 'alto',
          status: (item.status as FindingStatus) || 'pendente',
          module: item.module || 'Geral',
          updatedAt: new Date().toISOString().split('T')[0],
        }));
        onImportFindings(validList);
        setShowImporter(false);
        setImportText('');
        return;
      }

      // 2. Try parsing line-by-line text / markdown list
      // e.g.: "F13-01 | .eslintrc.cjs | Configuração sem AST | D11 | critico"
      const lines = importText.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
      const parsedFindings: Finding[] = lines.map((line, idx) => {
        const parts = line.split('|').map(p => p.trim());
        const code = parts[0] || `ACH-${idx + 1}`;
        const file = parts[1] || 'src/core.ts';
        const title = parts[2] || line;
        const decision = parts[3] || 'D1';
        const sev = (parts[4] || 'alto') as any;

        // Try extracting phase number from code e.g. F13-01 -> 13
        let phaseNum: PhaseNumber = 13;
        const phaseMatch = code.match(/F(\d+)/i);
        if (phaseMatch) {
          const num = parseInt(phaseMatch[1], 10);
          if (num >= 0 && num <= 13) phaseNum = num as PhaseNumber;
        }

        return {
          id: `ACH-${String(idx + 1).padStart(3, '0')}`,
          code,
          title,
          description: `Achado auditado: ${title}`,
          phase: phaseNum,
          phaseName: `Fase ${phaseNum}`,
          targetFile: file,
          isHeavyDebt: code.includes('C44'),
          decisionRef: decision,
          severity: sev === 'critico' || sev === 'alto' || sev === 'medio' || sev === 'baixo' ? sev : 'alto',
          status: 'pendente',
          module: file.split('/')[1] || 'Core',
          updatedAt: new Date().toISOString().split('T')[0],
        };
      });

      if (parsedFindings.length === 0) {
        throw new Error('Nenhum achado reconhecido no texto fornecido.');
      }

      onImportFindings(parsedFindings);
      setShowImporter(false);
      setImportText('');
    } catch (err: any) {
      setImportError(`Erro ao processar: ${err.message}`);
    }
  };

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (selectedPhase !== 'all' && f.phase !== selectedPhase) return false;
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
      if (heavyDebtOnly && !f.isHeavyDebt) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = f.title.toLowerCase().includes(q);
        const matchCode = f.code.toLowerCase().includes(q);
        const matchFile = f.targetFile.toLowerCase().includes(q);
        const matchDesc = f.description.toLowerCase().includes(q);
        const matchDecision = f.decisionRef?.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchFile && !matchDesc && !matchDecision) {
          return false;
        }
      }
      return true;
    });
  }, [findings, selectedPhase, statusFilter, severityFilter, heavyDebtOnly, searchQuery]);

  const findingsByPhase = useMemo(() => {
    const map = new Map<number, Finding[]>();
    PHASES_CONFIG.forEach(p => map.set(p.number, []));
    filteredFindings.forEach(f => {
      const list = map.get(f.phase) || [];
      list.push(f);
      map.set(f.phase, list);
    });
    return map;
  }, [filteredFindings]);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critico':
        return <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold"><AlertOctagon className="w-3 h-3" /> Crítico</span>;
      case 'alto':
        return <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20"><Flame className="w-3 h-3" /> Alto</span>;
      case 'medio':
        return <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Médio</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">Baixo</span>;
    }
  };

  const getStatusBadge = (status: FindingStatus) => {
    switch (status) {
      case 'concluido':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-medium">Concluído</span>;
      case 'ci_verde':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> CI Verde</span>;
      case 'em_andamento':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1"><Clock className="w-3 h-3" /> Em Andamento</span>;
      default:
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">Pendente</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner & Real Inventory Importer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="font-bold text-zinc-100 uppercase tracking-wide">
                Inventário Real de Achados EGC ({findings.length} Carregados)
              </span>
            </div>
            <p className="text-zinc-400">
              Zero dados fictícios. Importe o inventário real dos 108 achados extraídos da auditoria do EGC.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImporter(!showImporter)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded flex items-center gap-1.5 transition text-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Achados Reais</span>
            </button>
            <button
              onClick={expandAll}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition"
            >
              Expandir Fases
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition"
            >
              Recolher
            </button>
          </div>
        </div>
      </div>

      {/* Importer Drawer / Form */}
      {showImporter && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-zinc-100 text-sm">
                Importação do Plano Real de 108 Achados (JSON ou Lista)
              </h3>
            </div>
            <button
              onClick={() => setShowImporter(false)}
              className="text-zinc-400 hover:text-zinc-200"
            >
              Fechar
            </button>
          </div>

          <p className="text-zinc-400">
            Cole abaixo o JSON do seu relatório de auditoria EGC ou a lista de achados no formato: <br />
            <code className="text-emerald-400">CODIGO | ARQUIVO_ALVO | TITULO_ACHADO | DECISAO | SEVERIDADE</code> (ex: <code className="text-zinc-300">F13-01 | .eslintrc.cjs | Tipagem AST estrita | D11 | critico</code>)
          </p>

          <textarea
            rows={8}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Cole o array JSON ou as linhas de achados reais aqui..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-zinc-200 font-mono text-xs focus:border-emerald-500"
          />

          {importError && (
            <div className="p-2 bg-rose-950/40 border border-rose-800 rounded text-rose-300 text-xs">
              {importError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowImporter(false)}
              className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleProcessImport}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded"
            >
              Carregar Inventário Real
            </button>
          </div>
        </div>
      )}

      {/* Control Bar: Search & Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 font-mono text-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código real (ex: C44), arquivo alvo, termo ou decisão..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-700 rounded text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Fase:</span>
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value === 'all' ? 'all' : Number(e.target.value) as PhaseNumber)}
                className="bg-zinc-950 border border-zinc-700 text-zinc-200 rounded px-2 py-1 text-xs"
              >
                <option value="all">Todas as 14 Fases</option>
                {PHASES_CONFIG.map((p) => (
                  <option key={p.number} value={p.number}>
                    Fase {p.number}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-zinc-400">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 text-zinc-200 rounded px-2 py-1 text-xs"
              >
                <option value="all">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="ci_verde">CI Verde</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>

            <button
              onClick={() => setHeavyDebtOnly(!heavyDebtOnly)}
              className={`px-2.5 py-1 text-xs rounded border flex items-center gap-1.5 transition ${
                heavyDebtOnly
                  ? 'bg-rose-950/60 text-rose-300 border-rose-700 font-bold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Dívida C44 (1 Arquivo/PR)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reverse Phases List (Bottom-Up: 13 to 0) */}
      <div className="space-y-4">
        {PHASES_CONFIG.map((phaseMeta) => {
          const phaseFindings = findingsByPhase.get(phaseMeta.number) || [];
          const isExpanded = expandedPhases[phaseMeta.number] ?? false;
          const hasHeavyDebt = phaseFindings.some(f => f.isHeavyDebt);

          return (
            <div
              key={phaseMeta.number}
              className={`bg-zinc-900 border rounded-lg overflow-hidden transition ${
                hasHeavyDebt ? 'border-rose-900/60' : 'border-zinc-800'
              }`}
            >
              <div
                onClick={() => togglePhaseExpand(phaseMeta.number)}
                className="p-4 bg-zinc-900/90 hover:bg-zinc-800/60 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 select-none"
              >
                <div className="flex items-start md:items-center gap-3">
                  <div className="mt-0.5 md:mt-0 text-zinc-400">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-zinc-100">
                        {phaseMeta.title}
                      </span>
                      {hasHeavyDebt && (
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded font-semibold">
                          C44 (1 Arquivo / PR)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {phaseMeta.scope}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono text-zinc-400">
                  <span>{phaseFindings.length} achados nesta fase</span>
                </div>
              </div>

              {isExpanded && (
                <div className="divide-y divide-zinc-800 bg-zinc-950/40">
                  {phaseFindings.length === 0 ? (
                    <div className="p-4 text-center text-xs font-mono text-zinc-500">
                      Nenhum achado cadastrado nesta fase ainda. Utilize o botão "Importar Achados Reais" acima.
                    </div>
                  ) : (
                    phaseFindings.map((finding) => (
                      <div
                        key={finding.id}
                        className={`p-4 hover:bg-zinc-900/40 transition flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                          finding.isHeavyDebt ? 'bg-rose-950/10 border-l-4 border-l-rose-500' : ''
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 font-mono text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-zinc-200 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                              {finding.code}
                            </span>
                            {finding.isHeavyDebt && (
                              <span className="text-[10px] font-bold text-rose-300 bg-rose-950 border border-rose-800 px-1.5 py-0.5 rounded">
                                DÍVIDA PESADA C44
                              </span>
                            )}
                            {getSeverityBadge(finding.severity)}
                            {getStatusBadge(finding.status)}
                            {finding.decisionRef && (
                              <span className="text-[10px] text-amber-300 bg-amber-950/40 border border-amber-800/60 px-1.5 py-0.5 rounded">
                                Ref: {finding.decisionRef}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-semibold text-zinc-200">
                            {finding.title}
                          </h3>

                          {finding.description && (
                            <p className="text-xs text-zinc-400">
                              {finding.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-zinc-500 text-xs">
                            <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-zinc-300 font-semibold">{finding.targetFile}</span>
                            <span>•</span>
                            <span>Módulo: {finding.module}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap lg:flex-col items-end gap-2 text-xs font-mono shrink-0">
                          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded border border-zinc-800">
                            <button
                              onClick={() => onUpdateStatus(finding.id, 'pendente')}
                              className={`px-1.5 py-0.5 text-[10px] rounded ${finding.status === 'pendente' ? 'bg-zinc-700 text-zinc-100 font-bold' : 'text-zinc-400'}`}
                            >
                              Pendente
                            </button>
                            <button
                              onClick={() => onUpdateStatus(finding.id, 'em_andamento')}
                              className={`px-1.5 py-0.5 text-[10px] rounded ${finding.status === 'em_andamento' ? 'bg-amber-600 text-zinc-100 font-bold' : 'text-zinc-400'}`}
                            >
                              Andamento
                            </button>
                            <button
                              onClick={() => onUpdateStatus(finding.id, 'ci_verde')}
                              className={`px-1.5 py-0.5 text-[10px] rounded ${finding.status === 'ci_verde' ? 'bg-emerald-600 text-zinc-100 font-bold' : 'text-zinc-400'}`}
                            >
                              CI Verde
                            </button>
                            <button
                              onClick={() => onUpdateStatus(finding.id, 'concluido')}
                              className={`px-1.5 py-0.5 text-[10px] rounded ${finding.status === 'concluido' ? 'bg-cyan-600 text-zinc-100 font-bold' : 'text-zinc-400'}`}
                            >
                              Concluído
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onInspectAst(finding)}
                              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1 text-[11px]"
                            >
                              <FileCode className="w-3 h-3 text-cyan-400" />
                              <span>Analisar AST/Diff</span>
                            </button>
                            <button
                              onClick={() => onSelectForPr(finding)}
                              className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 text-[11px] font-semibold"
                            >
                              <GitPullRequest className="w-3 h-3 text-emerald-400" />
                              <span>Gerar PR Atômica</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
