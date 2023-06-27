# Imagem base para o contêiner
FROM node:18-alpine

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copie os arquivos do projeto para o contêiner
COPY package*.json ./

# Instale as dependências
RUN npm install

# Instale o Nest.js globalmente
RUN npm install -g @nestjs/cli

# Copie o restante dos arquivos do projeto para o contêiner
COPY . .

# Execute o comando de build do Nest.js
RUN npm run build

# Especifique o comando de inicialização do contêiner
CMD [ "npm", "run", "start:prod" ]