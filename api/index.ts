/**
 * Ponto de entrada de funções serverless do Vercel para o EGC.
 * Encaminha todas as requisições /api/* diretamente para o app Express compilado.
 *
 * Autor: Marco Antônio Conceição
 * Regras: Decisão D2 (Autoria 100% humana) e Decisão D3 (Sem travessões unicode)
 */
import app from '../server';

export default app;
