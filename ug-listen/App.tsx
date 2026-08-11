import { useEffect, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, Animated } from "react-native";
import { useAuthStore } from "./src/store/authStore";
import LoginScreen from "./src/screens/LoginScreen";
import RootNavigator from "./src/navigation/RootNavigator";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { getStoredToken, getStoredUser, setAuthToken } from "./src/api/auth";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { PlayerProvider } from "./src/components/PlayerContext";

function AppContent() {
  const { user, loading, setUser, setLoading } = useAuthStore();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        const token = await getStoredToken();
        if (token) {
          const stored = await getStoredUser();
          if (stored) { setAuthToken(token); setUser(stored); return; }
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {user ? <AppShell /> : <LoginScreen />}
    </View>
  );
}

function AppShell() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.shell, { opacity: fadeAnim, backgroundColor: colors.bg }]}>
      <RootNavigator />
    </Animated.View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
      <ThemeProvider>
        <PlayerProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </PlayerProvider>
      </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  shell: { flex: 1 },
});
