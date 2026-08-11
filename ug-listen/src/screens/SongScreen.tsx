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
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Music2, Play, Send, Heart, MessageCircle } from "lucide-react-native";
import { COLORS } from "../constants/theme";
import { trpc } from "../api/client";
import { useQueueStore } from "../store/playerStore";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeContext";

const SW = Dimensions.get("window").width;
const ARTWORK_SIZE = Math.min(SW * 0.55, 220);

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
  const { colors } = useTheme();

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
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={COLORS.gold} style={styles.loader} />
      </View>
    );
  }

  if (!song) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <Text style={styles.emptyText}>Song not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.artworkWrap}>
            <View style={styles.artwork}>
              <Music2 size={48} color={COLORS.bg} />
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
                <Play size={10} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{formatCount(song.plays)} plays</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.playBtnLarge}
            activeOpacity={0.8}
            onPress={handlePlay}
          >
            <Play size={16} color={COLORS.bg} fill={COLORS.bg} />
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
            <Send size={14} color={commentText.trim() && !sending ? COLORS.bg : COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
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
  artworkWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 14,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: SW < 360 ? 18 : 22,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 3,
    flexShrink: 1,
  },
  artistName: {
    fontSize: SW < 360 ? 13 : 15,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 10,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  genreBadge: {
    backgroundColor: COLORS.goldMuted,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  genreBadgeText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: "700",
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  playsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  playBtnLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginBottom: 20,
    gap: 7,
  },
  playBtnText: {
    color: COLORS.bg,
    fontWeight: "700",
    fontSize: 14,
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
  storyText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },
  lyricsText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 22,
  },
  commentsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  commentCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  loaderSmall: {
    marginVertical: 10,
  },
  noCommentsText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  commentRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  commentAvatarText: {
    color: COLORS.bg,
    fontSize: 13,
    fontWeight: "700",
  },
  commentBody: {
    flex: 1,
    minWidth: 0,
  },
  commentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
    minWidth: 0,
  },
  commentName: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  commentTime: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  commentContent: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 17,
  },
  bottomSpacer: {
    height: 16,
  },
  commentInputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Math.min(SW * 0.035, 14),
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: COLORS.white,
    fontSize: 13,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.surface,
  },
});
