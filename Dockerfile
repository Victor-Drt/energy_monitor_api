# Usar a imagem oficial do Node.js LTS (18.x) como base
FROM node:18-alpine

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copiar o package.json e o package-lock.json para o contêiner
COPY package*.json ./

# Instalar as dependências da aplicação
RUN npm install

# Copiar o restante do código para o contêiner
COPY . .

# Compilar o código TypeScript para JavaScript
RUN npm run build

# Expor a porta em que a API irá rodar
EXPOSE 3000

# Definir o comando que será executado quando o contêiner for iniciado
CMD ["npm", "start"]
