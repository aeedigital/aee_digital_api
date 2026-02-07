# Relatório de Latência - Rotas GET

- Data/hora: 2026-02-07 09:24:11 -0300
- Base URL: http://127.0.0.1:5001
- Amostras por rota: 5
- Total de rotas GET executadas: 25

## Top 10 maiores latências médias

- `/summaries/stats` | status=400 | avg=1.158 ms | p95=1.584 ms | min=0.939 ms | max=1.584 ms | ok=0/5
- `/forms/000000000000000000000000` | status=404 | avg=1.077 ms | p95=1.989 ms | min=0.790 ms | max=1.989 ms | ok=0/5
- `/regionais/000000000000000000000000/coord-summary` | status=404 | avg=0.959 ms | p95=1.230 ms | min=0.844 ms | max=1.230 ms | ok=0/5
- `/regionais/000000000000000000000000` | status=404 | avg=0.951 ms | p95=1.509 ms | min=0.728 ms | max=1.509 ms | ok=0/5
- `/centros/000000000000000000000000` | status=404 | avg=0.932 ms | p95=1.045 ms | min=0.834 ms | max=1.045 ms | ok=0/5
- `/regionais/overview` | status=200 | avg=0.911 ms | p95=1.016 ms | min=0.846 ms | max=1.016 ms | ok=5/5
- `/regionais/000000000000000000000000/summaries` | status=200 | avg=0.910 ms | p95=0.974 ms | min=0.831 ms | max=0.974 ms | ok=5/5
- `/answers/000000000000000000000000` | status=404 | avg=0.884 ms | p95=1.099 ms | min=0.780 ms | max=1.099 ms | ok=0/5
- `/forms` | status=200 | avg=0.881 ms | p95=0.948 ms | min=0.745 ms | max=0.948 ms | ok=5/5
- `/summaries/000000000000000000000000` | status=404 | avg=0.877 ms | p95=1.038 ms | min=0.783 ms | max=1.038 ms | ok=0/5

## Todas as rotas

- `/` | status=200 | avg=0.847 ms | p95=1.192 ms | min=0.726 ms | max=1.192 ms | ok=5/5
- `/answers` | status=200 | avg=0.820 ms | p95=0.926 ms | min=0.733 ms | max=0.926 ms | ok=5/5
- `/answers/000000000000000000000000` | status=404 | avg=0.884 ms | p95=1.099 ms | min=0.780 ms | max=1.099 ms | ok=0/5
- `/centros` | status=200 | avg=0.830 ms | p95=0.869 ms | min=0.794 ms | max=0.869 ms | ok=5/5
- `/centros/000000000000000000000000` | status=404 | avg=0.932 ms | p95=1.045 ms | min=0.834 ms | max=1.045 ms | ok=0/5
- `/centros/000000000000000000000000/summaries` | status=200 | avg=0.810 ms | p95=0.891 ms | min=0.741 ms | max=0.891 ms | ok=5/5
- `/clearcache` | status=200 | avg=0.659 ms | p95=0.753 ms | min=0.596 ms | max=0.753 ms | ok=5/5
- `/forms` | status=200 | avg=0.881 ms | p95=0.948 ms | min=0.745 ms | max=0.948 ms | ok=5/5
- `/forms/000000000000000000000000` | status=404 | avg=1.077 ms | p95=1.989 ms | min=0.790 ms | max=1.989 ms | ok=0/5
- `/passes` | status=200 | avg=0.864 ms | p95=1.096 ms | min=0.748 ms | max=1.096 ms | ok=5/5
- `/passes/000000000000000000000000` | status=404 | avg=0.822 ms | p95=1.018 ms | min=0.682 ms | max=1.018 ms | ok=0/5
- `/pessoas` | status=200 | avg=0.832 ms | p95=0.932 ms | min=0.672 ms | max=0.932 ms | ok=5/5
- `/pessoas/000000000000000000000000` | status=404 | avg=0.845 ms | p95=1.018 ms | min=0.733 ms | max=1.018 ms | ok=0/5
- `/questions` | status=200 | avg=0.819 ms | p95=0.977 ms | min=0.729 ms | max=0.977 ms | ok=5/5
- `/questions/000000000000000000000000` | status=404 | avg=0.832 ms | p95=0.959 ms | min=0.692 ms | max=0.959 ms | ok=0/5
- `/regionais` | status=200 | avg=0.793 ms | p95=0.901 ms | min=0.708 ms | max=0.901 ms | ok=5/5
- `/regionais/000000000000000000000000` | status=404 | avg=0.951 ms | p95=1.509 ms | min=0.728 ms | max=1.509 ms | ok=0/5
- `/regionais/000000000000000000000000/centros` | status=200 | avg=0.856 ms | p95=0.985 ms | min=0.747 ms | max=0.985 ms | ok=5/5
- `/regionais/000000000000000000000000/centros-with-answers` | status=200 | avg=0.825 ms | p95=1.061 ms | min=0.719 ms | max=1.061 ms | ok=5/5
- `/regionais/000000000000000000000000/coord-summary` | status=404 | avg=0.959 ms | p95=1.230 ms | min=0.844 ms | max=1.230 ms | ok=0/5
- `/regionais/000000000000000000000000/summaries` | status=200 | avg=0.910 ms | p95=0.974 ms | min=0.831 ms | max=0.974 ms | ok=5/5
- `/regionais/overview` | status=200 | avg=0.911 ms | p95=1.016 ms | min=0.846 ms | max=1.016 ms | ok=5/5
- `/summaries` | status=200 | avg=0.771 ms | p95=0.947 ms | min=0.680 ms | max=0.947 ms | ok=5/5
- `/summaries/000000000000000000000000` | status=404 | avg=0.877 ms | p95=1.038 ms | min=0.783 ms | max=1.038 ms | ok=0/5
- `/summaries/stats` | status=400 | avg=1.158 ms | p95=1.584 ms | min=0.939 ms | max=1.584 ms | ok=0/5
