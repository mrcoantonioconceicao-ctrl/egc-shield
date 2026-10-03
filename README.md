# Enterprise GraphRAG Context (EGC)

Centro de comando e engenharia cirúrgica para execução do plano de correção dos 108 achados, atualização de ferramentas e refatoração arquitetural de código.

## Autor Exclusivo
- Marco Antônio Conceição (mrcoantonioconceicao@gmail.com)
- Política de Autoria: Estritamente humana. Proibida qualquer menção ou tag de coautoria de IA em commits, pull requests ou documentação (Decisão D2).

---

## Princípio Operacional: Execução Bottom-Up (Fase 13 a Fase 0)
O plano opera rigorosamente de baixo para cima, garantindo estabilidade de infraestrutura e contratos antes de qualquer alteração em regras de negócio:

1. Fase 13: Tooling, Linter & CI/CD Pipeline
2. Fase 12: Infraestrutura & Containerização
3. Fase 11: Tipagem Estrita & Schemas Primitivos
4. Fase 10: Driver de Grafo & Conectores de Storage
5. Fase 9: Vector Store & Embeddings Pipeline
6. Fase 8: AST Parsers & Extratores de Código
7. Fase 7: Graph Construction & Entidades/Arestas
8. Fase 6: Recuperação Híbrida & Graph Traversal (GraphRAG Core)
9. Fase 5: Orquestração de Agentes & Context Assembly
10. Fase 4: Interfaces SOA & Contratos de Serviço
11. Fase 3: Domain Services & Regras DDD
12. Fase 2: Testes E2E, Regressão & Carga
13. Fase 1: Segurança, Auditoria & Hardening
14. Fase 0: Release Final & Validação Zero-Defect

---

## Regras Absolutas da Casa

1. Sinceridade e Verdade: Análise técnica direta, implacável e mensurável. Zero dados fictícios, simulações ou mocks no código de produção.
2. Formato de Texto Estrito: Proibido o uso de travessões unicode ("—" ou "–"). Utilizar unicamente hífen simples ("-") em qualquer texto, código, commit ou PR (Decisão D3).
3. Autoria Exclusiva: Autoria 100% de Marco Antônio Conceição em todos os artefatos.
4. Qualidade e CI: Todo código vem acompanhado de testes unitários com 100% de cobertura no delta alterado. Respeito estrito a Clean Code, DDD, SOA e análise formal de AST.
5. Atomicidade Cirúrgica em Dívidas Pesadas (C44): Para o achado crítico C44 e dívidas complexas, aplica-se estritamente a regra de exatamente um arquivo físico por PR, preservando o comportamento existente e deixando o validador por último (Decisão D4).

---

## Integração e Varredura Real via GitHub PAT

O sistema se conecta diretamente ao repositório EGC no GitHub via Personal Access Token (PAT clássico):
- Busca da árvore completa de arquivos do repositório em tempo real.
- Extração física do conteúdo de arquivos mapeados nos achados (ex: C44 em `src/core/embeddings/pipelineCore.ts`, C30 em `src/infra/db/transactionManager.ts`, S12 em `src/infra/security/cypherSanitizer.ts`).
- Análise estática da AST e detecção de violações diretamente sobre o código extraído.

### Variáveis de Ambiente (.env)
```env
# Token clássico pessoal (PAT) com escopo repo
GITHUB_CLASSIC_TOKEN=""

# Coordenadas do repositório EGC
GITHUB_REPO_OWNER="mrcoantonioconceicao"
GITHUB_REPO_NAME="egc"

# Porta do servidor full-stack
PORT=3000
```

---

## Comandos do Portão Local (Local Quality Gate)

Antes de qualquer commit ou submissão de PR, todos os portões abaixo devem retornar código de saída 0:

```bash
# 1. Checagem contra travessões proibidos (U+2014 e U+2013)
! git diff --cached | grep -P "[\x{2013}\x{2014}]"

# 2. Verificação de autoria exclusiva de Marco Antônio Conceição
test "$(git config user.name)" = "Marco Antônio Conceição" && ! git log -1 --pretty=format:"%b" | grep -Ei "co-authored-by|generated-by"

# 3. Verificação de arquivo único para C44
test "$(git diff --cached --name-only | wc -l)" -le 1

# 4. Checagem estrita de tipos TypeScript (AST)
npm run tsc -- --noEmit

# 5. Suíte de testes unitários e cobertura delta
npm test -- --run

# 6. Linter de conformidade e complexidade ciclomática (max 8)
npm run lint
```

---

## Padrão Obrigatório de Pull Request

Toda Pull Request deve ser redigida em inglês técnico direto, estruturada obrigatoriamente no template:

```markdown
## Summary
Concise and imperative explanation of the architectural remediation.

- Target Phase: Phase X (Bottom-Up)
- Finding ID: C44 / ACH-XXX
- Decision Reference: D4
- Target File: `path/to/single_file.ts`
- Heavy Debt Single-File Enforced: YES
- Author: Marco Antonio Conceicao (mrcoantonioconceicao@gmail.com)

## Changes
- Surgical change 1
- Surgical change 2
- Unit tests validating zero behavioral regressions

## Proof
\`\`\`text
PASS path/to/file.test.ts (100% delta coverage)
EXIT_CODE 0 - scripts/verify-local-gate.sh passed all gates.
\`\`\`

## Compliance Checklist
- [x] Zero em-dash characters used (only simple hyphen '-')
- [x] Exclusive human authorship by Marco Antonio Conceicao (no AI co-authorship)
- [x] Strict atomic scope (single-file modified for heavy debt)
- [x] Local gate and CI test suite green with full delta coverage
```

---

## Como Executar a Aplicação Localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor full-stack (porta 3000)
npm run dev

# Compilar e validar tipos
npm run build
npm run lint
```
