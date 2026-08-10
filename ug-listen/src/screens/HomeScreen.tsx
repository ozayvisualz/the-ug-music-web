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
import { useAuthStore } from "../store/authStore";
import { useQueueStore } from "../store/playerStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Song = { id: string; title: string; artist: string; duration: number; url: string; coverUrl?: string };
type Artist = { id: string; name: string };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

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

function ArtistCard({ artist }: { artist: Artist }) {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      style={styles.artistCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate("Artist", { artistId: artist.id })}
    >
      <View style={styles.artistCircle}>
        <Text style={styles.artistInitial}>{artist.name?.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.artistName} numberOfLines={1}>
        {artist.name}
      </Text>
    </TouchableOpacity>
  );
}

const MADE_IN_UGANDA = [
  { emoji: "\u{1F1FA}\u{1F1EC}", label: "Trending in Kampala" },
  { emoji: "\u{1F3A4}", label: "New Ugandan Artists" },
  { emoji: "\u{1F525}", label: "Viral TikTok" },
  { emoji: "\u{1F3B6}", label: "Fresh Dancehall" },
  { emoji: "\u{1F941}", label: "Lugaflow" },
  { emoji: "\u{1F64F}", label: "Gospel Hits" },
  { emoji: "\u{1F389}", label: "Party Mixes" },
  { emoji: "\u{1F4FB}", label: "Radio Charts" },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const setQueue = useQueueStore((s) => s.setQueue);

  const [continueListening, setContinueListening] = useState<Song[]>([]);
  const [clLoading, setClLoading] = useState(false);
  const [trending, setTrending] = useState<Song[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [nrLoading, setNrLoading] = useState(true);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);

  useEffect(() => {
    if (user && user.id !== "guest") {
      setClLoading(true);
      trpc.sync.getContinueListening
        .query()
        .then((data: Song[]) => setContinueListening(data))
        .catch(() => setContinueListening([]))
        .finally(() => setClLoading(false));
    }

    trpc.music.getTrending
      .query({ limit: 10 })
      .then((data: Song[]) => setTrending(data))
      .catch(() => setTrending([]))
      .finally(() => setTrendingLoading(false));

    trpc.music.getNewReleases
      .query({ limit: 10 })
      .then((data: Song[]) => setNewReleases(data))
      .catch(() => setNewReleases([]))
      .finally(() => setNrLoading(false));

    trpc.music.getArtists
      .query({ limit: 10 })
      .then((data: Artist[]) => setArtists(data))
      .catch(() => setArtists([]))
      .finally(() => setArtistsLoading(false));
  }, [user]);

  const handlePlaySong = useCallback(
    (song: Song) => {
      setQueue([{ id: song.id, title: song.title, artist: song.artist, url: song.url, duration: song.duration, coverUrl: song.coverUrl }]);
    },
    [setQueue],
  );

  const handlePlayList = useCallback(
    (songs: Song[], index: number) => {
      const tracks = songs.map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        url: s.url,
        duration: s.duration,
        coverUrl: s.coverUrl,
      }));
      setQueue(tracks);
    },
    [setQueue],
  );

  const renderSongItem = useCallback(
    ({ item }: { item: Song }) => <SongCard song={item} onPlay={handlePlaySong} />,
    [handlePlaySong],
  );

  const renderArtistItem = useCallback(
    ({ item }: { item: Artist }) => <ArtistCard artist={item} />,
    [],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Music2 size={26} color={COLORS.gold} />
          <Text style={styles.headerTitle}>TheUgMusic</Text>
        </View>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.navigate("Search")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Search size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>
          {getGreeting()},{" "}
          {user?.name?.split(" ")[0] ?? "Listener"}
        </Text>

        {user && user.id !== "guest" && (
          <View style={styles.section}>
            <SectionHeader title="Continue Listening" />
            {clLoading ? (
              <ActivityIndicator color={COLORS.gold} style={styles.loader} />
            ) : continueListening.length === 0 ? (
              <Text style={styles.emptyText}>No data yet</Text>
            ) : (
              <FlatList
                data={continueListening}
                keyExtractor={(item) => item.id}
                renderItem={renderSongItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            )}
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader title="Trending Now" />
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
            />
          )}
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
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Made in Uganda" />
          <View style={styles.grid4}>
            {MADE_IN_UGANDA.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.gridCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("MadeInUganda")}
              >
                <Text style={styles.gridEmoji}>{item.emoji}</Text>
                <Text style={styles.gridLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Top Artists" />
          {artistsLoading ? (
            <ActivityIndicator color={COLORS.gold} style={styles.loader} />
          ) : artists.length === 0 ? (
            <Text style={styles.emptyText}>No data yet</Text>
          ) : (
            <FlatList
              data={artists}
              keyExtractor={(item) => item.id}
              renderItem={renderArtistItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  spacer: {
    flex: 1,
  },
  headerIconBtn: {
    padding: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 20,
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
  horizontalList: {
    paddingRight: 16,
    gap: 12,
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
  artistCard: {
    width: 80,
    alignItems: "center",
  },
  artistCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  artistInitial: {
    color: COLORS.bg,
    fontSize: 22,
    fontWeight: "700",
  },
  artistName: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  grid4: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridCard: {
    width: (SCREEN_WIDTH - 32 - 30) / 4,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  gridEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  gridLabel: {
    color: COLORS.text,
    fontSize: 10,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 80,
  },
});
