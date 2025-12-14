// lib/realtime.ts
import { Server, Socket } from "socket.io";
import Redis from "ioredis";
import { z, ZodObject, ZodRawShape } from "zod";

// --- Types ---
type SchemaDefinition = Record<string, Record<string, ZodObject<ZodRawShape>>>;

type ChannelName<T extends SchemaDefinition> = keyof T & string;
type EventName<T extends SchemaDefinition, C extends ChannelName<T>> = keyof T[C] & string;
type EventData<
    T extends SchemaDefinition,
    C extends ChannelName<T>,
    E extends EventName<T, C>
> = z.infer<T[C][E]>;

export interface RealtimeOptions<T extends SchemaDefinition> {
    schema: T;
    redisUrl: string;
    port?: number;
    corsOrigin?: string;
}

// --- Realtime Class ---
export class Realtime<T extends SchemaDefinition> {
    private io: Server;
    private redisPub: Redis;
    private redisSub: Redis;
    private schema: T;
    private subscribedChannels: Set<string> = new Set();

    constructor(opts: RealtimeOptions<T>) {
        this.schema = opts.schema;

        const port = opts.port || 3001;
        const corsOrigin = opts.corsOrigin || "http://localhost:3000";

        // Initialize Socket.IO server
        this.io = new Server(port, {
            cors: {
                origin: corsOrigin,
                methods: ["GET", "POST"],
            },
        });

        // Initialize Redis connections (separate for pub/sub)
        this.redisPub = new Redis(opts.redisUrl);
        this.redisSub = new Redis(opts.redisUrl);

        this.setupRedisListeners();
        this.setupSocketListeners();

        console.log(`Realtime server running on port ${port}`);
        console.log(`CORS origin: ${corsOrigin}`);
    }

    // --- Public API ---

    /**
     * Publish a validated message to a channel/event
     */
    async publish<C extends ChannelName<T>, E extends EventName<T, C>>(
        channel: C,
        event: E,
        data: EventData<T, C, E>,
        roomId?: string
    ): Promise<void> {
        // Validate data against schema
        const validator = this.schema[channel]?.[event];
        if (!validator) {
            throw new Error(`Unknown channel/event: ${channel}/${event}`);
        }

        const validated = validator.parse(data);

        const redisChannel = roomId ? `room:${roomId}:${channel}:${event}` : `${channel}:${event}`;
        await this.redisPub.publish(redisChannel, JSON.stringify(validated));
    }

    /**
     * Subscribe a socket to a room
     */
    joinRoom(socket: Socket, roomId: string): void {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room: ${roomId}`);

        // Subscribe to all room-specific channels for this room
        for (const channel of Object.keys(this.schema)) {
            for (const event of Object.keys(this.schema[channel])) {
                const redisChannel = `room:${roomId}:${channel}:${event}`;
                if (!this.subscribedChannels.has(redisChannel)) {
                    this.redisSub.subscribe(redisChannel, (err) => {
                        if (err) {
                            console.error(`Failed to subscribe to ${redisChannel}:`, err);
                        } else {
                            this.subscribedChannels.add(redisChannel);
                            console.log(`Subscribed to ${redisChannel}`);
                        }
                    });
                }
            }
        }
    }

    /**
     * Remove a socket from a room
     */
    leaveRoom(socket: Socket, roomId: string): void {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room: ${roomId}`);
    }

    /**
     * Get the Socket.IO server instance
     */
    getIO(): Server {
        return this.io;
    }

    /**
     * Graceful shutdown
     */
    async shutdown(): Promise<void> {
        console.log("Shutting down Realtime server...");
        this.redisPub.disconnect();
        this.redisSub.disconnect();
        return new Promise((resolve) => {
            this.io.close(() => {
                console.log("Realtime server closed");
                resolve();
            });
        });
    }

    // --- Private Methods ---

    private setupRedisListeners(): void {
        this.redisSub.on("error", (err) => {
            console.error("Redis subscriber error:", err);
        });

        this.redisPub.on("error", (err) => {
            console.error("Redis publisher error:", err);
        });

        this.redisSub.on("connect", () => {
            console.log("Redis subscriber connected");
        });

        this.redisPub.on("connect", () => {
            console.log("Redis publisher connected");
        });

        // Handle incoming Redis messages
        this.redisSub.on("message", (redisChannel, message) => {
            console.log(`Message on ${redisChannel}:`, message);

            // Parse channel: "room:{roomId}:{channel}:{event}" or "{channel}:{event}"
            const parts = redisChannel.split(":");

            if (parts[0] === "room" && parts.length >= 4) {
                // Room-specific message: room:{roomId}:{channel}:{event}
                const roomId = parts[1];
                const channel = parts[2];
                const event = parts[3];

                try {
                    const data = JSON.parse(message);
                    this.io.to(roomId).emit(`${channel}:${event}`, data);
                } catch (err) {
                    console.error("Failed to parse message:", err);
                }
            } else if (parts.length >= 2) {
                // Global message: {channel}:{event}
                const channel = parts[0];
                const event = parts[1];

                try {
                    const data = JSON.parse(message);
                    this.io.emit(`${channel}:${event}`, data);
                } catch (err) {
                    console.error("Failed to parse message:", err);
                }
            }
        });
    }

    private setupSocketListeners(): void {
        this.io.on("connection", (socket) => {
            console.log(`Client connected: ${socket.id}`);

            socket.on("join-room", (roomId: string) => {
                this.joinRoom(socket, roomId);
            });

            socket.on("leave-room", (roomId: string) => {
                this.leaveRoom(socket, roomId);
            });

            socket.on("disconnect", () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });
    }
}

// --- Helper to get Redis URL ---
export const getRedisUrl = (): string => {
    if (process.env.REDIS_URL) return process.env.REDIS_URL;
    return "redis://server.local:6379";
};
