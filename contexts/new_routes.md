## Prompt para ajustes de backend

Objetivo: reduzir o número de requisições na UI de resumo/aliança e coordenador, entregando dados agregados já prontos.

### Rotas novas / ajustadas

1) `GET /regionais/overview`
   - **Para que serve**: alimentar a lista de cards em `/resumo/alianca` com contagens prontas, evitando N+1 de centros/summaries por regional.
   - **Entradas (query params)**:
     - `dateFrom` (ISO `yyyy-mm-dd`, opcional) — início do período para contagem de finalizados.
     - `dateTo` (ISO, opcional) — fim do período para contagem de finalizados.
     - `status` (opcional, default `Pendente,Integrada,Inscrita`) — filtro aplicado aos centros.
   - **Saída**: array de objetos com `_id`, `NOME_REGIONAL`, `PAIS`, `centrosCount`, `finalizadosCount`.
   - **Exemplo de resposta**
   ```json
   [
     {
       "_id": "abc123",
       "NOME_REGIONAL": "ABC",
       "PAIS": "BR",
       "centrosCount": 12,
       "finalizadosCount": 9
     }
   ]
   ```

2) `GET /summaries/stats`
   - **Para que serve**: alimentar `SummariesGraphComponent` sem baixar todos os summaries.
   - **Entradas (query params obrigatórios)**:
     - `dateFrom` (ISO `yyyy-mm-dd`)
     - `dateTo` (ISO `yyyy-mm-dd`)
   - **Entradas opcionais**:
     - `status` (lista) — filtra centros considerados no denominador.
   - **Saída**:
     - `eventsByDay`: mapa `{"yyyy-mm-dd": number}` contando summaries por `createdAt`.
     - `respondedCount`: nº de centros com ao menos um summary no período.
     - `totalCentros`: total de centros considerados.
   - **Exemplo de resposta**
   ```json
   {
     "eventsByDay": { "2026-01-19": 3, "2026-01-20": 5 },
     "respondedCount": 42,
     "totalCentros": 55
   }
   ```

3) `GET /regionais/:id/centros`
   - **Para que serve**: continuar acessível para telas que precisam do detalhe, mas permitindo payload menor.
   - **Entradas (query params)**:
     - `STATUS` (lista, opcional)
     - `fields` (ex.: `_id,NOME_CENTRO`) para projeção.
   - **Saída**: lista de centros com somente campos solicitados.

4) `GET /summaries`
   - **Para que serve**: rota genérica, mas deve aceitar projeção/paginação para evitar downloads grandes.
   - **Entradas (query params)**:
     - `fields` (ex.: `CENTRO_ID,createdAt,updatedAt`)
     - `dateFrom`, `dateTo` (ISO, opcionais)
     - `limit` (default sugerido: 200), `skip` (offset)
     - `sort` (default: `updatedAt:-1`)
   - **Saída**: array de summaries conforme projeção e paginação.

### Considerações de implementação

- **Cache**: para rotas quase estáticas (`/forms`, `/pessoas`, `/regionais`), habilitar `Cache-Control: public, max-age=300` + ETag.
- **Cálculo de `finalizadosCount`**: agregação filtrando centros da regional e período; agrupar por `CENTRO_ID` e contar distintos.
- **Eventos por dia**: agregação por `date(createdAt)` no banco.
- **Erros / vazios**: retornar `[]` ou `{}` em caso de ausência de dados (não 500).

### Formato de datas

- Aceitar `dateFrom`/`dateTo` em ISO (`yyyy-mm-dd`) e normalizar para início/fim do dia em UTC.
