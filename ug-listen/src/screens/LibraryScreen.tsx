import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ListMusic, Music2, ChevronRight, Play } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { trpc } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useQueueStore } from "../store/playerStore";

type Song = { id: string; title: string; artist: string; duration: number; url: string; coverUrl?: string };
type Playlist = { id: string; name: string; songCount?: number; songs?: Song[] };

const TABS = ["Playlists", "Liked", "Downloads", "History"] as const;
type Tab = (typeof TABS)[number];

function formatDuration(d: number): string {
  return Math.floor(d / 60) + ":" + (d % 60).toString().padStart(2, "0");
}

function SongRow({ song, onPlay }: { song: Song; onPlay: (song: Song) => void }) {
  return (
    <View style={styles.songRow}>
      <View style={styles.songRowArtwork}>
        <Music2 size={20} color={COLORS.bg} />
      </View>
      <View style={styles.songRowInfo}>
        <Text style={styles.songRowTitle} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.songRowArtist} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>
      <Text style={styles.songRowDuration}>{formatDuration(song.duration)}</Text>
      <TouchableOpacity
        style={styles.playBtn}
        onPress={() => onPlay(song)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Play size={14} color={COLORS.bg} fill={COLORS.bg} />
      </TouchableOpacity>
    </View>
  );
}

export default function LibraryScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const setQueue = useQueueStore((s) => s.setQueue);

  const [tab, setTab] = useState<Tab>("Playlists");

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [liked, setLiked] = useState<Song[]>([]);
  const [likedLoading, setLikedLoading] = useState(false);
  const [history, setHistory] = useState<Song[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (tab === "Playlists" && playlists.length === 0) {
      setPlaylistsLoading(true);
      trpc.playlist.getMyPlaylists
        .query()
        .then((data: Playlist[]) => setPlaylists(data))
        .catch(() => setPlaylists([]))
        .finally(() => setPlaylistsLoading(false));
    }

    if (tab === "Liked" && liked.length === 0) {
      setLikedLoading(true);
      trpc.social.getLikedSongs
        .query()
        .then((data: Song[]) => setLiked(data))
        .catch(() => setLiked([]))
        .finally(() => setLikedLoading(false));
    }

    if (tab === "History" && history.length === 0) {
      setHistoryLoading(true);
      trpc.streaming.getListeningHistory
        .query()
        .then((data: Song[]) => setHistory(data))
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [tab, user]);

  const handlePlaySong = useCallback(
    (song: Song) => {
      setQueue([{ id: song.id, title: song.title, artist: song.artist, url: song.url, duration: song.duration, coverUrl: song.coverUrl }]);
    },
    [setQueue],
  );

  const handlePlayAll = useCallback(
    (songs: Song[]) => {
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

  if (!user) {
    return (
      <View style={styles.root}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Log in to see your library</Text>
          <TouchableOpacity
            style={styles.signInBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderPlaylistItem = useCallback(
    ({ item }: { item: Playlist }) => (
      <TouchableOpacity
        style={styles.playlistRow}
        activeOpacity={0.7}
        onPress={() => navigation.navigate("PlaylistScreen", { playlist: item })}
      >
        <View style={styles.playlistIcon}>
          <ListMusic size={22} color={COLORS.bg} />
        </View>
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.playlistCount}>
            {item.songCount ?? item.songs?.length ?? 0} songs
          </Text>
        </View>
        <ChevronRight size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    ),
    [navigation],
  );

  const renderSongRow = useCallback(
    ({ item }: { item: Song }) => <SongRow song={item} onPlay={handlePlaySong} />,
    [handlePlaySong],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Library</Text>
      </View>

      <View style={styles.tabRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabPill, tab === t && styles.tabPillActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabPillText, tab === t && styles.tabPillTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {tab === "Playlists" && (
        playlistsLoading ? (
          <ActivityIndicator color={COLORS.gold} style={styles.loader} />
        ) : playlists.length === 0 ? (
          <Text style={styles.emptyText}>No playlists yet</Text>
        ) : (
          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            renderItem={renderPlaylistItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )
      )}

      {tab === "Liked" && (
        likedLoading ? (
          <ActivityIndicator color={COLORS.gold} style={styles.loader} />
        ) : liked.length === 0 ? (
          <Text style={styles.emptyText}>No liked songs yet</Text>
        ) : (
          <>
            <TouchableOpacity
              style={styles.playAllBtn}
              activeOpacity={0.8}
              onPress={() => handlePlayAll(liked)}
            >
              <Play size={16} color={COLORS.bg} fill={COLORS.bg} />
              <Text style={styles.playAllText}>Play All</Text>
            </TouchableOpacity>
            <FlatList
              data={liked}
              keyExtractor={(item) => item.id}
              renderItem={renderSongRow}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </>
        )
      )}

      {tab === "Downloads" && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No downloads yet</Text>
        </View>
      )}

      {tab === "History" && (
        historyLoading ? (
          <ActivityIndicator color={COLORS.gold} style={styles.loader} />
        ) : history.length === 0 ? (
          <Text style={styles.emptyText}>No listening history</Text>
        ) : (
          <>
            <TouchableOpacity
              style={styles.playAllBtn}
              activeOpacity={0.8}
              onPress={() => handlePlayAll(history)}
            >
              <Play size={16} color={COLORS.bg} fill={COLORS.bg} />
              <Text style={styles.playAllText}>Play All</Text>
            </TouchableOpacity>
            <FlatList
              data={history}
              keyExtractor={(item, index) => item.id + index}
              renderItem={renderSongRow}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </>
        )
      )}
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 16,
    textAlign: "center",
  },
  signInBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  signInBtnText: {
    color: COLORS.bg,
    fontWeight: "700",
    fontSize: 15,
  },
  tabRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabScroll: {
    gap: 8,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
  },
  tabPillActive: {
    backgroundColor: COLORS.gold,
  },
  tabPillText: {
    color: COLORS.textMuted,
    fontWeight: "600",
    fontSize: 13,
  },
  tabPillTextActive: {
    color: COLORS.bg,
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  playlistIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  playlistCount: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 16,
    marginBottom: 10,
    gap: 6,
  },
  playAllText: {
    color: COLORS.bg,
    fontWeight: "700",
    fontSize: 13,
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  songRowArtwork: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  songRowInfo: {
    flex: 1,
    marginRight: 8,
  },
  songRowTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 1,
  },
  songRowArtist: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  songRowDuration: {
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
});
