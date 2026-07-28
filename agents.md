# AEE Digital API - Guia Operacional para Agentes

## 1. Resumo do projeto

- **Nome**: AEE Digital API
- **Objetivo**: API backend para cadastro e consulta de regionais, centros, formularios, perguntas, respostas, summaries, pessoas e credenciais.
- **Stack principal**: NestJS 11 + TypeScript + Fastify + Mongoose.
- **Arquitetura**: `Controller -> Application Service -> Domain Repository -> Infra (Mongo/Memory)`.
- **Status**: desenvolvimento ativo, com artefatos para execucao em Lambda e infraestrutura Terraform.

---

## 2. Estrutura real do repositorio

```text
src/
  app.module.ts
  app.factory.ts
  main.ts
  lambda.ts

  application/
    answers/ centros/ forms/ passes/ pessoas/ questions/ regionais/ summary/

  domain/
    entities/
    repositories/

  infra/
    mongo/
    memory/
    persistence/

  base/
    model.generic.service.ts
    mappers/
    dto/

  services/
    cache.service.ts
    logger.service.ts

  <modulo>/
    *.controller.ts
    *.module.ts
    *.presenter.ts
    dto/
    schemas/

test/
  *.e2e-spec.ts
```

---

## 3. Arquitetura e convencoes importantes

### 3.1 Camadas

- **Controller**: recebe DTO externo (majoritariamente UPPERCASE), valida e mapeia para input de dominio.
- **Application service**: regras de negocio, composicao entre modulos e tratamento de `NotFoundException`.
- **Domain repository**: contrato abstrato por agregado.
- **Infra**: implementacoes MongoDB e Memory, registradas por `PersistenceModule`.

### 3.2 Convencao de nomes de campos

- **API externa**: em geral UPPERCASE (`NOME_CENTRO`, `FORM_ID`, `QUESTION_ID`).
- **Dominio**: camelCase (`nomeCentro`, `formId`, `questionId`).
- **Persistencia Mongo**: majoritariamente UPPERCASE, com excecoes (`passes` usa `user`, `pass`, `scope_id`).
- **Presenters** convertem dominio de volta para o contrato publico.

### 3.3 Inversao de dependencia

Repositorios sao injetados via tokens de `src/domain/repositories/repository.tokens.ts`, resolvidos dinamicamente por `PersistenceModule.forRoot()`.

---

## 4. Persistencia (Mongo x Memory)

### 4.1 Chave de selecao

- Variavel: `PERSISTENCE_DRIVER`.
- `memory`: usa repositorios in-memory.
- qualquer outro valor (default `mongo`): usa Mongoose.

### 4.2 Observacao critica

`src/app.module.ts` usa `MongooseModule.forRoot(...)` com URI hardcoded do Atlas quando o driver nao e `memory`.

Isso significa que, no estado atual, local pode conectar em banco real se nao estiver em modo memory.

### 4.3 Repositorios com metodos especiais

- `SummaryRepository`:
  - `stats`
  - `findByCentroIds`
  - `findLatestByCentroIds`
- `RegionalRepository`:
  - `overview`
- `AnswerRepository`:
  - `findByCentroIds`
- `PersonRepository`:
  - `findByIds`

---

## 5. Recursos e endpoints expostos

### Base

- `GET /` -> health simples (`Hello World!`)
- `GET /clearcache` -> limpa cache global

### Centros (`/centros`)

- `POST /`
- `GET /`
- `GET /:id`
- `GET /:id/summaries`
- `PATCH /:id`
- `DELETE /:id`

### Regionais (`/regionais`)

- `POST /`
- `GET /`
- `GET /overview`
- `GET /:id`
- `GET /:id/summaries`
- `GET /:id/centros`
- `PATCH /:id`
- `GET /:id/coord-summary`
- `GET /:id/centros-with-answers`
- `DELETE /:id`

### Forms (`/forms`)

- `POST /`
- `GET /`
- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

### Questions (`/questions`)

- `POST /`
- `GET /`
- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

### Answers (`/answers`)

- `POST /`
- `GET /`
- `GET /:id`
- `PATCH /:id`
- `PUT /` (upsert; filtro por query string `centroId`, `questionId`, `answerId`)
- `DELETE /:id`

### Summaries (`/summaries`)

- `POST /`
- `GET /`
- `GET /stats`
- `GET /:id`
- `PATCH /:id`
- `PATCH /:id/validated-by-coord`
- `DELETE /:id`

### Passes (`/passes`)

- `POST /`
- `GET /`
- `GET /:id`
- `PATCH /:id`
- `PATCH /:id/last-logged-in`
- `DELETE /:id`

### Pessoas (`/pessoas`)

- `POST /`
- `GET /`
- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

---

## 6. Regras de negocio relevantes por modulo

### 6.1 Regionais

