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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Music2, Search, Play } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { trpc } from "../api/client";
import { useQueueStore } from "../store/playerStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Song = { id: string; title: string; artist: string; duration: number; url: string; coverUrl?: string };

const TRENDING_SEARCHES = [
  "Eddy Kenzo", "Sheebah", "Bobi Wine", "Rema", "Vinka",
  "Spice Diana", "John Blaq", "Azawi", "Pallaso", "Winnie Nwagi",
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
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SongCard({ song, onPlay }: { song: Song; onPlay: (song: Song) => void }) {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      style={styles.songCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate("Song", { songId: song.id })}
    >
      <View style={styles.songArtwork}>
        <Music2 size={24} color={COLORS.bg} />
      </View>
      <Text style={styles.songTitle} numberOfLines={1}>
        {song.title}
      </Text>
      <Text style={styles.songArtist} numberOfLines={1}>
        {song.artist}
      </Text>
      <TouchableOpacity
        style={styles.songPlayBtn}
        onPress={() => onPlay(song)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Play size={16} color={COLORS.bg} fill={COLORS.bg} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function DiscoverScreen() {
  const navigation = useNavigation<any>();
  const setQueue = useQueueStore((s) => s.setQueue);

  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [nrLoading, setNrLoading] = useState(true);
  const [trending, setTrending] = useState<Song[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    trpc.music.getNewReleases
      .query({ limit: 10 })
      .then((data: Song[]) => setNewReleases(data))
      .catch(() => setNewReleases([]))
      .finally(() => setNrLoading(false));

    trpc.music.getTrending
      .query({ limit: 10 })
      .then((data: Song[]) => setTrending(data))
      .catch(() => setTrending([]))
      .finally(() => setTrendingLoading(false));
  }, []);

  const handlePlaySong = useCallback(
    (song: Song) => {
      setQueue([{ id: song.id, title: song.title, artist: song.artist, url: song.url, duration: song.duration, coverUrl: song.coverUrl }]);
    },
    [setQueue],
  );

  const renderSongItem = useCallback(
    ({ item }: { item: Song }) => <SongCard song={item} onPlay={handlePlaySong} />,
    [handlePlaySong],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Search")}
        >
          <Search size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search songs and artists...</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <SectionHeader title="Trending Searches" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {TRENDING_SEARCHES.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.chip}
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
                style={styles.genreCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("Search", { query: genre.name })}
              >
                <Text style={styles.genreEmoji}>{genre.emoji}</Text>
                <Text style={styles.genreName}>{genre.name}</Text>
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
                style={styles.browseCard}
                activeOpacity={0.7}
              >
                <Text style={styles.browseEmoji}>{item.emoji}</Text>
                <Text style={styles.browseLabel} numberOfLines={2}>
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
              contentContainerStyle={styles.horizontalList}
              scrollEnabled={false}
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
              contentContainerStyle={styles.horizontalList}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 14,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#A1A1AA",
    marginBottom: 12,
  },
  chipScroll: {
    paddingRight: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    color: COLORS.text,
    fontSize: 12,
  },
  grid2x3: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  genreCard: {
    width: (SCREEN_WIDTH - 32 - 10) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
    justifyContent: "center",
  },
  genreEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  genreName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  grid2x2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  browseCard: {
    width: (SCREEN_WIDTH - 32 - 10) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
    justifyContent: "center",
  },
  browseEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  browseLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
  },
  horizontalList: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 16,
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginVertical: 8,
  },
  songCard: {
    width: 140,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    position: "relative",
  },
  songArtwork: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  songTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  songArtist: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  songPlayBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSpacer: {
    height: 80,
  },
});
