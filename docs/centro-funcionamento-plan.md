# Plano: funcionamento e atividades dos centros

## Objetivo

Usar o ultimo `summary` finalizado e autorizado como fonte dos horarios e trabalhos
publicados por `GET /centros` e `GET /centros/:id`, sem duplicar essa informacao na
colecao de centros.

## Solucao

- O `summary` v2 guarda um snapshot hierarquico do formulario, com todas as ocorrencias
  dos grupos repetiveis.
- A API deriva `ATENDIMENTOS.ATIVIDADES` e `ATENDIMENTOS.PUBLICOS` dos grupos que
  possuem dia da semana e horario inicial validos.
- Dias sao normalizados para `SEGUNDA-FEIRA` ate `DOMINGO`; horarios usam `HH:mm`.
- Valores vazios, `FALSE`, `nan` e `Nao se Aplica` nao sao publicados.
- Assistencia Espiritual, Evangelizacao Infantil, Pre-Mocidade e Mocidade alimentam as
  projecoes de publico geral, criancas 0-12, adolescentes 12-14 e jovens 14-18.
- A listagem de centros consulta os ultimos summaries em lote. Quando a divulgacao foi
  autorizada, acrescenta `ATENDIMENTOS` e recalcula o `FUNCIONAMENTO` legado.
- Sem summary publicavel, a resposta preserva o `FUNCIONAMENTO` cadastral existente.

## Seguranca e aceite

- A evolucao de `answers` e aditiva; os valores originais nunca sao substituidos pela
  migracao de metadados de grupo.
- O backfill exige backup restauravel, journal, dry-run e reconciliacao de IDs, contagem
  e hashes dos campos originais.
- Testes cobrem multiplas turmas, consentimento, normalizacao, Mongo, Memory e endpoints.
