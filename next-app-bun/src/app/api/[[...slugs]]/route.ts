import { Elysia } from "elysia";
import { z } from "zod";
import redis from "@/lib/redis";
import { nanoid } from "nanoid";
import { authMiddleware } from "./auth";
import { publishToRealtime } from "@/lib/realtime-publisher";
import { ChatMessageEvent, chatSchema } from "@/lib/chat-schema";


const ROOM_TTL_SECONDS = 60 * 10;

const rooms = new Elysia({ prefix: "/room" }).post("/create", async () => {
  const roomId = nanoid();

  await redis.hset(`meta:${roomId}`, {
    connected: JSON.stringify([]),
    createdAt: Date.now(),
  });

  await redis.expire(`meta:${roomId}`, ROOM_TTL_SECONDS);

  return { roomId };
}).use(authMiddleware).get("/ttl", async ({ auth }) => {
  const remaining = await redis.ttl(`meta:${auth.roomId}`);
  return { ttl: remaining > 0 ? remaining : 0 };
}, {
  query: z.object({
    roomId: z.string(),
  })
}).delete("/", async ({ auth }) => {
  const { roomId } = auth;

  await Promise.all([
    redis.del(`meta:${roomId}`),
    redis.del(`messages:${roomId}`),
    redis.del(roomId),
  ]);

  await publishToRealtime(chatSchema, "chat", "destroy", {
    roomId,
    isDestroyed: true,
  }, roomId);

  return { success: true };
}, {
  query: z.object({
    roomId: z.string(),
  })
});

const messages = new Elysia({ prefix: "/messages" }).use(authMiddleware).post("/", async ({ body, auth }) => {
  const { sender, text } = body;
  const { roomId, token } = auth;

  const roomExists = await redis.exists(`meta:${roomId}`);

  if (!roomExists) {
    throw new Error("Room does not exist");
  }

  const message: ChatMessageEvent = {
    id: nanoid(),
    sender,
    text,
    timestamp: Date.now(),
    roomId,
    token,
  };

  await redis.rpush(`messages:${roomId}`, JSON.stringify({ ...message, token: auth.token }));

  await publishToRealtime(chatSchema, "chat", "message", message, roomId);

  // Housekeeping
  const remaining = await redis.ttl(`meta:${roomId}`);

  await Promise.all([
    redis.expire(`messages:${roomId}`, remaining),
    redis.expire(roomId, remaining),
  ]);

}, {
  query: z.object({
    roomId: z.string(),
  }),
  body: z.object({
    sender: z.string().max(100),
    text: z.string().max(1000),
  })
}).get('/', async ({ auth }) => {
  const messagesRaw = await redis.lrange(`messages:${auth.roomId}`, 0, -1);

  const messages = !messagesRaw ? [] : messagesRaw.map((message) => JSON.parse(message)) as ChatMessageEvent[];

  return {
    messages: messages.map((m) => ({
      ...m, token: m.token === auth.token ? auth.token : undefined
    }))
  };
}, {
  query: z.object({
    roomId: z.string(),
  })
})

const app = new Elysia({ prefix: "/api" }).use(rooms).use(messages);

export const GET = app.fetch;
export const POST = app.fetch;
export const DELETE = app.fetch;

export type App = typeof app;
