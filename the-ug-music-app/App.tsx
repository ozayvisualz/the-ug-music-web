import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useState } from "react";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [loading, setLoading] = useState(true);

  const onLoadEnd = useCallback(() => {
    setLoading(false);
    SplashScreen.hideAsync();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <WebView
        source={{ uri: "https://theugmusic.com" }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onLoadEnd={onLoadEnd}
        cacheEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        startInLoadingState
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090B" },
  webview: { flex: 1 },
  loader: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#09090B",
  },
  splash: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#09090B",
  },
});
