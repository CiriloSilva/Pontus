# Pontus — Web NFC Attendance System  

🌍 **Live Demo / Produção**

| Módulo    | URL                                              |
|-----------|--------------------------------------------------|
| Web | https://pontus-eight.vercel.app/                 |
| Web NFC   | https://pontus-wheat.vercel.app/                 |
| Backend   | https://pontus-production.up.railway.app         |

Repositório GitHub: https://github.com/CiriloSilva/Pontus

---

## 📌 Sobre o projeto (PT-BR)

O **Pontus** é um sistema completo de registro de ponto utilizando cartões/pulseiras RFID NFC, usando **Web NFC** (Android + Chrome) como leitor.

Inclui:

- Backend (Fastify + Prisma + MySQL)
- Web (React + Vite)
- Web NFC (HTML + JS)
- Mobile (Expo – opcional)

Funcionalidades principais:

- Login JWT (admin e usuário)
- Associação UID ⇄ usuário (modelo de Cartão)
- Registro de ponto com UID, data/hora e origem (device)
- Painel administrativo com listagem de registros
- Filtro por usuário
- Exportação CSV
- Web NFC exibindo o nome do usuário associado após leitura

---

## 📦 Estrutura do repositório

    /backend        → API (Fastify + Prisma + MySQL)
    /web-nfc-https  → Leitor Web NFC (frontend estático)
    /web      → Interface administrativa (React + Vite)
    /mobile-expo    → App mobile (opcional, ambiente local)

---

## 🖥 Executando localmente

### 1) Backend

1. Entrar na pasta:

        cd backend

2. Criar o arquivo `.env` a partir do exemplo e configurar `DATABASE_URL`:

        cp .env.example .env

3. Abra o arquivo `backend/server.js` e altere o trecho de inicialização do servidor:

   **Produção (atual):**

   `app.listen({ port: PORT, host: '0.0.0.0' });`
   
   **Para Local:**

           app.listen({ port: PORT });`

4. Instalar dependências:

        npm install

5. Gerar o client do Prisma:

        npx prisma generate

6. Criar/migrar o banco em desenvolvimento:

        npx prisma migrate dev --name init

7. Rodar o seed para criar o usuário admin:

        node prisma/seed.js

8. Iniciar o servidor:

        npm run dev
        # ou
        node server.js

Admin padrão criado pelo seed:

    email: admin@pontus.local
    senha: pontusadmin123
    role:  admin

Backend local ficará escutando, por padrão, em:

    http://localhost:3000

---

### 2) Web NFC (local, com HTTPS próprio)

Este módulo era originalmente pensado para rodar localmente com um servidor HTTPS próprio.  
No ambiente de produção, essa parte está hospedada de forma estática na Vercel (sem `server.js`).

Para desenvolvimento local (se ainda quiser usar o servidor HTTPS local):

1. Entrar na pasta:

        cd web-nfc-https

2. Abra o arquivo `web-nfc-https/index.html` e altere a constante:

   **Produção (atual):**

   `const API_BASE = 'https://pontus-production.up.railway.app';`
   
   **Para Local:**

        const API_BASE = 'http://localhost:3000';

3. Instalar dependências (se houver `package.json`):

        npm install

4. Rodar o servidor local (se existir `server.js` configurado):

        node server.js

5. Testar:

    - No PC:  
      `https://localhost:3443`
    - No celular (mesma rede):  
      `https://<IP_DO_PC>:3443` (aceitar certificado autoassinado)

Em produção, o Web NFC é servido diretamente pela Vercel em:

    https://pontus-wheat.vercel.app/

---

### 3) Web (Vite – ambiente local)

A interface administrativa usa React + Vite.

1. Entrar na pasta:

        cd web

2. Abra o arquivo `web/App.jsx` e altere a constante:

   **Produção (atual):**

   `const BACKEND =
  window.__BACKEND__
  || import.meta.env.VITE_API_BASE_URL
  || 'http://127.0.0.1:3000'; `
   
   **Para Local:**

        const BACKEND = (window.__BACKEND__ || 'http://127.0.0.1:3000');

3. Instalar dependências:

        npm install

4. (Opcional, se o projeto ainda não tiver Vite inicialmente):

        npm install -D vite @vitejs/plugin-react

5. Criar arquivo `.env` para apontar o backend local:

        VITE_API_BASE_URL=http://localhost:3000

   Crie esse arquivo em:

        web/.env

