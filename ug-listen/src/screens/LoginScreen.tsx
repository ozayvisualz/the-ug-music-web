import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Dimensions,
  AccessibilityInfo,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Music2 } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  Extrapolation,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { COLORS, SPRING } from "../constants/theme";
import { login, register } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeContext";

const { width: SW, height: SH } = Dimensions.get("window");
const CARD_MAX = 384;

// ---------------------------------------------------------------------------
// Floating music-note bubbles
// ---------------------------------------------------------------------------

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

function FloatingNote({ bubble, reduceMotion }: { bubble: Bubble; reduceMotion: boolean }) {
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
      { translateY: interpolate(rise.value, [0, 1], [SH + 40, -40], Extrapolation.CLAMP) },
      { translateX: sway.value * bubble.drift },
      { rotate: `${rot.value}deg` },
      { scale: interpolate(rise.value, [0, 0.5, 1], [0.85, 1, 1.12], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.Text
      style={[
        styles.bubble,
        { left: `${bubble.x}%`, fontSize: bubble.size },
        style,
      ]}
    >
      {bubble.char}
    </Animated.Text>
  );
}

function FloatingNotes({ reduceMotion }: { reduceMotion: boolean }) {
  const bubbles = useMemo(() => generateBubbles(34), []);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bubbles.map((b) => (
        <FloatingNote key={b.id} bubble={b} reduceMotion={reduceMotion} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Glass input with floating label
// ---------------------------------------------------------------------------

type GlassInputProps = TextInputProps & { label: string };

function GlassInput({ label, value, onChangeText, ...rest }: GlassInputProps) {
  const { isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const float = useSharedValue(0);
  const active = focused || (value ? value.length > 0 : false);

  useEffect(() => {
    float.value = withSpring(active ? 1 : 0, SPRING.snappy);
  }, [active]);

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [0, -13]) },
      { scale: interpolate(float.value, [0, 1], [1, 0.72]) },
    ],
    opacity: interpolate(float.value, [0, 1], [0.7, 1], Extrapolation.CLAMP),
  }));

  return (
    <View
      style={[
        styles.inputWrap,
        { borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)", backgroundColor: isDark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.22)" },
        focused && styles.inputWrapFocused,
      ]}
    >
      <Animated.Text style={[styles.inputLabel, { color: focused ? COLORS.gold : isDark ? COLORS.textMuted : "rgba(0,0,0,0.5)" }, labelStyle]}>
        {label}
      </Animated.Text>
      <TextInput
        style={[styles.input, { color: isDark ? "#FFFFFF" : "#101013" }]}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="transparent"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LoginScreen() {
  const [tab, setTab] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"LISTENER" | "ARTIST">("LISTENER");
  const [artistName, setArtistName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [segWidth, setSegWidth] = useState(0);
  const setUser = useAuthStore((s) => s.setUser);
  const { isDark } = useTheme();

  // Entry animation values
  const bg = useSharedValue(0);
  const card = useSharedValue(0);
  const logo = useSharedValue(0);
  const title = useSharedValue(0);
  const toggle = useSharedValue(0);
  const fields = useSharedValue(0);
  const button = useSharedValue(0);
  const guest = useSharedValue(0);
  const seg = useSharedValue(0);
  const floatY = useSharedValue(0);
  const pulse = useSharedValue(0);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      bg.value = 1; card.value = 1; logo.value = 1; title.value = 1; toggle.value = 1; fields.value = 1; button.value = 1; guest.value = 1;
      return;
    }
    bg.value = withTiming(1, { duration: 350 });
    card.value = withDelay(60, withSpring(1, SPRING.gentle));
    logo.value = withDelay(140, withSpring(1, SPRING.bouncy));
    title.value = withDelay(190, withTiming(1, { duration: 220 }));
    toggle.value = withDelay(250, withTiming(1, { duration: 220 }));
    fields.value = withDelay(320, withTiming(1, { duration: 240 }));
    button.value = withDelay(400, withTiming(1, { duration: 240 }));
    guest.value = withDelay(470, withTiming(1, { duration: 240 }));
    // Logo float + pulse loop
    floatY.value = withDelay(700, withRepeat(withSequence(withTiming(-4, { duration: 2200, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) })), -1, true));
    pulse.value = withDelay(700, withRepeat(withSequence(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) })), -1, true));
  }, [reduceMotion]);

  useEffect(() => {
    seg.value = withSpring(tab === "signin" ? 0 : 1, SPRING.snappy);
  }, [tab]);

  const handleSubmit = async () => {
    setError("");
    if (tab === "signin" && (!email.trim() || !password)) { setError("Please enter email and password"); return; }
    if (tab === "register" && (!name.trim() || !email.trim() || !password)) { setError("Please fill all fields"); return; }
    if (tab === "register" && role === "ARTIST" && !artistName.trim()) { setError("Please enter your artist name"); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLoading(true);
    try {
      const user = tab === "signin"
        ? await login(email.trim(), password)
        : await register(name.trim(), email.trim(), password, role, artistName.trim() || undefined);
      setUser(user);
    } catch (e: any) {
      setError(e.message ?? "Login failed");
      setLoading(false);
    }
  };

  const handleGuest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    setUser({ id: "guest", email: "", name: "Guest", role: "LISTENER" });
  };

  const onPressIn = useCallback(() => { btnScale.value = withSpring(0.97, SPRING.snappy); }, []);
  const onPressOut = useCallback(() => { btnScale.value = withSpring(1, SPRING.snappy); }, []);

  // Animated styles
  const bgStyle = useAnimatedStyle(() => ({ opacity: bg.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: card.value,
    transform: [{ scale: interpolate(card.value, [0, 1], [0.94, 1], Extrapolation.CLAMP) }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logo.value,
    transform: [
      { translateY: interpolate(logo.value, [0, 1], [20, 0], Extrapolation.CLAMP) + floatY.value },
      { scale: interpolate(logo.value, [0, 1], [0.8, 1], Extrapolation.CLAMP) * (1 + pulse.value * 0.04) },
    ],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: title.value,
    transform: [{ translateY: interpolate(title.value, [0, 1], [12, 0], Extrapolation.CLAMP) }],
  }));
  const toggleStyle = useAnimatedStyle(() => ({
    opacity: toggle.value,
    transform: [{ translateY: interpolate(toggle.value, [0, 1], [12, 0], Extrapolation.CLAMP) }],
  }));
  const fieldsStyle = useAnimatedStyle(() => ({
    opacity: fields.value,
    transform: [{ translateY: interpolate(fields.value, [0, 1], [14, 0], Extrapolation.CLAMP) }],
  }));
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: button.value,
    transform: [{ scale: btnScale.value }, { translateY: interpolate(button.value, [0, 1], [14, 0], Extrapolation.CLAMP) }],
  }));
  const guestStyle = useAnimatedStyle(() => ({
    opacity: guest.value,
    transform: [{ translateY: interpolate(guest.value, [0, 1], [10, 0], Extrapolation.CLAMP) }],
  }));
  const segIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: seg.value * (segWidth > 0 ? (segWidth - 6) / 2 : 0) }],
  }));

  const isRegister = tab === "register";

  const glass = {
    blurTint: (isDark ? "dark" : "light") as "dark" | "light",
    cardColors: (isDark ? ["rgba(30,30,36,0.5)", "rgba(16,16,20,0.62)"] : ["rgba(255,255,255,0.55)", "rgba(240,240,245,0.72)"]) as [string, string],
    title: isDark ? "#FFFFFF" : "#101013",
    segInactive: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)",
    toggleBg: isDark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.18)",
    roleText: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)",
    roleBorder: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)",
    roleBg: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
    guestText: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)",
  };

  return (
    <View style={styles.root}>
      {/* Animated background */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <View style={styles.bgBase} />
        <FloatingNotes reduceMotion={reduceMotion} />
        <LinearGradient colors={["transparent", "rgba(234,179,8,0.07)"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      </Animated.View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
            <Animated.View style={[styles.cardWrap, cardStyle]}>
              <View style={styles.card}>
                <View style={styles.cardInner}>
                  <BlurView intensity={28} tint={glass.blurTint} style={StyleSheet.absoluteFill} />
                  <LinearGradient colors={glass.cardColors} style={StyleSheet.absoluteFill} />
                  <LinearGradient
                    colors={["rgba(255,255,255,0.14)", "rgba(255,255,255,0)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                  <LinearGradient
                    colors={["rgba(234,179,8,0.14)", "rgba(255,255,255,0.04)", "rgba(234,179,8,0.1)"]}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                </View>

                <View style={styles.cardContent}>
                  {/* Logo badge */}
                  <Animated.View style={[styles.logoWrap, logoStyle]}>
                    <View style={styles.logoBadge}>
                      <Music2 size={26} color={COLORS.gold} />
                    </View>
                  </Animated.View>

                  {/* Title */}
                  <Animated.View style={titleStyle}>
                    <Text style={[styles.brand, { color: glass.title }]}>TheUgMusic</Text>
                  </Animated.View>

                  {/* Segmented toggle */}
                  <Animated.View
                    style={[styles.toggleWrap, { backgroundColor: glass.toggleBg }, toggleStyle]}
                    onLayout={(e) => setSegWidth(e.nativeEvent.layout.width)}
                  >
                    <Animated.View style={[styles.segIndicator, { width: segWidth > 0 ? (segWidth - 6) / 2 : 0 }, segIndicatorStyle]}>
                      <LinearGradient colors={["#F5C518", "#D9A208"]} style={StyleSheet.absoluteFill} />
                    </Animated.View>
                    <TouchableOpacity style={styles.segBtn} onPress={() => setTab("signin")} activeOpacity={0.8}>
                      <Text style={[styles.segText, { color: glass.segInactive }, tab === "signin" && styles.segTextActive]}>Sign In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.segBtn} onPress={() => setTab("register")} activeOpacity={0.8}>
                      <Text style={[styles.segText, { color: glass.segInactive }, tab === "register" && styles.segTextActive]}>Register</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  {error !== "" && <Text style={styles.error}>{error}</Text>}

                  <Animated.View style={[styles.fieldGroup, fieldsStyle]}>
                    {isRegister && (
                      <GlassInput label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
                    )}
                    <GlassInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                    <GlassInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
                    {isRegister && (
                      <View style={styles.roleRow}>
                        {(["LISTENER", "ARTIST"] as const).map((r) => (
                          <TouchableOpacity
                            key={r}
                            style={[styles.rolePill, { borderColor: glass.roleBorder, backgroundColor: glass.roleBg }, role === r && styles.rolePillActive]}
                            onPress={() => setRole(r)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.rolePillText, { color: glass.roleText }, role === r && styles.rolePillTextActive]}>{r === "LISTENER" ? "Listener" : "Artist"}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    {isRegister && role === "ARTIST" && (
                      <GlassInput label="Artist / Stage Name" value={artistName} onChangeText={setArtistName} autoCapitalize="words" />
                    )}
                  </Animated.View>

                  {/* Primary button */}
                  <Animated.View style={[styles.btnWrap, buttonStyle]}>
                    <TouchableOpacity
                      style={styles.submitBtn}
                      onPress={handleSubmit}
                      onPressIn={onPressIn}
                      onPressOut={onPressOut}
                      disabled={loading}
                      activeOpacity={1}
                    >
                      <LinearGradient colors={["#F5C518", "#C89108"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                      <LinearGradient colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.btnGloss} pointerEvents="none" />
                      {loading ? (
                        <ActivityIndicator color={COLORS.bg} />
                      ) : (
                        <Text style={styles.submitText}>{tab === "signin" ? "Sign In" : "Create Account"}</Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Guest */}
                  <Animated.View style={guestStyle}>
                    <TouchableOpacity style={styles.guestBtn} onPress={handleGuest} activeOpacity={0.7}>
                      <Text style={[styles.guestText, { color: glass.guestText }]}>Continue as Guest</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050507" },
  flex: { flex: 1 },
  bgBase: { ...StyleSheet.absoluteFillObject, backgroundColor: "#050507" },
  scroll: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: Math.min(SW * 0.05, 28) },
  cardWrap: { width: "100%", maxWidth: CARD_MAX },
  card: {
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 20,
  },
  cardInner: { ...StyleSheet.absoluteFillObject, borderRadius: 34, overflow: "hidden" },
  cardContent: { padding: Math.min(SW * 0.07, 30), alignItems: "center" },

  // Logo
  logoWrap: { marginBottom: 10 },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.35)",
    shadowColor: COLORS.gold,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  // Title
  brand: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 22,
    letterSpacing: 0.3,
    textShadowColor: "rgba(234,179,8,0.5)",
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },

  // Segmented control
  toggleWrap: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 999,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  segIndicator: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: 999,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center", justifyContent: "center", zIndex: 1 },
  segText: { color: "rgba(255,255,255,0.55)", fontWeight: "600", fontSize: 14 },
  segTextActive: { color: "#0A0A0A", fontWeight: "700" },

  error: { color: COLORS.red, fontSize: 13, marginBottom: 12, textAlign: "center", marginTop: -8 },

  fieldGroup: { width: "100%" },
  inputWrap: {
    width: "100%",
    height: 56,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 16,
    marginBottom: 12,
    justifyContent: "center",
  },
  inputWrapFocused: {
    borderColor: "rgba(234,179,8,0.6)",
    backgroundColor: "rgba(0,0,0,0.32)",
    shadowColor: COLORS.gold,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  input: { flex: 1, fontSize: 15, color: "#FFFFFF", paddingVertical: 0 },
  inputLabel: {
    position: "absolute",
    left: 16,
    top: 18,
    fontSize: 15,
    color: COLORS.textMuted,
  },

  roleRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  rolePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  rolePillActive: {
    backgroundColor: "rgba(234,179,8,0.2)",
    borderColor: "rgba(234,179,8,0.5)",
  },
  rolePillText: { color: "rgba(255,255,255,0.55)", fontWeight: "600", fontSize: 13 },
  rolePillTextActive: { color: COLORS.gold },

  btnWrap: { width: "100%", marginTop: 2 },
  submitBtn: {
    width: "100%",
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  btnGloss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
  },
  submitText: { color: "#0A0A0A", fontWeight: "800", fontSize: 16 },

  guestBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20 },
  guestText: { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "600" },

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
