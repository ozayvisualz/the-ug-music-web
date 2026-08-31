import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, MessageCircle } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";

export default function ArtistCommentsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await trpc.artist.getMyComments.query();
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const comments = data?.comments || [];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.white }]}>Comments</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
          ) : !data ? (
            <Text style={styles.empty}>Comments unavailable.</Text>
          ) : comments.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MessageCircle size={32} color={colors.textMuted} />
              <Text style={styles.empty}>No comments yet.</Text>
            </View>
          ) : (
            comments.map((c: any, i: number) => (
              <View key={c.id || i} style={[styles.row, { backgroundColor: colors.surface }]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(c.user?.name || "?").charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.white }]}>{c.user?.name || "Unknown"}</Text>
                  <Text style={styles.song}>{c.song?.title || ""}</Text>
                  <Text style={styles.commentText}>{c.content}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.white },
  content: { padding: 16, paddingBottom: 60 },
  emptyWrap: { alignItems: "center", marginTop: 40 },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: 12 },
  row: { flexDirection: "row", borderRadius: 12, padding: 12, marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.goldMuted, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: COLORS.gold, fontWeight: "700" },
  name: { fontSize: 13, fontWeight: "600" },
  song: { fontSize: 11, color: COLORS.gold, marginTop: 1 },
  commentText: { fontSize: 13, color: COLORS.textMuted, marginTop: 3 },
});
