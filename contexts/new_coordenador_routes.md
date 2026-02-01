# Prompt para Rota Backend: `/regionais/:id/coord-summary`

## Objetivo
Criar uma rota otimizada que consolida os dados necessários para a tela **`/resumo/coordenador`**, reduzindo de 6 chamadas paralelas para 1 única requisição.

---

## Rota

```
GET /regionais/:id/coord-summary
```

### Query Parameters (opcionais)
- `dateFrom` (ISO `yyyy-mm-dd`) — início do período para filtrar summaries
- `dateTo` (ISO `yyyy-mm-dd`) — fim do período para filtrar summaries

---

## Resposta (200 OK)

```json
{
  "regional": {
    "_id": "regional-uuid-1",
    "NOME_REGIONAL": "Regional Sudeste",
    "PAIS": "BR",
    "COORDENADOR_ID": "pessoa-uuid-123"
  },
  "coordenador": {
    "_id": "pessoa-uuid-123",
    "NOME": "João Silva"
  },
  "centros": [
    {
      "_id": "centro-uuid-1",
      "NOME_CENTRO": "Centro São Paulo",
      "NOME_CURTO": "SP",
      "STATUS": "Integrada",
      "REGIONAL": "regional-uuid-1"
    },
    {
      "_id": "centro-uuid-2",
      "NOME_CENTRO": "Centro Rio",
      "NOME_CURTO": "RJ",
      "STATUS": "Pendente",
      "REGIONAL": "regional-uuid-1"
    }
  ],
  "summaries": [
    {
      "_id": "summary-uuid-1",
      "CENTRO_ID": "centro-uuid-1",
      "FORM_ID": "form-uuid-1",
      "createdAt": "2026-01-20T10:30:00Z",
      "updatedAt": "2026-01-20T14:15:00Z",
      "QUESTIONS": [
        {
          "_id": "question-uuid-1",
          "QUESTION": "Qual é a auto avaliação?",
          "ANSWER": "Bom"
        },
        {
          "_id": "question-uuid-2",
          "QUESTION": "Comentários do coordenador",
          "ANSWER": "Tudo bem"
        }
      ]
    }
  ],
  "form": {
    "_id": "form-uuid-1",
    "PAGES": [
      {
        "QUIZES": [
          {
            "CATEGORY": "Auto Avaliação",
            "QUESTIONS": [
              {
                "_id": "question-uuid-1",
                "QUESTION": "Qual é a auto avaliação?",
                "ANSWER_TYPE": "String",
                "IS_REQUIRED": true,
                "PRESET_VALUES": []
              }
            ]
          },
          {
            "CATEGORY": "Coordenador",
            "QUESTIONS": [
              {
                "_id": "question-uuid-2",
                "QUESTION": "Comentários do coordenador",
                "ANSWER_TYPE": "String",
                "IS_REQUIRED": false,
                "PRESET_VALUES": []
              }
            ]
          }
        ]
      }
    ]
  },
  "coordenadores": [
    {
      "_id": "pessoa-uuid-1",
      "NOME": "Ana Costa"
    },
    {
      "_id": "pessoa-uuid-2",
      "NOME": "Carlos Santos"
    }
  ]
}
```

---

## Detalhes da Implementação

### 1. **Regional**
- Retornar `_id`, `NOME_REGIONAL`, `PAIS`, `COORDENADOR_ID`

### 2. **Coordenador (opcional)**
- Se `COORDENADOR_ID` existir, buscar o documento de pessoa e retornar `_id` e `NOME`
- Se não existir, retornar `null`

### 3. **Centros**
- Filtrar por `REGIONAL = :id` e `STATUS IN [Pendente, Integrada, Inscrita]`
- Retornar: `_id`, `NOME_CENTRO`, `NOME_CURTO`, `STATUS`, `REGIONAL`

### 4. **Summaries**
- Filtrar por `REGIONAL = :id` (via join com centros) 
- **Opcionalmente** filtrar por período se `dateFrom` e `dateTo` fornecidos
- Para cada summary, incluir o array `QUESTIONS` com `_id`, `QUESTION`, `ANSWER`
- Retornar apenas últimos summaries por centro (ou todos ordenados por `updatedAt`)
- **Importante**: Ordenar por `updatedAt` descendente

### 5. **Form**
- Buscar o formulário associado à regional (via `FORM_ID` em `cadastroInfo`)
  - Se não houver, tentar pegar o primeiro formulário ativo
- Retornar apenas o array `PAGES` com `QUIZES`
- Em cada quiz, filtrar apenas categorias **"Auto Avaliação"** e **"Coordenador"**
- Retornar apenas campos essenciais: `_id`, `QUESTION`, `ANSWER_TYPE`, `IS_REQUIRED`, `PRESET_VALUES`

### 6. **Coordenadores (Lista)**
- Retornar **todas as pessoas** que são coordenadores (podem estar em qualquer campo `COORDENADOR_ID` do banco)
- Ordenar alfabeticamente por `NOME`
- Retornar apenas: `_id`, `NOME`

---

## Considerações de Performance

### Cache
- Implementar `Cache-Control: public, max-age=60` para dados que mudam pouco (regional, centros, form)
- Usar ETag para validação condicional

### Agregação
- Preferir usar agregações do MongoDB para evitar múltiplas queries:
  ```javascript
  // Pseudo-código
  db.regionais.aggregate([
    { $match: { _id: ObjectId(id) } },
    { $lookup: { from: "centros", localField: "_id", foreignField: "REGIONAL", as: "centros" } },
    { $lookup: { from: "summaries", localField: "_id", foreignField: "REGIONAL", as: "summaries" } },
    // ... etc
  ])
  ```

### Paginação
- **Não** paginar: a resposta deve ser completa (todos os centros, todos os summaries do período)
- Se houver muitos dados, considerar limitar summaries aos últimos 100 por período

---

## Tratamento de Erros

### 404 Not Found
- Se regional não existir
- Retornar `{ "message": "Regional não encontrada", "statusCode": 404 }`

### 400 Bad Request
- Se `dateFrom` ou `dateTo` forem inválidos
- Se período for inválido (dateTo < dateFrom)

### 500 Internal Server Error
- Qualquer erro não previsto na agregação/join

---

## Exemplos de Requisição

### Sem período
```
GET /regionais/abc123/coord-summary
```

### Com período
```
GET /regionais/abc123/coord-summary?dateFrom=2026-01-19&dateTo=2026-02-20
```

---

## Benefícios

| Métrica              | Antes  | Depois | Redução |
| -------------------- | ------ | ------ | ------- |
| Chamadas simultâneas | 6      | 1      | 83%     |
| Tamanho de payload   | ~500KB | ~100KB | 80%     |
| Tempo de resposta    | ~1.5s  | ~0.5s  | 66%     |

---

## Notas Importantes

1. **Formato de datas**: Aceitar ISO `yyyy-mm-dd`, normalizar para início/fim do dia em UTC
2. **Campos vazios**: Se um campo não existir (ex.: coordenador), retornar `null`, não omitir
3. **Ordenação**: 
   - Centros: por `NOME_CENTRO`
   - Summaries: por `updatedAt` DESC
   - Coordenadores: por `NOME` ASC
4. **Validação**: Garantir que o usuário tenha permissão para acessar a regional (se aplicável)
