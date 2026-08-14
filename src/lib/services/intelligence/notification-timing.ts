import { ProfileEngine } from "./profile";

/**
 * Notification Timing — determines when a user is most likely to open a
 * notification based on their learned listening hour-of-day distribution.
 */
export const NotificationTiming = {
  /** Most active hour (0-23) for a user, or a safe default. */
  async bestHour(userId: string): Promise<number> {
    const profile = await ProfileEngine.getProfile(userId).catch(() => null);
    const hours = (profile?.hourOfDay as Record<string, number>) || {};
    const entries = Object.entries(hours);
    if (entries.length === 0) return 12;
    const peak = entries.sort((a, b) => b[1] - a[1])[0][0];
    return parseInt(peak, 10);
  },

  /** Recommended delivery window + priority for the current moment. */
  async recommendation(userId: string) {
    const hour = await this.bestHour(userId);
    const now = new Date().getHours();
    const distance = Math.abs(now - hour);
    return {
      bestHour: hour,
      now,
      priority: distance <= 2 ? "now" : distance <= 6 ? "soon" : "later",
      label:
        distance <= 2
          ? "User is most active right now — send immediately."
          : `Optimal send time is around ${hour}:00.`,
    };
  },
};
