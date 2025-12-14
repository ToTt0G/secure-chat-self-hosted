# Secure Chat Self-Hosted

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
┌────────────────────┐      ┌────────────────────┐
│    Next.js App     │      │   Socket Server    │
│    (port 3000)     │      │   (port 3001)      │
│                    │      │                    │
│  - API routes      │      │  - WebSocket conns │
│  - Pages/UI        │      │  - Redis sub       │
│  - Redis publish   │      │  - Broadcasts msgs │
└────────────────────┘      └────────────────────┘
         │                           │
         └───────────┬───────────────┘
                     ▼
               ┌──────────┐
               │  Redis   │
               │ Pub/Sub  │
               └──────────┘
```

*   **Frontend:** `next-app-bun/src/app` (App Router). Uses React Query for data fetching.
*   **Backend API:** `next-app-bun/src/app/api/[[...slugs]]/route.ts`. Elysia app instance exports `GET` and `POST` handlers.
*   **Realtime:** `next-app-bun/socket-server.ts`. Runs as a separate process, relays Redis pub/sub to WebSocket clients.
*   **Infrastructure:** Docker Compose manages Redis, Redis Insight, and the socket server.

## Building and Running

### Prerequisites

*   Docker & Docker Compose
*   Bun (JavaScript runtime & package manager)

### 1. Start Infrastructure

Start the Redis database and Redis Insight:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

*   **Redis:** `localhost:6379`
*   **Redis Insight:** `localhost:5540`

### 2. Run Application

Navigate to the application directory and start both servers:

```bash
cd next-app-bun
bun install

# Terminal 1: Next.js app
bun dev

# Terminal 2: Socket server
bun socket-server.ts
```

*   **Web App:** `http://localhost:3000`
*   **Socket Server:** `ws://localhost:3001`

## Key Files & Directories

| File | Description |
|------|-------------|
| `docker-compose.dev.yml` | Redis and Redis Insight services for development |
| `docker-compose.prod.yml` | Production config with app, socket-server, and Redis |
| `next-app-bun/socket-server.ts` | Entry point for the WebSocket server |
| `next-app-bun/src/lib/realtime.ts` | Typed Realtime class with Zod schema validation |
| `next-app-bun/src/lib/redis.ts` | Redis client configuration |
| `next-app-bun/src/app/api/[[...slugs]]/route.ts` | Main API entry point (Elysia) |
| `next-app-bun/Dockerfile` | Docker image for Next.js app |
| `next-app-bun/Dockerfile.socket` | Docker image for socket server |

## Realtime System

The application uses a custom `Realtime` class that provides:

*   **Type-safe publishing** with Zod schema validation
*   **Room-based messaging** via Socket.IO rooms
*   **Redis pub/sub** for scalability across instances

### Schema Definition

```typescript
// socket-server.ts
const schema = {
    chat: {
        message: z.object({
            id: z.string(),
            sender: z.string().max(20),
            text: z.string().max(1000),
            timestamp: z.number(),
            roomId: z.string(),
        }),
        destroy: z.object({
            roomId: z.string(),
            isDestroyed: z.literal(true),
        }),
    },
};
```

### Publishing Messages

```typescript
// From API route
await realtime.publish("chat", "message", {
    id: nanoid(),
    sender: "Alice",
    text: "Hello!",
    timestamp: Date.now(),
    roomId: "abc123",
}, "abc123"); // roomId for room-specific broadcast
```

## Production Deployment

### Production Architecture

*   **App Container:** Next.js standalone build on port `3000`
*   **Socket Server Container:** WebSocket server on port `3001`
*   **Redis Container:** Internal network only (secure)
*   **Network:** All services on `app_network` bridge

### Deploying

1.  **Configure Environment:**
    Edit `docker-compose.prod.yml` to set your production domain:
    ```yaml
    socket-server:
      environment:
        - CORS_ORIGIN=https://yourdomain.com
    ```

2.  **Build and Run:**
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --build
    ```

    This starts:
    *   Next.js app on port `3000`
    *   Socket server on port `3001`
    *   Redis (internal only)

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
