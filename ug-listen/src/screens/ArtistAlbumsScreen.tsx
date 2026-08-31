import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, Disc3 } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";

export default function ArtistAlbumsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await trpc.artist.getMyAlbums.query();
      setAlbums(Array.isArray(data) ? data : []);
    } catch {
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.white }]}>Albums</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
          ) : albums.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Disc3 size={32} color={colors.textMuted} />
              <Text style={styles.empty}>No albums yet.</Text>
            </View>
          ) : (
            albums.map((a: any) => (
              <View key={a.id} style={[styles.row, { backgroundColor: colors.surface }]}>
                <View style={styles.art}>
                  {a.coverUrl ? (
                    <Image source={{ uri: a.coverUrl }} style={styles.artImg} />
                  ) : (
                    <Disc3 size={18} color={COLORS.gold} />
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.title, { color: colors.white }]} numberOfLines={1}>{a.title}</Text>
                  <Text style={styles.sub}>{a.genre || "Album"} · {a.songs?.length ?? 0} songs</Text>
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
  row: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 12, marginBottom: 10 },
  art: { width: 48, height: 48, borderRadius: 8, backgroundColor: COLORS.goldMuted, alignItems: "center", justifyContent: "center", marginRight: 12, overflow: "hidden" },
  artImg: { width: "100%", height: "100%" },
  title: { fontSize: 14, fontWeight: "600" },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
