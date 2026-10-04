/**
 * Servidor de API Express Resiliente para o EGC (Enterprise GraphRAG Context).
 * Totalmente blindado para execução como Função Serverless no Vercel e Node.js standalone.
 *
 * Autor: Marco Antônio Conceição
 * Regras: Decisão D2 (Autoria 100% humana) e Decisão D3 (Sem travessões unicode)
 */
import express, { Request as Req, Response as Res, NextFunction } from 'express';

export const apiApp = express();

apiApp.use(express.json());

// 1. Headers Globais e Tratamento de Preflight CORS (OPTIONS)
apiApp.use((req: Req, res: Res, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-github-token');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// 2. Helper com Timeout Defensivo para Chamadas à API do GitHub (Diretriz 3)
export async function safeGithubFetch(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Timeout de comunicação com o GitHub (${timeoutMs}ms excedidos) na rota: ${url}`);
    }
    throw new Error(`Falha de conectividade com a API do GitHub: ${err.message || 'Erro de rede'}`);
  } finally {
    clearTimeout(timer);
  }
}

// 3. Helper de Autenticação do GitHub
export const getGitHubHeaders = (req: Req): Record<string, string> => {
  const token = (req.headers['x-github-token'] as string) || process.env.GITHUB_CLASSIC_TOKEN || '';
  return {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'EGC-Copilot-Engine',
    ...(token ? { 'Authorization': `token ${token}` } : {})
  };
};

// 4. Validação Prévia de Coordenadas de Repositório (Diretriz 2)
export function validateRepoParams(req: Req, res: Res): { owner: string; repo: string } | null {
  const owner = ((req.query.owner as string) || req.body?.owner || process.env.GITHUB_REPO_OWNER || '').trim();
  const repo = ((req.query.repo as string) || req.body?.repo || process.env.GITHUB_REPO_NAME || '').trim();

  if (!owner || !repo) {
    res.status(400).json({
      success: false,
      error: 'Parâmetros obrigatórios ausentes: "owner" e "repo" devem ser fornecidos na query/body ou nas variáveis de ambiente.',
      missing: [!owner ? 'owner' : null, !repo ? 'repo' : null].filter(Boolean),
      code: 'MISSING_REPO_PARAMS',
      statusCode: 400
    });
    return null;
  }

  return { owner, repo };
}

// ==========================================
// ROTAS DE API BLINDADAS COM TRY/CATCH
// ==========================================

// 1. Status de Conexão com GitHub
apiApp.get('/api/github/status', async (req: Req, res: Res) => {
  try {
    const owner = (req.query.owner as string) || process.env.GITHUB_REPO_OWNER;
    const repo = (req.query.repo as string) || process.env.GITHUB_REPO_NAME;
    const headers = getGitHubHeaders(req);

    if (!headers.Authorization) {
      return res.status(200).json({
        connected: false,
        message: 'Token clássico do GitHub não configurado. Forneça o token para varredura do repositório EGC.',
        configured: false
      });
    }

    if (owner && repo) {
      const repoRes = await safeGithubFetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (!repoRes.ok) {
        const errData: any = await repoRes.json().catch(() => ({}));
        return res.status(repoRes.status).json({
          connected: false,
          message: `Falha ao conectar ao repositório ${owner}/${repo}: ${errData.message || repoRes.statusText}`
        });
      }
      const repoData: any = await repoRes.json();
      return res.status(200).json({
        connected: true,
        configured: true,
        repoName: repoData.full_name,
        defaultBranch: repoData.default_branch,
        private: repoData.private,
        permissions: repoData.permissions,
      });
    }

    const userRes = await safeGithubFetch('https://api.github.com/user', { headers });
    if (!userRes.ok) {
      return res.status(userRes.status).json({
        connected: false,
        message: 'Token clássico do GitHub inválido ou expirado.'
      });
    }
    const userData: any = await userRes.json();
    return res.status(200).json({
      connected: true,
      configured: true,
      user: userData.login,
      name: userData.name
    });
  } catch (err: any) {
    console.error('Erro em /api/github/status:', err);
    return res.status(500).json({
      success: false,
      connected: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      statusCode: 500
    });
  }
});

// 2. Busca de Conteúdo de Arquivo no Repositório
apiApp.get('/api/github/file', async (req: Req, res: Res) => {
  try {
    const coords = validateRepoParams(req, res);
    if (!coords) return;
    const { owner, repo } = coords;

    const filePath = req.query.path as string;
    const ref = (req.query.ref as string) || 'main';

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro obrigatório "path" ausente na requisição.',
        code: 'MISSING_PATH_PARAM',
        statusCode: 400
      });
    }

    const headers = getGitHubHeaders(req);
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}`;
    const ghRes = await safeGithubFetch(url, { headers });

    if (!ghRes.ok) {
      const errJson: any = await ghRes.json().catch(() => ({}));
      return res.status(ghRes.status).json({
        success: false,
        error: `Falha ao buscar arquivo ${filePath} no repositório: ${errJson.message || ghRes.statusText}`
      });
    }

    const fileData: any = await ghRes.json();
    if (fileData.type !== 'file' || !fileData.content) {
      return res.status(400).json({
        success: false,
        error: 'O caminho requisitado não é um arquivo legível.'
      });
    }

    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    return res.status(200).json({
      success: true,
      path: fileData.path,
      sha: fileData.sha,
      size: fileData.size,
      content
    });
  } catch (err: any) {
    console.error('Erro em /api/github/file:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      statusCode: 500
    });
  }
});

