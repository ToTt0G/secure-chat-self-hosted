import Elysia from "elysia";
import redis from "@/lib/redis";

class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AuthError";
    }
}

export const authMiddleware = new Elysia({ name: "auth" }).error({ AuthError }
).onError(({ code, set }) => {
    if (code === "AuthError") {
        set.status = 401;
        return {
            error: "Unauthorized"
        }
    }
}).derive({ as: "scoped" }, async ({ query, cookie }) => {
    const roomId = query.roomId as string | undefined;
    const token = cookie["x-auth-token"]?.value as string | undefined;

    if (!roomId || !token) {
        throw new AuthError("Missing roomId or token");
    }

    const connectedRaw = await redis?.hget(`meta:${roomId}`, "connected");
    const connected = connectedRaw ? JSON.parse(connectedRaw) as string[] : [];

    if (!connected?.includes(token)) {
        throw new AuthError("Invalid token");
    }

    return { auth: { roomId, token, connected } }
})