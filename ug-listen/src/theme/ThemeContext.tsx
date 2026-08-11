import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

export type ThemeMode = "system" | "dark" | "light";

export interface ThemeTokens {
  bg: string;
  bgLight: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderLight: string;
  gold: string;
  goldDark: string;
  goldMuted: string;
  goldGlow: string;
  white: string;
  whiteMuted: string;
  text: string;
  textMuted: string;
  textDisabled: string;
  red: string;
  redMuted: string;
  green: string;
  greenMuted: string;
  blue: string;
  blueMuted: string;
  purple: string;
  orange: string;
  pink: string;
  teal: string;
}

const DARK: ThemeTokens = {
  bg: "#09090B",
  bgLight: "#0F0F13",
  surface: "#18181D",
  surfaceHover: "#222228",
  border: "#27272A",
  borderLight: "#3F3F46",
  gold: "#EAB308",
  goldDark: "#A16207",
  goldMuted: "rgba(234,179,8,0.12)",
  goldGlow: "rgba(234,179,8,0.25)",
  white: "#FFFFFF",
  whiteMuted: "rgba(255,255,255,0.6)",
  text: "#A1A1AA",
  textMuted: "#71717A",
  textDisabled: "#52525B",
  red: "#EF4444",
  redMuted: "rgba(239,68,68,0.15)",
  green: "#10B981",
  greenMuted: "rgba(16,185,129,0.15)",
  blue: "#3B82F6",
  blueMuted: "rgba(59,130,246,0.15)",
  purple: "#A855F7",
  orange: "#F97316",
  pink: "#EC4899",
  teal: "#14B8A6",
};

const LIGHT: ThemeTokens = {
  bg: "#FFFFFF",
  bgLight: "#F8F8FA",
  surface: "#F2F2F5",
  surfaceHover: "#E8E8ED",
  border: "#E0E0E5",
  borderLight: "#C8C8CF",
  gold: "#CA8A04",
  goldDark: "#A16207",
  goldMuted: "rgba(202,138,4,0.10)",
  goldGlow: "rgba(202,138,4,0.15)",
  white: "#18181D",
  whiteMuted: "rgba(24,24,29,0.5)",
  text: "#52525B",
  textMuted: "#8E8E98",
  textDisabled: "#B0B0B8",
  red: "#DC2626",
  redMuted: "rgba(220,38,38,0.10)",
  green: "#059669",
  greenMuted: "rgba(5,150,105,0.10)",
  blue: "#2563EB",
  blueMuted: "rgba(37,99,235,0.10)",
  purple: "#7C3AED",
  orange: "#EA580C",
  pink: "#DB2777",
  teal: "#0D9488",
};

const THEME_KEY = "theme_mode";

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeTokens;
  isDark: boolean;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  colors: DARK,
  isDark: true,
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then((v) => {
      if (v === "dark" || v === "light" || v === "system") setModeState(v);
      setLoaded(true);
    });
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    SecureStore.setItemAsync(THEME_KEY, m);
  };

  const isDark = mode === "dark" || (mode === "system" && systemScheme !== "light");
  const colors = isDark ? DARK : LIGHT;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { DARK, LIGHT };
