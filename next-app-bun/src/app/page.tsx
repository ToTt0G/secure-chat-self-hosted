"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

export default function Home() {
  const { username } = useUsername();
  const router = useRouter();

  const searchParams = useSearchParams();
  const wasDestroyed = searchParams.get("destroyed") === "true";
  const error = searchParams.get("error");

  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();
      return res;
    },
    onSuccess: (res) => {
      if (res.error) {
        router.push("/?error=" + JSON.stringify(res.error));
      } else if (res.data) {
        router.push(`/room/${res.data.roomId}`);
      }
    },
    onError: (err) => {
      router.push("/?error=" + JSON.stringify(err.message));
    },
  });

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-2xl">&gt;PRIVATE_CHAT</CardTitle>
        <CardDescription>
          Create secure, self-destructing chat rooms that disappear after 10
          minutes, no traces, total privacy.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {wasDestroyed && (<div className="bg-red-950/50 border border-red-900 p-4">
          <p className="text-red-500 font-bold uppercase">Room Destroyed</p>
          <p className="text-white">All messages have been permanently deleted</p>
        </div>)}
        {error && <p className="text-destructive">Error: {error}</p>}
        <div>
          <Label className="text-muted-foreground">Current Username: </Label>
          <span className="text-primary-foreground h-4 animate-pulse">
            {username || <Skeleton className="h-4 w-40 inline-block" />}
          </span>
        </div>
        <Button
          onClick={() => createRoom()}
          disabled={isPending}
          className="w-full font-bold text-lg relative z-10 touch-action-manipulation"
        >
          {isPending ? "CREATING..." : "CREATE SECURE ROOM"}
        </Button>
      </CardContent>
    </Card>
  );
}
