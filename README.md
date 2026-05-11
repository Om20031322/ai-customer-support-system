# 🚀 AI Customer Support System

Production-style AI-powered customer support platform built using React, Node.js, Kafka, Redis, PostgreSQL, Docker, Kubernetes, and Socket.IO.

This project simulates a real-world scalable customer support infrastructure with AI-powered ticket processing, realtime updates, retry queues, dead letter queue (DLQ) handling, caching, monitoring, authentication, and cloud-native deployment support.

---

## 🚀 Features

- ✅ AI-powered ticket classification and prioritization
- ✅ Real-time dashboard updates using Socket.IO
- ✅ Kafka-based event-driven architecture
- ✅ Retry queue and Dead Letter Queue (DLQ)
- ✅ Redis caching for analytics and ticket lists
- ✅ JWT authentication and Google OAuth login
- ✅ Role-based access control (USER / ADMIN)
- ✅ Admin analytics dashboard
- ✅ Kubernetes deployment support
- ✅ CI/CD with GitHub Actions
- ✅ Health checks and metrics monitoring
- ✅ Dockerized microservices architecture
- ✅ Production-style logging and observability

---

## Screenshots

### Login Page
<img width="1795" height="964" alt="Screenshot 2026-05-11 144843" src="https://github.com/user-attachments/assets/449be788-ea24-429b-9e0b-67bd711eebfc" />


### Dashboard
<img width="1915" height="986" alt="Screenshot 2026-05-11 145109" src="https://github.com/user-attachments/assets/aa093282-961e-4be0-9820-0c5173403efe" />


### Analytics
<img width="1891" height="896" alt="Screenshot 2026-05-11 145126" src="https://github.com/user-attachments/assets/ce41bd09-51f8-4cb7-bd3c-5cee7c85da27" />


### Dead Letter Queue
<img width="1909" height="898" alt="Screenshot 2026-05-11 145141" src="https://github.com/user-attachments/assets/99610890-1981-433e-99ce-07dfef5e8026" />


### System Status
<img width="1902" height="979" alt="image" src="https://github.com/user-attachments/assets/bc785cf3-4aba-4e7c-8974-887eef3f7b13" />


---

## 🏗️ System Architecture

```text
Frontend (React + TypeScript)
        ↓
Backend API (Express + Node.js)
        ↓
PostgreSQL Database
        ↓
Kafka Event Bus
        ↓
AI Processing Service (FastAPI)
        ↓
Redis Cache + Socket.IO Realtime Updates
```

---

## 🧰 Tech Stack

### 🎨 Frontend
- React
- TypeScript
- Tailwind CSS
- Socket.IO Client
- Recharts
- React Router

### ⚙️ Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- KafkaJS
- Redis
- JWT Authentication

### 🤖 AI Service
- Python
- FastAPI
- aiokafka

### 🐳 DevOps & Infrastructure
- Docker
- Kubernetes
- GitHub Actions
- Docker Compose

---

## 🔥 Reliability Features

### ⚡ Redis Caching
- Ticket list caching
- Analytics caching
- Cache invalidation strategy
- Reduced API response times

### 🔁 Retry Queue
- Automatic retry mechanism
- Max retry attempts: 3
- Retry delay handling

### 🚨 Dead Letter Queue (DLQ)
- Permanently failed tickets moved to DLQ
- Admin monitoring page
- Failure tracking and observability

### 📡 Realtime Updates
- Socket.IO live dashboard updates
- Ticket status streaming
- Realtime analytics refresh

---

## 📂 Project Structure

