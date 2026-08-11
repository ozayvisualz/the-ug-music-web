import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Image,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
  withRepeat,
  cancelAnimation,
} from "react-native-reanimated";
import {
  Music2,
  Search,
  Play,
  Heart,
  Crown,
  ChevronRight,
  Bell,
  User,
  Settings,
  Plus,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SPRING, TIMING, SHADOWS, HIT_SLOP } from "../constants/theme";
import { trpc } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useQueueStore } from "../store/playerStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_WIDTH = SCREEN_WIDTH - 32;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getArtistName(song: any): string {
  if (song?.artist?.user?.name) return song.artist.user.name;
  if (typeof song?.artist === "string") return song.artist;
  return "Unknown";
}

function getCoverUrl(song: any): string | undefined {
  return song?.coverUrl || undefined;
}

const MIX_CARDS = [
  { emoji: "\u{1F3B6}", label: "Daily Mix", color: "#1E1B4B" },
  { emoji: "\u{1F4C5}", label: "Weekly Mix", color: "#1A2E1A" },
  { emoji: "\u{2728}", label: "New Music Mix", color: "#2E1A2E" },
  { emoji: "\u{1F343}", label: "Chill Mix", color: "#1A2E2E" },
  { emoji: "\u{1F4AA}", label: "Workout Mix", color: "#2E1A1A" },
  { emoji: "\u{1F941}", label: "Lugaflow Mix", color: "#2E2E1A" },
  { emoji: "\u{1F64F}", label: "Gospel Mix", color: "#1A1A2E" },
  { emoji: "\u{1F483}", label: "Dancehall Mix", color: "#2E1A2A" },
];

const MADE_IN_UGANDA = [
  { emoji: "\u{1F1FA}\u{1F1EC}", label: "Trending Kampala" },
  { emoji: "\u{1F3A4}", label: "New Ugandan Artists" },
  { emoji: "\u{1F525}", label: "Viral TikTok" },
  { emoji: "\u{1F3B6}", label: "Fresh Dancehall" },
  { emoji: "\u{1F941}", label: "Lugaflow" },
  { emoji: "\u{1F64F}", label: "Gospel Hits" },
  { emoji: "\u{1F389}", label: "Party Mixes" },
  { emoji: "\u{1F4FB}", label: "Radio Charts" },
];

