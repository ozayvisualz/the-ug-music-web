import { db } from "../../db";

export type EventType =
  | "stream"
  | "skip"
  | "complete"
  | "like"
  | "unlike"
  | "follow"
  | "unfollow"
  | "download"
  | "search"
  | "playlist_add"
  | "playlist_save"
  | "radio"
  | "share"
  | "comment";

export interface EventInput {
  userId: string;
  type: EventType;
  songId?: string;
  artistId?: string;
  playlistId?: string;
  query?: string;
  context?: string;
  metadata?: any;
}

/**
 * Unified Intelligence Events — every action in the platform flows through here.
 *
 * Capture is intentionally non-blocking and failure-isolated: an event write must
 * NEVER break the user-facing action that produced it. Writes are queued in-memory
 * and flushed in batches to keep latency near-zero on hot paths (streaming, likes).
 */
const MAX_BATCH = 50;
const FLUSH_INTERVAL_MS = 1500;

let queue: EventInput[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
let flushing = false;

async function flush() {
  if (flushing || queue.length === 0) return;
  flushing = true;
  const batch = queue.splice(0, queue.length);
  try {
    await db.userEvent.createMany({
      data: batch.map((e) => ({
        userId: e.userId,
        type: e.type,
        songId: e.songId ?? null,
        artistId: e.artistId ?? null,
        playlistId: e.playlistId ?? null,
        query: e.query ?? null,
        context: e.context ?? null,
        metadata: e.metadata ?? undefined,
      })),
    });
  } catch (err) {
    // Re-enqueue on failure to avoid losing events (best effort, bounded).
    if (queue.length < MAX_BATCH * 4) queue = batch.concat(queue);
  } finally {
    flushing = false;
  }
}

function ensureTimer() {
  if (timer) return;
  timer = setInterval(() => {
    void flush();
  }, FLUSH_INTERVAL_MS);
  // Keep the event loop alive-friendly on serverless: unref when available.
  if (typeof (timer as any).unref === "function") (timer as any).unref();
}

export const IntelligenceEvents = {
  /**
   * Record an event. Never throws — callers can fire-and-forget.
   */
  record(event: EventInput): void {
    try {
      if (!event.userId) return;
      queue.push(event);
      if (queue.length >= MAX_BATCH) void flush();
      ensureTimer();
    } catch {}
  },

  /** Record many events at once (e.g. queue generation, bulk imports). */
  recordMany(events: EventInput[]): void {
    for (const e of events) this.record(e);
  },

  /** Force an immediate flush (used by tests / request teardown). */
  async flushNow(): Promise<void> {
    await flush();
  },

  get pendingCount(): number {
    return queue.length;
  },
};
