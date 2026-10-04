/**
/**
 * Cliente HTTP infalível para o sistema EGC.
 * Elimina definitivamente o erro 'Unexpected token T, is not valid JSON'.
 * Garante que respostas HTML (404/500 do Vercel ou Cloud Run) sejam
 * interceptadas e transformadas em erros estruturados e legíveis.
 *
 * Autor: Marco Antônio Conceição
 * Regra: Decisão D2 (Autoria 100% humana) e Decisão D3 (Sem travessões unicode)
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export class ApiError extends Error {
  public statusCode: number;
  public rawBody?: string;
  public isHtmlError: boolean;

  constructor(message: string, statusCode: number, rawBody?: string, isHtmlError = false) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.rawBody = rawBody;
    this.isHtmlError = isHtmlError;
  }
}

/**
 * Executa fetch garantindo que apenas respostas com content-type 'application/json'
 * sejam parseadas via response.json(). Se vier HTML de erro do Vercel,
 * extrai a mensagem limpa e impede a quebra do parser JSON.
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch (networkErr: any) {
    throw new ApiError(
      `Falha de conexão com o servidor EGC: ${networkErr.message || 'Sem conexão com a rede.'}`,
      0
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  if (!isJson) {
    // Captura o corpo em texto para analisar se é página HTML de erro do Vercel / Gateway
    const rawText = await response.text();
    const isHtml = rawText.trim().startsWith('<') || rawText.includes('<!DOCTYPE html>') || rawText.includes('<html');

    let cleanErrorMessage = '';
    if (isHtml) {
      // Extrai título ou cabeçalho do HTML de erro se possível
      const titleMatch = rawText.match(/<title[^>]*>([^<]+)<\/title>/i);
      const h1Match = rawText.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const extractedTitle = titleMatch?.[1] || h1Match?.[1] || 'Servidor retornou página HTML de erro';
      cleanErrorMessage = `Erro no ambiente Vercel/Servidor (${response.status} ${response.statusText}): ${extractedTitle.trim()}. Endpoint pode estar com rota incorreta ou serviço reiniciando.`;
    } else {
      cleanErrorMessage = rawText.trim() 
        ? `Resposta inesperada do servidor (${response.status}): ${rawText.slice(0, 200)}`
        : `Servidor retornou status ${response.status} sem conteúdo JSON.`;
    }

    throw new ApiError(cleanErrorMessage, response.status, rawText, isHtml);
  }

  // Content-type é JSON garantido
  let data: any;
  try {
    data = await response.json();
  } catch (parseErr: any) {
    const rawText = await response.text().catch(() => '');
    throw new ApiError(
      `Falha ao decodificar JSON do servidor (${response.status}): ${parseErr.message}`,
      response.status,
      rawText
    );
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Erro HTTP ${response.status}: ${response.statusText}`;
    throw new ApiError(errorMsg, response.status, JSON.stringify(data));
  }

  return data as T;
}
