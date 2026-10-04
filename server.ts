/**
 * Servidor Full-Stack Node.js / Express para o EGC.
 * Utiliza o apiApp resiliente e monta middleware do Vite (em dev) ou ativos estáticos (em prod).
 *
 * Autor: Marco Antônio Conceição
 * Regras: Decisão D2 (Autoria 100% humana) e Decisão D3 (Sem travessões unicode)
 */
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiApp } from './src/server/apiApp';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Monta todas as rotas de API isoladas e blindadas
app.use(apiApp);

async function startServer() {
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
