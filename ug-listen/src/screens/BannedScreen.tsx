import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldAlert } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import { useAuthStore } from "../store/authStore";
import { logout } from "../api/auth";

export default function BannedScreen({ reason }: { reason?: string }) {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <ShieldAlert size={48} color={colors.red} />
        </View>
        <Text style={[styles.title, { color: colors.white }]}>Account Banned</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Your account has been banned from The UG Music.
        </Text>
        {reason ? <Text style={[styles.reason, { color: colors.textMuted }]}>Reason: {reason}</Text> : null}
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.gold }]} onPress={() => logout().then(() => {})}>
          <Text style={styles.btnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(239,68,68,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: "center", marginBottom: 16 },
  reason: { fontSize: 13, textAlign: "center", marginBottom: 32 },
  btn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: "rgb(9,9,11)", fontWeight: "700", fontSize: 15 },
});
