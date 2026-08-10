import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Play } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { trpc } from "../api/client";
import { useQueueStore, type Track } from "../store/playerStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GENRE_STATIONS = [
  { id: "afrobeats", name: "Afrobeats", emoji: "\uD83C\uDFB5" },
  { id: "dancehall", name: "Dancehall", emoji: "\uD83D\uDC83" },
  { id: "gospel", name: "Gospel", emoji: "\uD83D\uDE4F" },
  { id: "hiphop", name: "Hip Hop", emoji: "\uD83C\uDFA4" },
  { id: "reggae", name: "Reggae", emoji: "\uD83C\uDF3F" },
  { id: "amapiano", name: "Amapiano", emoji: "\uD83C\uDFA7" },
  { id: "lugaflow", name: "Lugaflow", emoji: "\uD83C\uDFA7" },
  { id: "kadongo-kamu", name: "Kadongo Kamu", emoji: "\uD83C\uDFB8" },
];

const MOOD_STATIONS = [
  { id: "morning-vibes", name: "Morning Vibes", emoji: "\uD83C\uDF05" },
  { id: "road-trip", name: "Road Trip", emoji: "\uD83D\uDE97" },
  { id: "workout", name: "Workout", emoji: "\uD83D\uDCAA" },
  { id: "chill", name: "Chill", emoji: "\uD83D\uDE0C" },
  { id: "party", name: "Party", emoji: "\uD83C\uDF89" },
  { id: "love-songs", name: "Love Songs", emoji: "\uD83D\uDC95" },
  { id: "study", name: "Study", emoji: "\uD83D\uDCDA" },
  { id: "late-night", name: "Late Night", emoji: "\uD83C\uDF19" },
];

type QueueSong = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  coverUrl?: string;
};

function formatDuration(d: number): string {
  const mins = Math.floor(d / 60);
  const secs = d % 60;
  return mins + ":" + secs.toString().padStart(2, "0");
}

export default function RadioScreen() {
  const navigation = useNavigation<any>();
  const setQueue = useQueueStore((s) => s.setQueue);

  const [generatedQueue, setGeneratedQueue] = useState<QueueSong[]>([]);
  const [queueTitle, setQueueTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenrePress = useCallback(async (stationId: string, name: string) => {
    setLoading(true);
    setQueueTitle(name);
    try {
      const data = await trpc.radio.generateQueue.mutate({
        stationId,
        queueSize: 15,
      });
      setGeneratedQueue(data as QueueSong[]);
    } catch {
      setGeneratedQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMoodPress = useCallback(async (moodId: string, name: string) => {
    setLoading(true);
    setQueueTitle(name);
    try {
      const data = await trpc.radio.generateMoodQueue.mutate({
        moodId,
        queueSize: 15,
      });
      setGeneratedQueue(data as QueueSong[]);
    } catch {
      setGeneratedQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePlayAll = useCallback(() => {
    if (generatedQueue.length === 0) return;
    const tracks: Track[] = generatedQueue.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      url: s.url,
      duration: s.duration,
      coverUrl: s.coverUrl,
    }));
    setQueue(tracks);
  }, [generatedQueue, setQueue]);

  const renderGenreStation = useCallback(
    ({ item }: { item: (typeof GENRE_STATIONS)[0] }) => (
      <TouchableOpacity
        style={styles.stationCard}
        activeOpacity={0.7}
        onPress={() => handleGenrePress(item.id, item.name)}
      >
        <Text style={styles.stationEmoji}>{item.emoji}</Text>
        <Text style={styles.stationName}>{item.name}</Text>
      </TouchableOpacity>
    ),
    [handleGenrePress],
  );

  const renderMoodStation = (item: (typeof MOOD_STATIONS)[0]) => (
    <TouchableOpacity
      key={item.id}
      style={styles.moodCard}
      activeOpacity={0.7}
      onPress={() => handleMoodPress(item.id, item.name)}
    >
      <Text style={styles.moodEmoji}>{item.emoji}</Text>
      <Text style={styles.moodName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Radio</Text>
        <Text style={styles.headerSub}>
          Endless music based on your taste
        </Text>
      </View>

      <FlatList
        data={generatedQueue}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.songRow}>
            <View style={styles.songIdx}>
              <View style={styles.songBullet} />
            </View>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.songSub} numberOfLines={1}>
                {item.artist}
              </Text>
            </View>
            <Text style={styles.songDur}>{formatDuration(item.duration)}</Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genre Stations</Text>
              <FlatList
                data={GENRE_STATIONS}
                keyExtractor={(item) => item.id}
                renderItem={renderGenreStation}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stationsList}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mood Stations</Text>
              <View style={styles.moodGrid}>
                {MOOD_STATIONS.map(renderMoodStation)}
              </View>
            </View>

            {loading && (
              <ActivityIndicator
                color={COLORS.gold}
                style={styles.loader}
              />
            )}

            {generatedQueue.length > 0 && !loading && (
              <View style={styles.queueHeader}>
                <Text style={styles.queueTitle}>{queueTitle} Queue</Text>
                <TouchableOpacity
                  style={styles.playAllBtn}
                  activeOpacity={0.8}
                  onPress={handlePlayAll}
                >
                  <Play size={16} color={COLORS.bg} fill={COLORS.bg} />
                  <Text style={styles.playAllText}>Play All</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      />
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
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  listHeader: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 12,
  },
  stationsList: {
    paddingRight: 16,
    gap: 12,
  },
  stationCard: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  stationEmoji: {
    fontSize: 26,
  },
  stationName: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  moodCard: {
    width: (SCREEN_WIDTH - 32 - 10) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  loader: {
    marginVertical: 20,
  },
  queueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 8,
  },
  queueTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  playAllText: {
    color: COLORS.bg,
    fontSize: 13,
    fontWeight: "700",
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  songIdx: {
    width: 20,
    alignItems: "center",
  },
  songBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  songSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  songDur: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});
