import { WebView } from "react-native-webview";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <WebView
          source={{ uri: "https://theugmusic.com" }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          cacheEnabled
          onLoadEnd={() => setLoading(false)}
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#EAB308" />
            </View>
          )}
        />
        {loading && (
          <View style={styles.splash}>
            <ActivityIndicator size="large" color="#EAB308" />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090B" },
  webview: { flex: 1 },
  loader: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "#09090B",
  },
  splash: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "#09090B",
  },
});
