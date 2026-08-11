import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  FlatList,
  StatusBar,
  PanResponder,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  withRepeat,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import {
  Music2,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Heart,
  Download,
  ListPlus,
  Share2,
  ChevronDown,
  Ellipsis,
  X,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SPRING } from "../constants/theme";
import { useQueueStore, type Track } from "../store/playerStore";

let LinearGradient: any = View;
try {
  const LG = require("expo-linear-gradient");
  LinearGradient = LG.LinearGradient;
} catch {}

let Haptics: any = null;
try {
  Haptics = require("expo-haptics");
} catch {}

type Props = {
  onCollapse?: () => void;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const ARTWORK_SIZE = Math.min(240, SCREEN_WIDTH - 100);

const GLOW_COLORS = [
  "rgba(234,179,8,0.3)",
  "rgba(234,179,8,0.15)",
  "rgba(200,150,20,0.2)",
  "rgba(234,179,8,0.25)",
];

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function FullPlayer({ onCollapse }: Props) {
  const queue = useQueueStore((s) => s.queue);
  const currentIndex = useQueueStore((s) => s.currentIndex);
  const storeNext = useQueueStore((s) => s.next);
  const storePrev = useQueueStore((s) => s.prev);

  const [playing, setPlaying] = useState(true);
  const [position, setPosition] = useState(0);
  const [tab, setTab] = useState<"lyrics" | "queue" | "comments">("lyrics");
  const [liked, setLiked] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<0 | 1 | 2>(0);

  const cardTranslateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const isSeeking = useSharedValue(false);
  const seekProgress = useSharedValue(0);
  const seekBubbleX = useSharedValue(0);
  const rotation = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  const seekBarRef = useRef<View>(null);
  const seekBarWidth = useRef(1);
  const positionRef = useRef(position);
  positionRef.current = position;

  const hasTrack = currentIndex >= 0 && !!queue[currentIndex];
  const track = hasTrack ? queue[currentIndex] : null;
  const duration = track?.duration || 180;

  const remainingQueue = useMemo(() => {
    if (!hasTrack) return [];
    return queue.slice(currentIndex + 1);
  }, [queue, currentIndex, hasTrack]);

  useEffect(() => {
    if (!hasTrack) return;

    cardTranslateY.value = withSpring(0, SPRING.gentle);
    backdropOpacity.value = withTiming(1, { duration: 350 });

    rotation.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );
    glowPulse.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    try {
      StatusBar.setBarStyle("light-content");
    } catch {}

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(glowPulse);
    };
  }, [hasTrack]);

  useEffect(() => {
    if (!playing || !track) return;
    const interval = setInterval(() => {
      setPosition((p) => {
        const next = p + 0.05;
        return next >= duration ? 0 : next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [playing, track, duration]);

  useEffect(() => {
    if (!isSeeking.value) {
      seekProgress.value = withTiming(duration > 0 ? position / duration : 0, {
        duration: 80,
      });
    }
  }, [position, duration]);

  const dismiss = useCallback(() => {
    cardTranslateY.value = withSpring(
      SCREEN_HEIGHT,
      SPRING.gentle,
      (finished) => {
        if (finished) {
          runOnJS(onCollapse)?.();
        }
      }
    );
    backdropOpacity.value = withTiming(0, { duration: 300 });
  }, [onCollapse]);

  const handleCollapse = useCallback(() => {
    try {
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    dismiss();
  }, [dismiss]);

  const togglePlay = useCallback(() => {
    try {
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setPlaying((p) => !p);
  }, []);

  const skipNext = useCallback(() => {
    try {
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const n = storeNext();
    if (n) setPosition(0);
  }, [storeNext]);

  const skipPrev = useCallback(() => {
    try {
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const p = storePrev();
    if (p) setPosition(0);
  }, [storePrev]);

  const toggleLike = useCallback(() => {
    try {
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setLiked((l) => !l);
  }, []);

  const toggleShuffle = useCallback(() => {
    try {
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setShuffleOn((s) => !s);
  }, []);

  const toggleRepeat = useCallback(() => {
    try {
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setRepeatMode((r) => ((r + 1) % 3) as 0 | 1 | 2);
  }, []);

  const seekResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isSeeking.value = true;
        const x = Math.max(0, Math.min(evt.nativeEvent.locationX, seekBarWidth.current));
        const pct = x / seekBarWidth.current;
        seekProgress.value = pct;
        seekBubbleX.value = x;
        try {
          Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      },
      onPanResponderMove: (evt) => {
        const x = Math.max(0, Math.min(evt.nativeEvent.locationX, seekBarWidth.current));
        const pct = x / seekBarWidth.current;
        seekProgress.value = pct;
        seekBubbleX.value = x;
      },
      onPanResponderRelease: () => {
        isSeeking.value = false;
        runOnJS(setPosition)(seekProgress.value * duration);
      },
      onPanResponderTerminate: () => {
        isSeeking.value = false;
      },
    })
  ).current;

  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        cardTranslateY.value = e.translationY;
        backdropOpacity.value = interpolate(
          e.translationY,
          [0, SCREEN_HEIGHT],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 500) {
        runOnJS(dismiss)();
      } else {
        cardTranslateY.value = withSpring(0, SPRING.gentle);
        backdropOpacity.value = withTiming(1, { duration: 300 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const filledStyle = useAnimatedStyle(() => ({
    width: `${seekProgress.value * 100}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${seekProgress.value * 100}%`,
    opacity: isSeeking.value ? 1 : interpolate(seekProgress.value, [0, 1], [0.6, 1]),
    transform: [{ scale: isSeeking.value ? 1.4 : 1 }],
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: isSeeking.value ? 1 : 0,
    left: seekBubbleX.value - 22,
    bottom: 22,
  }));

  const artworkStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glow1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(glowPulse.value, [0, 1], [-30, 30]) },
      { translateY: interpolate(glowPulse.value, [0, 1], [-10, 10]) },
      { scale: interpolate(glowPulse.value, [0, 1], [1, 1.15]) },
    ],
    opacity: interpolate(glowPulse.value, [0, 0.5, 1], [0.6, 1, 0.6]),
  }));

  const glow2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(glowPulse.value, [0, 1], [20, -20]) },
      { translateY: interpolate(glowPulse.value, [0, 1], [15, -15]) },
      { scale: interpolate(glowPulse.value, [0, 1], [1.1, 0.9]) },
    ],
    opacity: interpolate(glowPulse.value, [0, 0.5, 1], [0.4, 0.7, 0.4]),
  }));

  const colorIndex = currentIndex % GLOW_COLORS.length;
  const glowColor = GLOW_COLORS[Math.max(0, colorIndex)];

  if (!hasTrack || !track) return null;

  const seekTimeAtPosition = seekProgress.value * duration;

  const renderQueueItem = ({ item, index }: { item: Track; index: number }) => (
    <View style={styles.queueItem}>
      <View style={styles.queueArtwork}>
        {item.coverUrl ? (
          <Image
            source={{ uri: item.coverUrl }}
            style={styles.queueArtworkImage}
          />
        ) : (
          <View style={styles.queueArtworkPlaceholder}>
            <Music2 size={12} color={COLORS.textMuted} />
          </View>
        )}
      </View>
      <View style={styles.queueInfo}>
        <Text style={styles.queueTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.queueArtist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <TouchableOpacity style={styles.queueRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <X size={14} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleCollapse}
          activeOpacity={1}
        />
      </Animated.View>

      <Animated.View style={[styles.card, cardStyle]}>
        <GestureDetector gesture={swipeGesture}>
          <View style={styles.dragArea}>
            <View style={styles.dragPill} />
          </View>
        </GestureDetector>

        <View style={styles.glowContainer}>
          <Animated.View
            style={[
              styles.glowCircle,
              { backgroundColor: glowColor },
              glow1Style,
            ]}
          />
          <Animated.View
            style={[
              styles.glowCircleSmall,
              {
                backgroundColor: GLOW_COLORS[
                  (colorIndex + 1) % GLOW_COLORS.length
                ],
              },
              glow2Style,
            ]}
          />
        </View>

        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleCollapse}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronDown size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {track.title}
          </Text>
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ellipsis size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.artworkContainer}>
          <Animated.View style={[styles.artwork, artworkStyle]}>
            <View style={styles.artworkInner}>
              {track.coverUrl ? (
                <Image
                  source={{ uri: track.coverUrl }}
                  style={styles.artworkImage}
                />
              ) : (
                <View style={styles.artworkPlaceholder}>
                  <Music2 size={60} color={COLORS.bg} />
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {track.title}
          </Text>
          <View style={styles.artistRow}>
            <Text style={styles.artistName} numberOfLines={1}>
              {track.artist}
            </Text>
            <TouchableOpacity
              onPress={toggleLike}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Heart
                size={16}
                color={liked ? COLORS.red : COLORS.textMuted}
                fill={liked ? COLORS.red : "none"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.seekSection}>
          <View
            ref={seekBarRef}
            style={styles.seekTrackOuter}
            onLayout={(e) => {
              seekBarWidth.current = e.nativeEvent.layout.width;
            }}
            {...seekResponder.panHandlers}
          >
            <View style={styles.seekTrack}>
              <Animated.View style={[styles.seekFill, filledStyle]} />
              <Animated.View style={[styles.seekThumb, thumbStyle]} />
            </View>
            <Animated.View style={[styles.seekBubble, bubbleStyle]}>
              <Text style={styles.seekBubbleText}>
                {formatTime(seekTimeAtPosition)}
              </Text>
            </Animated.View>
          </View>
          <View style={styles.seekTimes}>
            <Text style={styles.seekTimeText}>
              {formatTime(isSeeking.value ? seekTimeAtPosition : position)}
            </Text>
            <Text style={styles.seekTimeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={toggleShuffle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Shuffle
              size={18}
              color={shuffleOn ? COLORS.gold : COLORS.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={skipPrev}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SkipBack size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playBtn} onPress={togglePlay} activeOpacity={0.8}>
            {playing ? (
              <Pause size={26} color={COLORS.bg} />
            ) : (
              <Play size={26} color={COLORS.bg} style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={skipNext}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SkipForward size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleRepeat}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Repeat
              size={18}
              color={
                repeatMode > 0 ? COLORS.gold : COLORS.textMuted
              }
            />
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
            <Heart
              size={18}
              color={liked ? COLORS.red : COLORS.textMuted}
              fill={liked ? COLORS.red : "none"}
            />
            <Text style={styles.actionLabel}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Download size={18} color={COLORS.textMuted} />
            <Text style={styles.actionLabel}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <ListPlus size={18} color={COLORS.textMuted} />
            <Text style={styles.actionLabel}>Playlist</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Share2 size={18} color={COLORS.textMuted} />
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRow}>
          {(["lyrics", "queue", "comments"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabPill, tab === t && styles.tabPillActive]}
              onPress={() => setTab(t)}
            >
              <Text
                style={[styles.tabText, tab === t && styles.tabTextActive]}
              >
                {t === "lyrics"
                  ? "Lyrics"
                  : t === "queue"
                    ? "Queue"
                    : "Comments"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {tab === "lyrics" && (
            <ScrollView
              style={styles.tabScroll}
              contentContainerStyle={styles.tabScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.lyricsPlaceholder}>
                Lyrics not available
              </Text>
            </ScrollView>
          )}
          {tab === "queue" && (
            <FlatList
              data={remainingQueue}
              keyExtractor={(item) => item.id}
              renderItem={renderQueueItem}
              style={styles.tabScroll}
              contentContainerStyle={styles.queueListContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.lyricsPlaceholder}>
                  No upcoming songs
                </Text>
              }
            />
          )}
          {tab === "comments" && (
            <View style={styles.tabScrollContent}>
              <Text style={styles.lyricsPlaceholder}>
                Comments coming soon
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSafe} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(9,9,11,0.85)",
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    paddingTop: 0,
  },
  dragArea: {
    alignItems: "center",
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    zIndex: 10,
  },
  dragPill: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    top: 60,
    alignItems: "center",
    overflow: "hidden",
  },
  glowCircle: {
    position: "absolute",
    top: 80,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  glowCircleSmall: {
    position: "absolute",
    top: 120,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    paddingHorizontal: SPACING.md,
    zIndex: 1,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    marginHorizontal: SPACING.sm,
  },
  artworkContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xs,
    zIndex: 1,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: RADIUS.xl,
    ...{
      shadowColor: COLORS.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 32,
      elevation: 16,
    },
  },
  artworkInner: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
  },
  artworkImage: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: RADIUS.xl,
  },
  artworkPlaceholder: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  songInfo: {
    alignItems: "center",
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xxxl,
    zIndex: 1,
  },
  songTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  artistName: {
    color: COLORS.text,
    fontSize: 14,
    textAlign: "center",
    flex: 1,
  },
  seekSection: {
    width: "100%",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    zIndex: 1,
  },
  seekTrackOuter: {
    position: "relative",
  },
  seekTrack: {
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    justifyContent: "center",
  },
  seekFill: {
    height: 4,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
    position: "absolute",
    left: 0,
    top: 0,
  },
  seekThumb: {
    position: "absolute",
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.gold,
    marginLeft: -8,
  },
  seekBubble: {
    position: "absolute",
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  seekBubbleText: {
    color: COLORS.bg,
    fontSize: 11,
    fontWeight: "700",
  },
  seekTimes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  seekTimeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.sm,
    zIndex: 1,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    zIndex: 1,
  },
  actionBtn: {
    alignItems: "center",
    gap: 4,
  },
  actionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    padding: 3,
    marginHorizontal: SPACING.lg,
    zIndex: 1,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    alignItems: "center",
  },
  tabPillActive: {
    backgroundColor: COLORS.gold,
  },
  tabText: {
    color: COLORS.textMuted,
    fontWeight: "600",
    fontSize: 12,
  },
  tabTextActive: {
    color: COLORS.bg,
  },
  tabContent: {
    flex: 1,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    zIndex: 1,
  },
  tabScroll: {
    flex: 1,
  },
  tabScrollContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  lyricsPlaceholder: {
    color: COLORS.textDisabled,
    fontSize: 13,
    textAlign: "center",
    marginTop: 32,
  },
  queueListContent: {
    paddingBottom: SPACING.lg,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    paddingRight: SPACING.xs,
  },
  queueArtwork: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
  },
  queueArtworkImage: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
  },
  queueArtworkPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  queueInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  queueTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "500",
  },
  queueArtist: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  queueRemove: {
    padding: 4,
    marginLeft: SPACING.xs,
  },
  bottomSafe: {
    height: 70,
    zIndex: 1,
  },
});
