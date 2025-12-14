// realtime-publisher.ts
// This module only publishes to Redis - it does NOT start a Socket.IO server
// Use this from Next.js API routes to broadcast messages

import Redis from "ioredis";
import { ZodObject, ZodRawShape } from "zod";

type SchemaDefinition = Record<string, Record<string, ZodObject<ZodRawShape>>>;

// Redis publisher (singleton)
let redisPub: Redis | null = null;

function getRedisPublisher(): Redis {
    if (!redisPub) {
        const redisUrl = process.env.REDIS_URL || "redis://server.local:6379";
        redisPub = new Redis(redisUrl);
    }
    return redisPub;
}

/**
 * Publish a message to Redis for the socket server to broadcast
 */
export async function publishToRealtime<T extends SchemaDefinition>(
    schema: T,
    channel: keyof T & string,
    event: string,
    data: unknown,
    roomId?: string
): Promise<void> {
    const validator = schema[channel]?.[event] as ZodObject<ZodRawShape> | undefined;
    if (!validator) {
        throw new Error(`Unknown channel/event: ${channel}/${event}`);
    }

    const validated = validator.parse(data);
    const redis = getRedisPublisher();

    const redisChannel = roomId ? `room:${roomId}:${channel}:${event}` : `${channel}:${event}`;
    await redis.publish(redisChannel, JSON.stringify(validated));
}
