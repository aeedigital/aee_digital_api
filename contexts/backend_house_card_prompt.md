## Prompt: rota agregada para reduzir chamadas do House_Card

Contexto: a página `/resumo/coordenador` faz muitas chamadas individuais (por centro) para `/answers?CENTRO_ID=...` e `/centros/{id}/summaries`. Precisamos de uma rota agregada por regional para trazer, de uma vez, centros + respostas + resumo mais recente.

### Nova rota

`GET /regionais/:id/centros-with-answers`

**Para que serve**  
Entregar a lista de centros de uma regional, já incluindo:
- respostas (answers) de cada centro;
- summaries (idealmente só o mais recente por centro).

Assim o front evita N chamadas por centro.

**Query params**  
- `dateFrom` (opcional, ISO `yyyy-mm-dd`)  
- `dateTo` (opcional, ISO `yyyy-mm-dd`)  
- `fields` (opcional, ex.: `_id,NOME_CENTRO,NOME_CURTO,data_avaliacao`) — projeção nos centros  
- `include` (opcional, default: `answers,summaries`) — lista separada por vírgula; permite pedir apenas `answers`, apenas `summaries` ou ambos.
- `limitSummaries` (opcional, default: 1) — quantos summaries retornar por centro (ex.: só o mais recente).

**Resposta (exemplo)**  
```json
{
  "regionalId": "61b0bac871572500128b8607",
  "centros": [
    {
      "_id": "61b0babc71572500128b8602",
      "NOME_CENTRO": "Casa Espírita Edgard Armond",
      "NOME_CURTO": "Edgard Armond",
      "data_avaliacao": "2026-02-10",
      "answers": [
        { "_id": "a1", "QUESTION_ID": "q1", "ANSWER": "Integrado", "updatedAt": "2026-02-09T12:00:00Z" },
        { "_id": "a2", "QUESTION_ID": "q2", "ANSWER": "Sim", "updatedAt": "2026-02-09T12:10:00Z" }
      ],
      "summaries": [
        {
          "_id": "s1",
          "CENTRO_ID": "61b0babc71572500128b8602",
          "updatedAt": "2026-02-10T08:00:00Z",
          "validatedByCoordAt": null,
          "QUESTIONS": [
            { "QUESTION": "q1", "ANSWER": "Integrado" },
            { "QUESTION": "q2", "ANSWER": "Sim" }
          ]
        }
      ]
    }
  ]
}
```

### Regras de montagem
- Filtrar centros por regional `:id`; opcionalmente por `STATUS` se já existir o padrão `Pendente,Integrada,Inscrita`.
- Se `include` não contém `answers`, não traga o array `answers`.
- Se `include` não contém `summaries`, não traga o array `summaries`.
- `limitSummaries`: ordenar summaries por `updatedAt` desc e cortar.
- `dateFrom`/`dateTo`: aplicar ao filtro de summaries (e opcionalmente de answers, se fizer sentido).
- Projeção em centros via `fields`.

### Considerações de performance
- Usar agregação/batch no banco para evitar N consultas.
- Paginar centros se necessário (ex.: `limit`/`skip` futuros), mas default pode ser todos os centros da regional.
- Cache HTTP: `Cache-Control: private, max-age=60` (ou conforme política interna) para aliviar tráfego.

### Ajuste no frontend (para referência)
- `/resumo/coordenador` passa a consumir esta rota e preencher:
  - `answersByCentroId` (para `House_Card` não chamar `/answers?...`);
  - `summariesByCentroId` (para não chamar `/centros/{id}/summaries`).
  - `CoordAnalisisButton` usa o summary já recebido.
