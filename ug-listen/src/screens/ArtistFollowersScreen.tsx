import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, Users } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";

export default function ArtistFollowersScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await trpc.artist.getMyFollowers.query();
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const followers = data?.followers || [];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.white }]}>Followers</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
          ) : !data ? (
            <Text style={styles.empty}>Followers unavailable.</Text>
          ) : (
            <>
              <View style={[styles.countCard, { backgroundColor: colors.surface }]}>
                <Users size={20} color={COLORS.gold} />
                <Text style={[styles.count, { color: colors.white }]}>{data.count ?? 0}</Text>
                <Text style={styles.countLabel}>Followers</Text>
              </View>

              {followers.length === 0 ? (
                <Text style={styles.empty}>No followers yet.</Text>
              ) : (
                followers.map((f: any) => (
                  <View key={f.id} style={[styles.row, { backgroundColor: colors.surface }]}>
                    <View style={styles.avatar}>
                      {f.image ? (
                        <Image source={{ uri: f.image }} style={styles.avatarImg} />
                      ) : (
                        <Text style={styles.avatarText}>{(f.name || "?").charAt(0).toUpperCase()}</Text>
                      )}
                    </View>
                    <Text style={[styles.name, { color: colors.white }]} numberOfLines={1}>{f.name || "Unknown"}</Text>
                  </View>
                ))
              )}
            </>
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
  countCard: { borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 20 },
  count: { fontSize: 28, fontWeight: "700", marginTop: 6 },
  countLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 12, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.goldMuted, alignItems: "center", justifyContent: "center", marginRight: 12, overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%" },
  avatarText: { color: COLORS.gold, fontWeight: "700", fontSize: 16 },
  name: { fontSize: 14, fontWeight: "600", flex: 1 },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: 30 },
});
