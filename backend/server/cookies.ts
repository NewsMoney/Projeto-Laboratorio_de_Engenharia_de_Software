import { Request } from "express";

export function getSessionCookieOptions(req: Request) {
  return {
    secure: false, 
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  };
}
