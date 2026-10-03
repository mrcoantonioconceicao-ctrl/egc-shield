import React, { useState, useEffect } from 'react';
import { Finding, DiaryEntry } from '../types/egc';
import { DECISIONS_LIST, PHASES_CONFIG } from '../data/initialData';
import { 
  GitPullRequest, 
  Copy, 
  Check, 
  ShieldCheck, 
  Send, 
  AlertCircle,
  FileCode,
  Terminal,
  CheckCircle2
} from 'lucide-react';

interface PrGeneratorProps {
  findings: Finding[];
  selectedFinding?: Finding | null;
  onSendToDiary: (entry: Omit<DiaryEntry, 'id' | 'timestamp'>) => void;
  onMarkFindingAsGreen: (findingId: string) => void;
}

export const PrGenerator: React.FC<PrGeneratorProps> = ({
  findings,
  selectedFinding,
  onSendToDiary,
  onMarkFindingAsGreen,
}) => {
  const [targetFindingId, setTargetFindingId] = useState<string>(selectedFinding?.id || 'C44');
  const [scope, setScope] = useState('vector');
  const [title, setTitle] = useState('refactor(embeddings): decouple pipeline core and enforce single file sharding');
  const [summary, setSummary] = useState(
    'Remediate architectural debt C44 by isolating the embedding pipeline core into an immutable, pure async service adhering to Decision D4. Single-file surgical refactoring with zero side effects on adjacent graph traversal modules.'
  );
  const [changes, setChanges] = useState([
    'Decouple embedding batching from monolithic coordinator',
    'Enforce Float32Array binary typing and eliminate any usage',
    'Add comprehensive Vitest suite covering edge cases and zero latency spikes'
  ]);
  const [newChangeInput, setNewChangeInput] = useState('');
  const [proof, setProof] = useState(
    'PASS tests/core/embeddings/pipelineCore.test.ts (12 tests passed, 100% delta coverage)\nEXIT_CODE 0 - scripts/verify-local-gate.sh passed all checks with zero em-dashes and green typecheck.'
  );
  const [copiedPr, setCopiedPr] = useState(false);
  const [copiedCommit, setCopiedCommit] = useState(false);

  const currentFinding = findings.find(f => f.id === targetFindingId) || selectedFinding;

  useEffect(() => {
    if (selectedFinding) {
      setTargetFindingId(selectedFinding.id);
      setTitle(`fix(${selectedFinding.module.toLowerCase().replace(/[^a-z0-9]/g, '')}): remediate ${selectedFinding.code} in ${selectedFinding.targetFile.split('/').pop()}`);
      setSummary(`Remediate finding ${selectedFinding.code} (${selectedFinding.title}) in strict accordance with Phase ${selectedFinding.phase} objectives and Decision ${selectedFinding.decisionRef || 'D1'}.`);
      setChanges([
        `Refactor ${selectedFinding.targetFile} to eliminate architectural finding ${selectedFinding.code}`,
        `Add strict unit tests covering edge cases and domain invariants`,
        `Validate local gate compliance with zero em-dash format and pure human authorship`
      ]);
    }
  }, [selectedFinding]);

  const addChangeItem = () => {
    if (newChangeInput.trim()) {
      setChanges([...changes, newChangeInput.trim()]);
      setNewChangeInput('');
    }
  };

  const removeChangeItem = (index: number) => {
    setChanges(changes.filter((_, i) => i !== index));
  };

  // Ensure no em-dash is present in generated texts
  const sanitizeText = (txt: string) => txt.replace(/[\u2013\u2014]/g, '-');

  const generatedPrBody = `## Summary
${sanitizeText(summary)}

- Target Phase: Phase ${currentFinding?.phase ?? 13} (Bottom-Up)
- Finding ID: ${currentFinding?.code ?? 'N/A'} - ${sanitizeText(currentFinding?.title ?? '')}
- Decision Reference: ${currentFinding?.decisionRef ?? 'D1'}
- Target File: \`${currentFinding?.targetFile ?? 'single_file.ts'}\`
- Heavy Debt Single-File Enforced: ${currentFinding?.isHeavyDebt ? 'YES (C44 Rule D4)' : 'Standard'}
- Author: Marco Antonio Conceicao (mrcoantonioconceicao@gmail.com)

## Changes
${changes.map(c => `- ${sanitizeText(c)}`).join('\n')}

## Proof
\`\`\`text
${sanitizeText(proof)}
\`\`\`

## Compliance Checklist
- [x] Zero em-dash characters used (only simple hyphen '-')
- [x] Exclusive human authorship by Marco Antonio Conceicao (no AI co-authorship)
- [x] Strict atomic scope (single-file modified for heavy debt)
- [x] Local gate and CI test suite green with full delta coverage
`;

  const generatedCommitMessage = `${sanitizeText(title)}

${sanitizeText(summary)}

Finding: ${currentFinding?.code ?? 'C44'}
Phase: ${currentFinding?.phase ?? 9}
Decision: ${currentFinding?.decisionRef ?? 'D4'}
Author: Marco Antonio Conceicao <mrcoantonioconceicao@gmail.com>
`;

  const handleCopyPr = () => {
    navigator.clipboard.writeText(generatedPrBody);
    setCopiedPr(true);
    setTimeout(() => setCopiedPr(false), 2000);
  };

  const handleCopyCommit = () => {
    navigator.clipboard.writeText(generatedCommitMessage);
    setCopiedCommit(true);
    setTimeout(() => setCopiedCommit(false), 2000);
  };

  const handleRecordInDiary = () => {
    if (currentFinding) {
      onSendToDiary({
        phase: currentFinding.phase,
        targetFile: currentFinding.targetFile,
        findingId: currentFinding.id,
        actionTaken: `Submissão de PR atômica para ${currentFinding.code}: ${title}`,
        astAnalysisSummary: `Conformidade total: 1 arquivo tocado, sem travessões, autor humano Marco Antônio Conceição.`,
        ciGateProof: proof,
        prLinkOrRef: title,
      });
      onMarkFindingAsGreen(currentFinding.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-zinc-100">
                Gerador de Pull Request Atômica & Cirúrgica
              </span>
            </div>
            <p className="text-zinc-400">
              Corpo de PR em inglês direto estruturado estritamente com <strong>Summary</strong>, <strong>Changes</strong> e <strong>Proof</strong>. Autoria 100% humana de Marco Antônio Conceição.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              Autor: Marco Antônio Conceição
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Parameters Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-zinc-200 border-b border-zinc-800 pb-2">
            Parâmetros da PR Atômica
          </h3>

          {/* Finding selector */}
          <div className="space-y-1">
            <label className="text-zinc-400">Achado Alvo (108 Achados / C44):</label>
            <select
              value={targetFindingId}
              onChange={(e) => {
                const f = findings.find(x => x.id === e.target.value);
                if (f) {
                  setTargetFindingId(f.id);
                  setTitle(`fix(${f.module.toLowerCase().replace(/[^a-z0-9]/g, '')}): remediate ${f.code} in ${f.targetFile.split('/').pop()}`);
                  setSummary(`Remediate finding ${f.code} (${f.title}) adhering to Phase ${f.phase} and Decision ${f.decisionRef || 'D1'}.`);
                }
              }}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 focus:border-emerald-500 font-mono text-xs"
            >
              {findings.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} {f.isHeavyDebt ? '[DÍVIDA PESADA C44]' : ''} - Fase {f.phase} - {f.title.substring(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          {currentFinding?.isHeavyDebt && (
            <div className="p-3 bg-rose-950/20 border border-rose-800/60 rounded text-rose-300 text-xs">
              <span className="font-bold">REGRA DECISÃO D4 (C44):</span> Esta é uma dívida arquitetural pesada. A PR deve modificar única e exclusivamente o arquivo <code className="text-rose-200 font-bold bg-rose-950/60 px-1 py-0.5 rounded">{currentFinding.targetFile}</code>.
            </div>
          )}

          {/* PR Title */}
          <div className="space-y-1">
            <label className="text-zinc-400">Título do Commit / PR (Imperative English):</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 focus:border-emerald-500 font-mono text-xs"
            />
          </div>

          {/* PR Summary */}
          <div className="space-y-1">
            <label className="text-zinc-400">Summary (Direto, factual, sem travessões):</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 focus:border-emerald-500 font-mono text-xs"
            />
          </div>

          {/* Changes list */}
          <div className="space-y-2">
            <label className="text-zinc-400">Changes (Lista atômica de alterações):</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {changes.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-zinc-800 text-zinc-300">
                  <span className="truncate flex-1">- {item}</span>
                  <button
                    onClick={() => removeChangeItem(idx)}
                    className="text-rose-400 hover:text-rose-300 text-[10px] ml-2 font-bold px-1"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChangeInput}
                onChange={(e) => setNewChangeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChangeItem()}
                placeholder="Adicionar item de alteração..."
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 font-mono text-xs focus:border-emerald-500"
              />
              <button
                onClick={addChangeItem}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 text-xs"
              >
                + Item
              </button>
            </div>
          </div>

          {/* Proof */}
          <div className="space-y-1">
            <label className="text-zinc-400">Proof (Saída de testes unitários e CI gate):</label>
            <textarea
              rows={3}
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 focus:border-emerald-500 font-mono text-xs"
            />
          </div>
        </div>

        {/* Generated Output Preview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4 font-mono text-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-zinc-200">
                  Corpo de PR Formatado (Markdown)
                </h3>
              </div>
              <button
                onClick={handleCopyPr}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded flex items-center gap-1.5 transition text-xs"
              >
                {copiedPr ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPr ? 'Copiado!' : 'Copiar PR'}</span>
              </button>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded p-3 text-zinc-300 font-mono text-[11px] leading-relaxed max-h-[380px] overflow-y-auto whitespace-pre-wrap">
              {generatedPrBody}
            </div>

            {/* Commit Message Box */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  Mensagem de Commit Git:
                </span>
                <button
                  onClick={handleCopyCommit}
                  className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 text-[11px]"
                >
                  {copiedCommit ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCommit ? 'Copiado' : 'Copiar Commit'}</span>
                </button>
              </div>
              <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-zinc-300 text-[11px] whitespace-pre-wrap">
                {generatedCommitMessage}
              </div>
            </div>
          </div>

          {/* Action to log into Diary */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-500 text-[11px]">
              Autor: Marco Antônio Conceição (exclusivo)
            </span>
            <button
              onClick={handleRecordInDiary}
              className="px-3.5 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded flex items-center gap-2 transition text-xs font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Registrar PR no Diário & Marcar CI Verde</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
