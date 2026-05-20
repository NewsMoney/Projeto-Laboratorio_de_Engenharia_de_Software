import { Request } from "express";

export function getSessionCookieOptions(req: Request) {
  return {
    // CORREÇÃO: Garante que seja seguro se a requisição for HTTPS
    // ou se estivermos em produção.
    secure: req.secure || process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1 ano
  };
}
