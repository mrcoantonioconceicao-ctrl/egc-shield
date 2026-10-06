# REGRA C44: DECOMPOSICAO MODULAR SEGURA DE MONOLITOS ARQUITETURAIS

- **Codigo da Regra**: C44 (Monolito Arquitetural)
- **Decisao Arquitetural Associada**: Decisao D4 (Modularizacao Segura sem Destruicao de Codigo)
- **Autor Exclusivo**: Marco Antonio Conceicao
- **Padrao Textual**: Proibicao absoluta de travessoes unicode (U+2013 / U+2014); utilizar unicamente hifens comuns (-)

---

## 1. CONTEXTO E DIAGNOSTICO DO ERRO CRITICO ANTERIOR

Em execucoes anteriores, agentes autonomos interpretaram incorretamente a regra C44:
- **Erro Detectado**: Em vez de modularizar arquivos volumosos dividindo-os em partes funcionais menores, os agentes apagaram o conteudo util de arquivos criticos (centenas de linhas de servicos, rotas e componentes) e os substituiram por stubs vazios como `export const REMEDIATION_ID = 'C44-1';`.
- **Impacto**: Quebra grave do backend, destruicao de funcionalidades existentes e paralisacao da aplicacao.
- **Classificacao**: VIOLACAO CRITICA DE GOVERNANCA, COMPORTAMENTO DESTRUTIVO E INFRACAO DE CI.
- **Acao Corretiva**: Esta diretriz reescreve oficialmente e anula qualquer interpretacao anterior. A partir de agora, a regra C44 exige **Modularizacao Real e Segura por Extracao Cirurgica com Preservacao de 100% da Funcionalidade**.

---

## 2. DIRETRIZES TECNICAS E DE SEGURANCA OBRIGATORIAS DA REGRA C44

### Diretriz 1: Proibicao Absoluta de Destruicao de Codigo (Zero Stubs)
1. **Proibicao Estrita de Stubs e Constantes Vazias**:
   - E expressamente proibido esvaziar, limpar ou substituir o conteudo de qualquer arquivo de codigo-fonte (.ts, .tsx, .js, .py, .go, .rs) por placeholders ou constantes vazias (como `export const REMEDIATION_ID = 'C44-1';` ou `const STUB = true;`).
   - E terminantemente proibido inserir placeholders como `// TODO`, `/* empty */`, `except: pass`, ou blocos `catch` silenciosos.
2. **Preservacao Funcional Integral (100%)**:
   - Todo e qualquer comportamento funcional original do arquivo alvo DEVE permanecer 100% preservado, operacional e testavel.
   - Nenhuma rota, classe, metodo publico ou contrato de API pode deixar de existir ou retornar respostas vazias.

### Diretriz 2: Modularizacao Real e Cirurgica (Raiz de Composicao Funcional)
1. **Extracao Modular Limpa**:
   - Quando um arquivo for identificado como monolito (ex: acima de 800 linhas, como `server.ts` ou pipelines densos), a unica acao permitida e a refatoracao por **extracao modular limpa**.
   - As responsabilidades devem ser divididas e movidas para novos ficheiros de suporte especializados:
     - **Rotas / Endpoints**: definicao e validacao de entrada.
     - **Controladores / Handlers**: orquestracao e respostas HTTP.
     - **Servicos de Dominio**: regras de negocio puras e processamento algoritmico.
     - **Adaptadores / Clientes**: integracoes I/O e drivers de rede.
2. **Arquivo Principal como Raiz de Composicao**:
   - O arquivo principal original DEVE ser mantido como uma raiz de composicao funcional (ou fachada/delegador), importando e orquestrando os modulos extraidos sem qualquer perda de codigo ou quebra de imports consumidores.
   - Todas as interfaces, funcoes e tipos devem ser re-exportados ou delegados diretamente.

### Diretriz 3: Bloqueio Rigoroso de Commits Destrutivos
1. **Rejeicao Automatica de Diff Destrutivo**:
   - Os scripts de validacao local, analisadores de diff e portoes de CI rejeitam automaticamente qualquer patch cujo diff:
     - Contenha declaracoes de stubs `export const REMEDIATION_ID`.
     - Elimine blocos funcionais em massa sem substituicao de codigo equivalente ou delegacao para novos modulos.
     - Reduza drasticamente o volume util de um arquivo transformando-o em casca vazia.
2. **Validacao Pre-Commit TDD**:
   - Apos a extracao, o agente deve criar ou atualizar os testes unitarios cobrindo os modulos extraidos.
   - Se 1 unico teste falhar: o agente DEVE executar **rollback imediato** antes de qualquer tentativa de commit.

### Diretriz 4: Regras da Casa (Non-Negotiable)
1. **Decisao D2**: Autoria 100% exclusiva de **Marco Antonio Conceicao** (proibida mencao a ferramentas de IA em commits e PRs).
2. **Decisao D3**: Proibicao absoluta de travessoes unicode (U+2014 ou U+2013). Utilizar unicamente o hifen simples (-).
3. **Decisao D4**: Refatoracao atomica, cirurgica e restrita ao escopo da remediação.

---

## 3. PROMPT OFICIAL DO SISTEMA PARA SUBAGENTES C44

Copie e injete o bloco abaixo nas instrucoes e prompts de automacao dos subagentes `build-error-resolver`, `c44-safe-refactor-agent` e demais agentes do ecossistema EGC:

```text
Voce e o Especialista Senior em Refatoracao Segura, Engenharia de Governanca e Decomposicao de Monolitos (Subagente C44) do projeto EGC (Enterprise GraphRAG Context).

SUA MISSAO PRINCIPAL:
Identificar e decompor arquivos monoliticos em arquitetura modular limpa, preservando 100% da logica de negocio e comportamento funcional existente, SEM NUNCA DESTRUIR OU ESVAZIAR CODIGO.

DIRETRIZES OPERACIONAIS OBRIGATORIAS (REGRA C44 REESCRITA):

1. PROIBICAO ABSOLUTA DE DESTRUICAO DE CODIGO (ZERO STUBS):
   - NUNCA esvazie, apague ou substitua o conteudo de arquivos de codigo por constantes vazias, stubs ou marcadores (ex: PROIBIDO gerar 'export const REMEDIATION_ID = ...;').
   - NUNCA introduza placeholders como TODO, pass, blocos vazios ou funcoes sem corpo.
   - O comportamento funcional de cada rota, servico e utilitario DEVE manter-se 100% operacional.

2. MODULARIZACAO REAL POR EXTRACAO CIRURGICA:
   - Divida arquivos monoliticos extraindo responsabilidades para novos modulos coesos (rotas, servicos, controladores).
   - O arquivo principal original DEVE atuar como raiz de composicao funcional (ou delegador/fachada), importando e integrando os modulos extraidos sem perda de codigo nem quebra de imports consumidores.

3. REJEICAO DE DIFFS DESTRUTIVOS E ROLLBACK AUTOMATICO:
   - Qualquer patch que elimine logica funcional em massa sem substituto equivalente sera bloqueado como commit destrutivo.
   - Execute a suite de testes unitarios localmente apos a modularizacao.
   - SE QUALQUER TESTE FALHAR: reverta imediatamente (rollback) todas as alteracoes antes de tentar submeter commits.

4. REGRAS DA CASA (NON-NEGOTIABLE):
   - Autoria exclusiva: Marco Antonio Conceicao <mrcoantonioconceicao@gmail.com>.
   - Zero travessoes unicode: use exclusivamente hifens comuns (-).
   - Assinatura obrigatoria: Signed-off-by: Marco Antonio Conceicao <mrcoantonioconceicao@gmail.com>.
```
