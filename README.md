# Enterprise GraphRAG Context (EGC)

Centro de comando e motor universal de engenharia cirúrgica para análise semântica de código, compreensão de intenção arquitetural (GraphRAG + AST), monitoramento de saúde do GitHub Actions e despacho atômico de Pull Requests.

## Autor Exclusivo
- Marco Antônio Conceição (mrcoantonioconceicao@gmail.com)
- Política de Autoria: Estritamente humana. Proibida qualquer menção ou tag de coautoria de IA em commits, pull requests ou documentação (Decisão D2).

---

## Princípio Operacional: Execução Bottom-Up (Fase 13 a Fase 0)
O plano opera rigorosamente de baixo para cima, garantindo estabilidade de infraestrutura, dependências e contratos antes de qualquer alteração em regras de negócio:

1. Fase 13: Tooling, Linter & CI/CD Pipeline (npm peer-deps, esbuild/vite, scripts)
2. Fase 12: Core Domain & Typed Contracts (interfaces e contratos imutáveis)
3. Fase 11: Shared Infrastructure & Cypher Sanitization (S12 e prevenção de injection)
4. Fase 10: Database Layer & ACID Transactions (C30 e resource leaks)
5. Fase 9: Vector Store & Embeddings Pipeline (C44 - dívida pesada: 1 arquivo por PR)
6. Fase 8: Knowledge Graph & Entity Extraction (AST parsers e extratores de código)
7. Fase 7: Hybrid Retrieval & Ranking Engine (Graph traversal e busca vetorial)
8. Fase 6: LLM Adapters & Prompt Engineering (orquestração de modelos de contexto)
9. Fase 5: API Gateway & Transport Layer (rotas e controladores desacoplados)
10. Fase 4: Evaluation & Observability (telemetria e benchmarks)
11. Fase 3: Security Hardening & Secret Guards (auditoria de credenciais e rate limits)
12. Fase 2: E2E Integration Test Suite (testes de carga e regressão)
13. Fase 1: Performance Optimization & Cache (gestão de pools e locks)
14. Fase 0: Zero-Defect Release Gate (validação final de qualidade)

---

## Regras Absolutas da Casa

1. Sinceridade e Verdade: Análise técnica direta, implacável e mensurável. Zero dados fictícios, simulações ou mocks no código de produção.
2. Formato de Texto Estrito: Proibido o uso de travessões unicode ("—" ou "–"). Utilizar unicamente hífen simples ("-") em qualquer texto, código, commit ou PR (Decisão D3).
3. Autoria Exclusiva: Autoria 100% de Marco Antônio Conceição em todos os artefatos.
4. Qualidade e CI: Todo código vem acompanhado de testes unitários com 100% de cobertura no delta alterado. Respeito estrito a Clean Code, DDD, SOA e análise formal de AST.
5. Atomicidade Cirúrgica em Dívidas Pesadas (C44): Para o achado crítico C44 e dívidas complexas, aplica-se estritamente a regra de exatamente um arquivo físico por PR, preservando o comportamento existente e deixando o validador por último (Decisão D4).

---

## Monitor de Saúde do CI-Runner (CiRunnerMonitor - Traffic Light)

Localizado no cabeçalho superior e diretamente ao lado da barra do token do GitHub (`CiRunnerMonitor`), este componente integra-se com a Status API e Actions API do GitHub para consultar a saúde das execuções recentes de workflow via polling automático (a cada 20 segundos):

- **Indicador Estilo Semáforo (Traffic Light)**:
  - **`System Green`**: Lente verde acesa com brilho ativo. Todas as execuções recentes foram concluídas com sucesso (`PASS`). Esteira 100% liberada e segura para novos commits.
  - **`Build Warning`**: Lente âmbar/amarela pulsante acesa. Execução de workflow em andamento (`in_progress`) ou na fila (`queued`). Alerta preventivo para aguardar a conclusão antes de comitar para evitar concorrência no runner.
  - **`Runner Blocked`**: Lente vermelha pulsante acesa. Falha detectada na última execução (`failure`, `timed_out` ou `cancelled`). Esteira bloqueada para novos commits até a remediação da quebra.
- **Histórico e Detalhes**: Popover com o status detalhado, última checagem de polling, lista das últimas 5 runs com commit SHA, branch e link direto para o log no GitHub Actions.
- **Botão de Atualização Manual**: Permite consultar o estado do runner instantaneamente sob demanda.

---

## Inspetor de Compatibilidade de CI (.github/workflows/)

Antes de propor alterações ou gerar remediações, o sistema aciona o endpoint `/api/github/actions/workflows` para ler os arquivos de workflow do GitHub Actions:

- Extração das versões de runtime do runner (Node, Python, Go, Rust, Java).
- Mapeamento dos comandos de teste e linter (`npm test`, `npm run lint`, `cargo test`, `pytest`, `go test ./...`).
- Alinhamento da sintaxe gerada ao ambiente exato da esteira para garantir taxa de aprovação de 100% na primeira tentativa.

---

## Despacho de Pull Requests em Um Clique (One-Click Real PR)

O gerador de Pull Requests (`PrGenerator`) integra-se diretamente à API do GitHub (`/api/github/pr/create`):

