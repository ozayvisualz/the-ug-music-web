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
import { useRoute, useNavigation } from "@react-navigation/native";
import { Music2, Play, BadgeCheck, Disc3 } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { trpc } from "../api/client";
import { useQueueStore } from "../store/playerStore";

type Song = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  coverUrl?: string;
};

type Album = {
  id: string;
  title: string;
  coverUrl?: string;
};

type Artist = {
  id: string;
  name: string;
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
        artist: s.artist,
        url: s.url,
        duration: s.duration,
        coverUrl: s.coverUrl,
      }));
      setQueue(tracks);
    },
    [artist, setQueue],
  );

  if (loading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={COLORS.gold} style={styles.loader} />
      </View>
    );
  }

  if (!artist) {
    return (
      <View style={styles.root}>
        <Text style={styles.emptyText}>Artist not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerArea}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {artist.name?.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.artistName}>{artist.name}</Text>
            {artist.verified ? (
              <BadgeCheck size={20} color={COLORS.gold} />
            ) : null}
          </View>

          {(artist.genre || artist.location) ? (
            <Text style={styles.subInfo}>
              {[artist.genre, artist.location].filter(Boolean).join(" \u00B7 ")}
            </Text>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {artist.totalStreams != null ? formatNumber(artist.totalStreams) : "0"}
              </Text>
              <Text style={styles.statLabel}>Streams</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
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
            <Text style={styles.sectionHeader}>Bio</Text>
            <Text style={styles.bioText}>{artist.bio}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Popular Songs</Text>
          {artist.songs.length === 0 ? (
            <Text style={styles.emptySubText}>No songs yet</Text>
          ) : (
            artist.songs.map((song, index) => (
              <View key={song.id} style={styles.songRow}>
                <Text style={styles.songIndex}>{index + 1}</Text>
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {song.title}
                  </Text>
                </View>
                <Text style={styles.songDuration}>{formatDuration(song.duration)}</Text>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={() => handlePlaySong(song, index)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Play size={14} color={COLORS.bg} fill={COLORS.bg} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {artist.albums && artist.albums.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Albums</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.albumsScroll}
            >
              {artist.albums.map((album) => (
                <TouchableOpacity
                  key={album.id}
                  style={styles.albumCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate("Album", { albumId: album.id })}
                >
                  <View style={styles.albumIcon}>
                    <Disc3 size={32} color={COLORS.bg} />
                  </View>
                  <Text style={styles.albumTitle} numberOfLines={1}>
                    {album.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

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
  loader: {
    marginTop: 80,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: "center",
    marginTop: 80,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  headerArea: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: {
    color: COLORS.bg,
    fontSize: 32,
    fontWeight: "700",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  artistName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
  },
  subInfo: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  followBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 28,
    minWidth: 100,
    alignItems: "center",
  },
  followBtnActive: {
    backgroundColor: COLORS.gold,
  },
  followBtnText: {
    color: COLORS.gold,
    fontWeight: "700",
    fontSize: 14,
  },
  followBtnTextActive: {
    color: COLORS.bg,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 10,
  },
  bioText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
  },
  emptySubText: {
    color: COLORS.textMuted,
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
  songIndex: {
    width: 24,
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  songInfo: {
    flex: 1,
    marginRight: 8,
  },
  songTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
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
  albumsScroll: {
    gap: 12,
    paddingRight: 16,
  },
  albumCard: {
    width: 120,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  albumIcon: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  albumTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  bottomSpacer: {
    height: 60,
  },
});
