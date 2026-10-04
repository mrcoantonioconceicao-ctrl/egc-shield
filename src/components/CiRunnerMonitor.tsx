import React, { useState, useEffect, useRef } from 'react';
import { safeFetchJson } from '../utils/apiClient';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  RefreshCw, 
  ExternalLink, 
  Clock, 
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Unlock,
  KeyRound
} from 'lucide-react';

export type TrafficLightState = 'system_green' | 'build_warning' | 'runner_blocked';

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
  updated_at: string;
}

interface CiRunnerMonitorProps {
  owner: string;
  repo: string;
  token?: string;
  pollIntervalMs?: number; // default: 20000 (20 seconds)
}

export const CiRunnerMonitor: React.FC<CiRunnerMonitorProps> = ({
  owner,
  repo,
  token,
  pollIntervalMs = 20000,
}) => {
  const [trafficLight, setTrafficLight] = useState<TrafficLightState>('system_green');
  const [trafficLightLabel, setTrafficLightLabel] = useState<string>('System Green');
  const [statusDetails, setStatusDetails] = useState<string>('Iniciando monitoramento de saúde do CI-Runner...');
  const [latestRun, setLatestRun] = useState<CiRun | null>(null);
  const [runs, setRuns] = useState<CiRun[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [lastPolledAt, setLastPolledAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);
  const [failureDiagnostic, setFailureDiagnostic] = useState<string | null>(null);
  const [isUnblocking, setIsUnblocking] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pollStatus = async (isManual = false, forceUnblock = false) => {
    if (!owner || !repo) return;
    if (isManual) setLoading(true);
    if (forceUnblock) setIsUnblocking(true);
    setErrorMessage(null);

    try {
      const headers: Record<string, string> = {};
      if (token) headers['x-github-token'] = token;

      const unblockParam = forceUnblock ? '&unblock=true' : '';
      const data = await safeFetchJson<any>(
        `/api/github/actions/runs?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}${unblockParam}`,
        { headers }
      );

      setAuthError(Boolean(data.authError));
      setTrafficLight(data.trafficLight || 'system_green');
      setTrafficLightLabel(data.trafficLightLabel || 'System Green');
      setStatusDetails(data.statusDetails || '');
      setLatestRun(data.latestRun || null);
      setRuns(data.runs || []);
      setFailureDiagnostic(data.failureDiagnostic || null);
      setLastPolledAt(new Date().toLocaleTimeString());

      if (data.authError) {
        setErrorMessage('Credenciais do GitHub inválidas ou ausentes ("Bad credentials"). Atualize seu Token PAT.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro de rede ao consultar CI-Runner');
    } finally {
      if (isManual) setLoading(false);
      if (forceUnblock) setIsUnblocking(false);
    }
  };

  useEffect(() => {
    if (owner && repo) {
      pollStatus(true);

      // Inicia polling periódico
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        pollStatus(false);
      }, pollIntervalMs);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [owner, repo, token, pollIntervalMs]);

  // Traffic Light Indicator styling
  const isRed = trafficLight === 'runner_blocked';
  const isYellow = trafficLight === 'build_warning';
  const isGreen = trafficLight === 'system_green';

  return (
    <div className="relative inline-block text-left font-mono text-xs">
      {/* Traffic Light Capsule & Label Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition shadow-sm hover:opacity-95 focus:outline-none ${
            isGreen
              ? 'bg-emerald-950/70 border-emerald-600/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : isYellow
              ? 'bg-amber-950/70 border-amber-600/80 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'bg-rose-950/70 border-rose-600/80 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
          }`}
          title="CI-Runner Monitor: Clique para ver histórico, diagnósticos e desbloqueio"
        >
          {/* Traffic Light Physical Housing (3 circular lenses) */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800 shadow-inner">
            {/* Red Light */}
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                isRed
                  ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse'
                  : 'bg-rose-950/50 opacity-40'
              }`}
              title="Vermelho: Runner Blocked"
            />
            {/* Amber / Yellow Light */}
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                isYellow
                  ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse'
                  : 'bg-amber-950/50 opacity-40'
              }`}
              title="Amarelo: Build Warning / Credencial"
            />
            {/* Green Light */}
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                isGreen
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-emerald-950/50 opacity-40'
              }`}
              title="Verde: System Green"
            />
          </div>

          {/* Traffic Light Label */}
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-[11px]">
            <span>{trafficLightLabel}</span>
            {latestRun && (
              <span className="opacity-80 text-[10px] hidden sm:inline">
                (Run #{latestRun.run_number})
              </span>
            )}
          </div>

          <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-0.5" />
        </button>

        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={() => pollStatus(true)}
          disabled={loading || isUnblocking}
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
          title="Consultar Status API agora"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Popover Dropdown with Details & Safety Advisory */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-4 z-50 space-y-3 animate-in fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-bold text-zinc-100 text-xs">
                GitHub Status API & CI-Runner Monitor
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-bold">
              {owner}/{repo}
            </span>
          </div>

          {/* Alerta de Bad credentials (Diretriz 1) */}
          {authError && (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-600 text-rose-200 text-[11px] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-rose-300">
                <KeyRound className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Falha de Autenticação no GitHub ("Bad credentials")</span>
              </div>
              <p className="text-[10px] text-zinc-300 leading-relaxed">
                O token PAT informado expirou ou não possui as permissões necessárias. Configure um novo token clássico com os escopos <code className="text-rose-300 font-bold">repo</code> e <code className="text-rose-300 font-bold">workflow</code> na barra superior.
              </p>
            </div>
          )}

          {/* Traffic Light Status Card */}
          <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
            isGreen
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : isYellow
              ? 'bg-amber-950/40 border-amber-800 text-amber-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}>
            {isGreen ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : isYellow ? (
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-[11px]">
              <div className="font-bold uppercase tracking-wider">
                Status Atual: {trafficLightLabel}
              </div>
              <p className="opacity-90 leading-relaxed">{statusDetails}</p>

              {/* Botão de Desbloqueio da Esteira (Diretriz 2) */}
              {isRed && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => pollStatus(true, true)}
                    disabled={isUnblocking}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-[11px] shadow transition active:scale-95"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{isUnblocking ? 'Liberando Esteira...' : 'Reconhecer Falha & Desbloquear Esteira'}</span>
                  </button>
                  <p className="text-[9px] text-zinc-400 mt-1">
                    Libera o status para "System Green", permitindo commitar a correção da Run #{latestRun?.run_number || 48}.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Diagnóstico da Falha Recente */}
          {failureDiagnostic && !isGreen && (
            <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 space-y-1">
              <span className="font-bold text-zinc-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Diagnóstico Técnico da Falha:
              </span>
              <p className="text-zinc-400 leading-relaxed">{failureDiagnostic}</p>
              {latestRun && (
                <a
                  href={latestRun.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline pt-0.5"
                >
                  <span>Abrir Logs da Run #{latestRun.run_number} no GitHub</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          )}

          {/* Polling Meta */}
          <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1">
            <span>Polling: {pollIntervalMs / 1000}s</span>
            <span>Última Checagem: {lastPolledAt || 'Agora'}</span>
          </div>

          {/* Recent Runs List */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Runs Recentes no Repositório:
            </span>
            {runs.length === 0 ? (
              <p className="text-zinc-500 text-[11px] py-1">Nenhuma execução encontrada.</p>
            ) : (
              runs.map((r) => (
                <a
                  key={r.id}
                  href={r.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center justify-between p-2 rounded border transition group ${
                    r.conclusion === 'failure'
                      ? 'bg-rose-950/20 hover:bg-rose-900/30 border-rose-900/50'
                      : 'bg-zinc-950 hover:bg-zinc-800/80 border-zinc-800'
                  }`}
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
                      <p className={`font-semibold truncate text-[11px] ${
                        r.conclusion === 'failure' ? 'text-rose-300 group-hover:text-rose-200' : 'text-zinc-200 group-hover:text-emerald-300'
                      }`}>
                        {r.name} #{r.run_number} {r.conclusion === 'failure' ? '(Falha)' : ''}
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

          {errorMessage && !authError && (
            <p className="text-[10px] text-rose-400 bg-rose-950/30 p-1.5 rounded border border-rose-900">
              {errorMessage}
            </p>
          )}

          {/* Safety Advisory */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px]">
            <span className="text-zinc-500">
              {isGreen
                ? 'Esteira verde para novos commits'
                : isYellow
                ? 'Aguarde a conclusão ou atualize as credenciais'
                : 'Desbloqueie a esteira ou despache a correção'}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-zinc-200 underline"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
