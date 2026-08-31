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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Music2, Play, BadgeCheck, Disc3 } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { trpc } from "../api/client";
import { useQueueStore } from "../store/playerStore";
import { useTheme } from "../theme/ThemeContext";

const SW = Dimensions.get("window").width;

type Song = {
  id: string;
  title: string;
  artist?: string;
  artistId?: string;
  duration: number;
  url?: string;
  fileUrl?: string;
  hlsUrl?: string;
  coverUrl?: string;
};

type Album = {
  id: string;
  title: string;
  coverUrl?: string;
};

type Artist = {
  id: string;
  name?: string;
  artistName?: string;
  photoUrl?: string | null;
  verified: boolean;
  genre?: string;
  location?: string;
  totalStreams?: number;
  songs: Song[];
  albums?: Album[];
  bio?: string;
};

function formatDuration(d: number): string {
  const mins = Math.floor(d / 60);
  const secs = d % 60;
  return mins + ":" + secs.toString().padStart(2, "0");
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function ArtistScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const artistId: string = route.params.artistId;
  const setQueue = useQueueStore((s) => s.setQueue);
  const { colors } = useTheme();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    trpc.music.getArtistById
      .query(artistId)
      .then((data: Artist) => setArtist(data))
      .catch(() => setArtist(null))
      .finally(() => setLoading(false));
  }, [artistId]);

  const handleFollowToggle = useCallback(async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      await trpc.social.followArtist.mutate(artistId);
      setFollowing((prev) => !prev);
    } catch {
    } finally {
      setFollowLoading(false);
    }
  }, [artistId, followLoading]);

  const handlePlaySong = useCallback(
    (song: Song, index: number) => {
      if (!artist) return;
      const tracks = artist.songs.map((s) => ({
        id: s.id,
        title: s.title,
        artist: (s as any).artist?.artistName || (s as any).artist?.user?.name || artist.artistName || artist.name || "Unknown",
        url: (s as any).fileUrl || (s as any).hlsUrl || (s as any).url || "",
        duration: s.duration,
        coverUrl: s.coverUrl,
        artistId: artist.id,
      }));
      setQueue(tracks, index);
    },
    [artist, setQueue],
  );

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={COLORS.gold} style={styles.loader} />
      </View>
    );
  }

  if (!artist) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <Text style={styles.emptyText}>Artist not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.headerArea, { backgroundColor: colors.surface }]}>
          <View style={styles.avatar}>
            {artist.photoUrl ? (
              <Image source={{ uri: artist.photoUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {artist.name?.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text style={[styles.artistName, { color: colors.white }]}>{artist.artistName || artist.name}</Text>
            {artist.verified ? (
              <BadgeCheck size={18} color={COLORS.gold} />
            ) : null}
          </View>

          {(artist.genre || artist.location) ? (
            <Text style={styles.subInfo}>
              {[artist.genre, artist.location].filter(Boolean).join(" \u00B7 ")}
            </Text>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.white }]}>
                {artist.totalStreams != null ? formatNumber(artist.totalStreams) : "0"}
              </Text>
              <Text style={styles.statLabel}>Streams</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.white }]}>
                {formatNumber(artist.songs?.length ?? 0)}
              </Text>
              <Text style={styles.statLabel}>Songs</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.followBtn, following && styles.followBtnActive]}
            activeOpacity={0.8}
            onPress={handleFollowToggle}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={COLORS.gold} />
            ) : (
              <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
                {following ? "Following" : "Follow"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {artist.bio ? (
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.white }]}>Bio</Text>
            <Text style={styles.bioText}>{artist.bio}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.white }]}>Popular Songs</Text>
          {artist.songs.length === 0 ? (
            <Text style={styles.emptySubText}>No songs yet</Text>
          ) : (
            artist.songs.map((song, index) => (
              <View key={song.id} style={[styles.songRow, { backgroundColor: colors.surface }]}>
                <Text style={styles.songIndex}>{index + 1}</Text>
                <View style={styles.songInfo}>
                  <Text style={[styles.songTitle, { color: colors.white }]} numberOfLines={1}>
                    {song.title}
                  </Text>
                </View>
                <Text style={styles.songDuration}>{formatDuration(song.duration)}</Text>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={() => handlePlaySong(song, index)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Play size={12} color="#FFC107" fill="#FFC107" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {artist.albums && artist.albums.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.white }]}>Albums</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.albumsScroll}
            >
              {artist.albums.map((album) => (
                <TouchableOpacity
                  key={album.id}
                  style={[styles.albumCard, { backgroundColor: colors.surface }]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate("Album", { albumId: album.id })}
                >
                  <View style={styles.albumIcon}>
                    <Disc3 size={26} color={COLORS.bg} />
                  </View>
                  <Text style={[styles.albumTitle, { color: colors.white }]} numberOfLines={1}>
                    {album.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

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
  loader: {
    marginTop: 60,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: "center",
    marginTop: 60,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Math.min(SW * 0.04, 16),
    paddingTop: 16,
  },
  headerArea: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarText: {
    color: COLORS.bg,
    fontSize: 26,
    fontWeight: "700",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },
  artistName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  subInfo: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  followBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 24,
    minWidth: 90,
    alignItems: "center",
  },
  followBtnActive: {
    backgroundColor: COLORS.gold,
  },
  followBtnText: {
    color: COLORS.gold,
    fontWeight: "700",
    fontSize: 13,
  },
  followBtnTextActive: {
    color: COLORS.bg,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 8,
  },
  bioText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },
  emptySubText: {
    color: COLORS.textMuted,
    fontSize: 12,
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
  songInfo: {
    flex: 1,
    marginRight: 6,
    minWidth: 0,
  },
  songTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
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
  albumsScroll: {
    gap: 10,
    paddingRight: 16,
  },
  albumCard: {
    width: Math.min(SW * 0.3, 120),
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    minWidth: 0,
  },
  albumIcon: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  albumTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
  bottomSpacer: {
    height: 70,
  },
});
