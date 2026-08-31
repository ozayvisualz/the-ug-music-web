import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ArrowLeft, Music2, Play, Heart, Shuffle } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useTheme } from "../theme/ThemeContext";
import { useQueueStore } from "../store/playerStore";
import { getAuthToken } from "../api/client";

const SW = Dimensions.get("window").width;
const ART = Math.min(SW * 0.35, 160);

const CATEGORY_ICONS: Record<string, string> = {
  "Trending in Kampala": "\u{1F1FA}\u{1F1EC}",
  "New Ugandan Artists": "\u{1F3A4}",
  "Viral TikTok Uganda": "\u{1F525}",
  "Fresh Dancehall": "\u{1F3B6}",
  "Lugaflow": "\u{1F941}",
  "Gospel Hits": "\u{1F64F}",
  "Party Mixes": "\u{1F389}",
  "Radio Charts": "\u{1F4FB}",
  "Editor's Picks": "\u{2B50}",
  "Hidden Gems": "\u{1F48E}",
  "Morning Vibes": "\u{1F305}",
  "Road Trip": "\u{1F697}",
  "Workout Mix": "\u{1F4AA}",
  "Chill & Relax": "\u{1F60C}",
  "Love Songs": "\u{1F496}",
  "Study & Focus": "\u{1F4DA}",
  "Late Night": "\u{1F319}",
};

function getArtistName(a: any) {
  return a?.artistName || a?.user?.name || "Unknown";
}

export default function CategoryPlaylistScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const setQueue = useQueueStore((s) => s.setQueue);

  const category: string = route.params?.category || "Trending in Kampala";
  const icon = CATEGORY_ICONS[category] || "\u{1F3B5}";

  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const token = getAuthToken();
    const url = `https://www.theugmusic.com/api/mobile/home?t=${Date.now()}`;
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => {
        const allSongs = [...(d.trending || []), ...(d.newReleases || [])];
        const keyword = category.toLowerCase().replace("viral tiktok uganda", "tiktok").replace("ugandan ", "").replace("fresh ", "").split(" ")[0];
        const filtered = allSongs.length > 0 ? allSongs : [];
        setSongs(filtered.slice(0, 20));
      })
      .catch(() => setSongs([]))
      .finally(() => setLoading(false));
  }, [category]);

  const handlePlayAll = () => {
    const tracks = songs.map((s: any) => ({
      id: s.id, title: s.title, artist: getArtistName(s.artist),
      url: s.fileUrl || s.hlsUrl || "", duration: s.duration || 180, coverUrl: s.coverUrl, artistId: s.artistId, featuredArtistId: s.featuredArtistId,
    }));
    if (tracks.length > 0) setQueue(tracks);
  };

  const handlePlaySong = (song: any, index: number) => {
    const tracks = songs.map((s: any) => ({
      id: s.id, title: s.title, artist: getArtistName(s.artist),
      url: s.fileUrl || s.hlsUrl || "", duration: s.duration || 180, coverUrl: s.coverUrl, artistId: s.artistId, featuredArtistId: s.featuredArtistId,
    }));
    setQueue(tracks, index);
  };

  const formatDuration = (d: number) => {
    const m = Math.floor((d || 0) / 60);
    return `${m}:${((d || 0) % 60).toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{category}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.hero}>
        <View style={[styles.heroArt, { backgroundColor: colors.goldMuted }]}>
          <Text style={styles.heroIcon}>{icon}</Text>
        </View>
        <Text style={[styles.heroTitle, { color: colors.text }]}>{category}</Text>
        <Text style={[styles.heroSub, { color: colors.textMuted }]}>{songs.length} songs</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.playBtn, { backgroundColor: colors.gold }]} onPress={handlePlayAll}>
            <Play size={18} color={colors.bg} fill={colors.bg} />
            <Text style={[styles.playText, { color: colors.bg }]}>Play All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shuffleBtn, { borderColor: colors.border }]} onPress={handlePlayAll}>
            <Shuffle size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.row} onPress={() => handlePlaySong(item, index)} activeOpacity={0.7}>
              <Text style={[styles.idx, { color: colors.textMuted }]}>{index + 1}</Text>
              <View style={[styles.rowArt, { backgroundColor: colors.goldMuted }]}>
                <Music2 size={16} color={colors.gold} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.rowArtist, { color: colors.textMuted }]} numberOfLines={1}>{getArtistName(item.artist)}</Text>
              </View>
              <Text style={[styles.rowDur, { color: colors.textMuted }]}>{formatDuration(item.duration)}</Text>
            </TouchableOpacity>
          )}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },
  hero: { alignItems: "center", paddingVertical: 16 },
  heroArt: { width: ART, height: ART, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  heroIcon: { fontSize: 48 },
  heroTitle: { fontSize: 22, fontWeight: "800", marginTop: 12 },
  heroSub: { fontSize: 13, marginTop: 2 },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  playBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99 },
  playText: { fontWeight: "700", fontSize: 14 },
  shuffleBtn: { padding: 12, borderRadius: 99, borderWidth: 1 },
  list: { paddingHorizontal: 16 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10 },
  idx: { fontSize: 13, width: 22, textAlign: "center" },
  rowArt: { width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, fontWeight: "600" },
  rowArtist: { fontSize: 12, marginTop: 2 },
  rowDur: { fontSize: 12 },
});
