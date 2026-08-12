# Análise e plano de migração AWS-native

## 1. Decisão recomendada

A Lambda monolítica atual é uma etapa válida de *lift-and-shift*, mas não deve ser dividida por controller ou endpoint. Para atender ao requisito de custo zero em pequenos usos, ela deve continuar fisicamente única no perfil inicial, embora modularizada internamente. A evolução recomendada é um *strangler* em fatias verticais, preservando os contratos HTTP:

1. manter a Lambda monolítica como fachada e rota de fallback;
2. extrair primeiro a geocodificação para eventos e fila;
3. criar modelos de leitura para consultas compostas;
4. separar poucas Lambdas por capacidade de negócio somente quando volume, isolamento ou ownership justificarem;
5. migrar a persistência apenas depois de estabilizar os limites.

A entrada HTTP oficial da arquitetura alvo é **CloudFront Free → Lambda Function URL**, sem API Gateway. No baixo tráfego, uma única Lambda HTTP modular atende todas as rotas; workers assíncronos continuam em funções separadas. Se houver necessidade de isolamento, o próprio CloudFront roteia path patterns para diferentes Function URLs. SQS, EventBridge Scheduler, DynamoDB provisionado e Parameter Store Standard completam o perfil econômico. Geoapify deixa o caminho síncrono de cadastro.

Diagramas editáveis:

- `architecture-current.drawio`: situação atual e acoplamentos;
- `architecture-small-free.drawio`: variante gratuita para baixo tráfego;
- `architecture-target-aws-native.drawio`: arquitetura alvo e fluxo de geocodificação;
- `aws-native-migration-roadmap.drawio`: fases, critérios de saída e rollback.

## 2. Evidências da arquitetura atual

### 2.1 Runtime implantado

O Terraform state local descreve uma única função `aee-digital-api`, ARM64, Node.js 20, 256 MB e timeout de 15 segundos. O handler é `dist/lambda.handler`; a função está atrás de um REST API Gateway `EDGE`, estágio `prod`, e o pacote é publicado por S3.

O `dist.zip` confirma o desenho: NestJS com Fastify e `@fastify/aws-lambda`, handler reutilizado entre invocações quentes e `callbackWaitsForEmptyEventLoop = false`. Portanto, o baseline real é uma Lambda monolítica, não o servidor Express do `src/main.ts`.

Há, porém, um risco operacional: o código compilado do `dist.zip` contém camadas de aplicação e persistência e endpoints mais novos que não estão integralmente presentes no `HEAD` versionado. O primeiro controle de migração deve ser garantir que qualquer pacote implantado seja reproduzível por commit, lockfile e pipeline; `dist.zip` e state não podem ser a fonte de verdade.

### 2.2 Domínios e acoplamentos

A aplicação contém nove áreas principais: centros, regionais, pessoas, formulários, perguntas, respostas, resumos, passes e gestão. A versão compilada acrescenta consultas compostas e `cadastro-info`.

Os acoplamentos que mais influenciam a divisão são:

| Fluxo | Dependências observadas | Consequência |
|---|---|---|
| Regional e seus centros/resumos | regionais → centros → summaries | não separar apenas por controller; há uma fronteira de consulta própria |
| Visão do coordenador | regional + centros + summaries + pessoas + forms + answers | bom candidato a modelo de leitura assíncrono |
| Centros com respostas | centros + summaries + answers | consulta agregada deve sair das Lambdas de comando |
| Formulários | forms com estrutura aninhada e referências a questions | forms/questions devem migrar juntos inicialmente |
| Cadastro de centro | centros + chamada externa Geoapify | latência e disponibilidade externas contaminam o comando síncrono |
| Cache | cache em memória e invalidação por `model.watch()` | cada ambiente quente pode duplicar watcher, socket e estado não compartilhado |

No código-fonte atual, o serviço genérico abre um Mongo Change Stream no construtor de cada serviço e limpa cache local quando recebe alterações. Em Lambda isso é inadequado: ambientes quentes são efêmeros, o cache não é compartilhado, cada instância pode criar watchers e pools próprios e conexões mantidas podem impedir escala previsível. A versão Lambda deve usar conexão reutilizada e limitada, sem watchers permanentes.

