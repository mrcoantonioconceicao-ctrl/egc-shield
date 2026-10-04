import React, { useState, useEffect } from 'react';
import { safeFetchJson } from '../utils/apiClient';
import { 
  Activity, 
  CheckCircle2, 
  AlertOctagon, 
  RefreshCw, 
  ExternalLink, 
  Clock, 
  ChevronDown,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface CiRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  run_number: number;
  created_at: string;
}

interface CiRunnerHealthProps {
  owner: string;
  repo: string;
  token?: string;
}

export const CiRunnerHealth: React.FC<CiRunnerHealthProps> = ({
  owner,
  repo,
  token,
}) => {
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'running' | 'failing' | 'unknown'>('unknown');
  const [latestRun, setLatestRun] = useState<CiRun | null>(null);
  const [runs, setRuns] = useState<CiRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchHealth = async () => {
    if (!owner || !repo) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['x-github-token'] = token;

      const data = await safeFetchJson<any>(
        `/api/github/actions/runs?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`,
        { headers }
      );

      setHealthStatus(data.healthStatus);
      setLatestRun(data.latestRun);
      setRuns(data.runs || []);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (owner && repo) {
      fetchHealth();
    }
  }, [owner, repo, token]);

  const getStatusBadge = () => {
    if (loading) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] font-mono">
          <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
          <span>Verificando CI-Runner...</span>
        </span>
      );
    }

    if (healthStatus === 'healthy') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 text-[11px] font-mono font-bold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>CI-Runner: Saudável (Run #{latestRun?.run_number} PASS)</span>
        </span>
      );
    }

    if (healthStatus === 'running') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/80 text-amber-300 border border-amber-700/80 text-[11px] font-mono font-bold shadow-sm">
          <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
          <span>CI-Runner: Em Execução #{latestRun?.run_number}</span>
        </span>
      );
    }

    if (healthStatus === 'failing') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/80 text-rose-300 border border-rose-700/80 text-[11px] font-mono font-bold shadow-sm">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          <span>CI-Runner: Falha Recente #{latestRun?.run_number}</span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-[11px] font-mono">
        <Activity className="w-3 h-3 text-zinc-400" />
        <span>CI-Runner: Standby</span>
      </span>
    );
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 hover:opacity-90 transition focus:outline-none"
          title="Clique para ver o histórico de execuções do GitHub Actions"
        >
          {getStatusBadge()}
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        <button
          type="button"
          onClick={fetchHealth}
          disabled={loading}
          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition"
          title="Atualizar status do CI-Runner"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Dropdown com Histórico de Runs e Trava de Segurança */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-4 z-50 space-y-3 font-mono text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-bold text-zinc-100 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              Monitor de Saúde do CI-Runner
            </span>
            <span className="text-[10px] text-zinc-400">
              {owner}/{repo}
            </span>
          </div>

          {/* Trava de Segurança Pré-Commit */}
          <div className={`p-2.5 rounded-lg border text-[11px] flex items-start gap-2 ${
            healthStatus === 'healthy' 
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
              : healthStatus === 'running'
              ? 'bg-amber-950/40 border-amber-800 text-amber-300'
              : 'bg-zinc-950 border-zinc-800 text-zinc-300'
          }`}>
            {healthStatus === 'healthy' ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Esteira liberada. Seguro para submeter novos commits e PRs sem concorrência no runner.</span>
              </>
            ) : healthStatus === 'running' ? (
              <>
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Atenção: Há uma run em andamento. Aguarde conclusão para evitar concorrência ou lock no runner.</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>Atenção: A última run falhou. Inspecione os logs no GitHub Actions antes de submeter novos commits.</span>
              </>
            )}
          </div>

          {/* Lista de Runs Recentes */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Últimas Execuções:</span>
            {runs.length === 0 ? (
              <p className="text-zinc-500 text-[11px] py-2">Nenhuma run encontrada neste repositório.</p>
            ) : (
              runs.map((r) => (
                <a
                  key={r.id}
                  href={r.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 transition group"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {r.conclusion === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : r.status === 'in_progress' ? (
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                    ) : (
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="font-semibold text-zinc-200 group-hover:text-emerald-300 truncate text-[11px]">
                        {r.name} #{r.run_number}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {r.head_branch} ({r.head_sha})
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-200 shrink-0 ml-2" />
                </a>
              ))
            )}
          </div>

          {errorMessage && (
            <p className="text-[10px] text-rose-400 bg-rose-950/30 p-1.5 rounded border border-rose-900">
              {errorMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
