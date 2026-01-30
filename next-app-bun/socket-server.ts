// socket-server.ts
import { Realtime, getRedisUrl } from "./src/lib/realtime";
import { chatSchema, ChatMessageEvent, ChatDestroyEvent, ChatSchema } from "./src/lib/chat-schema";
import redis from "./src/lib/redis";

// --- Initialize Realtime Server ---
export const realtime = new Realtime({
    schema: chatSchema,
    redisUrl: getRedisUrl(),
    port: parseInt(process.env.SOCKET_PORT || "3001", 10),
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
    onLeaveRoom: async (socket, roomId) => {
        const cookieHeader = socket.handshake.headers.cookie;
        if (!cookieHeader) return;

        const match = cookieHeader.match(/x-auth-token=([^;]+)/);
        const token = match ? match[1] : null;

        if (token) {
            const key = `meta:${roomId}`;
            const connectedRaw = await redis.hget(key, "connected");
            if (connectedRaw) {
                try {
                    const connected = JSON.parse(connectedRaw) as string[];
                    const newConnected = connected.filter((t) => t !== token);
                    if (newConnected.length !== connected.length) {
                        await redis.hset(key, { connected: JSON.stringify(newConnected) });
                        console.log(`Removed a user from room ${roomId}`);
                    }
                } catch (e) {
                    console.error(`Failed to update connected list for room ${roomId}`, e);
                }
            }
        }
    }
});

// --- Graceful Shutdown ---
process.on("SIGTERM", () => realtime.shutdown());
process.on("SIGINT", () => realtime.shutdown());

// --- Re-export types for convenience ---
export type { ChatMessageEvent, ChatDestroyEvent, ChatSchema };