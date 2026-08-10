import { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { getStoredToken, getStoredUser, setAuthToken } from "./src/api/auth";
import { useAuthStore } from "./src/store/authStore";
import LoginScreen from "./src/screens/LoginScreen";
import RootNavigator from "./src/navigation/RootNavigator";
import { COLORS } from "./src/constants/theme";

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
        <StatusBar style="light" />
        {user ? <RootNavigator /> : <LoginScreen />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" },
});
