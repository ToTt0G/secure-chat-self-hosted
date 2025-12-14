// socket-server.ts
import { Realtime, getRedisUrl } from "./src/lib/realtime";
import { chatSchema, ChatMessageEvent, ChatDestroyEvent, ChatSchema } from "./src/lib/chat-schema";

// --- Initialize Realtime Server ---
export const realtime = new Realtime({
    schema: chatSchema,
    redisUrl: getRedisUrl(),
    port: parseInt(process.env.SOCKET_PORT || "3001", 10),
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
});

// --- Graceful Shutdown ---
process.on("SIGTERM", () => realtime.shutdown());
process.on("SIGINT", () => realtime.shutdown());

// --- Re-export types for convenience ---
export type { ChatMessageEvent, ChatDestroyEvent, ChatSchema };