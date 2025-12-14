import { Elysia } from "elysia";
import { z } from "zod";
import redis from "@/lib/redis";
import { nanoid } from "nanoid";
import { authMiddleware } from "./auth";
import { ChatMessageEvent, realtime } from "@/socket-server";

const ROOM_TTL_SECONDS = 60 * 10;

const rooms = new Elysia({ prefix: "/room" }).post("/create", async () => {
  const roomId = nanoid();

  await redis.hset(`meta:${roomId}`, {
    connected: JSON.stringify([]),
    createdAt: Date.now(),
  });

  await redis.expire(`meta:${roomId}`, ROOM_TTL_SECONDS);

  return { roomId };
});

const messages = new Elysia({ prefix: "/messages" }).use(authMiddleware).post("/", async ({ body, auth }) => {
  const { sender, text } = body;
  const { roomId, token, connected } = auth;

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

  await realtime.publish("chat", "message", message, roomId);

  // Housekeeping
  const remaining = await redis.ttl(`meta:${roomId}`);

  await redis.expire(`messages:${roomId}`, remaining);
  await redis.expire(`history:${roomId}`, remaining);
  await redis.expire(roomId, remaining);
}, {
  query: z.object({
    roomId: z.string(),
  }),
  body: z.object({
    sender: z.string().max(20),
    text: z.string().max(1000),
  })
});

const app = new Elysia({ prefix: "/api" }).use(rooms).use(messages);

export const GET = app.fetch;
export const POST = app.fetch;

export type App = typeof app;
