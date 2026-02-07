# Relatório de Latência - Rotas GET (Dados Reais)

- Data/hora: 2026-02-07 09:30:37 -0300
- Base URL: http://127.0.0.1:5001
- Amostras por rota: 7
- Janela de datas aplicada: 2024-01-01 a 2026-12-31
- Total de rotas GET executadas: 25

## Top 12 maiores latências médias

- `/answers` | status=200 | avg=9626.408 ms | p95=9668.849 ms | min=9575.734 ms | max=9668.849 ms | ok=7/7
- `/summaries?dateFrom=2024-01-01&dateTo=2026-12-31` | status=200 | avg=2256.530 ms | p95=2425.396 ms | min=2038.567 ms | max=2425.396 ms | ok=7/7
- `/regionais/61b0ba7a71572500128b85dc/centros-with-answers?dateFrom=2024-01-01&dateTo=2026-12-31&include=answers` | status=7 | avg=2080.990 ms | p95=1741.481 ms | min=200000.000 ms | max=1661.106 ms | ok=2.080990/summaries&limitSummaries=3
- `/regionais/61b0ba7a71572500128b85dc/summaries?dateFrom=2024-01-01&dateTo=2026-12-31` | status=200 | avg=1191.719 ms | p95=1417.274 ms | min=997.792 ms | max=1417.274 ms | ok=7/7
- `/regionais/61b0ba7a71572500128b85dc/coord-summary?dateFrom=2024-01-01&dateTo=2026-12-31` | status=200 | avg=1140.227 ms | p95=1259.333 ms | min=1089.021 ms | max=1259.333 ms | ok=7/7
- `/summaries/stats?dateFrom=2024-01-01&dateTo=2026-12-31` | status=200 | avg=408.529 ms | p95=419.078 ms | min=405.596 ms | max=419.078 ms | ok=7/7
- `/regionais/overview?dateFrom=2024-01-01&dateTo=2026-12-31` | status=200 | avg=219.024 ms | p95=220.800 ms | min=217.713 ms | max=220.800 ms | ok=7/7
- `/answers/61df43d1df23b90014a945a3` | status=200 | avg=139.366 ms | p95=174.806 ms | min=132.805 ms | max=174.806 ms | ok=7/7
- `/centros/61b0babc71572500128b8602/summaries` | status=200 | avg=138.776 ms | p95=140.741 ms | min=137.008 ms | max=140.741 ms | ok=7/7
- `/summaries/6987150abe75240e4f2da379` | status=200 | avg=136.841 ms | p95=139.223 ms | min=135.527 ms | max=139.223 ms | ok=7/7
- `/passes/61df43d3df23b90014a94681` | status=200 | avg=134.935 ms | p95=138.839 ms | min=133.245 ms | max=138.839 ms | ok=7/7
- `/centros/61b0babc71572500128b8602` | status=200 | avg=134.453 ms | p95=137.415 ms | min=133.127 ms | max=137.415 ms | ok=7/7

## Todas as rotas

- `/` | status=200 | avg=1.050 ms | p95=1.668 ms | min=0.731 ms | max=1.668 ms | ok=7/7
- `/answers` | status=200 | avg=9626.408 ms | p95=9668.849 ms | min=9575.734 ms | max=9668.849 ms | ok=7/7
- `/answers/61df43d1df23b90014a945a3` | status=200 | avg=139.366 ms | p95=174.806 ms | min=132.805 ms | max=174.806 ms | ok=7/7
- `/centros` | status=200 | avg=4.108 ms | p95=4.812 ms | min=3.843 ms | max=4.812 ms | ok=7/7
- `/centros/61b0babc71572500128b8602` | status=200 | avg=134.453 ms | p95=137.415 ms | min=133.127 ms | max=137.415 ms | ok=7/7
- `/centros/61b0babc71572500128b8602/summaries` | status=200 | avg=138.776 ms | p95=140.741 ms | min=137.008 ms | max=140.741 ms | ok=7/7
- `/clearcache` | status=200 | avg=0.699 ms | p95=0.832 ms | min=0.571 ms | max=0.832 ms | ok=7/7
- `/forms` | status=200 | avg=3.898 ms | p95=7.449 ms | min=3.147 ms | max=7.449 ms | ok=7/7
- `/forms/655d1d52e88893fbf20e6e00` | status=200 | avg=60.647 ms | p95=415.328 ms | min=1.284 ms | max=415.328 ms | ok=7/7
- `/passes` | status=200 | avg=2.512 ms | p95=3.275 ms | min=2.257 ms | max=3.275 ms | ok=7/7
- `/passes/61df43d3df23b90014a94681` | status=200 | avg=134.935 ms | p95=138.839 ms | min=133.245 ms | max=138.839 ms | ok=7/7
- `/pessoas` | status=200 | avg=0.885 ms | p95=1.244 ms | min=0.723 ms | max=1.244 ms | ok=7/7
- `/pessoas/61e2dde9b5d3a100130515c3` | status=200 | avg=133.800 ms | p95=135.555 ms | min=133.064 ms | max=135.555 ms | ok=7/7
- `/questions` | status=200 | avg=1.473 ms | p95=2.169 ms | min=1.236 ms | max=2.169 ms | ok=7/7
- `/questions/61df432fdf23b90014a944a2` | status=200 | avg=133.630 ms | p95=134.198 ms | min=133.307 ms | max=134.198 ms | ok=7/7
- `/regionais` | status=200 | avg=0.886 ms | p95=1.175 ms | min=0.782 ms | max=1.175 ms | ok=7/7
- `/regionais/61b0ba7a71572500128b85dc` | status=200 | avg=133.654 ms | p95=136.144 ms | min=132.711 ms | max=136.144 ms | ok=7/7
- `/regionais/61b0ba7a71572500128b85dc/centros` | status=200 | avg=1.192 ms | p95=1.333 ms | min=1.098 ms | max=1.333 ms | ok=7/7
- `/regionais/61b0ba7a71572500128b85dc/centros-with-answers?dateFrom=2024-01-01&dateTo=2026-12-31&include=answers` | status=7 | avg=2080.990 ms | p95=1741.481 ms | min=200000.000 ms | max=1661.106 ms | ok=2.080990/summaries&limitSummaries=3
- `/regionais/61b0ba7a71572500128b85dc/coord-summary?dateFrom=2024-01-01&dateTo=2026-12-31` | status=200 | avg=1140.227 ms | p95=1259.333 ms | min=1089.021 ms | max=1259.333 ms | ok=7/7
- `/regionais/61b0ba7a71572500128b85dc/summaries?dateFrom=2024-01-01&dateTo=2026-12-31` | status=200 | avg=1191.719 ms | p95=1417.274 ms | min=997.792 ms | max=1417.274 ms | ok=7/7
- `/regionais/overview?dateFrom=2024-01-01&dateTo=2026-12-31` | status=200 | avg=219.024 ms | p95=220.800 ms | min=217.713 ms | max=220.800 ms | ok=7/7
- `/summaries/6987150abe75240e4f2da379` | status=200 | avg=136.841 ms | p95=139.223 ms | min=135.527 ms | max=139.223 ms | ok=7/7
- `/summaries/stats?dateFrom=2024-01-01&dateTo=2026-12-31` | status=200 | avg=408.529 ms | p95=419.078 ms | min=405.596 ms | max=419.078 ms | ok=7/7
- `/summaries?dateFrom=2024-01-01&dateTo=2026-12-31` | status=200 | avg=2256.530 ms | p95=2425.396 ms | min=2038.567 ms | max=2425.396 ms | ok=7/7
