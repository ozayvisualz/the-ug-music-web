/**
 * Lightweight structured production logger.
 *
 * Emits JSON lines to stdout/stderr (captured by the hosting platform's log
 * aggregator). Sensitive fields are redacted to avoid leaking user data.
 */

type Level = "info" | "warn" | "error";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "secret",
  "apikey",
  "api_key",
  "accesskey",
  "access_key",
  "secretkey",
  "secret_key",
  "cookie",
  "authorizationheader",
  "refreshtoken",
  "accesstoken",
]);

function sanitize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") {
    // Strings that look like secrets (JWT, long base64) are truncated.
    if (typeof value === "string" && value.length > 200) return value.slice(0, 60) + "…";
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitize);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) out[k] = "[REDACTED]";
    else out[k] = sanitize(v);
  }
  return out;
}

function emit(level: Level, category: string, message: string, meta?: unknown) {
  try {
    const entry = {
      level,
      category,
      message,
      ts: new Date().toISOString(),
      ...(meta !== undefined ? { meta: sanitize(meta) } : {}),
    };
    const line = JSON.stringify(entry);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  } catch {
    // Never throw from logging.
  }
}

export const logger = {
  error: (category: string, message: string, meta?: unknown) => emit("error", category, message, meta),
  warn: (category: string, message: string, meta?: unknown) => emit("warn", category, message, meta),
  info: (category: string, message: string, meta?: unknown) => emit("info", category, message, meta),
};
