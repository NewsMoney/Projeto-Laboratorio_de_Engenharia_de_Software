/**
 * System router for JoinMe.
 * Handles system-level procedures like health checks and uptime.
 */
import { router, publicProcedure } from "./trpc";

export const systemRouter = router({
  /**
   * Basic health check procedure.
   * Useful for monitoring and deployment checks.
   */
  health: publicProcedure.query(() => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? "1.0.0",
    };
  }),
});
