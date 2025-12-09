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
import { useRouter } from "next/navigation";

export default function Home() {
  const { username } = useUsername();
  const router = useRouter();

  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();
      return res;
    },
    onSuccess: (res) => {
      if (res.error) {
        alert("Error creating room: " + JSON.stringify(res.error));
      } else if (res.data) {
        router.push(`/room/${res.data.roomId}`);
      }
    },
    onError: (err) => {
      alert("Network or Server Error: " + err.message);
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
