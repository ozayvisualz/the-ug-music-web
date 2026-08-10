import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  Music2,
  Play,
  ChevronLeft,
  MapPin,
  BadgeCheck,
  Disc,
  Users,
  Headphones,
  UserPlus,
  UserCheck,
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { trpc } from "../api/client";
import { COLORS } from "../constants/theme";
import { useQueueStore, type Track } from "../store/playerStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function ArtistScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { artistId } = route.params;

  const setQueue = useQueueStore((s) => s.setQueue);

  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchArtist() {
      try {
        setLoading(true);
        setError(null);
        const data = await (trpc as any).music.getArtistById.query(artistId);
        if (!cancelled) {
          setArtist(data);
          setFollowing(data.isFollowing ?? false);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Failed to load artist");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchArtist();
    return () => { cancelled = true; };
  }, [artistId]);

  const handleFollow = useCallback(async () => {
    try {
      await (trpc as any).social.followArtist.mutate(artistId);
      setFollowing((prev: boolean) => !prev);
    } catch {}
  }, [artistId]);

  const handlePlayAll = useCallback(() => {
    const songs = artist?.songs ?? artist?.popularSongs ?? [];
    if (songs.length === 0) return;
    const tracks: Track[] = songs.map((s: any) => ({
      id: s.id,
      title: s.title,
      artist: artist.name ?? artist.artist ?? "",
      url: s.url ?? s.audioUrl ?? "",
      duration: s.duration ?? 0,
      coverUrl: s.coverUrl ?? undefined,
    }));
    setQueue(tracks, 0);
  }, [artist, setQueue]);

  const handlePlaySong = useCallback(
    (song: any, index: number) => {
      const songs = artist?.songs ?? artist?.popularSongs ?? [];
      const tracks: Track[] = songs.map((s: any) => ({
        id: s.id,
        title: s.title,
        artist: artist.name ?? artist.artist ?? "",
        url: s.url ?? s.audioUrl ?? "",
        duration: s.duration ?? 0,
        coverUrl: s.coverUrl ?? undefined,
      }));
      setQueue(tracks, index);
    },
    [artist, setQueue]
  );

  const handleAlbumPress = useCallback(
    (album: any) => {
      navigation.navigate("Album", { albumId: album.id });
    },
    [navigation]
  );

  const getInitial = (name: string): string => {
    if (!name) return "A";
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      </View>
    );
  }

  if (error || !artist) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerLoader}>
          <Music2 size={48} color={COLORS.textMuted} />
          <Text style={styles.errorText}>{error ?? "Artist not found"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const songs = artist.songs ?? artist.popularSongs ?? [];
  const albums = artist.albums ?? [];
  const totalStreams = artist.totalStreams ?? artist.streams ?? 0;
  const followers = artist.followers ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {artist.name}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.coverArea}>
          <View style={styles.gradientOverlay} />
          {artist.coverUrl ? (
            <Image source={{ uri: artist.coverUrl }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}

          <View style={styles.avatarSection}>
            {artist.imageUrl ? (
              <Image source={{ uri: artist.imageUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarLetter}>
                  {getInitial(artist.name)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.maxWidth}>
          <View style={styles.nameRow}>
            <Text style={styles.artistName}>{artist.name}</Text>
            {artist.verified && (
              <BadgeCheck size={20} color={COLORS.gold} fill={COLORS.gold} />
            )}
          </View>

          {(artist.genre || artist.location) && (
            <View style={styles.genreLocationRow}>
              {artist.genre && (
                <View style={styles.badge}>
                  <Music2 size={12} color={COLORS.gold} />
                  <Text style={styles.badgeText}>{artist.genre}</Text>
                </View>
              )}
              {artist.location && (
                <View style={styles.locationRow}>
                  <MapPin size={12} color={COLORS.textMuted} />
                  <Text style={styles.locationText}>{artist.location}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Headphones size={16} color={COLORS.gold} />
              <Text style={styles.statValue}>{formatNumber(totalStreams)}</Text>
              <Text style={styles.statLabel}>Streams</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Music2 size={16} color={COLORS.gold} />
              <Text style={styles.statValue}>{songs.length}</Text>
              <Text style={styles.statLabel}>Songs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Users size={16} color={COLORS.gold} />
              <Text style={styles.statValue}>{formatNumber(followers)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.playAllButton}
              onPress={handlePlayAll}
              activeOpacity={0.8}
            >
              <Play size={18} color="#000" fill="#000" />
              <Text style={styles.playAllText}>Play</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.followButton, following && styles.followButtonActive]}
              onPress={handleFollow}
              activeOpacity={0.7}
            >
              {following ? (
                <UserCheck size={18} color={COLORS.gold} />
              ) : (
                <UserPlus size={18} color={COLORS.white} />
              )}
              <Text style={[styles.followText, following && styles.followTextActive]}>
                {following ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          </View>

          {artist.bio ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bio</Text>
              <Text style={styles.bioText} numberOfLines={5}>
                {artist.bio}
              </Text>
            </View>
          ) : null}

          {songs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Songs</Text>
              {songs.map((song: any, index: number) => (
                <TouchableOpacity
                  key={song.id ?? index}
                  style={styles.songRow}
                  onPress={() => handlePlaySong(song, index)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.songNumber}>{String(index + 1).padStart(2, "0")}</Text>
                  <View style={styles.songCoverMini}>
                    {song.coverUrl ? (
                      <Image source={{ uri: song.coverUrl }} style={styles.songCoverImage} />
                    ) : (
                      <Music2 size={16} color={COLORS.textMuted} />
                    )}
                  </View>
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>
                      {song.title}
                    </Text>
                    <Text style={styles.songPlays} numberOfLines={1}>
                      {formatNumber(song.plays ?? 0)} plays
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.songPlayButton}
                    onPress={() => handlePlaySong(song, index)}
                  >
                    <Play size={14} color="#000" fill="#000" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {albums.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Albums</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.albumsList}
              >
                {albums.map((album: any) => (
                  <TouchableOpacity
                    key={album.id}
                    style={styles.albumCard}
                    onPress={() => handleAlbumPress(album)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.albumArt}>
                      {album.coverUrl ? (
                        <Image source={{ uri: album.coverUrl }} style={styles.albumCoverImage} />
                      ) : (
                        <View style={styles.albumPlaceholder}>
                          <Disc size={28} color={COLORS.textMuted} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.albumTitle} numberOfLines={1}>
                      {album.title}
                    </Text>
                    <Text style={styles.albumYear}>
                      {album.year ?? album.releaseYear ?? ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similar Artists</Text>
            <View style={styles.similarPlaceholder}>
              <Disc size={32} color={COLORS.textMuted} />
              <Text style={styles.similarPlaceholderText}>
                Similar artists coming soon
              </Text>
            </View>
          </View>
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
  coverArea: {
    width: SCREEN_WIDTH,
    height: 220,
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(9,9,11,0.6)",
    zIndex: 1,
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: 220,
  },
  coverPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface,
  },
  avatarSection: {
    zIndex: 2,
    marginBottom: -40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.bg,
  },
  avatarFallback: {
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: "800",
    color: "#000",
  },
  maxWidth: {
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    marginTop: 52,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  artistName: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
    textAlign: "center",
  },
  genreLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.goldMuted,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gold,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  playAllButton: {
    flex: 1,
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
  followButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followButtonActive: {
    backgroundColor: COLORS.goldMuted,
  },
  followText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  followTextActive: {
    color: COLORS.gold,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
    gap: 12,
  },
  songNumber: {
    width: 24,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textMuted,
    textAlign: "center",
  },
  songCoverMini: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  songCoverImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  songPlays: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  songPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  albumsList: {
    gap: 12,
  },
  albumCard: {
    width: 140,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },
  albumArt: {
    width: 140,
    height: 140,
  },
  albumCoverImage: {
    width: 140,
    height: 140,
  },
  albumPlaceholder: {
    width: 140,
    height: 140,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  albumTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  albumYear: {
    fontSize: 11,
    color: COLORS.textMuted,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 2,
  },
  similarPlaceholder: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    gap: 10,
  },
  similarPlaceholderText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  bottomSpacer: {
    height: 100,
  },
});
