import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Music2 } from "lucide-react-native";
import { login, register } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { COLORS } from "../constants/theme";

type AuthMode = "signin" | "register";

export default function LoginScreen({ navigation }: { navigation: any }) {
  const { setUser } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"LISTENER" | "ARTIST">("LISTENER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const handleSignIn = useCallback(async () => {
    clearError();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      setUser(user);
    } catch (e: any) {
      setError(e?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, password, clearError, setUser]);

  const handleRegister = useCallback(async () => {
    clearError();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const user = await register(name.trim(), email.trim(), password, role);
      setUser(user);
    } catch (e: any) {
      setError(e?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [name, email, password, role, clearError, setUser]);

  const handleGuest = useCallback(() => {
    setUser({
      id: "guest",
      email: "",
      name: "Guest",
      role: "LISTENER",
    });
  }, [setUser]);

  const switchMode = useCallback((newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Music2 size={36} color={COLORS.bg} />
          </View>
          <Text style={styles.appName}>TheUgMusic</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, mode === "signin" && styles.tabActive]}
              onPress={() => switchMode("signin")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === "signin" && styles.tabTextActive,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "register" && styles.tabActive]}
              onPress={() => switchMode("register")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === "register" && styles.tabTextActive,
                ]}
              >
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {mode === "signin" ? (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitDisabled]}
                onPress={handleSignIn}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.bg} size="small" />
                ) : (
                  <Text style={styles.submitText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
              <View style={styles.roleRow}>
                <Text style={styles.roleLabel}>I am a</Text>
                <View style={styles.roleToggle}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      role === "LISTENER" && styles.roleOptionActive,
                    ]}
                    onPress={() => setRole("LISTENER")}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        role === "LISTENER" && styles.roleOptionTextActive,
                      ]}
                    >
                      Listener
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      role === "ARTIST" && styles.roleOptionActive,
                    ]}
                    onPress={() => setRole("ARTIST")}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        role === "ARTIST" && styles.roleOptionTextActive,
                      ]}
                    >
                      Artist
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.bg} size="small" />
                ) : (
                  <Text style={styles.submitText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={handleGuest}
          activeOpacity={0.7}
        >
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: COLORS.goldMuted,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.gold,
  },
  errorContainer: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    textAlign: "center",
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.white,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roleLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  roleToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 3,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  roleOptionActive: {
    backgroundColor: COLORS.goldMuted,
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  roleOptionTextActive: {
    color: COLORS.gold,
  },
  submitButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    minHeight: 52,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.bg,
  },
  guestButton: {
    alignSelf: "center",
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
});