function ShimmerBlock({ width: w, height: h, borderRadius: br = 12 }: any) {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, TIMING.slow), -1, true);
    return () => cancelAnimation(opacity);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius: br,
          backgroundColor: COLORS.surfaceHover,
        },
        style,
      ]}
    />
  );
}

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.goldAccent} />
        <Text style={styles.sectionHeaderTitle}>{title}</Text>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} hitSlop={HIT_SLOP}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function HeroCard({ song, onPlay, onSave }: { song: any; onPlay: (s: any) => void; onSave: (s: any) => void }) {
  const coverUrl = getCoverUrl(song);
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroArtPlaceholder}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.heroArtImage} />
        ) : (
          <View style={styles.heroArtGradient}>
            <Music2 size={32} color={COLORS.gold} />
          </View>
        )}
      </View>
      <View style={styles.heroOverlay}>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={styles.heroArtist} numberOfLines={1}>
            {getArtistName(song)}
          </Text>
        </View>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.heroPlayBtn} onPress={() => onPlay(song)} hitSlop={HIT_SLOP}>
            <Play size={18} color={COLORS.bg} fill={COLORS.bg} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroSaveBtn} onPress={() => onSave(song)} hitSlop={HIT_SLOP}>
            <Heart size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function PagerDots({ total, active }: { total: number; active: number }) {
  return (
    <View style={styles.pagerWrap}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.pagerDot, i === active && styles.pagerDotActive]}
        />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const setQueue = useQueueStore((s) => s.setQueue);

  const [heroSongs, setHeroSongs] = useState<any[]>([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [trending, setTrending] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [nrLoading, setNrLoading] = useState(true);
  const [continueListening, setContinueListening] = useState<any[]>([]);
  const [clLoading, setClLoading] = useState(false);

  const [heroIndex, setHeroIndex] = useState(0);
  const heroFlatRef = useRef<FlatList>(null);
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroAutoAdvance = useRef(true);

  useEffect(() => {
    trpc.music.getTrending
      .query({ limit: 5 })
      .then((data: any[]) => {
        setHeroSongs(data);
        setTrending(data);
      })
      .catch(() => {
        setHeroSongs([]);
        setTrending([]);
      })
      .finally(() => {
        setHeroLoading(false);
        setTrendingLoading(false);
      });

    trpc.music.getNewReleases
      .query({ limit: 10 })
      .then((data: any[]) => setNewReleases(data))
      .catch(() => setNewReleases([]))
      .finally(() => setNrLoading(false));

    if (user && user.id !== "guest") {
      setClLoading(true);
      trpc.sync.getContinueListening
        .query()
        .then((data: any[]) => setContinueListening(data))
        .catch(() => setContinueListening([]))
        .finally(() => setClLoading(false));
    }
  }, [user]);

  useEffect(() => {
    if (heroSongs.length <= 1) return;
    heroTimer.current = setInterval(() => {
      if (!heroAutoAdvance.current) return;
      setHeroIndex((prev) => {
        const next = (prev + 1) % heroSongs.length;
        heroFlatRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => {
      if (heroTimer.current) clearInterval(heroTimer.current);
    };
  }, [heroSongs.length]);

  const mapTrack = (s: any) => ({
    id: s.id,
    title: s.title,
    artist: getArtistName(s),
    url: s.fileUrl || s.hlsUrl || s.url || "",
    duration: s.duration || 0,
    coverUrl: getCoverUrl(s),
  });

  const handlePlaySong = useCallback(
    (song: any) => setQueue([mapTrack(song)]),
    [setQueue],
  );

  const handlePlayList = useCallback(
    (songs: any[]) => setQueue(songs.map(mapTrack)),
    [setQueue],
  );

  const onHeroScroll = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (HERO_WIDTH + 12));
    if (idx >= 0 && idx < heroSongs.length) setHeroIndex(idx);
  }, [heroSongs.length]);

  const onHeroTouchStart = () => (heroAutoAdvance.current = false);
  const onHeroTouchEnd = () => (heroAutoAdvance.current = true);

  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() ?? "L";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Header Bar ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            {user?.name ? (
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            ) : (
              <User size={18} color={COLORS.bg} />
            )}
          </View>
          <View style={styles.greetingWrap}>
            <Text style={styles.greeting}>
              {getGreeting()}{" "}
              <Text style={styles.greetingWave}>{/* wave */}</Text>
            </Text>
            <Text style={styles.username}>
              {user?.name?.split(" ")[0] ?? "Listener"}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => navigation.navigate("Notifications")}
            hitSlop={HIT_SLOP}
          >
            <Bell size={20} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => navigation.navigate("Settings")}
            hitSlop={HIT_SLOP}
          >
            <Settings size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Carousel ── */}
        <View style={styles.heroSection}>
          {heroLoading ? (
            <ShimmerBlock width={HERO_WIDTH} height={200} borderRadius={RADIUS.lg} />
          ) : heroSongs.length > 0 ? (
            <>
              <FlatList
                ref={heroFlatRef}
                data={heroSongs}
                keyExtractor={(item: any) => item.id}
                horizontal
                pagingEnabled
                snapToInterval={HERO_WIDTH + 12}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onScroll={onHeroScroll}
                onTouchStart={onHeroTouchStart}
                onTouchEnd={onHeroTouchEnd}
                onMomentumScrollEnd={onHeroTouchEnd}
                scrollEventThrottle={16}
                contentContainerStyle={styles.heroList}
                renderItem={({ item }: { item: any }) => (
                  <HeroCard
                    song={item}
                    onPlay={handlePlaySong}
                    onSave={() => {}}
                  />
                )}
              />
              <PagerDots total={heroSongs.length} active={heroIndex} />
            </>
          ) : null}
        </View>

        {/* ── Made For You ── */}
        <View style={styles.section}>
          <SectionHeader title="Made For You" />
          <FlatList
            data={MIX_CARDS}
            keyExtractor={(_, i) => `mix-${i}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mixList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.mixCard, { backgroundColor: item.color }]}
                activeOpacity={0.7}
                onPress={() => {}}
              >
                <Text style={styles.mixEmoji}>{item.emoji}</Text>
                <Text style={styles.mixLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* ── Continue Listening ── */}
        {user && user.id !== "guest" && (
          <View style={styles.section}>
            <SectionHeader title="Continue Listening" />
            {clLoading ? (
              <View style={styles.skeletonRow}>
                <ShimmerBlock width={136} height={88} />
                <View style={{ width: 10 }} />
                <ShimmerBlock width={136} height={88} />
              </View>
            ) : continueListening.length > 0 ? (
              <FlatList
                data={continueListening}
                keyExtractor={(item: any) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => {
                  const coverUrl = getCoverUrl(item);
                  return (
                    <TouchableOpacity
                      style={styles.continueCard}
                      activeOpacity={0.7}
                      onPress={() => handlePlaySong(item)}
                    >
                      <View style={styles.continueArt}>
                        {coverUrl ? (
                          <Image source={{ uri: coverUrl }} style={styles.continueArtImg} />
                        ) : (
                          <Music2 size={28} color={COLORS.gold} />
                        )}
                      </View>
                      <View style={styles.continueInfo}>
                        <Text style={styles.continueTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.continueArtist} numberOfLines={1}>
                          {getArtistName(item)}
                        </Text>
                      </View>
                      <View style={styles.continueBar}>
                        <View style={styles.continueBarFill} />
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : null}
          </View>
        )}

        {/* ── Trending Now ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Trending Now"
            onSeeAll={() => navigation.navigate("Trending")}
          />
          {trendingLoading ? (
            <View style={styles.skeletonRow}>
              <ShimmerBlock width={130} height={170} />
              <View style={{ width: 10 }} />
              <ShimmerBlock width={130} height={170} />
              <View style={{ width: 10 }} />
              <ShimmerBlock width={130} height={170} />
            </View>
          ) : trending.length > 0 ? (
            <FlatList
              data={trending}
              keyExtractor={(item: any) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => {
                const coverUrl = getCoverUrl(item);
                return (
                  <TouchableOpacity
                    style={styles.trendingCard}
                    activeOpacity={0.7}
                    onPress={() => handlePlaySong(item)}
                  >
                    <View style={styles.trendingArt}>
                      {coverUrl ? (
                        <Image source={{ uri: coverUrl }} style={styles.trendingArtImg} />
                      ) : (
                        <Music2 size={28} color={COLORS.gold} />
                      )}
                    </View>
                    <Text style={styles.trendingTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.trendingArtist} numberOfLines={1}>
                      {getArtistName(item)}
                    </Text>
                    <View style={styles.playCountRow}>
                      <Text style={styles.fireIcon}>{/* fire */}</Text>
                      <Text style={styles.playCountText}>
                        {item.playCount != null
                          ? item.playCount > 1000
                            ? `${(item.playCount / 1000).toFixed(1)}K`
                            : `${item.playCount}`
                          : ""}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.trendingPlayBtn}
                      onPress={() => handlePlaySong(item)}
                      hitSlop={HIT_SLOP}
                    >
                        <Play size={14} color={COLORS.bg} fill={COLORS.bg} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          ) : null}
        </View>

        {/* ── New Releases ── */}
        <View style={styles.section}>
          <SectionHeader title="New Releases" />
          {nrLoading ? (
            <View style={styles.skeletonRow}>
              <ShimmerBlock width={130} height={170} />
              <View style={{ width: 10 }} />
              <ShimmerBlock width={130} height={170} />
              <View style={{ width: 10 }} />
              <ShimmerBlock width={130} height={170} />
            </View>
          ) : newReleases.length > 0 ? (
            <FlatList
              data={newReleases}
              keyExtractor={(item: any) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => {
                const coverUrl = getCoverUrl(item);
                return (
                  <TouchableOpacity
                    style={styles.releaseCard}
                    activeOpacity={0.7}
                    onPress={() => handlePlaySong(item)}
                  >
                    <View style={styles.releaseArt}>
                      {coverUrl ? (
                        <Image source={{ uri: coverUrl }} style={styles.releaseArtImg} />
                      ) : (
                        <Music2 size={28} color={COLORS.gold} />
                      )}
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    </View>
                    <Text style={styles.releaseTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.releaseArtist} numberOfLines={1}>
                      {getArtistName(item)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          ) : null}
        </View>

        {/* ── Made in Uganda ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Made in Uganda"
            onSeeAll={() => navigation.navigate("MadeInUganda")}
          />
          <View style={styles.ugandaGrid}>
            {MADE_IN_UGANDA.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.ugandaCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("MadeInUganda")}
              >
                <View style={styles.ugandaOverlay}>
                  <Text style={styles.ugandaEmoji}>{item.emoji}</Text>
                  <Text style={styles.ugandaLabel} numberOfLines={2}>
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "rgba(9, 9, 11, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  headerIcon: {
    padding: SPACING.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: "700",
  },
  greetingWrap: {
    gap: 1,
  },
  greeting: {
    color: COLORS.whiteMuted,
    fontSize: 12,
  },
  greetingWave: {
    fontSize: 12,
  },
  username: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },

  // ── Section Header ──
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  goldAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
  },
  sectionHeaderTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  seeAll: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Section ──
  section: {
    marginBottom: SPACING.xl,
  },

  // ── Hero Carousel ──
  heroSection: {
    marginBottom: SPACING.lg,
  },
  heroList: {
    paddingRight: SPACING.lg,
    gap: SPACING.md,
  },
  heroCard: {
    width: HERO_WIDTH,
    height: 200,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  heroArtPlaceholder: {
    ...StyleSheet.absoluteFillObject,
  },
  heroArtImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroArtGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceHover,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: SPACING.md,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  heroTextWrap: {
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  heroArtist: {
    color: COLORS.whiteMuted,
    fontSize: 12,
    marginTop: 2,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  heroPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  heroSaveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Pager Dots ──
  pagerWrap: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  pagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
  },
  pagerDotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
  },

  // ── Made For You ──
  mixList: {
    paddingRight: SPACING.lg,
    gap: SPACING.sm,
  },
  mixCard: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  mixEmoji: {
    fontSize: 24,
  },
  mixLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 14,
  },

  // ── Continue Listening ──
  continueCard: {
    width: 136,
    height: 88,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
    marginRight: SPACING.md,
  },
  continueArt: {
    width: 136,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceHover,
  },
  continueArtImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  continueInfo: {
    paddingHorizontal: SPACING.xs,
    paddingTop: 3,
  },
  continueTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "600",
  },
  continueArtist: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  continueBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.border,
  },
  continueBarFill: {
    width: "40%",
    height: "100%",
    backgroundColor: COLORS.gold,
  },

  // ── Trending Now ──
  trendingCard: {
    width: 130,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    marginRight: SPACING.md,
    position: "relative",
  },
  trendingArt: {
    width: 114,
    height: 100,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
    overflow: "hidden",
  },
  trendingArtImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  trendingTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  trendingArtist: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginBottom: 3,
  },
  playCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  fireIcon: {
    fontSize: 10,
  },
  playCountText: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  trendingPlayBtn: {
    position: "absolute",
    bottom: SPACING.xs,
    right: SPACING.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.glow,
  },

  // ── New Releases ──
  releaseCard: {
    width: 130,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    marginRight: SPACING.md,
  },
  releaseArt: {
    width: 114,
    height: 100,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
    overflow: "hidden",
    position: "relative",
  },
  releaseArtImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  newBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  newBadgeText: {
    color: COLORS.bg,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  releaseTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  releaseArtist: {
    color: COLORS.textMuted,
    fontSize: 10,
  },

  // ── Made in Uganda ──
  ugandaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  ugandaCard: {
    width: (SCREEN_WIDTH - 32 - SPACING.sm) / 2,
    height: 76,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },
  ugandaOverlay: {
    flex: 1,
    backgroundColor: "rgba(234, 179, 8, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xs,
    gap: 3,
  },
  ugandaEmoji: {
    fontSize: 20,
  },
  ugandaLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 14,
  },

  // ── Skeleton ──
  skeletonRow: {
    flexDirection: "row",
  },

  // ── Misc ──
  horizontalList: {
    paddingRight: SPACING.lg,
  },
  bottomSpacer: {
    height: 70,
  },
});
