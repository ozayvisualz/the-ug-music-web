import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, Banknote } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";

function fmt(n: number) {
  return "UGX " + (n || 0).toLocaleString();
}

export default function ArtistWithdrawalsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await trpc.artist.getMyPayouts.query();
      setPayouts(Array.isArray(data) ? data : []);
    } catch {
      setPayouts([]);
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
          <Text style={[styles.headerTitle, { color: colors.white }]}>Withdrawals</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
          ) : payouts.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Banknote size={32} color={colors.textMuted} />
              <Text style={styles.empty}>No withdrawals yet.</Text>
            </View>
          ) : (
            payouts.map((p: any) => (
              <View key={p.id} style={[styles.row, { backgroundColor: colors.surface }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.amount, { color: colors.white }]}>{fmt(p.amount)}</Text>
                  <Text style={styles.sub}>{p.method || "Withdrawal"} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: p.status === "COMPLETED" ? COLORS.greenMuted : p.status === "FAILED" ? COLORS.redMuted : COLORS.goldMuted }]}>
                  <Text style={{ color: p.status === "COMPLETED" ? COLORS.green : p.status === "FAILED" ? COLORS.red : COLORS.gold, fontSize: 11, fontWeight: "700" }}>
                    {p.status}
                  </Text>
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
  row: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 14, marginBottom: 8 },
  amount: { fontSize: 15, fontWeight: "700" },
  sub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statusPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
});
