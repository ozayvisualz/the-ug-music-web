import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  Disc3,
  Play,
  Shuffle,
  Heart,
  ChevronLeft,
  Music2,
  Share2,
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { trpc } from "../api/client";
import { COLORS } from "../constants/theme";
import { useQueueStore, type Track } from "../store/playerStore";

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlaylistScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const playlistParam = route.params?.playlist;
  const playlistId = route.params?.playlistId ?? playlistParam?.id ?? route.params?.id;

  const setQueue = useQueueStore((s) => s.setQueue);

  const [playlist, setPlaylist] = useState<any>(playlistParam ?? null);
  const [loading, setLoading] = useState(!playlistParam);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylist = useCallback(async () => {
    if (!playlistId) return;
    try {
      setLoading(true);
      setError(null);

      let found: any = null;
      try {
        const playlists = await (trpc as any).playlist.getMyPlaylists.query();
        found = (playlists ?? []).find((p: any) => p.id === playlistId);
      } catch {}

      if (found) {
        setPlaylist(found);
      } else {
        try {
          found = await (trpc as any).playlist.getById.query(playlistId);
        } catch {
          found = null;
        }
        if (found) {
          setPlaylist(found);
        } else {
          setError("Playlist not found");
        }
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load playlist");
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  React.useEffect(() => {
    if (!playlistParam) {
      fetchPlaylist();
    }
  }, []);

  const songs: any[] = useMemo(
    () => playlist?.songs ?? playlist?.tracks ?? [],
    [playlist]
  );

  const handlePlayAll = useCallback(() => {
    if (songs.length === 0) return;
    const tracks: Track[] = songs.map((s: any) => ({
      id: s.id,
      title: s.title,
      artist: s.artist ?? s.artistName ?? "",
      url: s.url ?? s.audioUrl ?? "",
      duration: s.duration ?? 0,
      coverUrl: s.coverUrl ?? undefined,
    }));
    setQueue(tracks);
  }, [songs, setQueue]);

  const handleShuffle = useCallback(() => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    const tracks: Track[] = shuffled.map((s: any) => ({
      id: s.id,
      title: s.title,
      artist: s.artist ?? s.artistName ?? "",
      url: s.url ?? s.audioUrl ?? "",
      duration: s.duration ?? 0,
      coverUrl: s.coverUrl ?? undefined,
    }));
    setQueue(tracks);
  }, [songs, setQueue]);

  const handlePlaySong = useCallback(
    (song: any, index: number) => {
      const tracks: Track[] = [
        {
          id: song.id,
          title: song.title,
          artist: song.artist ?? song.artistName ?? "",
          url: song.url ?? song.audioUrl ?? "",
          duration: song.duration ?? 0,
          coverUrl: song.coverUrl ?? undefined,
        },
      ];
      setQueue(tracks);
    },
    [setQueue]
  );

  const handleSongPress = useCallback(
    (song: any) => {
      navigation.navigate("Song", { songId: song.id });
    },
    [navigation]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      </View>
    );
  }

  if (error || !playlist) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerLoader}>
          <Music2 size={48} color={COLORS.textMuted} />
          <Text style={styles.errorText}>
            {error ?? "Playlist not found"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalDuration = songs.reduce(
    (sum: number, s: any) => sum + (s.duration ?? 0),
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {playlist.name ?? "Playlist"}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.maxWidth}>
          <View style={styles.artworkContainer}>
            <View style={styles.artwork}>
              <Disc3 size={48} color={COLORS.gold} />
            </View>
          </View>

          <Text style={styles.playlistTitle}>{playlist.name ?? "Playlist"}</Text>

          {(playlist.curator ?? playlist.createdBy) ? (
            <Text style={styles.curatorLabel}>
              By {playlist.curator ?? playlist.createdBy}
            </Text>
          ) : (
            <Text style={styles.curatorLabel}>By You</Text>
          )}

          <Text style={styles.songCount}>
            {songs.length} {songs.length === 1 ? "song" : "songs"}
            {totalDuration > 0
              ? ` \u2022 ${formatDuration(totalDuration)}`
              : ""}
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.playAllButton}
              onPress={handlePlayAll}
              activeOpacity={0.8}
            >
              <Play size={18} color="#000" fill="#000" />
              <Text style={styles.playAllText}>Play All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shuffleButton}
              onPress={handleShuffle}
              activeOpacity={0.7}
            >
              <Shuffle size={18} color={COLORS.white} />
              <Text style={styles.shuffleText}>Shuffle</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} activeOpacity={0.7}>
              <Heart size={18} color={COLORS.text} />
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          {songs.length === 0 ? (
            <View style={styles.emptyList}>
              <Music2 size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No songs yet</Text>
              <Text style={styles.emptySubtitle}>
                Add songs to this playlist
              </Text>
            </View>
          ) : (
            <View style={styles.trackList}>
              {songs.map((song: any, index: number) => (
                <TouchableOpacity
                  key={song.id ?? index}
                  style={styles.trackRow}
                  onPress={() => handleSongPress(song)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.trackNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>

                  <View style={styles.trackArt}>
                    <Music2 size={18} color={COLORS.textMuted} />
                  </View>

                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle} numberOfLines={1}>
                      {song.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {song.artist ?? song.artistName ?? "Unknown Artist"}
                    </Text>
                  </View>

                  <Text style={styles.trackDuration}>
                    {formatDuration(song.duration ?? 0)}
                  </Text>

                  <TouchableOpacity
                    style={styles.trackPlayButton}
                    onPress={() => handlePlaySong(song, index)}
                  >
                    <Play size={14} color="#000" fill="#000" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.shareButtonSecondary} activeOpacity={0.7}>
            <Share2 size={16} color={COLORS.textMuted} />
            <Text style={styles.shareTextSecondary}>Share Playlist</Text>
          </TouchableOpacity>
        </View>

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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
  },
  centerLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  maxWidth: {
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  artworkContainer: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  artwork: {
    width: 160,
    height: 160,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  playlistTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
    textAlign: "center",
  },
  curatorLabel: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: "center",
    marginTop: 6,
  },
  songCount: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
    marginBottom: 8,
  },
  playAllButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
  },
  playAllText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  shuffleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shuffleText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.white,
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  trackList: {
    marginTop: 8,
    gap: 4,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 10,
  },
  trackNumber: {
    width: 24,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
    textAlign: "center",
  },
  trackArt: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  trackArtist: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  trackDuration: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginRight: 4,
  },
  trackPlayButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyList: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  shareButtonSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shareTextSecondary: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  bottomSpacer: {
    height: 80,
  },
});
