import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  PanResponder,
} from "react-native";
import {
  Music2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Download,
  ListPlus,
  Share2,
  ChevronDown,
  X,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
  Extrapolate,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useQueueStore } from "../store/playerStore";
import { COLORS } from "../constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type TabKey = "lyrics" | "queue" | "comments";

interface FullPlayerProps {
  onCollapse: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function FullPlayer({ onCollapse }: FullPlayerProps) {
  const { queue, currentIndex, next, prev, clear } = useQueueStore();
  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>("lyrics");
  const [isLiked, setIsLiked] = useState(false);

  const playlist = useRef(queue.map((t) => t.title));

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (!currentTrack) return prev;
        const nextTime = prev + 0.05;
        if (nextTime >= currentTrack.duration) {
          setIsPlaying(false);
          return 0;
        }
        return nextTime;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(true);
  }, [currentTrack?.id]);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const handleNext = useCallback(() => {
    const track = next();
    if (!track) {
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [next]);

  const handlePrev = useCallback(() => {
    if (currentTime > 3) {
      setCurrentTime(0);
      return;
    }
    prev();
  }, [currentTime, prev]);

  const toggleLike = useCallback(() => {
    setIsLiked((p) => !p);
  }, []);

  const rotateValue = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      rotateValue.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotateValue.value = rotateValue.value;
    }
  }, [isPlaying]);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateValue.value}deg` }],
  }));

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        opacity.value = interpolate(
          e.translationY,
          [0, SCREEN_HEIGHT * 0.2],
          [1, 0.7],
          Extrapolate.CLAMP
        );
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(onCollapse)();
          }
        });
      } else {
        translateY.value = withTiming(0, { duration: 300 });
        opacity.value = withTiming(1, { duration: 300 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!currentTrack) return null;

  const duration = currentTrack.duration || 180;
  const progress = duration > 0 ? currentTime / duration : 0;

  const TABS: { key: TabKey; label: string }[] = [
    { key: "lyrics", label: "Lyrics" },
    { key: "queue", label: "Queue" },
    { key: "comments", label: "Comments" },
  ];

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onCollapse}
        />

        <View style={styles.header}>
          <TouchableOpacity onPress={onCollapse} style={styles.headerButton}>
            <ChevronDown size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Now Playing
          </Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentInner}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.artworkContainer}>
            <Animated.View style={[styles.artworkWrapper, rotateStyle]}>
              <View style={styles.artwork}>
                <Music2 size={80} color={COLORS.textMuted} />
              </View>
            </Animated.View>
          </View>

          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={2}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          <View style={styles.seekContainer}>
            <View style={styles.seekBar}>
              <View style={styles.seekTrack} />
              <View style={[styles.seekProgress, { width: `${progress * 100}%` }]} />
              <View
                style={[
                  styles.seekThumb,
                  { left: `${progress * 100}%` },
                ]}
              />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.controlButton}>
              <Shuffle size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={handlePrev}>
              <SkipBack size={26} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playCircle}
              onPress={togglePlay}
              activeOpacity={0.8}
            >
              {isPlaying ? (
                <Pause size={30} color={COLORS.bg} />
              ) : (
                <Play size={30} color={COLORS.bg} style={{ marginLeft: 3 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={handleNext}>
              <SkipForward size={26} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton}>
              <Repeat size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={toggleLike}>
              <Heart
                size={20}
                color={isLiked ? COLORS.gold : COLORS.textMuted}
                fill={isLiked ? COLORS.gold : "transparent"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Download size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <ListPlus size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Share2 size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabsRow}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  activeTab === tab.key && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab.key && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tabContent}>
            {activeTab === "lyrics" && (
              <View style={styles.tabPlaceholder}>
                <Music2 size={40} color={COLORS.border} />
                <Text style={styles.tabPlaceholderText}>
                  Lyrics not available for this track
                </Text>
              </View>
            )}
            {activeTab === "queue" && (
              <View style={styles.queueList}>
                <Text style={styles.queueLabel}>Now Playing</Text>
                <View style={styles.queueItem}>
                  <Music2 size={16} color={COLORS.gold} />
                  <Text style={styles.queueItemTitleActive} numberOfLines={1}>
                    {currentTrack.title}
                  </Text>
                  <Text style={styles.queueItemArtist} numberOfLines={1}>
                    {currentTrack.artist}
                  </Text>
                </View>
                <Text style={styles.queueLabel}>Up Next</Text>
                {queue.slice(currentIndex + 1).map((t, i) => (
                  <View key={`${t.id}-${i}`} style={styles.queueItem}>
                    <Text style={styles.queueItemIndex}>{i + 1}</Text>
                    <View style={styles.queueItemInfo}>
                      <Text style={styles.queueItemTitle} numberOfLines={1}>
                        {t.title}
                      </Text>
                      <Text style={styles.queueItemArtist} numberOfLines={1}>
                        {t.artist}
                      </Text>
                    </View>
                  </View>
                ))}
                {currentIndex + 1 >= queue.length && (
                  <Text style={styles.tabPlaceholderText}>
                    No more tracks in queue
                  </Text>
                )}
              </View>
            )}
            {activeTab === "comments" && (
              <View style={styles.tabPlaceholder}>
                <Text style={styles.tabPlaceholderText}>
                  Comments coming soon
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    zIndex: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    alignItems: "center",
    paddingBottom: 40,
  },
  artworkContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  artworkWrapper: {
    width: 250,
    height: 250,
    borderRadius: 16,
    overflow: "hidden",
  },
  artwork: {
    width: 250,
    height: 250,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  trackInfo: {
    alignItems: "center",
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
    textAlign: "center",
  },
  trackArtist: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 6,
    textAlign: "center",
  },
  seekContainer: {
    width: SCREEN_WIDTH - 48,
    marginBottom: 24,
  },
  seekBar: {
    height: 40,
    justifyContent: "center",
    position: "relative",
  },
  seekTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  seekProgress: {
    position: "absolute",
    top: 18,
    left: 0,
    height: 4,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
  },
  seekThumb: {
    position: "absolute",
    top: 13,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.gold,
    marginLeft: -7,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 20,
  },
  controlButton: {
    padding: 8,
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    gap: 32,
  },
  actionButton: {
    padding: 8,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    marginHorizontal: 24,
    alignSelf: "stretch",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: COLORS.goldMuted,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.gold,
  },
  tabContent: {
    width: SCREEN_WIDTH - 48,
    minHeight: 160,
  },
  tabPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  tabPlaceholderText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 12,
    textAlign: "center",
  },
  queueList: {
    paddingVertical: 8,
  },
  queueLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 8,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  queueItemIndex: {
    width: 24,
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  queueItemInfo: {
    flex: 1,
    marginLeft: 8,
  },
  queueItemTitle: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "500",
  },
  queueItemTitleActive: {
    fontSize: 14,
    color: COLORS.gold,
    fontWeight: "600",
    flex: 1,
    marginLeft: 8,
  },
  queueItemArtist: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
