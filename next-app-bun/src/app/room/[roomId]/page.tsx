"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";

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
      <header className="border-b p-4 flex items-center justify-between bg-secondary">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <Label
              htmlFor="room-id"
              className="text-md uppercase text-muted-foreground"
            >
              Room ID
            </Label>
            <div className="flex gap-4 items-center">
              <span id="room-id" className="text-lg font-mono text-foreground">
                {roomId}
              </span>
              <Button
                onClick={() => copyLink()}
                size="sm"
                className="bg-background hover:bg-muted text-foreground border shadow-none"
              >
                {copyStatus}
              </Button>
            </div>
          </div>

          <div className="h-14 w-px bg-border" />

          <div className="flex flex-col">
            <Label
              htmlFor="destruct-timer"
              className="text-md text-muted-foreground uppercase"
            >
              Self-Destruct
            </Label>
            <span
              id="destruct-timer"
              className={`text-lg font-bold flex items-center gap-2 ${
                timeRemaining !== null && timeRemaining < 60
                  ? "text-destructive"
                  : "text-yellow-500"
              }`}
            >
              {timeRemaining !== null
                ? formatTimeRemaining(timeRemaining)
                : "--:--"}
            </span>
          </div>
        </div>

        <Button variant="destructive" className="uppercase font-bold">
          <span className="hover:animate-pulse">Destroy Now</span>
        </Button>
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
              autoFocus
              className="border-input bg-background file:text-foreground placeholder:text-muted-foreground pl-8 h-full focus-visible:ring-primary"
            ></Input>
          </div>
          <Button size="lg" className="font-bold uppercase">
            Send
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Page;
