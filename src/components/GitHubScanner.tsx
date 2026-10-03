import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Key, 
  Search, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  FileCode, 
  FolderTree, 
  ExternalLink,
  ShieldCheck,
  Send,
  Zap,
  Lock,
  Layers
} from 'lucide-react';
import { Finding } from '../types/egc';

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

  // Persist repo coordinates (token stored strictly in sessionStorage for security)
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
          message: 'Conexão estabelecida com sucesso com o repositório EGC.',
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
      alert('Preencha o proprietário (owner) e o nome do repositório.');
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
      // Find associated finding code if mapped
      const matched = findings.find(f => f.targetFile === selectedFilePath);
      onLoadFileToAst(selectedFilePath, fetchedFileContent, matched?.code);
    }
  };

  const filteredTree = treeFiles.filter(f => f.path.toLowerCase().includes(filterTree.toLowerCase()));

  // Quick targets for key findings
  const priorityFindings = [
    { code: 'C44', file: 'src/core/embeddings/pipelineCore.ts', note: 'Dívida Pesada (1 arquivo/PR - D4)' },
    { code: 'C30', file: 'src/infra/db/transactionManager.ts', note: 'Resource Leak e ACID - D30' },
    { code: 'S12', file: 'src/infra/security/cypherSanitizer.ts', note: 'Prevenção de Injection - D20' },
  ];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-zinc-100 text-sm">
                Conector GitHub & Varredura Real de Repositório (Token Clássico)
              </span>
            </div>
            <p className="text-zinc-400">
              Conexão autenticada via PAT clássico para buscar o conteúdo físico dos arquivos mapeados na auditoria EGC.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {connectionStatus?.connected ? (
              <span className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Conectado ({connectionStatus.repoName})
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Aguardando Conexão
              </span>
            )}
          </div>
        </div>
      </div>

      {/* GitHub Authentication & Coordinates Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <h3 className="font-bold text-zinc-200 text-xs flex items-center gap-2 border-b border-zinc-800 pb-2">
          <Key className="w-3.5 h-3.5 text-cyan-400" />
          <span>Credenciais do Repositório EGC (Enterprise GraphRAG Context)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="space-y-1 sm:col-span-1">
            <label className="text-zinc-400">Proprietário (User/Org):</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="ex: mrcoantonioconceicao"
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1 sm:col-span-1">
            <label className="text-zinc-400">Repositório:</label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="ex: egc"
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1 sm:col-span-1">
            <label className="text-zinc-400">Branch:</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1 sm:col-span-1">
            <label className="text-zinc-400">Token Clássico GitHub (PAT):</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-xs focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-zinc-500">
            O token é armazenado temporariamente em sessão de memória para proxy seguro.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={testConnection}
              disabled={isConnecting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-bold rounded flex items-center gap-1.5 transition text-xs"
            >
              {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{isConnecting ? 'Testando...' : 'Conectar Repositório'}</span>
            </button>
            <button
              onClick={scanRepositoryTree}
              disabled={isScanningTree}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded flex items-center gap-1.5 transition text-xs"
            >
              {isScanningTree ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderTree className="w-3.5 h-3.5 text-cyan-400" />}
              <span>Varredura da Árvore de Arquivos</span>
            </button>
          </div>
        </div>

        {connectionStatus && (
          <div className={`p-3 rounded border text-xs ${connectionStatus.connected ? 'bg-emerald-950/20 border-emerald-800 text-emerald-300' : 'bg-rose-950/20 border-rose-800 text-rose-300'}`}>
            {connectionStatus.message}
          </div>
        )}
      </div>

      {/* Priority Targets Quick Loader (C44, C30, S12) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
        <h4 className="font-bold text-zinc-200 text-xs flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Atalhos de Achados Auditados (Carregamento Direto via GitHub)</span>
        </h4>
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

      {/* Repository Tree and File Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Tree View */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
                Arquivos do Repositório ({treeFiles.length})
              </span>
              <span className="text-[10px] text-zinc-500">Branch: {branch}</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={filterTree}
                onChange={(e) => setFilterTree(e.target.value)}
                placeholder="Filtrar arquivos por caminho (ex: src/core/embeddings)..."
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-zinc-200 text-xs focus:border-emerald-500"
              />
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded max-h-80 overflow-y-auto divide-y divide-zinc-900">
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
                    {f.size && <span className="text-zinc-500 text-[10px] ml-2">{Math.round(f.size / 1024)} KB</span>}
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

        {/* Right: Fetched Content & AST Dispatcher */}
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
                rows={14}
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
