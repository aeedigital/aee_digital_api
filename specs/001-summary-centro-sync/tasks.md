---
description: "Tarefas para sincronizar dados do centro a partir de uma nova summary"
---

# Tasks: Atualização assíncrona dos dados do centro

**Input**: Design documents from `specs/001-summary-centro-sync/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: O princípio III da constituição exige testes focados para os comportamentos introduzidos. As tarefas de teste ficam antes da implementação da história.

**Organization**: Tarefas agrupadas por história de usuário para permitir implementação e validação independentes.

## Phase 1: Setup

**Purpose**: Preparar a dependência de publicação SNS usada pela API.

- [ ] T001 Adicionar `@aws-sdk/client-sns` às dependências de `package.json` e atualizar `package-lock.json`, sem alterar arquivos gerados em `.lambda_build/`.

---

## Phase 2: Foundational

**Purpose**: Definir o contrato de evento e a proteção de versão que bloqueia processamento fora de ordem.

- [ ] T002 [P] Criar o tipo e a validação de runtime do evento `center.summary-refresh.v1` em `src/summary-updates/summary-refresh.event.ts`, alinhados a `specs/001-summary-centro-sync/contracts/center-summary-refresh.event.schema.json`.
- [ ] T003 [P] Adicionar a versão aplicada da summary ao domínio, schema Mongo e contrato de repositório em `src/domain/entities/centro.ts`, `src/domain/repositories/centro.repository.ts` e `src/centros/schemas/centro.schema.ts`; manter o campo interno, fora do presenter público.
- [ ] T004 [P] Escrever testes de comparação de versões em `src/infra/memory/centros.memory.repository.spec.ts` e `src/infra/mongo/centros.mongo.repository.spec.ts`, cobrindo versão mais nova, repetida e antiga.
- [ ] T005 [P] Implementar `applySummaryProfileIfNewer` com comparação atômica de versão nas implementações Mongo e Memory em `src/infra/mongo/centros.mongo.repository.ts` e `src/infra/memory/centros.memory.repository.ts`; invalidar cache após atualização e não alterar dados quando a versão não for mais nova.

**Checkpoint**: Contrato do evento e persistência idempotente estão prontos para a história de usuário.

---

## Phase 3: User Story 1 - Atualizar o resumo geral do centro (Priority: P1) 🎯 MVP

**Goal**: Depois que uma summary for persistida e o SNS aceitar o evento, atualizar em segundo plano os dados válidos do centro, preservar o contrato HTTP e não expor estado de processamento.

**Independent Test**: Criar uma summary válida com endereço, contatos autorizados e funcionamento diferentes dos atuais; confirmar que `POST /summaries` retorna sem esperar pelo worker, processar o evento SQS e consultar o centro para verificar os campos persistidos. Confirmar também que valores de endereço/funcionamento ausentes são preservados, contatos sem autorização/valor são removidos, uma localização antiga não é confirmada para endereço novo, e `ATENDIMENTOS` continua disponível sem derivar `FUNCIONAMENTO` de summaries antigas.

### Tests for User Story 1

- [ ] T006 [P] [US1] Atualizar `src/application/summary/summary.service.spec.ts` para verificar publicação após persistência, erro explícito quando SNS falha, log dos IDs e preservação do evento existente de dashboard.
- [ ] T007 [P] [US1] Criar `src/application/summary/summary-centro-refresh.service.spec.ts` para testar extração de endereço/contatos do snapshot, autorização positiva, remoção de contatos inválidos, preservação de endereço/funcionamento ausentes e proteção de versão.
- [ ] T008 [P] [US1] Criar `src/application/centros/geocoding.service.spec.ts` para testar endereço insuficiente, falha do provedor, correspondência do endereço retornado e rejeição de resultados com hash obsoleto.
- [ ] T009 [P] [US1] Criar `src/summary-updates/summary-updates.lambda.spec.ts` para verificar validação de mensagens, confirmação de registros bem-sucedidos, falhas parciais por registro e retry de geocodificação pendente em evento duplicado.
- [ ] T010 [P] [US1] Atualizar `src/application/centros/centros.service.spec.ts` e `src/centros/centro.presenter.spec.ts` para garantir que `FUNCIONAMENTO` vem do Centro persistido, não usa summaries antigas como fallback e mantém `ATENDIMENTOS`.

### Implementation for User Story 1

- [ ] T011 [P] [US1] Criar o publicador SNS e seu módulo em `src/infra/aws/summary-refresh.publisher.ts` e `src/infra/aws/summary-refresh.module.ts`, usando `SUMMARY_CENTER_REFRESH_TOPIC_ARN` e `eventId` determinístico por summary.
- [ ] T012 [US1] Integrar o publicador ao `SummaryAppService.create` e `SummaryModule` em `src/application/summary/summary.service.ts` e `src/summary/summary.module.ts`; aguardar apenas a confirmação SNS, propagar a falha após a persistência e registrar IDs sem capturar o erro como sucesso.
- [ ] T013 [P] [US1] Implementar `SummaryCentroRefreshService` em `src/application/summary/summary-centro-refresh.service.ts` para carregar a summary persistida mais recente do centro, derivar campos válidos do snapshot e `attendance`, aplicar autorização pública dos contatos e persistir somente pela operação versionada do repositório.
- [ ] T014 [US1] Extrair a geocodificação para `src/application/centros/geocoding.service.ts`, reutilizando as verificações de endereço e confirmação de `scripts/geocode-centros.mjs`; atualizar a localização via a salvaguarda de hash existente e permitir retry quando a versão do perfil já foi aplicada, mas a localização ainda está pendente.
- [ ] T015 [US1] Criar o módulo e o handler SQS em `src/summary-updates/summary-updates.module.ts` e `src/summary-updates.lambda.ts`; processar a summary atual do centro, executar sincronização/geocodificação e retornar `batchItemFailures` para os registros com erro.
- [ ] T016 [P] [US1] Remover de `CentrosAppService` a atribuição de `FUNCIONAMENTO` derivada da summary, mantendo a associação de `attendanceSummary` para `ATENDIMENTOS`, em `src/application/centros/centros.service.ts`.
- [ ] T017 [US1] Criar o tópico SNS dedicado `center-summary-refresh` e expor seu ARN à API em `infra/summary-center-sync-topic.tf` e `infra/variables.tf`.
- [ ] T018 [US1] Criar a fila SQS Standard de sincronização e sua DLQ, com redrive e `maxReceiveCount` de pelo menos cinco, em `infra/summary-center-sync-queues.tf`.
- [ ] T019 [US1] Assinar a fila SQS no tópico SNS com entrega raw e configurar a queue policy para aceitar mensagens somente daquele tópico em `infra/summary-center-sync-subscription.tf`.
- [ ] T020 [US1] Criar a Lambda worker e sua role de menor privilégio, conceder `sns:Publish` à API, configurar o event source mapping SQS com `ReportBatchItemFailures`, timeout de visibilidade de pelo menos seis vezes o timeout da Lambda e injeção segura de `GEOAPIFY_API_KEY` em `infra/summary-center-sync-worker.tf` e `infra/variables.tf`.

**Checkpoint**: A submissão publica o evento, o worker atualiza o Centro de forma idempotente e consultas mantêm o contrato público existente.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Documentar recuperação operacional e validar o fluxo completo sem acessar serviços de produção.

- [ ] T021 [P] Documentar em `specs/001-summary-centro-sync/quickstart.md` como reconstruir e republicar manualmente o evento a partir de uma summary persistida, incluindo checagem de logs/DLQ e o risco de retry do cliente criar outra summary.
- [ ] T022 Executar os testes focados, `npm run build` e as validações Terraform descritas em `specs/001-summary-centro-sync/quickstart.md`; corrigir falhas relacionadas à feature e registrar os resultados.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências; prepara o SDK SNS.
- **Foundational (Phase 2)**: depende de Setup; contrato e versão idempotente bloqueiam a implementação da história.
- **User Story 1 (Phase 3)**: depende da fundação. Os testes são escritos primeiro; implementação pode ser paralelizada apenas onde indicado.
- **Polish (Phase 4)**: depende da implementação da US1; documentação e validação concluem a entrega.

### User Story Dependencies

- **User Story 1 (P1)**: depende da Phase 2. É a única história e pode ser entregue como MVP.

### Within User Story 1

- T006–T010 definem primeiro os testes focados em arquivos separados.
- T011 e T013 podem avançar em paralelo após os testes; T012 depende de T011.
- T014 depende da lógica de extração de T013; T015 integra o publicador, processador e geocodificação.
- T016 pode avançar em paralelo com o publicador/processador, após seus testes.
- T017 e T018 criam recursos independentes; T019 depende do tópico e da fila. T020 depende do handler de T015 e da fila de T018.
- T021 depende do contrato de evento e da infraestrutura SNS/SQS; T022 roda após todas as alterações.

### Dependency Graph

```text
T001 -> T002, T003
T003 -> T004 -> T005
T002 + T005 -> T006-T010
T001 + T002 + T006 -> T011 -> T012
T005 + T007 -> T013 -> T014
T012 + T013 + T014 + T009 -> T015
T010 -> T016
T001 -> T017, T018
T017 + T018 -> T019
T012 + T015 + T017 + T018 -> T020
T002 + T019 + T020 -> T021
T006-T021 -> T022
```

### Parallel Opportunities

- Na fundação, T002 pode ser feita em paralelo com T003; T004 pode ocorrer depois de T003 enquanto T002 é concluída.
- Os testes T006–T010 podem ser escritos em paralelo, pois alteram arquivos diferentes.
- Após os testes, T011, T013 e T016 podem ser implementados em paralelo; T012, T014 e T015 seguem as dependências acima.
- T017 (tópico) e T018 (filas) podem ser feitos em paralelo em arquivos Terraform separados; T019 (assinatura SNS→SQS) e T020 (Lambda listener/event source mapping) vêm depois das respectivas dependências.

## Parallel Example: User Story 1

```text
T006: Testar publicação e falha SNS em src/application/summary/summary.service.spec.ts
T007: Testar mapeamento de profile em src/application/summary/summary-centro-refresh.service.spec.ts
T008: Testar geocodificação em src/application/centros/geocoding.service.spec.ts
T009: Testar lote SQS em src/summary-updates/summary-updates.lambda.spec.ts
T010: Testar leituras de centro em src/application/centros/centros.service.spec.ts
T017: Criar tópico SNS em infra/summary-center-sync-topic.tf
T018: Criar fila SQS e DLQ em infra/summary-center-sync-queues.tf
T019: Assinar SNS à fila SQS em infra/summary-center-sync-subscription.tf
T020: Criar Lambda listener SQS em infra/summary-center-sync-worker.tf
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Concluir Setup e Foundational.
2. Escrever os testes focados T006–T010 e verificar que falham antes da implementação.
3. Implementar a US1, incluindo SNS, processamento SQS, atualização do Centro, geocodificação e infraestrutura.
4. Executar T022 sem apontar para AWS ou MongoDB de produção.

### Incremental Delivery

1. Entregar primeiro a fundação do contrato e compare-and-set da versão.
2. Integrar publicação SNS e confirmar o tratamento explícito de erro após persistência.
3. Integrar worker SQS e sincronização versionada; validar a recuperação de geocodificação pendente.
4. Remover apenas o fallback de `FUNCIONAMENTO`, preservar `ATENDIMENTOS` e validar os contratos HTTP.
5. Finalizar tópico SNS, filas/DLQ, assinatura, Lambda listener e instruções de replay manual; validar o quickstart.
