import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";

const NOTIFICATIONS = [
  { id: "1", title: "Welcome to TheUgMusic!", body: "Discover the best Ugandan music. Stream, download, and support your favorite artists.", time: "Just now" },
  { id: "2", title: "New Feature", body: "Premium plans are now available. Upgrade for HD audio and offline downloads.", time: "2 days ago" },
];

export default function NotificationsScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.header, { color: colors.text }]}>Notifications</Text>
      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.time, { color: colors.textMuted }]}>{item.time}</Text>
            </View>
            <Text style={[styles.body, { color: colors.textMuted }]}>{item.body}</Text>
          </View>
        )}
        style={styles.list}
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
  body: { fontSize: 13, lineHeight: 20 },
});
