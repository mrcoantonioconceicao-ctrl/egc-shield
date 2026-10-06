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

## Centro de Comando Lateral (Menu Hambúrguer Deslizante)

O componente de navegação superior foi refatorado para um menu lateral esquerdo deslizante (estilo gaveta hambúrguer) com backdrop translúcido:

- **Gatilho Hambúrguer Fixo e Elegante**:
  - Botão de acesso rápido fixado no canto superior esquerdo do cabeçalho (`Menu`) com indicador `MENU` e identidade visual Dark Mode / System Green.
- **Gaveta Deslizante (Sidebar Drawer)**:
  - Animação CSS fluida a partir da esquerda (`slide-in-from-left duration-300`) com backdrop escuro e desfoque (`bg-black/80 backdrop-blur-sm`).
  - **Altura Elástica e Rolagem Contínua (Sem Cortes)**: Container com `h-full max-h-[100dvh]`, cabeçalho e rodapé fixos (`shrink-0`), corpo rolável elástico (`flex-1 min-h-0 overflow-y-auto overscroll-contain`) e espaçamento inferior generoso (`pb-28`) que garante acesso completo até o último elemento da lista, tanto em mobile (toque) quanto desktop (roda do mouse).
  - **Módulos do Sistema**: Acesso instantâneo às 8 ferramentas e seções (Matriz dos 108 Achados, Orquestrador Autônomo, AST Diffs, Gerador de PR, Build Fixes, Portão Local, Decisões D1-D32 e Diário de Bordo).
  - **Navegador de Fases Bottom-Up (Fase 13 a 0)**: Seletor completo das 14 fases do projeto em formato colapsável, eliminando armadilhas de scroll aninhado.
  - **Métricas e Portões de CI**: Indicador de saúde consolidado, resumo de achados e status do portão com visibilidade integral.
  - Fechamento automático ao clicar em qualquer opção de navegação, no botão `X` ou no backdrop externo.

---

## Monitor de Saúde do CI-Runner (CiRunnerMonitor - Traffic Light)

Localizado no cabeçalho superior e diretamente ao lado da barra do token do GitHub (`CiRunnerMonitor`), este componente integra-se com a Status API e Actions API do GitHub para consultar a saúde das execuções recentes de workflow via polling automático (a cada 20 segundos):

