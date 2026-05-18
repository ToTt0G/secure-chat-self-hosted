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

### Step-by-Step Coolify Setup (v4)

**1. Connect Your Repository:**
* Navigate to your Coolify dashboard and select your Project and Environment (e.g., Production).
* Click **+ Add New Resource**.
* Under the **Git Based** section, select **Public Repository** (or Private if applicable).
* Paste your repository URL or select it from your GitHub App integration, then click **Continue**.

**2. Select the Build Pack (Crucial Step):**
* Select the branch you want to deploy (e.g., `main`).
* Coolify will attempt to auto-detect the project type. **You must change the Build Pack dropdown to "Docker Compose".**
* Set the **Docker Compose Location** to `docker-compose.prod.yml`.
* Click **Continue**.

**3. Configure Domains (Initial Prompt):**
* After clicking Continue, Coolify will parse your compose file and prompt you to enter domains for the exposed services.
* **`app` service:** Enter your primary production domain (e.g., `https://secure-chat.redsunsetfarm.com`).
* **`socket-server` service:** Leave this domain field **completely blank** (or delete it if auto-filled). Next.js proxies the WebSocket traffic internally, so the socket server must not be exposed directly to the public internet.

**4. Configure Preview Environments (PR Previews):**
* Because of the "Multiple containers found" error in Coolify v4, **do not use a Pre-deployment command** for Docker Compose.
* Instead, we have consolidated the configurations into `docker-compose.prod.yml`. It now natively supports PR previews using Coolify's automatic variables (like `$COOLIFY_PULL_REQUEST_NUMBER`).
* Simply go to the **Advanced** tab of your resource and check **Enable PR Previews**.
* To make sure the ephemeral environments don't overwrite production data, go to the **Environment Variables** tab in Coolify, add these new variables, and **only check the "Available at Runtime" and "Preview" boxes** (do not apply them to Production):
  * `IMAGE_TAG`: `pr-${COOLIFY_PULL_REQUEST_NUMBER}`
  * `REDIS_VOLUME_PATH`: `/mnt/data/secure_chat_redis_pr_${COOLIFY_PULL_REQUEST_NUMBER}`

**5. Configure Environment Variables:**
* Go to the **Environment Variables** tab and add the following:
  * `REDIS_VOLUME_PATH`: `/mnt/data/secure_chat_redis`
  * `CORS_ORIGIN`: `https://secure-chat.redsunsetfarm.com` (Your production domain).
  * `NEXT_PUBLIC_SOCKET_URL`: (Leave this entirely blank).
* *Note on Previews:* If you ever add secrets (like API keys) that need to be available in PR previews, ensure you check the **"Available at Runtime"** and **"Preview"** checkboxes next to those variables in the Coolify UI.

**6. Enable Automated Deployments:**
* Go to the **Advanced** tab of your resource and **uncheck "Automatic Deployments"**.
  * *Why:* We want GitHub Actions to control the timing. If this is on, Coolify will deploy as soon as it sees a commit, which will fail because the Docker images haven't finished building yet.
* Go to the **Webhooks** tab in Coolify and copy the **Deploy Webhook URL**.
* **Generate an API Token:**
  * In Coolify, go to **Keys & Tokens > API tokens**.
  * Create a new token and copy it.
* **Add Secrets to GitHub:**
  * In your GitHub repository on github.com, navigate to **Settings > Secrets and variables > Actions**.
  * Create a new repository secret named `COOLIFY_WEBHOOK` and paste the URL.
  * Create another repository secret named `COOLIFY_TOKEN` and paste your API token.
* This allows GitHub Actions to securely authenticate and trigger the deployment ONLY after the images are successfully built and pushed to GHCR.

### Automated Builds & Integration

*   **GitHub Actions:** Whenever code is pushed to the `main` branch or a PR is created, GitHub Actions automatically builds the Next.js `app` and WebSocket `socket-server` and pushes the immutable images to the GitHub Container Registry (`ghcr.io`).
*   **Production:** When the `main` branch build finishes, the GitHub Action triggers the Coolify Webhook. Coolify automatically pulls the `latest` image tags and deploys them using `docker-compose.prod.yml`.
*   **PR Previews:** Coolify automatically provisions ephemeral preview environments by injecting variables into the same `docker-compose.prod.yml` file, safely isolating data by appending the PR number to volume paths.

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