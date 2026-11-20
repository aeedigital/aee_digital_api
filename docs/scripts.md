# Scripts operacionais e de manutenção

Este documento descreve os scripts em `scripts/` e os scripts npm relacionados.
Os scripts de manutenção podem alterar dados reais ou publicar recursos na AWS;
execute-os primeiro em dry-run ou staging e confirme os pré-requisitos.

## Convenções de segurança

- Scripts MongoDB sensíveis exigem uma variável de ambiente que contém a URI,
  em vez de aceitar a URI diretamente na linha de comando.
- Preferir perfil AWS dedicado e confirmar a conta antes de executar scripts AWS.
- Não registrar tokens, senhas ou URI MongoDB em manifestos, logs ou commits.
- Backfills com rollback criam coleções ou arquivos de journal com o `run-id`.
- Dry-run deve preceder apply. A execução real só deve ocorrer com backup,
  janela de manutenção ou reconciliação definida.

## Scripts npm

### `npm run geocode:centros`

Executa `scripts/geocode-centros.mjs`.

Consulta os centros pela API, monta o endereço, chama o Geoapify e envia a
localização para `PUT /centros/:id/localizacao`. O script controla concorrência,
intervalo, timeout e teto de chamadas.

Variáveis principais:

- `API_BASE_URL`: URL da API; padrão `http://localhost:5000`.
- `GEOAPIFY_API_KEY`: chave do Geoapify.
- `LOCATION_UPDATE_TOKEN`: token da rota operacional.
- `DRY_RUN`: padrão `true`; use `false` para aplicar.
- `FORCE`: processa centros já confirmados quando `true`.
- `REGIONAL_ID`: limita a uma regional.
- `CENTRO_IDS`: lista separada por vírgula.
- `ALL_CENTROS=true`: processa todos os centros.
- `CONCURRENCY`, `INTERVAL_MS`, `GEOCODING_TIMEOUT_MS`, `MAX_CALLS`.
- `REPORT_PREFIX`: prefixo dos relatórios.

Sem seleção explícita, o script falha. Ele gera um relatório JSON e outro CSV.
Endereços insuficientes e localizações confirmadas são ignorados, salvo
`FORCE=true`. Resultados divergentes podem ser classificados como aproximados.

Exemplo seguro:

```bash
ALL_CENTROS=true npm run geocode:centros
```

Exemplo de aplicação:

```bash
API_BASE_URL=https://api.exemplo \
GEOAPIFY_API_KEY=... \
LOCATION_UPDATE_TOKEN=... \
ALL_CENTROS=true \
DRY_RUN=false \
npm run geocode:centros
```

### `npm run dashboard-projections:backfill`

Executa `scripts/backfill-dashboard-projections.mjs`.

Por padrão mostra o cálculo que seria enviado para o backfill das projeções.
Com `--apply`, reconstrói eventos `center.finished.v1` a partir do cadastro,
ciclo ativo e summaries, publica em lotes na SQS e valida a DLQ e as projeções.

Principais opções:

- `--api-url`
- `--queue-url`
- `--dlq-url`
- `--profile`
- `--region`
- `--function-name`
- `--table-name`
- `--timeout-seconds`

Pré-requisitos:

- AWS CLI configurado.
- Perfil autorizado para Lambda, SQS e DynamoDB.
- API acessível.
- Cadastro ativo válido.
- Fila e tabela de projeções já existentes.

Exemplo:

```bash
npm run dashboard-projections:backfill
npm run dashboard-projections:backfill -- --apply --profile bruno
```

### `npm run summary-v2:backfill`

Executa `scripts/summary-v2-backfill.ts`.

Migra metadados das respostas e reconstrói summaries no formato v2. Também
preserva informações históricas dos summaries existentes em journal separado.

Sintaxe:

```bash
npm run summary-v2:backfill -- <dry-run|apply|verify|rollback> \
  --uri-env MONGODB_URI \
  [--db database] \
  [--run-id id] \
  [--output-dir dir]
```

Modos:

- `dry-run`: calcula alterações e escreve manifest/relatório.
- `apply`: cria journals e aplica metadados e snapshots.
- `verify`: confirma quantidade, IDs e hash original dos Answers.
- `rollback`: restaura Answers e summaries pelos journals do run-id.

Os journals usam coleções temporárias com nomes prefixados por
`_summary_v2_answers_journal_` e `_summary_v2_summaries_journal_`.

### `npm run centros:backfill-contacts`

Executa `scripts/backfill-centro-public-contacts.ts`.

Deriva `TELEFONE` e `SITE` dos summaries mais recentes e os reconcilia com os
centros. Só inclui o contato público quando a autorização de divulgação está
presente como `true`, `SIM`, `S`, `1` ou `TRUE`.

Sintaxe igual ao backfill de summaries:

```bash
npm run centros:backfill-contacts -- <dry-run|apply|verify|rollback> \
  --uri-env MONGODB_URI \
  [--db database] \
  [--run-id id] \
  [--output-dir dir]
```

