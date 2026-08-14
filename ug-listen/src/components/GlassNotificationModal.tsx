import { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
  ScrollView,
  AccessibilityInfo,
  Image,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withDelay,
  withSequence,
  interpolate,
  Easing,
  runOnJS,
  Extrapolation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  X,
  Bell,
  Music2,
  Play,
  Heart,
  Share2,
  User,
  ListMusic,
  Info,
  Ticket,
  Check,
  Clock,
} from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  audience?: string;
  type?: string;
  targetId?: string;
  read?: boolean;
  createdAt?: string;
  artwork?: string;
};

export type OriginRect = { x: number; y: number; width: number; height: number };

type Props = {
  notification: NotificationItem;
  origin: OriginRect;
  wasUnread: boolean;
  onClose: () => void;
  onPlay: () => void;
  onLike: () => void;
  onShare: () => void;
  onViewArtist: () => void;
  onFollow: () => void;
  onOpenPlaylist: () => void;
  onViewDetails: () => void;
  onOpenTicket: () => void;
};

const SPRING = { damping: 18, stiffness: 180, mass: 0.9 };

function categoryInfo(type?: string) {
  switch (type) {
    case "song":
      return { label: "New Release", color: "#EAB308" };
    case "artist":
      return { label: "Artist", color: "#A855F7" };
    case "playlist":
      return { label: "Playlist", color: "#3B82F6" };
    case "support":
      return { label: "Support", color: "#F97316" };
    default:
      return { label: "System", color: "#14B8A6" };
  }
}

function categoryIcon(type?: string, size = 22) {
  switch (type) {
    case "song":
      return <Music2 size={size} color="#EAB308" />;
    case "artist":
      return <User size={size} color="#A855F7" />;
    case "playlist":
      return <ListMusic size={size} color="#3B82F6" />;
    case "support":
      return <Ticket size={size} color="#F97316" />;
    default:
      return <Bell size={size} color="#14B8A6" />;
  }
}

