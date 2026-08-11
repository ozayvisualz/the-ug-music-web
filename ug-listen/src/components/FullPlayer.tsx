import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions } from "react-native";
import { Music2, Play, Pause, SkipBack, SkipForward, X, Heart, Download, ListPlus, Share2, Shuffle, Repeat, ChevronDown } from "lucide-react-native";
import { COLORS, RADIUS, HIT_SLOP } from "../constants/theme";
import { usePlayer } from "./PlayerContext";
import { useQueueStore } from "../store/playerStore";
import { useTheme } from "../theme/ThemeContext";

const SW = Dimensions.get("window").width;

type Props = { onCollapse?: () => void };

export default function FullPlayer({ onCollapse }: Props) {
  const { currentTrack, isPlaying, position, duration, togglePlay, seek, skipNext, skipPrev, stopPlayback } = usePlayer();
  const queue = useQueueStore((s) => s.queue);
  const currentIndex = useQueueStore((s) => s.currentIndex);
  const { colors, isDark } = useTheme();

  const [tab, setTab] = useState<"lyrics" | "queue" | "comments">("lyrics");
  const [liked, setLiked] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0);

  if (!currentTrack) return null;

  const progress = duration > 0 ? position / duration : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const upcoming = queue.slice(currentIndex + 1);

  return (
    <View style={styles.overlay}>
      <View style={[styles.backdrop, { backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.5)" }]} />
      <View style={[styles.card, { backgroundColor: colors.bg }]}>
        <TouchableOpacity onPress={onCollapse} style={styles.dragBar}>
          <View style={[styles.dragPill, { backgroundColor: colors.textDisabled }]} />
        </TouchableOpacity>

        <View style={styles.header}>
          <TouchableOpacity onPress={onCollapse} hitSlop={HIT_SLOP}><ChevronDown size={24} color={colors.text} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{currentTrack.title}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={[styles.artwork, { backgroundColor: colors.gold }]}>
          <Music2 size={80} color={colors.bg} />
        </View>

        <View style={styles.infoArea}>
          <Text style={[styles.trackTitle, { color: colors.white }]} numberOfLines={1}>{currentTrack.title}</Text>
          <TouchableOpacity onPress={() => setLiked(!liked)}>
            <Heart size={20} color={liked ? colors.red : colors.textMuted} fill={liked ? colors.red : "none"} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.trackArtist, { color: colors.text }]}>{currentTrack.artist}</Text>

        {/* Seek Bar */}
        <View style={styles.seekArea}>
          <View style={[styles.seekBg, { backgroundColor: colors.border }]}>
            <View style={[styles.seekFill, { width: `${progress * 100}%`, backgroundColor: colors.gold }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(position)}</Text>
            <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => setShuffleMode(!shuffleMode)} hitSlop={HIT_SLOP}>
            <Shuffle size={20} color={shuffleMode ? colors.gold : colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={skipPrev} hitSlop={HIT_SLOP}><SkipBack size={24} color={colors.text} /></TouchableOpacity>
          <TouchableOpacity onPress={togglePlay} style={[styles.playBtn, { backgroundColor: colors.gold }]} hitSlop={HIT_SLOP}>
            {isPlaying ? <Pause size={28} color={colors.bg} /> : <Play size={28} color={colors.bg} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={skipNext} hitSlop={HIT_SLOP}><SkipForward size={24} color={colors.text} /></TouchableOpacity>
          <TouchableOpacity onPress={() => setRepeatMode((repeatMode + 1) % 3)} hitSlop={HIT_SLOP}>
            <Repeat size={20} color={repeatMode > 0 ? colors.gold : colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {[
            { icon: <Heart size={18} color={liked ? colors.red : colors.textMuted} />, label: "Like" },
            { icon: <Download size={18} color={colors.textMuted} />, label: "Download" },
            { icon: <ListPlus size={18} color={colors.textMuted} />, label: "Playlist" },
            { icon: <Share2 size={18} color={colors.textMuted} />, label: "Share" },
          ].map((a, i) => (
            <View key={i} style={styles.actionItem}>
              {a.icon}
              <Text style={[styles.actionLabel, { color: colors.textMuted }]}>{a.label}</Text>
            </View>
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
          {tab === "lyrics" && <Text style={[styles.placeholder, { color: colors.textMuted }]}>Lyrics not available</Text>}
          {tab === "comments" && <Text style={[styles.placeholder, { color: colors.textMuted }]}>Comments coming soon</Text>}
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
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.queueTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.queueArtist, { color: colors.textMuted }]} numberOfLines={1}>{item.artist}</Text>
                  </View>
                </View>
              )}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const ART_SIZE = Math.min(SW * 0.55, 260);
const isSmall = SW < 360;
const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  card: { flex: 1, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, paddingHorizontal: Math.min(SW * 0.04, 20), paddingBottom: 60 },
  dragBar: { alignItems: "center", paddingVertical: 12 },
  dragPill: { width: 32, height: 4, borderRadius: 2 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: isSmall ? 8 : 16 },
  headerTitle: { fontSize: isSmall ? 14 : 16, fontWeight: "600", flex: 1, textAlign: "center", minWidth: 0, flexShrink: 1 },
  artwork: { width: ART_SIZE, height: ART_SIZE, borderRadius: RADIUS.xl, alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: isSmall ? 10 : 20 },
  infoArea: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 4, minWidth: 0 },
  trackTitle: { fontSize: isSmall ? 16 : 20, fontWeight: "700", flexShrink: 1 },
  trackArtist: { fontSize: isSmall ? 13 : 15, textAlign: "center", marginBottom: isSmall ? 8 : 16 },
  seekArea: { marginBottom: isSmall ? 10 : 20 },
  seekBg: { height: 4, borderRadius: 2, marginBottom: 4 },
  seekFill: { height: 4, borderRadius: 2 },
  timeRow: { flexDirection: "row", justifyContent: "space-between" },
  time: { fontSize: 11 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, marginBottom: isSmall ? 10 : 20 },
  playBtn: { width: isSmall ? 48 : 56, height: isSmall ? 48 : 56, borderRadius: isSmall ? 24 : 28, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", justifyContent: "space-around", marginBottom: isSmall ? 10 : 20 },
  actionItem: { alignItems: "center", gap: 2 },
  actionLabel: { fontSize: 10 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: isSmall ? 8 : 14, justifyContent: "center" },
  tabPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full },
  tabText: { fontSize: 13, fontWeight: "600" },
  tabContent: { flex: 1, minWidth: 0 },
  placeholder: { textAlign: "center", marginTop: 20, fontSize: 14 },
  queueItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, gap: 10 },
  queueIdx: { fontSize: 12, width: 20, textAlign: "center" },
  queueArt: { width: 32, height: 32, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  queueTitle: { fontSize: 13, fontWeight: "500", flexShrink: 1 },
  queueArtist: { fontSize: 11, flexShrink: 1 },
});