- `overview`: agrega centros por regional e total de centros "finalizados" com summaries no intervalo.
- `coord-summary`: retorna pacote agregado com regional, coordenador, centros, latest summaries por centro, formulario e lista de coordenadores.
- `centros-with-answers`: enriquece centros com answers e/ou summaries conforme `include=answers,summaries` e `limitSummaries`.

### 6.2 Summaries

- filtros suportam `dateFrom`, `dateTo`, `limit`, `skip`, `sort`.
- `stats` retorna:
  - `eventsByDay`
  - `respondedCount` (centros distintos no periodo)
  - `totalCentros`

### 6.3 Forms

- `GROUP` dentro de `PAGES.QUIZES.QUESTIONS` pode vir populado com dados completos de `Questions`.

---

## 7. Entidades de dominio (visao pratica)

- `Centro`: funcionamento + dados cadastrais e geograficos.
- `Regional`: nome, pais, coordenador.
- `Form`: name/version/createdBy + pages/quizes/questions.
- `QuestionEntity`: question, answerType, isRequired, isMultiple, presetValues, role.
- `Answer`: centroId, questionId, answer, quizId.
- `Summary`: formId, centroId, questions[{questionId, answer}], validatedByCoordAt.
- `Pass`: user, pass, scopeId, groups, lastLogged.
- `Person`: name, email, celular.

---

## 8. Runtime HTTP, middleware e erros

- Bootstrap central em `src/app.factory.ts`.
- Adapter HTTP: **Fastify**.
- Parser JSON custom para aceitar `application/json` com body vazio (retorna `{}`).
- Parser `application/x-www-form-urlencoded` registrado manualmente.
- CORS atualmente liberado globalmente (`allowAllCors = true`).
- `ValidationPipe` global.
- `HttpExceptionFilter` global padronizando resposta de erro.
- `ReqnameMiddleware` loga metodo, URL e preview do body.

---

## 9. Cache e logging

### Cache

- `CacheModule` global.
- `CacheService` rastreia chaves por modelo e invalida por prefixo ao `set/delete`.
- endpoint de manutencao: `GET /clearcache`.

### Logging

- `WinstonLogger`:
  - logs de erro em nivel `error`
  - log de request em nivel `info` via `logRequest`
  - `log/warn/debug/verbose` sem operacao

---

## 10. Scripts e comandos relevantes

### NPM scripts

- `npm run start:dev`
- `npm run start:debug`
- `npm run build`
- `npm run test`
- `npm run test:cov`
- `npm run test:e2e`
- `npm run lint`
- `npm run pre-deploy`

### Docker / local

- `npm run docker:up`
- `npm run docker:down`
- `npm run docker:logs`
- `npm run docker:clean`
- `./scripts/setup.sh` para bootstrap local

### Deploy Lambda + Terraform

- `./scripts/deploy.sh`
  - build
  - empacota `dist.zip`
  - roda `terraform init` e `terraform apply`

### Indices Mongo (performance)

- Script: `node scripts/performance/create-indexes.mjs`
- Referencia: `docs/performance-indexes.md`

---

## 11. Testes

- Unitarios: `src/**/*.spec.ts`.
- E2E: `test/*.e2e-spec.ts`.
- Suites E2E cobrem controllers principais (`app`, `management`, `centros`, `regionais`, `forms`, `questions`, `answers`, `summary`, `passes`, `pessoas`).

---

## 12. Atencao para quem for evoluir o projeto

1. **Nao assumir ambiente seguro por padrao**: ha risco real de operar contra Atlas.
2. **Nao quebrar contrato externo**: manter mapeamento UPPERCASE nos DTOs/presenters.
3. **Ao criar novo recurso**, manter padrao completo:
   - entidade em `domain/entities`
   - contrato em `domain/repositories`
   - service em `application/<modulo>`
   - controller + DTO + presenter
   - repo em `infra/mongo` e, se aplicavel, `infra/memory`
   - registro no `PersistenceModule`
   - testes unitarios e E2E
4. **Padrao de erro**: usar excecoes do Nest (`NotFoundException`, `BadRequestException`, etc.).
5. **Padrao de datas em filtros**: usar `parseDateInput` quando endpoint aceitar intervalo temporal.

---

## 13. Riscos tecnicos observados no estado atual

- URI Mongo hardcoded em `AppModule`.
- Credenciais e dados sensiveis expostos no repositorio/doc local.
- `passes.pass` aparenta ser armazenado em texto puro.
- endpoint `/clearcache` sem autenticacao/autorizacao.
- CORS aberto globalmente.

---

## 14. Referencias internas

- `src/app.module.ts`
- `src/app.factory.ts`
- `src/infra/persistence/persistence.module.ts`
- `src/application/regionais/regionais.service.ts`
- `src/infra/mongo/summaries.mongo.repository.ts`
- `docs/current-data-model.md`
- `docs/dynamodb-model.md`
- `docs/performance-indexes.md`

---

**Ultima atualizacao**: 2026-02-11

@RTK.md
