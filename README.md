# Enterprise GraphRAG Context (EGC)

Centro de comando e motor de engenharia cirúrgica para execução do plano de remediação, atualização de ferramentas, análise dinâmica poliglota e refatoração arquitetural de código.

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

## Arquitetura de Interface Mobile-First

1. **Bloco do Token GitHub Fixo no Topo**:
   - Card de conexão (`PermanentGitHubBar`) posicionado permanentemente no topo da tela principal, logo abaixo do cabeçalho.
   - Visível e acessível em 100% do tempo em qualquer aba, com inputs diretos para:
     - Proprietário (User/Org)
     - Repositório EGC
     - Branch
     - Token Clássico GitHub (PAT) com alternador de visibilidade (Eye/EyeOff)
   - Botões globais de ação imediata: "Testar Conexão" e "Iniciar Varredura Dinâmica e Remediação (Fase 13 -> 0)".
   - Sem campos manuais redundantes de busca de arquivos.

2. **Navegador de Fases em Gaveta Lateral (`PhaseDrawer`)**:
   - Menu completo das 14 fases isolado em gaveta deslizante lateral acionada pelo botão "Fases 13 -> 0 (Gaveta)".
   - Libera 100% da área de trabalho no celular e desktop para análise de código, diffs e geração de PRs.

---

## Motor de Varredura Dinâmica Poliglota (/api/github/deep-scan)

O sistema opera de forma agnóstica e dinâmica sobre os arquivos reais do repositório, sem depender de inventários estáticos:

- **Varredura Direta na Árvore**: Extração via API do GitHub (`git/trees/{branch}?recursive=1`) de todos os arquivos de código e configuração.
- **Análise Poliglota**:
  - TypeScript / JS: Complexidade ciclomática (> 8), God functions (> 80 linhas), blocos catch vazios, tipo any (D18), console.log (D25).
  - Python: Exceções silenciadas (`except: pass`), ausência de tipagem estrita.
  - Rust: Chamadas inseguras a `.unwrap()` sem propagação formal via `?`.
  - Solidity: Chamadas `.call` de baixo nível sem validação estrita de retorno `require(success)`.
  - Manifestos: Conflitos de dependências peer no Vercel (esbuild/vite) e segredos expostos.
- **Mapeamento Automático Bottom-Up**: As anomalias detectadas são categorizadas automaticamente da Fase 13 até a Fase 0, prontas para remediação isolada.

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
PASS src/path/to/file.test.ts
EXIT_CODE 0 - All unit test assertions and AST checks green.
Local gate status: GREEN.
\`\`\`

## Compliance Checklist
- [x] Zero em-dash characters used (only simple hyphen '-')
- [x] Exclusive human authorship by Marco Antonio Conceicao (no AI co-authorship)
- [x] Strict atomic scope (single-file per PR enforced for heavy debt)
- [x] Local gate and CI test suite green
```
