import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

const API_URL = "https://theugmusic.com/api/trpc";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export const trpc = createTRPCProxyClient<any>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: API_URL,
      headers() {
        const headers: Record<string, string> = {};
        const t = getAuthToken();
        if (t) headers["Authorization"] = `Bearer ${t}`;
        return headers;
      },
    }),
  ],
});
