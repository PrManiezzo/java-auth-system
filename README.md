# Sistema completo de autenticação (Spring Boot + React)

Projeto separado em duas partes:

- `backend/` → API Java Spring Boot com autenticação JWT (2 horas)
- `frontend/` → React (Vite) com telas modernas de login, cadastro e recuperação de senha

## Funcionalidades implementadas

- Cadastro de usuário
- Login com JWT
- Sessão com expiração de **2 horas** (`7200000 ms`)
- Rota protegida `/dashboard` no frontend
- Página de sucesso após login com status "logado"
- Recuperação de senha por e-mail com link de redefinição
- Banco de dados PostgreSQL em Docker

## Rodar com Docker (recomendado)

Na raiz do projeto:

```bash
docker compose up --build -d
```

Serviços:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- MailHog (caixa de e-mails): `http://localhost:8025`
- PostgreSQL: `localhost:5432` (`authdb` / `authuser` / `authpass`)

Parar tudo:

```bash
docker compose down
```

Parar e remover volume do banco:

```bash
docker compose down -v
```

## Fluxo de uso (Docker)

1. Acesse `http://localhost:5173`
2. Faça cadastro ou login
3. Ao logar, será redirecionado para `/dashboard`
4. Em "Esqueci minha senha", informe o e-mail
5. Abra `http://localhost:8025` (MailHog), copie o link e redefina a senha

## Rodar sem Docker (opcional)

### Pré-requisitos

- Java 17+
- Node.js 18+
- Maven 3.9+

### Backend

```bash
cd backend
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Endpoints principais

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me` (protegido com Bearer token)
