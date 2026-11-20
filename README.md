# AEE Digital API

API backend da Aliança para cadastro e consulta de centros, regionais, pessoas,
formulários, perguntas, respostas e summaries.

O projeto usa NestJS 11, TypeScript, Fastify, Mongoose e MongoDB. Também possui
artefatos AWS: implantação em Lambda, API Gateway REST, SQS e integração com uma
função Lambda separada responsável pelas projeções do dashboard.

## Tecnologias

- Node.js 20
- NestJS 11
- Fastify 5
- Mongoose 8 / MongoDB
- AWS SDK v3 (`Lambda`, `SQS`)
- Terraform AWS provider
- Jest

## Arquitetura

O fluxo principal é:

```text
Controller -> Application Service -> Domain Repository -> Infra (Mongo ou Memory)
```

- `src/*/*.controller.ts`: contrato HTTP externo e apresentação dos dados.
- `src/application/`: regras de negócio e composição entre módulos.
- `src/domain/`: entidades e contratos dos repositórios.
- `src/infra/mongo/`: persistência Mongoose.
- `src/infra/memory/`: implementação em memória usada por testes e desenvolvimento.
- `src/dashboard-projections/`: consulta de modelos de leitura e publicação de eventos.

Os nomes externos em geral usam UPPERCASE (`NOME_CENTRO`, `FORM_ID`,
`QUESTION_ID`), enquanto o domínio usa camelCase. Os presenters convertem o
domínio de volta para o formato da API.

## Persistência

Selecione o driver com `PERSISTENCE_DRIVER`:

- `memory`: usa repositórios em memória.
- qualquer outro valor ou ausência da variável: usa MongoDB.

O modo padrão é `mongo`. Em modo Mongo, defina `MONGODB_URI` em `.env`.
Consulte `.env.example` para o conjunto completo de variáveis.

> Atenção: não execute localmente contra o Mongo de produção sem confirmar a
> URI. Nunca registre credenciais reais no repositório.

## Desenvolvimento local

### Novas funcionalidades com Spec Kit

O projeto está configurado com GitHub Spec Kit e skills para GitHub Copilot em
`.github/skills/`. Para cada nova funcionalidade, execute as skills no chat do
Copilot, revisando cada resultado antes de avançar:

1. `/speckit-specify` — descreva o resultado esperado e os limites de
   compatibilidade.
2. `/speckit-clarify` — opcional, para resolver ambiguidades.
3. `/speckit-plan` — planeje a solução conforme a arquitetura existente.
4. `/speckit-tasks` e `/speckit-analyze` — gere tarefas e verifique
   consistência.
5. `/speckit-implement` — implemente as tarefas aprovadas.
6. `/speckit-converge` — verifique lacunas e repita implementação/convergência
   até concluir.

A constituição do projeto fica em `.specify/memory/constitution.md`. Os
artefatos de cada funcionalidade ficam em `specs/`. A skill
`/speckit-constitution` serve para propor alterações futuras aos princípios do
projeto; eles já estão definidos para esta base de código.

### Instalação

```bash
npm install
```

### Executar

```bash
npm run start:dev
```

Por padrão, o servidor local usa a porta definida por `PORT` ou `5001`.

Com Docker:

```bash
npm run docker:up
npm run docker:down
npm run docker:logs
npm run docker:clean
```

O compose expõe a API em `http://localhost:5001`.

## Configuração

Variáveis principais:

| Variável | Uso |
| --- | --- |
| `PERSISTENCE_DRIVER` | `memory` ou `mongo` |
| `MONGODB_URI` | conexão MongoDB |
| `MONGODB_MAX_POOL_SIZE` | tamanho máximo do pool |
| `MONGODB_MAX_IDLE_TIME_MS` | tempo máximo ocioso da conexão |
| `MONGODB_CONNECT_TIMEOUT_MS` | timeout de conexão |
| `MONGODB_SOCKET_TIMEOUT_MS` | timeout do socket |
| `MONGODB_SERVER_SELECTION_TIMEOUT_MS` | timeout de seleção do servidor |
| `PORT` | porta HTTP local |
| `LOCATION_UPDATE_TOKEN` | protege `PUT /centros/:id/localizacao` |
| `AWS_REGION` | região dos clientes AWS |
| `DASHBOARD_PROJECTIONS_FUNCTION_NAME` | Lambda consultada pelas projeções |
| `DASHBOARD_PROJECTIONS_QUEUE_URL` | SQS que recebe eventos `center.finished.v1` |
| `ANSWERS_WRITE_DISABLED` | bloqueia mutações de respostas em manutenção |

As configurações AWS do Terraform também recebem nomes semelhantes por meio de
`lambda_env`.

## Endpoints

### Base

- `GET /`: health simples.
- `GET /clearcache`: limpa o cache em memória.

### Cadastro

- `/cadastro-info`
  - `POST /cadastro-info`
  - `GET /cadastro-info/active`

### Centros

