import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// CORS e preflight OPTIONS para eliminar 405 Method Not Allowed
app.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-github-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Garante que todas as respostas da API sejam estritamente JSON
app.use('/api', (_req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

  // Helper for GitHub Authorization
  const getGitHubHeaders = (req: Request) => {
    const token = (req.headers['x-github-token'] as string) || process.env.GITHUB_CLASSIC_TOKEN || '';
    return {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'EGC-Copilot-Engine',
      ...(token ? { 'Authorization': `token ${token}` } : {})
    };
  };

  // 1. Check connection and rate limit to GitHub
  app.get('/api/github/status', async (req: Request, res: Response) => {
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
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
        if (!repoRes.ok) {
          const errData = await repoRes.json();
          return res.status(repoRes.status).json({
            connected: false,
            message: `Falha ao conectar ao repositório ${owner}/${repo}: ${errData.message || repoRes.statusText}`
          });
        }
        const repoData = await repoRes.json();
        return res.status(200).json({
          connected: true,
          configured: true,
          repoName: repoData.full_name,
          defaultBranch: repoData.default_branch,
          private: repoData.private,
          permissions: repoData.permissions,
        });
      }

      // Check general user connection
      const userRes = await fetch('https://api.github.com/user', { headers });
      if (!userRes.ok) {
        return res.status(userRes.status).json({
          connected: false,
          message: 'Token clássico do GitHub inválido ou expirado.'
        });
      }
      const userData = await userRes.json();
      return res.status(200).json({
        connected: true,
        configured: true,
        user: userData.login,
        name: userData.name
      });
    } catch (err: any) {
      return res.status(500).json({ connected: false, error: err.message });
    }
  });

  // 2. Fetch file content from GitHub repository
  app.get('/api/github/file', async (req: Request, res: Response) => {
    try {
      const owner = (req.query.owner as string) || process.env.GITHUB_REPO_OWNER;
      const repo = (req.query.repo as string) || process.env.GITHUB_REPO_NAME;
      const filePath = req.query.path as string;
      const ref = (req.query.ref as string) || 'main';

      if (!owner || !repo || !filePath) {
        return res.status(400).json({ error: 'owner, repo e path são obrigatórios' });
      }

      const headers = getGitHubHeaders(req);
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}`;
      const ghRes = await fetch(url, { headers });

      if (!ghRes.ok) {
        const errJson = await ghRes.json();
        return res.status(ghRes.status).json({
          error: `Falha ao buscar arquivo ${filePath} no repositório: ${errJson.message || ghRes.statusText}`
        });
      }

      const fileData = await ghRes.json();
      if (fileData.type !== 'file' || !fileData.content) {
        return res.status(400).json({ error: 'O caminho requisitado não é um arquivo válido.' });
      }

      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
      return res.status(200).json({
        path: fileData.path,
        sha: fileData.sha,
        size: fileData.size,
        content
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 3. List repository tree
  app.get('/api/github/tree', async (req: Request, res: Response) => {
    try {
      const owner = (req.query.owner as string) || process.env.GITHUB_REPO_OWNER;
      const repo = (req.query.repo as string) || process.env.GITHUB_REPO_NAME;
      const branch = (req.query.branch as string) || 'main';

      if (!owner || !repo) {
        return res.status(400).json({ error: 'owner e repo são obrigatórios' });
      }

      const headers = getGitHubHeaders(req);
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      if (!treeRes.ok) {
        return res.status(treeRes.status).json({ error: 'Falha ao buscar árvore de arquivos.' });
      }

      const treeData = await treeRes.json();
      return res.status(200).json(treeData);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 4. Dynamic Deep Repository Scan & Risk Mapping (Bottom-Up Phase 13 to 0)
  app.post('/api/github/deep-scan', async (req: Request, res: Response) => {
    try {
      const { owner, repo, branch = 'main', limit = 40 } = req.body;
      if (!owner || !repo) {
        return res.status(400).json({ error: 'owner e repo são obrigatórios' });
      }

      const headers = getGitHubHeaders(req);
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      if (!treeRes.ok) {
        return res.status(treeRes.status).json({ error: 'Falha ao buscar árvore de arquivos.' });
      }

      const treeData = await treeRes.json();
      const allBlobs: Array<{ path: string; sha: string; size?: number }> = (treeData.tree || [])
        .filter((item: any) => item.type === 'blob');

      // Filter relevant source and configuration files across any programming language in the world
      const codeExts = [
        '.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.java', '.kt', '.cpp', '.c', '.cs', '.sol', '.json', '.yaml', '.yml', '.toml', '.env.example'
      ];
      const candidateFiles = allBlobs.filter(b => {
        const lower = b.path.toLowerCase();
        if (lower.includes('node_modules/') || lower.includes('.git/') || lower.includes('dist/') || lower.includes('build/') || lower.includes('package-lock.json')) {
          return false;
        }
        return codeExts.some(ext => lower.endsWith(ext));
      }).slice(0, Number(limit));

      const detectedAnomalies: any[] = [];
      let scannedCount = 0;

      // Scan files in concurrent batches of 5 to avoid GitHub rate limits
      const batchSize = 5;
      for (let i = 0; i < candidateFiles.length; i += batchSize) {
        const batch = candidateFiles.slice(i, i + batchSize);
        await Promise.all(batch.map(async (file) => {
          try {
            const fileRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`, { headers });
            if (!fileRes.ok) return;
            const fileJson = await fileRes.json();
            if (!fileJson.content) return;
            const content = Buffer.from(fileJson.content, 'base64').toString('utf-8');
            scannedCount++;

            // Run dynamic polyglot heuristics on real content
            const lines = content.split('\n');
            const lowerPath = file.path.toLowerCase();

            // Determine Phase mapping
            let phase = 13;
            let phaseName = 'Fase 13 - Tooling & CI/CD';
            if (lowerPath.includes('package.json') || lowerPath.includes('tsconfig') || lowerPath.includes('.npmrc') || lowerPath.includes('eslint') || lowerPath.includes('.github/')) {
              phase = 13;
              phaseName = 'Fase 13 - Tooling, Linter & CI/CD Pipeline';
            } else if (lowerPath.includes('/domain/') || lowerPath.includes('/contracts/') || lowerPath.includes('/types/')) {
              phase = 12;
              phaseName = 'Fase 12 - Core Domain & Typed Contracts';
            } else if (lowerPath.includes('/sanitizer') || lowerPath.includes('/security/') || lowerPath.includes('/common/')) {
              phase = 11;
              phaseName = 'Fase 11 - Shared Infrastructure & Cypher Sanitization';
            } else if (lowerPath.includes('/db/') || lowerPath.includes('/database/') || lowerPath.includes('transactionmanager')) {
              phase = 10;
              phaseName = 'Fase 10 - Database Layer & ACID Transactions';
            } else if (lowerPath.includes('/embedding') || lowerPath.includes('/pipelinecore') || lowerPath.includes('/vector')) {
              phase = 9;
              phaseName = 'Fase 9 - Vector Store & Embeddings Pipeline';
            } else if (lowerPath.includes('/graph') || lowerPath.includes('/knowledge')) {
              phase = 8;
              phaseName = 'Fase 8 - Knowledge Graph & Entity Extraction';
            } else if (lowerPath.includes('/retriever') || lowerPath.includes('/search')) {
              phase = 7;
              phaseName = 'Fase 7 - Hybrid Retrieval & Ranking Engine';
            } else if (lowerPath.includes('/llm') || lowerPath.includes('/prompt')) {
              phase = 6;
              phaseName = 'Fase 6 - LLM Adapters & Prompt Engineering';
            } else if (lowerPath.includes('/api/') || lowerPath.includes('/routes/') || lowerPath.includes('/server')) {
              phase = 5;
              phaseName = 'Fase 5 - API Gateway & Transport Layer';
            } else if (lowerPath.includes('/eval') || lowerPath.includes('/telemetry')) {
              phase = 4;
              phaseName = 'Fase 4 - Evaluation & Observability';
            } else if (lowerPath.includes('/auth') || lowerPath.includes('/guard')) {
              phase = 3;
              phaseName = 'Fase 3 - Security Hardening & Secret Guards';
            } else if (lowerPath.includes('/test') || lowerPath.includes('/e2e/')) {
              phase = 2;
              phaseName = 'Fase 2 - E2E Integration Test Suite';
            } else if (lowerPath.includes('/cache') || lowerPath.includes('/perf')) {
              phase = 1;
              phaseName = 'Fase 1 - Performance Optimization & Cache';
            } else {
              phase = 0;
              phaseName = 'Fase 0 - Zero-Defect Release Gate';
            }

            // 1. Check for Em-Dash / En-Dash (Violation of Rule 2 & D3)
            const emDashMatches = content.match(/[\u2013\u2014]/g);
            if (emDashMatches && emDashMatches.length > 0) {
              detectedAnomalies.push({
                id: `DYN-DASH-${detectedAnomalies.length + 1}`,
                code: `ERR-DASH-${file.path.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '')}`,
                title: `Violação Regra 2: ${emDashMatches.length} travessões unicode proibidos`,
                description: `Arquivo contém ${emDashMatches.length} caracteres de travessão (— ou –). Use apenas hífen simples (-).`,
                phase,
                phaseName,
                targetFile: file.path,
                severity: 'medio',
                status: 'pendente',
                decisionRef: 'D3',
                isHeavyDebt: false,
                module: file.path.split('/')[1] || 'Config',
                updatedAt: new Date().toISOString().split('T')[0],
              });
            }

            // 2. Check for AI Co-authorship tag (Violation of Rule 3 & D2)
            if (/(Co-authored-by|co-authored-by|Generated by AI|ChatGPT|Claude|Copilot|Assistant)/i.test(content)) {
              detectedAnomalies.push({
                id: `DYN-COAUTH-${detectedAnomalies.length + 1}`,
                code: `ERR-COAUTH-${file.path.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '')}`,
                title: 'Violação Regra 3: Tag de coautoria detectada',
                description: 'Detectada menção ou tag de coautoria de IA. A autoria pertence exclusivamente a Marco Antônio Conceição.',
                phase,
                phaseName,
                targetFile: file.path,
                severity: 'alto',
                status: 'pendente',
                decisionRef: 'D2',
                isHeavyDebt: false,
                module: file.path.split('/')[1] || 'Meta',
                updatedAt: new Date().toISOString().split('T')[0],
              });
            }

            // 3. Check for Swallowed Exceptions (D14)
            if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(content) || /\.catch\(\s*\(\)\s*=>\s*\{\s*\}\s*\)/.test(content) || /except(\s+\w+)?:\s*(pass|\.\.\.)/.test(content)) {
              detectedAnomalies.push({
                id: `DYN-CATCH-${detectedAnomalies.length + 1}`,
                code: `ERR-CATCH-${file.path.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '')}`,
                title: 'Tratamento Inadequado: Bloco catch/except vazio detectado',
                description: 'Exceção silenciada sem logging estruturado ou propagação de erro formal.',
                phase,
                phaseName,
                targetFile: file.path,
                severity: 'critico',
                status: 'pendente',
                decisionRef: 'D14',
                isHeavyDebt: false,
                module: file.path.split('/')[1] || 'Core',
                updatedAt: new Date().toISOString().split('T')[0],
              });
            }

            // 4. Check for God Function / High Cyclomatic Complexity (> 80 lines or C44)
            const branchMatches = (content.match(/\b(if|else if|elif|for|while|case|catch|\?\?|\?:|match)\b/g) || []).length;
            const isHeavyDebt = lines.length > 80 || branchMatches > 10 || lowerPath.includes('pipelinecore');
            if (isHeavyDebt) {
              detectedAnomalies.push({
                id: `DYN-DEBT-${detectedAnomalies.length + 1}`,
                code: lowerPath.includes('pipelinecore') ? 'C44' : `HEAVY-${file.path.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '')}`,
                title: `Dívida Técnica Pesada: ${lines.length} linhas / ${branchMatches} desvios`,
                description: 'Complexidade ciclomática elevada ou God Object. Sujeito à regra estrita de 1 arquivo por PR.',
                phase,
                phaseName,
                targetFile: file.path,
                severity: 'critico',
                status: 'pendente',
                decisionRef: 'D4',
                isHeavyDebt: true,
                module: file.path.split('/')[1] || 'Core',
                updatedAt: new Date().toISOString().split('T')[0],
              });
            }

            // 5. Check for Loose Package dependencies (in package.json)
            if (lowerPath.endsWith('package.json') && /"esbuild":\s*"\^0\.25/.test(content)) {
              detectedAnomalies.push({
                id: `DYN-PEER-${detectedAnomalies.length + 1}`,
                code: 'BUILD-PEER-ESBUILD',
                title: 'Conflito de Build Vercel: Peer dependency colidindo entre esbuild e vite',
                description: 'Fixar versão de esbuild com override e habilitar legacy-peer-deps para garantir CI verde.',
                phase: 13,
                phaseName: 'Fase 13 - Tooling, Linter & CI/CD Pipeline',
                targetFile: file.path,
                severity: 'critico',
                status: 'pendente',
                decisionRef: 'D11',
                isHeavyDebt: false,
                module: 'Tooling',
                updatedAt: new Date().toISOString().split('T')[0],
              });
            }

            // GraphRAG Context: Mapear dependência real do arquivo fonte ao teste físico correspondente
            const fileNameOnly = file.path.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
            const possibleTests = [
              `${file.path.replace(/\.[^/.]+$/, '')}.test.ts`,
              `${file.path.replace(/\.[^/.]+$/, '')}.spec.ts`,
              `tests/unit/${fileNameOnly}.test.ts`,
              `tests/${fileNameOnly}.test.ts`,
              `tests/test_${fileNameOnly}.py`,
              `tests/${fileNameOnly}_test.rs`,
              `test/${fileNameOnly}.t.sol`
            ];
            const existingTest = allBlobs.find(b => possibleTests.some(pt => b.path.toLowerCase().endsWith(pt.toLowerCase())));
            const resolvedTestFile = existingTest ? existingTest.path : `tests/unit/${fileNameOnly}.test.ts`;

            // 6. Check for Weak Typing `any` (in TypeScript files)
            if (lowerPath.endsWith('.ts') && !lowerPath.endsWith('.d.ts') && /\bany\b/.test(content) && !content.includes('// eslint-disable')) {
              detectedAnomalies.push({
                id: `DYN-ANY-${detectedAnomalies.length + 1}`,
                code: `ERR-TYPING-${file.path.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '')}`,
                title: 'Tipagem Fraca: Uso de tipo `any` sem contrato estrito',
                description: 'Substituir `any` por tipos discriminados, genéricos restritos ou contratos Zod.',
                phase,
                phaseName,
                targetFile: file.path,
                testFile: resolvedTestFile,
                severity: 'medio',
                status: 'pendente',
                decisionRef: 'D18',
                isHeavyDebt: false,
                module: file.path.split('/')[1] || 'Domain',
                updatedAt: new Date().toISOString().split('T')[0],
              });
            }

            // 7. Nexa Med / SUS & LGPD Conformity Checks
            if (lowerPath.includes('med') || lowerPath.includes('health') || lowerPath.includes('sus') || lowerPath.includes('patient') || lowerPath.includes('paciente')) {
              // Plaintext CPF / CNS or unhashed identifiers
              if (/(cpf|cns|prontuario|rg)\s*:\s*['"][0-9.-]{9,}['"]/i.test(content) || /console\.log\([^)]*(cpf|paciente|prontuario|cns)/i.test(content)) {
                detectedAnomalies.push({
                  id: `DYN-LGPD-${detectedAnomalies.length + 1}`,
                  code: 'NEXAMED-LGPD-LEAK',
                  title: 'Violação LGPD / Nexa Med: Identificador de saúde (CPF/CNS/Prontuário) exposto em texto claro',
                  description: 'Dados sensíveis de saúde devem ser criptografados em repouso e em trânsito com pseudonimização auditável.',
                  phase: 3,
                  phaseName: 'Fase 3 - Security Hardening & Secret Guards',
                  targetFile: file.path,
                  testFile: resolvedTestFile,
                  severity: 'critico',
                  status: 'pendente',
                  decisionRef: 'D31',
                  isHeavyDebt: false,
                  module: 'Saúde/LGPD',
                  updatedAt: new Date().toISOString().split('T')[0],
                });
              }

              // DATASUS / RNDS / FHIR Interoperability contract validation
              if (/class\s+\w+Patient|interface\s+\w+Patient/i.test(content) && !/cns|rnds|fhir/i.test(content)) {
                detectedAnomalies.push({
                  id: `DYN-SUS-${detectedAnomalies.length + 1}`,
                  code: 'NEXAMED-SUS-INTEROP',
                  title: 'Conformidade SUS / DATASUS: Contrato de paciente sem suporte a CNS/RNDS',
                  description: 'Modelos de saúde devem implementar identificadores e interoperabilidade com padrões do SUS e da RNDS (Rede Nacional de Dados em Saúde).',
                  phase: 12,
                  phaseName: 'Fase 12 - Core Domain & Typed Contracts',
                  targetFile: file.path,
                  testFile: resolvedTestFile,
                  severity: 'alto',
                  status: 'pendente',
                  decisionRef: 'D32',
                  isHeavyDebt: false,
                  module: 'Saúde/SUS',
                  updatedAt: new Date().toISOString().split('T')[0],
                });
              }
            }

            // 8. Slip Pay / Web3 & Smart Contracts Conformity Checks
            if (lowerPath.endsWith('.sol') || lowerPath.includes('web3') || lowerPath.includes('crypto') || lowerPath.includes('pay')) {
              if (content.includes('.call{value:') && !content.includes('nonReentrant') && !content.includes('ReentrancyGuard')) {
                detectedAnomalies.push({
                  id: `DYN-WEB3-${detectedAnomalies.length + 1}`,
                  code: 'SLIPPAY-REENTRANCY',
                  title: 'Vulnerabilidade Web3 / Slip Pay: Chamada de valor externo sem ReentrancyGuard',
                  description: 'Transferências de ETH/tokens devem utilizar o padrão Checks-Effects-Interactions ou o modificador nonReentrant da OpenZeppelin.',
                  phase: 3,
                  phaseName: 'Fase 3 - Security Hardening & Secret Guards',
                  targetFile: file.path,
                  testFile: resolvedTestFile,
                  severity: 'critico',
                  status: 'pendente',
                  decisionRef: 'D29',
                  isHeavyDebt: false,
                  module: 'Web3/Security',
                  updatedAt: new Date().toISOString().split('T')[0],
                });
              }
            }

            // 9. Go / Goroutine & Resource Leak Detection
            if (lowerPath.endsWith('.go')) {
              if ((content.includes('http.Get(') || content.includes('http.Post(')) && !content.includes('.Body.Close()')) {
                detectedAnomalies.push({
                  id: `DYN-GO-LEAK-${detectedAnomalies.length + 1}`,
                  code: 'GO-RESOURCE-LEAK-HTTP',
                  title: 'Vazamento de Recurso em Go: Resposta HTTP sem defer resp.Body.Close()',
                  description: 'Conexões HTTP abertas em Go mantêm sockets e descritores de arquivo alocados se o corpo não for fechado explicitamente.',
                  phase: 1,
                  phaseName: 'Fase 1 - Performance Optimization & Cache',
                  targetFile: file.path,
                  testFile: resolvedTestFile,
                  severity: 'alto',
                  status: 'pendente',
                  decisionRef: 'D26',
                  isHeavyDebt: false,
                  module: 'Infra/Go',
                  updatedAt: new Date().toISOString().split('T')[0],
                });
              }
            }

            // 10. Concurrency Hazard & Race Condition Detection (Universal)
            if (/(go\s+func\(|new\s+Thread\(|\.runAsync\(|pthread_create|std::thread)/i.test(content) && 
                !/(sync\.Mutex|sync\.RWMutex|synchronized|atomic\.|Lock|std::mutex)/i.test(content)) {
              detectedAnomalies.push({
                id: `DYN-CONCURRENCY-${detectedAnomalies.length + 1}`,
                code: 'CONCURRENCY-UNSYNC-HAZARD',
                title: 'Risco de Concorrência: Thread/Goroutine assíncrona sem primitiva de sincronização visível',
                description: 'Acesso a estado compartilhado em múltiplas threads sem Mutex, Channel ou Atomic pode causar race conditions ou corrupção de memória.',
                phase: 1,
                phaseName: 'Fase 1 - Performance Optimization & Cache',
                targetFile: file.path,
                testFile: resolvedTestFile,
                severity: 'alto',
                status: 'pendente',
                decisionRef: 'D27',
                isHeavyDebt: false,
                module: 'Concurrency',
                updatedAt: new Date().toISOString().split('T')[0],
              });
            }
          } catch {
            // continue scan on file fetch failure
          }
        }));
      }

      return res.status(200).json({
        totalFilesScanned: scannedCount,
        anomaliesCount: detectedAnomalies.length,
        anomalies: detectedAnomalies,
        summary: `Varredura dinâmica profunda concluída: ${scannedCount} arquivos físicos inspecionados. ${detectedAnomalies.length} anomalias reais mapeadas da Fase 13 à Fase 0.`
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 5. GitHub Actions: CI-Runner Health Status Endpoint
  app.get('/api/github/actions/runs', async (req: Request, res: Response) => {
    try {
      const owner = (req.query.owner as string) || process.env.GITHUB_REPO_OWNER;
      const repo = (req.query.repo as string) || process.env.GITHUB_REPO_NAME;

      if (!owner || !repo) {
        return res.status(400).json({ error: 'owner e repo são obrigatórios' });
      }

      const headers = getGitHubHeaders(req);
      const runsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=5`, { headers });

      if (!runsRes.ok) {
        const errJson = await runsRes.json().catch(() => ({}));
        return res.status(runsRes.status).json({
          error: `Falha ao consultar GitHub Actions runs: ${errJson.message || runsRes.statusText}`
        });
      }

      const runsData = await runsRes.json();
      const runs = (runsData.workflow_runs || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        head_branch: r.head_branch,
        head_sha: r.head_sha?.slice(0, 7),
        status: r.status, // completed, in_progress, queued
        conclusion: r.conclusion, // success, failure, cancelled, null
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
      return res.status(500).json({ error: err.message });
    }
  });

  // 6. GitHub Actions: Workflow Inspector (CI-Aware Generation)
  app.get('/api/github/actions/workflows', async (req: Request, res: Response) => {
    try {
      const owner = (req.query.owner as string) || process.env.GITHUB_REPO_OWNER;
      const repo = (req.query.repo as string) || process.env.GITHUB_REPO_NAME;
      const branch = (req.query.branch as string) || 'main';

      if (!owner || !repo) {
        return res.status(400).json({ error: 'owner e repo são obrigatórios' });
      }

      const headers = getGitHubHeaders(req);
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      if (!treeRes.ok) {
        return res.status(treeRes.status).json({ error: 'Falha ao buscar árvore de arquivos.' });
      }

      const treeData = await treeRes.json();
      const workflowFiles = (treeData.tree || []).filter((item: any) => 
        item.type === 'blob' && item.path.startsWith('.github/workflows/') && (item.path.endsWith('.yml') || item.path.endsWith('.yaml'))
      );

      const parsedWorkflows: any[] = [];
      for (const wf of workflowFiles) {
        try {
          const fileRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${wf.path}?ref=${branch}`, { headers });
          if (!fileRes.ok) continue;
          const fileJson = await fileRes.json();
          if (!fileJson.content) continue;
          const content = Buffer.from(fileJson.content, 'base64').toString('utf-8');

          // Extract basic CI-runner specifications
          const nodeVersions = content.match(/node-version:\s*(\[[^\]]+\]|['"]?[0-9x.]+['"]?)/i)?.[1] || null;
          const pythonVersions = content.match(/python-version:\s*(\[[^\]]+\]|['"]?[0-9x.]+['"]?)/i)?.[1] || null;
          const goVersions = content.match(/go-version:\s*(\[[^\]]+\]|['"]?[0-9x.]+['"]?)/i)?.[1] || null;
          const runsOn = content.match(/runs-on:\s*([^\n\r]+)/i)?.[1]?.trim() || 'ubuntu-latest';
          
          const commands: string[] = [];
          if (content.includes('npm test')) commands.push('npm test');
          if (content.includes('npm run lint') || content.includes('eslint')) commands.push('npm run lint');
          if (content.includes('cargo test')) commands.push('cargo test');
          if (content.includes('pytest')) commands.push('pytest');
          if (content.includes('go test')) commands.push('go test ./...');

          parsedWorkflows.push({
            path: wf.path,
            runsOn,
            runtimes: {
              node: nodeVersions,
              python: pythonVersions,
              go: goVersions,
            },
            commands,
            contentSnippet: content.slice(0, 500)
          });
        } catch {
          // ignore single workflow error
        }
      }

      return res.status(200).json({
        totalWorkflows: parsedWorkflows.length,
        workflows: parsedWorkflows,
        summary: `Inspeção de CI concluída: ${parsedWorkflows.length} workflows do GitHub Actions analisados.`
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 7. One-Click Real Pull Request & Atomic Commit via GitHub API
  app.post('/api/github/pr/create', async (req: Request, res: Response) => {
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
        return res.status(400).json({ error: 'owner, repo, branchName, filePath, fileContent e prTitle são obrigatórios' });
      }

      const headers = getGitHubHeaders(req);

      // 1. Get base branch ref SHA
      const baseRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, { headers });
      if (!baseRefRes.ok) {
        const errJson = await baseRefRes.json().catch(() => ({}));
        return res.status(baseRefRes.status).json({
          error: `Base branch '${baseBranch}' não encontrada: ${errJson.message || baseRefRes.statusText}`
        });
      }
      const baseRefData = await baseRefRes.json();
      const baseSha = baseRefData.object.sha;

      // 2. Create new branch if it doesn't exist
      const createBranchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      });

      // Ignore 422 if branch already exists
      if (!createBranchRes.ok && createBranchRes.status !== 422) {
        const errJson = await createBranchRes.json().catch(() => ({}));
        return res.status(createBranchRes.status).json({
          error: `Falha ao criar branch '${branchName}': ${errJson.message || createBranchRes.statusText}`
        });
      }

      // 3. Get existing file SHA if updating
      let existingFileSha: string | undefined;
      const getFileRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branchName}`, { headers });
      if (getFileRes.ok) {
        const fileJson = await getFileRes.json();
        existingFileSha = fileJson.sha;
      }

      // 4. Commit updated file with pure human authorship (Marco Antonio Conceicao)
      const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
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
        const errJson = await commitRes.json().catch(() => ({}));
        return res.status(commitRes.status).json({
          error: `Falha ao realizar commit no arquivo ${filePath}: ${errJson.message || commitRes.statusText}`
        });
      }

      // 5. Open Pull Request on GitHub
      const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
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
        const errJson = await prRes.json().catch(() => ({}));
        // If PR already exists, try to get existing PR
        if (prRes.status === 422 && errJson.message?.includes('A pull request already exists')) {
          return res.status(200).json({
            success: true,
            alreadyExisted: true,
            branch: branchName,
            message: `Branch ${branchName} atualizada com o commit cirúrgico. Já existe uma PR aberta para esta branch.`
          });
        }
        return res.status(prRes.status).json({
          error: `Falha ao criar Pull Request: ${errJson.message || prRes.statusText}`
        });
      }

      const prData = await prRes.json();
      return res.status(201).json({
        success: true,
        prUrl: prData.html_url,
        prNumber: prData.number,
        branch: branchName,
        message: `Pull Request #${prData.number} criada com sucesso no GitHub!`
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Tratamento infalível de rotas de API inexistentes (retorna sempre JSON, nunca HTML)
  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint de API não encontrado no servidor EGC.',
      code: 'API_ENDPOINT_NOT_FOUND',
      statusCode: 404
    });
  });

  // Middleware global de tratamento de erros para garantir sempre resposta JSON estruturada
  app.use((err: any, _req: Request, res: Response, _next: any) => {
    console.error('Erro interceptado no pipeline Express:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Erro interno no servidor EGC.',
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: err.status || 500
    });
  });

async function startServer() {
  // Mounting Vite middleware or static files
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EGC Copilot Server rodando na porta ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
