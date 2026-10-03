import { Finding, DecisionRecord, PhaseNumber, DiaryEntry } from '../types/egc';

export interface PhaseMeta {
  number: PhaseNumber;
  title: string;
  scope: string;
  order: number;
  criticality: 'fundacao' | 'intermediaria' | 'topo';
}

export const PHASES_CONFIG: PhaseMeta[] = [
  { number: 13, title: 'Fase 13 - Tooling, Linter & CI/CD Pipeline', scope: 'Setup de ferramental, AST rules, pre-commit hooks e gates de CI', order: 0, criticality: 'fundacao' },
  { number: 12, title: 'Fase 12 - Infraestrutura & Containerização', scope: 'Dockerfiles, runtime, isolamento de dependências e configurações', order: 1, criticality: 'fundacao' },
  { number: 11, title: 'Fase 11 - Tipagem Estrita & Schemas Primitivos', scope: 'Contratos estritos, schemas Zod, eliminação de any e types imutáveis', order: 2, criticality: 'fundacao' },
  { number: 10, title: 'Fase 10 - Driver de Grafo & Conectores de Storage', scope: 'Pools de conexão, transações ACID, resiliência e fechamento de streams', order: 3, criticality: 'fundacao' },
  { number: 9,  title: 'Fase 9 - Vector Store & Embeddings Pipeline', scope: 'Indexação vetorial, cosine similarity e isolamento da dívida pesada C44', order: 4, criticality: 'intermediaria' },
  { number: 8,  title: 'Fase 8 - AST Parsers & Extratores de Código', scope: 'Parsing formal com Tree-sitter, extração semântica e métricas AST', order: 5, criticality: 'intermediaria' },
  { number: 7,  title: 'Fase 7 - Graph Construction & Entidades/Arestas', scope: 'Topologia de nós, arestas tipadas, idempotência e deduplicação', order: 6, criticality: 'intermediaria' },
  { number: 6,  title: 'Fase 6 - Recuperação Híbrida & Graph Traversal', scope: 'GraphRAG Core: fusão vetorial e lexical (RRF) com limites de hops', order: 7, criticality: 'intermediaria' },
  { number: 5,  title: 'Fase 5 - Orquestração de Agentes & Context Assembly', scope: 'Budget estrito de tokens, formatação de contexto e proveniência', order: 8, criticality: 'intermediaria' },
  { number: 4,  title: 'Fase 4 - Interfaces SOA & Contratos de Serviço', scope: 'Desacoplamento de camadas, DTOs e inversão de dependências', order: 9, criticality: 'topo' },
  { number: 3,  title: 'Fase 3 - Domain Services & Regras DDD', scope: 'Entidades ricas, Value Objects puros e encapsulamento de invariantes', order: 10, criticality: 'topo' },
  { number: 2,  title: 'Fase 2 - Testes E2E, Regressão & Carga', scope: 'Suíte E2E determinística, eliminação de flaky tests e benchmarks', order: 11, criticality: 'topo' },
  { number: 1,  title: 'Fase 1 - Segurança, Auditoria & Hardening', scope: 'Prevenção de Cypher/SQL injection, mascaramento e auditoria', order: 12, criticality: 'topo' },
  { number: 0,  title: 'Fase 0 - Release Final & Validação Zero-Defect', scope: 'Portão verde consolidado, checklist final de 108 achados e tag v1.0.0', order: 13, criticality: 'topo' },
];

