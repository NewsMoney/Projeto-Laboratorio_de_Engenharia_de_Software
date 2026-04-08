/**
 * System router stub.
 * Add system-level procedures (health check, notifications, etc.)
 */
import { router, publicProcedure } from "./trpc";

export const systemRouter = router({
  health: publicProcedure.query(() => ({ status: "ok", timestamp: new Date() })),
});
