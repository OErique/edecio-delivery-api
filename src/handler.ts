// src/handler.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "./app.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  return (app as any)(req, res);
}
