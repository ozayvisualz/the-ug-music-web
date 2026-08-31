import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, Wallet } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";

function fmt(n: number) {
  return "UGX " + (n || 0).toLocaleString();
}

export default function ArtistEarningsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await trpc.artist.getMyEarnings.query();
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const wallet = data?.wallet;
  const records = data?.revenueRecords || [];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.white }]}>Earnings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
          ) : !data ? (
            <Text style={styles.empty}>Earnings unavailable.</Text>
          ) : (
            <>
              <View style={[styles.walletCard, { backgroundColor: colors.surface }]}>
                <Wallet size={20} color={COLORS.gold} />
                <Text style={[styles.walletValue, { color: COLORS.gold }]}>{fmt(wallet?.availableBalance || 0)}</Text>
                <Text style={styles.walletLabel}>Available Balance</Text>
                <View style={styles.walletRow}>
                  <Text style={styles.walletSub}>Pending: {fmt(wallet?.pendingBalance || 0)}</Text>
                  <Text style={styles.walletSub}>Lifetime: {fmt(wallet?.lifetimeEarnings || 0)}</Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.white }]}>Recent Activity</Text>
              {records.length === 0 ? (
                <Text style={styles.empty}>No earnings yet.</Text>
              ) : (
                records.map((r: any, i: number) => (
                  <View key={r.id || i} style={[styles.record, { backgroundColor: colors.surface }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recordSource, { color: colors.white }]}>{r.source}</Text>
                      <Text style={styles.recordDate}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</Text>
                    </View>
                    <Text style={[styles.recordAmount, { color: COLORS.gold }]}>{fmt(r.artistShare || 0)}</Text>
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
  walletCard: { borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 20 },
  walletValue: { fontSize: 28, fontWeight: "700", marginTop: 8 },
  walletLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  walletRow: { flexDirection: "row", gap: 16, marginTop: 12 },
  walletSub: { fontSize: 11, color: COLORS.textMuted },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  record: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 14, marginBottom: 8 },
  recordSource: { fontSize: 13, fontWeight: "600" },
  recordDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  recordAmount: { fontSize: 13, fontWeight: "700" },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: 30 },
});
