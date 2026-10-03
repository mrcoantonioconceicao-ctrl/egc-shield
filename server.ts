import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

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

startServer();
