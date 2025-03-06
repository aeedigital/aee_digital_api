# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia o package.json e package-lock.json (se disponível)
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante dos arquivos do projeto
COPY . .

# Executa o build do projeto
RUN npm run build

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

# Copia os arquivos necessários do stage de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 5001

CMD ["npm", "run", "start"]
