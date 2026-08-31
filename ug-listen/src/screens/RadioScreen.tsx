import { useState, useCallback, useEffect } from "react";
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
import { Play, Radio } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { trpc } from "../api/client";
import { useQueueStore, type Track } from "../store/playerStore";
import { useTheme } from "../theme/ThemeContext";

const { width: SW } = Dimensions.get("window");
const H_PAD = 16;
const GAP = 10;
const CARD_W = (SW - H_PAD * 2 - GAP * 3) / 4;

type Station = { id: string; name: string; icon?: string };

type QueueSong = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url?: string;
  fileUrl?: string;
  hlsUrl?: string;
  coverUrl?: string;
  artistId?: string;
};

function formatDuration(d: number): string {
  const mins = Math.floor(d / 60);
  const secs = d % 60;
  return mins + ":" + secs.toString().padStart(2, "0");
}

export default function RadioScreen() {
  const { colors } = useTheme();
  const setQueue = useQueueStore((s) => s.setQueue);
  const setRadioContext = useQueueStore((s) => s.setRadioContext);

  const [genres, setGenres] = useState<Station[]>([]);
  const [moods, setMoods] = useState<Station[]>([]);
  const [activities, setActivities] = useState<Station[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);

  const [generatedQueue, setGeneratedQueue] = useState<QueueSong[]>([]);
  const [queueTitle, setQueueTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [radioCtx, setRadioCtx] = useState<{ type: "genre" | "mood" | "activity"; stationId: string; title: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [g, m, a] = await Promise.all([
          trpc.radio.getStations.query(),
          trpc.radio.getMoodStations.query(),
          trpc.radio.getActivityStations.query(),
        ]);
        setGenres(Array.isArray(g) ? g : []);
        setMoods(Array.isArray(m) ? m : []);
        setActivities(Array.isArray(a) ? a : []);
      } catch {} finally {
        setLoadingStations(false);
      }
    })();
  }, []);

  const handleStationPress = useCallback(
    async (type: "genre" | "mood" | "activity", id: string, name: string) => {
      setLoading(true);
      setQueueTitle(name);
      setRadioCtx({ type, stationId: id, title: name });
      try {
        let data: any = [];
        if (type === "genre") data = await trpc.radio.getQueue.query({ stationId: id, queueSize: 30 });
        else if (type === "mood") data = await trpc.radio.getMoodQueue.query({ moodId: id, queueSize: 30 });
        else data = await trpc.radio.getActivityQueue.query({ activityId: id, queueSize: 30 });
        setGeneratedQueue(Array.isArray(data) ? data : []);
      } catch {
        setGeneratedQueue([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handlePlayAll = useCallback(() => {
    if (generatedQueue.length === 0) return;
    const tracks: Track[] = generatedQueue.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      url: s.fileUrl || s.hlsUrl || s.url || "",
      duration: s.duration,
      coverUrl: s.coverUrl,
      artistId: s.artistId,
    }));
    setQueue(tracks);
    if (radioCtx) {
      setRadioContext({ stationId: radioCtx.stationId, title: radioCtx.title });
    }
  }, [generatedQueue, setQueue, setRadioContext, radioCtx]);

  const renderStationCard = (station: Station, onPress: () => void, selected: boolean) => (
    <TouchableOpacity
      key={station.id}
      style={[
        styles.stationCard,
        { backgroundColor: selected ? colors.goldMuted : colors.surface },
        selected && styles.stationCardSelected,
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Text style={styles.stationEmoji}>{station.icon || "🎵"}</Text>
      <Text style={[styles.stationName, { color: selected ? colors.gold : colors.white }]}>{station.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Radio size={20} color={COLORS.bg} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.white }]}>Radio</Text>
            <Text style={styles.headerSub}>Genre, mood & activity stations</Text>
          </View>
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
                <Text style={[styles.songTitle, { color: colors.white }]} numberOfLines={1}>
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
              {loadingStations ? (
                <ActivityIndicator color={COLORS.gold} style={styles.loader} />
              ) : (
                <>
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.white }]}>Genre Stations</Text>
                    <FlatList
                      data={genres}
                      keyExtractor={(s) => s.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={CARD_W + GAP}
                      decelerationRate="fast"
                      contentContainerStyle={styles.stationsList}
                      renderItem={({ item }) => renderStationCard(item, () => handleStationPress("genre", item.id, item.name), radioCtx?.stationId === item.id)}
                    />
                  </View>

                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.white }]}>Mood Stations</Text>
                    <FlatList
                      data={moods}
                      keyExtractor={(s) => s.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={CARD_W + GAP}
                      decelerationRate="fast"
                      contentContainerStyle={styles.stationsList}
                      renderItem={({ item }) => renderStationCard(item, () => handleStationPress("mood", item.id, item.name), radioCtx?.stationId === item.id)}
                    />
                  </View>

                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.white }]}>Activity Stations</Text>
                    <FlatList
                      data={activities}
                      keyExtractor={(s) => s.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={CARD_W + GAP}
                      decelerationRate="fast"
                      contentContainerStyle={styles.stationsList}
                      renderItem={({ item }) => renderStationCard(item, () => handleStationPress("activity", item.id, item.name), radioCtx?.stationId === item.id)}
                    />
                  </View>

                  {loading && <ActivityIndicator color={COLORS.gold} style={styles.loader} />}

                  {generatedQueue.length > 0 && !loading && (
                    <View style={styles.queueHeader}>
                      <Text style={[styles.queueTitle, { color: colors.white }]}>{queueTitle} Queue</Text>
                      <TouchableOpacity style={styles.playAllBtn} activeOpacity={0.8} onPress={handlePlayAll}>
                        <Play size={14} color={COLORS.bg} fill={COLORS.bg} />
                        <Text style={styles.playAllText}>Play All</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
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
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: Math.min(SW * 0.04, 16), paddingTop: 10, paddingBottom: 10 },
  headerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.gold, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: COLORS.white, marginBottom: 1 },
  headerSub: { fontSize: 12, color: COLORS.textMuted },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 70 },
  listHeader: { paddingHorizontal: Math.min(SW * 0.04, 16) },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.white, marginBottom: 10 },
  stationsList: { paddingHorizontal: H_PAD, gap: GAP },
  stationCard: { width: CARD_W, height: CARD_W, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center", gap: 5 },
  stationCardSelected: { borderColor: COLORS.gold },
  stationEmoji: { fontSize: 22 },
  stationName: { color: COLORS.white, fontSize: 10, fontWeight: "600", textAlign: "center" },
  loader: { marginVertical: 16 },
  queueHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10, marginTop: 6 },
  queueTitle: { fontSize: 15, fontWeight: "700", color: COLORS.white },
  playAllBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.gold, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, gap: 5 },
  playAllText: { color: COLORS.bg, fontSize: 12, fontWeight: "700" },
  songRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16, gap: 8 },
  songIdx: { width: 18, alignItems: "center" },
  songBullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.gold },
  songInfo: { flex: 1, minWidth: 0 },
  songTitle: { color: COLORS.white, fontSize: 13, fontWeight: "600", flexShrink: 1 },
  songSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 1, flexShrink: 1 },
  songDur: { color: COLORS.textMuted, fontSize: 11 },
});
