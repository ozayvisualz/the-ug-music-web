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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ListMusic, Music2, ChevronRight, Play, Trash2 } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { trpc } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useQueueStore } from "../store/playerStore";
import { useDownloadStore } from "../store/downloadStore";
import { totalDownloadSize } from "../lib/downloads";
import { useTheme } from "../theme/ThemeContext";

const SW = Dimensions.get("window").width;

type Song = { id: string; title: string; artist: string; duration: number; url: string; coverUrl?: string };
type Playlist = { id: string; name: string; songCount?: number; songs?: Song[] };

const TABS = ["Playlists", "Liked", "Downloads", "History"] as const;
type Tab = (typeof TABS)[number];

function formatDuration(d: number): string {
  return Math.floor(d / 60) + ":" + (d % 60).toString().padStart(2, "0");
}

function toSong(x: any): Song {
  const s = x?.song ?? x;
  const primary = s?.artist?.artistName || s?.artist?.user?.name || (typeof s?.artist === "string" ? s.artist : "Unknown");
  const featured = s?.featuredArtist?.artistName || s?.featuredArtist?.user?.name;
  const artist = featured ? `${primary} feat. ${featured}` : primary;
  return {
    id: s?.id,
    title: s?.title || "Unknown",
    artist,
    duration: s?.duration || 0,
    url: s?.fileUrl || s?.hlsUrl || s?.url || "",
    coverUrl: s?.coverUrl,
  };
}

function SongRow({ song, onPlay }: { song: Song; onPlay: (song: Song) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.songRow, { backgroundColor: colors.surface }]}>
      <View style={styles.songRowArtwork}>
        <Music2 size={18} color={COLORS.bg} />
      </View>
      <View style={styles.songRowInfo}>
        <Text style={[styles.songRowTitle, { color: colors.white }]} numberOfLines={1}>
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
        <Play size={12} color="#FFC107" fill="#FFC107" />
      </TouchableOpacity>
    </View>
  );
}

