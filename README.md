# Pontus Complete v1.4 (backend + web-nfc + admin-web + mobile-expo)

Novidades na v1.4:
- Associação de UID <-> Usuário (modelo de Cartão)
- Interface de administração para associar um UID a um usuário
- Fluxo de login (JWT) para admin e usuário
- O administrador pode filtrar por usuário e exportar CSV
- O WebNFC exibe o nome do usuário associado após a leitura bem-sucedida

Início rápido:
1) Backend:
   - cd backend
   - copie .env.example para .env e edite DATABASE_URL com suas credenciais do MySQL
   - npm install
   - npx prisma generate
   - npx prisma migrate dev --name init
   - node prisma/seed.js
   - node server.js

2) Web NFC (HTTPS):
   - cd web-nfc-https
   - npm install
   - node server.js
   - Acesse https://localhost:3443 no seu PC para testar, ou https://<IP_PC>:3443 no seu celular (aceite o certificado autoassinado).

3) Admin web:
   - cd admin-web
   - npm install
   - instale o vite se necessário: npm install -D vite @vitejs/plugin-react
   - npm run dev
   - Abra http://localhost:5173 e faça login com admin@pontus.local / pontusadmin123

4) Mobile (opcional):
   - cd mobile-expo
   - npm install
   - expo start

Notas:
- Quando um cartão é lido, o servidor WebNFC encaminha para o backend; o backend vincula a leitura a um usuário (se associado) e retorna o nome do usuário na resposta.
- Para produção, defina um segredo JWT forte, use certificados TLS reais e proteja as credenciais do banco de dados.

----------------------------------------------------------------

What's new in v1.4: 
- UID <-> User association (Card model) 
- Admin UI to associate a UID to a user 
- Login flow (JWT) for admin and user 
- Admin can filter by user and export CSV 
- WebNFC shows the associated user's name upon successful read

Quick start:
1) Backend:
   - cd backend
   - copy .env.example to .env and edit DATABASE_URL with your MySQL credentials
   - npm install
   - npx prisma generate
   - npx prisma migrate dev --name init
   - node prisma/seed.js
   - node server.js

2) Web NFC (HTTPS):
   - cd web-nfc-https
   - npm install
   - node server.js
   - Visit https://localhost:3443 on your PC to test, or https://<PC_IP>:3443 on your phone (accept self-signed cert).

3) Admin web:
   - cd admin-web
   - npm install
   - install vite if necessary: npm install -D vite @vitejs/plugin-react
   - npm run dev
   - Open http://localhost:5173 and login with admin@pontus.local / pontusadmin123

4) Mobile (optional):
   - cd mobile-expo
   - npm install
   - expo start

Notes:
- When a card is read, the WebNFC server forwards to backend; backend will link the read to a user (if associated) and return the user name in the response.
- For production, set a strong JWT secret, use real TLS certs, and secure DB credentials.
