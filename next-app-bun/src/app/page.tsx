import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const userName = "John Doe";

export default function Home() {
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
        <Label className="mt-3">Current Username: {userName}</Label>
      </CardContent>
    </Card>
  );
}
