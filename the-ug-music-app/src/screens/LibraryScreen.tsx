import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  Music2,
  Play,
  ChevronRight,
  ListMusic,
  Heart,
  Download,
  History,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { trpc } from "../api/client";
import { COLORS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";
import { useQueueStore, type Track } from "../store/playerStore";

const TABS = [
  { key: "playlists", label: "Playlists", icon: ListMusic },
  { key: "liked", label: "Liked", icon: Heart },
  { key: "downloads", label: "Downloads", icon: Download },
  { key: "history", label: "History", icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SongRow({
  item,
  onPress,
}: {
  item: { id: string; title: string; artist: string; duration?: number; url?: string; coverUrl?: string };
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.songRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.songArt}>
        <Music2 size={22} color={COLORS.textMuted} />
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      {item.duration ? (
        <Text style={styles.songDuration}>
          {formatDuration(item.duration)}
        </Text>
      ) : null}
      <TouchableOpacity style={styles.rowPlayButton} onPress={onPress}>
        <Play size={14} color="#000" fill="#000" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function PlaylistRow({
  item,
  onPress,
}: {
  item: { id: string; name: string; trackCount?: number; coverUrl?: string };
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.playlistRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.playlistArt}>
        {item.coverUrl ? (
          <Animated.Image
            source={{ uri: item.coverUrl }}
            style={styles.playlistImage}
          />
        ) : (
          <ListMusic size={28} color={COLORS.gold} />
        )}
      </View>
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.playlistMeta}>
          {item.trackCount ?? 0} {item.trackCount === 1 ? "song" : "songs"}
        </Text>
      </View>
      <ChevronRight size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

export default function LibraryScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const setQueue = useQueueStore((s) => s.setQueue);
  const [activeTab, setActiveTab] = useState<TabKey>("playlists");

  const playlistsQuery =
    trpc.playlist?.getMyPlaylists?.useQuery
      ? trpc.playlist.getMyPlaylists.useQuery(undefined, { enabled: !!user })
      : { data: [], isLoading: false };

  const likedQuery =
    trpc.social?.getLikedSongs?.useQuery
      ? trpc.social.getLikedSongs.useQuery(undefined, { enabled: !!user })
      : { data: [], isLoading: false };

  const historyQuery =
    trpc.streaming?.getListeningHistory?.useQuery
      ? trpc.streaming.getListeningHistory.useQuery(undefined, {
          enabled: !!user,
        })
      : { data: [], isLoading: false };

  const handlePlaySong = useCallback(
    (song: any) => {
      const track: Track = {
        id: song.id,
        title: song.title ?? song.name,
        artist: song.artist ?? song.artistName ?? "",
        url: song.url ?? song.audioUrl ?? "",
        duration: song.duration ?? 0,
        coverUrl: song.coverUrl ?? undefined,
      };
      setQueue([track]);
    },
    [setQueue]
  );

  const handlePlaylistPress = useCallback(
    (playlist: any) => {
      navigation.navigate("Playlist", {
        id: playlist.id,
        name: playlist.name,
      });
    },
    [navigation]
  );

  const handleLoginPress = useCallback(() => {
    navigation.navigate("ProfileTab", { screen: "Profile" });
  }, [navigation]);

  const renderSongItem = useCallback(
    ({ item }: { item: any }) => (
      <SongRow item={item} onPress={() => handlePlaySong(item)} />
    ),
    [handlePlaySong]
  );

  const renderPlaylistItem = useCallback(
    ({ item }: { item: any }) => (
      <PlaylistRow item={item} onPress={() => handlePlaylistPress(item)} />
    ),
    [handlePlaylistPress]
  );

  const renderHistoryItem = useCallback(
    ({ item }: { item: any }) => {
      const song = item.song ?? item;
      return (
        <SongRow
          item={{
            id: song.id ?? item.id,
            title: song.title ?? item.title,
            artist: song.artist ?? item.artist,
            duration: song.duration ?? item.duration,
            url: song.url ?? song.audioUrl ?? item.url,
          }}
          onPress={() => handlePlaySong(song)}
        />
      );
    },
    [handlePlaySong]
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <Text style={styles.headerTitle}>Your Library</Text>
        </Animated.View>
        <View style={styles.notLoggedIn}>
          <Music2 size={48} color={COLORS.textMuted} />
          <Text style={styles.notLoggedInTitle}>Log in to see your library</Text>
          <Text style={styles.notLoggedInSubtitle}>
            Your playlists, liked songs, and downloads will appear here.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLoginPress}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const playlistData = (playlistsQuery.data ?? []) as any[];
  const likedData = (likedQuery.data ?? []) as any[];
  const historyData = (historyQuery.data ?? []) as any[];

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Text style={styles.headerTitle}>Your Library</Text>
      </Animated.View>

      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Icon
                size={16}
                color={isActive ? COLORS.gold : COLORS.textMuted}
              />
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.content}>
        {activeTab === "playlists" && (
          <>
            {playlistsQuery.isLoading ? (
              <ActivityIndicator color={COLORS.gold} style={styles.loader} />
            ) : playlistData.length === 0 ? (
              <View style={styles.emptyContent}>
                <ListMusic size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No playlists yet</Text>
                <Text style={styles.emptySubtitle}>
                  Create a playlist to get started
                </Text>
              </View>
            ) : (
              <FlatList
                data={playlistData}
                keyExtractor={(item: any) => item.id}
                renderItem={renderPlaylistItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
              />
            )}
          </>
        )}

        {activeTab === "liked" && (
          <>
            {likedQuery.isLoading ? (
              <ActivityIndicator color={COLORS.gold} style={styles.loader} />
            ) : likedData.length === 0 ? (
              <View style={styles.emptyContent}>
                <Heart size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No liked songs yet</Text>
                <Text style={styles.emptySubtitle}>
                  Songs you like will appear here
                </Text>
              </View>
            ) : (
              <FlatList
                data={likedData}
                keyExtractor={(item: any) => item.id}
                renderItem={renderSongItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
              />
            )}
          </>
        )}

        {activeTab === "downloads" && (
          <View style={styles.emptyContent}>
            <Download size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No downloads yet</Text>
            <Text style={styles.emptySubtitle}>
              Downloaded songs will appear here for offline listening
            </Text>
          </View>
        )}

        {activeTab === "history" && (
          <>
            {historyQuery.isLoading ? (
              <ActivityIndicator color={COLORS.gold} style={styles.loader} />
            ) : historyData.length === 0 ? (
              <View style={styles.emptyContent}>
                <History size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No listening history</Text>
                <Text style={styles.emptySubtitle}>
                  Songs you listen to will appear here
                </Text>
              </View>
            ) : (
              <FlatList
                data={historyData}
                keyExtractor={(item: any, index: number) =>
                  item.id ?? `history-${index}`
                }
                renderItem={renderHistoryItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
              />
            )}
          </>
        )}
      </View>
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
  },
  notLoggedIn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  notLoggedInTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    marginTop: 16,
  },
  notLoggedInSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  loginButton: {
    marginTop: 12,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 50,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
  },
  tabActive: {
    backgroundColor: COLORS.goldMuted,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.gold,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 8,
  },
  listSeparator: {
    height: 2,
  },
  loader: {
    paddingVertical: 60,
  },
  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  songArt: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
    marginRight: 8,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  songArtist: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  songDuration: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginRight: 12,
  },
  rowPlayButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  playlistArt: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  playlistImage: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  playlistMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },
});
