# # Imagem base para o contêiner
FROM node:18-alpine

# Diretório de trabalho dentro do container
WORKDIR /app

# Copie o arquivo package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante dos arquivos da aplicação para o diretório de trabalho
COPY . .

# Porta que a aplicação NestJS irá expor
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["npm", "run", "start:prod"]