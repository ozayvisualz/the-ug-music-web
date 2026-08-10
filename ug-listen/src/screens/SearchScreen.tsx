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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Search, Music2, Play } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { trpc } from "../api/client";
import { useQueueStore } from "../store/playerStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TRENDING_SEARCHES = [
  "Eddy Kenzo",
  "Sheebah",
  "Bobi Wine",
  "Rema",
  "Vinka",
  "Spice Diana",
  "John Blaq",
  "Azawi",
  "Pallaso",
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
  artist: string;
  duration: number;
  url: string;
  coverUrl?: string;
};

type Artist = {
  id: string;
  name: string;
};

function formatDuration(d: number): string {
  const mins = Math.floor(d / 60);
  const secs = d % 60;
  return mins + ":" + secs.toString().padStart(2, "0");
}

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const setQueue = useQueueStore((s) => s.setQueue);

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
    timerRef.current = setTimeout(() => {
      const search = trimmed;
      Promise.all([
        trpc.music.getSongs.query({ search, limit: 20 }),
        trpc.music.getArtists.query({ search, limit: 10 }),
      ])
        .then(([songsData, artistsData]) => {
          setSongs(songsData as Song[]);
          setArtists(artistsData as Artist[]);
        })
        .catch(() => {
          setSongs([]);
          setArtists([]);
        })
        .finally(() => setLoading(false));
    }, 400);

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
          artist: song.artist,
          url: song.url,
          duration: song.duration,
          coverUrl: song.coverUrl,
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
          <Text style={styles.artistAvatarText}>
            {item.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.resultName}>{item.name}</Text>
      </TouchableOpacity>
    ),
    [navigation],
  );

  const renderSongItem = useCallback(
    ({ item }: { item: Song }) => (
      <TouchableOpacity
        style={styles.resultRow}
        activeOpacity={0.7}
        onPress={() => navigation.navigate("Song", { songId: item.id })}
      >
        <View style={styles.songIcon}>
          <Music2 size={18} color={COLORS.bg} />
        </View>
        <View style={styles.songInfo}>
          <Text style={styles.resultName} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.resultSub} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>
        <Text style={styles.songDuration}>{formatDuration(item.duration)}</Text>
        <TouchableOpacity
          style={styles.playBtn}
          onPress={() => handlePlaySong(item)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Play size={14} color={COLORS.bg} fill={COLORS.bg} />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [navigation, handlePlaySong],
  );

  const hasQuery = query.trim().length > 0;

  return (
    <View style={styles.root}>
      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
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
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {!hasQuery ? (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <View style={styles.browseContent}>
              <Text style={styles.sectionTitle}>Trending Searches</Text>
              <View style={styles.pillRow}>
                {TRENDING_SEARCHES.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={styles.pill}
                    activeOpacity={0.7}
                    onPress={() => handleTrendingPress(term)}
                  >
                    <Text style={styles.pillText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Browse by Genre</Text>
              <View style={styles.genreGrid}>
                {GENRES.map((g) => (
                  <TouchableOpacity
                    key={g.label}
                    style={styles.genreCard}
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
                      <Text style={styles.sectionTitle}>Artists</Text>
                      {(artists as Artist[]).map((artist) => (
                        <View key={artist.id}>{renderArtistItem({ item: artist })}</View>
                      ))}
                    </View>
                  )}
                  {songs.length > 0 && (
                    <Text style={styles.sectionTitle}>Songs</Text>
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
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearBtn: {
    color: COLORS.textMuted,
    fontSize: 16,
    paddingLeft: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  browseContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 12,
    marginTop: 8,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "500",
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  genreCard: {
    width: (SCREEN_WIDTH - 32 - 30) / 4,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  genreEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  genreLabel: {
    color: COLORS.text,
    fontSize: 10,
    textAlign: "center",
    fontWeight: "500",
  },
  loader: {
    marginVertical: 40,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  artistAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  artistAvatarText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: "700",
  },
  songIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  songInfo: {
    flex: 1,
  },
  resultName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  resultSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  songDuration: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
});