export const DECISIONS_LIST: DecisionRecord[] = [
  { id: 'D1', title: 'Ordem Bottom-Up Estrita (13 -> 0)', summary: 'Execução sequencial obrigatória da Fase 13 até a Fase 0 para estabilização de bases.', impactArea: 'Ordem de Execução', ruleEnforcement: 'Nenhuma task de fase superior inicia sem validação da inferior.', status: 'ativa' },
  { id: 'D2', title: 'Regra de Ouro da Autoria Exclusiva', summary: 'Apenas Marco Antônio Conceição é autor de commits e PRs. Proibido coautoria de IA.', impactArea: 'Git & Auditoria', ruleEnforcement: 'Co-authored-by bloqueado em git hooks.', status: 'ativa' },
  { id: 'D3', title: 'Banimento Total de Travessões', summary: 'Uso estrito de hífen simples (-) em qualquer documentação, commit, PR ou código.', impactArea: 'Padrão Textual', ruleEnforcement: 'Linters e CI rejeitam caracteres U+2014 e U+2013.', status: 'ativa' },
  { id: 'D4', title: 'Atomicidade Estrita: 1 Arquivo por PR em C44', summary: 'Dívidas arquiteturais pesadas (especialmente C44) exigem exatamente 1 PR por arquivo modificado.', impactArea: 'Refatoração C44', ruleEnforcement: 'Rejeitar qualquer PR que toque mais de 1 arquivo na dívida C44.', status: 'ativa' },
  { id: 'D5', title: 'Garantia de Testes Unitários Obrigatórios', summary: 'Nenhum commit entra sem cobertura de teste que comprove a resolução do achado.', impactArea: 'CI/CD Quality Gate', ruleEnforcement: 'Cobertura mínima de 100% sobre o delta alterado.', status: 'ativa' },
  { id: 'D6', title: 'Isolamento de Tipagem em Domain Boundaries (DDD)', summary: 'Primitivos de infraestrutura não vazam para entidades de domínio.', impactArea: 'Arquitetura DDD', ruleEnforcement: 'Value Objects imutáveis para identificadores e queries.', status: 'ativa' },
  { id: 'D7', title: 'Padronização de Parser AST com Tree-Sitter', summary: 'Substituição de regex ad-hoc por AST formal para extração de entidades de código.', impactArea: 'Fase 8 / AST', ruleEnforcement: 'Gramáticas validadas contra versões estritas de TS/Python/Go.', status: 'ativa' },
  { id: 'D8', title: 'Desacoplamento SOA de Serviços de Embeddings', summary: 'Embedding client isolado via interface abstrata agnóstica de provedor.', impactArea: 'Fase 9 / Embeddings', ruleEnforcement: 'Nenhum acoplamento direto com SDKs de terceiros no core.', status: 'ativa' },
  { id: 'D9', title: 'Política de Idempotência em Grafos (GraphRAG)', summary: 'Operações de merge de nós e arestas devem ser matematicamente idempotentes.', impactArea: 'Fase 7 / Graph', ruleEnforcement: 'Cypher queries com MERGE garantido e hashes determinísticos.', status: 'ativa' },
  { id: 'D10', title: 'Eliminação de Chamadas Bloqueantes de I/O', summary: 'Toda operação de I/O em banco ou vetor deve ser puramente assíncrona.', impactArea: 'Fase 10 / Storage', ruleEnforcement: 'Detecção de event-loop lag em profiling.', status: 'ativa' },
  { id: 'D11', title: 'Gerenciamento Centralizado de Dependências', summary: 'Fixação de versões exatas em package locks sem semver flutuante (^ ou ~).', impactArea: 'Fase 13 / Tooling', ruleEnforcement: 'Lockfile auditado a cada PR.', status: 'ativa' },
  { id: 'D12', title: 'Estruturação Cirúrgica do Corpo de PR', summary: 'Toda PR deve ter Summary objetivo, Changes atômicas e Proof com saída de testes.', impactArea: 'Processo de PR', ruleEnforcement: 'Template obrigatório verificado em CI.', status: 'ativa' },
  { id: 'D13', title: 'Diário de Bordo Obrigatório por Ciclo', summary: 'Registro auditável com timestamp, arquivo alvo, achado e saída do portão local.', impactArea: 'Auditoria de Processo', ruleEnforcement: 'Arquivo de log versionado e sincronizado.', status: 'ativa' },
  { id: 'D14', title: 'Tratamento Estrito de Erros sem Silent Catch', summary: 'Proibido blocos catch vazios ou passagens silenciosas de exceção.', impactArea: 'Clean Code', ruleEnforcement: 'AST lint para captura cega de exceptions.', status: 'ativa' },
  { id: 'D15', title: 'Context Window Budgeting Estrito', summary: 'Orquestrador de contexto não pode exceder 80% do teto do LLM alvo.', impactArea: 'Fase 5 / Context Assembly', ruleEnforcement: 'Token counter determinístico pré-despacho.', status: 'ativa' },
  { id: 'D16', title: 'Separação de Storage Léxico vs Vetorial', summary: 'Híbrido BM25 e Cosine Similarity executados em shards desacoplados.', impactArea: 'Fase 6 / Hybrid Search', ruleEnforcement: 'Reciprocal Rank Fusion (RRF) padronizado.', status: 'ativa' },
  { id: 'D17', title: 'Eliminação de Dependências Circulares', summary: 'Módulos organizados em grafo acíclico dirigido (DAG).', impactArea: 'Arquitetura Geral', ruleEnforcement: 'Madge / linter de ciclos rodando no pre-commit.', status: 'ativa' },
  { id: 'D18', title: 'Validação de Schemas em Runtime com Zod', summary: 'Dados externos ou deserializados devem passar por parser Zod estrito.', impactArea: 'Fase 11 / Schemas', ruleEnforcement: 'Zero any/unknown sem cast validado.', status: 'ativa' },
  { id: 'D19', title: 'Purificação de Funções Utilitárias', summary: 'Funções utilitárias devem ser funções puras sem side-effects.', impactArea: 'Fase 11 / Utilities', ruleEnforcement: 'Testes de propriedade e idempotência.', status: 'ativa' },
  { id: 'D20', title: 'Sanitização de Consultas Cypher e SQL', summary: 'Todas as consultas de grafos devem utilizar parâmetros nomeados preparados.', impactArea: 'Fase 1 / Segurança', ruleEnforcement: 'Proibida interpolação direta de strings em queries.', status: 'ativa' },
  { id: 'D21', title: 'Limpeza de Comentários Mortos e TODOs Órfãos', summary: 'Remoção de código comentado ou migração para tickets formais.', impactArea: 'Clean Code', ruleEnforcement: 'AST linter bloqueando blocos comentados longos.', status: 'ativa' },
  { id: 'D22', title: 'Controle de Concorrência em Pools de Conexão', summary: 'Pool de conexões com timeouts e exponential backoff para graph drivers.', impactArea: 'Fase 10 / Drivers', ruleEnforcement: 'Stress test de conexões concorrentes.', status: 'ativa' },
  { id: 'D23', title: 'Cache Determinístico de Resultados Parciais', summary: 'Cache LRU em memória para expansões de subgrafos frequentes.', impactArea: 'Fase 6 / Traversal', ruleEnforcement: 'Invalidação baseada em versão de topologia.', status: 'ativa' },
  { id: 'D24', title: 'Eliminação de Magic Strings e Numbers', summary: 'Constantes semânticas encapsuladas em enums ou objetos congelados.', impactArea: 'Fase 11 / Tipos', ruleEnforcement: 'Linter no-magic-numbers ativado.', status: 'ativa' },
  { id: 'D25', title: 'Padronização de Logs em JSON Estruturado', summary: 'Saída de logs com traceId, timestamp ISO e nível de severidade.', impactArea: 'Fase 12 / Observabilidade', ruleEnforcement: 'Zero console.log cru em produção.', status: 'ativa' },
  { id: 'D26', title: 'Garantia de Isolamento de Testes E2E', summary: 'Testes de integração rodam contra instâncias limpas em containers efêmeros.', impactArea: 'Fase 2 / E2E', ruleEnforcement: 'Zero dependência de estado residual entre suítes.', status: 'ativa' },
  { id: 'D27', title: 'Definição Formal de Bounded Contexts', summary: 'Domínio dividido em Core Graph, Retrieval, Agent Orchestration e API.', impactArea: 'Fase 3 / DDD', ruleEnforcement: 'Fronteiras validadas por imports de pacotes.', status: 'ativa' },
  { id: 'D28', title: 'Métrica de Qualidade e Complexidade Ciclomática', summary: 'Complexidade ciclomática máxima por função restrita a 8.', impactArea: 'Fase 13 / Linter', ruleEnforcement: 'Regra de complexidade estrita no CI.', status: 'ativa' },
  { id: 'D29', title: 'Remoção de Código Morto via AST Dead-Code Elimination', summary: 'Varredura e remoção de nós inalcançáveis e funções não referenciadas.', impactArea: 'Fase 8 / Otimização', ruleEnforcement: 'Knip / ts-prune integrados no CI.', status: 'ativa' },
  { id: 'D30', title: 'Proteção contra Resource Leaks em Streams', summary: 'Fechamento explícito de handles de arquivos, sockets e cursores de grafo.', impactArea: 'Fase 10 / Storage', ruleEnforcement: 'Finalizers com try-finally ou using statement.', status: 'ativa' },
  { id: 'D31', title: 'Padrão Repository para Acesso a Grafos', summary: 'Acesso a nós e arestas mediado exclusivamente por repositórios de domínio.', impactArea: 'Fase 4 / SOA', ruleEnforcement: 'Proibido acoplamento de driver de banco em controllers.', status: 'ativa' },
  { id: 'D32', title: 'Validação Final de Zero-Defect Gate', summary: 'Fase 0 requer 100% dos 108 achados fechados e portão local completamente verde.', impactArea: 'Fase 0 / Release', ruleEnforcement: 'Nenhuma exceção ou débito residual aceito.', status: 'ativa' },
];

// Dívida pesada canônica C44 referenciada explicitamente nas regras
export const CANONICAL_FINDINGS: Finding[] = [
  {
    id: 'C44',
    code: 'C44',
    title: 'Dívida Arquitetural Pesada C44: Refatoração com Regra de 1 Arquivo por PR',
    description: 'Dívida central no pipeline de embeddings e sharding. Exige decomposição cirúrgica e atômica: exatamente 1 arquivo por PR, sem acoplamentos colaterais.',
    phase: 9,
    phaseName: 'Fase 9 - Vector Store & Embeddings Pipeline',
    targetFile: 'src/core/embeddings/pipelineCore.ts',
    isHeavyDebt: true,
    decisionRef: 'D4',
    severity: 'critico',
    status: 'pendente',
    module: 'Vector / Embeddings',
    updatedAt: '2026-10-03',
  }
];

// Lista inicial sem dados falsos: apenas a dívida canônica real C44 aguardando a importação dos achados reais
export const INITIAL_FINDINGS: Finding[] = CANONICAL_FINDINGS;

// Diário inicial estritamente vazio: sem entradas inventadas
export const INITIAL_DIARY: DiaryEntry[] = [];
