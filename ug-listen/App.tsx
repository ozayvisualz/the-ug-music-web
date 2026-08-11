import { useEffect, useRef } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Animated } from "react-native";
import { COLORS } from "./src/constants/theme";
import { useAuthStore } from "./src/store/authStore";
import LoginScreen from "./src/screens/LoginScreen";
import RootNavigator from "./src/navigation/RootNavigator";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { getStoredToken, getStoredUser, setAuthToken } from "./src/api/auth";

export default function App() {
  const { user, loading, setUser, setLoading } = useAuthStore();

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
    return <View style={styles.center}><StatusBar style="light" /><ActivityIndicator size="large" color={COLORS.gold} /></View>;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <StatusBar style="light" />
          {user ? <AppShell /> : <LoginScreen />}
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.shell, { opacity: fadeAnim }]}>
      <RootNavigator />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" },
  shell: { flex: 1 },
});