```text
ai-customer-support-system/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── auth/
│   ├── Dockerfile
│   └── package.json
│
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── kafka/
│   │   ├── socket/
│   │   └── config/
│   ├── Dockerfile
│   └── package.json
│
├── ai-service/
│   ├── app/
│   ├── Dockerfile
│   └── requirements.txt
│
├── k8s/
│   ├── frontend.yaml
│   ├── backend.yaml
│   ├── kafka.yaml
│   ├── redis.yaml
│   └── postgres.yaml
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🐳 Run Everything

Start Docker Desktop first, then run from the project root:

```bash
docker compose up --build
```

The Docker images use:
- multi-stage builds
- non-root users
- health checks
- optimized production layers
- restart policies

---

## 🌐 Application URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| AI Service | http://localhost:8000 |
| Kafka Host Port | localhost:29092 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## 🔐 Authentication

### Roles
- USER
- ADMIN

### Default Admin Credentials

```text
Email: admin@example.com
Password: Admin@123
```

### Authentication Features
- JWT Authentication
- Google OAuth Login
- Forgot Password Flow
- Reset Password Tokens
- Role-based Authorization

---

## ❤️ Health Checks & Metrics

### Backend Endpoints

```http
GET /health
GET /metrics
```

### Health Endpoint Includes
- Backend status
- PostgreSQL status
- Redis status
- Kafka status
- AI service status
- Uptime monitoring

### Metrics Endpoint Includes
- Total tickets
- Processed tickets
- Failed tickets
- Retry count
- DLQ count
- Redis hit rate
- API response times

---

## 📊 Observability & Monitoring

### Logging Features
- Structured API logs
- Kafka correlation IDs
- Request IDs
- Redis cache logs
- Retry/DLQ logs
- Socket.IO event logs

### Example Logs

```text
[API] GET /api/tickets 200 42ms
[Kafka] Published ticket-created event
[Retry] Attempt 2/3
[DLQ] Failed ticket saved
[Redis] Cache hit
```

---

## 🔒 Security Features

The backend uses:
- Helmet security headers
- Express rate limiting
- Strict CORS configuration
- JWT validation
- Protected admin routes
- Production-safe error responses

⚠️ Never commit:
- real `.env` files
- cloud credentials
- private keys
- certificates
- production secrets

Use:
- `.env.example`
- `.env.production.example`
- `k8s/secret.example.yaml`

---

## ☸️ Kubernetes Support

Kubernetes manifests are available inside:

```text
k8s/
```

Includes:
- frontend deployment
- backend deployment
- redis
- postgres
- kafka
- zookeeper

### Kubernetes Features
- readiness probes
- liveness probes
- replica support
- resource limits
- ClusterIP services
- LoadBalancer frontend

---

## ⚡ CI/CD

GitHub Actions pipeline automatically:
- installs dependencies
- builds frontend/backend
- validates TypeScript
- validates Python service
- checks Docker builds

Workflow file:

```text
.github/workflows/ci-cd.yml
```

---

## 📈 Scaling Strategy

### Horizontal Scaling
- Frontend replicas behind LoadBalancer/CDN
- Backend horizontal scaling
- Kafka partition scaling
- AI service consumer scaling

### Production Recommendations
Use managed cloud services for:
- PostgreSQL
- Redis
- Kafka

---

## 🔄 Realtime Events

Socket.IO events:

```text
ticket:created
ticket:updated
ticket:processed
ticket:failed
ticket:retried
ticket:dlq
analytics:updated
```

Admins receive all events.

Users receive only their own ticket events.

## Testing Checklist

### Test Ticket Submission

1. Start the stack with `docker compose up --build`.
2. Open `http://localhost:3000/register` and create a user account, or login at `http://localhost:3000/login`.
3. Open `http://localhost:3000/submit` and submit a ticket with a realistic subject and description.
4. Confirm the submit button disables while loading and the page shows `Processing ticket...`.
5. Open `http://localhost:3000/dashboard` and verify the ticket appears with status `PROCESSING`, then changes to `PROCESSED` after the AI service publishes the result.

### Test Role-Based Access

