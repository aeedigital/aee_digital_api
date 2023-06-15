# Imagem base para o contêiner
FROM node:18-alpine

# Diretório de trabalho dentro do contêiner
WORKDIR /app

# Copiar o package.json e o package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instalar as dependências do projeto
RUN npm ci --only=production

# Copiar o código-fonte para o diretório de trabalho
COPY . .

# Build do projeto
RUN npm run build

# Porta em que o servidor do Nest.js irá escutar
EXPOSE 3000

# Comando para iniciar o servidor do Nest.js
CMD ["npm", "run", "start"]
