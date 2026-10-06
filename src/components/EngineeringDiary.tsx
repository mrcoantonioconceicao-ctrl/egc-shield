import React, { useState } from 'react';
import { DiaryEntry, Finding, PhaseNumber } from '../types/egc';
import { DECISIONS_LIST } from '../data/initialData';
import { downloadAtomicAuditPdf } from '../utils/pdfAuditReport';
import { 
  BookOpen, 
  Plus, 
  Download, 
  Calendar, 
  FileCode, 
  CheckCircle2, 
  Copy, 
  Check,
  Send,
  Terminal,
  FileText
} from 'lucide-react';

interface EngineeringDiaryProps {
  diary: DiaryEntry[];
  findings?: Finding[];
  onAddEntry: (entry: Omit<DiaryEntry, 'id' | 'timestamp'>) => void;
}

export const EngineeringDiary: React.FC<EngineeringDiaryProps> = ({
  diary,
  findings = [],
  onAddEntry,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [phase, setPhase] = useState<PhaseNumber>(13);
  const [targetFile, setTargetFile] = useState('src/core/embeddings/pipelineCore.ts');
  const [findingId, setFindingId] = useState('C44');
  const [actionTaken, setActionTaken] = useState('');
  const [astAnalysisSummary, setAstAnalysisSummary] = useState('');
  const [ciGateProof, setCiGateProof] = useState('');
  const [prLinkOrRef, setPrLinkOrRef] = useState('');
  const [copiedMd, setCopiedMd] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportSuccess, setPdfExportSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTaken.trim()) return;

    // Sanitize any em dashes
    const sanitize = (s: string) => s.replace(/[\u2013\u2014]/g, '-');

    onAddEntry({
      phase,
      targetFile: sanitize(targetFile),
      findingId: sanitize(findingId),
      actionTaken: sanitize(actionTaken),
      astAnalysisSummary: sanitize(astAnalysisSummary),
      ciGateProof: sanitize(ciGateProof),
      prLinkOrRef: sanitize(prLinkOrRef),
    });

    setActionTaken('');
    setAstAnalysisSummary('');
    setCiGateProof('');
    setPrLinkOrRef('');
    setShowAddForm(false);
  };

  const generateMarkdownDiary = () => {
    return `# Diário de Bordo - Remediação EGC (Enterprise GraphRAG Context)
Autor: Marco Antônio Conceição
Regra Textual: Hífen simples estrito (-) sem travessões
Ordem: Fase 13 até Fase 0 (Bottom-Up)

${diary.map(entry => `## Registro: ${entry.timestamp} | Fase ${entry.phase} | Achado: ${entry.findingId}
- Arquivo Alvo: \`${entry.targetFile}\`
- Ação Realizada: ${entry.actionTaken}
- Análise AST & Qualidade: ${entry.astAnalysisSummary}
- Comprovação do Portão CI:
\`\`\`
${entry.ciGateProof}
\`\`\`
- Referência PR: ${entry.prLinkOrRef}
`).join('\n---\n\n')}`;
  };

  const copyDiaryMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownDiary());
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const downloadDiaryMarkdown = () => {
    const element = document.createElement('a');
    const file = new Blob([generateMarkdownDiary()], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = 'DIARIO_DE_BORDO_EGC.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportPdf = () => {
    try {
      setIsExportingPdf(true);
      downloadAtomicAuditPdf({
        diary,
        findings,
        decisions: DECISIONS_LIST,
        authorName: 'Marco Antonio Conceicao',
        authorEmail: 'mrcoantonioconceicao@gmail.com',
      }, 'RELATORIO_AUDITORIA_EGC_D1_D32.pdf');

      setPdfExportSuccess(true);
      setTimeout(() => setPdfExportSuccess(false), 5000);
    } catch (err) {
      console.error('Falha ao exportar relatório PDF de auditoria:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-zinc-100">
                Diário de Bordo Técnico (Auditoria Cirúrgica)
              </span>
            </div>
            <p className="text-zinc-400">
              Registro cronológico e auditável de cada remediação atômica, análise AST e portão CI validado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded flex items-center gap-1.5 transition text-xs font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Registro</span>
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-zinc-950 font-bold rounded flex items-center gap-1.5 transition text-xs font-mono shadow-sm active:scale-95 disabled:opacity-50"
              title="Gerar e baixar relatório oficial PDF de auditoria com decisões D1 a D32 e achados corrigidos"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Gerando PDF...' : 'Exportar PDF (D1-D32)'}</span>
            </button>
            <button
              onClick={copyDiaryMarkdown}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 flex items-center gap-1.5 transition text-xs font-mono"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMd ? 'Copiado' : 'Copiar MD'}</span>
            </button>
            <button
              onClick={downloadDiaryMarkdown}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 flex items-center gap-1.5 transition text-xs font-mono"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar MD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Feedback de Exportacao PDF */}
      {pdfExportSuccess && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-mono text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Relatório PDF de auditoria atômico gerado com sucesso! Inclui todas as Decisões D1-D32, achados corrigidos e histórico do diário de bordo.</span>
          </div>
          <button 
            onClick={() => setPdfExportSuccess(false)} 
            className="text-zinc-400 hover:text-zinc-200 text-[10px] ml-2"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Inline Form to Add Entry */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 rounded-lg p-5 space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-zinc-100 border-b border-zinc-800 pb-2">
            Adicionar Registro ao Diário de Bordo
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-zinc-400">Fase (13 a 0):</label>
              <select
                value={phase}
                onChange={(e) => setPhase(Number(e.target.value) as PhaseNumber)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs"
              >
                {[13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(p => (
                  <option key={p} value={p}>Fase {p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400">Achado (ex: C44, ACH-001):</label>
              <input
                type="text"
                value={findingId}
                onChange={(e) => setFindingId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400">Arquivo Alvo (1 por PR para C44):</label>
              <input
                type="text"
                value={targetFile}
                onChange={(e) => setTargetFile(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400">Ação Realizada (sem travessões):</label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="Descreva a correção atômica executada..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400">Resumo da Análise AST & Qualidade:</label>
            <textarea
              rows={2}
              value={astAnalysisSummary}
              onChange={(e) => setAstAnalysisSummary(e.target.value)}
              placeholder="Resultados da inspeção de AST, complexidade <= 8, tipagem..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400">Comprovação do Portão CI (Logs / Saída de Testes):</label>
            <textarea
              rows={2}
              value={ciGateProof}
              onChange={(e) => setCiGateProof(e.target.value)}
              placeholder="EXIT_CODE 0 - Saída de testes unitários e coverage..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400">Referência da PR ou Commit:</label>
            <input
              type="text"
              value={prLinkOrRef}
              onChange={(e) => setPrLinkOrRef(e.target.value)}
              placeholder="ex: PR #44 - fix(vector): single-file sharding core"
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded text-xs flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Salvar Registro</span>
            </button>
          </div>
        </form>
      )}

      {/* Diary Timeline */}
      <div className="space-y-4 font-mono text-xs">
        {diary.map((entry) => (
          <div
            key={entry.id}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-bold">
                  Fase {entry.phase}
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold">
                  {entry.findingId}
                </span>
                <span className="flex items-center gap-1 text-zinc-400 text-[11px]">
                  <Calendar className="w-3 h-3 text-zinc-500" />
                  {entry.timestamp}
                </span>
              </div>
              <div className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <code className="text-zinc-200">{entry.targetFile}</code>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Ação Executada:</span>
                <p className="text-zinc-200 text-xs font-semibold mt-0.5">{entry.actionTaken}</p>
              </div>

              {entry.astAnalysisSummary && (
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Análise AST & Regras:</span>
                  <p className="text-zinc-300 text-xs mt-0.5">{entry.astAnalysisSummary}</p>
                </div>
              )}

              {entry.ciGateProof && (
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Comprovação do Portão CI:</span>
                  <div className="bg-zinc-950 border border-zinc-800/80 rounded p-2 text-emerald-400 font-mono text-[11px] whitespace-pre-wrap mt-0.5">
                    {entry.ciGateProof}
                  </div>
                </div>
              )}

              {entry.prLinkOrRef && (
                <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Referência de PR: {entry.prLinkOrRef}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
