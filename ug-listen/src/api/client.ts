import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

const API_URL = "https://www.theugmusic.com/api/trpc";
let authToken: string | null = null;
export function setAuthToken(token: string | null) { authToken = token; }
export function getAuthToken(): string | null { return authToken; }

export const trpc: any = createTRPCProxyClient<any>({
  links: [
    httpBatchLink({
      url: API_URL,
      transformer: superjson,
      headers() {
        const h: Record<string, string> = {};
        const t = getAuthToken();
        if (t) h.Authorization = `Bearer ${t}`;
        return h;
      },
    }),
  ],
});
