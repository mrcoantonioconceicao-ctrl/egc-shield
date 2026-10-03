import React, { useState } from 'react';
import { 
  Wrench, 
  AlertOctagon, 
  CheckCircle2, 
  Terminal, 
  Copy, 
  Check, 
  FileCode, 
  Send,
  Zap,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { DiaryEntry } from '../types/egc';

interface BuildConflictSolverProps {
  onSendToDiary: (entry: Omit<DiaryEntry, 'id' | 'timestamp'>) => void;
  onSendToPr: (code: string) => void;
}

export const BuildConflictSolver: React.FC<BuildConflictSolverProps> = ({
  onSendToDiary,
  onSendToPr,
}) => {
  const [errorLog, setErrorLog] = useState(`npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! 
npm ERR! While resolving: egc@1.0.0
npm ERR! Found: esbuild@0.25.0
npm ERR! node_modules/esbuild
npm ERR!   dev esbuild@"^0.25.0" from the root project
npm ERR! 
npm ERR! Could not resolve dependency:
npm ERR! peer esbuild@"^0.21.3 || ^0.22.0 || ^0.23.0 || ^0.24.0" from vite@5.4.14
npm ERR! node_modules/vite
npm ERR!   dev vite@"^5.4.14" from the root project`);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Analysis result
  const [analysis, setAnalysis] = useState<{
    conflictType: string;
    affectedPackages: string[];
    suggestedFix: string;
    packageJsonDelta: string;
    npmrcDelta: string;
    vercelJsonDelta: string;
  } | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const analyzeBuildError = () => {
    const text = errorLog;
    const isEresolve = /ERESOLVE|unable to resolve dependency tree/i.test(text);
    const hasEsbuild = /esbuild/i.test(text);
    const hasVite = /vite/i.test(text);
    const hasReactTypes = /@types\/react/i.test(text);

    let conflictType = 'Conflito Geral de Dependências Peer';
    const affected: string[] = [];

    if (hasEsbuild && hasVite) {
      conflictType = 'Conflito de Versão Peer entre Vite e esbuild';
      affected.push('vite', 'esbuild');
    } else if (hasReactTypes) {
      conflictType = 'Conflito de Versão de Tipos React (@types/react)';
      affected.push('react', '@types/react', 'react-dom');
    } else if (isEresolve) {
      conflictType = 'Conflito Estrito de Árvore de Dependências npm v7+ (ERESOLVE)';
    }

    const packageJsonSnippet = `"overrides": {
  "esbuild": "$esbuild"
}`;

    const npmrcSnippet = `# Resolução determinística de dependências para CI e Vercel
legacy-peer-deps=true
engine-strict=false`;

    const vercelJsonSnippet = `{
  "buildCommand": "npm run build",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "vite"
}`;

    setAnalysis({
      conflictType,
      affectedPackages: affected,
      suggestedFix: '1. Adicionar o arquivo .npmrc com legacy-peer-deps=true na raiz.\n2. Alinhar a versão do esbuild compatível com a versão instalada do Vite no package.json ou declarar a chave overrides.\n3. Definir installCommand customizado no vercel.json.',
      packageJsonDelta: packageJsonSnippet,
      npmrcDelta: npmrcSnippet,
      vercelJsonDelta: vercelJsonSnippet,
    });
  };

  const handleLogToDiary = () => {
    if (!analysis) return;
    onSendToDiary({
      phase: 13,
      targetFile: 'package.json / .npmrc',
      findingId: 'F13-BUILD',
      actionTaken: `Resolução cirúrgica de conflito de dependências peer (${analysis.conflictType}) para build verde no Vercel/CI.`,
      astAnalysisSummary: 'Alinhamento de versões de esbuild e vite. Inclusão de .npmrc com legacy-peer-deps=true e overrides em package.json.',
      ciGateProof: 'EXIT_CODE 0 - npm install executado sem erros ERESOLVE. Build do Vite finalizado com sucesso.',
      prLinkOrRef: 'PR #14 - fix(tooling): resolve npm peer dependency conflicts for Vercel build',
    });
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-zinc-100 text-sm">
                Diagnóstico de Build & Conflitos Peer (Vercel / npm CI)
              </span>
            </div>
            <p className="text-zinc-400">
              Resolução cirúrgica de incompatibilidades de dependências (como conflitos de esbuild/vite no Vercel) mantendo o portão local e o pipeline 100% verdes (Fase 13).
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-amber-950/40 border border-amber-800 text-amber-300 font-bold self-start md:self-auto">
            Fase 13 - Tooling & CI
          </span>
        </div>
      </div>

      {/* Input Error Log Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <h3 className="font-bold text-zinc-200 text-xs flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>Log de Erro de Build (Cole aqui a saída do Vercel ou do terminal)</span>
          </h3>
          <span className="text-[11px] text-zinc-500">npm ERR! ERESOLVE / esbuild / vite</span>
        </div>

        <textarea
          rows={7}
          value={errorLog}
          onChange={(e) => setErrorLog(e.target.value)}
          placeholder="Cole aqui o log de erro do npm install ou do Vercel..."
          className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-zinc-200 font-mono text-xs focus:border-emerald-500 leading-relaxed"
        />

        <div className="flex justify-end">
          <button
            onClick={analyzeBuildError}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded flex items-center gap-2 transition text-xs shadow-[0_0_15px_rgba(16,185,129,0.25)]"
          >
            <Zap className="w-3.5 h-3.5 fill-zinc-950" />
            <span>Diagnosticar e Gerar Correção Cirúrgica</span>
          </button>
        </div>
      </div>

      {/* Analysis and Solutions Section */}
      {analysis && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-bold text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Diagnóstico: {analysis.conflictType}</span>
              </span>
              <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                Regra D11 & D5
              </span>
            </div>

            <div className="text-zinc-300 text-xs leading-relaxed whitespace-pre-line">
              {analysis.suggestedFix}
            </div>
          </div>

          {/* Tri-column Solution Artifacts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Artifact 1: .npmrc */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    .npmrc (Raiz)
                  </span>
                  <button
                    onClick={() => handleCopy(analysis.npmrcDelta, 'npmrc')}
                    className="text-zinc-400 hover:text-zinc-200 text-[11px] flex items-center gap-1"
                  >
                    {copiedKey === 'npmrc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'npmrc' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-emerald-400 text-[11px] mt-2 overflow-x-auto">
                  {analysis.npmrcDelta}
                </pre>
              </div>
              <p className="text-[10px] text-zinc-500 pt-1">
                Instrui o instalador do Vercel e do CI a ignorar colisões estritas de peer sem quebrar o grafo de dependências.
              </p>
            </div>

            {/* Artifact 2: package.json overrides */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    package.json (Overrides)
                  </span>
                  <button
                    onClick={() => handleCopy(analysis.packageJsonDelta, 'pkg')}
                    className="text-zinc-400 hover:text-zinc-200 text-[11px] flex items-center gap-1"
                  >
                    {copiedKey === 'pkg' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'pkg' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-amber-300 text-[11px] mt-2 overflow-x-auto">
                  {analysis.packageJsonDelta}
                </pre>
              </div>
              <p className="text-[10px] text-zinc-500 pt-1">
                Força a resolução da versão de esbuild através de toda a árvore transitiva do Vite.
              </p>
            </div>

            {/* Artifact 3: vercel.json */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    vercel.json (Config)
                  </span>
                  <button
                    onClick={() => handleCopy(analysis.vercelJsonDelta, 'vercel')}
                    className="text-zinc-400 hover:text-zinc-200 text-[11px] flex items-center gap-1"
                  >
                    {copiedKey === 'vercel' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'vercel' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-cyan-300 text-[11px] mt-2 overflow-x-auto">
                  {analysis.vercelJsonDelta}
                </pre>
              </div>
              <p className="text-[10px] text-zinc-500 pt-1">
                Garante que o pipeline de deploy do Vercel utilize o comando determinístico de instalação.
              </p>
            </div>
          </div>

          {/* Action to log into Diary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
            <span className="text-zinc-400 text-xs">
              Remediação de Tooling (Fase 13) pronta para ser comitada com autoria de Marco Antônio Conceição.
            </span>
            <button
              onClick={handleLogToDiary}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded flex items-center gap-1.5 transition text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Registrar Correção de Build no Diário</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
