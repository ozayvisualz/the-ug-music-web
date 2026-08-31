import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, CreditCard, Plus, Trash2 } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
import { trpc } from "../api/client";

export default function ArtistPaymentMethodsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState("MTN Mobile Money");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await trpc.artist.getMyPaymentMethods.query();
      setMethods(Array.isArray(data) ? data : []);
    } catch {
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAdd = async () => {
    if (!accountName.trim() || !accountNumber.trim()) { Alert.alert("Details", "Enter account name and number."); return; }
    setSaving(true);
    try {
      await trpc.artist.addPaymentMethod.mutate({
        type: "mobile_money",
        provider,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
      });
      setAccountName("");
      setAccountNumber("");
      setShowForm(false);
      load();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not add payment method.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Remove", "Remove this payment method?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await trpc.artist.deletePaymentMethod.mutate({ methodId: id });
            load();
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Could not remove.");
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
          <Text style={[styles.headerTitle, { color: colors.white }]}>Payment Methods</Text>
          <TouchableOpacity onPress={() => setShowForm((v) => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Plus size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {showForm && (
            <View style={[styles.form, { backgroundColor: colors.surface }]}>
              <Text style={styles.label}>Provider</Text>
              <View style={styles.genreWrap}>
                {["MTN Mobile Money", "Airtel Money"].map((p) => (
                  <TouchableOpacity key={p} onPress={() => setProvider(p)} style={[styles.pill, { backgroundColor: provider === p ? COLORS.gold : colors.bgLight, borderColor: colors.border }]}>
                    <Text style={{ color: provider === p ? COLORS.bg : colors.text, fontSize: 12, fontWeight: "600" }}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Account Name</Text>
              <TextInput value={accountName} onChangeText={setAccountName} placeholder="Account holder name" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.white, borderColor: colors.border }]} />
              <Text style={styles.label}>Account Number</Text>
              <TextInput value={accountNumber} onChangeText={setAccountNumber} placeholder="Phone / account number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" style={[styles.input, { color: colors.white, borderColor: colors.border }]} />
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
          ) : methods.length === 0 && !showForm ? (
            <View style={styles.emptyWrap}>
              <CreditCard size={32} color={colors.textMuted} />
              <Text style={styles.empty}>No payment methods yet.</Text>
            </View>
          ) : (
            methods.map((m: any) => (
              <View key={m.id} style={[styles.row, { backgroundColor: colors.surface }]}>
                <CreditCard size={18} color={COLORS.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.white }]}>{m.provider} · {m.accountName}</Text>
                  <Text style={styles.sub}>{m.accountNumber}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(m.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Trash2 size={18} color={COLORS.red} />
                </TouchableOpacity>
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
  form: { borderRadius: 14, padding: 16, marginBottom: 16 },
  label: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600", marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12 },
  genreWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  saveBtn: { backgroundColor: COLORS.gold, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  saveText: { color: COLORS.bg, fontWeight: "700", fontSize: 14 },
  emptyWrap: { alignItems: "center", marginTop: 40 },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, padding: 14, marginBottom: 8 },
  name: { fontSize: 13, fontWeight: "600" },
  sub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
