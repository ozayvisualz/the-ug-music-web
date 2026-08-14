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
};

export type { EventType, EventInput } from "./events";
export type { MixSection } from "./recommend";
