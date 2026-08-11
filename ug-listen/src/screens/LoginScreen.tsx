import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Music2 } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { setAuthToken } from "../api/client";
import { useAuthStore } from "../store/authStore";

export default function LoginScreen() {
  const [tab, setTab] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"LISTENER" | "ARTIST">("LISTENER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const isLogin = tab === "signin";
      if (isLogin && (!email.trim() || !password)) { setError("Please enter email and password"); setLoading(false); return; }
      if (!isLogin && (!name.trim() || !email.trim() || !password)) { setError("Please fill all fields"); setLoading(false); return; }

      const urlPath = isLogin
        ? `/api/auth/login-get?email=${encodeURIComponent(email.trim())}&password=${encodeURIComponent(password)}`
        : "/api/auth/register";
      const method = isLogin ? "GET" : "POST";
      const body = isLogin ? undefined : JSON.stringify({ name: name.trim(), email: email.trim(), password, role });

      const res = await fetch("https://theugmusic.com" + urlPath, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body ? { body } : {}),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed (" + res.status + ")"); setLoading(false); return; }
      if (!data.token || !data.user) { setError("Invalid server response"); setLoading(false); return; }

      setAuthToken(data.token);
      setError("Login successful! Loading app...");
      setLoading(false);
      setTimeout(() => setUser(data.user), 500);
    } catch (e: any) {
      setError(String(e.message ?? "Something went wrong"));
      setLoading(false);
    }
  };

  const handleGuest = () => {
    setUser({
      id: "guest",
      email: "",
      name: "Guest",
      role: "LISTENER",
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Music2 size={28} color={COLORS.bg} />
          </View>

          <Text style={styles.brand}>TheUgMusic</Text>

          <View style={styles.pillRow}>
            <TouchableOpacity
              style={[styles.pill, tab === "signin" && styles.pillActive]}
              onPress={() => setTab("signin")}
            >
              <Text
                style={[styles.pillText, tab === "signin" && styles.pillTextActive]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, tab === "register" && styles.pillActive]}
              onPress={() => setTab("register")}
            >
              <Text
                style={[
                  styles.pillText,
                  tab === "register" && styles.pillTextActive,
                ]}
              >
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {error !== "" && <Text style={styles.error}>{error}</Text>}

          {tab === "register" && (
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {tab === "register" && (
            <View style={styles.pillRow}>
              <TouchableOpacity
                style={[
                  styles.rolePill,
                  role === "LISTENER" && styles.rolePillActive,
                ]}
                onPress={() => setRole("LISTENER")}
              >
                <Text
                  style={[
                    styles.rolePillText,
                    role === "LISTENER" && styles.rolePillTextActive,
                  ]}
                >
                  Listener
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rolePill,
                  role === "ARTIST" && styles.rolePillActive,
                ]}
                onPress={() => setRole("ARTIST")}
              >
                <Text
                  style={[
                    styles.rolePillText,
                    role === "ARTIST" && styles.rolePillTextActive,
                  ]}
                >
                  Artist
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text style={styles.submitText}>
                {tab === "signin" ? "Sign In" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestBtn}
            onPress={handleGuest}
            activeOpacity={0.7}
          >
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testBtn}
            onPress={() => setUser({ id: Date.now().toString(), email: "test@test.com", name: "Test User", role: "LISTENER" })}
            activeOpacity={0.7}
          >
            <Text style={styles.testText}>Login as Test User</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 384,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brand: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 24,
  },
  pillRow: {
    flexDirection: "row",
    backgroundColor: COLORS.bg,
    borderRadius: 999,
    padding: 3,
    marginBottom: 20,
    width: "100%",
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  pillActive: {
    backgroundColor: COLORS.gold,
  },
  pillText: {
    color: COLORS.textMuted,
    fontWeight: "600",
    fontSize: 14,
  },
  pillTextActive: {
    color: COLORS.bg,
  },
  error: {
    color: COLORS.red,
    fontSize: 13,
    marginBottom: 14,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.white,
    marginBottom: 12,
  },
  rolePill: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  rolePillActive: {
    backgroundColor: COLORS.gold,
  },
  rolePillText: {
    color: COLORS.textMuted,
    fontWeight: "600",
    fontSize: 14,
  },
  rolePillTextActive: {
    color: COLORS.bg,
  },
  submitBtn: {
    width: "100%",
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
  },
  submitText: {
    color: COLORS.bg,
    fontWeight: "700",
    fontSize: 15,
  },
  guestBtn: {
    marginTop: 16,
    paddingVertical: 10,
  },
  guestText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  testBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 12,
    alignSelf: "center",
  },
  testText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: "600",
  },
});