1. **Criação de Branch Isolada**: Gera automaticamente uma branch efêmera (ex: `fix/surgical-c44-1234`) a partir da branch base.
2. **Commit Atômico com Autoria Exclusiva**: Grava a alteração cirúrgica de arquivo único com autor e committer definidos exclusivamente como `Marco Antonio Conceicao <mrcoantonioconceicao@gmail.com>`.
3. **Abertura Oficial da PR**: Abre a Pull Request no repositório com título Conventional Commits e corpo detalhado em inglês técnico (Summary, Changes, Proof ancorado no grafo de testes e Compliance Checklist).
4. **Link Imediato**: Retorna o link oficial da PR no GitHub diretamente na interface.

---

## Resiliência de Respostas HTTP/JSON e Roteamento Vercel

Eliminação definitiva dos erros `405 Method Not Allowed` e `Unexpected token 'T', is not valid JSON`:

- **Eliminação do Erro 405 (Method Not Allowed)**:
  - O erro 405 no Vercel ocorria porque requisições `POST` ou `OPTIONS` para rotas de `/api/` sofriam rewrite para `/index.html` (arquivo estático que recusa métodos POST).
  - Configurado rewrite com negative lookahead no `vercel.json`: `/((?!api/).*)` para `/index.html`, garantindo que `/api/*` seja sempre roteado para a função serverless (`api/index.ts` / Express), sem colisão com os ativos estáticos do SPA.
  - Implementado suporte explícito a requisições preflight `OPTIONS` com status 200 OK e cabeçalhos CORS completos (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`).
- **Front-end (`safeFetchJson`)**: O cliente HTTP inspeciona o cabeçalho `content-type` antes de qualquer chamada a `.json()`. Caso o servidor retorne HTML de erro (páginas 404/500 do Vercel ou CDN), o corpo é capturado via `response.text()` e transformado em um erro técnico legível, impedindo o congelamento da interface.
- **Back-end Serverless (`server.ts`, `api/index.ts` & `vercel.json`)**:
  - Middleware forçando `Content-Type: application/json; charset=utf-8` em todas as rotas `/api/*`.
  - Tratamento 404 estrito retornando objeto JSON padronizado para qualquer rota não mapeada.
  - Middleware global de exceção garantindo formato `{ success: false, error: err.message, statusCode: 500 }`.

---

## Módulos Integrados Codecov & CodeRabbit

- **Validação de Cobertura Delta Codecov (`codecovValidator.ts`)**:
  - Exigência determinística de **100.00% de cobertura de delta** nos arquivos alterados.
  - Tabela formatada gerada automaticamente no corpo da Pull Request vinculada à suíte de testes unitários real.
- **Auditoria Pré-Merge CodeRabbit (`codeRabbitReviewer.ts`)**:
  - Varredura de integridade garantindo que rotinas funcionais nunca sejam esvaziadas ou substituídas por stubs/placeholders vazios (`TODO`, `pass`, `catch {}` vazios).
  - Avaliação de risco de fusão classificada como `LOW` para aprovação imediata em bots de revisão de código.

---

## Comandos do Portão Local (Local Quality Gate)

Antes de qualquer commit ou submissão de PR, todos os portões abaixo devem retornar código de saída 0:

```bash
# 1. Checagem contra travessões proibidos (U+2014 e U+2013)
! git diff --cached | grep -P "[\x{2013}\x{2014}]"

# 2. Verificação de autoria exclusiva de Marco Antônio Conceição
test "$(git config user.name)" = "Marco Antônio Conceição" && ! git log -1 --pretty=format:"%b" | grep -Ei "co-authored-by|generated-by"

# 3. Verificação de arquivo único para C44 e dívidas pesadas
test "$(git diff --cached --name-only | wc -l)" -le 1

# 4. Checagem estrita de tipos TypeScript (AST)
npm run lint

# 5. Build de produção
npm run build
```

---

## Padrão Obrigatório de Pull Request

Toda Pull Request deve ser redigida em inglês técnico direto, estruturada obrigatoriamente no template:

```markdown
## Summary
Concise and imperative explanation of the architectural remediation.

- Target Phase: Phase X (Bottom-Up)
- Finding ID: C44 / ACH-XXX / DYN-XXX
- Decision Reference: D4
- Target File: `path/to/single_file.ts`
- Author: Marco Antonio Conceicao (mrcoantonioconceicao@gmail.com)

## Changes
- Exact itemized description of the surgical changes introduced.
- Strict preservation of existing contracts and public API signatures.
- Decoupling of heavy debts into isolated adapters.

## Proof
\`\`\`text
PASS tests/unit/pipelineCore.test.ts (100% delta coverage)
EXIT_CODE 0 - scripts/verify-local-gate.sh passed all checks with zero em-dashes and green typecheck.
Local gate status: GREEN.
\`\`\`

## Compliance Checklist
- [x] Zero em-dash characters used (only simple hyphen '-')
- [x] Exclusive human authorship by Marco Antonio Conceicao (no AI co-authorship)
- [x] Strict atomic scope (single-file modified for heavy debt)
- [x] Grounded test path proof verified via GraphRAG dependency edge
```
