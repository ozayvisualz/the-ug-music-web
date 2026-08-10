export const COLORS = {
  bg: "#09090B",
  surface: "#18181D",
  border: "#27272A",
  gold: "#EAB308",
  goldMuted: "rgba(234,179,8,0.15)",
  white: "#FFFFFF",
  text: "#A1A1AA",
  textMuted: "#71717A",
  red: "#EF4444",
  green: "#10B981",
  blue: "#3B82F6",
};

export const FONTS = {
  bold: { fontSize: 18, fontWeight: "800" as const, color: COLORS.white },
  heading: { fontSize: 28, fontWeight: "800" as const, color: COLORS.white },
  title: { fontSize: 22, fontWeight: "700" as const, color: COLORS.white },
  body: { fontSize: 14, color: COLORS.text },
  caption: { fontSize: 12, color: COLORS.textMuted },
  label: {
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    color: COLORS.textMuted,
  },
};

export const SHADOWS = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  glow: {
    shadowColor: "#EAB308",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
};
