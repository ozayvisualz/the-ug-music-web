import { router } from "../trpc";
import { authRouter } from "./auth";
import { musicRouter } from "./music";
import { artistRouter } from "./artist";
import { paymentsRouter } from "./payments";
import { playlistRouter } from "./playlist";
import { socialRouter } from "./social";
import { adminRouter } from "./admin";
import { adsRouter } from "./ads";
import { merchRouter } from "./merch";
import { ticketsRouter } from "./tickets";
import { streamingRouter } from "./streaming";
import { businessRouter } from "./business";
import { radioRouter } from "./radio";
import { syncRouter } from "./sync";

export const appRouter = router({
  auth: authRouter,
  music: musicRouter,
  artist: artistRouter,
  payments: paymentsRouter,
  playlist: playlistRouter,
  social: socialRouter,
  admin: adminRouter,
  ads: adsRouter,
  merch: merchRouter,
  tickets: ticketsRouter,
  streaming: streamingRouter,
  business: businessRouter,
  radio: radioRouter,
  sync: syncRouter,
});

export type AppRouter = typeof appRouter;
