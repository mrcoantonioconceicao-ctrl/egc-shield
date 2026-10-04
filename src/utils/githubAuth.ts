/**
 * Utilitário de Autenticação e Interceptação do GitHub para o EGC.
 * Valida a integridade e formato de Tokens PAT antes de qualquer chamada à API
 * e intercepta erros 401/403 ("Bad credentials") para exibição defensiva na interface.
 *
 * Autor: Marco Antônio Conceição
 * Regras: Decisão D2 (Autoria 100% humana) e Decisão D3 (Sem travessões unicode)
 */

export type GitHubTokenType = 'classic' | 'fine-grained' | 'hex-legacy' | 'unknown' | 'none';

export interface TokenValidationResult {
  isValid: boolean;
  token: string;
  tokenType: GitHubTokenType;
  error?: string;
  recommendation?: string;
}

export interface GitHubAuthErrorInfo {
  statusCode: number;
  message: string;
  isBadCredentials: boolean;
  timestamp: string;
  endpoint?: string;
  recommendation: string;
}

export class GitHubAuthError extends Error {
  public statusCode: number;
  public isBadCredentials: boolean;
  public endpoint?: string;
  public recommendation: string;

  constructor(info: {
    message: string;
    statusCode: number;
    isBadCredentials?: boolean;
    endpoint?: string;
    recommendation?: string;
  }) {
    super(info.message);
    this.name = 'GitHubAuthError';
    this.statusCode = info.statusCode;
    this.isBadCredentials = info.isBadCredentials ?? (info.statusCode === 401 || info.statusCode === 403);
    this.endpoint = info.endpoint;
    this.recommendation = info.recommendation || 'Gere um novo Personal Access Token (PAT) clássico no GitHub com os escopos "repo" e "workflow".';
  }
}

// 1. Validação Sintática e de Formato de Token PAT (Antes de Qualquer Chamada de Rede)
export function validateGitHubTokenFormat(token?: string | null): TokenValidationResult {
  const cleanToken = (token || '').trim();

  if (!cleanToken) {
    return {
      isValid: false,
      token: '',
      tokenType: 'none',
      error: 'Token do GitHub não fornecido.',
      recommendation: 'Configure um Personal Access Token clássico no cabeçalho ou nas variáveis de ambiente.',
    };
  }

  // Verifica quebras de linha ou espaços internos ilegais
  if (/\s/.test(cleanToken)) {
    return {
      isValid: false,
      token: cleanToken,
      tokenType: 'unknown',
      error: 'O token fornecido contém espaços ou quebras de linha inválidas.',
      recommendation: 'Remova espaços antes e depois do token.',
    };
  }

  // Identificação do padrão de token oficial do GitHub
  let tokenType: GitHubTokenType = 'unknown';
  if (cleanToken.startsWith('ghp_')) {
    tokenType = 'classic';
  } else if (cleanToken.startsWith('github_pat_')) {
    tokenType = 'fine-grained';
  } else if (/^[a-f0-9]{40}$/i.test(cleanToken)) {
    tokenType = 'hex-legacy';
  }

  // Checagem de comprimento mínimo operacional
  if (cleanToken.length < 20) {
    return {
      isValid: false,
      token: cleanToken,
      tokenType,
      error: 'Comprimento de token inválido. O token deve possuir no mínimo 20 caracteres.',
      recommendation: 'Tokens clássicos do GitHub (ghp_) possuem 40 caracteres alfanuméricos.',
    };
  }

  return {
    isValid: true,
    token: cleanToken,
    tokenType,
  };
}

// 2. Helper para Construção Segura de Headers de Autenticação
export function getGitHubAuthHeaders(token?: string | null): Record<string, string> {
  const validation = validateGitHubTokenFormat(token);
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'EGC-Copilot-Engine',
  };

  if (validation.isValid) {
    headers['Authorization'] = `token ${validation.token}`;
    headers['x-github-token'] = validation.token;
  }

  return headers;
}

