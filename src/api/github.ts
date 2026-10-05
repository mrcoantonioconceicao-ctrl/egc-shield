/**
 * Handler serverless específico para rotas /api/github/* em src/api/github.ts.
 * Implementa bloco try/catch global com retorno JSON 500 estruturado e validação de GITHUB_CLASSIC_TOKEN.
 *
 * Autor: Marco Antônio Conceição
 * Regras: Decisão D2 (Autoria 100% humana) e Decisão D3 (Sem travessões unicode)
 */
import handler, { validateClassicTokenPresence, ServerlessErrorResponse } from './index';

export { validateClassicTokenPresence };
export type { ServerlessErrorResponse };

export default handler;
