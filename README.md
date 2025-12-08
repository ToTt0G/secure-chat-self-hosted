# Secure Chat Self-Hosted

## Project Overview

This is a self-hosted secure chat application built with **Next.js**, **ElysiaJS**, and **Redis**.

*   **Framework:** Next.js 16 (React 19)
*   **API Layer:** ElysiaJS running within Next.js API routes (Edge-compatible pattern).
*   **Database:** Redis (managed via Docker Compose).
*   **Styling:** Tailwind CSS v4.
*   **Package Manager:** Bun (implied by `next-app-bun` directory and `bun.lock`).

## Architecture

The application uses a hybrid architecture where ElysiaJS defines the API routes and logic, but runs inside the Next.js `app/api/[[...slugs]]/route.ts` handler.

*   **Frontend:** `next-app-bun/src/app` (App Router). Uses React Query for data fetching.
*   **Backend:** `next-app-bun/src/app/api/[[...slugs]]/route.ts`. Elysia app instance exports `GET` and `POST` handlers for Next.js.
*   **Infrastructure:** Docker Compose manages the Redis instance and Redis Insight (GUI).

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

Navigate to the application directory and start the dev server:

```bash
cd next-app-bun
bun install
bun dev
```

The application will be available at `http://localhost:3000`.

## Key Files & Directories

*   `docker-compose.dev.yml`: Defines Redis and Redis Insight services.
*   `next-app-bun/src/app/api/[[...slugs]]/route.ts`: The main API entry point. Defines the Elysia application and routes (e.g., `/api/room/create`).
*   `next-app-bun/src/lib/redis.ts`: Redis client configuration. Note: It defaults to `redis://server.local:6379` in development if `REDIS_URL` is not set.
*   `next-app-bun/src/lib/client.ts`: (Likely) The type-safe frontend client for Elysia (Eden).

## Development Conventions

*   **API Logic:** All backend logic should be defined within the Elysia app structure in `src/app/api`.
*   **Type Safety:** Uses Elysia's `Eden` for end-to-end type safety between backend and frontend.
*   **Components:** UI components are located in `src/components/ui` (likely shadcn/ui).