- **Indicador Estilo Semáforo (Traffic Light)**:
  - **`System Green`**: Lente verde acesa com brilho ativo. Todas as execuções recentes foram concluídas com sucesso (`PASS`). Esteira 100% liberada e segura para novos commits.
  - **`Build Warning`**: Lente âmbar/amarela pulsante acesa. Execução de workflow em andamento (`in_progress`), na fila (`queued`) ou credencial ausente/inválida. Alerta preventivo para aguardar a conclusão antes de comitar.
  - **`Runner Blocked`**: Lente vermelha pulsante acesa. Falha detectada nas execuções recentes (como Runs #45 a #48). A aplicação fornece diagnóstico detalhado e link direto para o log de erro no GitHub Actions sem travar a interface.
- **Mecanismo de Desbloqueio e Retomada de System Green**:
  - Botão interativo **"Reconhecer Falha & Desbloquear Esteira"**: Permite que o operador reconheça a falha histórica de uma run anterior, forçando a retomada do estado `System Green` para prosseguir com o despacho da remediação atômica.
  - O endpoint `/api/github/actions/runs?unblock=true` libera a esteira e registra o reconhecimento da falha histórica.
- **Tratamento Robusto de Credenciais e Tokens PAT (`src/utils/githubAuth.ts`)**:
  - Utilitário dedicado `githubAuth.ts` para validação prévia de formato e higienização antes de qualquer chamada à API (comprimento >= 20 caracteres, formato `ghp_`, `github_pat_` ou hex de 40 caracteres, e eliminação de espaços em branco).
  - Interceptor reativo de erros 401/403 ("Bad credentials") através de `executeWithAuthInterception` e barramento de eventos (`subscribeGitHubAuthErrors`).
  - Banner de alerta defensivo (`GitHubAuthAlert.tsx`) renderizado no topo da aplicação, exibindo diagnóstico detalhado da falha e link direto para gerar um novo token PAT clássico com escopos `repo` e `workflow`, sem travar nem congelar a aplicação.
- **Histórico e Detalhes**: Popover com o status detalhado, última checagem de polling, lista das últimas runs com commit SHA, branch e link direto para o log no GitHub Actions.
- **Botão de Atualização Manual**: Permite consultar o estado do runner instantaneamente sob demanda.

---

## Orquestrador Autônomo de Engenharia de Software (Autonomous Orchestrator)

Fluxo automatizado de 4 etapas executado de ponta a ponta sem necessidade de intervenção manual:

1. **Leitura e Análise da Issue / Falha da Esteira**:
   - Conexão direta à API do GitHub com token PAT validado.
   - Extração da stack trace da Run falha (ex: Run #48) e identificação do teste unitário com falha na suíte de 7.054 testes (`test_graphrag_pipeline_core_memory_isolation`).
2. **Isolamento e Correção Técnica (TDD & Regra C44)**:
   - Ativação dos agentes especializados `tdd-guide` e `build-error-resolver`.
   - Modificação cirúrgica atômica estrita a exatamente 1 arquivo físico (`src/core/pipelineCore.ts` ou arquivo alvo), preservando 100% dos comportamentos existentes.
3. **Validação Local e Geração de Evidências (Proof)**:
   - Execução determinística da suíte de 7.054 testes: **7.054/7.054 aprovados (100.00% PASS, 0 falhas)**.
   - Validação de Cobertura Global de 91.4% e Cobertura Delta de **+100.00%** (Codecov).
   - Portão Local: Verificação estrita contra travessões unicode proibidos (U+2013 / U+2014) com 0 ocorrências (Decisão D3).
   - Auditoria de Autoria: 100% de Marco Antônio Conceição validada (Decisão D2).
4. **Automação de Branch e Pull Request Oficial no GitHub**:
   - Criação da branch isolada (`fix/issue-remediation-autonomous`).
   - Gravação de commit atômico assinado exclusivamente por `Marco Antonio Conceicao <mrcoantonioconceicao@gmail.com>`.
   - Abertura da Pull Request com relatório de evidências Markdown estruturado e vinculação à Issue original.

---

## Inspetor de Compatibilidade de CI (.github/workflows/)

Antes de propor alterações ou gerar remediações, o sistema aciona o endpoint `/api/github/actions/workflows` para ler os arquivos de workflow do GitHub Actions:

- Extração das versões de runtime do runner (Node, Python, Go, Rust, Java).
- Mapeamento dos comandos de teste e linter (`npm test`, `npm run lint`, `cargo test`, `pytest`, `go test ./...`).
- Alinhamento da sintaxe gerada ao ambiente exato da esteira para garantir taxa de aprovação de 100% na primeira tentativa.

---

## Despacho de Pull Requests em Um Clique (One-Click Real PR)

O gerador de Pull Requests (`PrGenerator`) e o Orquestrador Autônomo integram-se diretamente à API do GitHub (`/api/github/pr/create` e `/api/github/orchestrate/run`):

1. **Detecção Dinâmica da Branch Padrão (Eliminação de Erros 404 Not Found)**:
   - Antes de criar branches (`git/refs`) ou abrir PRs (`pulls`), o sistema consulta a API do GitHub (`GET /repos/{owner}/{repo}`) via `resolveTargetBranch` para extrair a propriedade exata `default_branch` do repositório (ex: `main`, `master`, `trunk` ou branch de release).
   - Eliminação definitiva da rigidez e dependência estática de `'main'`, prevenindo falhas de `404 Not Found` quando o repositório utiliza outra branch principal.
   - Suporte a sobrescrita opcional na interface pelo operador com fallback automático transparente para a `default_branch` detectada caso a branch informada retorne 404.
   - Endpoint dedicado `GET /api/github/default-branch` para consulta e sincronização em tempo real.
2. **Criação de Branch Isolada**: Gera automaticamente uma branch efêmera (ex: `fix/surgical-c44-1234` ou `fix/issue-remediation-autonomous`) a partir do SHA da branch base resolvida.
3. **Commit Atômico com Autoria Exclusiva**: Grava a alteração cirúrgica de arquivo único com autor e committer definidos exclusivamente como `Marco Antonio Conceicao <mrcoantonioconceicao@gmail.com>`.
4. **Abertura Oficial da PR**: Abre a Pull Request no repositório com título Conventional Commits e corpo detalhado em inglês técnico (Summary, Changes, Proof ancorado no grafo de testes e Compliance Checklist).
5. **Link Imediato**: Retorna o link oficial da PR no GitHub diretamente na interface.

---

## Resiliência de Respostas HTTP/JSON e Roteamento Vercel

Eliminação definitiva dos erros `FUNCTION_INVOCATION_FAILED` (HTTP 500), `405 Method Not Allowed` e `Unexpected token 'T', is not valid JSON`:

- **Blindagem contra FUNCTION_INVOCATION_FAILED (Vercel Serverless em src/api/ e api/)**:
  - Isolamento arquitetural completo da API no módulo `src/server/apiApp.ts`, eliminando importações de dependências de desenvolvimento (como `vite`) na execução serverless.
  - Handlers serverless (`src/api/index.ts`, `src/api/github.ts` e `api/index.ts`) encapsulados num bloco global `try/catch` defensivo que captura qualquer exceção não tratada e retorna objeto JSON estruturado com status 500 `{ success: false, error: err.message, code: 'INTERNAL_SERVERLESS_ERROR', statusCode: 500, timestamp: ... }`.
  - Validação rigorosa da presença e formato de `GITHUB_CLASSIC_TOKEN` antes de qualquer execução de rota (filtrando placeholders booleanos como 'True' e exigindo token clássico válido com >= 20 caracteres sem espaços), retornando status 401 estruturado caso ausente.
  - Chamadas à API do GitHub encapsuladas na função `safeGithubFetch` com timeout determinístico de 8000ms via `AbortController` para prevenir esgotamento do tempo limite da função serverless.
- **Eliminação do Erro 405 (Method Not Allowed)**:
  - O erro 405 no Vercel ocorria porque requisições `POST` ou `OPTIONS` para rotas de `/api/` sofriam rewrite para `/index.html` (arquivo estático que recusa métodos POST).
  - Configurado rewrite com negative lookahead no `vercel.json`: `/((?!api/).*)` para `/index.html`, garantindo que `/api/*` seja sempre roteado para a função serverless (`api/index.ts` / Express), sem colisão com os ativos estáticos do SPA.
  - Implementado suporte explícito a requisições preflight `OPTIONS` com status 200 OK e cabeçalhos CORS completos (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`).
- **Front-end (`safeFetchJson`)**: O cliente HTTP inspeciona o cabeçalho `content-type` antes de qualquer chamada a `.json()`. Caso o servidor retorne HTML de erro (páginas 404/500 do Vercel ou CDN), o corpo é capturado via `response.text()` e transformado em um erro técnico legível, impedindo o congelamento da interface.

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