function DownloadsTab() {
  const { colors } = useTheme();
  const setQueue = useQueueStore((s) => s.setQueue);
  const downloaded = useDownloadStore((s) => s.downloaded);
  const loaded = useDownloadStore((s) => s.loaded);
  const load = useDownloadStore((s) => s.load);
  const remove = useDownloadStore((s) => s.remove);
  const clearAll = useDownloadStore((s) => s.clearAll);
  const [size, setSize] = useState(0);

  useEffect(() => {
    load();
    totalDownloadSize().then(setSize).catch(() => {});
  }, [load]);

  const items = Object.values(downloaded);

  const play = (meta: any) => {
    setQueue([{
      id: meta.songId,
      title: meta.title,
      artist: meta.artist,
      url: "", // will resolve to the local file in the player
      duration: meta.duration || 0,
      coverUrl: meta.coverUrl,
    }]);
  };

  const confirmClearAll = () => {
    Alert.alert("Clear All Downloads", "Remove all downloaded songs from this device?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: () => { clearAll(); setSize(0); } },
    ]);
  };

  if (!loaded) {
    return <ActivityIndicator color={COLORS.gold} style={styles.loader} />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No downloads yet</Text>
      </View>
    );
  }

  const fmtSize = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.dlHeader}>
        <Text style={[styles.dlHeaderText, { color: colors.textMuted }]}>{items.length} song{items.length === 1 ? "" : "s"} · {fmtSize(size)}</Text>
        <TouchableOpacity onPress={confirmClearAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.dlClear, { color: colors.red }]}>Clear All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.songId}
        renderItem={({ item }) => (
          <View style={[styles.songRow, { backgroundColor: colors.surface }]}>
            <View style={styles.songRowArtwork}>
              <Music2 size={18} color={COLORS.bg} />
            </View>
            <View style={styles.songRowInfo}>
              <Text style={[styles.songRowTitle, { color: colors.white }]} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.songRowArtist} numberOfLines={1}>{item.artist} · Available offline</Text>
            </View>
            <Text style={styles.songRowDuration}>{item.downloadedAt ? new Date(item.downloadedAt).toLocaleDateString() : ""}</Text>
            <TouchableOpacity style={styles.playBtn} onPress={() => play(item)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Play size={12} color="#FFC107" fill="#FFC107" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.playBtn} onPress={() => { remove(item.songId); totalDownloadSize().then(setSize).catch(() => {}); }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Trash2 size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

export default function LibraryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const user = useAuthStore((s) => s.user);
  const setQueue = useQueueStore((s) => s.setQueue);
  const { colors } = useTheme();

  const [tab, setTab] = useState<Tab>("Playlists");

  useEffect(() => {
    const t = route.params?.tab;
    if (t === "Playlists" || t === "Liked" || t === "Downloads" || t === "History") {
      setTab(t);
    }
  }, [route.params?.tab]);

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
        .then((data: any[]) => setLiked(data.map(toSong)))
        .catch(() => setLiked([]))
        .finally(() => setLikedLoading(false));
    }

    if (tab === "History" && history.length === 0) {
      setHistoryLoading(true);
      trpc.streaming.getListeningHistory
        .query()
        .then((data: any[]) => setHistory(data.map(toSong)))
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
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
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
        style={[styles.playlistRow, { backgroundColor: colors.surface }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate("Playlist", { playlist: item })}
      >
        <View style={styles.playlistIcon}>
          <ListMusic size={20} color={COLORS.bg} />
        </View>
        <View style={styles.playlistInfo}>
          <Text style={[styles.playlistName, { color: colors.white }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.playlistCount}>
            {item.songCount ?? item.songs?.length ?? 0} songs
          </Text>
        </View>
        <ChevronRight size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
    ),
    [navigation],
  );

  const renderSongRow = useCallback(
    ({ item }: { item: Song }) => <SongRow song={item} onPlay={handlePlaySong} />,
    [handlePlaySong],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.white }]}>Your Library</Text>
      </View>

      <View style={styles.tabRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.tabScroll}
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabPill, { backgroundColor: colors.surface }, tab === t && styles.tabPillActive]}
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
              <Play size={14} color={COLORS.bg} fill={COLORS.bg} />
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
        <DownloadsTab />
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
              <Play size={14} color={COLORS.bg} fill={COLORS.bg} />
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
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
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
    fontSize: 15,
    color: COLORS.textMuted,
    marginBottom: 14,
    textAlign: "center",
  },
  signInBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  signInBtnText: {
    color: COLORS.bg,
    fontWeight: "700",
    fontSize: 14,
  },
  tabRow: {
    paddingHorizontal: Math.min(SW * 0.04, 16),
    marginBottom: 10,
  },
  tabScroll: {
    gap: 6,
    paddingRight: Math.min(SW * 0.04, 16),
  },
  tabPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
  },
  tabPillActive: {
    backgroundColor: COLORS.gold,
  },
  tabPillText: {
    color: COLORS.textMuted,
    fontWeight: "600",
    fontSize: 12,
  },
  tabPillTextActive: {
    color: COLORS.bg,
  },
  loader: {
    marginTop: 32,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 32,
  },
  listContent: {
    paddingHorizontal: Math.min(SW * 0.04, 16),
    paddingBottom: 70,
  },
  dlHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Math.min(SW * 0.04, 16),
    paddingVertical: 8,
  },
  dlHeaderText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dlClear: {
    fontSize: 13,
    fontWeight: "700",
  },
  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    minWidth: 0,
  },
  playlistIcon: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  playlistInfo: {
    flex: 1,
    minWidth: 0,
  },
  playlistName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 1,
    flexShrink: 1,
  },
  playlistCount: {
    color: COLORS.textMuted,
    fontSize: 11,
    flexShrink: 1,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginLeft: 16,
    marginBottom: 8,
    gap: 5,
  },
  playAllText: {
    color: COLORS.bg,
    fontWeight: "700",
    fontSize: 12,
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 8,
    marginBottom: 4,
    minWidth: 0,
  },
  songRowArtwork: {
    width: 32,
    height: 32,
    borderRadius: 5,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  songRowInfo: {
    flex: 1,
    marginRight: 6,
    minWidth: 0,
  },
  songRowTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 1,
    flexShrink: 1,
  },
  songRowArtist: {
    color: COLORS.textMuted,
    fontSize: 11,
    flexShrink: 1,
  },
  songRowDuration: {
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
});
