interface NotificationPayload {
  title: string;
  body: string;
  audience: "all" | "premium" | "free" | "artists" | "followers" | "specific";
  userIds?: string[];
}

export const NotificationEngine = {
  async send(payload: NotificationPayload) {
    try {
      const { sendPushNotification } = await import("../firebase-admin");
      // Send to a topic matching the audience for push delivery
      await sendPushNotification({
        title: payload.title,
        body: payload.body,
        topic: payload.audience,
      });
    } catch (e: any) {
      console.error("[Notification] Push send failed:", e?.message);
    }

    return {
      success: true,
      audience: payload.audience,
      sentAt: new Date().toISOString(),
      title: payload.title,
    };
  },

  async generateArtistUpdate(artistName: string, songTitle: string) {
    return this.send({
      title: `${artistName} just dropped new music!`,
      body: `Listen to "${songTitle}" now on TheUgMusic.`,
      audience: "followers",
    });
  },

  async generatePaymentConfirmation(userId: string, amount: number) {
    return this.send({
      title: "Payment Confirmed",
      body: `Your payment of UGX ${amount.toLocaleString()} was successful.`,
      audience: "specific",
      userIds: [userId],
    });
  },
};
