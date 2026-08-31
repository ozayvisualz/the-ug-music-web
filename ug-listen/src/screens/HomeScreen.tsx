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
import { SafeAreaView } from "react-native-safe-area-context";
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
import { useLikedStore } from "../store/likedStore";
import { useNotificationStore } from "../store/notificationStore";
import { useTheme } from "../theme/ThemeContext";
import { getStoredToken } from "../api/auth";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SW = SCREEN_WIDTH;
const HERO_WIDTH = SW - 24;
const H_PAD = 16;
const GAP = 10;
const CARD_W = (SW - H_PAD * 2 - GAP * 3) / 4;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getArtistName(song: any): string {
  if (song?.artist?.artistName) return song.artist.artistName;
  if (song?.artist?.user?.name) return song.artist.user.name;
  if (typeof song?.artist === "string") return song.artist;
  return "Unknown";
}

function getCoverUrl(song: any): string | undefined {
  return song?.coverUrl || song?.album?.coverUrl || undefined;
}

function timeAgo(d: any): string {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(d).toLocaleDateString();
}

function formatClock(seconds: number): string {
  if (!seconds || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  const { colors } = useTheme();
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
          backgroundColor: colors.surfaceHover,
        },
        style,
      ]}
    />
  );
}

function SectionHeader({
  title,
  onSeeAll,
  onClear,
}: {
  title: string;
  onSeeAll?: () => void;
  onClear?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.goldAccent} />
        <Text style={[styles.sectionHeaderTitle, { color: colors.white }]}>{title}</Text>
      </View>
      <View style={styles.sectionHeaderActions}>
        {onClear && (
          <TouchableOpacity onPress={onClear} hitSlop={HIT_SLOP}>
            <Text style={styles.clearAll}>Clear</Text>
          </TouchableOpacity>
        )}
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} hitSlop={HIT_SLOP}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function HeroCard({ song, onPlay, onSave }: { song: any; onPlay: (s: any) => void; onSave: (s: any) => void }) {
  const { colors } = useTheme();
  const coverUrl = getCoverUrl(song);
  const liked = useLikedStore((s) => s.likedIds.has(song.id));
  return (
    <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
      <View style={styles.heroArtPlaceholder}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.heroArtImage} />
        ) : (
          <View style={[styles.heroArtGradient, { backgroundColor: colors.surfaceHover }]}>
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
            <Heart size={18} color={liked ? COLORS.red : COLORS.white} fill={liked ? COLORS.red : "none"} />
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
  const setShuffle = useQueueStore((s) => s.setShuffle);
  const setRepeat = useQueueStore((s) => s.setRepeat);
  const { colors } = useTheme();

  const [heroSongs, setHeroSongs] = useState<any[]>([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [trending, setTrending] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [nrLoading, setNrLoading] = useState(true);
  const [continueListening, setContinueListening] = useState<any[]>([]);
  const [clLoading, setClLoading] = useState(false);
  const [forYou, setForYou] = useState<any[]>([]);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const [heroIndex, setHeroIndex] = useState(0);
  const heroFlatRef = useRef<FlatList>(null);
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroAutoAdvance = useRef(true);

  useEffect(() => {
    const token = user && user.id !== "guest" ? require("../api/client").getAuthToken() : null;
    fetch("https://www.theugmusic.com/api/mobile/home", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.trending) { setHeroSongs(data.trending); setTrending(data.trending); }
        if (data.newReleases) setNewReleases(data.newReleases);
        if (data.forYou) setForYou(data.forYou);
        if (data.continueListening) {
          const cl = Array.isArray(data.continueListening) ? data.continueListening : [data.continueListening];
          setContinueListening(cl.map((s: any) => (s?.song ? { ...s.song, id: s.song.id, position: s.position, updatedAt: s.updatedAt } : s)).filter(Boolean));
        }
      })
      .catch(() => {})
      .finally(() => {
        setHeroLoading(false);
        setTrendingLoading(false);
        setNrLoading(false);
        setClLoading(false);
      });
  }, [user]);

  useEffect(() => {
    const fetchUnread = async () => {
      const token = await getStoredToken();
      if (!token) return;
      fetch(`https://www.theugmusic.com/api/admin/notifications?token=${encodeURIComponent(token)}`)
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) setUnreadCount(d.filter((n: any) => !n.read).length);
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
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
    artistId: s.artistId,
    albumId: s.albumId,
    startPosition: typeof s.position === "number" && s.position > 0 ? s.position : undefined,
  });

  const handlePlaySong = useCallback(
    (song: any) => setQueue([mapTrack(song)]),
    [setQueue],
  );

  const handleLikeSong = useCallback(async (song: any) => {
    const songId = song?.id;
    if (!songId) return;
    useLikedStore.getState().toggleLiked(songId);
    try {
      const result = await trpc.social.likeSong.mutate(songId);
      if (result && typeof result.liked === "boolean") {
        const next = new Set(useLikedStore.getState().likedIds);
        if (result.liked) next.add(songId);
        else next.delete(songId);
        useLikedStore.setState({ likedIds: next });
      }
    } catch {
      useLikedStore.getState().toggleLiked(songId);
    }
  }, []);

  const handleContinueResume = useCallback((item: any) => {
    const resumePos = typeof item.position === "number" && item.position > 0 ? item.position : undefined;
    let tracks: any[] = [mapTrack(item)];
    let startIndex = 0;

    // Restore the saved queue so "next"/"prev" and playlist/album order are preserved.
    if (item.queue) {
      try {
        const savedQueue = JSON.parse(item.queue);
        if (Array.isArray(savedQueue) && savedQueue.length > 0) {
          const mapped: any[] = savedQueue.map((t: any) => ({
            id: t.id, title: t.title, artist: t.artist, url: t.url, duration: t.duration,
            coverUrl: t.coverUrl, artistId: t.artistId, albumId: t.albumId,
          }));
          const idx = mapped.findIndex((t) => t.id === item.id);
          if (idx >= 0) {
            mapped[idx] = { ...mapped[idx], startPosition: resumePos };
            tracks = mapped;
            startIndex = idx;
          }
        }
      } catch {}
    }

    if (typeof item.shuffle === "boolean") setShuffle(item.shuffle);
    if (typeof item.repeat === "number") setRepeat(item.repeat);
    setQueue(tracks, startIndex);
  }, [setQueue, setShuffle, setRepeat]);

  const handleClearContinueListening = useCallback(() => {
    setContinueListening([]);
    trpc.sync.clearContinueListening.mutate().catch(() => {});
  }, []);

  const handleRemoveContinueItem = useCallback((songId: string) => {
    setContinueListening((prev) => prev.filter((s) => s.id !== songId));
    trpc.sync.removeContinueItem.mutate({ songId }).catch(() => {});
  }, []);

  const handlePlayList = useCallback(
    (songs: any[]) => setQueue(songs.map(mapTrack)),
    [setQueue],
  );

  const onHeroScroll = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    if (idx >= 0 && idx < heroSongs.length) setHeroIndex(idx);
  }, [heroSongs.length]);

  const onHeroTouchStart = () => (heroAutoAdvance.current = false);
  const onHeroTouchEnd = () => (heroAutoAdvance.current = true);

  const displayName = user?.name;
  const avatarLetter = displayName?.charAt(0)?.toUpperCase() ?? "L";

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>

      {/* â”€â”€ Header Bar â”€â”€ */}
      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            {user?.name ? (
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            ) : (
              <User size={18} color={COLORS.bg} />
            )}
          </View>
          <View style={styles.greetingWrap}>
            <Text style={[styles.greeting, { color: colors.whiteMuted }]}>
              {getGreeting()}{" "}
              <Text style={styles.greetingWave}>{/* wave */}</Text>
            </Text>
            <Text style={[styles.username, { color: colors.white }]}>
              {displayName?.split(" ")[0] ?? "Listener"}
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
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
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
        bounces={false}
      >
        {/* â”€â”€ Hero Carousel â”€â”€ */}
        <View style={styles.heroSection}>
          {heroLoading ? (
            <ShimmerBlock width={HERO_WIDTH} height={180} borderRadius={RADIUS.lg} />
          ) : heroSongs.length > 0 ? (
            <>
              <FlatList
                ref={heroFlatRef}
                data={heroSongs}
                keyExtractor={(item: any) => item.id}
                horizontal
                pagingEnabled
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
                    onSave={handleLikeSong}
                  />
                )}
              />
              <PagerDots total={heroSongs.length} active={heroIndex} />
            </>
          ) : null}
        </View>

        {/* â”€â”€ Made For You â”€â”€ */}
        <View style={styles.section}>
          <SectionHeader title="Made For You" />
          <FlatList
            data={MIX_CARDS}
            keyExtractor={(_, i) => `mix-${i}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W + GAP}
            decelerationRate="fast"
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

        {/* â”€â”€ Recommended For You â”€â”€ */}
        {forYou.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Recommended For You" />
            <FlatList
              data={forYou}
              keyExtractor={(item: any) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_W + GAP}
              decelerationRate="fast"
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => {
                const coverUrl = getCoverUrl(item);
                return (
                  <TouchableOpacity
                    style={[styles.trendingCard, { backgroundColor: colors.surface }]}
                    activeOpacity={0.7}
                    onPress={() => handlePlaySong(item)}
                  >
                    <View style={[styles.trendingArt, { backgroundColor: colors.surfaceHover }]}>
                      {coverUrl ? (
                        <Image source={{ uri: coverUrl }} style={styles.trendingArtImg} />
                      ) : (
                        <Music2 size={28} color={COLORS.gold} />
                      )}
                    </View>
                    <Text style={[styles.trendingTitle, { color: colors.white }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.trendingArtist} numberOfLines={1}>
                      {getArtistName(item)}
                    </Text>
                    <TouchableOpacity
                      style={styles.trendingPlayBtn}
                      onPress={() => handlePlaySong(item)}
                      hitSlop={HIT_SLOP}
                    >
                      <Play size={14} color="#FFC107" fill="#FFC107" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* â”€â”€ Continue Listening â”€â”€ */}
        {user && user.id !== "guest" && (
          <View style={styles.section}>
            <SectionHeader title="Continue Listening" onClear={handleClearContinueListening} />
            {clLoading ? (
              <View style={styles.skeletonRow}>
                <ShimmerBlock width={CARD_W} height={Math.min(SW * 0.25, 100)} />
                <View style={{ width: 10 }} />
                <ShimmerBlock width={CARD_W} height={Math.min(SW * 0.25, 100)} />
              </View>
            ) : continueListening.length > 0 ? (
              <FlatList
                data={continueListening}
                keyExtractor={(item: any) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_W + GAP}
                decelerationRate="fast"
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => {
                  const coverUrl = getCoverUrl(item);
                  const pos = typeof item.position === "number" ? item.position : 0;
                  const progress = item.duration > 0 ? Math.min(pos / item.duration, 1) : 0;
                  return (
                    <TouchableOpacity
                      style={[styles.continueCard, { backgroundColor: colors.surface }]}
                      activeOpacity={0.7}
                      onPress={() => handleContinueResume(item)}
                      onLongPress={() => handleRemoveContinueItem(item.id)}
                    >
                      <View style={[styles.continueArt, { backgroundColor: colors.surfaceHover }]}>
                        {coverUrl ? (
                          <Image source={{ uri: coverUrl }} style={styles.continueArtImg} />
                        ) : (
                          <Music2 size={28} color={COLORS.gold} />
                        )}
                      </View>
                      <View style={styles.continueInfo}>
                        <Text style={[styles.continueTitle, { color: colors.white }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.continueArtist} numberOfLines={1}>
                          {getArtistName(item)}{item.updatedAt ? ` · ${timeAgo(item.updatedAt)}` : ""}
                        </Text>
                      </View>
                      <View style={styles.continueBar}>
                        <View style={[styles.continueBarFill, { width: `${Math.round(progress * 100)}%` }]} />
                      </View>
                      {progress > 0 && (
                        <Text style={styles.continueProgress}>{formatClock(pos)} / {formatClock(item.duration)}</Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            ) : null}
          </View>
        )}

        {/* â”€â”€ Trending Now â”€â”€ */}
        <View style={styles.section}>
          <SectionHeader
            title="Trending Now"
            onSeeAll={() => navigation.navigate("CategoryPlaylist", { category: "Trending Now" })}
          />
          {trendingLoading ? (
            <View style={styles.skeletonRow}>
              <ShimmerBlock width={CARD_W} height={Math.min(SW * 0.45, 180)} />
              <View style={{ width: 10 }} />
              <ShimmerBlock width={CARD_W} height={Math.min(SW * 0.45, 180)} />
              <View style={{ width: 10 }} />
              <ShimmerBlock width={CARD_W} height={Math.min(SW * 0.45, 180)} />
            </View>
          ) : trending.length > 0 ? (
            <FlatList
              data={trending}
              keyExtractor={(item: any) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_W + GAP}
              decelerationRate="fast"
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => {
                const coverUrl = getCoverUrl(item);
                return (
                  <TouchableOpacity
                    style={[styles.trendingCard, { backgroundColor: colors.surface }]}
                    activeOpacity={0.7}
                    onPress={() => handlePlaySong(item)}
                  >
                    <View style={[styles.trendingArt, { backgroundColor: colors.surfaceHover }]}>
                      {coverUrl ? (
                        <Image source={{ uri: coverUrl }} style={styles.trendingArtImg} />
                      ) : (
                        <Music2 size={28} color={COLORS.gold} />
                      )}
                    </View>
                    <Text style={[styles.trendingTitle, { color: colors.white }]} numberOfLines={2}>
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
                        <Play size={14} color="#FFC107" fill="#FFC107" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          ) : null}
        </View>

        {/* â”€â”€ New Releases â”€â”€ */}
        <View style={styles.section}>
          <SectionHeader title="New Releases" />
          {nrLoading ? (
            <View style={styles.skeletonRow}>
              <ShimmerBlock width={CARD_W} height={Math.min(SW * 0.45, 180)} />
              <View style={{ width: 10 }} />
              <ShimmerBlock width={CARD_W} height={Math.min(SW * 0.45, 180)} />
              <View style={{ width: 10 }} />
              <ShimmerBlock width={CARD_W} height={Math.min(SW * 0.45, 180)} />
            </View>
          ) : newReleases.length > 0 ? (
            <FlatList
              data={newReleases}
              keyExtractor={(item: any) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_W + GAP}
              decelerationRate="fast"
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => {
                const coverUrl = getCoverUrl(item);
                return (
                  <TouchableOpacity
                    style={[styles.releaseCard, { backgroundColor: colors.surface }]}
                    activeOpacity={0.7}
                    onPress={() => handlePlaySong(item)}
                  >
                    <View style={[styles.releaseArt, { backgroundColor: colors.surfaceHover }]}>
                      {coverUrl ? (
                        <Image source={{ uri: coverUrl }} style={styles.releaseArtImg} />
                      ) : (
                        <Music2 size={28} color={COLORS.gold} />
                      )}
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    </View>
                    <Text style={[styles.releaseTitle, { color: colors.white }]} numberOfLines={2}>
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

        {/* â”€â”€ Made in Uganda â”€â”€ */}
        <View style={styles.section}>
          <SectionHeader
            title="Made in Uganda"
            onSeeAll={() => navigation.navigate("MadeInUganda")}
          />
          <View style={styles.ugandaGrid}>
            {MADE_IN_UGANDA.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.ugandaCard, { backgroundColor: colors.surface }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("MadeInUganda")}
              >
                <View style={styles.ugandaOverlay}>
                  <Text style={styles.ugandaEmoji}>{item.emoji}</Text>
                  <Text style={[styles.ugandaLabel, { color: colors.white }]} numberOfLines={2}>
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // â”€â”€ Header â”€â”€
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 0,
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
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
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

  // â”€â”€ Scroll â”€â”€
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },

  // â”€â”€ Section Header â”€â”€
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    marginTop: 2,
    paddingHorizontal: 8,
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
  sectionHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  clearAll: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  // â”€â”€ Section â”€â”€
  section: {
    marginBottom: 10,
  },

  // â”€â”€ Hero Carousel â”€â”€
  heroSection: {
    marginBottom: 10,
  },
  heroList: {
    paddingHorizontal: 0,
    gap: 0,
  },
  heroCard: {
    width: HERO_WIDTH,
    height: 180,
    marginHorizontal: 12,
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
    minWidth: 0,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
  },
  heroArtist: {
    color: COLORS.whiteMuted,
    fontSize: 12,
    marginTop: 2,
    flexShrink: 1,
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

  // â”€â”€ Pager Dots â”€â”€
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

  // â”€â”€ Made For You â”€â”€
  mixList: {
    paddingHorizontal: H_PAD,
    gap: GAP,
  },
  mixCard: {
    width: CARD_W,
    height: CARD_W,
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

  // â”€â”€ Continue Listening â”€â”€
  continueCard: {
    width: CARD_W,
    height: Math.min(SW * 0.25, 100),
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },
  continueArt: {
    width: CARD_W,
    height: CARD_W * 1.1,
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
    width: "0%",
    height: "100%",
    backgroundColor: COLORS.gold,
  },
  continueProgress: {
    position: "absolute",
    bottom: 6,
    right: 6,
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 1 },
  },

  // â”€â”€ Trending Now â”€â”€
  trendingCard: {
    width: CARD_W,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    position: "relative",
  },
  trendingArt: {
    width: CARD_W,
    height: CARD_W,
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
    paddingRight: 30,
  },
  trendingArtist: {
    color: COLORS.gold,
    fontSize: 10,
    marginTop: 2,
    paddingRight: 30,
  },
  playCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
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
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  trendingPlayIcon: {
    marginLeft: 1,
  },

  // â”€â”€ New Releases â”€â”€
  releaseCard: {
    width: CARD_W,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
  },
  releaseArt: {
    width: CARD_W,
    height: CARD_W,
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
    paddingRight: 30,
  },
  releaseArtist: {
    color: COLORS.gold,
    fontSize: 10,
    marginTop: 2,
    paddingRight: 30,
  },

  // â”€â”€ Made in Uganda â”€â”€
  ugandaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  ugandaCard: {
    width: CARD_W,
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

  // â”€â”€ Skeleton â”€â”€
  skeletonRow: {
    flexDirection: "row",
  },

  // â”€â”€ Misc â”€â”€
  horizontalList: {
    paddingHorizontal: H_PAD,
    gap: GAP,
  },
  bottomSpacer: {
    height: 70,
  },
});
