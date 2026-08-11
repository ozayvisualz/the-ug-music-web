import { Easing } from "react-native-reanimated";

export const COLORS = {
  bg: "#09090B", bgLight: "#0F0F13", surface: "#18181D", surfaceHover: "#222228",
  border: "#27272A", borderLight: "#3F3F46", gold: "#EAB308", goldDark: "#A16207",
  goldMuted: "rgba(234,179,8,0.12)", goldGlow: "rgba(234,179,8,0.25)",
  white: "#FFFFFF", whiteMuted: "rgba(255,255,255,0.6)",
  text: "#A1A1AA", textMuted: "#71717A", textDisabled: "#52525B",
  red: "#EF4444", redMuted: "rgba(239,68,68,0.15)", green: "#10B981",
  greenMuted: "rgba(16,185,129,0.15)", blue: "#3B82F6", blueMuted: "rgba(59,130,246,0.15)",
  purple: "#A855F7", orange: "#F97316", pink: "#EC4899", teal: "#14B8A6",
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 };
export const SPRING = {
  gentle: { damping: 15, stiffness: 150, mass: 0.5 },
  snappy: { damping: 12, stiffness: 200, mass: 0.3 },
  bouncy: { damping: 8, stiffness: 100, mass: 0.8 },
};
export const TIMING = { fast: { duration: 200, easing: Easing.out(Easing.ease) }, normal: { duration: 350, easing: Easing.out(Easing.ease) }, slow: { duration: 500, easing: Easing.out(Easing.ease) } };
export const SHADOWS = {
  card: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  glow: { shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 },
  floating: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
};
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
