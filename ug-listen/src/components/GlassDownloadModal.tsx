import { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  AccessibilityInfo,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  Extrapolation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { X, Download, Music2 } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import { getStoredToken } from "../api/auth";
import { trpc } from "../api/client";
import { useDownloadStore } from "../store/downloadStore";
import { registerDownload } from "../lib/downloads";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export type DownloadSong = {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
};

type Props = {
  song: DownloadSong;
  onClose: () => void;
};

const SPRING = { damping: 18, stiffness: 180, mass: 0.9 };

function formatUGX(amount: number): string {
  try {
    return "UGX " + amount.toLocaleString();
  } catch {
    return "UGX " + amount;
  }
}

export default function GlassDownloadModal({ song, onClose }: Props) {
  const { colors, isDark } = useTheme();
  const [price, setPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadDone, setDownloadDone] = useState(false);
  const downloadStore = useDownloadStore();
  const [reduceMotion, setReduceMotion] = useState(false);

  const progress = useSharedValue(0);
  const float = useSharedValue(0);
  const sheen = useSharedValue(0);

  const CARD_W = Math.min(SCREEN_W - 40, 420);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    // Fetch the song price (and details) for the purchase prompt.
    (async () => {
      try {
        const res = await fetch(`https://www.theugmusic.com/api/mobile/song?id=${encodeURIComponent(song.id)}`);
        const d = await res.json();
        if (typeof d?.price === "number") setPrice(d.price);
      } catch {}
      setPriceLoading(false);
    })();
  }, [song.id]);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    progress.value = withSpring(1, SPRING);
    float.value = withDelay(
      400,
      withRepeat(withSequence(withTiming(-2, { duration: 2400, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.ease) })), -1, true)
    );
    sheen.value = withDelay(700, withRepeat(withTiming(1, { duration: 4600, easing: Easing.inOut(Easing.ease) }), -1, false));
  }, []);

  const dismiss = () => {
    if (reduceMotion) {
      onClose();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    progress.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) }, (finished) => {
      if (finished) onClose();
    });
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 1, 1], Extrapolation.CLAMP),
    transform: [
      { perspective: 1000 },
      { translateY: interpolate(progress.value, [0, 1], [30, 0], Extrapolation.CLAMP) },
      { scale: interpolate(progress.value, [0, 1], [0.95, 1], Extrapolation.CLAMP) },
    ],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sheen.value, [0, 1], [-CARD_W, CARD_W], Extrapolation.CLAMP) }],
    opacity: interpolate(sheen.value, [0, 0.12, 0.88, 1], [0, 0.14, 0.14, 0], Extrapolation.CLAMP),
  }));

  const handleDownload = async () => {
    if (purchasing || downloading) return;
    setPurchasing(true);
    try {
      const token = await getStoredToken();
      if (!token) {
        Alert.alert("Sign In", "Please sign in to download songs.");
        setPurchasing(false);
        return;
      }

      // 1. Server-side authorization check (free / purchased / premium).
      const authRes = await fetch(`https://www.theugmusic.com/api/mobile/download?songId=${encodeURIComponent(song.id)}&token=${encodeURIComponent(token)}`);
      const auth = await authRes.json();

      if (auth?.authorized && auth?.fileUrl) {
        // 2. Authorized — download the actual audio file to the device.
        setPurchasing(false);
        setDownloading(true);
        setDownloadProgress(0);
        await downloadStore.download(
          song.id,
          auth.fileUrl,
          {
            songId: song.id,
            title: auth.title || song.title,
            artist: auth.artist || song.artist,
            coverUrl: song.coverUrl,
            duration: auth.duration || 0,
            size: 0,
            downloadedAt: new Date().toISOString(),
          },
          (pct) => setDownloadProgress(pct)
        );
        setDownloading(false);
        setDownloadDone(true);
        registerDownload(song.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } else if (auth?.reason === "payment_required") {
        // 3. Payment required — use the existing purchase system.
        const result = await trpc.payments.initiateDownload.mutate({ songId: song.id });
        if (result?.txRef) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          Alert.alert(
            "Payment",
            `Redirecting to Flutterwave to complete your download (${formatUGX(result.amount)}).`,
            [{ text: "OK", onPress: () => onClose() }],
          );
        }
      } else {
        Alert.alert("Download Unavailable", auth?.reason === "not_found" ? "Song not found." : "You are not authorized to download this song.");
      }
    } catch (e: any) {
      Alert.alert("Download Failed", e?.message || "Something went wrong. Tap to retry.");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,10,14,0.72)" }, backdropStyle]} />

        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityLabel="Dismiss" accessibilityRole="button" />

        <Animated.View style={[styles.cardWrap, cardStyle]} pointerEvents="box-none">
          <Animated.View style={floatStyle}>
            <View style={[styles.card, { width: CARD_W }]} accessibilityRole="summary" accessibilityLabel={`Download ${song.title}`}>
              {/* Glass surface */}
              <View style={styles.glassFill}>
                <LinearGradient
                  colors={isDark ? ["rgba(30,30,36,0.55)", "rgba(16,16,20,0.66)"] : ["rgba(255,255,255,0.5)", "rgba(240,240,245,0.6)"]}
                  style={StyleSheet.absoluteFill}
                />
              </View>

              {/* Reflection layer */}
              <LinearGradient
                colors={["rgba(255,255,255,0.14)", "rgba(255,255,255,0.0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              {/* Moving highlight */}
              <Animated.View style={[styles.sheen, sheenStyle]} pointerEvents="none">
                <LinearGradient
                  colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.18)", "rgba(255,255,255,0)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* Gold edge glow */}
              <LinearGradient
                colors={["rgba(234,179,8,0.16)", "rgba(255,255,255,0.05)", "rgba(234,179,8,0.12)"]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              {/* Content */}
              <View style={styles.content}>
                <View style={styles.header}>
                  <View style={styles.headerIcon}>
                    <Download size={18} color="#EAB308" />
                  </View>
                  <Text style={styles.headerTitle}>Download</Text>
                  <TouchableOpacity style={styles.closeBtn} onPress={dismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="Close" accessibilityRole="button">
                    <X size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.artworkWrap}>
                  {song.coverUrl ? (
                    <Image source={{ uri: song.coverUrl }} style={styles.artwork} resizeMode="cover" />
                  ) : (
                    <View style={[styles.artwork, styles.artworkFallback]}>
                      <Music2 size={34} color="#EAB308" />
                    </View>
                  )}
                </View>

                <Text style={[styles.title, { color: colors.white }]} numberOfLines={2}>
                  {song.title}
                </Text>
                <Text style={[styles.artist, { color: colors.whiteMuted }]} numberOfLines={1}>
                  {song.artist}
                </Text>

                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Price</Text>
                  {priceLoading ? (
                    <ActivityIndicator size="small" color={colors.gold} />
                  ) : (
                    <Text style={[styles.priceValue, { color: colors.gold }]}>{price != null ? formatUGX(price) : "—"}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.buyBtn}
                  onPress={downloadDone ? onClose : handleDownload}
                  activeOpacity={0.85}
                  disabled={purchasing || downloading}
                  accessibilityRole="button"
                  accessibilityLabel="Buy and download"
                >
                  <LinearGradient colors={downloadDone ? ["#10B981", "#059669"] : ["#F5C518", "#C89108"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                  <LinearGradient colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.btnGloss} pointerEvents="none" />
                  {downloading ? (
                    <View style={styles.downloadingRow}>
                      <Text style={styles.buyText}>Downloading… {Math.round(downloadProgress * 100)}%</Text>
                    </View>
                  ) : purchasing ? (
                    <ActivityIndicator color="#0A0A0A" />
                  ) : downloadDone ? (
                    <Text style={styles.buyText}>Downloaded ✓</Text>
                  ) : (
                    <Text style={styles.buyText}>Buy &amp; Download</Text>
                  )}
                </TouchableOpacity>

                {downloading && (
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.round(downloadProgress * 100)}%` }]} />
                  </View>
                )}

                <TouchableOpacity style={styles.cancelBtn} onPress={dismiss} activeOpacity={0.7} accessibilityRole="button">
                  <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cardWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
    maxHeight: SCREEN_H - 120,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 18 },
    elevation: 24,
  },
  glassFill: {
    ...StyleSheet.absoluteFillObject,
  },
  sheen: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  content: {
    padding: 24,
    paddingTop: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  artworkWrap: {
    alignItems: "center",
    marginBottom: 14,
  },
  artwork: {
    width: 140,
    height: 140,
    borderRadius: 18,
  },
  artworkFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(234,179,8,0.1)",
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.25)",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 26,
  },
  artist: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  buyBtn: {
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  btnGloss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
  },
  buyText: {
    color: "#0A0A0A",
    fontWeight: "800",
    fontSize: 16,
  },
  downloadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    marginTop: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#EAB308",
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
