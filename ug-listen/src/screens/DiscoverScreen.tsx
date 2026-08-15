import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Music2, Search, Play } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useQueueStore } from "../store/playerStore";
import { useTheme } from "../theme/ThemeContext";
import { getStoredToken } from "../api/auth";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SW = SCREEN_WIDTH;
const H_PAD = 16;
const GAP = 10;
const CARD_W = (SW - H_PAD * 2 - GAP * 3) / 4;

type Song = { id: string; title: string; artist: any; duration: number; url: string; coverUrl?: string; fileUrl?: string; hlsUrl?: string };

function getArtistName(a: any): string {
  if (!a) return "Unknown";
  if (typeof a === "string") return a;
  return a.artistName || a.user?.name || "Unknown";
}

const TRENDING_SEARCHES = [
  "Eddy Kenzo", "Sheebah", "Bobi Wine", "Rema", "Vinka",
  "Spice Diana", "John Blaq", "Azawi", "Alien Skin", "Winnie Nwagi",
];

const GENRES = [
  { emoji: "\u{1F525}", name: "Afrobeat" },
  { emoji: "\u{1F3B6}", name: "Dancehall" },
  { emoji: "\u{1F7E2}", name: "Reggae" },
  { emoji: "\u{1F64F}", name: "Gospel" },
  { emoji: "\u{1F3A4}", name: "Hip Hop" },
  { emoji: "\u{1F941}", name: "Lugaflow" },
];

const BROWSE_ALL = [
  { emoji: "\u{1F195}", label: "New Releases" },
  { emoji: "\u{1F4C8}", label: "Top Charts" },
  { emoji: "\u{1F3B5}", label: "Top Artists" },
  { emoji: "\u{1F49D}", label: "Made For You" },
];

function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionHeader, { color: colors.text }]}>{title}</Text>;
}

function SongCard({ song, onPlay }: { song: Song; onPlay: (song: Song) => void }) {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.songCard, { backgroundColor: colors.surface }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate("Song", { songId: song.id })}
    >
      <View style={styles.songArtwork}>
        {song.coverUrl ? (
          <Image source={{ uri: song.coverUrl }} style={styles.songArtworkImg} />
        ) : (
          <Music2 size={20} color={COLORS.bg} />
        )}
      </View>
      <Text style={[styles.songTitle, { color: colors.white }]} numberOfLines={2}>
        {song.title}
      </Text>
      <Text style={styles.songArtist} numberOfLines={1}>
        {getArtistName(song.artist)}
      </Text>
      <TouchableOpacity
        style={styles.songPlayBtn}
        onPress={() => onPlay(song)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Play size={14} color="#FFC107" fill="#FFC107" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function DiscoverScreen() {
  const navigation = useNavigation<any>();
  const setQueue = useQueueStore((s) => s.setQueue);
  const { colors } = useTheme();

  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [nrLoading, setNrLoading] = useState(true);
  const [trending, setTrending] = useState<Song[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      try {
        const res = await fetch("https://www.theugmusic.com/api/mobile/home", { headers });
        const data = await res.json();
        if (Array.isArray(data.newReleases)) setNewReleases(data.newReleases);
        if (Array.isArray(data.trending)) setTrending(data.trending);
      } catch {}
      setNrLoading(false);
      setTrendingLoading(false);
    })();
  }, []);

  const handlePlaySong = useCallback(
    (song: Song) => {
      setQueue([{ id: song.id, title: song.title, artist: getArtistName(song.artist), url: song.fileUrl || song.hlsUrl || "", duration: song.duration || 180, coverUrl: song.coverUrl, artistId: song.artist?.id }]);
    },
    [setQueue],
  );

  const renderSongItem = useCallback(
    ({ item }: { item: Song }) => <SongCard song={item} onPlay={handlePlaySong} />,
    [handlePlaySong],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.white }]}>Discover</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: colors.surface }]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Search")}
        >
          <Search size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search songs and artists...</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <SectionHeader title="Trending Searches" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.chipScroll}
          >
            {TRENDING_SEARCHES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, { backgroundColor: colors.surface }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("Search", { query: item })}
              >
                <Text style={styles.chipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Popular Genres" />
          <View style={styles.grid2x3}>
            {GENRES.map((genre) => (
              <TouchableOpacity
                key={genre.name}
                style={[styles.genreCard, { backgroundColor: colors.surface }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("CategoryPlaylist", { category: genre.name })}
              >
                <Text style={styles.genreEmoji}>{genre.emoji}</Text>
                <Text style={[styles.genreName, { color: colors.white }]}>{genre.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Browse All" />
          <View style={styles.grid2x2}>
            {BROWSE_ALL.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.browseCard, { backgroundColor: colors.surface }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("CategoryPlaylist", { category: item.label })}
              >
                <Text style={styles.browseEmoji}>{item.emoji}</Text>
                <Text style={[styles.browseLabel, { color: colors.white }]} numberOfLines={2}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="New Releases" />
          {nrLoading ? (
            <ActivityIndicator color={COLORS.gold} style={styles.loader} />
          ) : newReleases.length === 0 ? (
            <Text style={styles.emptyText}>No data yet</Text>
          ) : (
            <FlatList
              data={newReleases}
              keyExtractor={(item) => item.id}
              renderItem={renderSongItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_W + GAP}
              decelerationRate="fast"
              contentContainerStyle={styles.horizontalList}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="This Week's Best" />
          {trendingLoading ? (
            <ActivityIndicator color={COLORS.gold} style={styles.loader} />
          ) : trending.length === 0 ? (
            <Text style={styles.emptyText}>No data yet</Text>
          ) : (
            <FlatList
              data={trending}
              keyExtractor={(item) => item.id}
              renderItem={renderSongItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_W + GAP}
              decelerationRate="fast"
              contentContainerStyle={styles.horizontalList}
            />
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: Math.min(SW * 0.04, 16),
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Math.min(SW * 0.04, 16),
    paddingTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 13,
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#A1A1AA",
    marginBottom: 10,
  },
  chipScroll: {
    paddingRight: 16,
    gap: 6,
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: COLORS.text,
    fontSize: 11,
  },
  grid2x3: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  genreCard: {
    width: CARD_W,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    minHeight: 66,
    justifyContent: "center",
  },
  genreEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  genreName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
  },
  grid2x2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  browseCard: {
    width: CARD_W,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    minHeight: 66,
    justifyContent: "center",
  },
  browseEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  browseLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  horizontalList: {
    gap: GAP,
    paddingHorizontal: 0,
  },
  loader: {
    marginVertical: 16,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginVertical: 8,
  },
  songCard: {
    width: CARD_W,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 8,
    position: "relative",
  },
  songArtwork: {
    width: CARD_W,
    height: CARD_W,
    borderRadius: 6,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  songArtworkImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  songTitle: {
    color: COLORS.white,
    fontSize: SW < 360 ? 11 : 12,
    fontWeight: "600",
    marginBottom: 2,
    paddingRight: 30,
    flexShrink: 1,
  },
  songArtist: {
    color: COLORS.gold,
    fontSize: SW < 360 ? 9 : 10,
    marginBottom: 4,
    paddingRight: 30,
    flexShrink: 1,
  },
  songPlayBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSpacer: {
    height: 70,
  },
});
