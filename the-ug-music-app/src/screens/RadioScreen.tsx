import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import {
  Music2,
  Play,
  Disc3,
  Heart,
  MicVocal,
  Zap,
  Flame,
  Music,
  Headphones,
  Car,
  Dumbbell,
  Coffee,
  PartyPopper,
  BookOpen,
  Moon,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { trpc } from "../api/client";
import { COLORS } from "../constants/theme";
import { useQueueStore, type Track } from "../store/playerStore";

const GENRE_STATIONS = [
  { id: "afrobeats", name: "Afrobeats", icon: Flame, emoji: null },
  { id: "dancehall", name: "Dancehall", icon: Music, emoji: null },
  { id: "gospel", name: "Gospel", icon: Heart, emoji: null },
  { id: "hip-hop", name: "Hip Hop", icon: MicVocal, emoji: null },
  { id: "reggae", name: "Reggae", icon: Disc3, emoji: null },
  { id: "amapiano", name: "Amapiano", icon: Headphones, emoji: null },
  { id: "lugaflow", name: "Lugaflow", icon: Zap, emoji: null },
  { id: "kadongo-kamu", name: "Kadongo Kamu", icon: Music2, emoji: null },
];

const MOOD_STATIONS = [
  { id: "morning-vibes", name: "Morning Vibes", icon: Coffee },
  { id: "road-trip", name: "Road Trip", icon: Car },
  { id: "workout-mix", name: "Workout Mix", icon: Dumbbell },
  { id: "chill-relax", name: "Chill & Relax", icon: Music2 },
  { id: "party-time", name: "Party Time", icon: PartyPopper },
  { id: "love-songs", name: "Love Songs", icon: Heart },
  { id: "study-focus", name: "Study & Focus", icon: BookOpen },
  { id: "late-night", name: "Late Night", icon: Moon },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function StationCard({
  item,
  onPress,
  isPlaying,
  index,
}: {
  item: (typeof GENRE_STATIONS)[0];
  onPress: () => void;
  isPlaying: boolean;
  index: number;
}) {
  const Icon = item.icon;
  return (
    <Animated.View entering={FadeInRight.delay(index * 60).springify()}>
      <TouchableOpacity
        style={[styles.stationCard, isPlaying && styles.stationCardActive]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.stationIconContainer}>
          <Icon size={28} color={isPlaying ? COLORS.gold : COLORS.text} />
        </View>
        <Text style={[styles.stationName, isPlaying && styles.stationNameActive]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function MoodCard({
  item,
  onPress,
  isPlaying,
  index,
}: {
  item: (typeof MOOD_STATIONS)[0];
  onPress: () => void;
  isPlaying: boolean;
  index: number;
}) {
  const Icon = item.icon;
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 60).springify()}
      style={styles.moodCardWrapper}
    >
      <TouchableOpacity
        style={[styles.moodCard, isPlaying && styles.moodCardActive]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Icon size={24} color={isPlaying ? COLORS.gold : COLORS.text} />
        <Text style={[styles.moodName, isPlaying && styles.moodNameActive]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function TrackItem({
  item,
  index,
  onPlay,
}: {
  item: Track;
  index: number;
  onPlay: () => void;
}) {
  return (
    <View style={styles.trackRow}>
      <View style={styles.trackLeft}>
        <Text style={styles.trackIndex}>{String(index + 1).padStart(2, "0")}</Text>
        {item.coverUrl ? (
          <Image source={{ uri: item.coverUrl }} style={styles.trackCover} />
        ) : (
          <View style={styles.trackCoverPlaceholder}>
            <Music2 size={16} color={COLORS.textMuted} />
          </View>
        )}
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.trackPlayBtn} onPress={onPlay}>
        <Play size={14} color={COLORS.gold} fill={COLORS.gold} />
      </TouchableOpacity>
    </View>
  );
}

export default function RadioScreen() {
  const setQueue = useQueueStore((s) => s.setQueue);
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [generatedTracks, setGeneratedTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenreStationPress = useCallback(
    async (station: (typeof GENRE_STATIONS)[0]) => {
      try {
        setError(null);
        setIsLoading(true);
        setActiveStationId(station.id);
        const result = await trpc.radio.generateQueue.mutate({
          stationId: station.id,
          queueSize: 15,
        });
        const tracks: Track[] = (result as any[])?.map?.((t: any) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          url: t.url ?? t.audioUrl ?? "",
          duration: t.duration ?? 0,
          coverUrl: t.coverUrl ?? undefined,
        })) ?? [];
        setGeneratedTracks(tracks);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load station");
        Alert.alert("Error", err?.message ?? "Failed to load station");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleMoodStationPress = useCallback(
    async (mood: (typeof MOOD_STATIONS)[0]) => {
      try {
        setError(null);
        setIsLoading(true);
        setActiveStationId(mood.id);
        const result = await trpc.radio.generateMoodQueue.mutate({
          moodId: mood.id,
          queueSize: 15,
        });
        const tracks: Track[] = (result as any[])?.map?.((t: any) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          url: t.url ?? t.audioUrl ?? "",
          duration: t.duration ?? 0,
          coverUrl: t.coverUrl ?? undefined,
        })) ?? [];
        setGeneratedTracks(tracks);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load mood station");
        Alert.alert("Error", err?.message ?? "Failed to load mood station");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handlePlayAll = useCallback(() => {
    if (generatedTracks.length === 0) return;
    setQueue(generatedTracks);
  }, [generatedTracks, setQueue]);

  const handlePlayTrack = useCallback(
    (track: Track) => {
      setQueue(generatedTracks);
      setQueue([track]);
    },
    [generatedTracks, setQueue]
  );

  const activeStationName = [...GENRE_STATIONS, ...MOOD_STATIONS].find(
    (s) => s.id === activeStationId
  )?.name;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Text style={styles.headerTitle}>Radio</Text>
        <Text style={styles.headerSubtitle}>
          Choose a station and let us do the rest
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <SectionHeader title="Genre Stations" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stationsScroll}
          >
            {GENRE_STATIONS.map((station, index) => (
              <StationCard
                key={station.id}
                item={station}
                index={index}
                isPlaying={activeStationId === station.id}
                onPress={() => handleGenreStationPress(station)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Mood Stations" />
          <View style={styles.moodGrid}>
            {MOOD_STATIONS.map((mood, index) => (
              <MoodCard
                key={mood.id}
                item={mood}
                index={index}
                isPlaying={activeStationId === mood.id}
                onPress={() => handleMoodStationPress(mood)}
              />
            ))}
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.gold} size="large" />
            <Text style={styles.loadingText}>Loading station...</Text>
          </View>
        )}

        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {generatedTracks.length > 0 && !isLoading && (
          <View style={styles.section}>
            <View style={styles.queueHeader}>
              <View style={styles.queueHeaderLeft}>
                <Text style={styles.queueTitle}>
                  {activeStationName ?? "Station"} Queue
                </Text>
                <Text style={styles.queueCount}>
                  {generatedTracks.length} tracks
                </Text>
              </View>
              <TouchableOpacity
                style={styles.playAllButton}
                onPress={handlePlayAll}
              >
                <Play size={16} color="#000" fill="#000" />
                <Text style={styles.playAllText}>Play All</Text>
              </TouchableOpacity>
            </View>

            {generatedTracks.map((track, index) => (
              <TrackItem
                key={track.id}
                item={track}
                index={index}
                onPlay={() => handlePlayTrack(track)}
              />
            ))}
          </View>
        )}

        {!isLoading && !error && generatedTracks.length === 0 && (
          <View style={styles.emptyContainer}>
            <Headphones size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No station selected</Text>
            <Text style={styles.emptySubtitle}>
              Tap a genre or mood station to generate a playlist
            </Text>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text,
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
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#A1A1AA",
  },
  stationsScroll: {
    paddingHorizontal: 16,
    gap: 12,
    flexDirection: "row",
  },
  stationCard: {
    width: 120,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stationCardActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldMuted,
  },
  stationIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  stationName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  stationNameActive: {
    color: COLORS.gold,
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  moodCardWrapper: {
    width: "25%",
    padding: 4,
  },
  moodCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 90,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moodCardActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldMuted,
  },
  moodName: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 14,
  },
  moodNameActive: {
    color: COLORS.gold,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.red,
    textAlign: "center",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
  queueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  queueHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  queueTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  queueCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  playAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  playAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  trackLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  trackIndex: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    width: 24,
    textAlign: "center",
  },
  trackCover: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  trackCoverPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  trackArtist: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  trackPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.goldMuted,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  bottomSpacer: {
    height: 40,
  },
});
