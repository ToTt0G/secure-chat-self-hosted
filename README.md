# Secure Chat Self-Hosted

🚀 **Live Working Demo:** [secure-chat.redsunsetfarm.com](https://secure-chat.redsunsetfarm.com)

## Project Overview

This is a self-hosted secure chat application built with **Next.js**, **ElysiaJS**, **Socket.IO**, and **Redis**.

*   **Framework:** Next.js 16 (React 19)
*   **API Layer:** ElysiaJS running within Next.js API routes.
*   **Realtime:** Socket.IO with Redis pub/sub for WebSocket connections.
*   **Database:** Redis (managed via Docker Compose).
*   **Styling:** Tailwind CSS v4.
*   **Package Manager:** Bun (implied by `next-app-bun` directory and `bun.lock`).

## Features

*   **Secure & Ephemeral:** Messages are transient and rooms can be self-destructed instantly.
*   **Real-time:** Instant message delivery via WebSocket (Socket.IO).
*   **Incognito Support:** User identity is session-based (localStorage), functioning perfectly in incognito tabs.
*   **Zero Logs:** No persistent message storage in a traditional database (Redis is used for pub/sub).
*   **Modern UI:** Built with Tailwind CSS v4 and shadcn/ui.

## Architecture

```
┌─────────────────────────────┐
│      Cloudflare Tunnel      │
│      (*.redsunsetfarm.com)  │
└──────────────┬──────────────┘
               │
               ▼ (All Traffic)
┌─────────────────────────────┐
│ Next.js App (port 3000)     │
│   - Renders UI / API        │
│   - Proxies /socket.io  ────┼─┐
└──────────────┬──────────────┘ │
               │                │ (Internal Network)
               │                ▼
               │         ┌─────────────┐
               │         │Socket Server│
               │         │ (port 3001) │
               │         └──────┬──────┘
               │                │
               ▼                ▼
         ┌────────────────────────┐
         │     Redis Pub/Sub      │
         └────────────────────────┘
```

| Pillar | Development | Production (Track A - Coolify) |
| :--- | :--- | :--- |
| **Code** | Bind Mount (`./:/app`) | Image built via GH Actions to GHCR |
| **Data** | Docker Volume (Ephemeral) | UI Mapped to `/mnt/data/secure_chat_redis` (SSD) |
| **Secrets** | `.env` (Local) | Coolify UI |

---

## Getting Started (Local Development)

For local development and testing.

### 1. Clone the Repository

```bash
git clone https://github.com/ToTt0G/secure-chat-self-hosted.git
cd secure-chat-self-hosted
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your local settings if needed
```

### 3. Start the Application

Run the entire stack (App, Socket Server, Redis) with Docker Compose:

```bash
docker compose up
```

The app will be available at `http://localhost:3000`.

---

## Production Deployment (Coolify)

This project uses an automated deployment pipeline via GitHub Actions and Coolify (Track A).

### Step-by-Step Coolify Setup

**1. Create the Project in Coolify:**
* Navigate to your Coolify dashboard and create a new Project and Environment.
* Add a new resource: Select **Docker Compose** (from Git repository).
* Connect your GitHub repository.

**2. Configure the Compose File:**
* In the resource settings, ensure the **Docker Compose File** path is set to `docker-compose.prod.yml`.
* Set the **Docker Compose Preview File** path to `docker-compose.preview.yml`.

**3. Configure Domains:**
* Navigate to the **Webhooks** or **Domains** section of the `app` container in the Coolify UI.
* Set the primary domain (e.g., `https://secure-chat.redsunsetfarm.com`).

**4. Environment Variables:**
* In the Coolify UI, navigate to the **Environment Variables** tab for your Docker Compose resource.
* Add the following variables:
  * `CORS_ORIGIN`: `https://secure-chat.redsunsetfarm.com` (Your production domain).
  * `NEXT_PUBLIC_SOCKET_URL`: (Leave this empty/blank).

**5. GitHub Actions Webhook:**
* Go to the **Webhooks** tab in Coolify and copy the Deploy Webhook URL.
* In your GitHub repository settings, navigate to **Secrets and variables > Actions**.
* Create a new repository secret named `COOLIFY_WEBHOOK` and paste the URL.

### Automated Builds & Integration

*   **GitHub Actions:** Whenever code is pushed to the `main` branch or a PR is created, GitHub Actions automatically builds the Next.js `app` and WebSocket `socket-server` and pushes the immutable images to the GitHub Container Registry (`ghcr.io`).
*   **Production:** When the `main` branch build finishes, the GitHub Action triggers the Coolify Webhook. Coolify automatically pulls the `latest` image tags and deploys them using `docker-compose.prod.yml`.
*   **PR Previews:** Coolify automatically provisions ephemeral preview environments using `docker-compose.preview.yml` and the dynamic `pr-number` image tags.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `SOCKET_PORT` | `3001` | Socket server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin for WebSocket |
| `NODE_ENV` | `development` | Environment mode |
| `NEXT_PUBLIC_SOCKET_URL` | (empty) | Socket URL. Leave empty to use Next.js proxying. |

## Development Conventions

*   **API Logic:** All backend logic in Elysia app structure in `src/app/api`.
*   **Realtime Events:** Define in `socket-server.ts` schema, use `Realtime` class to publish.
*   **Type Safety:** Uses Elysia's `Eden` for API and Zod for realtime events.
*   **Components:** UI components in `src/components/ui` (shadcn/ui).
*   **Frontend:** `next-app-bun/src/app` (App Router). Uses React Query for data fetching.
*   **Backend API:** `next-app-bun/src/app/api/[[...slugs]]/route.ts`. Elysia app instance exports `GET` and `POST` handlers.
*   **Realtime:** `next-app-bun/socket-server.ts`. Runs as a separate process, relays Redis pub/sub to WebSocket clients.
*   **Infrastructure:** Docker Compose manages the services. Next.js proxies WebSocket traffic to avoid complex Ingress rules.