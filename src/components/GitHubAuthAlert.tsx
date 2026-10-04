/**
 * Banner de Alerta Defensivo para Falhas de Autenticação no GitHub (Bad credentials).
 * Renderiza notificações não bloqueantes quando erros HTTP 401/403 são interceptados.
 *
 * Autor: Marco Antônio Conceição
 * Regras: Decisão D2 (Autoria 100% humana) e Decisão D3 (Sem travessões unicode)
 */
import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  AlertTriangle, 
  ExternalLink, 
  X, 
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { 
  subscribeGitHubAuthErrors, 
  clearGitHubAuthError, 
  GitHubAuthErrorInfo 
} from '../utils/githubAuth';

export const GitHubAuthAlert: React.FC = () => {
  const [authError, setAuthError] = useState<GitHubAuthErrorInfo | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeGitHubAuthErrors((error) => {
      setAuthError(error);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!authError) {
    return null;
  }

  return (
    <div className="w-full bg-rose-950/90 border-b border-rose-700 text-rose-100 px-4 py-3 shadow-lg animate-in slide-in-from-top duration-300 font-mono text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Ícone e Mensagem Principal */}
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-rose-900 border border-rose-600 text-rose-300 shrink-0 mt-0.5">
            <KeyRound className="w-4 h-4 text-rose-300" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-200 tracking-tight text-xs uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Falha de Autenticação no GitHub (HTTP {authError.statusCode}: Bad Credentials)
              </span>
              <span className="text-[10px] text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800">
                {authError.timestamp}
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed">
              {authError.message}
            </p>

            <p className="text-[10px] text-rose-300/90 flex items-center gap-1">
              <span className="font-bold">Ação recomendada:</span> {authError.recommendation}
            </p>
          </div>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <a
            href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=EGC-Copilot-Engine"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 border border-rose-600 text-rose-100 font-bold transition shadow-sm text-[11px]"
          >
            <span>Gerar Novo PAT</span>
            <ExternalLink className="w-3 h-3 text-rose-300" />
          </a>

          <button
            type="button"
            onClick={() => clearGitHubAuthError()}
            className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-rose-100 transition"
            title="Dispensar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
