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

export default function Home() {
  const { username } = useUsername();
  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-primary text-2xl">
          &gt; Secure Selfdestructing Chat
        </CardTitle>
        <CardDescription>
          Create secure, self-destructing chat rooms that disappear after 10
          minutes, no traces, total privacy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full">Create Room</Button>
        <Label className="mt-3 flex align-middle">
          Current Username:{" "}
          {username || <Skeleton className="h-3 w-48 inline-block" />}
        </Label>
      </CardContent>
    </Card>
  );
}