### 2.3 Persistência e consistência

Todos os módulos compartilham MongoDB Atlas. Os documentos e consultas revelam quatro grupos naturais:

- cadastro organizacional: centros, regionais e pessoas;
- conteúdo de avaliação: forms e questions;
- operação de avaliação: answers e summaries;
- consultas agregadas: overview, coord-summary, stats e centros-with-answers.

Hoje há referências por string e ObjectId de forma inconsistente, além de agregações e populações cruzadas. Uma mudança direta para DynamoDB exigiria redesenho por padrão de acesso e projeções; trocar o banco junto com a divisão das Lambdas elevaria demais o risco. Atlas deve permanecer na primeira etapa, com propriedade lógica de coleções e sem escrita cruzada entre capacidades.

### 2.4 Riscos prioritários

1. **Fonte de verdade:** artefato implantado não está claramente reproduzível pelo código versionado.
2. **Segredos:** há URI Atlas com credenciais no código/default compilado; é necessário rotacionar a credencial e movê-la para Secrets Manager.
3. **Autorização:** `Pass` armazena senha e a API não apresenta uma fronteira consistente de autenticação; `/clearcache` é público no código analisado.
4. **Comportamento Lambda:** watchers Mongo, cache em processo e logs em arquivos locais não funcionam como mecanismos distribuídos.
5. **Consultas compostas:** regionais e resumos possuem N+1 no código mais antigo e agregações cruzadas no compilado; a simples separação criaria chamadas em cascata.
6. **Acoplamento externo:** geocodificação durante create/update aumenta a latência e torna a escrita dependente da cota e disponibilidade do Geoapify.
7. **Observabilidade:** faltam IDs de correlação/evento, métricas de atraso, DLQ e alarmes operacionais.

## 3. Limites de responsabilidade propostos

Não recomendo uma Lambda para cada endpoint. Os limites abaixo começam como módulos dentro da mesma Lambda no perfil gratuito. O ponto de evolução, quando houver justificativa operacional, é de quatro Lambdas HTTP grossas e poucos workers:

| Componente | Responsabilidade | Dados sob propriedade lógica |
|---|---|---|
| `cadastro-api` | comandos e leituras simples de centros, regionais e pessoas | centros, regionais, pessoas |
| `formularios-api` | versões de formulários e perguntas | forms, questions |
| `avaliacoes-api` | registrar respostas, validar e produzir summaries | answers, summaries |
| `consultas-api` | overview, coord-summary, stats e centros-with-answers | somente read models |
| `geocoding-worker` | resolver e validar endereço; atualizar somente a localização | fila de comandos + estado de localização |
| `projection-worker` | consumir eventos e atualizar modelos de leitura | tabelas DynamoDB de consulta |
| `outbox-relay` | publicar eventos gravados atomicamente no Mongo | coleção outbox |

`Pass` não vira serviço: deve ser substituído por Cognito User Pool Lite/Essentials. A Lambda valida o JWT recebido pela Function URL. Com OAC, o token de aplicação deve chegar por `X-App-Authorization` ou cookie, porque `Authorization` é usado pela assinatura SigV4 do CloudFront. `management/clearcache` deve desaparecer; invalidação passa a ser consequência de eventos/versionamento, não endpoint público.

Esses limites são uma hipótese inicial baseada nos acoplamentos atuais. Antes da separação física, eles devem existir como módulos no mesmo deploy, com regras verificadas por testes de arquitetura. Isso permite corrigir fronteiras sem custo de rede ou múltiplos pipelines.

## 4. Arquitetura alvo

### 4.1 Caminho síncrono

