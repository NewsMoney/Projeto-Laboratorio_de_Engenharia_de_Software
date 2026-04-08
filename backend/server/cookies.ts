/**
 * Cookie configuration stub.
 * Implement your session cookie options here.
 */
export function getSessionCookieOptions(req: any) {
  const isSecure = req.protocol === "https";
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
  };
}
