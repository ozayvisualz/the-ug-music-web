import { createTRPCProxyClient, httpLink } from "@trpc/client";
import superjson from "superjson";

const API_URL = "https://theugmusic.com/api/trpc";
let authToken: string | null = null;
export function setAuthToken(token: string | null) { authToken = token; }
export function getAuthToken(): string | null { return authToken; }
export const trpc = createTRPCProxyClient<any>({
  transformer: superjson,
  links: [httpLink({ url: API_URL, headers() { const h: Record<string,string>={}; const t=getAuthToken(); if(t) h.Authorization=`Bearer ${t}`; return h; } })],
});
