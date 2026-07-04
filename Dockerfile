FROM node:20-alpine
RUN apk add --no-cache postgresql-client
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN mkdir -p src/uploads/books src/reports/pdf
EXPOSE 8000
CMD ["sh", "entrypoint.sh"]