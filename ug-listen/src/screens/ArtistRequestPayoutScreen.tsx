import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, Banknote, Plus } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";

function fmt(n: number) {
  return "UGX " + (n || 0).toLocaleString();
}

export default function ArtistRequestPayoutScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [status, setStatus] = useState<any>(null);
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([
        trpc.artist.getWithdrawalStatus.query(),
        trpc.artist.getMyPaymentMethods.query(),
      ]);
      setStatus(s);
      setMethods(Array.isArray(m) ? m : []);
    } catch {
      setStatus(null);
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRequest = async () => {
    const primary = methods.find((m) => m.isDefault) || methods[0];
    if (!primary) {
      Alert.alert("Payment Method", "Add a payment method first.", [
        { text: "Cancel", style: "cancel" },
        { text: "Add", onPress: () => navigation.navigate("ArtistPaymentMethods") },
      ]);
      return;
    }
    setRequesting(true);
    try {
      await trpc.artist.requestPayout.mutate({ amount: status?.balance, methodId: primary.id });
      Alert.alert("Requested", "Your withdrawal request has been submitted.", [{ text: "OK", onPress: () => { load(); } }]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not request payout.");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.white }]}>Request Withdrawal</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
          ) : status ? (
            <>
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <Banknote size={20} color={COLORS.gold} />
                <Text style={[styles.balance, { color: colors.white }]}>{fmt(status.balance)}</Text>
                <Text style={styles.label}>Available Balance</Text>
                <Text style={styles.threshold}>Minimum: {fmt(status.threshold)}</Text>
              </View>

              {status.eligible ? (
                <TouchableOpacity style={styles.requestBtn} onPress={handleRequest} disabled={requesting}>
                  {requesting ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.requestText}>Request Withdrawal</Text>}
                </TouchableOpacity>
              ) : (
                <Text style={styles.reason}>{status.reason || "Not eligible for withdrawal yet."}</Text>
              )}
            </>
          ) : (
            <Text style={styles.empty}>Withdrawal status unavailable.</Text>
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
  card: { borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 20 },
  balance: { fontSize: 28, fontWeight: "700", marginTop: 8 },
  label: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  threshold: { fontSize: 11, color: COLORS.textMuted, marginTop: 8 },
  requestBtn: { backgroundColor: COLORS.gold, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  requestText: { color: COLORS.bg, fontWeight: "700", fontSize: 15 },
  reason: { textAlign: "center", color: COLORS.gold, fontSize: 13, marginTop: 4 },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: 40 },
});