- o CloudFront Free do frontend mantém TLS, WAF básico, DDoS e o domínio público;
- o behavior `/api/*` encaminha para uma Lambda Function URL em HTTPS:443;
- no perfil inicial, uma Lambda HTTP modular preserva todos os endpoints NestJS;
- a Function URL usa `AWS_IAM` e OAC; somente a distribuição CloudFront recebe permissão para invocá-la;
- a aplicação valida o JWT Cognito recebido por header separado ou cookie;
- Lambdas de comando validam, persistem seu agregado e registram evento na outbox na mesma transação Mongo.
- `consultas-api` lê modelos DynamoDB preparados para cada tela, evitando chamadas em cascata.
- durante a transição, o origin do behavior aponta para o endpoint atual; o corte troca somente origin/behavior ou alias;
- se as APIs forem separadas no futuro, CloudFront path patterns roteiam para Function URLs diferentes, sem introduzir API Gateway.

O frontend e a API ficam no mesmo domínio, evitando CORS. O prefixo `/api` deve ser aceito pelo NestJS ou removido por CloudFront Function. Function URL não possui custo adicional além da invocação Lambda. O API Gateway atual permanece apenas como fallback temporário e é removido depois do período de observação.

### 4.2 Eventos, filas e agendamento

SQS fornece buffer, backpressure, retentativas e DLQ. Cada consumidor recebe sua própria fila. Uma fila compartilhada faria consumidores competirem e perderem eventos que deveriam ser publicados para ambos. O relay envia diretamente para as filas conhecidas, evitando cobrança de eventos customizados. Uma interface `DomainEventPublisher` mantém a opção futura de EventBridge, sem torná-lo parte obrigatória da arquitetura.

Enquanto o sistema grava no Atlas, usar uma **outbox transacional**:

1. o comando altera o agregado e insere um documento outbox na mesma transação;
2. `outbox-relay`, acionado a cada minuto pelo EventBridge Scheduler, adquire um lote com lease;
3. publica diretamente na SQS com `eventId` estável;
4. marca o item como publicado; uma repetição é segura;
5. consumidores deduplicam `eventId` em DynamoDB com TTL.

Isso evita o dual-write “Mongo atualizado, evento não publicado”. Quando uma capacidade migrar para DynamoDB, DynamoDB Streams substitui a outbox dessa capacidade.

Contrato mínimo de evento:

```json
{
  "id": "uuid",
  "type": "centro.address.changed",
  "version": 1,
  "occurredAt": "2026-07-31T12:00:00Z",
  "traceId": "uuid",
  "aggregate": { "type": "centro", "id": "...", "version": 8 },
  "data": { "addressHash": "...", "address": { "...": "..." } }
}
```

Eventos são imutáveis, versionados e não carregam credenciais ou dados desnecessários. A versão do agregado permite ignorar resultado atrasado.

### 4.3 Geocodificação fora da API

O cadastro não chama Geoapify. Ao criar ou alterar qualquer componente do endereço:

1. `cadastro-api` calcula o hash, grava endereço e `LOCALIZACAO.STATUS=PENDENTE` atomicamente e publica `centro.address.changed` via outbox;
2. o outbox relay entrega o evento diretamente à SQS `centro-geocoding-requests`;
3. o worker consulta Geoapify, aplica as regras de coerência já definidas e faz update condicional por `centroId + addressHash + aggregateVersion`;
4. resultado antigo nunca sobrescreve endereço novo;
5. o worker publica `centro.location.confirmed`, `approximated`, `not-found` ou `failed`;
6. falhas transitórias usam backoff da SQS; falhas finais vão para DLQ.

Para respeitar o plano gratuito, configurar concorrência reservada pequena (inicialmente 1), intervalo mínimo entre chamadas e contador diário em DynamoDB. Um limite operacional conservador, por exemplo 2.800 chamadas/dia, interrompe consumo antes da cota de 3.000. O hash confirmado evita chamadas repetidas.

Backfill e reprocessamento usam o mesmo comando e a mesma fila:

- reprocessamento individual: endpoint operacional publica um comando, sem chamar o provider;
- varredura diária: Scheduler procura pendentes elegíveis e enfileira lotes;
- migração inicial: uma Lambda paginadora reexecutável enfileira lotes pequenos; SQS continua controlando a taxa, sem Step Functions;
- DLQ redrive exige motivo corrigido e mantém idempotência.

