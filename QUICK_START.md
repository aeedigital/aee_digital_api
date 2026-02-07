# ⚡ Quick Start - Debug Local

## Setup em 2 comandos:

```bash
# 1. Setup inicial (copia .env, instala deps, builds, inicia Docker)
chmod +x scripts/setup.sh
./scripts/setup.sh

# 2. Pronto! Acesse:
# - API: http://localhost:5001
# - Debug: VSCode F5 → "Attach to Docker"
```

## Você também pode usar Make (mais rápido se já tiver setup):

```bash
make dev-up        # Inicia tudo
make dev-logs      # Ver logs
make dev-down      # Para tudo
make dev-clean     # Remove containers
```

## Ou usar npm diretamente:

```bash
npm run docker:up           # Inicia
npm run docker:logs         # Logs
npm run docker:down         # Para
npm run docker:clean        # Limpa
```

## 🔗 Apontar seu Frontend:

**Para React/Vue/Next:**
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
```

**No seu .env do frontend:**
```
REACT_APP_API_URL=http://localhost:5001
```

## 🐛 Debugar no VSCode:

1. Inicie com `make dev-up`
2. Pressione `F5` (Run → Start Debugging)
3. Escolha "Attach to Docker"
4. Coloque breakpoints no código
5. Faça requisições do frontend
6. VSCode pausa nos breakpoints

## ✅ Antes de subir pro AWS:

```bash
make pre-deploy
```

Isso roda:
- Lint do código
- Testes com cobertura
- Build de produção
- Testes E2E

## 📚 Documentação Completa:

Abra [DEBUG_LOCAL.md](DEBUG_LOCAL.md) para detalhes completos.

## 🆘 Problemas?

**Porta já em uso:**
```bash
docker-compose down
docker-compose up -d
```

**Ver logs:**
```bash
docker-compose logs -f app
```

**Reset completo:**
```bash
docker-compose down
./scripts/setup.sh
```

That's it! Happy debugging! 🎉

