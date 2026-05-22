# Secure Chat Self-Hosted

🚀 **Live Working Demo:** [secure-chat.ezryder.us](https://secure-chat.ezryder.us)

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
┌───────────────────────────────────────┐
│           Cloudflare Tunnel           │
│             (*.ezryder.us)            │
│                       │               │
└───────────────────────┼───────────────┘
                        │
                 (Dokploy Proxy)
        ┌───────────────┴───────────────┐
        │                               │
(secure-chat...)              (secure-chat-sockets...)
        ▼                               ▼
┌────────────┐                   ┌─────────────┐
│ Next.js App│                   │Socket Server│
│ (port 3000)│                   │ (port 3001) │
└─────┬──────┘                   └──────┬──────┘
      │                                 │
      └───────────────┬─────────────────┘
                      ▼
                ┌───────────┐
                │   Redis   │
                │  Pub/Sub  │
                └───────────┘
```

| Pillar | Development | Production (Dokploy) |
| :--- | :--- | :--- |
| **Code** | Next.js Dev Server / Bun | Image built via GH Actions to GHCR |
| **Data** | Ephemeral / Local memory | Mapped to `/mnt/data/secure-chat/redis` |
| **Secrets** | `.env` (Local) | Dokploy UI / GH Actions Secrets |

---

## Getting Started (Local Development)

For local development and testing:

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env with your local settings if needed
```

### 2. Start Infrastructure

Start the local Redis server:
```bash
docker compose up -d redis
```

### 3. Run Application

Start the Next.js dev server and Socket.IO server:
```bash
cd next-app-bun
bun install
bun dev
```

The application will be available at `http://localhost:3000`.

---

## Production Deployment (Dokploy)

This project uses an automated deployment pipeline via GitHub Actions to build and push Docker images to the GitHub Container Registry (GHCR), which are then pulled by the basement server managed via Dokploy.

### Step-by-Step Dokploy Instructions

**1. Create a Compose Application on Dokploy:**
* In your Dokploy dashboard, click **Create Application / Service** and select **Compose**.
* Give the service a concise name (e.g., `secure-chat`).
* In the configuration area, paste the `docker-compose.yml` template (see below).

**2. Configure Domains and Routing:**
* Dokploy's Traefik handles the ports automatically. Do not assign external ports in the Compose file.
* Select the **app** service and add your primary domain (e.g., `https://secure-chat.ezryder.us`). Set the container port to `3000`.
* Select the **socket-server** service and add the dedicated subdomain (e.g., `https://secure-chat-sockets.ezryder.us`). Set the container port to `3001`.
  * *Why:* Dedicated subdomain routing prevents WebSocket handshake/upgrade issues through the proxy.

**3. Configure GitHub Webhook Deployments:**
* In the **General** settings of your Dokploy Compose service, find the **Redeploy Webhook URL**.
* Copy this URL.
* Navigate to your GitHub repository **Settings > Secrets and variables > Actions**.
* Add a new repository secret:
  * Name: `DOKPLOY_WEBHOOK`
  * Value: (Paste the Redeploy Webhook URL)
* Now, whenever code is pushed to the `main` branch, GitHub Actions will build and push the updated images to GHCR, then ping Dokploy to pull the latest images and redeploy.

---

### Example Docker Compose Template

Below is the production `docker-compose.yml` configuration (which is excluded from Git to protect secrets/domains):

```yaml
version: "3.8"

services:
  app:
    container_name: secure-chat-app
    image: ghcr.io/your-github-username/secure-chat-self-hosted-app:latest
    pull_policy: always
    restart: unless-stopped
    environment:
      - REDIS_URL=redis://secure-chat-redis:6379
      - NODE_ENV=production
      - NEXT_PUBLIC_SOCKET_URL= # Left empty to trigger client-side subdomain fallback
    depends_on:
      - redis

  socket-server:
    container_name: secure-chat-socket
    image: ghcr.io/your-github-username/secure-chat-self-hosted-socket:latest
    pull_policy: always
    restart: unless-stopped
    environment:
      - REDIS_URL=redis://secure-chat-redis:6379
      - SOCKET_PORT=3001
      - CORS_ORIGIN=https://secure-chat.yourdomain.com
      - NODE_ENV=production
    depends_on:
      - redis

  redis:
    container_name: secure-chat-redis
    image: redis:alpine
    restart: unless-stopped
    volumes:
      - /mnt/data/secure-chat/redis:/data
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `SOCKET_PORT` | `3001` | Socket server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin for WebSocket |
| `NODE_ENV` | `development` | Environment mode |
| `NEXT_PUBLIC_SOCKET_URL` | (empty) | Socket URL. Leave empty to use dynamic client-side fallback. |

## Development Conventions

*   **API Logic:** All backend logic is in Elysia app structure in `src/app/api`.
*   **Realtime Events:** Defined in `socket-server.ts` schema, using the `Realtime` class.
*   **Type Safety:** Uses Elysia's `Eden` for API and Zod for realtime events.
*   **Components:** UI components in `src/components/ui` (shadcn/ui).
*   **Frontend:** Next.js App Router (React Query for data fetching).