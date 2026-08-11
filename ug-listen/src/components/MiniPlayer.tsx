import { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Music2, Play, Pause, SkipForward } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SPRING, HIT_SLOP } from "../constants/theme";
import { useQueueStore } from "../store/playerStore";

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
  onExpand?: () => void;
};

export default function MiniPlayer({ onExpand }: Props) {
  const queue = useQueueStore((s) => s.queue);
  const currentIndex = useQueueStore((s) => s.currentIndex);
  const next = useQueueStore((s) => s.next);
  const prev = useQueueStore((s) => s.prev);

  const [playing, setPlaying] = useState(true);
  const [position, setPosition] = useState(0);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(80);
  const progress = useSharedValue(0);

  const hasTrack = currentIndex >= 0 && !!queue[currentIndex];
  const track = hasTrack ? queue[currentIndex] : null;
  const duration = track?.duration || 180;

  useEffect(() => {
    if (hasTrack) {
      translateY.value = withSpring(0, SPRING.gentle);
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withSpring(80, SPRING.gentle);
      opacity.value = withTiming(0, { duration: 300 });
    }
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
    progress.value = withTiming(duration > 0 ? position / duration : 0, {
      duration: 80,
    });
  }, [position, duration]);

  const handleExpand = useCallback(() => {
    try {
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onExpand?.();
  }, [onExpand]);

  const handleSkipNext = useCallback(() => {
    try {
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const n = next();
    if (n) setPosition(0);
  }, [next]);

  const handleSkipPrev = useCallback(() => {
    try {
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const p = prev();
    if (p) setPosition(0);
  }, [prev]);

  const togglePlay = useCallback(() => {
    try {
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setPlaying((p) => !p);
  }, []);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-25, 25])
    .failOffsetY([-10, 10])
    .minDistance(30)
    .onEnd((e) => {
      if (e.translationX < -45) {
        runOnJS(handleSkipNext)();
      } else if (e.translationX > 45) {
        runOnJS(handleSkipPrev)();
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handleExpand)();
  });

  const composed = Gesture.Simultaneous(swipeGesture, tapGesture);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!hasTrack || !track) return null;

  return (
    <Animated.View style={[styles.wrapper, containerStyle]}>
      <GestureDetector gesture={composed}>
        <View style={styles.container}>
          <View style={styles.row}>
            <View style={styles.artwork}>
              {track.coverUrl ? (
                <Image
                  source={{ uri: track.coverUrl }}
                  style={styles.artworkImage}
                />
              ) : (
                <View style={styles.artworkGradient}>
                  <Music2 size={18} color={COLORS.bg} />
                </View>
              )}
            </View>

            <View style={styles.textArea}>
              <Text style={styles.title} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {track.artist}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.playBtn,
                playing ? styles.playBtnActive : styles.playBtnBorder,
              ]}
              onPress={togglePlay}
              hitSlop={HIT_SLOP}
              activeOpacity={0.7}
            >
              {playing ? (
                <Pause size={12} color={COLORS.bg} />
              ) : (
                <Play size={12} color={COLORS.gold} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkipNext}
              hitSlop={HIT_SLOP}
              activeOpacity={0.7}
            >
              <SkipForward size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 52,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.sm,
    zIndex: 50,
  },
  container: {
    backgroundColor: "rgba(24,24,29,0.95)",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.3)",
    height: 52,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingLeft: SPACING.xs,
  },
  artwork: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
  },
  artworkImage: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
  },
  artworkGradient: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: {
    flex: 1,
    marginLeft: SPACING.sm,
    marginRight: SPACING.xs,
  },
  title: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
  },
  artist: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnActive: {
    backgroundColor: COLORS.gold,
  },
  playBtnBorder: {
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },
  skipBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  progressFill: {
    height: 1,
    backgroundColor: COLORS.gold,
  },
});
