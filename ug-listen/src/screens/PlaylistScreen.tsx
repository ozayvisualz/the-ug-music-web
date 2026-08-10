import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Disc3, Music2, Play, Shuffle } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useQueueStore } from "../store/playerStore";

type Song = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  coverUrl?: string;
};

type Playlist = {
  id: string;
  name: string;
  songs: Song[];
};

function formatDuration(d: number): string {
  const mins = Math.floor(d / 60);
  const secs = d % 60;
  return mins + ":" + secs.toString().padStart(2, "0");
}

export default function PlaylistScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const playlist: Playlist = route.params.playlist;
  const songs: Song[] = playlist.songs ?? [];
  const setQueue = useQueueStore((s) => s.setQueue);

  const handlePlayAll = useCallback(() => {
    const tracks = songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      url: s.url,
      duration: s.duration,
      coverUrl: s.coverUrl,
    }));
    setQueue(tracks);
  }, [songs, setQueue]);

  const handleShuffle = useCallback(() => {
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    const tracks = shuffled.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      url: s.url,
      duration: s.duration,
      coverUrl: s.coverUrl,
    }));
    setQueue(tracks);
  }, [songs, setQueue]);

  const handlePlaySong = useCallback(
    (index: number) => {
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
    [songs, setQueue],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.artworkWrap}>
          <View style={styles.artwork}>
            <Disc3 size={56} color={COLORS.bg} />
          </View>
        </View>

        <Text style={styles.title}>{playlist.name}</Text>
        <Text style={styles.byYouLabel}>By You</Text>
        <Text style={styles.songCount}>{songs.length} songs</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.playAllBtn}
            activeOpacity={0.8}
            onPress={handlePlayAll}
          >
            <Play size={16} color={COLORS.bg} fill={COLORS.bg} />
            <Text style={styles.playAllText}>Play All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shuffleBtn}
            activeOpacity={0.8}
            onPress={handleShuffle}
          >
            <Shuffle size={16} color={COLORS.white} />
            <Text style={styles.shuffleText}>Shuffle</Text>
          </TouchableOpacity>
        </View>

        {songs.length === 0 ? (
          <Text style={styles.emptyText}>No songs in this playlist</Text>
        ) : (
          songs.map((song, index) => (
            <TouchableOpacity
              key={song.id}
              style={styles.songRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Song", { songId: song.id })}
            >
              <Text style={styles.songIndex}>{index + 1}</Text>
              <View style={styles.songIcon}>
                <Music2 size={20} color={COLORS.bg} />
              </View>
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {song.artist}
                </Text>
              </View>
              <Text style={styles.songDuration}>{formatDuration(song.duration)}</Text>
              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => handlePlaySong(index)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Play size={14} color={COLORS.bg} fill={COLORS.bg} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  artworkWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  artwork: {
    width: 160,
    height: 160,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 2,
  },
  byYouLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 2,
  },
  songCount: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 24,
    gap: 8,
  },
  playAllText: {
    color: COLORS.bg,
    fontWeight: "700",
    fontSize: 14,
  },
  shuffleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 24,
    gap: 8,
  },
  shuffleText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 14,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  songIndex: {
    width: 24,
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  songIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  songInfo: {
    flex: 1,
    marginRight: 8,
  },
  songTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 1,
  },
  songArtist: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  songDuration: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginRight: 8,
  },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSpacer: {
    height: 60,
  },
});