### 4.4 Modelos de leitura

Consultas `overview`, `coord-summary`, `stats` e `centros-with-answers` combinam vários agregados. Em vez de a `consultas-api` chamar três ou quatro Lambdas, eventos atualizam projeções DynamoDB orientadas às telas, por exemplo:

- `RegionalOverview`: PK regional, contagens e metadados;
- `CoordinatorSummary`: PK regional, SK período/coordenador;
- `CentroEvaluation`: PK centro, SK formulário/data;
- `LatestSummaryByCentro`: PK regional, SK centro.

O sistema passa a ter consistência eventual nessas telas. Definir SLO de atraso (por exemplo, 60 segundos inicialmente), exibir `updatedAt` quando relevante e alarmar `ApproximateAgeOfOldestMessage`/lag de projeção. Operações que exigem read-after-write retornam o agregado alterado na resposta do comando, não consultam a projeção imediatamente.

### 4.5 Estratégia de banco

Não executar migração “Mongo para DynamoDB” em massa. Ordem sugerida:

1. manter Atlas e formalizar propriedade por coleção;
2. introduzir DynamoDB somente para deduplicação, cota e read models;
3. migrar primeiro answers/summaries se os padrões PK/SK e índices estiverem comprovados;
4. migrar cadastro e formulários separadamente, após definir todos os padrões de acesso;
5. usar backfill, leitura sombra e comparação automatizada antes do corte;
6. trocar a rota e manter rollback de leitura por janela definida;
7. desligar escrita antiga, sem dual-write indefinido.

No perfil gratuito, usar DynamoDB Standard provisionado dentro de 25 RCU/WCU e ajustar as projeções a partir de consultas concretas. On-Demand só deve substituir esse modo se a operação justificar o custo variável. Se surgirem relacionamentos transacionais ad hoc não cobertos pelas projeções, Aurora Serverless v2 é uma alternativa futura, não um requisito atual.

### 4.6 Rede e custo

Uma Lambda em VPC precisa de saída para Atlas e Geoapify. NAT Gateway pode dominar o custo de um sistema pequeno. Avaliar explicitamente:

- Atlas PrivateLink e subnets privadas, se o tier permitir;
- NAT com EIP fixo quando Atlas exigir allowlist e houver chamadas públicas;
- Lambda fora de VPC com Atlas público/TLS apenas se a política de rede for aceitável;
- mover a capacidade para DynamoDB elimina essa dependência de rede gradualmente.

Workers Geoapify precisam de internet; separá-los permite uma política de rede diferente das Lambdas que só acessam serviços AWS.

### 4.7 Perfil small/free e limites de custo

“Gratuito” significa operar dentro dos limites permanentes de Free Tier, sem recursos cobrados por hora. Não é garantia absoluta de fatura zero: transferência de dados, excesso de logs, uso acima das cotas, serviços existentes na conta e mudanças de preço ainda podem gerar cobrança.

Composição recomendada para baixo tráfego:

| Necessidade | Escolha small/free | Limite/restrição relevante |
|---|---|---|
| HTTPS e borda | CloudFront Free existente → Lambda Function URL | plano Free: 1 milhão de requests e 100 GB/mês, sem overage; Function URL não adiciona custo |
| Execução | uma Lambda modular + worker Geoapify | 1 milhão de requests e 400 mil GB-s/mês no Free Tier Lambda |
| Fila | SQS Standard + DLQ | 1 milhão de requests/mês para todos os clientes; send/receive/delete contam separadamente |
| Agenda | EventBridge Scheduler | 14 milhões de invocações/mês gratuitas |
| Estado AWS | DynamoDB Standard provisionado | 25 RCU, 25 WCU, 25 GB e 2,5 milhões de leituras de Streams/mês |
| Configuração segura | SSM Parameter Store Standard `SecureString` | sem custo adicional; usar `alias/aws/ssm`, não chave KMS própria |
| Autenticação | Cognito Lite/Essentials | 10 mil MAU/mês permanentes para login direto/social; SMS/SES não estão incluídos |
| Logs | CloudWatch Logs com JSON enxuto e retenção curta | 5 GB/mês no Free Tier; evitar métricas customizadas e dashboards pagos |
| Geocodificação | Geoapify free + limitador diário | manter teto operacional abaixo das 3.000 chamadas/dia do plano contratado |

