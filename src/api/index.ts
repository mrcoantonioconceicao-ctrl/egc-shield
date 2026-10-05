/**
 * Ponto de entrada de funções serverless em src/api/ para o EGC (Enterprise GraphRAG Context).
 * Implementa bloco try/catch global que captura exceções e retorna objeto JSON estruturado
 * com status 500, além de validar rigorosamente a presença de GITHUB_CLASSIC_TOKEN antes de qualquer execução.
 *
 * Autor: Marco Antônio Conceição
 * Regras: Decisão D2 (Autoria 100% humana) e Decisão D3 (Sem travessões unicode)
 */
import { apiApp } from '../server/apiApp';

export interface ServerlessErrorResponse {
  success: false;
  error: string;
  code: string;
  statusCode: number;
  stack?: string;
  timestamp: string;
}

/**
 * Valida rigorosamente a presença e formato do token clássico do GitHub (GITHUB_CLASSIC_TOKEN)
 * antes de qualquer execução no ambiente serverless.
 * Descarta placeholders como 'True', 'false', 'undefined' ou strings vazias.
 */
export function validateClassicTokenPresence(req: any): { hasToken: boolean; token?: string; error?: string } {
  let token = (
    (req.headers?.['x-github-token'] as string) ||
    (req.headers?.authorization?.replace(/^token\s+/i, '').replace(/^bearer\s+/i, '') as string) ||
    process.env.GITHUB_CLASSIC_TOKEN ||
    ''
  ).trim();

  // Descarta placeholders booleanos comuns de ambientes de container
  if (['true', 'false', 'undefined', 'null', 'your_token', 'token'].includes(token.toLowerCase())) {
    token = '';
  }

  if (!token) {
    return {
      hasToken: false,
      error: 'Variável de ambiente GITHUB_CLASSIC_TOKEN não configurada ou token ausente no cabeçalho x-github-token. A autenticação é obrigatória antes de qualquer execução.',
    };
  }

  // Validação mínima de comprimento e ausência de caracteres ilegais
  if (token.length < 20 || /\s/.test(token)) {
    return {
      hasToken: false,
      error: 'Formato do GITHUB_CLASSIC_TOKEN inválido. O token deve possuir no mínimo 20 caracteres sem espaços ou quebras de linha.',
    };
  }

  return {
    hasToken: true,
    token,
  };
}

/**
 * Handler serverless principal encapsulado em bloco try/catch global.
 * Retorna sempre JSON estruturado com status 500 caso qualquer exceção não tratada ocorra.
 */
export default async function handler(req: any, res: any) {
  try {
    // 1. Headers Globais de CORS e Content-Type JSON
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-github-token'
    );
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // Resposta imediata para requisições preflight OPTIONS (evita travamento do navegador)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // 2. Validação obrigatória da presença e validade de GITHUB_CLASSIC_TOKEN antes de qualquer execução
    const tokenCheck = validateClassicTokenPresence(req);
    if (!tokenCheck.hasToken) {
      return res.status(401).json({
        success: false,
        error: tokenCheck.error,
        code: 'MISSING_GITHUB_CLASSIC_TOKEN',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Execução segura do roteador Express encapsulada em Promise
    return await new Promise<void>((resolve, reject) => {
      try {
        apiApp(req, res, (err: any) => {
          if (err) {
            return reject(err);
          }
          if (!res.headersSent) {
            res.status(404).json({
              success: false,
              error: `Endpoint de API '${req.method} ${req.url}' não encontrado no ambiente serverless.`,
              code: 'API_ENDPOINT_NOT_FOUND',
              statusCode: 404,
              timestamp: new Date().toISOString(),
            });
          }
          resolve();
        });
      } catch (innerErr) {
        reject(innerErr);
      }
    });
  } catch (err: any) {
    // 4. Bloco try/catch global que captura exceções e retorna objeto JSON estruturado com status 500
    console.error('Exceção crítica capturada no handler serverless (src/api/index.ts):', err);
    if (!res.headersSent) {
      const errorPayload: ServerlessErrorResponse = {
        success: false,
        error: err?.message || 'Erro interno na execução da função serverless.',
        code: 'INTERNAL_SERVERLESS_ERROR',
        statusCode: 500,
        stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
        timestamp: new Date().toISOString(),
      };
      return res.status(500).json(errorPayload);
    }
  }
}