- `POST /centros`
- `GET /centros`
- `GET /centros/:id`
- `PUT /centros/:id/localizacao`
- `GET /centros/:id/summaries`
- `GET /centros/:id/answers`
- `PATCH /centros/:id`
- `DELETE /centros/:id`

`PUT /centros/:id/localizacao` é uma operação operacional protegida pelo header
`x-location-update-token`. Ela exige o token configurado em
`LOCATION_UPDATE_TOKEN`.

### Regionais

- `POST /regionais`
- `GET /regionais`
- `GET /regionais/overview`
- `GET /regionais/:id`
- `GET /regionais/:id/summaries`
- `GET /regionais/:id/centros`
- `GET /regionais/:id/coord-summary`
- `GET /regionais/:id/centros-with-answers`
- `PATCH /regionais/:id`
- `DELETE /regionais/:id`

### Outros recursos

- `/forms`: CRUD.
- `/questions`: CRUD.
- `/answers`: CRUD e `PUT /answers` para upsert por `centroId`,
  `questionId` e `answerId`.
- `/summaries`: CRUD, estatísticas e validação pelo coordenador.
- `/passes`: CRUD e atualização de último login.
- `/pessoas`: CRUD.
- `/dashboard-projections/global`
- `/dashboard-projections/regions/:id`

`GET /summaries/stats` aceita filtros de data e status.
Os endpoints agregados de regionais aceitam intervalos em formato brasileiro
`DD/MM/AAAA` por meio do parser compartilhado `parseDateInput`.

## Dashboard por projeções

Ao criar um summary, a aplicação tenta publicar o evento
`center.finished.v1` na fila SQS configurada em
`DASHBOARD_PROJECTIONS_QUEUE_URL`.

A falha no envio é registrada em log e não impede a persistência do summary.
As consultas HTTP `/dashboard-projections/global` e
`/dashboard-projections/regions/:id` sincronamente invocam a Lambda definida em
`DASHBOARD_PROJECTIONS_FUNCTION_NAME`.

O intervalo das consultas usa `from` e `to` em formato ISO `YYYY-MM-DD`.
Eles devem ser informados juntos e `from` não pode ser posterior a `to`.
O ciclo ativo vem de `cadastro-info`.

## Geocodificação de centros

A API não chama Geoapify diretamente no CRUD. Campos de localização produzidos
pela operação ficam separados do restante do cadastro:

- `LOCALIZACAO.STATUS=PENDENTE` após criação ou alteração real do endereço;
- coordenadas antigas não são mantidas em alterações de endereço;
- somente `STATUS=CONFIRMADA` deve aparecer automaticamente no mapa;
- o script operacional usa `ENDERECO_HASH` para evitar sobrescrever endereço novo.

Examine todos os centros sem consumir chamadas ao Geoapify:

```bash
ALL_CENTROS=true npm run geocode:centros
```

Execute o backfill:

```bash
API_BASE_URL=https://api.exemplo \
GEOAPIFY_API_KEY=... \
LOCATION_UPDATE_TOKEN=... \
ALL_CENTROS=true \
DRY_RUN=false \
npm run geocode:centros
```

Opções adicionais: `REGIONAL_ID`, `CENTRO_IDS`, `CONCURRENCY`, `INTERVAL_MS`,
`MAX_CALLS` e `FORCE`. O dry-run não chama o Geoapify nem altera centros.
Relatórios JSON e CSV são gerados pelo script.

## Outros scripts

```bash
npm run dashboard-projections:backfill
npm run summary-v2:backfill
npm run centros:backfill-contacts
```

Os scripts operacionais podem exigir AWS CLI, perfil AWS, MongoDB ou variáveis
específicas. Revise o arquivo antes de executar em produção.

Veja [Scripts operacionais e de manutenção](docs/scripts.md) para o objetivo,
entrada, modo de execução e efeitos de cada script.

## Testes

```bash
npm run test
npm run test:e2e
npm run test:cov
```

As suites unitárias ficam em `src/**/*.spec.ts`. Os testes e2e ficam em
`test/*.e2e-spec.ts`.

## Build e produção

Build local:

```bash
npm run build
```

O handler Lambda fica em `dist/lambda.handler`. A implantação usa
`scripts/deploy.sh`:

```bash
./scripts/deploy.sh [aws-profile]
```

O script valida a conta AWS, cria `dist.zip`, instala dependências de produção,
executa `terraform apply` e registra um manifesto de rollback em
`.deploy-releases/`.

O Terraform em `infra/` cria:

- função Lambda;
- alias `live`;
- API Gateway REST e suas rotas;
- política para invocar a Lambda de dashboard;
- política para publicar eventos SQS;
- bucket versionado para o artefato;
- staging no S3.

## Documentação complementar

- [Modelo de dados atual](docs/current-data-model.md)
- [Scripts operacionais e de manutenção](docs/scripts.md)
- [Plano de funcionamento dos centros](docs/centro-funcionamento-plan.md)
- [Análise da migração AWS-native](docs/aws-native-migration-analysis.md)
