# 📦 EquipEscola — Guia de Instalação e Deploy

## ✅ Pré-requisitos

Instale antes de começar:
- **Node.js LTS** → https://nodejs.org
- **Git** → https://git-scm.com

---

## 🚀 Rodando localmente (para testar)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edite o `.env` e preencha:
```
DATABASE_URL=postgresql://...   ← veja passo do Railway abaixo
JWT_SECRET=qualquer_string_longa_e_aleatoria
ADMIN_EMAIL=seu@email.com
ADMIN_PASSWORD=suasenha
ADMIN_NAME=Seu Nome
```

```bash
npm run dev
# Servidor rodando em http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edite o `.env`:
```
VITE_API_URL=http://localhost:3001
```

```bash
npm run dev
# Abre em http://localhost:5173
```

---

## ☁️ Deploy — Railway (Backend + Banco)

### 1. Criar conta e banco no Railway

1. Acesse https://railway.app e crie conta
2. Clique **New Project → Provision PostgreSQL**
3. Após criar, clique no banco → aba **Connect**
4. Copie a **DATABASE_URL** (começa com `postgresql://`)

### 2. Deploy do backend no Railway

1. No Railway, clique **New → GitHub Repo**
2. Conecte sua conta GitHub e selecione o repo
3. Railway vai detectar o `backend/` — configure:
   - **Root Directory:** `backend`
   - **Start Command:** `node server.js`
4. Vá em **Variables** e adicione:
   ```
   DATABASE_URL=postgresql://...  ← o que você copiou
   JWT_SECRET=string_aleatoria_longa
   ADMIN_EMAIL=seu@email.com
   ADMIN_PASSWORD=sua_senha_segura
   ADMIN_NAME=Seu Nome
   FRONTEND_URL=https://seu-app.vercel.app
   NODE_ENV=production
   ```
5. Clique **Deploy** — em 2 minutos o backend está no ar
6. Copie a URL gerada (ex: `https://equipescola.up.railway.app`)

---

## ▲ Deploy — Vercel (Frontend)

1. Acesse https://vercel.com e crie conta
2. Clique **Add New → Project → Import Git Repository**
3. Selecione o repo
4. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
5. Em **Environment Variables** adicione:
   ```
   VITE_API_URL=https://equipescola.up.railway.app
   ```
   (use a URL do Railway do passo anterior)
6. Clique **Deploy**

✅ Em 2 minutos o sistema está no ar!

---

## 🔐 Primeiro acesso

- Acesse a URL da Vercel
- Faça login com o email e senha que definiu em `ADMIN_EMAIL` e `ADMIN_PASSWORD`
- Você está como **ADMIN** — pode criar operadores em **Usuários**

---

## 📋 Fluxo de uso

### Cadastro inicial (só ADMIN)
1. **Pessoas** → cadastrar todos que podem retirar equipamentos
2. **Equipamentos** → cadastrar cada equipamento com número de patrimônio

### Operação diária
1. **Retirada** → seleciona pessoa → passa o scanner em cada equipamento → confirma
2. **Devolução** → passa o scanner → confirma

### Regras importantes
- ❌ Equipamento fora **não pode ser retirado** novamente até devolver
- ✅ Scanner funciona como teclado — só aponte e escaneie no campo de texto
- 📊 Dashboard mostra em tempo real o que está fora

---

## 🗂️ Estrutura do projeto

```
escola-equipamentos/
├── backend/
│   ├── db/index.js          ← conexão e criação do banco
│   ├── middleware/auth.js   ← JWT e controle de acesso
│   ├── routes/
│   │   ├── auth.js          ← login e usuários
│   │   ├── pessoas.js       ← CRUD de pessoas
│   │   ├── equipamentos.js  ← CRUD de equipamentos
│   │   └── movimentacoes.js ← retirada, devolução, histórico
│   └── server.js
└── frontend/
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── Retirada.jsx    ← scanner + lista em tempo real
        │   ├── Devolucao.jsx   ← scanner + feedback imediato
        │   ├── Historico.jsx   ← filtros por data/pessoa/patrimônio
        │   ├── Pessoas.jsx
        │   ├── Equipamentos.jsx
        │   └── Usuarios.jsx
        ├── contexts/AuthContext.jsx
        ├── api/index.js
        └── App.jsx
```
