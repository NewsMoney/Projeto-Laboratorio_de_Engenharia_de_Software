/**
 * JoinMe Backend - Server Entry Point
 */

import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { appRouter } from "./routers";
import { createContext } from "./context";

const app = express();
const server = createServer(app);

/* Middlewares */
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  })
);

/* tRPC API */
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

/* Health Check */
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const port = parseInt(process.env.PORT || "3000");

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}/`);
});