Referências de preço verificadas em julho de 2026: [CloudFront flat-rate](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/flat-rate-pricing-plan.html), [Lambda](https://aws.amazon.com/lambda/pricing/), [Function URLs](https://aws.amazon.com/about-aws/whats-new/2022/04/aws-lambda-function-urls-built-in-https-endpoints/), [SQS](https://aws.amazon.com/sqs/pricing/), [EventBridge Scheduler](https://aws.amazon.com/eventbridge/pricing/), [DynamoDB](https://aws.amazon.com/dynamodb/pricing/), [Parameter Store](https://aws.amazon.com/systems-manager/pricing/), [Cognito](https://aws.amazon.com/cognito/pricing/) e [CloudWatch](https://aws.amazon.com/cloudwatch/pricing/).

Recursos deliberadamente excluídos do perfil gratuito:

- NAT Gateway: possui cobrança por hora e por GB; manter Lambdas fora de VPC enquanto acessarem Atlas/Geoapify públicos, ou migrar dados para DynamoDB;
- AWS WAF avulso: cobra Web ACL, regras e requests; usar as proteções WAF básicas incluídas no plano CloudFront Free e reserved concurrency;
- Secrets Manager e chave KMS gerenciada pelo cliente: possuem custo recorrente; usar Parameter Store Standard com chave AWS-managed;
- EventBridge custom bus: gestão de eventos AWS é gratuita, mas eventos customizados são cobrados; usar publicação direta SQS no baixo volume;
- API Gateway após sua janela promocional, cache do API Gateway, provisioned concurrency, ElastiCache, OpenSearch e dashboards CloudWatch;
- Step Functions no fluxo normal: apesar das 4.000 transições gratuitas mensais, um backfill pode ultrapassar rapidamente o limite; usar uma Lambda paginadora + SQS e reservar Step Functions para lote excepcional.

Function URL com `AuthType=NONE` e validação JWT na aplicação mantém compatibilidade com clientes web, mas a URL pública pode ser chamada contornando o CloudFront e consumir cota. Uma alternativa forte é `AuthType=AWS_IAM` com CloudFront Origin Access Control, tornando o CloudFront o único invocador. Há dois impactos importantes: para `PUT` e `POST`, o cliente precisa calcular SHA-256 do body e enviar `x-amz-content-sha256`; além disso, o OAC usa `Authorization` para a assinatura SigV4. Se a aplicação também usa `Authorization: Bearer`, enviar o token em outro header, como `X-App-Authorization`, ou em cookie, para que ele chegue ao NestJS. Sem essas adaptações no frontend, usar `NONE` + header secreto de origem validado pela aplicação é mais simples, mas bloqueia o bypass somente depois que a Lambda já foi invocada. Referência: [OAC para Lambda Function URL](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-lambda.html).

Para impedir surpresas, criar AWS Budget do tipo **zero spend**, alertas em 50%, 80% e 100% das cotas gratuitas, tags `CostCenter`, retenção curta de logs e um teto de reserved concurrency. A AWS documenta o template de orçamento zero em [AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budget-templates.html).

### 4.8 Critério para sair do perfil gratuito

Separar fisicamente as APIs ou habilitar serviços pagos somente quando uma métrica demonstrar necessidade: pacote/cold start inadequado, contenção de concorrência, deploys conflitantes, privilégio IAM impossível de isolar, fan-out para três ou mais consumidores ou volume acima da publicação SQS direta. Até lá, modularidade de código entrega separação de responsabilidade sem multiplicar infraestrutura e invocações.

### 4.9 CloudFront observado na conta AWS

Inspeção somente leitura realizada em 31 de julho de 2026. A conta possui três distribuições no plano Free; “Endpoint do Bingo” foi identificado e excluído desta análise. A AWS permite até três planos CloudFront Free por conta, portanto a migração não deve criar uma quarta distribuição. A opção de menor custo e menor complexidade é reutilizar o CloudFront do frontend para S3 e API no mesmo domínio.

**`aee-digital-api` — distribuição `E3EEPXQRJVBVQG`:**

- plano CloudFront Free de US$ 0/mês, domínio `dao4iif8w0q06.cloudfront.net`;
- proteções WAF básicas habilitadas; rate limiting ainda não habilitado;
- sem domínio alternativo e sem standard access logs no plano Free;
- origem atual `162.214.123.133.sslip.io`, protocolo HTTP-only, porta 5001;
- comportamento default permite GET, HEAD, OPTIONS, PUT, POST, PATCH e DELETE;
- `Managed-CachingDisabled`, correto para API;
- `Managed-AllViewerExceptHostHeader`, correto para uma Function URL, pois preserva headers, cookies e query strings sem encaminhar o Host do viewer;
- nenhuma associação CloudFront Function/Lambda@Edge.

Tecnicamente, essa distribuição poderia apontar para o hostname `<id>.lambda-url.<region>.on.aws`, em HTTPS-only e porta 443. Ela não é, porém, a arquitetura final recomendada: permanece apenas como fallback para clientes que ainda usem `dao4iif8w0q06.cloudfront.net` durante a migração e é desabilitada após a janela sem tráfego.

**`aee-alianca-digital` — distribuição `EBMPXMEWAUJC8`:**

- plano Free, domínios `aliancadigital.org.br` e `www.aliancadigital.org.br`, TLS 1.2 e `index.html`;
- origem principal S3 Website `aee-alianca-digital` com cache otimizado;
- segunda origem S3 Website `aee-mocidade-programa-dev` para `/mocidade/*`;
- não há behavior para a API.

Para a arquitetura de menor custo e menor quantidade de recursos, adicionar uma terceira origem Function URL e um behavior `/api/*` nesta distribuição. O frontend passa a chamar `https://aliancadigital.org.br/api/...`, eliminando CORS. É necessário decidir como remover/preservar o prefixo `/api` no NestJS. A distribuição antiga `aee-digital-api` permanece como fallback durante o corte e depois é desabilitada; “Endpoint do Bingo” permanece fora do escopo.

## 5. Confiabilidade, segurança e operação

### 5.1 Idempotência e concorrência

- aceitar `Idempotency-Key` nos comandos críticos e guardar resultado com TTL;
- usar `eventId` para deduplicação de consumidor;
- aplicar escrita condicional por versão/hash em localização e projeções;
- configurar visibilidade SQS acima do timeout Lambda;
- limitar `maxReceiveCount` e alarmar DLQ;
- nunca depender de ordem global; quando necessária, usar FIFO por aggregate ID, sabendo do custo/throughput.

### 5.2 Segurança

- rotacionar imediatamente a credencial Atlas presente no código/artefato;
- guardar Atlas, Geoapify e tokens em Parameter Store Standard `SecureString` no perfil gratuito e migrar para Secrets Manager quando rotação automática justificar o custo; cachear no ambiente quente;
- substituir `Pass` por Cognito e scopes/grupos por claims/IAM;
- IAM mínimo por função e fila/tabela específica;
- criptografia com chaves AWS-managed, TLS, CloudTrail básico e retenção curta de logs; chave KMS própria somente no perfil pago;
- remover `/clearcache` e proteger reprocessamento por claim operacional, não segredo estático compartilhado;
- validar campos permitidos para evitar filtros Mongo arbitrários.

### 5.3 Observabilidade

Substituir Winston em arquivo por logs JSON para CloudWatch. Propagar `traceId`, `requestId`, `eventId`, `aggregateId` e `addressHash`. Instrumentar X-Ray/OpenTelemetry.

Alarmes mínimos:

- Lambda errors, throttles, duration p95, timeout e concurrent executions;
- Function URL/Lambda 4xx/5xx, 429 e latência;
- CloudFront requests, error rate, WAF blocks e aproximação dos limites do plano Free;
- SQS age, visible messages e DLQ > 0;
- Scheduler failed invocations;
- outbox não publicada/idade do item mais antigo;
- lag e falha de projeção;
- chamadas Geoapify, cota diária, 429, timeout e taxa de confirmação.

## 6. Plano incremental

### Fase 0 — tornar o baseline controlável

- reconciliar `src`, `dist.zip`, Terraform e função implantada;
- reconstruir toda infraestrutura em IaC versionado e importar o state existente;
- gerar artefato imutável com commit SHA e deploy com rollback;
- rotacionar segredos, corrigir autenticação e logs;
- inventariar 100% dos endpoints, métodos, perfis de acesso, códigos HTTP e efeitos persistidos;
- criar uma suíte integrada completa do comportamento atual antes de alterar a arquitetura;
- versionar em IaC a Function URL, OAC e os behaviors CloudFront necessários;
- executar testes diferenciais entre o endpoint atual e o novo caminho CloudFront → Function URL;
- executar smoke tests pós-deploy e ensaiar o rollback para o origin/alias anterior.

#### Suíte integrada obrigatória da Fase 0

A suíte deve exercitar o sistema pela interface HTTP, e não somente controllers ou services isolados. Ela deve conter:

- matriz de todas as rotas, incluindo fluxos felizes, validações, `404`, conflitos, paginação, filtros e ordenação;
- autenticação e autorização de cada perfil, incluindo token ausente, inválido, expirado e acesso negado;
- persistência em uma base Mongo isolada, com fixtures determinísticas e limpeza entre cenários;
- agregações de regionais, centros, formulários, respostas e summaries com comparação do payload completo;
- efeitos colaterais e idempotência das escritas, verificando estado antes e depois da requisição;
- invocação local do handler Lambda com payload HTTP API `2.0` e execução end-to-end no ambiente AWS de homologação pelo CloudFront;
- Geoapify e outros serviços externos substituídos por fakes determinísticos, sem consumir créditos;
- testes de timeout, indisponibilidade de dependência, payload grande e erro inesperado sem exposição de segredo;
- teste diferencial automatizado: mesma requisição e fixture no caminho legado e na Function URL devem produzir status, headers relevantes, corpo e efeito persistido equivalentes;
- smoke test pós-deploy para rotas críticas e teste sintético de escrita com dados identificáveis e removíveis;
- ensaio automatizado de rollback, confirmando que a troca para o origin/alias anterior restaura o serviço.

No CI, separar `unit`, `integration`, `contract` e `e2e`, mas tornar todos obrigatórios para promover o artefato. Os testes integrados devem usar o mesmo `dist.zip` que será implantado; não vale testar uma compilação diferente da promovida.

**Gate de saída:** 100% das rotas inventariadas possuem cenário integrado; toda a suíte está verde; não existe divergência crítica no teste diferencial; smoke test de homologação e rollback foram aprovados; ambiente pode ser recriado; e o pacote implantado é rastreável a um commit. Sem cumprir o gate, a Fase 1 não começa.

### Fase 1 — modularizar dentro da Lambda monolítica

- estabelecer capacidades e interfaces de repositório;
- remover watchers/cache local/logs em arquivo;
- limitar/reutilizar conexão Mongo;
- impedir imports cruzados fora das interfaces;
- capturar métricas de cada endpoint.

**Saída:** mesmas rotas e respostas; módulos podem ser empacotados separadamente.

### Fase 2 — extrair geocodificação

- implementar outbox, relay, SQS e DLQ, com publicação direta nas filas;
- transformar create/update em `PENDENTE + evento`;
- implantar worker com fake/provider, escrita condicional e publicação direta SQS;
- mover reprocessamento e backfill para fila/Scheduler;
- executar em modo sombra antes de remover a chamada síncrona.

**Saída:** nenhuma escrita HTTP depende do Geoapify; endereço novo não recebe resultado antigo.

### Fase 3 — projetar consultas compostas

- definir read models a partir de overview/coord-summary/stats;
- fazer backfill e consumir eventos;
- comparar resposta nova com a monolítica em shadow read;
- ativar read models atrás da mesma Function URL; separar a origem de GETs no CloudFront somente se métricas justificarem outra Lambda.

**Saída:** consultas não fazem fan-out entre serviços e possuem lag observado.

### Fase 4 — separar Lambdas HTTP por capacidade, se necessário

- empacotar `cadastro-api`, `formularios-api` e `avaliacoes-api`;
- criar uma Function URL `AWS_IAM` e OAC por Lambda;
- configurar CloudFront behaviors por path pattern, por exemplo `/api/centros*`, `/api/forms*` e `/api/answers*`;
- reservar concorrência e ajustar memória por perfil;
- manter o origin/alias da Lambda modular como fallback temporário.

**Saída:** se o critério de custo/isolamento for satisfeito, cada capacidade tem deploy, IAM, métricas e ownership independentes. Caso contrário, permanecer na Lambda modular é o resultado correto.

### Fase 5 — migrar dados por padrão de acesso

- migrar uma capacidade por vez para DynamoDB;
- backfill → shadow read → cutover → janela de rollback;
- substituir outbox por DynamoDB Streams onde aplicável;
- remover joins e writes cruzados restantes.

**Saída:** Atlas pode ser reduzido ou mantido apenas para capacidades em que ainda agrega valor.

### Fase 6 — descomissionar

- desligar rotas e função monolítica somente após período sem tráfego;
- remover o REST API Gateway, deployment, stage, permissões e domínio associados;
- desabilitar a distribuição CloudFront antiga da API após confirmar ausência de tráfego;
- remover coleção `passes`, endpoint de cache e segredos antigos;
- revisar custo, SLO, runbooks e disaster recovery.

## 7. Estratégia de testes e corte

- testes de contrato HTTP com snapshots sanitizados;
- contract tests de eventos por schema/version;
- testes de integração com Mongo, DynamoDB Local/fakes, SQS e Function URL payload v2.0;
- testes de idempotência, duplicação, atraso, reordenação e redrive;
- chaos tests de timeout Geoapify, 429, credencial inválida e indisponibilidade;
- shadow traffic para GETs e comparação de payloads;
- canário por alias Lambda e behavior/origin CloudFront, com alarme e rollback automático;
- teste de carga para conexão Atlas e reserved concurrency;
- ensaio de backfill com dry-run e limite diário.

Cada fase deve ser reversível trocando o origin/behavior CloudFront ou o alias da Function URL. Eventos e mudanças de schema devem ser compatíveis com a versão anterior durante toda a janela de rollback.

## 8. Decisões que devem ser fechadas antes da implementação

1. Qual commit reproduz exatamente a Lambda hoje em produção?
2. Quais endpoints e volumes p50/p95 realmente existem por capacidade?
3. Qual atraso é aceitável para overview e summaries?
4. Atlas continuará como banco estratégico ou é uma ponte para DynamoDB?
5. Há requisito de IP fixo/PrivateLink e qual orçamento de NAT?
6. Quais perfis atuais de `Pass` viram grupos/claims do Cognito?
7. Qual é o teto diário operacional do Geoapify e política de redrive?
8. Terraform será mantido ou substituído por CDK/SAM? A recomendação é escolher uma ferramenta, sem reescrever IaC durante a extração funcional.
9. O frontend aceitará `X-App-Authorization`/cookie e `x-amz-content-sha256` para permitir OAC com `AWS_IAM`?
10. O NestJS preservará o prefixo público `/api` ou o CloudFront Function fará rewrite?
11. Qual valor mensal máximo deve disparar bloqueio operacional além de alerta?

## 9. Resultado esperado

Ao final do perfil econômico, CloudFront encaminha `/api/*` para uma Function URL protegida por OAC. A Lambda HTTP permanece modular e workers idempotentes cuidam da geocodificação e projeções por SQS. Se houver necessidade comprovada, capacidades ganham Function URLs próprias e novos behaviors, ainda sem API Gateway. A cota gratuita fica controlável e a migração avança por origin, alias e coleção, mantendo rollback durante todo o processo.
