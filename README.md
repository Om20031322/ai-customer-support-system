# AI Customer Support System

[![CI/CD](https://github.com/OWNER/REPO/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci-cd.yml)

A Dockerized customer support platform with realtime ticket triage.

## Architecture

```text
React frontend
  -> Express backend REST API
  -> PostgreSQL stores tickets
  -> Kafka tickets.created event
  -> FastAPI AI service processes ticket
  -> Kafka tickets.processed event
  -> Express backend updates PostgreSQL
  -> Redis caches dashboards and ticket lists
  -> SMTP or console notifications email customers
  -> Socket.IO pushes realtime updates to frontend
  -> Health and metrics endpoints expose runtime status
```

## Services

- `frontend`: React, TypeScript, Tailwind CSS, Axios, Socket.IO client, Recharts
- `backend`: Node.js, Express.js, TypeScript, Prisma, PostgreSQL, KafkaJS, Socket.IO, JWT auth
- `ai-service`: Python, FastAPI, aiokafka, optional OpenAI SDK
- `postgres`: PostgreSQL database
- `redis`: Redis cache for analytics and ticket lists
- `kafka`: Kafka broker
- `zookeeper`: Kafka coordination service

## Folder Structure

```text
ai-customer-support-system/
  ai-service/
    app/
  backend/
    prisma/
    src/
      config/
      controllers/
      kafka/
      middleware/
      prisma/
      routes/
      services/
      socket/
  frontend/
    src/
      components/
      hooks/
      pages/
      services/
      types/
  docker-compose.yml
```

## Run Everything

Start Docker Desktop first, then run from the project root:

```bash
docker compose up --build
```

The Docker images use production builds, multi-stage layers, non-root users, `.dockerignore` files, and service health checks. Compose restart policies keep services running during local infrastructure restarts.

URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- AI service: `http://localhost:8000`
- Kafka host port: `localhost:29092`
- PostgreSQL host port: `localhost:5432`
- Redis host port: `localhost:6379`

The backend container runs Prisma migrations before starting:

```bash
npm run prisma:deploy
npm run seed
```

To rebuild after code or dependency changes:

```bash
docker compose up --build
```

## OpenAI Configuration

The AI service uses mock logic by default.

To enable OpenAI processing, create a root `.env` file:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
JWT_SECRET=replace-with-a-long-random-secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
REDIS_URL=redis://redis:6379
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
```

If `OPENAI_API_KEY` is empty or missing, the AI service automatically uses mock classification, priority assignment, and response generation.

## Google OAuth Configuration

Google login uses a Google OAuth web client ID. In Google Cloud Console:

1. Create or select a project.
2. Open APIs & Services -> Credentials.
3. Create an OAuth 2.0 Client ID with application type `Web application`.
4. Add `http://localhost:3000` to Authorized JavaScript origins.
5. Add `http://localhost:3000` and `http://localhost:3000/login` to Authorized redirect URIs if your Google consent settings require redirect URIs.
6. Put the client ID in root `.env` as `GOOGLE_CLIENT_ID`.

Docker Compose passes `GOOGLE_CLIENT_ID` to the backend and to the frontend build. The backend verifies the Google ID token before creating or logging in a user. `GOOGLE_CLIENT_SECRET` is available for future OAuth flows, but the current Google button flow only requires backend ID token verification with `GOOGLE_CLIENT_ID`.

For local frontend development outside Docker, create `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

For local backend development outside Docker, create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/customer_support?schema=public
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
REDIS_URL=redis://localhost:6379
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
```

## Reliability Features

### Redis Caching

The backend connects to Redis on startup when `REDIS_URL` is present. If Redis is unavailable, API requests continue to read from PostgreSQL.

Cached keys:

- `analytics:global` for admin analytics, TTL 60 seconds
- `analytics:user:<userId>` for user analytics, TTL 60 seconds
- `tickets:all` for admin ticket lists, TTL 30 seconds
- `tickets:user:<userId>` for user ticket lists, TTL 30 seconds

Ticket creation, status updates, processed events, retry events, and failed/DLQ events invalidate the affected caches. Backend logs include `[Redis] Connected`, `[Redis] Cache hit`, `[Redis] Cache miss`, and `[Redis] Cache invalidated`.

### Email Notifications

The backend uses Nodemailer with these optional SMTP variables:

```env
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
```

If any SMTP value is missing, the backend uses console mode and logs the email content instead of sending it. Ticket submitted, processed, and failed emails include customer name, subject, status, category, priority, and AI response when available.

### Retry Queue And DLQ

Kafka topics:

- `tickets.created`
- `tickets.processed`
- `tickets.retry`
- `tickets.dead-letter`

Failure flow:

```text
Ticket submitted
  -> backend publishes tickets.created
  -> AI service processes ticket
  -> success: AI service publishes tickets.processed
  -> failure: AI service publishes tickets.retry with retryCount and lastError
  -> retry waits 5 seconds before processing again
  -> after retry attempt 3 fails, AI service publishes tickets.dead-letter
  -> backend consumes DLQ, stores FailedTicket, marks Ticket FAILED, emails customer, emits realtime update
```

The `Ticket` table tracks `retryCount`, `lastError`, `processedAt`, and `failedAt`. Permanently failed payloads are stored in `FailedTicket`.

### Dead Letter Queue Admin Page

Admins can open `/admin/dlq` to inspect permanently failed events. The API endpoint is:

```http
GET /api/admin/dlq  ADMIN only
```

The page shows ticket ID, error message, retry count, and created date. Normal users do not see the navigation link and are redirected away from the page.

## Health Checks And Metrics

Backend:

```http
GET /health
GET /metrics
```

`/health` reports backend uptime plus PostgreSQL, Redis, Kafka, and AI service status. `/metrics` reports total tickets, processed tickets, failed tickets, retry count, DLQ count, Redis hit rate, and API response time samples.

AI service:

```http
GET /health
```

Frontend:

```http
GET /health
```

The frontend also has a System Status page at `/status` showing backend, Kafka, Redis, PostgreSQL, AI service, ticket metrics, Redis hit rate, and average API response time.

## Observability

The backend adds request IDs to API responses with the `x-request-id` header. API logs include method, route, status code, response time, and request ID:

```text
[API] GET /api/tickets 200 42ms {"requestId":"..."}
```

Kafka messages include correlation IDs in payloads and headers. Backend consumers and the AI service log processing timings with `[Kafka]` and `[AI]` prefixes. Redis, email, retry, DLQ, Socket.IO, Docker lifecycle, and auth flows use structured prefixes for easier log filtering.

## Security

The backend uses:

- Helmet security headers
- Express rate limiting
- Strict CORS configuration from `CORS_ORIGIN`
- JSON body size limit
- JWT expired-token and invalid-token handling
- Production-safe error responses

Do not commit real `.env`, `k8s/secret.yaml`, private keys, certificates, or cloud credentials. Use `.env.example`, `.env.production.example`, and `k8s/secret.example.yaml` as templates only.

## Kubernetes

Kubernetes manifests live in `k8s/`.

Files:

- `namespace.yaml`
- `configmap.yaml`
- `secret.example.yaml`
- `postgres.yaml`
- `redis.yaml`
- `zookeeper.yaml`
- `kafka.yaml`
- `backend.yaml`
- `ai-service.yaml`
- `frontend.yaml`

Apply locally after building and pushing images:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
cp k8s/secret.example.yaml k8s/secret.yaml
# edit k8s/secret.yaml with real secret values, then:
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/zookeeper.yaml
kubectl apply -f k8s/kafka.yaml
kubectl apply -f k8s/ai-service.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

The manifests use ClusterIP services internally. The frontend service uses LoadBalancer for cloud clusters. Backend and frontend have replica support; PostgreSQL, Redis, Kafka, and Zookeeper are single-replica templates for development and staging. For production, prefer managed RDS, ElastiCache, and MSK.

## CI/CD

GitHub Actions workflow:

```text
.github/workflows/ci-cd.yml
```

The pipeline runs on push and pull request. It installs dependencies, caches npm and Python packages, generates Prisma Client, runs backend and frontend builds, runs lint scripts if present, validates the AI service with Python compile checks, and builds Docker images for backend, frontend, and AI service.

The pipeline fails on TypeScript errors, build failures, Python validation failures, or Docker build failures.

## Scaling

Horizontal scaling:

- Frontend replicas can scale freely behind a LoadBalancer or CDN.
- Backend replicas can scale horizontally because persistent state lives in PostgreSQL, Redis, and Kafka.
- Socket.IO works for one backend instance by default. For many backend replicas in production, add a Socket.IO Redis adapter so websocket events propagate across pods.
- AI service replicas can scale Kafka consumption. Keep consumer group IDs shared so Kafka distributes partitions.
- Kafka throughput scales by increasing topic partitions and broker count.
- PostgreSQL and Redis should use managed production services for backups, failover, and monitoring.

## AWS Deployment Preparation

This repo is prepared for future AWS deployment, but does not deploy automatically.

EC2:

- Install Docker and Docker Compose.
- Copy the repo or deploy built images from a registry.
- Use `.env.production.example` as the template for real environment variables.
- Run `docker compose up -d`.

ECS:

- Build and push images to ECR.
- Convert service definitions from Docker Compose or Kubernetes manifests into ECS task definitions.
- Store secrets in AWS Secrets Manager or SSM Parameter Store.
- Put backend and frontend behind an Application Load Balancer.

RDS PostgreSQL:

- Replace local `postgres` with RDS.
- Set `DATABASE_URL` to the RDS endpoint.
- Enable backups, Multi-AZ for production, and restricted security groups.

ElastiCache Redis:

- Replace local Redis with ElastiCache Redis.
- Set `REDIS_URL` to the ElastiCache endpoint.
- Keep Redis private inside the VPC.

MSK Kafka:

- Replace local Kafka/Zookeeper with Amazon MSK.
- Set `KAFKA_BROKERS` to MSK bootstrap brokers.
- Create topics `tickets.created`, `tickets.processed`, `tickets.retry`, and `tickets.dead-letter`.

S3 frontend hosting:

- Build the frontend with production `VITE_API_URL`, `VITE_SOCKET_URL`, and `VITE_GOOGLE_CLIENT_ID`.
- Upload `frontend/dist` to S3.
- Put CloudFront in front of S3 for HTTPS, caching, and custom domain support.

Production secrets:

- Do not put real secrets in Git.
- Use AWS Secrets Manager, SSM Parameter Store, GitHub Actions secrets, or Kubernetes Secrets.
- Rotate `JWT_SECRET`, SMTP credentials, OpenAI keys, and OAuth credentials when access changes.

## Authentication

The app uses JWT authentication with two roles:

- `USER`: can register, login, submit tickets, and view only their own tickets.
- `ADMIN`: can login, view all tickets, view analytics, and update ticket status.

Default admin credentials are seeded when the backend container starts:

```text
email: admin@example.com
password: Admin@123
```

JWTs expire according to `JWT_EXPIRES_IN` in `docker-compose.yml` (`1d` by default). Passwords are stored as bcrypt hashes; plain text passwords are never stored.

Google accounts are created with provider `GOOGLE` and do not store a password hash. Local accounts keep provider `LOCAL`.

## API Endpoints

### Auth API

Register a user:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password@123"
  }'
```

Login:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123"
  }'
```

Google login:

```http
POST /api/auth/google
```

Request body:

```json
{
  "credential": "<GOOGLE_ID_TOKEN>"
}
```

Forgot password:

```bash
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{ "email": "jane@example.com" }'
```

Reset password:

```bash
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<RESET_TOKEN_FROM_LINK>",
    "newPassword": "NewPassword@123"
  }'
```

Get current user:

```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Tickets

```http
POST /api/tickets              Authorization required
GET /api/tickets               Authorization required
GET /api/tickets/:id           Authorization required
PATCH /api/tickets/:id/status  ADMIN only
```

Create a ticket:

```bash
curl -X POST http://localhost:4000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "subject": "Cannot log in",
    "description": "I am unable to access my account."
  }'
```

Update status as an admin:

```bash
curl -X PATCH http://localhost:4000/api/tickets/<ticket-id>/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{ "status": "FAILED" }'
```

### Analytics

```http
GET /api/analytics/summary  Authorization required
```

Returns total tickets plus grouped counts by status, category, and priority.

### Admin

```http
GET /api/admin/dlq  ADMIN only
```

## Realtime Events

The backend emits Socket.IO events to authenticated sockets. Admins receive all ticket events; users receive only events for their own tickets.

- `ticket:created`
- `ticket:updated`
- `ticket:processed`
- `ticket:failed`
- `ticket:retried`
- `ticket:dlq`
- `analytics:updated`

The dashboard and analytics pages refresh automatically when these events arrive.

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
