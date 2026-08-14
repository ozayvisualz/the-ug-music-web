import { db } from "../../db";

export interface ModerationResult {
  flagged: boolean;
  score: number;
  categories: string[];
  action: "allow" | "hide" | "review";
}

const SPAM_PATTERNS = [
  /(https?:\/\/)?(bit\.ly|t\.me|wa\.me|goo\.gl|tinyurl|rebrand\.ly|shorte\.st)/i,
  /(buy|sell|order|promo|discount|free\s+(followers|streams|likes))/i,
  /(earn\s+money|make\s+money|cash\s+out|double\s+your)/i,
  /(whatsapp|call|sms)\s*(me|us)?\s*(\+|0)?\d{9,}/i,
  /(\+\d{1,3}[\s-]?\d{9,})/,
];

const HATE_PATTERNS = [
  /(stupid|idiot|fool|dumb|moron|retard)/i,
  /(hate|kill|die|ugly|trash|garbage|worthless)/i,
  /(fuck|shit|bitch|asshole|bastard|mf|mofo)/i,
  /(scam|fraud|thief|cheat)/i,
];

const LINK_PATTERN = /(https?:\/\/|www\.)\S+/i;

export const ModerationEngine = {
  analyze(content: string): ModerationResult {
    if (!content) return { flagged: false, score: 0, categories: [], action: "allow" };

    const categories: string[] = [];
    let score = 0;

    // Spam / scam links
    if (SPAM_PATTERNS.some((p) => p.test(content))) {
      categories.push("spam");
      score += 40;
    } else if (LINK_PATTERN.test(content)) {
      categories.push("link");
      score += 20;
    }

    // Hate speech / abuse
    if (HATE_PATTERNS.some((p) => p.test(content))) {
      categories.push("abuse");
      score += 35;
    }

    // Repeated characters (e.g. "!!!!!" / "aaaaaa")
    if (/(.)\1{6,}/.test(content)) {
      categories.push("spam");
      score += 10;
    }

    // ALL CAPS shouting
    if (content.length > 20 && content === content.toUpperCase()) {
      categories.push("spam");
      score += 8;
    }

    // Excessive length
    if (content.length > 600) {
      categories.push("spam");
      score += 10;
    }

    const flagged = score >= 40;
    const action = score >= 70 ? "hide" : flagged ? "review" : "allow";

    return { flagged, score, categories: [...new Set(categories)], action };
  },

  async moderateComment(userId: string, songId: string, content: string): Promise<ModerationResult> {
    const result = this.analyze(content);
    if (result.flagged) {
      try {
        await db.auditLog.create({
          data: { userId, action: "comment_flagged", details: JSON.stringify({ songId, content, ...result }) },
        });
      } catch {}
    }
    return result;
  },
};
