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
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Play } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { trpc } from "../api/client";
import { useQueueStore, type Track } from "../store/playerStore";
import { useTheme } from "../theme/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SW = SCREEN_WIDTH;
const H_PAD = 16;
const GAP = 10;
const CARD_W = (SW - H_PAD * 2 - GAP * 3) / 4;

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
  const { colors } = useTheme();

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
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
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
                snapToInterval={CARD_W + GAP}
                decelerationRate="fast"
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
                  <Play size={14} color={COLORS.bg} fill={COLORS.bg} />
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
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 3,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 70,
  },
  listHeader: {
    paddingHorizontal: Math.min(SW * 0.04, 16),
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 10,
  },
  stationsList: {
    paddingHorizontal: H_PAD,
    gap: GAP,
  },
  stationCard: {
    width: CARD_W,
    height: CARD_W,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  stationEmoji: {
    fontSize: 22,
  },
  stationName: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  moodCard: {
    width: CARD_W,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodName: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  loader: {
    marginVertical: 16,
  },
  queueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 6,
  },
  queueTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    gap: 5,
  },
  playAllText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: "700",
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  songIdx: {
    width: 18,
    alignItems: "center",
  },
  songBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
  },
  songInfo: {
    flex: 1,
    minWidth: 0,
  },
  songTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  songSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
    flexShrink: 1,
  },
  songDur: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
