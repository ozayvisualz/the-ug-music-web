import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { getStoredToken } from "../api/auth";

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      try {
        const res = await fetch("https://theugmusic.com/api/admin/notifications", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (Array.isArray(data)) setNotifications(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const formatTime = (d: string) => {
    if (!d) return "Recently";
    const now = new Date();
    const then = new Date(d);
    const diff = now.getTime() - then.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return then.toLocaleDateString();
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
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(item.createdAt)}</Text>
            </View>
            <Text style={[styles.body, { color: colors.textMuted }]}>{item.body}</Text>
            <Text style={[styles.audience, { color: colors.textDisabled }]}>{item.audience}</Text>
          </View>
        )}
        style={styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>No notifications yet</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 28, fontWeight: "800", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  list: { paddingHorizontal: 16 },
  card: { padding: 16, borderRadius: 14, marginBottom: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  title: { fontSize: 15, fontWeight: "600", flex: 1 },
  time: { fontSize: 12 },
  body: { fontSize: 13, lineHeight: 20, marginBottom: 4 },
  audience: { fontSize: 10, textTransform: "uppercase" },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },
});
