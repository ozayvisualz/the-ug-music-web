import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import {
  Music2,
  Play,
  Download,
  Heart,
  Send,
  Clock,
  Eye,
  ChevronLeft,
  BadgeCheck,
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { trpc } from "../api/client";
import { COLORS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";
import { useQueueStore, type Track } from "../store/playerStore";

function formatDuration(d: number): string {
  return Math.floor(d / 60) + ":" + (d % 60).toString().padStart(2, "0");
}

function formatTimeAgo(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function SongScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { songId } = route.params;

  const user = useAuthStore((s) => s.user);
  const setQueue = useQueueStore((s) => s.setQueue);

  const [song, setSong] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchSong() {
      try {
        setLoading(true);
        setError(null);
        const data = await (trpc as any).music.getById.query(songId);
        if (!cancelled) {
          setSong(data);
          setLiked(data.isLiked ?? false);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Failed to load song");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSong();
    return () => { cancelled = true; };
  }, [songId]);

  useEffect(() => {
    let cancelled = false;
    async function fetchComments() {
      try {
        setCommentsLoading(true);
        const data = await (trpc as any).social.getComments.query({ songId });
        if (!cancelled) setComments(data ?? []);
      } catch {
        if (!cancelled) setComments([]);
      } finally {
        if (!cancelled) setCommentsLoading(false);
      }
    }
    fetchComments();
    return () => { cancelled = true; };
  }, [songId]);

  const handleLike = useCallback(async () => {
    try {
      await (trpc as any).social.likeSong.mutate(songId);
      setLiked((prev: boolean) => !prev);
    } catch {}
  }, [songId]);

  const handlePlay = useCallback(() => {
    if (!song) return;
    const track: Track = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      url: song.url ?? song.audioUrl ?? "",
      duration: song.duration ?? 0,
      coverUrl: song.coverUrl ?? undefined,
    };
    setQueue([track]);
  }, [song, setQueue]);

  const handleArtistPress = useCallback(() => {
    if (!song?.artistId) return;
    navigation.navigate("Artist", { artistId: song.artistId });
  }, [song, navigation]);

  const handleSendComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed || !user) return;
    try {
      await (trpc as any).social.addComment.mutate({ songId, content: trimmed });
      setCommentText("");
      const data = await (trpc as any).social.getComments.query({ songId });
      setComments(data ?? []);
    } catch {}
  }, [commentText, songId, user]);

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

  if (error || !song) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerLoader}>
          <Music2 size={48} color={COLORS.textMuted} />
          <Text style={styles.errorText}>{error ?? "Song not found"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {song.title}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.maxWidth}>
          <View style={styles.albumArt}>
            {song.coverUrl ? (
              <View style={styles.albumImagePlaceholder}>
                <Music2 size={64} color={COLORS.textMuted} />
              </View>
            ) : (
              <View style={styles.albumImagePlaceholder}>
                <Music2 size={64} color={COLORS.textMuted} />
              </View>
            )}
          </View>

          <Text style={styles.songTitle}>{song.title}</Text>

          <TouchableOpacity onPress={handleArtistPress} style={styles.artistRow}>
            <Text style={styles.artistName}>{song.artist}</Text>
            {song.artistVerified && (
              <BadgeCheck size={14} color={COLORS.gold} />
            )}
          </TouchableOpacity>

          <View style={styles.metaRow}>
            {song.genre && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{song.genre}</Text>
              </View>
            )}
            {song.duration != null && (
              <View style={styles.metaItem}>
                <Clock size={12} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{formatDuration(song.duration)}</Text>
              </View>
            )}
            {song.plays != null && (
              <View style={styles.metaItem}>
                <Eye size={12} color={COLORS.textMuted} />
                <Text style={styles.metaText}>
                  {song.plays >= 1000
                    ? (song.plays / 1000).toFixed(1) + "K"
                    : song.plays}{" "}
                  plays
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.playButton} onPress={handlePlay} activeOpacity={0.8}>
              <Play size={20} color="#000" fill="#000" />
              <Text style={styles.playButtonText}>Play</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <Download size={20} color={COLORS.text} />
              <Text style={styles.actionButtonText}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, liked && styles.actionButtonLiked]}
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <Heart
                size={20}
                color={liked ? COLORS.red : COLORS.text}
                fill={liked ? COLORS.red : "none"}
              />
              <Text
                style={[styles.actionButtonText, liked && styles.actionButtonTextLiked]}
              >
                {liked ? "Liked" : "Like"}
              </Text>
            </TouchableOpacity>
          </View>

          {song.story ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Behind the Song</Text>
              <Text style={styles.sectionText}>{song.story}</Text>
            </View>
          ) : null}

          {song.lyrics ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lyrics</Text>
              <Text style={styles.lyricsText}>{song.lyrics}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comments</Text>
            {commentsLoading ? (
              <ActivityIndicator color={COLORS.gold} style={styles.commentsLoader} />
            ) : comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsText}>No comments yet</Text>
                <Text style={styles.emptyCommentsSub}>Be the first to share your thoughts</Text>
              </View>
            ) : (
              comments.map((comment: any) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {(comment.userName ?? comment.user?.name ?? "U").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUserName}>
                        {comment.userName ?? comment.user?.name ?? "Unknown"}
                      </Text>
                      <Text style={styles.commentTime}>
                        {formatTimeAgo(comment.createdAt ?? comment.date ?? new Date().toISOString())}
                      </Text>
                    </View>
                    <Text style={styles.commentContent}>{comment.content ?? comment.text}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.scrollBottomSpacer} />
      </ScrollView>

      <View style={styles.commentInputBar}>
        <TextInput
          style={styles.commentInput}
          placeholder={user ? "Add a comment..." : "Sign in to comment"}
          placeholderTextColor={COLORS.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          editable={!!user}
          multiline={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!commentText.trim() || !user) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendComment}
          disabled={!commentText.trim() || !user}
        >
          <Send size={18} color={commentText.trim() && user ? "#000" : COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: 16,
    alignSelf: "center",
    marginTop: 20,
    overflow: "hidden",
  },
  albumImagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  songTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
    textAlign: "center",
    marginTop: 20,
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 4,
  },
  artistName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gold,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  badge: {
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
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 24,
  },
  playButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
  },
  playButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  actionButtonLiked: {
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  actionButtonTextLiked: {
    color: COLORS.red,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  lyricsText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 24,
    fontStyle: "italic",
  },
  commentsLoader: {
    paddingVertical: 24,
  },
  emptyComments: {
    paddingVertical: 32,
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  emptyCommentsText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  emptyCommentsSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  commentItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.goldMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gold,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
  commentTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  commentContent: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  scrollBottomSpacer: {
    height: 80,
  },
  commentInputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  commentInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    fontSize: 14,
    color: COLORS.white,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surface,
  },
});
