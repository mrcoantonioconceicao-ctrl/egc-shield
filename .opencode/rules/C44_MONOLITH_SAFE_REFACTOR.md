# REGRA C44: DECOMPOSICAO MODULAR SEGURA DE MONOLITOS ARQUITETURAIS

- **Codigo da Regra**: C44 (Monolito Arquitetural)
- **Decisao Arquitetural Associada**: Decisao D4
- **Autor Exclusivo**: Marco Antonio Conceicao
- **Padrao Textual**: Proibicao absoluta de travessoes unicode (U+2013 / U+2014); utilizar unicamente hifens comuns (-)

---

## 1. CONTEXTO E DIAGNOSTICO DO ERRO ANTERIOR

Em execucoes anteriores, subagentes autonomos cometeram falhas criticas ao lidar com arquivos grandes (monolitos com mais de 800 linhas):
- **Erro Detectado**: Apagamento de conteudo funcional, esvaziamento de arquivos ou substituicao de blocos inteiros por stubs vazios (`{}` ou `TODO`) sob pretexto de reduzir o tamanho de arquivos.
- **Classificacao**: VIOLACAO CRITICA DE GOVERNANCA E INTEGRIDADE DE CODIGO.
- **Correcao**: Esta diretriz substitui e anula qualquer protocolo anterior de truncamento. A partir de agora, a regra C44 rege exclusivamente a **Modularizacao Real e Segura**.

---

## 2. DIRETRIZES TECNICAS OBRIGATORIAS DA REGRA C44

### Diretriz 1: Modularizacao Real e Segura (Nunca Destruir)
1. **Gatilho de Identificacao**:
   - Qualquer arquivo com complexidade excessiva ou volume superior a **800 linhas de codigo** (ex: `server.ts`, pipelines de processamento massivo, controladores inchados) e classificado como monolito.
2. **Estrategia de Decomposicao Limpa**:
   - O agente DEVE dividir o monolito extraindo responsabilidades bem delimitadas para novos modulos especializados:
     - **Rotas**: endpoints e definicao de contratos de entrada.
     - **Controladores / Handlers**: orquestracao de requisicoes e respostas.
     - **Servicos de Dominio**: regras de negocio puras e operacoes matematicas/algoritmicas.
     - **Adaptadores / Clientes**: integracoes externas e chamadas de I/O.
3. **Proibicao Absoluta de Destruicao ou Stubs Vazios**:
   - E TERMINANTEMENTE PROIBIDO:
     - Esvaziar arquivos.
     - Apagar funcoes existentes sem migra-las integralmente para os novos modulos.
     - Inserir stubs vazios (`function foo() {}`, `except: pass`, `{ /* TODO */ }`).
     - Truncar codigo original.
   - O comportamento funcional de ponta a ponta do sistema original DEVE permanecer **100% intacto**.

### Diretriz 2: Validacao Rigorosa com Testes Unitarios e Rollback Automatico
1. **Cobertura Obrigatoria do Codigo Extraido**:
   - Apos a criacao dos modulos extraidos, o agente DEVE criar ou atualizar testes unitarios especificos cobrindo:
     - Os novos modulos criados.
     - As rotas ou pontos de integracao delegados.
     - Os casos de borda e invariantes de negocio.
2. **Execucao Local Rigorosa (Zero Regressao)**:
   - A suite de testes unitarios deve ser executada localmente antes de qualquer preparacao de commit.
   - Criterio de Aprovacao: **100% PASS** (todas as assercoes validas, zero falhas, cobertura delta >= 100%).
3. **Politica de Reversao Imediata (Rollback Automatico)**:
   - Se **1 unico teste falhar** ou se for identificada qualquer regressao funcional:
     - A refatoracao DEVE ser imediatamente revertida (`git restore / git checkout`).
     - Nenhum commit ou Pull Request pode ser gerado a partir de um estado quebrado ou regressivo.

### Diretriz 3: Regras da Casa (Non-Negotiable)
1. **Decisao D2**: Autoria 100% exclusiva de **Marco Antonio Conceicao** (proibida mencao a ferramentas de IA em commits e PRs).
2. **Decisao D3**: Proibicao absoluta de travessoes unicode (U+2014 ou U+2013). Utilizar unicamente o hifen simples (-).
3. **Decisao D4**: Refatoracao estritamente limpa, atomica e rastreavel.

---

## 3. PROMPT OFICIAL DO SISTEMA PARA SUBAGENTES C44

Copie e injete o bloco abaixo nas configuracoes do subagente `build-error-resolver` ou `c44-safe-refactor-agent`:

```text
Voce e o Especialista Senior em Refatoracao Segura e Decomposicao de Monolitos (Subagente C44) do projeto EGC (Enterprise GraphRAG Context).

SUA MISSAO PRINCIPAL:
Identificar e decompor arquivos monolíticos (>800 linhas de codigo) em arquitetura modular limpa e desacoplada, preservando 100% do comportamento funcional existente.

PROTOCOLO OPERACIONAL OBRIGATORIO:
1. NUNCA DESTRUA OU ESVAZIE ARQUIVOS:
   - E expressamente proibido apagar logica, truncar arquivos ou substituir trechos por stubs vazios, TODOs ou placeholders.
   - Toda logica removida do monolito DEVE ser realocada integralmente em novos modulos coesos (rotas, controladores, servicos).
   - O arquivo original atua como ponto de delegacao/fachada ou re-exporta os novos modulos sem perder compatibilidade.

2. TESTES UNITARIOS E REVERSAO OBRIGATORIA:
   - Crie testes unitarios focados para cada modulo extraido garantindo paridade funcional.
   - Execute a suite de testes localmente.
   - SE ALGUM TESTE FALHAR OU REGREDIR: Aborte a operacao imediatamente e reverta todas as alteracoes antes de commitar.

3. REGRAS DA CASA:
   - Autoria exclusiva: Marco Antonio Conceicao <mrcoantonioconceicao@gmail.com>.
   - Zero travessoes unicode: use apenas hifens comuns (-).
   - Inclua assinatura Signed-off-by em todos os commits.
```
