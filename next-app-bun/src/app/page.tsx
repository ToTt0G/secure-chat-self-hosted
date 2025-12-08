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

export default function Home() {
  const { username } = useUsername();

  const { mutate: createRoom } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();
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
      <CardContent>
        <Button
          onClick={() => createRoom()}
          className="w-full font-bold text-md"
        >
          CREATE SECURE ROOM
        </Button>
        <Label className="mt-3 flex align-middle text-muted-foreground">
          Current Username:{" "}
          <span className="text-primary-foreground h-4">
            {username || <Skeleton className="h-4 w-40 inline-block" />}
          </span>
        </Label>
      </CardContent>
    </Card>
  );
}
