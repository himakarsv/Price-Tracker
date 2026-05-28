# 🏷️ Price Tracker

A production-grade, full-stack price tracking application that monitors product prices across major Indian e-commerce platforms — Amazon, Flipkart, and Myntra — and sends automated email alerts when prices drop to your target.

---

## 📸 Overview

Users paste a product URL and set a desired price. Background cron jobs scrape live prices every 6 hours. When a price hits the target, an email alert is triggered automatically. Built with scalability, security, and clean architecture in mind.

---

## ⚙️ Tech Stack

| Layer                | Technology                                            |
| -------------------- | ----------------------------------------------------- |
| **Frontend**         | Angular 21 (Standalone Components)                    |
| **Backend**          | NestJS (TypeScript, Modular Architecture)             |
| **Database**         | MongoDB with Mongoose ODM                             |
| **Cache**            | Redis via `@nestjs/cache-manager`                     |
| **Job Queue**        | Bull (Redis-backed)                                   |
| **Scraping**         | Puppeteer + `puppeteer-extra-plugin-stealth`          |
| **Authentication**   | JWT (Access + Refresh Token Rotation) + Google OAuth2 |
| **Email**            | Nodemailer + Handlebars Templates                     |
| **Reverse Proxy**    | Nginx (rate limiting, gzip, static assets)            |
| **Containerization** | Docker + Docker Compose (5 services)                  |
| **Scheduler**        | `@nestjs/schedule` (cron jobs)                        |

---

## ✨ Features

- 🔍 **Multi-platform scraping** — Amazon, Flipkart, Myntra, and generic sites via structured data (JSON-LD)
- 🔔 **Automated email alerts** — triggered the moment a price hits your target
- ⏱️ **Scheduled scraping** — cron jobs run every 6 hours across all tracked products
- 📊 **Price history chart** — visual price trend over time per product
- 🔐 **JWT authentication** — access token (15m) + httpOnly refresh token (7d) with rotation
- 🔑 **Google OAuth2** — one-click login and automatic account creation
- ⚡ **Redis caching** — all product read endpoints cached with key-based invalidation on writes
- 🐂 **Bull queue** — safe concurrent scraping with 2 parallel Puppeteer instances, zero job loss on crash
- 🐳 **Fully dockerized** — single `docker compose up --build` to run the entire stack
- 🛡️ **Production security** — Helmet.js, CORS, rate limiting (Nginx + NestJS Throttler), input validation

---

## 🏗️ Architecture

```
Browser
   │
   ▼
Nginx (Port 80)
   ├── /          → Angular Frontend (static)
   └── /api/*     → NestJS Backend (Port 3000)
                        ├── MongoDB (data persistence)
                        ├── Redis  (cache + Bull job store)
                        └── Bull Queue
                               └── Puppeteer Workers (concurrency: 2)
                                      └── Nodemailer (price alerts)
```

### How the queue works

```
Cron fires every 6h
  → Fetches all active products from MongoDB
  → Enqueues each as a Bull job into Redis (instant)
  → Consumer picks up 2 jobs at a time
      → Puppeteer scrapes the URL
      → Updates price + history in MongoDB
      → If currentPrice ≤ desiredPrice → sends email alert
      → Resets alert flag when price rises again
```

---

## 📁 Project Structure

```
price-tracker/
├── backend/                  # NestJS application
│   └── src/
│       ├── config/           # Environment configuration
│       ├── common/           # Guards, filters, pipes, decorators
│       └── modules/
│           ├── auth/         # JWT + Google OAuth2
│           ├── users/        # User schema + service
│           ├── products/     # CRUD + Redis caching
│           ├── scraper/      # Puppeteer scrapers per platform
│           ├── queue/        # Bull producer + consumer
│           ├── scheduler/    # Cron jobs
│           └── notifications/# Nodemailer + email templates
├── frontend/                 # Angular 21 application
│   └── src/app/
│       ├── core/             # Services, guards, interceptors, models
│       ├── features/         # Auth, Dashboard, Products pages
│       └── shared/           # Navbar, loader, pipes
├── nginx/
│   └── nginx.conf            # Reverse proxy configuration
├── docker-compose.yml        # Orchestrates all 5 services
└── .env.example              # Environment variable template
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose v2+
- [Node.js](https://nodejs.org/) 20+
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for SMTP
- A [Google Cloud](https://console.cloud.google.com/) project with OAuth2 credentials

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/price-tracker.git
cd price-tracker
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in all required values (see [Environment Variables](#environment-variables) below).

### 3. Run with Docker

```bash
docker compose up --build
```

This starts 5 containers: MongoDB, Redis, NestJS backend, Angular frontend, and Nginx.

Open [http://localhost](http://localhost) in your browser.

### Running in Development Mode (without Docker)

**Terminal 1 — Start MongoDB and Redis:**

```bash
docker compose up mongo redis -d
```

**Terminal 2 — Start NestJS backend:**

```bash
cd backend
npm install
npm run start:dev
```

**Terminal 3 — Start Angular frontend:**

```bash
cd frontend
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200)

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in the values below.

