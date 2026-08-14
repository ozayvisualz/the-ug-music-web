import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Share,
  type View as RNView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  Bell,
  Music2,
  User,
  ListMusic,
  Ticket,
  Clock,
} from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import { getStoredToken } from "../api/auth";
import { trpc } from "../api/client";
import { useQueueStore } from "../store/playerStore";
import { useNotificationStore } from "../store/notificationStore";
import { markNotificationOpened } from "../lib/notifications";
import { navigate } from "../navigation/navigationRef";
import GlassNotificationModal, { type NotificationItem, type OriginRect } from "../components/GlassNotificationModal";

const CARD_SPRING = { damping: 18, stiffness: 320 };

function categoryMeta(type?: string) {
  switch (type) {
    case "song":
      return { color: "#EAB308", icon: <Music2 size={18} color="#EAB308" /> };
    case "artist":
      return { color: "#A855F7", icon: <User size={18} color="#A855F7" /> };
    case "playlist":
      return { color: "#3B82F6", icon: <ListMusic size={18} color="#3B82F6" /> };
    case "support":
      return { color: "#F97316", icon: <Ticket size={18} color="#F97316" /> };
    default:
      return { color: "#14B8A6", icon: <Bell size={18} color="#14B8A6" /> };
  }
}

function formatTime(d?: string) {
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
}

const NotificationCard = ({
  item,
  colors,
  onPress,
  innerRef,
}: {
  item: NotificationItem;
  colors: any;
  onPress: (item: NotificationItem) => void;
  innerRef: (el: RNView | null) => void;
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const meta = categoryMeta(item.type);

  return (
    <Pressable
      ref={innerRef}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 110 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, CARD_SPRING);
      }}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.body}`}
      accessibilityState={{ selected: !item.read }}
    >
      <Animated.View style={[styles.card, animatedStyle, { backgroundColor: colors.surface }]}>
        <View style={[styles.cardIcon, { backgroundColor: meta.color + "1A" }]}>{meta.icon}</View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={[styles.cardBody, { color: colors.textMuted }]} numberOfLines={2}>
            {item.body}
          </Text>
          <View style={styles.cardMeta}>
            <Clock size={12} color={colors.textDisabled} />
            <Text style={[styles.cardTime, { color: colors.textDisabled }]}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const setQueue = useQueueStore((s) => s.setQueue);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<{ n: NotificationItem; origin: OriginRect; wasUnread: boolean } | null>(null);
  const cardRefs = useRef<Record<string, RNView | null>>({});

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      setLoading(true);
      try {
        const url = token
          ? `https://theugmusic.com/api/admin/notifications?token=${encodeURIComponent(token)}`
          : "https://theugmusic.com/api/admin/notifications";
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter((n: any) => !n.read).length);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const closeModal = () => setActive(null);

  const openNotification = (n: NotificationItem) => {
    const el = cardRefs.current[n.id];
    const wasUnread = !n.read;
    el?.measureInWindow((x, y, width, height) => {
      setActive({ n, origin: { x, y, width, height }, wasUnread });
    });
    if (wasUnread) {
      const next = notifications.map((p) => (p.id === n.id ? { ...p, read: true } : p));
      setNotifications(next);
      setUnreadCount(next.filter((p) => !p.read).length);
      markNotificationOpened(n.id).then((unread) => {
        if (typeof unread === "number") setUnreadCount(unread);
      });
    }
  };

  const handlePlay = async (n: NotificationItem) => {
    closeModal();
    const songId = n.targetId;
    if (!songId) return;
    try {
      const res = await fetch(`https://theugmusic.com/api/mobile/song?id=${encodeURIComponent(songId)}`);
      const song = await res.json();
      const url = song?.hlsUrl || song?.fileUrl;
      if (url) {
        setQueue([
          {
            id: song.id,
            title: song.title,
            artist: song.artist || "Unknown",
            url,
            duration: song.duration || 0,
            coverUrl: song.coverUrl,
            artistId: song.artistId,
          },
        ]);
        return;
      }
    } catch {}
    navigation.navigate("Song", { songId });
  };

  const handleLike = (n: NotificationItem) => {
    if (!n.targetId) return;
    trpc.social.likeSong.mutate(n.targetId).catch(() => {});
  };

  const handleShare = (n: NotificationItem) => {
    Share.share({ message: `${n.title}\n\n${n.body}` }).catch(() => {});
  };

  const handleViewArtist = (n: NotificationItem) => {
    closeModal();
    if (n.targetId) navigation.navigate("Artist", { artistId: n.targetId });
  };

  const handleFollow = (n: NotificationItem) => {
    if (!n.targetId) return;
    trpc.social.followArtist.mutate(n.targetId).catch(() => {});
  };

  const handleOpenPlaylist = (n: NotificationItem) => {
    closeModal();
    navigation.navigate("Playlist", { playlist: { id: n.targetId, name: n.title, songs: [] } });
  };

  const handleViewDetails = () => {
    closeModal();
  };

  const handleOpenTicket = () => {
    closeModal();
    navigate("Profile", { screen: "Support" });
  };

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.header, { color: colors.text }]}>Notifications</Text>
        <ActivityIndicator size="large" color={colors.gold} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.header, { color: colors.text }]}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <NotificationCard
            item={item}
            colors={colors}
            onPress={openNotification}
            innerRef={(el) => {
              cardRefs.current[item.id] = el;
            }}
          />
        )}
        style={styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>No notifications yet</Text>}
      />

      {active && (
        <GlassNotificationModal
          notification={active.n}
          origin={active.origin}
          wasUnread={active.wasUnread}
          onClose={closeModal}
          onPlay={() => handlePlay(active.n)}
          onLike={() => handleLike(active.n)}
          onShare={() => handleShare(active.n)}
          onViewArtist={() => handleViewArtist(active.n)}
          onFollow={() => handleFollow(active.n)}
          onOpenPlaylist={() => handleOpenPlaylist(active.n)}
          onViewDetails={handleViewDetails}
          onOpenTicket={handleOpenTicket}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 28, fontWeight: "800", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  list: { paddingHorizontal: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 15, fontWeight: "600", flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EAB308", marginLeft: 8 },
  cardBody: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  cardTime: { fontSize: 11 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },
});
