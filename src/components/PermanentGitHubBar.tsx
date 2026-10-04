import React, { useState, useEffect } from 'react';
import { 
  Key, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Layers,
  Zap,
  FolderTree,
  AlertOctagon,
  ArrowDownCircle
} from 'lucide-react';
import { Finding } from '../types/egc';
import { CiRunnerMonitor } from './CiRunnerMonitor';
import { safeFetchJson } from '../utils/apiClient';

interface PermanentGitHubBarProps {
  findings: Finding[];
  onOpenPhaseDrawer: () => void;
  onScanComplete: (matchedFindings: Finding[], logMessage: string) => void;
  onSelectFindingForWork: (finding: Finding, fileContent: string) => void;
  currentPhase: number | 'all';
}

export const PermanentGitHubBar: React.FC<PermanentGitHubBarProps> = ({
  findings,
  onOpenPhaseDrawer,
  onScanComplete,
  onSelectFindingForWork,
  currentPhase,
}) => {
  const [owner, setOwner] = useState(() => localStorage.getItem('egc_gh_owner') || '');
  const [repo, setRepo] = useState(() => localStorage.getItem('egc_gh_repo') || 'egc');
  const [branch, setBranch] = useState(() => localStorage.getItem('egc_gh_branch') || 'main');
  const [token, setToken] = useState(() => sessionStorage.getItem('egc_gh_token') || '');
  const [showToken, setShowToken] = useState(false);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message?: string;
    repoName?: string;
    defaultBranch?: string;
  } | null>(null);

  const [scanSummary, setScanSummary] = useState<{
    totalFiles: number;
    matchedCount: number;
    phasesSummary: Record<number, number>;
    message: string;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem('egc_gh_owner', owner);
    localStorage.setItem('egc_gh_repo', repo);
    localStorage.setItem('egc_gh_branch', branch);
    if (token) sessionStorage.setItem('egc_gh_token', token);
  }, [owner, repo, branch, token]);

  const testConnection = async () => {
    const cleanToken = token.trim();
    if (!cleanToken) {
      setConnectionStatus({
        connected: false,
        message: 'Token clássico do GitHub (PAT) ausente. Forneça o token com os escopos "repo" e "workflow".',
      });
      return;
    }

    if (/\s/.test(cleanToken)) {
      setConnectionStatus({
        connected: false,
        message: 'O token fornecido contém espaços ou quebras de linha inválidas. Remova os espaços.',
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus(null);
    try {
      const headers: Record<string, string> = {
        'x-github-token': cleanToken,
      };

      const data = await safeFetchJson<any>(
        `/api/github/status?owner=${encodeURIComponent(owner.trim())}&repo=${encodeURIComponent(repo.trim())}`,
        { headers }
      );
      
      if (data.connected) {
        setConnectionStatus({
          connected: true,
          repoName: data.repoName,
          defaultBranch: data.defaultBranch,
          message: 'Conexão confirmada via token clássico (PAT). Permissões validadas.',
        });
        if (data.defaultBranch && !branch) setBranch(data.defaultBranch);
      } else {
        setConnectionStatus({
          connected: false,
          message: data.message || 'Falha na autenticação ou repositório não encontrado.',
        });
      }
    } catch (err: any) {
      setConnectionStatus({
        connected: false,
        message: `Erro de conexão: ${err.message}`,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // DIRETRIZ 1: Varredura Dinâmica e Agnóstica no Conteúdo Real do Repositório
  const runGlobalAutomatedScan = async () => {
    if (!owner.trim() || !repo.trim()) {
      alert('Preencha o proprietário (User/Org) e o nome do repositório EGC antes de iniciar a varredura.');
      return;
    }

    setIsScanning(true);
    setScanSummary(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['x-github-token'] = token;

      // Chama a análise profunda dinâmica no backend via safeFetchJson
      const data = await safeFetchJson<any>('/api/github/deep-scan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          owner: owner.trim(),
          repo: repo.trim(),
          branch: branch.trim() || 'main',
          limit: 50,
        }),
      });

      const anomalies: Finding[] = (data.anomalies || []).map((item: any, idx: number) => ({
        id: item.id || `DYN-${String(idx + 1).padStart(3, '0')}`,
        code: item.code || `ACH-${idx + 1}`,
        title: item.title,
        description: item.description,
        phase: item.phase,
        phaseName: item.phaseName,
        targetFile: item.targetFile,
        severity: item.severity || 'alto',
        status: 'pendente',
        decisionRef: item.decisionRef || 'D1',
        isHeavyDebt: Boolean(item.isHeavyDebt),
        module: item.module || 'Core',
        updatedAt: item.updatedAt || new Date().toISOString().split('T')[0],
      }));

      // Calculate phases breakdown dynamically
      const phasesCount: Record<number, number> = {};
      anomalies.forEach((f) => {
        phasesCount[f.phase] = (phasesCount[f.phase] || 0) + 1;
      });

      const summaryMsg = data.summary || `Varredura profunda concluída: ${data.totalFilesScanned} arquivos inspecionados, ${anomalies.length} anomalias reais mapeadas.`;

      setScanSummary({
        totalFiles: data.totalFilesScanned || 0,
        matchedCount: anomalies.length,
        phasesSummary: phasesCount,
        message: summaryMsg,
      });

      // Se encontrou anomalias reais, atualiza a matriz do sistema
      if (anomalies.length > 0) {
        onScanComplete(anomalies, summaryMsg);

        // Seleciona automaticamente o primeiro achado prioritário (C44 ou da Fase 13)
        const c44Target = anomalies.find(f => f.code === 'C44' || f.isHeavyDebt) || anomalies[0];
        if (c44Target) {
          try {
            const fileData = await safeFetchJson<any>(
              `/api/github/file?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(c44Target.targetFile)}&ref=${encodeURIComponent(branch)}`,
              { headers }
            );
            if (fileData.content) {
              onSelectFindingForWork(c44Target, fileData.content);
            }
          } catch {
            // ignore auto-fetch error
          }
        }
      } else {
        onScanComplete(findings, summaryMsg);
      }
    } catch (err: any) {
      alert(`Falha na varredura profunda: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-zinc-900 border-2 border-emerald-500/50 rounded-xl p-4 sm:p-5 shadow-lg space-y-4 font-mono text-xs mb-6">
      {/* Top Bar with Title, Connection Status and Phase Drawer Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
              Conexão GitHub & Token Clássico (Fixo no Topo)
            </h2>
            <p className="text-[11px] text-zinc-400">
              Autenticação e varredura global automatizada da Fase 13 até a Fase 0
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Traffic Light Indicator (System Green / Build Warning / Runner Blocked) */}
          <CiRunnerMonitor owner={owner} repo={repo} token={token} />

          {connectionStatus?.connected ? (
            <span className="px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-700 text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Conectado ({connectionStatus.repoName})
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1.5 text-xs">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Aguardando Conexão
            </span>
          )}

          {/* Botão de Acionamento da Gaveta Lateral de Fases */}
          <button
            onClick={onOpenPhaseDrawer}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/40 font-bold rounded flex items-center gap-1.5 transition text-xs shadow-sm"
            aria-label="Abrir gaveta lateral de fases"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Fases 13 &rarr; 0 (Gaveta)</span>
          </button>
        </div>
      </div>

      {/* DIRETRIZ 2: Campos Essenciais Fixos no Topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-zinc-300 font-bold text-[11px]">
            Proprietário (User/Org):
          </label>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="ex: mrcoantonioconceicao"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 text-xs focus:border-emerald-500 focus:outline-none font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-zinc-300 font-bold text-[11px]">
            Repositório EGC:
          </label>
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="ex: egc"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 text-xs focus:border-emerald-500 focus:outline-none font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-zinc-300 font-bold text-[11px]">
            Branch:
          </label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 text-xs focus:border-emerald-500 focus:outline-none font-mono"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-zinc-300 font-bold text-[11px]">
              Token Clássico GitHub (PAT):
            </label>
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="text-zinc-400 hover:text-zinc-200 text-[10px] flex items-center gap-1"
            >
              {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showToken ? 'Ocultar' : 'Exibir'}</span>
            </button>
          </div>
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 text-xs focus:border-emerald-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Seletor Rápido de Ecossistemas & Namespaces (Diretriz 1) */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800 text-[11px] text-zinc-400">
        <span className="font-bold text-zinc-300">Ecossistemas Suportados:</span>
        <button
          type="button"
          onClick={() => {
            setOwner('Fmarzochi');
            setRepo('EGC');
            setBranch('main');
          }}
          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
        >
          Fmarzochi/EGC (GraphRAG Core)
        </button>
        <button
          type="button"
          onClick={() => {
            setOwner('mrcoantonioconceicao');
            setRepo('egc');
            setBranch('main');
          }}
          className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 font-bold transition"
        >
          mrcoantonioconceicao/egc
        </button>
        <button
          type="button"
          onClick={() => {
            setOwner('mrcoantonioconceicao');
            setRepo('nexa-med');
            setBranch('main');
          }}
          className="px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/80 transition"
        >
          Nexa Med (Saúde/SUS/LGPD)
        </button>
        <button
          type="button"
          onClick={() => {
            setOwner('mrcoantonioconceicao');
            setRepo('slip-pay');
            setBranch('main');
          }}
          className="px-2 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/80 transition"
        >
          Slip Pay (Web3/Solidity/Rust)
        </button>
      </div>

      {/* DIRETRIZ 2: Botões Globais Diretos (Sem campo manual de busca de arquivo) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800">
        <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Execução Bottom-Up: Varredura automatizada mapeia da Fase 13 até a Fase 0.</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={testConnection}
            disabled={isConnecting}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg flex items-center gap-1.5 transition text-xs font-semibold"
          >
            {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isConnecting ? 'Testando...' : 'Testar Conexão'}</span>
          </button>

          <button
            onClick={runGlobalAutomatedScan}
            disabled={isScanning}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-bold rounded-lg flex items-center gap-2 transition text-xs shadow-[0_0_15px_rgba(16,185,129,0.25)]"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analisando Conteúdo do Repositório via API...</span>
              </>
            ) : (
              <>
                <FolderTree className="w-4 h-4 fill-zinc-950" />
                <span>Iniciar Varredura Dinâmica e Remediação (Fase 13 &rarr; 0)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Diagnostics / Automated Scan Result Banner */}
      {scanSummary && (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-700/80 text-emerald-300 space-y-1.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Varredura Automatizada Concluída
            </span>
            <span className="text-[11px] bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
              {scanSummary.matchedCount} de 108 achados encontrados
            </span>
          </div>
          <p className="text-xs text-zinc-300">
            {scanSummary.message}
          </p>
          <div className="text-[11px] text-zinc-400 pt-1 flex items-center gap-2 flex-wrap">
            <span className="font-bold text-zinc-300">Pronto para Remediação Cirúrgica:</span>
            <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-200">
              Fase 13 (Tooling): {scanSummary.phasesSummary[13] || 0}
            </span>
            <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-200">
              Fase 9 (Embeddings/C44): {scanSummary.phasesSummary[9] || 0}
            </span>
            <span className="bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800 text-rose-300 font-bold">
              C44 com Trava de 1 Arquivo por PR Ativa
            </span>
          </div>
        </div>
      )}

      {connectionStatus && !scanSummary && (
        <div className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
          connectionStatus.connected 
            ? 'bg-emerald-950/20 border-emerald-800 text-emerald-300' 
            : 'bg-rose-950/20 border-rose-800 text-rose-300'
        }`}>
          {connectionStatus.message}
        </div>
      )}
    </div>
  );
};
