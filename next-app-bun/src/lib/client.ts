import { treaty } from "@elysiajs/eden";
import type { App } from "../app/api/[[...slugs]]/route";

const getUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (typeof window !== "undefined")
    return `${window.location.protocol}//${window.location.host}`;
  return "http://localhost:3000";
};

// this require .api to enter /api prefix
export const client = treaty<App>(getUrl()).api;
