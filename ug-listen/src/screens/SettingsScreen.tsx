import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Moon, Sun, Smartphone } from "lucide-react-native";
import { useTheme, ThemeMode } from "../theme/ThemeContext";

const OPTIONS: { mode: ThemeMode; label: string; icon: (color: string) => React.ReactNode }[] = [
  {
    mode: "system",
    label: "System",
    icon: (color: string) => <Smartphone size={20} color={color} />,
  },
  {
    mode: "dark",
    label: "Dark",
    icon: (color: string) => <Moon size={20} color={color} />,
  },
  {
    mode: "light",
    label: "Light",
    icon: (color: string) => <Sun size={20} color={color} />,
  },
];

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { colors, mode, setMode } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.section]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {OPTIONS.map((option, index) => {
            const isActive = mode === option.mode;
            return (
              <TouchableOpacity
                key={option.mode}
                style={[
                  styles.row,
                  index < OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                activeOpacity={0.7}
                onPress={() => setMode(option.mode)}
              >
                {option.icon(isActive ? colors.gold : colors.textMuted)}
                <Text
                  style={[
                    styles.label,
                    { color: isActive ? colors.gold : colors.textMuted },
                  ]}
                >
                  {option.label}
                </Text>
                {isActive && (
                  <Text style={[styles.checkmark, { color: colors.gold }]}>{/* checkmark */}✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpacer: {
    width: 32,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  checkmark: {
    fontSize: 16,
    fontWeight: "700",
  },
});
