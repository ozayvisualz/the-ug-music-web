import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Dimensions,
  AccessibilityInfo,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Music2, Eye, EyeOff, Upload } from "lucide-react-native";
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
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { COLORS, SPRING } from "../constants/theme";
import { login, register, getStoredToken } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeContext";
import FloatingNotes from "../components/FloatingNotes";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { uploadFile } from "../lib/upload";

const { width: SW, height: SH } = Dimensions.get("window");
const CARD_MAX = 384;

// ---------------------------------------------------------------------------
// Glass input with floating label
// ---------------------------------------------------------------------------

type GlassInputProps = TextInputProps & { label: string };

function GlassInput({ label, value, onChangeText, secureTextEntry, ...rest }: GlassInputProps) {
  const { isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(!!secureTextEntry);
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
      collapsable={false}
      style={[
        styles.inputWrap,
        { borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)", backgroundColor: isDark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.22)" },
        focused && styles.inputWrapFocused,
      ]}
    >
      <Animated.Text pointerEvents="none" style={[styles.inputLabel, { color: focused ? COLORS.gold : isDark ? COLORS.textMuted : "rgba(0,0,0,0.5)" }, labelStyle]}>
        {label}
      </Animated.Text>
      <TextInput
        style={[styles.input, { color: isDark ? "#FFFFFF" : "#101013" }, secureTextEntry && styles.inputWithToggle]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        placeholderTextColor="transparent"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
      {secureTextEntry ? (
        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={() => setSecure((v) => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={secure ? "Show password" : "Hide password"}
        >
          {secure ? (
            <EyeOff size={18} color={isDark ? COLORS.textMuted : "rgba(0,0,0,0.5)"} />
          ) : (
            <Eye size={18} color={COLORS.gold} />
          )}
        </TouchableOpacity>
      ) : null}
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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [role, setRole] = useState<"LISTENER" | "ARTIST">("LISTENER");
  const [artistName, setArtistName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [genre, setGenre] = useState("");
  const [bio, setBio] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [musicLinks, setMusicLinks] = useState("");
  const [recordLabel, setRecordLabel] = useState("");
  const [managementContact, setManagementContact] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [idUrl, setIdUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState<"photo" | "id" | "selfie" | null>(null);
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
    if (tab === "register" && password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (tab === "register" && role === "ARTIST" && !artistName.trim()) { setError("Please enter your artist name"); return; }
    if (tab === "register" && role === "ARTIST" && !photoUrl) { setError("Artist photo is required"); return; }
    if (tab === "register" && role === "ARTIST" && !idUrl) { setError("ID document is required"); return; }
    if (tab === "register" && role === "ARTIST" && !selfieUrl) { setError("Selfie (holding ID) is required"); return; }
    if (tab === "register" && role === "ARTIST" && !accepted) { setError("You must accept the artist terms"); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLoading(true);
    try {
      const user = tab === "signin"
        ? await login(email.trim(), password)
        : await register(name.trim(), email.trim(), password, role, artistName.trim() || undefined, phone.trim() || undefined);

      // Submit artist verification info to the admin review queue.
      if (tab === "register" && role === "ARTIST") {
        try {
          const token = await getStoredToken();
          await fetch("https://www.theugmusic.com/api/artist/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({
              artistName: artistName.trim(),
              legalName: legalName.trim() || name.trim(),
              country: country.trim(),
              city: city.trim(),
              dateOfBirth: dateOfBirth.trim(),
              genre: genre.trim(),
              bio: bio.trim(),
              socialLinks: socialLinks.split(",").map((s) => s.trim()).filter(Boolean),
              musicLinks: musicLinks.trim(),
              recordLabel: recordLabel.trim(),
              managementContact: managementContact.trim(),
              photoUrl: photoUrl || undefined,
              idDocument: idUrl || undefined,
              selfieDocument: selfieUrl || undefined,
            }),
          });
        } catch {}
      }

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

  const uploadDoc = async (kind: "photo" | "id" | "selfie", uri: string, fileName: string, mimeType: string) => {
    setUploadingDoc(kind);
    try {
      const url = await uploadFile(uri, fileName, mimeType);
      if (kind === "photo") setPhotoUrl(url);
      else if (kind === "id") setIdUrl(url);
      else setSelfieUrl(url);
    } catch {
      Alert.alert("Upload Failed", "Could not upload the file. Please try again.");
    } finally {
      setUploadingDoc(null);
    }
  };

  const pickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert("Permission", "Photo library permission is required to upload a photo."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
      if (result.canceled || !result.assets?.length) return;
      const a = result.assets[0];
      await uploadDoc("photo", a.uri, a.fileName || "photo.jpg", a.mimeType || "image/jpeg");
    } catch {}
  };

  const pickSelfie = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert("Permission", "Photo library permission is required to upload a selfie."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
      if (result.canceled || !result.assets?.length) return;
      const a = result.assets[0];
      await uploadDoc("selfie", a.uri, a.fileName || "selfie.jpg", a.mimeType || "image/jpeg");
    } catch {}
  };

  const pickId = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"], copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.length) return;
      const a = result.assets[0];
      await uploadDoc("id", a.uri, a.name || "id-document", a.mimeType || "application/pdf");
    } catch {}
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
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} pointerEvents="none">
        <View style={styles.bgBase} />
        <FloatingNotes reduceMotion={reduceMotion} />
        <LinearGradient colors={["transparent", "rgba(234,179,8,0.07)"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      </Animated.View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
            <Animated.View style={[styles.cardWrap, cardStyle]}>
              <View style={styles.card}>
                <View style={styles.cardInner} pointerEvents="none">
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
                    {isRegister && (
                      <GlassInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                    )}
                    <GlassInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
                    {isRegister && (
                      <GlassInput label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                    )}
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
                      <>
                        <GlassInput label="Artist / Stage Name" value={artistName} onChangeText={setArtistName} autoCapitalize="words" />
                        <GlassInput label="Legal Full Name" value={legalName} onChangeText={setLegalName} autoCapitalize="words" />
                        <View style={styles.artistGrid}>
                          <View style={styles.artistGridItem}><GlassInput label="Country" value={country} onChangeText={setCountry} autoCapitalize="words" /></View>
                          <View style={styles.artistGridItem}><GlassInput label="City" value={city} onChangeText={setCity} autoCapitalize="words" /></View>
                        </View>
                        <GlassInput label="Date of Birth" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" />
                        <GlassInput label="Genre" value={genre} onChangeText={setGenre} autoCapitalize="words" />
                        <GlassInput label="Short Bio" value={bio} onChangeText={setBio} />
                        <GlassInput label="Social Links (comma separated)" value={socialLinks} onChangeText={setSocialLinks} />
                        <GlassInput label="Music Links" value={musicLinks} onChangeText={setMusicLinks} />
                        <GlassInput label="Record Label (optional)" value={recordLabel} onChangeText={setRecordLabel} />
                        <GlassInput label="Management Contact (optional)" value={managementContact} onChangeText={setManagementContact} />

                        <TouchableOpacity style={styles.uploadBtn} onPress={pickPhoto} activeOpacity={0.7}>
                          {uploadingDoc === "photo" ? <ActivityIndicator size="small" color={COLORS.gold} /> : <Upload size={16} color={COLORS.gold} />}
                          <Text style={[styles.uploadBtnText, { color: photoUrl ? COLORS.green : COLORS.text }]}>{photoUrl ? "Artist Photo Uploaded ✓" : "Upload Artist Photo"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickId} activeOpacity={0.7}>
                          {uploadingDoc === "id" ? <ActivityIndicator size="small" color={COLORS.gold} /> : <Upload size={16} color={COLORS.gold} />}
                          <Text style={[styles.uploadBtnText, { color: idUrl ? COLORS.green : COLORS.text }]}>{idUrl ? "ID Document Uploaded ✓" : "Upload ID Document"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickSelfie} activeOpacity={0.7}>
                          {uploadingDoc === "selfie" ? <ActivityIndicator size="small" color={COLORS.gold} /> : <Upload size={16} color={COLORS.gold} />}
                          <Text style={[styles.uploadBtnText, { color: selfieUrl ? COLORS.green : COLORS.text }]}>{selfieUrl ? "Selfie Uploaded ✓" : "Upload Selfie (holding ID)"}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.termsRow} onPress={() => setAccepted((v) => !v)} activeOpacity={0.7}>
                          <View style={[styles.termsCheckbox, accepted && styles.termsCheckboxActive]}>
                            {accepted && <Text style={styles.termsCheckboxTick}>✓</Text>}
                          </View>
                          <Text style={styles.termsText}>I confirm that all information provided is accurate and I accept the Artist Terms of Service.</Text>
                        </TouchableOpacity>
                      </>
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
  inputWithToggle: { paddingRight: 40 },
  eyeBtn: { position: "absolute", right: 10, top: 0, bottom: 0, justifyContent: "center", paddingHorizontal: 4 },
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
  artistGrid: { flexDirection: "row", gap: 10 },
  artistGridItem: { flex: 1 },
  uploadBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 12 },
  uploadBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.text, flex: 1 },
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 12 },
  termsCheckbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  termsCheckboxActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  termsCheckboxTick: { color: COLORS.bg, fontSize: 12, fontWeight: "700" },
  termsText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 16 },

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
});
