/**
 * Ponto de entrada de funções serverless do Vercel para o EGC.
 * Envolve a execução do Express num bloco global try/catch para eliminar
 * qualquer possibilidade de erro HTTP 500 (FUNCTION_INVOCATION_FAILED).
 *
 * Autor: Marco Antônio Conceição
 * Regras: Decisão D2 (Autoria 100% humana) e Decisão D3 (Sem travessões unicode)
 */
import { apiApp } from '../src/server/apiApp';

export default async function handler(req: any, res: any) {
  try {
    // 1. Headers Globais de CORS e JSON
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-github-token');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // Resposta imediata para preflight OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // 2. Executa o roteador Express de forma assíncrona blindada
    return await new Promise<void>((resolve) => {
      apiApp(req, res, () => {
        if (!res.headersSent) {
          res.status(404).json({
            success: false,
            error: `Endpoint de API '${req.method} ${req.url}' não encontrado no ambiente serverless Vercel.`,
            code: 'API_ENDPOINT_NOT_FOUND',
            statusCode: 404,
          });
        }
        resolve();
      });
    });
  } catch (err: any) {
    // 3. Captura defensiva de qualquer exceção interna ou falha de invocação
    console.error('Exceção crítica capturada no handler serverless do Vercel:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Erro interno na função serverless do Vercel.',
        stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
        code: 'FUNCTION_INVOCATION_RECOVERED',
        statusCode: 500,
      });
    }
  }
}