6. Rodar em desenvolvimento:

        npm run dev

7. Abrir no navegador:

        http://localhost:5173

Login inicial:

    email: admin@pontus.local
    senha: pontusadmin123

---

### 4) Mobile (Expo – opcional)

O app mobile não está em produção; é usado apenas em desenvolvimento.

1. Entrar na pasta:

        cd mobile-expo

2. Instalar dependências:

        npm install

3. Iniciar o Expo:

        expo start

Siga as instruções do Expo (CLI / aplicativo Expo Go) para rodar no dispositivo ou emulador.

---

## 🌎 Deploy (produção)

### ⚙ Backend – Railway

O backend está em produção no Railway em:

    https://pontus-production.up.railway.app

### 🌐 Web – Vercel (Vite)

O Web está em:

    https://pontus-eight.vercel.app/

### 🌐 Web NFC – Vercel (estático)

O Web NFC está publicado em:

    https://pontus-wheat.vercel.app/


## 🧩 API – Endpoints principais

Principais endpoints da API (backend):

- Autenticação:

      POST /api/auth/register
      POST /api/auth/login

- Registros de ponto:

      POST /api/registro            → registra leitura de UID (com dedupe)
      GET  /api/registros           → lista registros (admin vê todos; user só os próprios)
      GET  /api/registros/export.csv → exporta CSV (apenas admin)

- Usuários / Cartões:

      GET    /api/users                 → lista usuários (admin)
      POST   /api/users                 → cria usuário (admin)
      POST   /api/users/:id/associate-uid → associa UID ao usuário (admin)
      DELETE /api/cards/:uid           → desassocia/deleta UID (admin)
      GET    /api/user-by-uid/:uid     → obtém usuário a partir de um UID (público)

- Saúde da API:

      GET /api/health                  → { ok: true, time: ... }

Usuário admin padrão (via seed):

    email: admin@pontus.local
    senha: pontusadmin123

---

## 🔐 Notas de segurança

- **JWT_SECRET** nunca deve ir para o frontend nem ser commitado.
- Variáveis sensíveis (`DATABASE_URL`, segredos, etc.) devem ficar apenas no backend (.env / Railway).
- As variáveis `VITE_` usadas no frontend são públicas (ex.: URL do backend) – isso é esperado.
- Recomenda-se usar HTTPS sempre (Vercel e Railway já fornecem HTTPS).
- Em um ambiente real, limite origens de CORS para domínios confiáveis.

No backend, atualmente:

    app.register(fastifyCors, { origin: true });

pode ser restringido futuramente para:

    app.register(fastifyCors, {
      origin: [
        'http://localhost:5173',
        'https://pontus-eight.vercel.app',
        'https://pontus-wheat.vercel.app'
      ]
    });

---

## 🇺🇸 English – Quick Overview

**Pontus** is a complete NFC-based time & attendance system using Web NFC (Android + Chrome) as the NFC reader.

Includes:

- **Backend** (Fastify + Prisma + MySQL)
- **Web** (React + Vite)
- **Web NFC** (HTML + JS)
- **Mobile (Expo)** – optional, for local development

**Production URLs:**

- Web: https://pontus-eight.vercel.app/
- Web NFC: https://pontus-wheat.vercel.app/
- Backend API: https://pontus-production.up.railway.app/

**Default admin user (seed):**

    admin@pontus.local / pontusadmin123

### Local development (summary)

Backend:

    cd backend
    cp .env.example .env
    npm install
    npx prisma migrate dev --name init
    node prisma/seed.js
    node server.js

Web NFC (local):

    cd web-nfc-https
    npm install
    node server.js

Web:

    cd web
    npm install
    # .env → VITE_API_BASE_URL=http://localhost:3000
    npm run dev

Mobile (Expo):

    cd mobile-expo
    npm install
    expo start

---

## 📝 Autor / Contexto

Projeto acadêmico/experimental desenvolvido para disciplina de Projeto Integrador para estudo de:

- NFC / Web NFC
- Arquiteturas com backend + frontend separados
- Deploy em ambientes gratuitos (Railway, Vercel)
- Integração entre web, mobile e hardware (tags RFID/NFC)

Sinta-se à vontade para abrir issues, sugestões ou forks no repositório:

    https://github.com/CiriloSilva/Pontus
