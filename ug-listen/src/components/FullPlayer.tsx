import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions, Share, TextInput, ActivityIndicator } from "react-native";
import { Music2, Play, Pause, SkipBack, SkipForward, Heart, Download, ListPlus, Share2, Shuffle, Repeat, ChevronDown, Send, Repeat1, X } from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from "react-native-reanimated";
import { COLORS, RADIUS, HIT_SLOP, SPRING } from "../constants/theme";
import { usePlayer } from "./PlayerContext";
import { useQueueStore } from "../store/playerStore";
import { useTheme } from "../theme/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigate } from "../navigation/navigationRef";
import { getAuthToken } from "../api/client";
import { getStoredToken } from "../api/auth";

const SW = Dimensions.get("window").width;
const ART_SIZE = Math.min(SW * 0.55, 260);
const isSmall = SW < 360;

type Props = { onCollapse?: () => void };

export default function FullPlayer({ onCollapse }: Props) {
  const { currentTrack, isPlaying, isLoaded, position, duration, togglePlay, seek, skipNext, skipPrev } = usePlayer();
  const queue = useQueueStore((s) => s.queue);
  const currentIndex = useQueueStore((s) => s.currentIndex);
  const shuffle = useQueueStore((s) => s.shuffle);
  const repeat = useQueueStore((s) => s.repeat);
  const toggleShuffle = useQueueStore((s) => s.toggleShuffle);
  const cycleRepeat = useQueueStore((s) => s.cycleRepeat);
  const removeFromQueue = useQueueStore((s) => s.removeFromQueue);
  const jumpTo = useQueueStore((s) => s.jumpTo);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<"lyrics" | "queue" | "comments">("lyrics");
  const [liked, setLiked] = useState(false);
  const [lyrics, setLyrics] = useState<string>("");
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [dragPos, setDragPos] = useState<number | null>(null);
  const [playlistModal, setPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);
  const seekBarWidthRef = useRef<number>(SW);

  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(100);

  useEffect(() => {
    scale.value = withSpring(1, SPRING.gentle);
    opacity.value = withTiming(1, { duration: 280 });
    translateY.value = withSpring(0, SPRING.gentle);
  }, []);

  const handleCollapse = () => {
    scale.value = withSpring(0.92, SPRING.gentle);
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(100, SPRING.gentle, () => { if (onCollapse) runOnJS(onCollapse)(); });
  };

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  if (!currentTrack) return null;

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  const formatTime = (s: number) => {
    if (s < 0) return "0:00";
    const m = Math.floor(s / 60);
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const handleSeek = (ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    seek(clamped * duration);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Now playing: ${currentTrack.title} by ${currentTrack.artist} on TheUgMusic — https://theugmusic.com/song/${currentTrack.id}`,
      });
    } catch {}
  };

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    try {
      const token = await getStoredToken();
      await fetch(`https://theugmusic.com/api/trpc/social.likeSong?batch=1`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ "0": { json: currentTrack.id } }) });
    } catch {}
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const token = await getStoredToken();
      await fetch(`https://theugmusic.com/api/trpc/payments.initiateDownload?batch=1`, {
        method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ "0": { json: { songId: currentTrack.id } } }),
      });
    } catch {} finally {
      setTimeout(() => setDownloading(false), 1500);
    }
  };

  const openPlaylistModal = async () => {
    setPlaylistModal(true);
    try {
      const token = await getStoredToken();
      const res = await fetch(`https://theugmusic.com/api/trpc/playlist.getMyPlaylists?batch=1`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d = await res.json();
      const data = d?.[0]?.result?.data?.json || d?.[0]?.result?.data || [];
      setPlaylists(Array.isArray(data) ? data : []);
    } catch {}
  };

  const addToPlaylist = async (playlistId: string) => {
    try {
      const token = await getStoredToken();
      await fetch(`https://theugmusic.com/api/trpc/playlist.addSong?batch=1`, {
        method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ "0": { json: { playlistId, songId: currentTrack.id } } }),
      });
      setPlaylistModal(false);
    } catch {}
  };

  const createPlaylist = async () => {
    const title = `Playlist ${new Date().toLocaleDateString()}`;
    try {
      const token = await getStoredToken();
      const res = await fetch(`https://theugmusic.com/api/trpc/playlist.create?batch=1`, {
        method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ "0": { json: { title } } }),
      });
      const d = await res.json();
      const created = d?.[0]?.result?.data?.json || d?.[0]?.result?.data;
      if (created?.id) { await addToPlaylist(created.id); }
    } catch {}
  };

  useEffect(() => {
    if (!currentTrack?.id) return;
    (async () => {
      const token = await getStoredToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      fetch(`https://theugmusic.com/api/trpc/music.getById?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%22${currentTrack.id}%22%7D%7D`, { headers })
        .then((r) => r.json())
        .then((d) => {
          const song = d?.[0]?.result?.data?.json || d?.[0]?.result?.data;
          if (song?.lyrics) setLyrics(song.lyrics);
          if (song?.comments) setComments(song.comments);
        })
        .catch(() => {});
    })();
  }, [currentTrack?.id]);

  const postComment = async () => {
    if (!commentText.trim() || posting) return;
    setPosting(true);
    try {
      const token = await getStoredToken();
      const res = await fetch(`https://theugmusic.com/api/trpc/social.addComment?batch=1`, {
        method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ "0": { json: { songId: currentTrack.id, content: commentText.trim() } } }),
      });
      if (res.ok) {
        setComments((c) => [{ id: Date.now().toString(), content: commentText.trim(), user: { name: "You" }, createdAt: new Date().toISOString() }, ...c]);
        setCommentText("");
      }
    } catch {} finally { setPosting(false); }
  };

  const upcoming = queue.slice(currentIndex + 1);
  const displayPosition = dragPos ?? position;

  return (
    <View style={styles.overlay}>
      <View style={[styles.backdrop, { backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.5)" }]} />
      <Animated.View style={[styles.card, { backgroundColor: colors.bg, paddingTop: insets.top }, cardStyle]}>
        <TouchableOpacity onPress={handleCollapse} style={styles.dragBar}>
          <View style={[styles.dragPill, { backgroundColor: colors.textDisabled }]} />
        </TouchableOpacity>

        <View style={styles.header}>
          <TouchableOpacity onPress={handleCollapse} hitSlop={HIT_SLOP}><ChevronDown size={24} color={colors.text} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{currentTrack.title}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={[styles.artwork, { backgroundColor: colors.gold }]}>
          <Music2 size={80} color={colors.bg} />
        </View>

        <View style={styles.infoArea}>
          <Text style={[styles.trackTitle, { color: colors.white }]} numberOfLines={1}>{currentTrack.title}</Text>
          <TouchableOpacity onPress={handleLike} hitSlop={HIT_SLOP}>
            <Heart size={20} color={liked ? colors.red : colors.textMuted} fill={liked ? colors.red : "none"} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => currentTrack.artistId && navigate("Artist", { artistId: currentTrack.artistId })}>
          <Text style={[styles.trackArtist, { color: colors.gold }]}>{currentTrack.artist}</Text>
        </TouchableOpacity>

        {/* Seek Bar - interactive */}
        <View style={styles.seekArea}>
          <View
            style={[styles.seekBg, { backgroundColor: colors.border }]}
            onLayout={(e) => { seekBarWidthRef.current = e.nativeEvent.layout.width; }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) => { const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / seekBarWidthRef.current)); setDragPos(ratio * duration); }}
            onResponderMove={(e) => { const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / seekBarWidthRef.current)); setDragPos(ratio * duration); }}
            onResponderRelease={() => { if (dragPos !== null) { handleSeek(dragPos / duration); } setDragPos(null); }}
          >
            <View style={[styles.seekFill, { width: `${((dragPos ?? position) / (duration || 1)) * 100}%`, backgroundColor: colors.gold }]} />
            <View style={[styles.seekThumb, { left: `${((dragPos ?? position) / (duration || 1)) * 100}%`, backgroundColor: colors.gold }]} />
          </View>
          {dragPos !== null && (
            <View style={[styles.timeBubble, { backgroundColor: colors.gold, left: `${((dragPos) / (duration || 1)) * 100}%` }]}>
              <Text style={[styles.timeBubbleText, { color: colors.bg }]}>{formatTime(dragPos)}</Text>
            </View>
          )}
          <View style={styles.timeRow}>
            <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(displayPosition)}</Text>
            <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={toggleShuffle} hitSlop={HIT_SLOP}>
            <Shuffle size={20} color={shuffle ? colors.gold : colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={skipPrev} hitSlop={HIT_SLOP}><SkipBack size={24} color={colors.text} /></TouchableOpacity>
          <TouchableOpacity onPress={togglePlay} style={[styles.playBtn, { backgroundColor: colors.gold }]} hitSlop={HIT_SLOP}>
            {!isLoaded ? <ActivityIndicator size="small" color={colors.bg} /> : isPlaying ? <Pause size={28} color={colors.bg} /> : <Play size={28} color={colors.bg} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={skipNext} hitSlop={HIT_SLOP}><SkipForward size={24} color={colors.text} /></TouchableOpacity>
          <TouchableOpacity onPress={cycleRepeat} hitSlop={HIT_SLOP}>
            {repeat === 2 ? <Repeat1 size={20} color={colors.gold} /> : <Repeat size={20} color={repeat === 1 ? colors.gold : colors.textMuted} />}
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {[
            { icon: <Heart size={18} color={liked ? colors.red : colors.textMuted} fill={liked ? colors.red : "none"} />, label: "Like", onPress: handleLike },
            { icon: downloading ? <ActivityIndicator size="small" color={colors.textMuted} /> : <Download size={18} color={colors.textMuted} />, label: downloading ? "Saving" : "Download", onPress: handleDownload },
            { icon: <ListPlus size={18} color={colors.textMuted} />, label: "Playlist", onPress: openPlaylistModal },
            { icon: <Share2 size={18} color={colors.textMuted} />, label: "Share", onPress: handleShare },
          ].map((a, i) => (
            <TouchableOpacity key={i} style={styles.actionItem} onPress={a.onPress} hitSlop={HIT_SLOP}>
              {a.icon}
              <Text style={[styles.actionLabel, { color: colors.textMuted }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(["lyrics", "queue", "comments"] as const).map((t) => (
            <TouchableOpacity key={t} style={[styles.tabPill, tab === t && { backgroundColor: colors.goldMuted }]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, { color: tab === t ? colors.gold : colors.textMuted }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {tab === "lyrics" && (
            <Text style={[styles.lyricsText, { color: colors.text }]}>
              {lyrics || "Lyrics not available"}
            </Text>
          )}
          {tab === "comments" && (
            <>
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[styles.commentRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.commentAvatar, { backgroundColor: colors.goldMuted }]}>
                      <Text style={{ color: colors.gold, fontWeight: "700" }}>{(item.user?.name || "U").charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.commentName, { color: colors.text }]}>{item.user?.name || "Unknown"}</Text>
                      <Text style={[styles.commentContent, { color: colors.textMuted }]}>{item.content}</Text>
                    </View>
                  </View>
                )}
                style={{ flex: 1 }}
              />
              <View style={[styles.commentInputRow, { borderTopColor: colors.border }]}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a comment..."
                  placeholderTextColor={colors.textMuted}
                  style={[styles.commentInput, { color: colors.text, borderColor: colors.border }]}
                />
                <TouchableOpacity onPress={postComment} disabled={posting} hitSlop={HIT_SLOP}>
                  {posting ? <ActivityIndicator size="small" color={colors.gold} /> : <Send size={20} color={colors.gold} />}
                </TouchableOpacity>
              </View>
            </>
          )}
          {tab === "queue" && (
            <FlatList
              data={upcoming}
              keyExtractor={(item, i) => `${item.id}-${i}`}
              renderItem={({ item, index }) => (
                <View style={[styles.queueItem, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.queueIdx, { color: colors.textMuted }]}>{index + 1}</Text>
                  <View style={[styles.queueArt, { backgroundColor: colors.goldMuted }]}>
                    <Music2 size={14} color={colors.gold} />
                  </View>
                  <TouchableOpacity style={{ flex: 1, minWidth: 0 }} onPress={() => jumpTo(currentIndex + 1 + index)}>
                    <Text style={[styles.queueTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.queueArtist, { color: colors.textMuted }]} numberOfLines={1}>{item.artist}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeFromQueue(currentIndex + 1 + index)} hitSlop={HIT_SLOP}>
                    <X size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </Animated.View>

      {playlistModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setPlaylistModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add to Playlist</Text>
              <TouchableOpacity onPress={() => setPlaylistModal(false)} hitSlop={HIT_SLOP}><X size={20} color={colors.textMuted} /></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalRow} onPress={createPlaylist}>
              <ListPlus size={18} color={colors.gold} />
              <Text style={[styles.modalRowText, { color: colors.gold }]}>Create New Playlist</Text>
            </TouchableOpacity>
            {playlists.length === 0 && (
              <Text style={[styles.modalEmpty, { color: colors.textMuted }]}>No playlists yet</Text>
            )}
            {playlists.map((p) => (
              <TouchableOpacity key={p.id} style={styles.modalRow} onPress={() => addToPlaylist(p.id)}>
                <Music2 size={18} color={colors.textMuted} />
                <Text style={[styles.modalRowText, { color: colors.text }]} numberOfLines={1}>{p.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  card: { flex: 1, paddingHorizontal: 20, paddingBottom: 60 },
  dragBar: { alignItems: "center", paddingVertical: 12 },
  dragPill: { width: 32, height: 4, borderRadius: 2 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  headerTitle: { fontSize: 16, fontWeight: "600", flex: 1, textAlign: "center" },
  artwork: { width: ART_SIZE, height: ART_SIZE, borderRadius: RADIUS.xl, alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  infoArea: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 4, minWidth: 0 },
  trackTitle: { fontSize: isSmall ? 16 : 20, fontWeight: "700", flexShrink: 1 },
  trackArtist: { fontSize: isSmall ? 13 : 15, textAlign: "center", marginBottom: 16, fontWeight: "600" },
  seekArea: { marginBottom: 20, position: "relative" },
  seekBg: { height: 4, borderRadius: 2, marginBottom: 4, position: "relative" },
  seekFill: { height: 4, borderRadius: 2, position: "absolute", left: 0, top: 0 },
  seekThumb: { position: "absolute", width: 16, height: 16, borderRadius: 8, top: -6, marginLeft: -8 },
  timeBubble: { position: "absolute", top: -32, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "center" },
  timeBubbleText: { fontSize: 11, fontWeight: "700" },
  timeRow: { flexDirection: "row", justifyContent: "space-between" },
  time: { fontSize: 11 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, marginBottom: 20 },
  playBtn: { width: isSmall ? 48 : 56, height: isSmall ? 48 : 56, borderRadius: isSmall ? 24 : 28, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  actionItem: { alignItems: "center", gap: 2 },
  actionLabel: { fontSize: 10 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 14, justifyContent: "center" },
  tabPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full },
  tabText: { fontSize: 13, fontWeight: "600" },
  tabContent: { flex: 1 },
  lyricsText: { textAlign: "center", marginTop: 20, fontSize: 14, lineHeight: 22 },
  commentRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 0.5, gap: 10 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  commentName: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  commentContent: { fontSize: 13 },
  commentInputRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 10, borderTopWidth: 0.5 },
  commentInput: { flex: 1, borderWidth: 1, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13 },
  queueItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, gap: 10 },
  queueIdx: { fontSize: 12, width: 20, textAlign: "center" },
  queueArt: { width: 32, height: 32, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  queueTitle: { fontSize: 13, fontWeight: "500" },
  queueArtist: { fontSize: 11 },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, justifyContent: "flex-end" },
  modalBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: { borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  modalRowText: { fontSize: 15, flex: 1 },
  modalEmpty: { textAlign: "center", paddingVertical: 16, fontSize: 14 },
});
