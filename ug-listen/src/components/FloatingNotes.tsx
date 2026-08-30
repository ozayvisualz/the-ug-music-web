import { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Dimensions, AccessibilityInfo } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  Extrapolation,
} from "react-native-reanimated";

const { height: SH } = Dimensions.get("window");

const NOTE_CHARS = ["♪", "♫", "♬", "🎵", "🎶"];

type Bubble = {
  id: number;
  char: string;
  x: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
  rotation: number;
  layer: 0 | 1 | 2;
};

function generateBubbles(count: number): Bubble[] {
  const arr: Bubble[] = [];
  for (let i = 0; i < count; i++) {
    const layer = (i % 3) as 0 | 1 | 2;
    arr.push({
      id: i,
      char: NOTE_CHARS[i % NOTE_CHARS.length],
      x: Math.random() * 100,
      size: 11 + Math.random() * 12 + layer * 3.5,
      opacity: 0.1 + Math.random() * 0.14 + layer * 0.05,
      duration: 9000 + Math.random() * 12000 - layer * 2200,
      delay: Math.random() * 7000,
      drift: 8 + Math.random() * (16 + layer * 10),
      rotation: Math.random() * 360,
      layer,
    });
  }
  return arr;
}

function FloatingNote({ bubble, reduceMotion, height }: { bubble: Bubble; reduceMotion: boolean; height: number }) {
  const rise = useSharedValue(0);
  const sway = useSharedValue(0);
  const rot = useSharedValue(bubble.rotation);

  useEffect(() => {
    if (reduceMotion) {
      rise.value = 0.35 + (bubble.id % 6) * 0.09;
      return;
    }
    rise.value = withDelay(bubble.delay, withRepeat(withTiming(1, { duration: bubble.duration, easing: Easing.linear }), -1, false));
    sway.value = withDelay(
      bubble.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: bubble.duration / 2, easing: Easing.inOut(Easing.quad) }),
          withTiming(-1, { duration: bubble.duration / 2, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
    rot.value = withDelay(bubble.delay, withRepeat(withTiming(bubble.rotation + 180, { duration: bubble.duration * 1.5, easing: Easing.linear }), -1, false));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(rise.value, [0, 0.12, 0.8, 1], [0, bubble.opacity, bubble.opacity, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(rise.value, [0, 1], [height + 40, -40], Extrapolation.CLAMP) },
      { translateX: sway.value * bubble.drift },
      { rotate: `${rot.value}deg` },
      { scale: interpolate(rise.value, [0, 0.5, 1], [0.85, 1, 1.12], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.Text style={[styles.bubble, { left: `${bubble.x}%`, fontSize: bubble.size }, style]}>
      {bubble.char}
    </Animated.Text>
  );
}

/**
 * Decorative floating music-note bubbles for screen backgrounds.
 * Renders an absolute-fill, non-interactive layer (safe to drop anywhere).
 */
export default function FloatingNotes({
  count = 34,
  reduceMotion,
  height,
}: {
  count?: number;
  reduceMotion?: boolean;
  height?: number;
}) {
  const [motionReduced, setMotionReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setMotionReduced);
  }, []);

  const shouldReduce = reduceMotion ?? motionReduced;
  const H = height ?? SH;
  const bubbles = useMemo(() => generateBubbles(count), [count]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bubbles.map((b) => (
        <FloatingNote key={b.id} bubble={b} reduceMotion={shouldReduce} height={H} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    top: 0,
    color: "#EAB308",
    textShadowColor: "rgba(234,179,8,0.8)",
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
    fontWeight: "700",
  },
});
