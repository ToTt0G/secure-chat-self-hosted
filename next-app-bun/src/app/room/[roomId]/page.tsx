"use client";

import { useParams } from "next/navigation";

const Page = () => {
  const params = useParams();

  const roomId = params.roomId as string;
  return <p>Hello {roomId}!</p>;
};

export default Page;
