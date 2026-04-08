/**
 * Type-only stub for frontend tRPC client.
 * The actual implementation lives in backend/server/routers.ts.
 * This file re-exports the AppRouter type so the frontend can
 * consume it without depending on the full backend source.
 *
 * In a monorepo setup, replace this with a shared package reference.
 */
export type { AppRouter } from "../../backend/server/routers";