// 3. Sistema Reativo de Assinatura para Interceptação de Erros 401/403 ("Bad credentials")
type AuthErrorListener = (error: GitHubAuthErrorInfo | null) => void;
const authErrorListeners: Set<AuthErrorListener> = new Set();
let currentAuthError: GitHubAuthErrorInfo | null = null;

export function subscribeGitHubAuthErrors(listener: AuthErrorListener): () => void {
  authErrorListeners.add(listener);
  // Notifica o estado atual imediatamente
  listener(currentAuthError);
  return () => {
    authErrorListeners.delete(listener);
  };
}

export function notifyGitHubAuthError(error: GitHubAuthErrorInfo | null): void {
  currentAuthError = error;
  authErrorListeners.forEach((listener) => {
    try {
      listener(error);
    } catch (listenerErr) {
      console.error('Erro ao notificar listener de autenticação GitHub:', listenerErr);
    }
  });
}

export function clearGitHubAuthError(): void {
  notifyGitHubAuthError(null);
}

export function getCurrentGitHubAuthError(): GitHubAuthErrorInfo | null {
  return currentAuthError;
}

// 4. Interceptor Defensivo para Chamadas de API
export async function executeWithAuthInterception<T>(
  apiCall: () => Promise<T>,
  options?: {
    endpointName?: string;
    token?: string | null;
    skipTokenValidation?: boolean;
  }
): Promise<T> {
  // Validação prévia opcional antes de disparar o fetch
  if (!options?.skipTokenValidation && options?.token !== undefined) {
    const validation = validateGitHubTokenFormat(options.token);
    if (!validation.isValid && validation.tokenType === 'none') {
      const authErr = new GitHubAuthError({
        message: validation.error || 'Token clássico do GitHub não configurado.',
        statusCode: 401,
        isBadCredentials: true,
        endpoint: options.endpointName,
        recommendation: validation.recommendation,
      });

      notifyGitHubAuthError({
        statusCode: 401,
        message: authErr.message,
        isBadCredentials: true,
        timestamp: new Date().toLocaleTimeString(),
        endpoint: options.endpointName,
        recommendation: authErr.recommendation,
      });

      throw authErr;
    }
  }

  try {
    const result = await apiCall();

    // Se o payload indicar authError retornado estruturado pela API
    const anyResult = result as any;
    if (anyResult && typeof anyResult === 'object' && anyResult.authError) {
      const authErrInfo: GitHubAuthErrorInfo = {
        statusCode: 401,
        message: anyResult.message || anyResult.error || 'Falha de autenticação ("Bad credentials").',
        isBadCredentials: true,
        timestamp: new Date().toLocaleTimeString(),
        endpoint: options?.endpointName,
        recommendation: 'Atualize o token PAT com os escopos "repo" e "workflow" no GitHub.',
      };
      notifyGitHubAuthError(authErrInfo);
    } else {
      // Se a chamada foi bem-sucedida e tínhamos um erro registrado deste endpoint, limpamos
      if (currentAuthError && options?.endpointName && currentAuthError.endpoint === options.endpointName) {
        clearGitHubAuthError();
      }
    }

    return result;
  } catch (err: any) {
    const status = err.statusCode || err.status || 0;
    const msg = (err.message || '').toLowerCase();
    const is401Or403 = status === 401 || status === 403;
    const isBadCreds = is401Or403 || msg.includes('bad credentials') || msg.includes('requires authentication') || msg.includes('credentials');

    if (isBadCreds) {
      const errorInfo: GitHubAuthErrorInfo = {
        statusCode: status || 401,
        message: err.message || 'Falha de autenticação com o GitHub ("Bad credentials").',
        isBadCredentials: true,
        timestamp: new Date().toLocaleTimeString(),
        endpoint: options?.endpointName,
        recommendation: 'O token PAT informado expirou ou não possui as permissões necessárias. Gere um novo token clássico com escopos "repo" e "workflow".',
      };

      notifyGitHubAuthError(errorInfo);

      throw new GitHubAuthError({
        message: errorInfo.message,
        statusCode: errorInfo.statusCode,
        isBadCredentials: true,
        endpoint: options?.endpointName,
        recommendation: errorInfo.recommendation,
      });
    }

    throw err;
  }
}