export default function GlassNotificationModal({
  notification,
  origin,
  wasUnread,
  onClose,
  onPlay,
  onLike,
  onShare,
  onViewArtist,
  onFollow,
  onOpenPlaylist,
  onViewDetails,
  onOpenTicket,
}: Props) {
  const { colors, isDark } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [closing, setClosing] = useState(false);

  const progress = useSharedValue(0);
  const fromX = useSharedValue(0);
  const fromY = useSharedValue(0);
  const float = useSharedValue(0);
  const sheen = useSharedValue(0);
  const dragY = useSharedValue(0);

  const CARD_W = Math.min(SCREEN_W - 40, 440);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    const startCX = origin.x + origin.width / 2;
    const startCY = origin.y + origin.height / 2;
    fromX.value = startCX - SCREEN_W / 2;
    fromY.value = startCY - SCREEN_H / 2;

    if (reduceMotion) {
      progress.value = 1;
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    progress.value = withSpring(1, SPRING);
    float.value = withDelay(
      350,
      withRepeat(withSequence(withTiming(-2, { duration: 2200, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) })), -1, true)
    );
    sheen.value = withDelay(
      600,
      withRepeat(withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.ease) }), -1, false)
    );
  }, []);

  const dismiss = () => {
    if (closing) return;
    setClosing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    if (reduceMotion) {
      onClose();
      return;
    }
    progress.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.ease) }, (finished) => {
      if (finished) onClose();
    });
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const cardStyle = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: interpolate(t, [0, 0.4, 1], [0, 1, 1], Extrapolation.CLAMP),
      transform: [
        { perspective: 1000 },
        { translateX: interpolate(t, [0, 1], [fromX.value, 0], Extrapolation.CLAMP) },
        { translateY: interpolate(t, [0, 1], [fromY.value, 0], Extrapolation.CLAMP) },
        { scale: interpolate(t, [0, 1], [0.97, 1], Extrapolation.CLAMP) },
        { rotateX: `${interpolate(t, [0, 1], [7, 0], Extrapolation.CLAMP)}deg` },
      ],
    } as any;
  });

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value + dragY.value }],
    opacity: interpolate(dragY.value, [0, 280], [1, 0.55], Extrapolation.CLAMP),
  }));

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sheen.value, [0, 1], [-CARD_W, CARD_W], Extrapolation.CLAMP) }],
    opacity: interpolate(sheen.value, [0, 0.12, 0.88, 1], [0, 0.14, 0.14, 0], Extrapolation.CLAMP),
  }));

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) dragY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 1200) {
        runOnJS(dismiss)();
      } else {
        dragY.value = withSpring(0, SPRING);
      }
    });

  const cat = categoryInfo(notification.type);
  const type = notification.type || "system";
  const isSong = type === "song";
  const isArtist = type === "artist";
  const isPlaylist = type === "playlist";
  const isSupport = type === "support";

  const formatTime = (d?: string) => {
    if (!d) return "Recently";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(d).toLocaleDateString();
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLiked((v) => !v);
    onLike();
  };

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFollowing((v) => !v);
    onFollow();
  };

  const handleShare = () => {
    onShare();
  };

  const renderActions = () => {
    if (isSong) {
      return (
        <View style={styles.actionsRow}>
          <ActionButton icon={<Play size={18} color="#EAB308" />} label="Play" onPress={onPlay} primary />
          <ActionButton icon={liked ? <Check size={18} color="#EC4899" /> : <Heart size={18} color="#EC4899" />} label={liked ? "Liked" : "Like"} onPress={handleLike} />
          <ActionButton icon={<Share2 size={18} color={colors.text} />} label="Share" onPress={handleShare} />
        </View>
      );
    }
    if (isArtist) {
      return (
        <View style={styles.actionsRow}>
          <ActionButton icon={<User size={18} color="#A855F7" />} label="View Artist" onPress={onViewArtist} primary />
          <ActionButton icon={following ? <Check size={18} color="#EAB308" /> : <Play size={18} color="#EAB308" />} label={following ? "Following" : "Follow"} onPress={handleFollow} />
        </View>
      );
    }
    if (isPlaylist) {
      return (
        <View style={styles.actionsRow}>
          <ActionButton icon={<ListMusic size={18} color="#3B82F6" />} label="Open Playlist" onPress={onOpenPlaylist} primary />
        </View>
      );
    }
    if (isSupport) {
      return (
        <View style={styles.actionsRow}>
          <ActionButton icon={<Ticket size={18} color="#F97316" />} label="Open Ticket" onPress={onOpenTicket} primary />
        </View>
      );
    }
    return (
      <View style={styles.actionsRow}>
        <ActionButton icon={<Info size={18} color="#14B8A6" />} label="View Details" onPress={onViewDetails} primary />
      </View>
    );
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(12,12,16,0.7)" }, blurStyle]} pointerEvents="none" />

        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }, backdropStyle]} />

        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityLabel="Dismiss notification" accessibilityRole="button" />

        <Animated.View style={[styles.cardWrap, cardStyle]} pointerEvents="box-none">
          <Animated.View style={floatStyle}>
            <View
              style={[styles.card, { width: CARD_W }]}
              accessibilityRole="summary"
              accessibilityLabel={`${cat.label}. ${notification.title}. ${notification.body}`}
            >
              {/* Glass surface */}
              <View style={styles.glassFill}>
                <LinearGradient
                  colors={isDark ? ["rgba(30,30,36,0.55)", "rgba(16,16,20,0.65)"] : ["rgba(255,255,255,0.5)", "rgba(240,240,245,0.6)"]}
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
                <GestureDetector gesture={panGesture}>
                  <View>
                    <View style={styles.dragHandle} />
                    <View style={styles.header}>
                      <View style={styles.headerIcon}>{categoryIcon(notification.type, 20)}</View>
                      <Text style={styles.headerTitle}>Notifications</Text>
                      <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={dismiss}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        accessibilityLabel="Close"
                        accessibilityRole="button"
                      >
                        <X size={20} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </GestureDetector>

                {notification.artwork ? (
                  <Image source={{ uri: notification.artwork }} style={styles.artwork} resizeMode="cover" />
                ) : (
                  <View style={[styles.artwork, styles.artworkFallback, { backgroundColor: cat.color + "22" }]}>
                    {categoryIcon(notification.type, 30)}
                  </View>
                )}

                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: cat.color + "22", borderColor: cat.color + "44" }]}>
                    <Text style={[styles.badgeText, { color: cat.color }]}>{cat.label.toUpperCase()}</Text>
                  </View>
                  {wasUnread && (
                    <View style={styles.unreadDot}>
                      <Text style={styles.unreadText}>NEW</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.title, { color: colors.white }]} numberOfLines={3}>
                  {notification.title}
                </Text>

                <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false} bounces={false}>
                  <Text style={[styles.body, { color: colors.whiteMuted }]}>{notification.body}</Text>
                </ScrollView>

                <View style={styles.metaRow}>
                  <View style={styles.metaLeft}>
                    <Clock size={13} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatTime(notification.createdAt)}</Text>
                  </View>
                  <Text style={[styles.metaText, { color: colors.textDisabled, textTransform: "uppercase" }]}>
                    {notification.audience || "The UG Music"}
                  </Text>
                </View>

                <View style={styles.actions}>{renderActions()}</View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ActionButton({ icon, label, onPress, primary }: { icon: React.ReactNode; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        primary && styles.actionBtnPrimary,
        pressed && styles.actionBtnPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text style={[styles.actionLabel, primary && styles.actionLabelPrimary]}>{label}</Text>
    </Pressable>
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
  dragHandle: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 12,
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
  artwork: {
    width: "100%",
    height: 150,
    borderRadius: 18,
    marginBottom: 14,
  },
  artworkFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  unreadDot: {
    backgroundColor: "#EAB308",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  unreadText: {
    color: "#09090B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    lineHeight: 28,
  },
  bodyScroll: {
    maxHeight: 150,
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 14,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  actionBtnPrimary: {
    backgroundColor: "rgba(234,179,8,0.16)",
    borderColor: "rgba(234,179,8,0.35)",
  },
  actionBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E4E4E7",
  },
  actionLabelPrimary: {
    color: "#EAB308",
  },
});
