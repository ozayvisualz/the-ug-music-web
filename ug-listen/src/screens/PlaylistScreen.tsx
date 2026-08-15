import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Disc3, Music2, Play, Shuffle } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { useQueueStore } from "../store/playerStore";
import { useTheme } from "../theme/ThemeContext";

const SW = Dimensions.get("window").width;
const ART_SIZE = Math.min(SW * 0.5, 200);

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
  name?: string;
  title?: string;
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
  const songs: Song[] = (playlist.songs ?? []).map((ps: any) => {
    const s = ps?.song ?? ps;
    return {
      id: s.id,
      title: s.title,
      artist: s.artist?.artistName || s.artist?.user?.name || (typeof s.artist === "string" ? s.artist : "Unknown"),
      duration: s.duration || 0,
      url: s.fileUrl || s.hlsUrl || s.url || "",
      coverUrl: s.coverUrl,
    };
  });
  const playlistName = playlist.name || playlist.title || "Playlist";
  const setQueue = useQueueStore((s) => s.setQueue);
  const { colors } = useTheme();

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
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.artworkWrap}>
          <View style={styles.artwork}>
            <Disc3 size={48} color={COLORS.bg} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.white }]}>{playlistName}</Text>
        <Text style={styles.byYouLabel}>By You</Text>
        <Text style={styles.songCount}>{songs.length} songs</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.playAllBtn}
            activeOpacity={0.8}
            onPress={handlePlayAll}
          >
            <Play size={14} color={COLORS.bg} fill={COLORS.bg} />
            <Text style={styles.playAllText}>Play All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shuffleBtn, { backgroundColor: colors.surface }]}
            activeOpacity={0.8}
            onPress={handleShuffle}
          >
            <Shuffle size={14} color={COLORS.white} />
            <Text style={[styles.shuffleText, { color: colors.white }]}>Shuffle</Text>
          </TouchableOpacity>
        </View>

        {songs.length === 0 ? (
          <Text style={styles.emptyText}>No songs in this playlist</Text>
        ) : (
          songs.map((song, index) => (
            <TouchableOpacity
              key={song.id}
              style={[styles.songRow, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Song", { songId: song.id })}
            >
              <Text style={styles.songIndex}>{index + 1}</Text>
              <View style={styles.songIcon}>
                <Music2 size={18} color={COLORS.bg} />
              </View>
              <View style={styles.songInfo}>
                <Text style={[styles.songTitle, { color: colors.white }]} numberOfLines={1}>
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
                <Play size={12} color="#FFC107" fill="#FFC107" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
      </SafeAreaView>
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
    paddingHorizontal: Math.min(SW * 0.04, 16),
    paddingTop: 16,
  },
  artworkWrap: {
    alignItems: "center",
    marginBottom: 14,
  },
  artwork: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: 14,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: SW < 360 ? 17 : 20,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 2,
    flexShrink: 1,
  },
  byYouLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 1,
  },
  songCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 20,
    gap: 6,
  },
  playAllText: {
    color: COLORS.bg,
    fontWeight: "700",
    fontSize: 13,
  },
  shuffleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 20,
    gap: 6,
  },
  shuffleText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 13,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 8,
    marginBottom: 4,
  },
  songIndex: {
    width: 22,
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  songIcon: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  songInfo: {
    flex: 1,
    marginRight: 6,
    minWidth: 0,
  },
  songTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 1,
    flexShrink: 1,
  },
  songArtist: {
    color: COLORS.textMuted,
    fontSize: 11,
    flexShrink: 1,
  },
  songDuration: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginRight: 6,
  },
  playBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSpacer: {
    height: 70,
  },
});
