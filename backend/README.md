Pontus Backend v1.1
===================
Recursos adicionados:
- Associação de UID <-> Usuário (modelo de Cartão)
- Endpoint /api/user-by-uid para buscar informações do usuário para o feedback da leitura
- Endpoints protegidos com JWT e operações exclusivas para administradores
- Exportação para CSV
- Deduplicação no servidor e retorno do usuário associado no registro

Como executar:

1. Copie .env.example para .env e edite DATABASE_URL com suas credenciais do MySQL.
Execute os comandos:
    2. npm install
Gere o cliente Prisma com:
    3. npx prisma generate
Execute a migração do banco de dados:
    4. npx prisma migrate dev --name init
Execute a migração do banco de dados:
    5. node prisma/seed.js
Inicie o servidor:
    6. node server.js

Features added:
- UID <-> User association (Card model)
- /api/user-by-uid to fetch user info for read feedback
- Protected endpoints with JWT and admin-only operations
- CSV export
- Server-side dedupe and returns associated user on registro

How to run:
1. Copy .env.example to .env and edit DATABASE_URL with your MySQL credentials.
2. npm install
3. npx prisma generate
4. npx prisma migrate dev --name init
5. node prisma/seed.js
6. node server.js
