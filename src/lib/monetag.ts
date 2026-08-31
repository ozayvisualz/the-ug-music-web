"use client";

// Monetag Direct Link (SmartLink) integration.
//
// The Direct Link is only ever opened from an intentional Download click —
// never on page load, render, playback, or background work. It is intentionally
// isolated from the rest of the download system so the actual song download is
// never dependent on, or blocked by, the ad.

const MONETAG_DIRECT_LINK_URL = process.env.NEXT_PUBLIC_MONETAG_DIRECT_LINK_URL;

export function getMonetagDirectLink(): string | undefined {
  return MONETAG_DIRECT_LINK_URL?.trim() || undefined;
}

/**
 * Open the Monetag Direct Link in a new tab. Fails silently and never blocks
 * the download. Returns true if a link was configured and an attempt was made.
 */
export function triggerMonetagDirectLink(): boolean {
  try {
    const url = getMonetagDirectLink();
    if (!url) return false; // Not configured — download proceeds normally.
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  } catch {
    // Monetag must never break or block the download.
    return false;
  }
}
