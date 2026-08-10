import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Music2, Play, Send, Heart, MessageCircle } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { trpc } from "../api/client";
import { useQueueStore } from "../store/playerStore";
import { useAuthStore } from "../store/authStore";

type Song = {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  duration: number;
  url: string;
  coverUrl?: string;
  genre?: string;
  plays?: number;
  story?: string;
  lyrics?: string;
};

type Comment = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
};

function formatDuration(d: number): string {
  const mins = Math.floor(d / 60);
  const secs = d % 60;
  return mins + ":" + secs.toString().padStart(2, "0");
}

function formatCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
  return new Date(dateStr).toLocaleDateString();
}

export default function SongScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const songId: string = route.params.songId;
  const setQueue = useQueueStore((s) => s.setQueue);
  const user = useAuthStore((s) => s.user);

  const [song, setSong] = useState<Song | null>(null);
  const [songLoading, setSongLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setSongLoading(true);
    trpc.music.getById
      .query(songId)
      .then((data: Song) => setSong(data))
      .catch(() => setSong(null))
      .finally(() => setSongLoading(false));

    setCommentsLoading(true);
    trpc.social.getComments
      .query({ songId })
      .then((data: Comment[]) => setComments(data))
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [songId]);

  const handlePlay = useCallback(() => {
    if (!song) return;
    setQueue([
      {
        id: song.id,
        title: song.title,
        artist: song.artist,
        url: song.url,
        duration: song.duration,
        coverUrl: song.coverUrl,
      },
    ]);
  }, [song, setQueue]);

  const handleSendComment = useCallback(async () => {
    const content = commentText.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await trpc.social.addComment.mutate({ songId, content });
      setCommentText("");
      const updated = await trpc.social.getComments.query({ songId });
      setComments(updated);
    } catch {
    } finally {
      setSending(false);
    }
  }, [commentText, songId, sending]);

  if (songLoading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={COLORS.gold} style={styles.loader} />
      </View>
    );
  }

  if (!song) {
    return (
      <View style={styles.root}>
        <Text style={styles.emptyText}>Song not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.artworkWrap}>
            <View style={styles.artwork}>
              <Music2 size={64} color={COLORS.bg} />
            </View>
          </View>

          <Text style={styles.title}>{song.title}</Text>

          {song.artistId ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("Artist", { artistId: song.artistId })}
              activeOpacity={0.7}
            >
              <Text style={styles.artistName}>{song.artist}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.artistName}>{song.artist}</Text>
          )}

          <View style={styles.metaRow}>
            {song.genre ? (
              <View style={styles.genreBadge}>
                <Text style={styles.genreBadgeText}>{song.genre}</Text>
              </View>
            ) : null}
            <Text style={styles.metaText}>{formatDuration(song.duration)}</Text>
            {song.plays != null ? (
              <View style={styles.playsRow}>
                <Play size={12} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{formatCount(song.plays)} plays</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.playBtnLarge}
            activeOpacity={0.8}
            onPress={handlePlay}
          >
            <Play size={18} color={COLORS.bg} fill={COLORS.bg} />
            <Text style={styles.playBtnText}>Play</Text>
          </TouchableOpacity>

          {song.story ? (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Behind the Song</Text>
              <Text style={styles.storyText}>{song.story}</Text>
            </View>
          ) : null}

          {song.lyrics ? (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Lyrics</Text>
              <Text style={styles.lyricsText}>{song.lyrics}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.commentsHeaderRow}>
              <Text style={styles.sectionHeader}>Comments</Text>
              <Text style={styles.commentCount}>{comments.length}</Text>
            </View>

            {commentsLoading ? (
              <ActivityIndicator color={COLORS.gold} style={styles.loaderSmall} />
            ) : comments.length === 0 ? (
              <Text style={styles.noCommentsText}>No comments yet</Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentRow}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {comment.userName?.charAt(0).toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View style={styles.commentBody}>
                    <View style={styles.commentTopRow}>
                      <Text style={styles.commentName}>{comment.userName}</Text>
                      <Text style={styles.commentTime}>
                        {timeAgo(comment.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.commentInputBar}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor={COLORS.textMuted}
            value={commentText}
            onChangeText={setCommentText}
            onSubmitEditing={handleSendComment}
            returnKeyType="send"
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!commentText.trim() || sending) && styles.sendBtnDisabled]}
            activeOpacity={0.7}
            onPress={handleSendComment}
            disabled={!commentText.trim() || sending}
          >
            <Send size={16} color={commentText.trim() && !sending ? COLORS.bg : COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
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
  artworkWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  artwork: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 4,
  },
  artistName: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  genreBadge: {
    backgroundColor: COLORS.goldMuted,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  genreBadgeText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: "700",
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  playsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  playBtnLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 24,
    gap: 8,
  },
  playBtnText: {
    color: COLORS.bg,
    fontWeight: "700",
    fontSize: 15,
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
  storyText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
  },
  lyricsText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 24,
  },
  commentsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  commentCount: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  loaderSmall: {
    marginVertical: 12,
  },
  noCommentsText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  commentRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  commentAvatarText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: "700",
  },
  commentBody: {
    flex: 1,
  },
  commentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  commentName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
  },
  commentTime: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  commentContent: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 20,
  },
  commentInputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.white,
    fontSize: 14,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.surface,
  },
});
