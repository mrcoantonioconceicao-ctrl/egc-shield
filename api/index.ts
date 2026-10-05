/**
 * Ponto de entrada de funções serverless do Vercel para o EGC.
 * Re-exporta a lógica central de src/api/index.ts para garantir bloco try/catch global,
 * retorno de erro estruturado 500 e validação de GITHUB_CLASSIC_TOKEN.
 *
 * Autor: Marco Antônio Conceição
 * Regras: Decisão D2 (Autoria 100% humana) e Decisão D3 (Sem travessões unicode)
 */
import handler, { validateClassicTokenPresence, ServerlessErrorResponse } from '../src/api/index';

export { validateClassicTokenPresence };
export type { ServerlessErrorResponse };

export default handler;
