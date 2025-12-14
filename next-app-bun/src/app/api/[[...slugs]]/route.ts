import { Elysia } from "elysia";
import { z } from "zod";
import redis from "@/lib/redis";
import { nanoid } from "nanoid";
import { authMiddleware } from "./auth";

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
