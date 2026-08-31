import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, Play, Download, TrendingUp, Music2, Disc3, Wallet } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n || 0);
}

export default function ArtistAnalyticsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await trpc.artist.getMyAnalytics.query({ days: 30 });
      setStats(data);
    } catch {
      setStats(null);
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
          <Text style={[styles.headerTitle, { color: colors.white }]}>Analytics</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
          ) : stats ? (
            <>
              <Text style={[styles.artistName, { color: colors.white }]}>{stats.artistName}</Text>
              <Text style={styles.period}>Last {stats.period || 30} days</Text>

              <View style={styles.grid}>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                  <Play size={18} color={COLORS.gold} />
                  <Text style={[styles.value, { color: colors.white }]}>{fmt(stats.totalStreams)}</Text>
                  <Text style={styles.label}>Plays</Text>
                </View>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                  <Download size={18} color={COLORS.gold} />
                  <Text style={[styles.value, { color: colors.white }]}>{fmt(stats.totalDownloads)}</Text>
                  <Text style={styles.label}>Downloads</Text>
                </View>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                  <Music2 size={18} color={COLORS.gold} />
                  <Text style={[styles.value, { color: colors.white }]}>{stats.totalSongs}</Text>
                  <Text style={styles.label}>Songs</Text>
                </View>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                  <Disc3 size={18} color={COLORS.gold} />
                  <Text style={[styles.value, { color: colors.white }]}>{stats.totalAlbums}</Text>
                  <Text style={styles.label}>Albums</Text>
                </View>
              </View>

              <View style={[styles.revenueCard, { backgroundColor: colors.surface }]}>
                <Wallet size={18} color={COLORS.gold} />
                <Text style={styles.revenueTitle}>Earnings</Text>
                <Text style={[styles.revenueValue, { color: COLORS.gold }]}>UGX {fmt(stats.artistEarnings || 0)}</Text>
                <Text style={styles.revenueSub}>Total revenue: UGX {fmt(stats.totalRevenue || 0)}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.empty}>Analytics unavailable.</Text>
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
  artistName: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  period: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginTop: 2, marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  card: { flexBasis: "47%", flexGrow: 1, borderRadius: 14, padding: 16, alignItems: "center" },
  value: { fontSize: 20, fontWeight: "700", marginTop: 6 },
  label: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  revenueCard: { borderRadius: 14, padding: 16, alignItems: "center" },
  revenueTitle: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600", marginTop: 6 },
  revenueValue: { fontSize: 22, fontWeight: "700", marginTop: 4 },
  revenueSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: 40 },
});