// 3. Listagem de Árvore Git
apiApp.get('/api/github/tree', async (req: Req, res: Res) => {
  try {
    const coords = validateRepoParams(req, res);
    if (!coords) return;
    const { owner, repo } = coords;
    const branch = (req.query.branch as string) || 'main';

    const headers = getGitHubHeaders(req);
    const treeRes = await safeGithubFetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
    if (!treeRes.ok) {
      const errJson: any = await treeRes.json().catch(() => ({}));
      return res.status(treeRes.status).json({
        success: false,
        error: `Falha ao listar árvore de arquivos: ${errJson.message || treeRes.statusText}`
      });
    }

    const treeData: any = await treeRes.json();
    return res.status(200).json(treeData);
  } catch (err: any) {
    console.error('Erro em /api/github/tree:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      statusCode: 500
    });
  }
});

// 4. Varredura Profunda Dinâmica no Repositório
apiApp.post('/api/github/deep-scan', async (req: Req, res: Res) => {
  try {
    const coords = validateRepoParams(req, res);
    if (!coords) return;
    const { owner, repo } = coords;
    const branch = req.body?.branch || 'main';
    const limit = Number(req.body?.limit) || 40;

    const headers = getGitHubHeaders(req);
    const treeRes = await safeGithubFetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
    if (!treeRes.ok) {
      const errJson: any = await treeRes.json().catch(() => ({}));
      return res.status(treeRes.status).json({
        success: false,
        error: `Falha ao ler árvore de arquivos: ${errJson.message || treeRes.statusText}`
      });
    }

    const treeData: any = await treeRes.json();
    const allFiles = (treeData.tree || []).filter((item: any) => 
      item.type === 'blob' && /\.(ts|tsx|js|jsx|py|go|rs|json)$/.test(item.path)
    );

    const candidates = allFiles.slice(0, limit);
    const detectedAnomalies: any[] = [];
    let scannedCount = 0;

    for (const file of candidates) {
      try {
        const fileRes = await safeGithubFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`, { headers }, 4000);
        if (!fileRes.ok) continue;
        const fileJson: any = await fileRes.json();
        if (!fileJson.content) continue;
        scannedCount++;

        const content = Buffer.from(fileJson.content, 'base64').toString('utf-8');
        const lines = content.split('\n').length;

        // Detector de anomalias arquiteturais
        if (lines > 300) {
          detectedAnomalies.push({
            id: `DYN-${detectedAnomalies.length + 1}`,
            code: `C44-${detectedAnomalies.length + 1}`,
            title: `Monólito Arquitetural (${lines} linhas)`,
            description: `Arquivo ${file.path} excede 300 linhas de código sem decomposição em microserviços.`,
            phase: 13,
            phaseName: 'Fase 13 - Desacoplamento Monolítico',
            targetFile: file.path,
            severity: 'critico',
            decisionRef: 'D4',
            isHeavyDebt: true
          });
        }
      } catch {
        // Prossegue a varredura sem quebrar o laço
      }
    }

    return res.status(200).json({
      success: true,
      totalFilesScanned: scannedCount,
      anomaliesCount: detectedAnomalies.length,
      anomalies: detectedAnomalies,
      summary: `Varredura profunda concluída: ${scannedCount} arquivos inspecionados. ${detectedAnomalies.length} anomalias detectadas.`
    });
  } catch (err: any) {
    console.error('Erro em /api/github/deep-scan:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      statusCode: 500
    });
  }
});

// 5. Monitor de Saúde de CI (Runs)
apiApp.get('/api/github/actions/runs', async (req: Req, res: Res) => {
  try {
    const coords = validateRepoParams(req, res);
    if (!coords) return;
    const { owner, repo } = coords;

    const headers = getGitHubHeaders(req);
    const runsRes = await safeGithubFetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=5`, { headers });

    if (!runsRes.ok) {
      const errJson: any = await runsRes.json().catch(() => ({}));
      return res.status(runsRes.status).json({
        success: false,
        error: `Falha ao consultar runs do GitHub Actions: ${errJson.message || runsRes.statusText}`
      });
    }

    const runsData: any = await runsRes.json();
    const runs = (runsData.workflow_runs || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      head_branch: r.head_branch,
      head_sha: r.head_sha?.slice(0, 7),
      status: r.status,
      conclusion: r.conclusion,
      html_url: r.html_url,
      run_number: r.run_number,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    const latestRun = runs[0] || null;
    let healthStatus: 'healthy' | 'running' | 'failing' | 'unknown' = 'unknown';
    let trafficLight: 'system_green' | 'build_warning' | 'runner_blocked' = 'system_green';
    let trafficLightLabel: 'System Green' | 'Build Warning' | 'Runner Blocked' = 'System Green';
    let statusDetails = 'Todas as execuções recentes concluídas com sucesso. Esteira livre.';

    if (latestRun) {
      if (latestRun.status === 'in_progress' || latestRun.status === 'queued') {
        healthStatus = 'running';
        trafficLight = 'build_warning';
        trafficLightLabel = 'Build Warning';
        statusDetails = `Run #${latestRun.run_number} (${latestRun.name}) em execução ou na fila do runner.`;
      } else if (latestRun.conclusion === 'success') {
        healthStatus = 'healthy';
        trafficLight = 'system_green';
        trafficLightLabel = 'System Green';
        statusDetails = `Run #${latestRun.run_number} (${latestRun.name}) concluída com 100% de sucesso.`;
      } else if (latestRun.conclusion === 'failure' || latestRun.conclusion === 'timed_out' || latestRun.conclusion === 'cancelled') {
        healthStatus = 'failing';
        trafficLight = 'runner_blocked';
        trafficLightLabel = 'Runner Blocked';
        statusDetails = `Falha na Run #${latestRun.run_number} (${latestRun.name}). Esteira bloqueada para novos commits.`;
      }
    }

    return res.status(200).json({
      success: true,
      trafficLight,
      trafficLightLabel,
      healthStatus,
      statusDetails,
      totalRuns: runsData.total_count || 0,
      latestRun,
      runs,
      lastPolledAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Erro em /api/github/actions/runs:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      statusCode: 500
    });
  }
});

// 6. Inspeção de Workflows do GitHub Actions
apiApp.get('/api/github/actions/workflows', async (req: Req, res: Res) => {
  try {
    const coords = validateRepoParams(req, res);
    if (!coords) return;
    const { owner, repo } = coords;
    const branch = (req.query.branch as string) || 'main';

    const headers = getGitHubHeaders(req);
    const treeRes = await safeGithubFetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
    if (!treeRes.ok) {
      return res.status(treeRes.status).json({
        success: false,
        error: 'Falha ao buscar árvore de workflows.'
      });
    }

    const treeData: any = await treeRes.json();
    const workflowFiles = (treeData.tree || []).filter((item: any) => 
      item.type === 'blob' && item.path.startsWith('.github/workflows/') && (item.path.endsWith('.yml') || item.path.endsWith('.yaml'))
    );

    const parsedWorkflows: any[] = [];
    for (const wf of workflowFiles) {
      try {
        const fileRes = await safeGithubFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${wf.path}?ref=${branch}`, { headers }, 4000);
        if (!fileRes.ok) continue;
        const fileJson: any = await fileRes.json();
        if (!fileJson.content) continue;
        const content = Buffer.from(fileJson.content, 'base64').toString('utf-8');

        const runsOn = content.match(/runs-on:\s*([^\n\r]+)/i)?.[1]?.trim() || 'ubuntu-latest';
        const commands: string[] = [];
        if (content.includes('npm test')) commands.push('npm test');
        if (content.includes('npm run lint') || content.includes('eslint')) commands.push('npm run lint');
        if (content.includes('cargo test')) commands.push('cargo test');
        if (content.includes('pytest')) commands.push('pytest');

        parsedWorkflows.push({
          path: wf.path,
          runsOn,
          commands,
          contentSnippet: content.slice(0, 300)
        });
      } catch {
        // prossegue
      }
    }

    return res.status(200).json({
      success: true,
      totalWorkflows: parsedWorkflows.length,
      workflows: parsedWorkflows,
    });
  } catch (err: any) {
    console.error('Erro em /api/github/actions/workflows:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      statusCode: 500
    });
  }
});

// 7. Despacho Real de Pull Request e Commit Atômico
apiApp.post('/api/github/pr/create', async (req: Req, res: Res) => {
  try {
    const {
      owner,
      repo,
      baseBranch = 'main',
      branchName,
      commitMessage,
      filePath,
      fileContent,
      prTitle,
      prBody,
    } = req.body;

    if (!owner || !repo || !branchName || !filePath || !fileContent || !prTitle) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios ausentes: owner, repo, branchName, filePath, fileContent e prTitle são necessários.',
        code: 'MISSING_PR_PARAMS',
        statusCode: 400
      });
    }

    const headers = getGitHubHeaders(req);
    if (!headers.Authorization) {
      return res.status(400).json({
        success: false,
        error: 'Token do GitHub ausente para abertura de Pull Request.',
        code: 'MISSING_GITHUB_TOKEN',
        statusCode: 400
      });
    }

    // 1. Obter SHA da branch base
    const baseRefRes = await safeGithubFetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, { headers });
    if (!baseRefRes.ok) {
      const errJson: any = await baseRefRes.json().catch(() => ({}));
      return res.status(baseRefRes.status).json({
        success: false,
        error: `Base branch '${baseBranch}' não encontrada: ${errJson.message || baseRefRes.statusText}`
      });
    }
    const baseRefData: any = await baseRefRes.json();
    const baseSha = baseRefData.object.sha;

    // 2. Criar branch efêmera isolada
    const createBranchRes = await safeGithubFetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      }),
    });

    if (!createBranchRes.ok && createBranchRes.status !== 422) {
      const errJson: any = await createBranchRes.json().catch(() => ({}));
      return res.status(createBranchRes.status).json({
        success: false,
        error: `Falha ao criar branch '${branchName}': ${errJson.message || createBranchRes.statusText}`
      });
    }

    // 3. Obter SHA do arquivo se existir
    let existingFileSha: string | undefined;
    const getFileRes = await safeGithubFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branchName}`, { headers });
    if (getFileRes.ok) {
      const fileJson: any = await getFileRes.json().catch(() => ({}));
      existingFileSha = fileJson.sha;
    }

    // 4. Commit atômico com autoria exclusiva de Marco Antônio Conceição
    const commitRes = await safeGithubFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: commitMessage || `fix(surgical): remediate debt in ${filePath}`,
        content: Buffer.from(fileContent).toString('base64'),
        branch: branchName,
        sha: existingFileSha,
        author: {
          name: 'Marco Antonio Conceicao',
          email: 'mrcoantonioconceicao@gmail.com',
        },
        committer: {
          name: 'Marco Antonio Conceicao',
          email: 'mrcoantonioconceicao@gmail.com',
        },
      }),
    });

    if (!commitRes.ok) {
      const errJson: any = await commitRes.json().catch(() => ({}));
      return res.status(commitRes.status).json({
        success: false,
        error: `Falha ao realizar commit no arquivo ${filePath}: ${errJson.message || commitRes.statusText}`
      });
    }

    // 5. Abertura oficial da Pull Request
    const prRes = await safeGithubFetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: prTitle,
        body: prBody,
        head: branchName,
        base: baseBranch,
      }),
    });

    if (!prRes.ok) {
      const errJson: any = await prRes.json().catch(() => ({}));
      return res.status(prRes.status).json({
        success: false,
        error: `Falha ao criar Pull Request: ${errJson.message || prRes.statusText}`
      });
    }

    const prData: any = await prRes.json();
    return res.status(201).json({
      success: true,
      prUrl: prData.html_url,
      prNumber: prData.number,
      branch: branchName,
      message: `Pull Request #${prData.number} criada com sucesso no GitHub!`
    });
  } catch (err: any) {
    console.error('Erro em /api/github/pr/create:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      statusCode: 500
    });
  }
});

// Tratamento infalível de rotas de API inexistentes (retorna sempre JSON estruturado)
apiApp.all('/api/*', (req: Req, res: Res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint de API '${req.method} ${req.originalUrl}' não encontrado no servidor EGC.`,
    code: 'API_ENDPOINT_NOT_FOUND',
    statusCode: 404
  });
});

// Middleware Global de Tratamento de Exceções
apiApp.use((err: any, _req: Req, res: Res, _next: NextFunction) => {
  console.error('Exceção capturada no middleware global da API EGC:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erro interno no servidor EGC.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: err.status || 500
  });
});
