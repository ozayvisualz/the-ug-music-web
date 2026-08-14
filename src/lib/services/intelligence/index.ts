import { IntelligenceEvents } from "./events";
import { ProfileEngine } from "./profile";
import { RecommendationEngine } from "./recommend";
import { SmartSearchEngine } from "./smart-search";
import { TrendEngine } from "./trends";
import { SmartChartsEngine } from "./smart-charts";
import { ModerationEngine } from "./moderation";
import { SmartQueueEngine } from "./queue";
import { ArtistInsightsEngine } from "./artist-insights";
import { PlaylistGenerator } from "./playlist-generator";
import { FraudEngine } from "./fraud";
import { AdminAssistant } from "./assistant";
import { IntelligenceCache } from "./cache";
import { NotificationTiming } from "./notification-timing";
import { SmartNotifications } from "./smart-notifications";

/**
 * Unified Intelligence Engine — the single facade powering the entire platform.
 * Every component is additive and independent; existing services are untouched.
 */
export const IntelligenceEngine = {
  events: IntelligenceEvents,
  profile: ProfileEngine,
  recommend: RecommendationEngine,
  search: SmartSearchEngine,
  trends: TrendEngine,
  charts: SmartChartsEngine,
  moderation: ModerationEngine,
  queue: SmartQueueEngine,
  artistInsights: ArtistInsightsEngine,
  playlists: PlaylistGenerator,
  fraud: FraudEngine,
  assistant: AdminAssistant,
  cache: IntelligenceCache,
  notificationTiming: NotificationTiming,
  smartNotifications: SmartNotifications,
};

export {
  IntelligenceEvents,
  ProfileEngine,
  RecommendationEngine,
  SmartSearchEngine,
  TrendEngine,
  SmartChartsEngine,
  ModerationEngine,
  SmartQueueEngine,
  ArtistInsightsEngine,
  PlaylistGenerator,
  FraudEngine,
  AdminAssistant,
  IntelligenceCache,
  NotificationTiming,
  SmartNotifications,
};

export type { EventType, EventInput } from "./events";
export type { MixSection } from "./recommend";
