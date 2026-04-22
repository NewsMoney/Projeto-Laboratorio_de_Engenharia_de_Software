/**
 * JoinMe Backend - Server Entry Point
 */

import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { appRouter } from "./routers";
import { COOKIE_NAME } from "@shared/const";
import { getUserById } from "./db";

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

    createContext: async ({ req, res }) => {
      const sessionId = req.cookies?.[COOKIE_NAME];

      let user = null;

      if (sessionId) {
        const userId = Number(sessionId);

        if (!Number.isNaN(userId)) {
          user = await getUserById(userId);
        }
      }

      return {
        req,
        res,
        user,
      };
    },
  })
);

const port = parseInt(process.env.PORT || "3000");

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}/`);
});