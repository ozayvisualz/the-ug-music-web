import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Search, Music2, Play } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { trpc } from "../api/client";
import { getStoredToken } from "../api/auth";
import { useQueueStore } from "../store/playerStore";
import { useTheme } from "../theme/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SW = SCREEN_WIDTH;

const TRENDING_SEARCHES = [
  "Eddy Kenzo",
  "Sheebah",
  "Bobi Wine",
  "Rema",
  "Vinka",
  "Spice Diana",
  "John Blaq",
  "Azawi",
  "Alien Skin",
  "Winnie Nwagi",
];

const GENRES = [
  { emoji: "\uD83C\uDFB5", label: "Afrobeat" },
  { emoji: "\uD83D\uDC83", label: "Dancehall" },
  { emoji: "\uD83C\uDF3F", label: "Reggae" },
  { emoji: "\uD83D\uDE4F", label: "Gospel" },
  { emoji: "\uD83C\uDFA4", label: "Hip Hop" },
  { emoji: "\uD83C\uDFA7", label: "Lugaflow" },
  { emoji: "\uD83C\uDFA7", label: "Amapiano" },
  { emoji: "\uD83C\uDFB9", label: "R&B" },
];

type Song = {
  id: string;
  title: string;
  artist: any;
  duration: number;
  url?: string;
  fileUrl?: string;
  hlsUrl?: string;
  coverUrl?: string;
  genre?: string;
  artistId?: string;
};

type Artist = {
  id: string;
  name?: string;
  artistName?: string;
  genre?: string;
  image?: string;
  user?: { name?: string; image?: string };
};

function formatDuration(d: number): string {
  const mins = Math.floor(d / 60);
  const secs = d % 60;
  return mins + ":" + secs.toString().padStart(2, "0");
}

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const setQueue = useQueueStore((s) => s.setQueue);
  const { colors } = useTheme();

  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setSongs([]);
      setArtists([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const token = await getStoredToken();
        const res = await fetch(`https://www.theugmusic.com/api/mobile/search?q=${encodeURIComponent(trimmed)}&token=${encodeURIComponent(token || "")}`);
        const data = await res.json();
        setSongs(data.songs || []);
        setArtists(data.artists || []);
      } catch {
        setSongs([]);
        setArtists([]);
      }
      setLoading(false);
    }, 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const handlePlaySong = useCallback(
    (song: Song) => {
      setQueue([
        {
          id: song.id,
          title: song.title,
          artist: typeof song.artist === "string" ? song.artist : song.artist?.artistName || song.artist?.user?.name || "Unknown",
          url: song.fileUrl || song.hlsUrl || "",
          duration: song.duration || 180,
          coverUrl: song.coverUrl,
          artistId: song.artistId,
        },
      ]);
    },
    [setQueue],
  );

  const handleTrendingPress = useCallback((term: string) => {
    setQuery(term);
  }, []);

  const handleGenrePress = useCallback((genre: string) => {
    setQuery(genre);
  }, []);

  const renderArtistItem = useCallback(
    ({ item }: { item: Artist }) => (
      <TouchableOpacity
        style={styles.resultRow}
        activeOpacity={0.7}
        onPress={() => navigation.navigate("Artist", { artistId: item.id })}
      >
        <View style={styles.artistAvatar}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.artistAvatarImg} />
          ) : (
            <Text style={styles.artistAvatarText}>
              {(item.artistName || item.user?.name || item.name || "?").charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <Text style={[styles.resultName, { color: colors.white }]} numberOfLines={1}>{item.artistName || item.user?.name || item.name || "Unknown"}</Text>
      </TouchableOpacity>
    ),
    [navigation],
  );

  const renderSongItem = useCallback(
    ({ item }: { item: Song }) => (
      <View style={styles.resultRow}>
        <TouchableOpacity
          style={styles.songMain}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Song", { songId: item.id })}
        >
          <View style={styles.songIcon}>
            <Music2 size={16} color={COLORS.bg} />
          </View>
          <View style={styles.songInfo}>
            <Text style={[styles.resultName, { color: colors.white }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.resultSub} numberOfLines={1}>
              {typeof item.artist === "string" ? item.artist : item.artist?.artistName || item.artist?.user?.name || "Unknown"}
            </Text>
          </View>
          <Text style={styles.songDuration}>{formatDuration(item.duration)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.playBtn}
          onPress={() => handlePlaySong(item)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Play size={12} color="#FFC107" fill="#FFC107" />
        </TouchableOpacity>
      </View>
    ),
    [navigation, handlePlaySong],
  );

  const hasQuery = query.trim().length > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Search size={16} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.white }]}
          placeholder="Search artists and songs..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery("")}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.clearBtn}>âœ•</Text>
          </TouchableOpacity>
        )}
      </View>

      {!hasQuery ? (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <View style={styles.browseContent}>
              <Text style={[styles.sectionTitle, { color: colors.white }]}>Trending Searches</Text>
              <View style={styles.pillRow}>
                {TRENDING_SEARCHES.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={[styles.pill, { backgroundColor: colors.surface }]}
                    activeOpacity={0.7}
                    onPress={() => handleTrendingPress(term)}
                  >
                    <Text style={styles.pillText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: colors.white }]}>Browse by Genre</Text>
              <View style={styles.genreGrid}>
                {GENRES.map((g) => (
                  <TouchableOpacity
                    key={g.label}
                    style={[styles.genreCard, { backgroundColor: colors.surface }]}
                    activeOpacity={0.7}
                    onPress={() => handleGenrePress(g.label)}
                  >
                    <Text style={styles.genreEmoji}>{g.emoji}</Text>
                    <Text style={styles.genreLabel}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          keyExtractor={() => "browse"}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        />
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={renderSongItem}
          ListHeaderComponent={
            <View>
              {loading ? (
                <ActivityIndicator
                  color={COLORS.gold}
                  style={styles.loader}
                />
              ) : (
                <>
                  {artists.length > 0 && (
                    <View>
                      <Text style={[styles.sectionTitle, { color: colors.white }]}>Artists</Text>
                      {(artists as Artist[]).map((artist) => (
                        <View key={artist.id}>{renderArtistItem({ item: artist })}</View>
                      ))}
                    </View>
                  )}
                  {songs.length > 0 && (
                    <Text style={[styles.sectionTitle, { color: colors.white }]}>Songs</Text>
                  )}
                  {artists.length === 0 && songs.length === 0 && (
                    <Text style={styles.emptyText}>No results found</Text>
                  )}
                </>
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        />
      )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    marginHorizontal: Math.min(SW * 0.04, 16),
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearBtn: {
    color: COLORS.textMuted,
    fontSize: 15,
    paddingLeft: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Math.min(SW * 0.04, 16),
    paddingBottom: 70,
  },
  browseContent: {
    paddingHorizontal: Math.min(SW * 0.04, 16),
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 10,
    marginTop: 6,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 20,
  },
  pill: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "500",
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genreCard: {
    width: (SCREEN_WIDTH - 32 - 24) / 4,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
  },
  genreEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  genreLabel: {
    color: COLORS.text,
    fontSize: 9,
    textAlign: "center",
    fontWeight: "500",
  },
  loader: {
    marginVertical: 32,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 32,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
  songMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  artistAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  artistAvatarImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  artistAvatarText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: "700",
  },
  songIcon: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  songInfo: {
    flex: 1,
    minWidth: 0,
  },
  resultName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  resultSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
    flexShrink: 1,
  },
  songDuration: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  playBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});
