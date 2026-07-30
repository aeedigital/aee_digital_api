# 🚀 Debug Local - API + MongoDB Real

## Visão Geral

Você vai rodar localmente apenas:

- **NestJS API** em modo watch com reload automático
- **Debug remoto** na porta 9229 para usar no VSCode
- **MongoDB real** em produção (mesmo banco que a AWS usa)

## ⚡ Quick Start

### 1. Setup Inicial (primeira vez)

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

Isso:
- Copia `.env.local` → `.env`
- Instala dependências npm
- Faz build da aplicação
- Inicia containers Docker
- Mostra endpoints disponíveis

### 2. Nos próximos startups (mais rápido)

```bash
docker-compose up -d
```

Ou com Make:
```bash
make dev-up
```

## 📡 Endpoints Locais

| Serviço | URL | Uso |
|---------|-----|-----|
| **API NestJS** | `http://localhost:5001` | **Use este no frontend** |
| **MongoDB** | Produção | Mesmo banco da AWS |
| **Debug** | `localhost:9229` | VSCode F5 |

## 🎯 Configuração

Seu arquivo `.env` deve ter:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://aliancadigital:aliancadigital@aee.pvgzm2s.mongodb.net/
LOG_LEVEL=debug
```

> ⚠️ **O banco é REAL!** Qualquer escrita afeta produção. Cuidado.

## 🐛 Debugar no VSCode

### Método 1: Attach ao Docker (Recomendado)

1. Inicie com `docker-compose up -d`
2. Pressione `F5` no VSCode
3. Selecione **"Attach to Docker"**
4. Coloque um breakpoint no código
5. Faça uma requisição da sua API
6. VSCode pausa no breakpoint

### Método 2: Debug Local (sem Docker)

```bash
npm run start:debug
```

Depois:
1. Pressione `F5`
2. Selecione **"Debug NestJS (Local)"**

### Método 3: Debug de Testes

```bash
npm run test:debug
```

Ou pressione `F5` e escolha **"Debug Tests"**

## 🔄 Workflow Típico

```bash
# Terminal 1: Iniciar API
docker-compose up -d
docker-compose logs -f app

# Terminal 2: VSCode
# F5 → "Attach to Docker" → adiciona breakpoints → testa frontend
```

Quando você edita código, a aplicação recarrega automaticamente (`npm run start:dev`).

## 📊 Ver Logs

```bash
# Logs em tempo real
docker-compose logs -f app

# Últimas 50 linhas
docker-compose logs --tail 50 app

# Sem follow
docker-compose logs app
```

## 🧹 Comandos Úteis

```bash
# Parar tudo
docker-compose down

# Parar e remover (limpa volumes)
docker-compose down -v

# Remover tudo e reconstruir
docker-compose down -v --rmi all
docker-compose up -d --build

# Restart do container
docker-compose restart app

# Ver status
docker-compose ps

# Entrar no container (bash)
docker-compose exec app bash

# Executar comando no container
docker-compose exec app npm run lint
```

## ✅ Checklist antes de subir para AWS

```bash
# 1. Testes locais passando
npm run test:cov

# 2. Build de produção funciona
npm run build
npm run start:prod

# 3. Rodar um teste de integração
npm run test:e2e

# 4. Limpar recursos locais
docker-compose down -v
```

## ⚠️ Cuidados Importantes

1. **Banco é REAL** - DELETE, UPDATE, etc afetam produção
2. **Não commitar .env** - Já está no .gitignore
3. **Senhas em .env** - Nunca pushear credenciais
4. **Testar em Feature Branch** - Use dados de teste quando possível

## 🔧 Troubleshooting

### API não inicia

```bash
# Ver erro completo
docker-compose logs app

# Reconstruir imagem
docker-compose up -d --build

# Limpar node_modules
rm -rf node_modules
docker-compose down -v
docker-compose up -d
```

### Porta 5001 já em uso

```bash
# Encontrar processo
lsof -i :5001

# Matar e recomeçar
docker-compose down
docker-compose up -d
```

### Problema de conexão MongoDB

```bash
# Testar conexão (no container)
docker-compose exec app npm run build

# Ver log detalhado
docker-compose logs app | grep -i mongo
```

### Debug não conecta na porta 9229

```bash
# Verificar porta
lsof -i :9229

# Se ocupada, encontrar e matar processo
kill -9 <PID>

# Recomeçar container
docker-compose restart app
```

### TypeScript errors no VSCode

```bash
# Reconstruir
npm run build

# Reinstalar deps
rm -rf node_modules
npm install

# Restart TS Server: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

## 📝 Variáveis de Ambiente

Se precisar alterar:

```bash
# Copie o exemplo
cp .env.example .env

# Edite conforme necessário
nano .env  # ou seu editor preferido

# Restart do container para aplicar
docker-compose restart app
```

Variáveis disponíveis:
- `NODE_ENV` - development/production
- `PORT` - porta da API (padrão 5000)
- `MONGODB_URI` - conexão MongoDB
- `LOG_LEVEL` - debug/info/warn/error
- `CORS_ORIGIN` - domínios permitidos

## ✅ Checklist Antes de Deploy

```bash
# 1. Testes passando?
npm run test:cov

# 2. Build funciona?
npm run build

# 3. Lint limpo?
npm run lint

# 4. E2E OK?
npm run test:e2e

# 5. Sem .env commitado?
git status # não deve mostrar .env

# 6. Sem logs de debug no código?
grep -r "console.log" src/

# 7. Limpar ambiente local
docker-compose down -v
```

## 🎓 Estrutura do Projeto

```
.
├── src/                    # Código fonte
│   ├── main.ts            # Entry point
│   ├── app.module.ts      # Módulo principal
│   ├── lambda.ts          # Handler Lambda (para AWS)
│   └── ...
├── test/                   # Testes E2E
├── docker-compose.yml      # Orquestração de containers
├── Dockerfile              # Build de produção
├── .env.example           # Exemplo de variáveis
├── .env.local             # Dev local (não commitar)
└── DEBUG_LOCAL.md         # Este arquivo
```

## 🚀 Próximas Etapas

Após testar localmente:

```bash
# 1. Testar build de produção
npm run build
npm run start:prod

# 2. Rodar testes
npm run test:e2e

# 3. Fazer deploy (ver instruções AWS)
```

## 📱 Apontar Frontend

No seu frontend, configure:

```javascript
// development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// production
// const API_URL = 'https://seu-dominio.com/api';
```

**.env do frontend:**
```
REACT_APP_API_URL=http://localhost:5001
```

## 🆘 Ainda com problemas?

1. Cheque `docker-compose logs app`
2. Verifique portas: `lsof -i :5001` e `lsof -i :9229`
3. Delete tudo: `docker-compose down -v --rmi all`
4. Recomeçe: `./scripts/setup.sh`

## 📚 Referências

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [NestJS Docs](https://docs.nestjs.com/)
- [VSCode Node Debugging](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

