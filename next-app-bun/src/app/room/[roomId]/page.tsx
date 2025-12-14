"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { io } from "socket.io-client";

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

  const { username } = useUsername();

  const socket = io("http://localhost:3001");
  socket.emit("join-room", { roomId });
  socket.on("chat:message", (message) => {
    //Add to messages state
  });

  const { mutateAsync: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await client.messages.post(
        { sender: username, text },
        { query: { roomId } }
      );
    },
  });

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"></div>

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
                  // TODO: SEND MESSAGE
                  sendMessage({ text: input });
                  setInput("");
                  inputRef.current?.focus();
                }
              }}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              className="border-input bg-background file:text-foreground placeholder:text-muted-foreground pl-8 h-full focus-visible:ring-primary"
            ></Input>
          </div>
          <Button onClick={() => {
            sendMessage({ text: input })
            setInput("")
            inputRef.current?.focus()
          }} size="lg" className="font-bold uppercase" disabled={!input.trim() || isSending}>
            Send
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Page;
