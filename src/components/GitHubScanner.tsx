import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Key, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  FileCode, 
  FolderTree, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Eye, 
  EyeOff,
  AlertCircle,
  ListTodo,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  Download,
  FileDown,
  FileText
} from 'lucide-react';
import { Finding } from '../types/egc';
import { generateIssuesAuditPdf } from '../utils/pdfIssuesReport';

interface GitHubScannerProps {
  onLoadFileToAst: (filePath: string, content: string, findingCode?: string) => void;
  findings: Finding[];
}

export const GitHubScanner: React.FC<GitHubScannerProps> = ({
  onLoadFileToAst,
  findings,
}) => {
  const [owner, setOwner] = useState(() => localStorage.getItem('egc_gh_owner') || '');
  const [repo, setRepo] = useState(() => localStorage.getItem('egc_gh_repo') || 'egc');
  const [branch, setBranch] = useState(() => localStorage.getItem('egc_gh_branch') || 'main');
  const [token, setToken] = useState(() => sessionStorage.getItem('egc_gh_token') || '');
  const [showToken, setShowToken] = useState(false);

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message?: string;
    repoName?: string;
    defaultBranch?: string;
  } | null>(null);

  const [treeFiles, setTreeFiles] = useState<Array<{ path: string; size?: number; type: string }>>([]);
  const [isScanningTree, setIsScanningTree] = useState(false);
  const [filterTree, setFilterTree] = useState('');

  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [fetchingFile, setFetchingFile] = useState(false);
  const [fetchedFileContent, setFetchedFileContent] = useState<string | null>(null);
  const [fileSha, setFileSha] = useState('');

  // Estados de Auditoria Estática e Sincronização de Issues no GitHub
  const [isAuditing, setIsAuditing] = useState(false);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<{
    success: boolean;
    totalAuditedIssues: number;
    dispatchedCount: number;
    autoDispatchExecuted: boolean;
    tokenConfigured: boolean;
    summary: string;
    issues: Array<{
      id: string;
      title: string;
      status: 'dispatched' | 'ready_for_dispatch' | 'failed' | 'error';
      issueNumber?: number;
      issueUrl?: string;
      error?: string;
      readyPayload?: {
        id: string;
        title: string;
        labels: string[];
        targetFile: string;
        body: string;
      };
    }>;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem('egc_gh_owner', owner);
    localStorage.setItem('egc_gh_repo', repo);
    localStorage.setItem('egc_gh_branch', branch);
    if (token) sessionStorage.setItem('egc_gh_token', token);
  }, [owner, repo, branch, token]);

  const testConnection = async () => {
    setIsConnecting(true);
    setConnectionStatus(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['x-github-token'] = token;

      const res = await fetch(`/api/github/status?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`, { headers });
      const data = await res.json();
      
      if (res.ok && data.connected) {
        setConnectionStatus({
          connected: true,
          repoName: data.repoName,
          defaultBranch: data.defaultBranch,
          message: 'Conexão confirmada com sucesso via token clássico.',
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
        message: `Erro de rede: ${err.message}`,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const scanRepositoryTree = async () => {
    if (!owner || !repo) {
      alert('Preencha o proprietário (owner) e o nome do repositório nos campos acima.');
      return;
    }
    setIsScanningTree(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['x-github-token'] = token;

      const res = await fetch(`/api/github/tree?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`, { headers });
      const data = await res.json();
      if (data.tree) {
        const filesOnly = data.tree.filter((item: any) => item.type === 'blob');
        setTreeFiles(filesOnly);
      } else {
        alert(data.error || 'Não foi possível carregar a árvore de arquivos.');
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsScanningTree(false);
    }
  };

  const handleDownloadPdf = (targetData?: typeof auditData) => {
    const dataToUse = targetData || auditData;
    if (!dataToUse || !dataToUse.issues) return;

    try {
      const doc = generateIssuesAuditPdf({
        owner: owner || 'mrcoantonioconceicao',
        repo: repo || 'egc',
        branch: branch || 'main',
        dispatchedCount: dataToUse.dispatchedCount,
        issues: dataToUse.issues,
      });
      const cleanFileName = `EGC-Auditoria-Issues-${owner || 'mrcoantonioconceicao'}-${repo || 'egc'}.pdf`;
      doc.save(cleanFileName);
    } catch (pdfErr: any) {
      console.error('Erro ao gerar PDF de auditoria:', pdfErr);
      alert(`Falha ao gerar PDF: ${pdfErr.message}`);
    }
  };

  const handleSyncAuditIssues = async () => {
    setIsAuditing(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['x-github-token'] = token;

      const res = await fetch('/api/github/issues/sync-audit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          owner: owner || 'mrcoantonioconceicao',
          repo: repo || 'egc',
          autoDispatch: Boolean(token),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAuditData(data);
        // Gera e dispara o download automático do PDF formatado
        handleDownloadPdf(data);
      } else {
        alert(data.error || 'Falha ao executar auditoria e sincronização de issues.');
      }
    } catch (err: any) {
      alert(`Erro na auditoria: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const fetchFile = async (filePath: string) => {
    setSelectedFilePath(filePath);
    setFetchingFile(true);
    setFetchedFileContent(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['x-github-token'] = token;

      const res = await fetch(`/api/github/file?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(filePath)}&ref=${encodeURIComponent(branch)}`, { headers });
      const data = await res.json();

      if (res.ok && data.content !== undefined) {
        setFetchedFileContent(data.content);
        setFileSha(data.sha);
      } else {
        alert(data.error || 'Falha ao buscar conteúdo do arquivo.');
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setFetchingFile(false);
    }
  };

  const sendToAstAnalyzer = () => {
    if (selectedFilePath && fetchedFileContent !== null) {
      const matched = findings.find(f => f.targetFile === selectedFilePath);
      onLoadFileToAst(selectedFilePath, fetchedFileContent, matched?.code);
    }
  };

  const filteredTree = treeFiles.filter(f => f.path.toLowerCase().includes(filterTree.toLowerCase()));

  const priorityFindings = [
    { code: 'C44', file: 'src/core/embeddings/pipelineCore.ts', note: 'Dívida Pesada (1 arquivo/PR - D4)' },
    { code: 'C30', file: 'src/infra/db/transactionManager.ts', note: 'Resource Leak e ACID - D30' },
    { code: 'S12', file: 'src/infra/security/cypherSanitizer.ts', note: 'Prevenção de Injection - D20' },
  ];

  return (
    <div className="space-y-5 font-mono text-xs">
      {/* 1. INPUTS FIXOS E VISÍVEIS NO FLUXO PRINCIPAL (DIRETRIZ 4) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-zinc-100 text-sm">
              Conexão GitHub & Token Clássico (Fixos na Tela Principal)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {connectionStatus?.connected ? (
              <span className="px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Conectado ({connectionStatus.repoName})
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1 text-[11px]">
                <Lock className="w-3 h-3" /> Aguardando Conexão
              </span>
            )}
          </div>
        </div>

        {/* Form Inputs Grid - Direct and Accessible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-zinc-300 font-bold text-[11px]">Proprietário (User/Org):</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="ex: mrcoantonioconceicao"
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-300 font-bold text-[11px]">Repositório:</label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="ex: egc"
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-300 font-bold text-[11px]">Branch:</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300 font-bold text-[11px]">Token Clássico (PAT):</label>
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
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Action Controls for Connection */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
          <span className="text-[10px] text-zinc-500">
            Token mantido em sessionStorage para proxy de autenticação direta com a API do GitHub.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={testConnection}
              disabled={isConnecting}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-bold rounded flex items-center gap-1.5 transition text-xs shadow-sm"
            >
              {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{isConnecting ? 'Testando...' : 'Conectar Repositório'}</span>
            </button>

            <button
              onClick={scanRepositoryTree}
              disabled={isScanningTree}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded flex items-center gap-1.5 transition text-xs"
            >
              {isScanningTree ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderTree className="w-3.5 h-3.5 text-cyan-400" />}
              <span>Varredura da Árvore</span>
            </button>

            <button
              onClick={handleSyncAuditIssues}
              disabled={isAuditing}
              className="px-3.5 py-1.5 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold rounded flex items-center gap-1.5 transition text-xs shadow-sm cursor-pointer"
              title="Executa varredura, cria issues no GitHub e gera relatório PDF estruturado"
            >
              {isAuditing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ListTodo className="w-3.5 h-3.5 text-cyan-200" />}
              <span>{isAuditing ? 'Processando...' : 'Criar Issues & Gerar PDF'}</span>
            </button>
          </div>
        </div>

        {connectionStatus && (
          <div className={`p-2.5 rounded border text-xs leading-relaxed ${connectionStatus.connected ? 'bg-emerald-950/20 border-emerald-800 text-emerald-300' : 'bg-rose-950/20 border-rose-800 text-rose-300'}`}>
            {connectionStatus.message}
          </div>
        )}
      </div>

      {/* 2.1 Painel de Auditoria Estática & Issues do GitHub */}
      {auditData && (
        <div className="bg-zinc-900 border border-cyan-800/80 rounded-lg p-4 space-y-4 animate-in fade-in duration-300 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300">
                <ListTodo className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                  <span>Dívidas Arquiteturais Mapeadas & Sincronização GitHub</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {auditData.totalAuditedIssues} Dívidas
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {auditData.summary}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => handleDownloadPdf()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
                title="Baixar relatório executivo em documento PDF"
              >
                <FileDown className="w-4 h-4" />
                <span>Baixar Relatório PDF</span>
              </button>

              <button
                onClick={handleSyncAuditIssues}
                disabled={isAuditing}
                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>Re-executar</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {auditData.issues.map((iss) => {
              const isExpanded = expandedIssueId === iss.id;
              const payload = iss.readyPayload;

              return (
                <div
                  key={iss.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2 hover:border-zinc-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-zinc-100 text-xs">
                          {iss.title}
                        </span>
                        {payload?.labels.map((lbl) => (
                          <span
                            key={lbl}
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 flex items-center gap-1"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {lbl}
                          </span>
                        ))}
                      </div>

                      {payload?.targetFile && (
                        <div className="text-[11px] text-zinc-400 font-mono">
                          Arquivo Alvo: <span className="text-emerald-400">{payload.targetFile}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {iss.status === 'dispatched' && iss.issueUrl ? (
                        <a
                          href={iss.issueUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900 rounded text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <span>Issue #{iss.issueNumber} no GitHub</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="px-2 py-0.5 bg-zinc-900 text-zinc-300 border border-zinc-700 rounded text-[10px] font-mono">
                          Formatada & Pronta
                        </span>
                      )}

                      <button
                        onClick={() => setExpandedIssueId(isExpanded ? null : iss.id)}
                        className="p-1 text-zinc-400 hover:text-zinc-200 transition"
                        title="Ver corpo detalhado da issue"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && payload && (
                    <div className="pt-2 border-t border-zinc-800/80 space-y-2 text-xs">
                      <div className="p-3 bg-zinc-900/90 rounded border border-zinc-800 font-mono text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {payload.body}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Priority Shortcuts (C44, C30, S12) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-800 pb-2">
          <h4 className="font-bold text-zinc-200 text-xs flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Atalhos Cirúrgicos de Extração Imediata</span>
          </h4>
          <span className="text-[10px] text-zinc-500">C44 com regra estrita de 1 arquivo por PR</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {priorityFindings.map((item) => (
            <div
              key={item.code}
              className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 p-3 rounded flex flex-col justify-between space-y-2 transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-100 bg-zinc-800 px-1.5 py-0.5 rounded text-[11px]">
                    {item.code}
                  </span>
                  <span className="text-[10px] text-amber-400 bg-amber-950/50 border border-amber-800/60 px-1.5 py-0.5 rounded">
                    {item.note}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 font-semibold mt-1.5 truncate">
                  {item.file}
                </p>
              </div>
              <button
                onClick={() => fetchFile(item.file)}
                className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded text-[11px] font-semibold flex items-center justify-center gap-1"
              >
                <FileCode className="w-3 h-3 text-cyan-400" />
                <span>Buscar do GitHub</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Tree View and Live File Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tree View */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
                Árvore do Repositório ({treeFiles.length})
              </span>
              <span className="text-[10px] text-zinc-500">Branch: {branch}</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={filterTree}
                onChange={(e) => setFilterTree(e.target.value)}
                placeholder="Filtrar arquivos por caminho..."
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-zinc-200 text-xs focus:border-emerald-500"
              />
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded max-h-72 overflow-y-auto divide-y divide-zinc-900">
              {filteredTree.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-[11px]">
                  {treeFiles.length === 0 ? 'Clique em "Varredura da Árvore" para buscar os arquivos reais do repositório.' : 'Nenhum arquivo encontrado com o filtro.'}
                </div>
              ) : (
                filteredTree.map((f) => (
                  <div
                    key={f.path}
                    onClick={() => fetchFile(f.path)}
                    className={`p-2 cursor-pointer text-[11px] flex items-center justify-between hover:bg-zinc-900 transition ${
                      selectedFilePath === f.path ? 'bg-zinc-800/80 text-emerald-400 font-bold' : 'text-zinc-300'
                    }`}
                  >
                    <span className="truncate">{f.path}</span>
                    {f.size && <span className="text-zinc-500 text-[10px] ml-2 shrink-0">{Math.round(f.size / 1024)} KB</span>}
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedFilePath && (
            <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
              <span className="truncate">Selecionado: <strong className="text-zinc-200">{selectedFilePath}</strong></span>
              <button
                onClick={() => fetchFile(selectedFilePath)}
                disabled={fetchingFile}
                className="text-cyan-400 hover:underline"
              >
                {fetchingFile ? 'Recarregando...' : 'Recarregar'}
              </button>
            </div>
          )}
        </div>

        {/* Live File Content */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                Conteúdo Físico Extraído {selectedFilePath ? `(${selectedFilePath.split('/').pop()})` : ''}
              </span>
              {fileSha && <span className="text-[10px] text-zinc-500">SHA: {fileSha.substring(0, 7)}</span>}
            </div>

            {fetchingFile ? (
              <div className="bg-zinc-950 border border-zinc-800 rounded p-12 text-center text-zinc-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Buscando arquivo real do GitHub...</span>
              </div>
            ) : fetchedFileContent !== null ? (
              <textarea
                rows={13}
                readOnly
                value={fetchedFileContent}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-zinc-200 font-mono text-[11px] leading-relaxed resize-none"
              />
            ) : (
              <div className="bg-zinc-950 border border-zinc-800 rounded p-12 text-center text-zinc-500 text-[11px]">
                Selecione um arquivo ou atalho acima para extrair o código real do repositório EGC via API do GitHub.
              </div>
            )}
          </div>

          {fetchedFileContent !== null && (
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-400">
                {fetchedFileContent.split('\n').length} linhas carregadas
              </span>

              <button
                onClick={sendToAstAnalyzer}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded flex items-center gap-1.5 transition text-xs shadow-[0_0_15px_rgba(16,185,129,0.25)]"
              >
                <Zap className="w-3.5 h-3.5 fill-zinc-950" />
                <span>Enviar para Analisador AST & Clean Code</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
