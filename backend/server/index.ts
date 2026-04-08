/**
 * JoinMe Backend - Server Entry Point
 *
 * This is a template entry point. The original _core framework
 * has been removed. You need to implement:
 *
 * 1. Express server setup
 * 2. tRPC middleware integration
 * 3. OAuth/authentication flow
 * 4. Vite dev middleware (or serve static frontend build)
 *
 * See the README.md for detailed setup instructions.
 */
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";

const app = express();
const server = createServer(app);

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// TODO: Implement your OAuth/authentication routes here
// Example: app.get("/api/oauth/callback", ...)

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    // TODO: Implement createContext with your auth logic
    createContext: ({ req, res }) => ({ req, res, user: null }),
  })
);

// TODO: In production, serve the frontend build:
// app.use(express.static(path.resolve(__dirname, "../frontend/dist")));

const port = parseInt(process.env.PORT || "3000");
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}/`);
});