O modo `apply` cria `_centro_public_contacts_journal_<run-id>` para rollback.
O modo `verify` falha quando algum centro ainda diverge do contato esperado.

## Scripts de implantação e infraestrutura

### `scripts/deploy.sh`

Faz o ciclo completo de deploy para AWS.

Executa:

1. valida o perfil AWS e a conta;
2. consulta ou publica uma versão anterior para rollback;
3. preserva `ANSWERS_WRITE_DISABLED`;
4. instala dependências;
5. compila a aplicação;
6. cria `.lambda_build/` e `dist.zip`;
7. executa `terraform init` e `terraform apply`;
8. atualiza o alias `live`;
9. grava um manifesto em `.deploy-releases/`.

Uso:

```bash
./scripts/deploy.sh [aws-profile]
```

O padrão é `bruno`. A conta esperada é `115186094843`. O manifesto contém a
versão anterior e o comando de rollback.

### `scripts/answers-write-maintenance.sh`

Ativa ou desativa escritas em `answers` na Lambda de produção, preservando o
código implantado no alias `live`.

Uso:

```bash
./scripts/answers-write-maintenance.sh status [aws-profile]
./scripts/answers-write-maintenance.sh disable [aws-profile]
./scripts/answers-write-maintenance.sh enable [aws-profile]
```

Antes de publicar uma nova versão, verifica se o código novo da função coincide
com o código já associado ao alias. A ação cria uma versão Lambda e altera
`ANSWERS_WRITE_DISABLED`.

### `scripts/backup-answers-maintenance.sh`

Cria dois dumps BSON independentes das coleções do banco enquanto a escrita de
Answers está bloqueada.

Uso:

```bash
./scripts/backup-answers-maintenance.sh MONGO_URI_ENV DATABASE
```

O script exige `mongodump`, `mongorestore`, `mongosh`, `shasum` e `jq`.
Cada dump é restaurado em um banco temporário e comparado por contagem e hash.
Os arquivos são gravados em `BACKUP_OUTPUT_DIR` ou
`.maintenance/answers-backups/<run-id>/`.

### `scripts/init-localstack.sh`

Inicializa recursos básicos no LocalStack em `http://localhost:4566`:

- role IAM `aee-lambda-role`;
- tabela DynamoDB `aee_forms`;
- bucket S3 `aee-digital-bucket`.

Execute após iniciar o LocalStack. A implementação usa credenciais locais
fixas de desenvolvimento e não representa a infraestrutura AWS completa.

## Scripts de dados e manutenção direta

### `scripts/update-centro-addresses-from-summaries.mjs`

Obtém o endereço da resposta mais recente de cada centro e atualiza
`ENDERECO` por `PATCH /centros/:id`.

Seleção:

- `ALL_CENTROS=true`;
- `REGIONAL_ID`;
- `CENTRO_IDS`;
- o array interno `CENTRO_IDS` como fallback.

Variáveis:

- `API_BASE_URL`;
- `API_TOKEN`;
- `DRY_RUN=false` para aplicar;
- `FORM_QUESTION_CACHE_FILE`.

O cache mapeia `formId` para o ID da pergunta cujo label é `Endereço`.
Por padrão opera em dry-run. Retorna código de erro se houver erros por centro.

### `scripts/geocode-centros.mjs`

Também atualiza a localização geográfica. Veja o script npm equivalente acima
para configuração completa.

Diferenças em relação ao script de atualização de endereço:

- consulta o Geoapify;
- valida o resultado administrativo e o CEP;
- usa hash do endereço para impedir escrita concorrente obsoleta;
- produz confirmada, aproximada, não encontrada ou erro;
- controla um teto diário operacional de chamadas.

### `scripts/performance/create-indexes.mjs`

Cria ou mantém índices MongoDB em `answers`, `summaries` e `centros`.

A URI vem de `MONGODB_URI` ou `MONGO_URI`, com fallback legado embutido no
script. Os índices cobrem consultas por centro, regional, formulário e datas.

Uso:

```bash
MONGODB_URI='...' node scripts/performance/create-indexes.mjs
```

É seguro reexecutar: `createIndex` com a mesma chave/nome já existente mantém o
índice atual.

## Arquivos auxiliares

### `scripts/update-centro-address-question-ids.json`

Cache persistido por `update-centro-addresses-from-summaries.mjs`.
Mapeia IDs de formulário para IDs da pergunta de endereço.
Pode ser alterado quando o cache precisar apontar para novos formulários.

## Sequência típica de manutenção

1. Fazer backup do banco.
2. Executar o script em `dry-run`.
3. Revisar o manifest ou relatório gerado.
4. Desativar respostas por escrito, quando aplicável.
5. Executar `apply`.
6. Executar `verify`.
7. Reabilitar respostas.
8. Manter o manifest e o journal até confirmar o resultado.
9. Executar `rollback` com o mesmo `run-id` somente se necessário.
