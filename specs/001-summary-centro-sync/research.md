# Research: atualização assíncrona dos dados do centro

## Decisões

### R1. Publicar eventos em SNS e consumir por SQS

- **Decision**: Publicar um evento versionado em um tópico SNS; manter uma fila SQS dedicada inscrita no tópico e ligá-la a uma Lambda de trabalho por event source mapping. Habilitar entrega raw do SNS para que o corpo da fila seja diretamente o evento de domínio.
- **Rationale**: SNS desacopla o publicador dos consumidores e permite fan-out futuro; SQS mantém as mensagens disponíveis enquanto o worker está indisponível. A documentação da AWS descreve o envio do tópico para a fila inscrita e a persistência da mensagem na fila.
- **Alternatives considered**:
  - Publicar diretamente em SQS: corresponde ao padrão existente para projeções do dashboard e tem menos componentes, mas não oferece o fan-out do tópico solicitado.
  - Reutilizar a fila do dashboard: rejeitado porque ela tem outro contrato e outro consumidor.
- **Sources**:
  - [SNS fanout to SQS](https://docs.aws.amazon.com/sns/latest/dg/sns-sqs-as-subscriber.html)
  - [SNS raw message delivery](https://docs.aws.amazon.com/sns/latest/dg/sns-large-payload-raw-message-delivery.html)

### R2. Usar um handler Lambda separado para a fila

- **Decision**: Criar um entrypoint de worker dedicado, separado do handler HTTP existente.
- **Rationale**: `src/lambda.ts` adapta eventos HTTP do API Gateway ao Fastify. O event source mapping do SQS invoca a função com lotes de registros SQS, que requerem tratamento próprio. Um worker separado mantém o contrato HTTP e o processamento de mensagens independentes.
- **Alternatives considered**:
  - Enviar eventos SQS ao handler HTTP atual: rejeitado porque ele não roteia eventos SQS e tentaria tratá-los como requisições HTTP.
- **Sources**:
  - [Lambda with SQS event source mappings](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)
  - Repositório: `src/lambda.ts`, `infra/main.tf`

### R3. Usar fila Standard e tornar o worker idempotente

- **Decision**: Usar SQS Standard; carregar a summary persistida mais recente do centro e comparar sua versão com a última versão aplicada ao centro antes de atualizar.
- **Rationale**: SQS Standard oferece alta capacidade, mas pode entregar mensagens duplicadas ou fora de ordem. A atualização representa o estado mais recente do centro, não a execução de cada evento histórico; uma comparação monotônica impede que uma summary antiga reverta dados novos. A execução repetida da mesma versão deve ser um no-op.
- **Alternatives considered**:
  - SQS FIFO: oferece ordenação por grupo, mas não elimina duplicatas e adiciona restrições que não são necessárias quando a escrita já protege contra versões antigas.
  - Confiar somente na ordem de chegada: rejeitado porque Standard não garante ordem e Lambda pode reprocessar mensagens.
- **Sources**:
  - [SQS Standard queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues.html)
  - [Lambda with SQS: at-least-once delivery](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)
  - [Transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)

### R4. Preservar publicação rápida e recuperar falhas de publicação operacionalmente

- **Decision**: A API persiste a summary, publica o evento e aguarda somente a confirmação do SNS; não aguarda o worker nem a geocodificação. Se a publicação falhar após a persistência, a API retorna uma resposta não-success e registra os IDs do centro e da summary para replay operacional. A summary permanece persistida; uma repetição pelo cliente pode criar outra summary. O replay publica o mesmo evento determinístico, protegido pela idempotência e comparação de versão do worker. Outbox transacional fica fora do escopo.
- **Rationale**: A resposta HTTP não fica acoplada ao tempo de execução do processamento. A escrita no Mongo e o envio ao SNS são operações em sistemas distintos; falha no envio após salvar exige registro e recuperação explícitos. A escolha favorece a menor complexidade, aceitando o risco de uma summary persistida apesar da resposta não-success e de uma possível summary duplicada após retry do cliente. A AWS documenta o padrão outbox para garantir atomicidade quando essa garantia for necessária.
- **Alternatives considered**:
  - Aguardar a conclusão do worker: rejeitado pela decisão de produto; o usuário não deve esperar nem consultar um estado.
  - Ignorar falha do SNS após salvar a summary: rejeitado porque poderia deixar a atualização sem mensagem e sem indicação operacional.
  - Outbox transacional com relay e recuperação automática: oferece garantia mais forte de entrega, mas exige um mecanismo adicional. Reavaliar se o volume de falhas de publicação ou o custo do replay manual justificar a complexidade.
- **Sources**:
  - [Transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)
  - Repositório: `src/application/summary/summary.service.ts` (o evento existente de dashboard já é publicado após criar a summary e erros são registrados)

### R5. Configurar retries, falhas parciais e DLQ

- **Decision**: Configurar redrive para uma dead-letter queue, limite de recebimentos de pelo menos cinco, resposta de falhas parciais (`ReportBatchItemFailures`) e alarmes operacionais para mensagens na DLQ. O timeout de visibilidade da fila deve ser ao menos seis vezes o timeout da Lambda.
- **Rationale**: Uma mensagem que falha deve ser tentada novamente sem reprocessar itens bem-sucedidos do mesmo lote; falhas persistentes precisam ficar disponíveis para diagnóstico e replay. A função também deve ser idempotente.
- **Alternatives considered**:
  - Falhar o lote inteiro em qualquer erro: rejeitado porque reexecuta mensagens já processadas com sucesso.
  - Descartar a mensagem após um erro: rejeitado porque contradiz o requisito de registrar falhas operacionais.
- **Sources**:
  - [Lambda SQS error handling](https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-errorhandling.html)
  - [SQS event source mapping configuration](https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-configure.html)

### R6. Publicar somente identificadores e versão no evento

- **Decision**: O evento inclui versão do schema, event ID, summary ID, centro ID e versão de origem; não inclui telefone, site, endereço nem respostas da summary. O worker lê a summary armazenada para derivar os dados.
- **Rationale**: Evita duplicar dados pessoais no broker e permite que eventos duplicados ou atrasados usem a versão atualmente válida.
- **Alternatives considered**:
  - Colocar os valores completos no evento: rejeitado por duplicar dados pessoais e permitir que eventos atrasados carreguem valores desatualizados.

### R7. Persistir funcionamento e manter a apresentação de ATENDIMENTOS

- **Decision**: Derivar `FUNCIONAMENTO` do snapshot de attendance já salvo na summary, persistir no Centro no worker e remover somente a derivação de `FUNCIONAMENTO` feita durante a leitura do centro. Preservar a apresentação separada de `ATENDIMENTOS` baseada na summary.
- **Rationale**: O schema Mongo e a entidade Centro já incluem funcionamento; `deriveAttendance` e a conversão para o formato legado já existem. O presenter também expõe `ATENDIMENTOS`, contrato distinto do horário geral.
- **Alternatives considered**:
  - Remover toda leitura de summaries do fluxo de centros: rejeitado porque também removeria `ATENDIMENTOS` da resposta atual.
  - Ler as respostas atuais de Answers no worker: rejeitado porque a summary já contém snapshot e attendance derivados e deve ser a fonte dos dados aceitos naquele envio.
- **Sources**:
  - Repositório: `src/application/summary/summary.snapshot.ts`
  - Repositório: `src/application/centros/centros.service.ts`
  - Repositório: `src/centros/centro.presenter.ts`

### R8. Reutilizar as salvaguardas existentes de endereço/localização

- **Decision**: Ao persistir endereço, invalidar a localização anterior para o novo endereço e recalcular geografia usando o hash do endereço. Só aceitar resultado geográfico se o hash ainda corresponder ao endereço atual; registrar falhas como não confirmadas/erro para tratamento operacional.
- **Rationale**: O serviço de centro já marca localização como pendente quando o endereço muda e rejeita resultados com hash antigo. O script atual de geocodificação é operacional, usa um provedor externo e não é um consumidor de evento.
- **Sources**:
  - Repositório: `src/application/centros/centros.service.ts`
  - Repositório: `src/infra/mongo/centros.mongo.repository.ts`
  - Repositório: `scripts/geocode-centros.mjs`

## Contexto encontrado no repositório

- `SummaryAppService.create` persiste uma snapshot, deriva `attendance` e `publicationAuthorized`, e em seguida publica um evento de dashboard por SQS.
- O handler Lambda atual é HTTP/Fastify; a infraestrutura Terraform atual permite envio direto para uma fila de dashboard, mas não define tópico SNS, fila de sincronização ou event source mapping para um worker.
- `Centro` e os repositórios Mongo/Memory já persistem o objeto semanal de funcionamento. A leitura atual também deriva funcionamento da summary mais recente; essa derivação será removida sem retirar `ATENDIMENTOS`.
- A atualização de contato segue a autorização de divulgação e a regra de remoção definida na especificação. A atualização de endereço só usa respostas válidas; localização geográfica é processada separadamente hoje.
- Nenhum preenchimento retroativo de funcionamento será feito. Centros sem funcionamento persistido continuam sem fallback para summaries antigas.