1. Login as a regular user and submit a ticket.
2. Confirm the user dashboard shows only that user's tickets and does not show the Analytics navigation item.
3. Logout, then login as `admin@example.com` with password `Admin@123`.
4. Confirm the admin dashboard shows all tickets.
5. Open a ticket details page as admin and change the status with the Manage Status select.
6. Open `http://localhost:3000/analytics` as admin and verify analytics load.
7. Confirm only admins see the Dead Letter Queue navigation link.
8. Login as a regular user and try opening `http://localhost:3000/analytics` or `http://localhost:3000/admin/dlq`; the app redirects back to the dashboard.

### Test Google Login

1. Add `GOOGLE_CLIENT_ID` to the root `.env` file.
2. Run `docker compose up --build`.
3. Open `http://localhost:3000/login`.
4. Click the Google login button and complete the Google prompt.
5. Confirm the app redirects to the dashboard and stores the same JWT format as email/password login.

### Test Forgot Password

1. Start the stack with `docker compose up --build`.
2. Open `http://localhost:3000/forgot-password`.
3. Enter the email for a local account, such as a user created through Register.
4. The page always shows `If this email exists, reset instructions have been sent.`.
5. Find the reset URL in backend logs:

```bash
docker compose logs -f backend
```

Look for a line like:

```text
[Auth] Password reset link for jane@example.com: http://localhost:3000/reset-password?token=...
```

6. Open that URL, enter a matching new password and confirmation, then log in with the new password.

Reset links expire after 15 minutes. Reset tokens are hashed before storage, and password reset is only available for `LOCAL` users.

### Verify Kafka Logs

Backend publish logs:

```bash
docker compose logs -f backend
```

AI service consume/process logs:

```bash
docker compose logs -f ai-service
```

Kafka broker logs:

```bash
docker compose logs -f kafka
```

Look for `tickets.created` publish messages from the backend, AI service receive logs, and `tickets.processed` consume logs back in the backend.

### Verify Realtime Updates

1. Keep the Dashboard open in one browser tab.
2. Submit a ticket from another tab.
3. Confirm toast notifications appear for realtime creation/status changes, AI completion, retries, failures, and DLQ movement for the logged-in user or admin.
4. Confirm the Dashboard row updates without a manual refresh.

### Test Redis Cache

1. Start the stack with `docker compose up --build`.
2. Open the dashboard or call `GET /api/tickets` twice with the same JWT.
3. Watch backend logs:

```bash
docker compose logs -f backend
```

The first request should log `[Redis] Cache miss`; the second request within 30 seconds should log `[Redis] Cache hit`.

4. Submit or update a ticket and confirm `[Redis] Cache invalidated` appears.

### Test Retry And DLQ Behavior

1. Start the stack.
2. Publish a malformed or intentionally failing message to `tickets.created` with a valid ticket ID, or temporarily make AI processing raise an exception in development.
3. Watch AI service logs for:

```text
[Retry] Attempt 1/3
[Retry] Attempt 2/3
[Retry] Attempt 3/3
[Retry] Max retries reached
```

4. Watch backend logs for `[DLQ] Failed ticket saved`.
5. Login as admin and open `http://localhost:3000/admin/dlq`.

### Test Email Console Mode

1. Leave `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, or `EMAIL_FROM` empty.
2. Start the backend and submit a ticket.
3. Confirm backend logs include `[Email] Console mode enabled` and the ticket email content.

### Check Dashboard And Analytics

1. Open `http://localhost:3000/dashboard`.
2. Verify clickable table rows/cards open the ticket details page.
3. Confirm the details page shows customer information, description, AI response, status/category/priority, created date, and the derived timeline.
4. Open `http://localhost:3000/analytics`.
5. Verify category, priority, and status charts render, and total/processed/urgent/failed cards update as tickets are processed.

## Local Development

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run dev
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

AI service:

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

For local service-to-service development, run Kafka and PostgreSQL through Docker Compose.

## 👨‍💻 Author

Om Shah

GitHub:
https://github.com/Om20031322

---

## ⭐ If you like this project

Give it a ⭐ on GitHub!
