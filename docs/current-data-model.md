## Modelo atual (coleções como tabelas)

Diagrama geral das coleções/tabelas existentes e seus principais vínculos. Subdocumentos de `Forms` (pages/quizes) foram abertos como entidades auxiliares para facilitar a leitura.

```mermaid
erDiagram
    REGIONAIS {
        string _id
        string NOME_REGIONAL
        string PAIS
        string COORDENADOR_ID
    }
    CENTROS {
        string _id
        string REGIONAL
        string NOME_CENTRO
        string NOME_CURTO
        string CNPJ_CENTRO
        string DATA_FUNDACAO
        string ENDERECO
        string CIDADE
        string ESTADO
        string PAIS
        Funcionamento FUNCIONAMENTO
    }
    PESSOAS {
        string _id
        string NOME
        string E_MAIL
        string CELULAR
    }
    PASSES {
        string _id
        string user
        string pass
        string scope_id
        string[] groups
        date lastLogged
    }
    QUESTIONS {
        string _id
        string QUESTION
        string ANSWER_TYPE
        boolean IS_REQUIRED
        string IS_MULTIPLE
        string[] PRESET_VALUES
        string ROLE
    }
    FORMS {
        string _id
        string NAME
        number VERSION
        string CREATEDBY
    }
    PAGES {
        string NAME
        string ROLE
    }
    QUIZES {
        string CATEGORY
    }
    FORM_QUESTION_GROUP {
        boolean IS_MULTIPLE
    }
    ANSWERS {
        string _id
        string CENTRO_ID
        string QUESTION_ID
        string ANSWER
        string QUIZ_ID
        date createdAt
        date updatedAt
    }
    SUMMARIES {
        string _id
        string FORM_ID
        string CENTRO_ID
        SummaryQuestion[] QUESTIONS
        date validatedByCoordAt
        date createdAt
        date updatedAt
    }
    SUMMARYQUESTION {
        string ANSWER
        string QUESTION
    }

    REGIONAIS ||--o{ CENTROS : "REGIONAL"
    CENTROS ||--o{ ANSWERS : "CENTRO_ID"
    QUESTIONS ||--o{ ANSWERS : "QUESTION_ID"
    QUIZES ||--o{ ANSWERS : "QUIZ_ID"
    FORMS ||--o{ PAGES : "PAGES"
    PAGES ||--o{ QUIZES : "QUIZES"
    QUIZES ||--o{ FORM_QUESTION_GROUP : "QUESTIONS"
    FORM_QUESTION_GROUP ||--o{ QUESTIONS : "GROUP[]"
    FORMS ||--o{ SUMMARIES : "FORM_ID"
    CENTROS ||--o{ SUMMARIES : "CENTRO_ID"
    QUESTIONS ||--o{ SUMMARYQUESTION : "QUESTION ref"
    SUMMARIES ||--o{ SUMMARYQUESTION : "QUESTIONS[]"
```

### Observações rápidas
- `Forms` contém `PAGES` -> `QUIZES` -> `QUESTIONS` (grupo que referencia a coleção `Questions`).  
- `Answers` registra respostas individuais, ligadas a `QUESTION_ID`, `QUIZ_ID` e `CENTRO_ID`.  
- `Summaries` agrega respostas por formulário/centro e mantém perguntas respondidas (lista `QUESTIONS` com referência à pergunta original).
- `Regionais` e `Centros` formam a hierarquia geográfica usada por respostas e summaries.
- `Pessoas` e `Passes` representam usuários e credenciais (sem vínculo direto explícito nas coleções acima).

### Rascunho de plano para migração para NoSQL
- **Mapear padrões de acesso atuais**: leituras por formulário/ano/centro, histórico por pergunta, listagem de formulários ativos, login/escopos. Consolidar queries reais (API controllers/repos) para definir partições e índices.  
- **Escolher estratégia (single-table ou poucas tabelas)**: basear-se na proposta de `docs/dynamodb-model.md`; alinhar chaves de partição/sort para os padrões mapeados (ex.: `FORM#<id>#YEAR#<ano>` + `CENTRO#<id>` para respostas/summaries).  
- **Modelar itens-alvo**: definir como `Forms`, `Questions`, `Answers` (eventos) e `Summaries` serão serializados; incluir flags como `isLatest`, versionamento de formulário e trilhas de revisão.  
- **Planejar migração de dados**: script de export/import por coleção com transformação para o novo formato de item; validar consistência de referências (centro/question/quiz) antes de gravar.  
- **Evoluir serviços**: adaptar repositórios para escrever/leitor NoSQL atrás de uma interface comum; manter fallback de leitura no Mongo durante transição (feature flag).  
- **Cutover e limpeza**: rodar migração incremental, comparar contagens/hashes, ativar NoSQL em produção e retirar caches/coleções antigas quando estabilizar.
