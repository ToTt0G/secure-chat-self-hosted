import { treaty } from "@elysiajs/eden";
import type { App } from "../app/api/[[...slugs]]/route";

const url = process.env.NEXT_PUBLIC_APP_URL || "localhost:3000";

// this require .api to enter /api prefix
export const client = treaty<App>(url).api;
