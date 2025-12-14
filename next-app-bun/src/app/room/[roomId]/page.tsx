"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUsername } from "@/hooks/use-username";
import { useRealtime } from "@/hooks/use-realtime";
import { client } from "@/lib/client";
import { ChatMessageEvent } from "@/socket-server";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function formatTimeRemaining(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}` as string;
}

const Page = () => {
  const params = useParams();
  const roomId = params.roomId as string;

  const router = useRouter();

  const { username } = useUsername();

  // Subscribe to realtime events for this room
  useRealtime({
    channels: [roomId],
    events: ["chat:message", "chat:destroy"],
    onData: (event, data) => {
      if (event === "chat:message") {
        // // Invalidate and refetch messages when a new message arrives
        // queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
        refetch();
      }
      if (event === "chat:destroy") {

        router.push("/?destroyed=true");
      }
    },
  });

  const { mutateAsync: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await client.messages.post(
        { sender: username, text },
        { query: { roomId } }
      );
    },
    onSuccess: () => {
      setInput("");
      inputRef.current?.focus();
    }
  });

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({ query: { roomId } });
      return res.data;
    },
  })

  useEffect(() => {
    if (ttlData?.ttl) {
      setTimeRemaining(ttlData.ttl);
    }
  }, [ttlData])

  useEffect(() => {
    if (timeRemaining !== null) {
      const interval = setInterval(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeRemaining])

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.get({ query: { roomId } });
      return res.data;
    },
  })

  const [copyStatus, setCopyStatus] = useState("COPY");

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);

    setCopyStatus("COPIED!");
    setTimeout(() => setCopyStatus("COPY"), 2000);
  };

  return (
    <main className="flex flex-col min-h-svh w-svw">
      <header className="border-b p-4 flex flex-col gap-4 md:flex-row md:items-center bg-secondary">
        <div className="flex flex-col w-full md:w-auto">
          <Label
            htmlFor="room-id"
            className="text-md uppercase text-muted-foreground"
          >
            Room ID
          </Label>
          <div className="flex gap-4 items-center justify-between md:justify-start">
            <span
              id="room-id"
              className="text-lg font-mono text-foreground break-all"
            >
              {roomId}
            </span>
            <Button
              onClick={() => copyLink()}
              size="sm"
              className="bg-background hover:bg-muted text-foreground border shadow-none shrink-0"
            >
              {copyStatus}
            </Button>
          </div>
        </div>

        <div className="hidden md:block h-14 w-px bg-border" />

        <div className="flex w-full items-center justify-between md:flex-1 md:gap-4">
          <div className="flex flex-col">
            <Label
              htmlFor="destruct-timer"
              className="text-md text-muted-foreground uppercase"
            >
              Self-Destruct
            </Label>
            <span
              id="destruct-timer"
              className={`text-lg font-bold flex items-center gap-2 ${timeRemaining !== null && timeRemaining < 60
                ? "text-destructive"
                : "text-yellow-500"
                }`}
            >
              {timeRemaining !== null
                ? formatTimeRemaining(timeRemaining)
                : "--:--"}
            </span>
          </div>

          <Button variant="destructive" className="uppercase font-bold">
            <span className="hover:animate-pulse">Destroy Now</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages?.messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm font-mono">No messages yet, send the first one!</p>
          </div>
        )}

        {messages?.messages.map((message) => (
          <div key={message.id} className="flex flex-col items-start">
            <div className="max-w-[80%] group">
              <div className="flex items-baseline gap-3 mb-1">
                <span className={`text-xs font-bold ${message.sender === username ? "text-primary" : "text-secondary-foreground"}`}>
                  {message.sender === username ? "You" : message.sender}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(message.timestamp, "HH:mm")}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed break-all">
                {message.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border bg-secondary">
        <div className="flex gap-4">
          <div className="flex-1 relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 animate-pulse text-primary">
              &gt;
            </span>
            <Input
              type="text"
              placeholder="Type your message here..."
              value={input}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  sendMessage({ text: input });
                }
              }}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              className="border-input bg-background file:text-foreground placeholder:text-muted-foreground pl-8 h-full focus-visible:ring-primary"
            ></Input>
          </div>
          <Button onClick={() => {
            sendMessage({ text: input })

          }} size="lg" className="font-bold uppercase" disabled={!input.trim() || isSending}>
            Send
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Page;
