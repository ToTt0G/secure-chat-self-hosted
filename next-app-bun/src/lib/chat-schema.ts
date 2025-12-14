// chat-schema.ts
// Shared schema definitions for chat events
// Used by both the socket server and API routes

import { z } from "zod";

export const messageSchema = z.object({
    id: z.string(),
    sender: z.string().max(100),
    text: z.string().max(1000),
    timestamp: z.number(),
    roomId: z.string(),
    token: z.string().optional(),
});

export const destroySchema = z.object({
    roomId: z.string(),
    isDestroyed: z.literal(true),
});

export const chatSchema = {
    chat: {
        message: messageSchema,
        destroy: destroySchema,
    },
};

export type ChatMessageEvent = z.infer<typeof messageSchema>;
export type ChatDestroyEvent = z.infer<typeof destroySchema>;
export type ChatSchema = typeof chatSchema;
