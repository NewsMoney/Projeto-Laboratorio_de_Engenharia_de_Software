import type { CookieOptions, Request } from "express";

/**
 * Centralized session cookie options for JoinMe.
 * Handles security (HTTPS), sameSite policy, and expiration.
 */
export function getSessionCookieOptions(req: Request): CookieOptions {
  const isSecure = req.protocol === "https";
  
  // 1 year in milliseconds
  const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

  return {
    httpOnly: true,
    secure: isSecure,
    // Use "none" for cross-site cookies on HTTPS, otherwise "lax"
    sameSite: isSecure ? "none" : "lax",
    path: "/",
    maxAge: ONE_YEAR_MS,
  };
}
