## Proposta de modelagem para DynamoDB (Lambdas de formulário, respostas e summary)

Esta proposta segue uma abordagem **single-table** para reduzir chamadas e facilitar consultas por formulário/ano/usuário/centro, mas inclui uma alternativa **multi-tabela** se preferir separar responsabilidades.

### Tabela única `aee-data`
Chaves primárias:
- `PK` (partition key, string)
- `SK` (sort key, string)

Índices globais:
- **GSI1_ByOwnerHistory**: `GSI1PK` (USER#<id> ou CENTRO#<id>), `GSI1SK` (FORM#<formId>#YEAR#<year>#QUESTION#<questionId>#REV#<n>)
- **GSI2_ByQuestion**: `GSI2PK` (QUESTION#<questionId>), `GSI2SK` (FORM#<formId>#YEAR#<year>#CENTRO#<centroId>)
- **GSI3_Forms**: `GSI3PK` (FORM#ACTIVE), `GSI3SK` (NAME#<name>#VERSION#<version>)

Itens esperados:
- **Formulário e conteúdo**  
  - Form meta: `PK=FORM#<formId>`, `SK=META`, `GSI3PK=FORM#ACTIVE`, `GSI3SK=NAME#<name>#VERSION#<version>`  
  - Página/quiz/pergunta: `PK=FORM#<formId>`, `SK=PAGE#<pageId>` / `QUIZ#<quizId>` / `QUESTION#<questionId>`  
  - Atributos: `type` (FORM|PAGE|QUIZ|QUESTION), `name`, `version`, `role`, `isMultiple`, `presetValues`, etc.

- **Respostas (evento)**  
  - `PK=ANSWER#<formId>#<year>`  
  - `SK=USER#<pessoaId>#QUESTION#<questionId>#REV#<n>` (ou `CENTRO#<centroId>` se a unidade é o centro)  
  - `GSI1PK=USER#<pessoaId>` ou `CENTRO#<centroId>`  
  - `GSI1SK=FORM#<formId>#YEAR#<year>#QUESTION#<questionId>#REV#<n>`  
  - `GSI2PK=QUESTION#<questionId>`  
  - `GSI2SK=FORM#<formId>#YEAR#<year>#CENTRO#<centroId>`  
  - Atributos: `value`, `createdAt`, `formVersion`, `status` (draft/submitted/validated), `isLatest`, `centroId`, `pessoaId`, `questionMeta` (role/categoria).

- **Summary (snapshot oficial por ano)**  
  - `PK=SUMMARY#<formId>#<year>`  
  - `SK=CENTRO#<centroId>` (ou `REGIONAL#...`)  
  - Atributos: agregados (totais/contagens/médias) por pergunta/categoria, `validatedByCoordAt`, `status`, `formVersion`.
  - Não precisa de GSI se as leituras são sempre por form/ano/centro; adicione GSI se precisar listar por centro/ano independente do form.

Consultas principais:
- Listar perguntas de um formulário: query `PK=FORM#<formId>`, filtro por prefixo de `SK`.
- Buscar respostas por form/ano/centro: query `PK=ANSWER#<formId>#<year>` + `begins_with(SK, "CENTRO#<id>")`.
- Histórico por usuário/centro: query GSI1 com `GSI1PK=USER#<pessoaId>` (ou `CENTRO#<id>`).
- Auditoria por pergunta: query GSI2 com `GSI2PK=QUESTION#<questionId>`.
- Ler summary: get ou query `PK=SUMMARY#<formId>#<year>` + `SK=CENTRO#<id>`.

Fluxo típico:
1) Lambda `submit-answer` grava/atualiza item de resposta (marca `isLatest=true`) e opcionalmente cria item de log com `REV#<n>`.  
2) Evento de escrita dispara Lambda de agregação que atualiza o item de summary correspondente.  
3) Leituras para UI usam summary (rápido) ou respostas via GSI para histórico.

### Alternativa multi-tabela (mais simples de ler)
- `forms`: `PK=formId`, sem SK (ou `SK=version`), armazena JSON do formulário (páginas/perguntas). GSI para listar ativos por nome/versão.
- `answers`: `PK=formId#year`, `SK=pessoaId#questionId#rev`; GSI por pessoa/centro e outra por questionId. Campo `isLatest` para leitura rápida.
- `summaries`: `PK=formId#year`, `SK=centroId`; atributos agregados + metadados de validação.

Critério de escolha:
- Single-table: menos chamadas, flexível para novos padrões de acesso, aproveita SK prefix.  
- Multi-tabela: estrutura mais explícita e fácil de depurar, ao custo de mais consultas e joins no código.
