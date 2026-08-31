import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, Eye, EyeOff, Trash2, Music2, Clock, CheckCircle2 } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";

function fmt(s: number) {
  return `${Math.floor((s || 0) / 60)}:${((s || 0) % 60).toString().padStart(2, "0")}`;
}

export default function ArtistSongsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await trpc.artist.getMySongs.query();
      setSongs(Array.isArray(data) ? data : []);
    } catch {
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const togglePublish = async (song: any) => {
    try {
      await trpc.artist.togglePublish.mutate({ songId: song.id });
      load();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not update song.");
    }
  };

  const deleteSong = (song: any) => {
    Alert.alert("Delete Song", `Delete "${song.title}" permanently?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await trpc.artist.deleteSong.mutate({ songId: song.id });
            load();
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Could not delete song.");
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.white }]}>My Songs</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={COLORS.gold} /></View>
        ) : songs.length === 0 ? (
          <View style={styles.center}>
            <Music2 size={32} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.white }]}>No songs yet</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("ArtistUpload")}>
              <Text style={styles.primaryBtnText}>Upload a Song</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={songs}
            keyExtractor={(s) => s.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
            renderItem={({ item }) => (
              <View style={[styles.row, { backgroundColor: colors.surface }]}>
                <View style={styles.art}><Music2 size={16} color={COLORS.gold} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.title, { color: colors.white }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.sub}>{fmt(item.duration)} · {item.playCount || 0} plays · {item.downloadCount || 0} dls</Text>
                  <View style={styles.statusRow}>
                    {item.approved ? <CheckCircle2 size={12} color={COLORS.green} /> : <Clock size={12} color={COLORS.gold} />}
                    <Text style={{ color: item.approved ? COLORS.green : COLORS.gold, fontSize: 11, fontWeight: "600" }}>
                      {item.approved ? (item.published ? "Live" : "Approved · Hidden") : "Pending Approval"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => togglePublish(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.iconBtn}>
                  {item.published ? <EyeOff size={18} color={colors.text} /> : <Eye size={18} color={colors.text} />}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteSong(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.iconBtn}>
                  <Trash2 size={18} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.white },
  center: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginTop: 12, marginBottom: 16 },
  primaryBtn: { backgroundColor: COLORS.gold, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  primaryBtnText: { color: COLORS.bg, fontWeight: "700", fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 12, marginBottom: 10 },
  art: { width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.goldMuted, alignItems: "center", justifyContent: "center", marginRight: 12 },
  title: { fontSize: 14, fontWeight: "600" },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  iconBtn: { padding: 8, marginLeft: 4 },
});
