// socket-server.ts
import { z } from "zod";
import { Realtime, getRedisUrl } from "./src/lib/realtime";

// --- Schema Definition ---
// Define all your realtime events with Zod validation
const schema = {
    chat: {
        message: z.object({
            id: z.string(),
            sender: z.string().max(20),
            text: z.string().max(1000),
            timestamp: z.number(),
            roomId: z.string(),
            token: z.string().optional(),
        }),
        destroy: z.object({
            roomId: z.string(),
            isDestroyed: z.literal(true),
        }),
    },
};

// --- Initialize Realtime Server ---
export const realtime = new Realtime({
    schema,
    redisUrl: getRedisUrl(),
    port: parseInt(process.env.SOCKET_PORT || "3001", 10),
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
});

// --- Graceful Shutdown ---
process.on("SIGTERM", () => realtime.shutdown());
process.on("SIGINT", () => realtime.shutdown());

// --- Export schema types for client-side use ---
export type ChatMessageEvent = z.infer<typeof schema.chat.message>;
export type ChatDestroyEvent = z.infer<typeof schema.chat.destroy>;
export type RealtimeSchema = typeof schema;