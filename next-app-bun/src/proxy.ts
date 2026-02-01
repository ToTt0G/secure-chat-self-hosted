import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { nanoid } from "nanoid";

// Common bot/crawler User-Agent patterns (link preview generators)
const BOT_PATTERNS = [
  /whatsapp/i,
  /facebookexternalhit/i,
  /facebot/i,
  /telegrambot/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /discordbot/i,
  /googlebot/i,
  /bingbot/i,
  /preview/i,
  /crawler/i,
  /spider/i,
  /bot\b/i,
];

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export const proxy = async (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;

  const roomMatch = pathname.match(/^\/room\/([^/]+)$/);

  if (!roomMatch)
    return NextResponse.redirect(new URL("/?error=no_room_match", req.url));

  const roomId = roomMatch[1];

  // Skip token assignment for bots/crawlers (link preview generators)
  const userAgent = req.headers.get("user-agent");
  if (isBot(userAgent)) {
    // Let bots see the page but don't assign them a token
    return NextResponse.next();
  }

  // Redis returns all fields as strings (Record<string, string>)
  // We cast it to a partial typed object for better intellisense, but values are still strings.
  const rawMeta = (await redis.hgetall(`meta:${roomId}`)) as {
    connected?: string;
    createdAt?: string;
  };

  // Check if room exists (if createdAt is missing, the hash likely doesn't exist)
  if (!rawMeta.createdAt) {
    return NextResponse.redirect(new URL("/?error=room_not_found", req.url));
  }

  const meta = {
    connected: JSON.parse(rawMeta.connected || "[]") as string[],
    createdAt: Number(rawMeta.createdAt),
  };

  const existingToken = req.cookies.get("x-auth-token")?.value;

  if (existingToken && meta.connected.includes(existingToken))
    return NextResponse.next();

  if (meta.connected.length >= 2) {
    return NextResponse.redirect(new URL("/?error=room_full", req.url));
  }

  const respons = NextResponse.next();

  const token = nanoid();

  respons.cookies.set("x-auth-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  await redis.hset(`meta:${roomId}`, {
    connected: JSON.stringify([...meta.connected, token]),
  });

  return respons;
};

export const config = {
  matcher: "/room/:path*",
};
