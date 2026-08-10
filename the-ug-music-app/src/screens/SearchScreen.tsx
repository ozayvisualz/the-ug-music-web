import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  Search,
  X,
  Play,
  Music2,
  MicVocal,
  ChevronRight,
  Flame,
  Music,
  Disc,
  Heart,
  Zap,
  Star,
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { trpc } from "../api/client";
import { COLORS } from "../constants/theme";
import { useQueueStore, type Track } from "../store/playerStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TRENDING_SEARCHES = [
  "Eddy Kenzo",
  "Sheebah Karungi",
  "B2C Ent.",
  "Fik Fameica",
  "Spice Diana",
  "Vinka",
  "Winnie Nwagi",
  "David Lutalo",
  "John Blaq",
  "Azawi",
  "Rema Namakula",
  "Pallaso",
];

const GENRES = [
  { label: "Afrobeat", icon: Flame, color: "#EAB308" },
  { label: "Dancehall", icon: Music, color: "#F97316" },
  { label: "Reggae", icon: Disc, color: "#22C55E" },
  { label: "Gospel", icon: Heart, color: "#A855F7" },
  { label: "Hip Hop", icon: MicVocal, color: "#3B82F6" },
  { label: "Lugaflow", icon: Zap, color: "#EF4444" },
  { label: "Kadongo Kamu", icon: Music2, color: "#EC4899" },
  { label: "Bax Ragga", icon: Star, color: "#14B8A6" },
];

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const setQueue = useQueueStore((s) => s.setQueue);

  const initialQuery = route.params?.query ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const [songs, setSongs] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSongs([]);
      setArtists([]);
      setError(null);
      return;
    }

    let cancelled = false;

    async function search() {
      setLoading(true);
      setError(null);

      try {
        const [songResults, artistResults] = await Promise.all([
          (trpc as any).music.getSongs.query({
            search: debouncedQuery,
            limit: 20,
          }).catch(() => []),
          (trpc as any).music.getArtists.query({
            search: debouncedQuery,
            limit: 10,
          }).catch(() => []),
        ]);

        if (!cancelled) {
          setSongs(songResults ?? []);
          setArtists(artistResults ?? []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Search failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    search();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleClear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setSongs([]);
    setArtists([]);
    setError(null);
    inputRef.current?.focus();
  }, []);

  const handleTrendingPress = useCallback((term: string) => {
    setQuery(term);
  }, []);

  const handleGenrePress = useCallback(
    (genre: string) => {
      navigation.navigate("DiscoverTab", { screen: "Discover" });
    },
    [navigation]
  );

  const handlePlaySong = useCallback(
    (song: any) => {
      const track: Track = {
        id: song.id,
        title: song.title,
        artist: song.artist ?? song.artistName ?? "",
        url: song.url ?? song.audioUrl ?? "",
        duration: song.duration ?? 0,
        coverUrl: song.coverUrl ?? undefined,
      };
      setQueue([track]);
    },
    [setQueue]
  );

  const handleSongPress = useCallback(
    (song: any) => {
      navigation.navigate("Song", { songId: song.id });
    },
    [navigation]
  );

  const handleArtistPress = useCallback(
    (artist: any) => {
      navigation.navigate("Artist", { artistId: artist.id });
    },
    [navigation]
  );

  const isSearching = debouncedQuery.length > 0;
  const showEmpty = isSearching && !loading && songs.length === 0 && artists.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search songs, artists, albums..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <X size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!isSearching && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trending Searches</Text>
              <View style={styles.chipsContainer}>
                {TRENDING_SEARCHES.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={styles.chip}
                    onPress={() => handleTrendingPress(term)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Browse by Genre</Text>
              <View style={styles.genreGrid}>
                {GENRES.map((genre) => {
                  const Icon = genre.icon;
                  return (
                    <TouchableOpacity
                      key={genre.label}
                      style={styles.genreCard}
                      onPress={() => handleGenrePress(genre.label)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.genreIconContainer,
                          { backgroundColor: genre.color + "20" },
                        ]}
                      >
                        <Icon size={24} color={genre.color} />
                      </View>
                      <Text style={styles.genreLabel}>{genre.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {showEmpty && (
          <View style={styles.emptyContainer}>
            <Music2 size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching for a different term
            </Text>
          </View>
        )}

        {isSearching && artists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Artists
              <Text style={styles.resultCount}> ({artists.length})</Text>
            </Text>
            {artists.map((artist: any) => (
              <TouchableOpacity
                key={artist.id}
                style={styles.artistRow}
                onPress={() => handleArtistPress(artist)}
                activeOpacity={0.6}
              >
                <View style={styles.artistAvatar}>
                  <Text style={styles.artistAvatarText}>
                    {(artist.name ?? "A").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.artistInfo}>
                  <Text style={styles.artistName} numberOfLines={1}>
                    {artist.name}
                  </Text>
                  <Text style={styles.artistMeta} numberOfLines={1}>
                    {artist.genre ?? "Artist"}
                    {artist.verified ? " \u2022 Verified" : ""}
                  </Text>
                </View>
                <ChevronRight size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isSearching && songs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Songs
              <Text style={styles.resultCount}> ({songs.length})</Text>
            </Text>
            {songs.map((song: any, index: number) => (
              <TouchableOpacity
                key={song.id ?? index}
                style={styles.songRow}
                onPress={() => handleSongPress(song)}
                activeOpacity={0.6}
              >
                <View style={styles.songArt}>
                  <Music2 size={18} color={COLORS.textMuted} />
                </View>
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {song.title}
                  </Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {song.artist ?? song.artistName ?? "Unknown Artist"}
                  </Text>
                </View>
                <Text style={styles.songDuration}>
                  {formatDuration(song.duration ?? 0)}
                </Text>
                <TouchableOpacity
                  style={styles.songPlayButton}
                  onPress={() => handlePlaySong(song)}
                >
                  <Play size={14} color="#000" fill="#000" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.white,
    padding: 0,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderContainer: {
    position: "absolute",
    top: 130,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultCount: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  genreCard: {
    width: SCREEN_WIDTH / 4 - 10,
    margin: 4,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    paddingVertical: 18,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genreIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  genreLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    marginBottom: 6,
    gap: 12,
  },
  artistAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.goldMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  artistAvatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.gold,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  artistMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 10,
  },
  songArt: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  songArtist: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  songDuration: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginRight: 4,
  },
  songPlayButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "center",
  },
  errorText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 40,
  },
});
