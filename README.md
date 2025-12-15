# Secure Chat Self-Hosted

🚀 **Live Working Demo:** [secure-chat.redsunsetfarm.com](https://secure-chat.redsunsetfarm.com)

## Project Overview

This is a self-hosted secure chat application built with **Next.js**, **ElysiaJS**, **Socket.IO**, and **Redis**.

*   **Framework:** Next.js 16 (React 19)
*   **API Layer:** ElysiaJS running within Next.js API routes (Edge-compatible pattern).
*   **Realtime:** Socket.IO with Redis pub/sub for WebSocket connections.
*   **Database:** Redis (managed via Docker Compose).
*   **Styling:** Tailwind CSS v4.
*   **Package Manager:** Bun (implied by `next-app-bun` directory and `bun.lock`).

## Architecture

```
┌─────────────────────────────┐
│      Cloudflare Tunnel      │
│      (Ingress Rules)        │
└──────────────┬──────────────┘
               │
      ┌────────┴────────┐
      ▼ /               ▼ /socket.io
┌────────────┐    ┌─────────────┐
│ Next.js App│    │Socket Server│
│ (port 3000)│    │ (port 3001) │
└─────┬──────┘    └──────┬──────┘
      │                  │
      └────────┬─────────┘
               ▼
         ┌──────────┐
         │  Redis   │
         │ Pub/Sub  │
         └──────────┘
```

## Features

*   **Secure & Ephemeral:** Messages are transient and rooms can be self-destructed instantly.
*   **Real-time:** Instant message delivery via WebSocket (Socket.IO).
*   **Incognito Support:** User identity is session-based (localStorage), functioning perfectly in incognito tabs.
*   **Zero Logs:** No persistent message storage in a traditional database (Redis is used for pub/sub).
*   **Modern UI:** Built with Tailwind CSS v4 and shadcn/ui.

*   **Frontend:** `next-app-bun/src/app` (App Router). Uses React Query for data fetching.
*   **Backend API:** `next-app-bun/src/app/api/[[...slugs]]/route.ts`. Elysia app instance exports `GET` and `POST` handlers.
*   **Realtime:** `next-app-bun/socket-server.ts`. Runs as a separate process, relays Redis pub/sub to WebSocket clients.
*   **Infrastructure:** Docker Compose manages the services. Cloudflare Tunnel handles ingress routing and SSL.

// ... (skipping Building and Running section)

## Production Deployment

### Production Architecture

*   **App Container:** Next.js standalone build on port `3000`
*   **Socket Server Container:** WebSocket server on port `3001`
*   **Redis Container:** Internal network only (secure)
*   **Network:** All services on `app_network` bridge

### Tunnel Configuration (Critical)

For the application to function correctly in production, you must configure your **Cloudflare Tunnel (Ingress)** to route traffic based on path. This bypasses Next.js for WebSocket connections, ensuring stability.

**Ingress Rules (in order):**

1.  **Hostname:** `your-domain.com`
    *   **Path:** `/socket.io*`
    *   **Service:** `http://localhost:3001` (Direct to Socket Server)
2.  **Hostname:** `your-domain.com`
    *   **Path:** (empty/catch-all)
    *   **Service:** `http://localhost:3000` (Main App)

### Deploying

1.  **Configure Environment:**
    Edit `docker-compose.prod.yml` to set your production domain:
    ```yaml
    socket-server:
      environment:
        - CORS_ORIGIN=https://your-domain.com
    ```

2.  **Build and Run:**
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --build
    ```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://server.local:6379` | Redis connection URL |
| `SOCKET_PORT` | `3001` | Socket server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin for WebSocket |
| `NODE_ENV` | `development` | Environment mode |

## Development Conventions

*   **API Logic:** All backend logic in Elysia app structure in `src/app/api`.
*   **Realtime Events:** Define in `socket-server.ts` schema, use `Realtime` class to publish.
*   **Type Safety:** Uses Elysia's `Eden` for API and Zod for realtime events.
*   **Components:** UI components in `src/components/ui` (shadcn/ui).