| Variable               | Description                                | Example                                     |
| ---------------------- | ------------------------------------------ | ------------------------------------------- |
| `NODE_ENV`             | Environment mode                           | `development`                               |
| `PORT`                 | NestJS server port                         | `3000`                                      |
| `MONGODB_URI`          | MongoDB connection string                  | `mongodb://mongo:27017/pricetracker`        |
| `REDIS_HOST`           | Redis hostname                             | `redis`                                     |
| `REDIS_PORT`           | Redis port                                 | `6379`                                      |
| `JWT_ACCESS_SECRET`    | Secret for access tokens (64 byte hex)     | —                                           |
| `JWT_REFRESH_SECRET`   | Secret for refresh tokens (64 byte hex)    | —                                           |
| `JWT_ACCESS_EXPIRY`    | Access token expiry                        | `15m`                                       |
| `JWT_REFRESH_EXPIRY`   | Refresh token expiry                       | `7d`                                        |
| `GOOGLE_CLIENT_ID`     | Google OAuth2 Client ID                    | —                                           |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 Client Secret                | —                                           |
| `GOOGLE_CALLBACK_URL`  | OAuth2 redirect URI                        | `http://localhost/api/auth/google/callback` |
| `SMTP_HOST`            | SMTP server host                           | `smtp.gmail.com`                            |
| `SMTP_PORT`            | SMTP port                                  | `587`                                       |
| `SMTP_USER`            | Gmail address                              | `you@gmail.com`                             |
| `SMTP_PASS`            | Gmail App Password                         | —                                           |
| `EMAIL_FROM`           | Sender display name                        | `Price Tracker <you@gmail.com>`             |
| `FRONTEND_URL`         | Frontend base URL (for CORS + email links) | `http://localhost`                          |

**Generate strong JWT secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📡 API Endpoints

### Auth

| Method | Endpoint                    | Description                              |
| ------ | --------------------------- | ---------------------------------------- |
| POST   | `/api/auth/register`        | Register with email + password           |
| POST   | `/api/auth/login`           | Login, returns access token              |
| POST   | `/api/auth/refresh`         | Refresh access token via httpOnly cookie |
| POST   | `/api/auth/logout`          | Logout and clear refresh token           |
| GET    | `/api/auth/google`          | Initiate Google OAuth2 flow              |
| GET    | `/api/auth/google/callback` | Google OAuth2 callback                   |
| GET    | `/api/auth/me`              | Get current authenticated user           |

### Products (all require JWT)

| Method | Endpoint                    | Description                           |
| ------ | --------------------------- | ------------------------------------- |
| GET    | `/api/products`             | Get all tracked products (cached)     |
| POST   | `/api/products`             | Add a new product to track            |
| PATCH  | `/api/products/:id`         | Update desired price or active status |
| DELETE | `/api/products/:id`         | Remove product from tracking          |
| GET    | `/api/products/:id/history` | Get full price history                |
| POST   | `/api/products/:id/refresh` | Manually trigger a price check        |

### Health

| Method | Endpoint      | Description          |
| ------ | ------------- | -------------------- |
| GET    | `/api/health` | Service health check |

---

## 🔒 Security

- Passwords hashed with **bcryptjs** (10 salt rounds)
- Refresh tokens stored as **bcrypt hashes** in MongoDB
- Refresh token delivered via **httpOnly, SameSite=Strict cookie** (not accessible to JS)
- **Helmet.js** sets secure HTTP headers on every response
- **CORS** restricted to `FRONTEND_URL` only
- **Rate limiting** at two layers: Nginx (100 req/min per IP) and NestJS Throttler (10 req/min on auth routes)
- All inputs validated via `class-validator` DTOs with `whitelist: true`
- Puppeteer URLs sanitized before scraping (must be valid http/https)

---

## 🐳 Docker Services

| Service    | Image             | Role                                   |
| ---------- | ----------------- | -------------------------------------- |
| `nginx`    | `nginx:alpine`    | Reverse proxy, exposes port 80         |
| `frontend` | Multi-stage build | Angular static files served via Nginx  |
| `backend`  | Multi-stage build | NestJS API with Chromium for Puppeteer |
| `mongo`    | `mongo:7`         | Primary database                       |
| `redis`    | `redis:7-alpine`  | Cache + Bull job queue storage         |

---

## 📄 License

MIT
