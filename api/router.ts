import { authRouter } from "./auth-router";
import { airshieldRouter } from "./airshield-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  airshield: airshieldRouter,
});

export type AppRouter = typeof appRouter;
